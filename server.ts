import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';
import { Cell } from '@ton/core';

dotenv.config();

let dbInstance: any = null;
let authInstance: any = null;

function getFirebase() {
  if (getApps().length === 0) {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey) {
        try {
          const serviceAccount = JSON.parse(serviceAccountKey);
          initializeApp({
            credential: cert(serviceAccount)
          });
          console.log('Firebase Admin initialized with service account key');
        } catch (parseError) {
          console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is a valid JSON string.');
          initializeApp();
          console.log('Firebase Admin initialized with default credentials due to parse error');
        }
      } else {
        initializeApp();
        console.log('Firebase Admin initialized with default credentials');
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  }
  
  const app = getApp();
  if (!dbInstance) dbInstance = getFirestore(app);
  if (!authInstance) authInstance = getAuth(app);
  
  return { db: dbInstance, auth: authInstance };
}

// Initialize on startup
try {
  getFirebase();
} catch (e) {
  console.error('Initial Firebase connection failed:', e);
}

const app = express();
const PORT = 3000;

let cachedTonPrice = 1.253;
let lastTonPriceFetch = 0;

app.get('/tonconnect-manifest.json', (req, res) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  res.json({
    url: origin,
    name: "VitasMMA",
    iconUrl: `${origin}/vite.svg`
  });
});

app.get('/api/ton-price', async (req, res) => {
  const now = Date.now();
  if (now - lastTonPriceFetch > 60000) { // 1 minute cache
    try {
      const response = await fetch('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=TON', {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '25616edfb79f47f6bd69bef526fe2dc1'
        }
      });
      const data = await response.json();
      if (data?.data?.TON?.[0]?.quote?.USD?.price) {
        cachedTonPrice = data.data.TON[0].quote.USD.price;
        lastTonPriceFetch = now;
      }
    } catch (error) {
      console.error('Error fetching TON price:', error);
    }
  }
  res.json({ price: cachedTonPrice });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(cors());

// Body parser middleware - MUST be before routes
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    next();
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    next();
  } else {
    express.urlencoded({ limit: '50mb', extended: true })(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.url.includes('main.tsx') || req.url.includes('App.tsx')) {
    console.log(`VitasMMA: Request for ${req.url} received`);
  }
  next();
});

// Auth middleware to verify Firebase ID token
async function verifyAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const { auth } = getFirebase();
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    
    // Check if the userId in the body matches the authenticated user's UID
    // This prevents users from performing actions on behalf of others
    if (req.body.userId && req.body.userId !== decodedToken.uid) {
      return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
    }
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'Missing initData' });

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is missing in environment variables');
      return res.status(500).json({ error: 'Server configuration error: Missing bot token' });
    }

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      console.error('Telegram auth: Hash mismatch', { calculatedHash, receivedHash: hash });
      return res.status(401).json({ error: 'Invalid hash' });
    }

    const userStr = urlParams.get('user');
    if (!userStr) return res.status(400).json({ error: 'Missing user data' });
    const user = JSON.parse(userStr);
    
    // Create a Firebase custom token for this Telegram user
    const uid = `telegram:${user.id}`;
    
    // Ensure Firebase Admin is initialized
    const { auth } = getFirebase();
    
    const customToken = await auth.createCustomToken(uid);
    
    res.json({ token: customToken, user });
  } catch (err: any) {
    console.error('Telegram auth error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/ton', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Missing address' });

    // Create a Firebase custom token for this TON wallet
    const uid = `ton:${address}`;
    
    // Ensure Firebase Admin is initialized
    const { auth } = getFirebase();
    
    const customToken = await auth.createCustomToken(uid);
    
    res.json({ token: customToken });
  } catch (err: any) {
    console.error('TON auth error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Initialize Telegram Bot
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

if (!telegramToken) {
  console.warn("TELEGRAM_BOT_TOKEN is not set. Telegram bot will not be initialized.");
} else {
  console.log(`TELEGRAM_BOT_TOKEN found. Prefix: ${telegramToken.substring(0, 5)}...`);
}

const globalForTelegram = globalThis as unknown as {
  telegramBot: TelegramBot | undefined;
};

let bot = globalForTelegram.telegramBot;

if (telegramToken && !bot) {
  try {
    bot = new TelegramBot(telegramToken, { polling: true });
    globalForTelegram.telegramBot = bot;
    
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const domain = process.env.APP_URL || process.env.SHARED_APP_URL || `https://vitasmma-786820590176.us-west1.run.app`;
      const webAppUrl = `${domain}?v=${Date.now()}`;
      
      console.log(`Bot: Sending welcome message to ${chatId} with URL: ${webAppUrl}`);
      
      bot?.sendMessage(chatId, "Welcome to VitasMMA! 🥊 Your elite AI MMA fight coach.\n\nAnalyze your technique, get live coaching, and build your fight strategy - all powered by advanced AI.\n\nTap the button below to start your training journey!", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Open VitasMMA", web_app: { url: webAppUrl } }]
          ]
        }
      });
    });
    
    bot.on("polling_error", (err: any) => {
      const isConflictError = 
        err?.message?.includes("409 Conflict") || 
        err?.response?.statusCode === 409 || 
        err?.error_code === 409 ||
        (err?.code === "ETELEGRAM" && err?.message?.includes("409"));
        
      if (isConflictError) {
        // Ignore 409 errors, they happen during hot reloads when the old polling connection hasn't fully dropped yet.
        // The bot will automatically retry and connect successfully once the old connection times out.
        return;
      }
      console.error("Telegram polling error:", err);
    });
    
    console.log("Telegram bot initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Telegram bot:", error);
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  if (bot) {
    try {
      await bot.stopPolling();
    } catch (e) {
      // ignore
    }
  }
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

// Stripe Webhook
app.post('/api/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('STRIPE_WEBHOOK_SECRET is NOT set in production. This is a critical security risk.');
      return response.status(500).send('Server Error: Webhook configuration missing');
    }
    console.warn('STRIPE_WEBHOOK_SECRET is not set. Webhooks will not be verified in development.');
    return response.status(400).send('Webhook Error: Missing secret');
  }

  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(request.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer as string;
      
      if (userId) {
        try {
          console.log(`Payment successful for user ${userId}. Customer: ${stripeCustomerId}`);
          
          const { db } = getFirebase();
          
          // Idempotency check
          const eventRef = db.collection('processedStripeEvents').doc(event.id);
          const eventDoc = await eventRef.get();
          if (eventDoc.exists) {
            console.log(`Event ${event.id} already processed.`);
            break;
          }

          const userRef = db.collection('users').doc(userId);
          
          console.log(`Upgrading user ${userId} to PRO and saving customer ID ${stripeCustomerId}`);
          await userRef.set({
            isPro: true,
            stripeCustomerId: stripeCustomerId,
            aiCredits: FieldValue.increment(2000) // 2,000 V-Coin sign-up bonus
          }, { merge: true });

          await eventRef.set({ processedAt: FieldValue.serverTimestamp() });
        } catch (error) {
          console.error('Error processing successful payment:', error);
        }
      }
      break;
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      // We need to find the user by their Stripe customer ID
      try {
        const { db } = getFirebase();
        const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', subscription.customer).get();
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await userDoc.ref.update({ isPro: false });
          console.log(`Subscription deleted for user ${userDoc.id}`);
        }
      } catch (error) {
        console.error('Error handling subscription deletion:', error);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  response.send();
});

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

app.post("/api/create-checkout-session", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const stripe = getStripe();
    
    // The APP_URL is provided by the environment, fallback to production URL
    const domain = process.env.APP_URL || `https://vitasmma-786820590176.us-west1.run.app`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'VitasMMA Pro Access',
              description: 'Unlock unlimited AI Video Analysis, Live Voice Coaching, and Custom Fight Camps.',
            },
            unit_amount: 1499, // $14.99
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${domain}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/?canceled=true`,
      client_reference_id: userId,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/verify-ton-payment", verifyAuth, async (req, res) => {
  try {
    const { userId, type, amount, bonusCredits, credits, boc } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!boc) {
      return res.status(400).json({ error: 'Transaction BOC is required for verification' });
    }

    const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY;
    const DESTINATION_ADDRESS = process.env.VITE_TON_DESTINATION_ADDRESS || 'UQC2rrXgl2W5GhkSJ7lpoUAUXsBsDLNI4CXXUDqEdtCZ176T';

    if (!TONCENTER_API_KEY || !DESTINATION_ADDRESS) {
      console.error('TON configuration missing');
      return res.status(500).json({ error: 'Server TON configuration error' });
    }

    console.log(`Verifying TON payment for user ${userId}. Type: ${type}, Amount: ${amount} TON`);
    
    // Call TonCenter to find the transaction
    const response = await fetch(`https://toncenter.com/api/v2/getTransactions?address=${DESTINATION_ADDRESS}&limit=20&api_key=${TONCENTER_API_KEY}`);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(`TonCenter API error: ${JSON.stringify(data)}`);
    }

    const transactions = data.result;
    
    // Find a transaction that matches the BOC
    const foundTx = transactions.find((tx: any) => {
      return tx.in_msg?.msg_data?.body === boc;
    });

    if (!foundTx) {
      console.log(`Transaction with BOC ${boc.substring(0, 20)}... not found yet.`);
      return res.status(400).json({ error: 'Transaction not found on blockchain. It may take a few seconds to appear. Please try again in 10-20 seconds.' });
    }

    const txHash = foundTx.transaction_id.hash;
    const { db } = getFirebase();

    // Idempotency check for TON
    const txRef = db.collection('processedTonTransactions').doc(txHash);
    const txDoc = await txRef.get();
    if (txDoc.exists) {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    // Verify amount (allow 5% margin for price fluctuations if amount was calculated on client)
    const expectedValueNano = BigInt(Math.round((amount || 0) * 1e9));
    const actualValueNano = BigInt(foundTx.in_msg.value);
    
    if (amount && actualValueNano < (expectedValueNano * BigInt(95) / BigInt(100))) {
      return res.status(400).json({ error: 'Transaction amount mismatch' });
    }

    const userRef = db.collection('users').doc(userId);
    
    if (type === 'coins' || type === 'ai_credits') {
      await userRef.set({
        aiCredits: FieldValue.increment(credits || amount || 0)
      }, { merge: true });
    } else if (type === 'pro_upgrade') {
      await userRef.set({
        isPro: true,
        aiCredits: FieldValue.increment(2000)
      }, { merge: true });
    }

    await txRef.set({ 
      userId, 
      processedAt: FieldValue.serverTimestamp(),
      amount: foundTx.in_msg.value,
      boc: boc
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error verifying TON payment:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add-credits", verifyAuth, async (req, res) => {
  try {
    const { userId, amount, source } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ error: 'User ID and amount are required' });
    }

    const { db } = getFirebase();
    const userRef = db.collection('users').doc(userId);

    if (source === 'daily_regen') {
      // Validate amount for daily regen
      if (amount !== 2) {
        return res.status(400).json({ error: 'Invalid regen amount' });
      }

      const today = new Date().toISOString().split('T')[0];
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      
      if (userData?.lastCoinRegenDate === today) {
        return res.status(400).json({ error: 'Daily credits already claimed' });
      }

      await userRef.set({
        aiCredits: FieldValue.increment(amount),
        lastCoinRegenDate: today
      }, { merge: true });
    } else {
      // Securely handle other sources or reject unknown ones
      return res.status(403).json({ error: 'Unauthorized credit source' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error adding credits:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/complete-quest", verifyAuth, async (req, res) => {
  try {
    const { userId, questId } = req.body;
    if (!userId || !questId) {
      return res.status(400).json({ error: 'User ID and Quest ID are required' });
    }

    const { db } = getFirebase();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const quests = userData?.dailyQuests || [];
    const questIndex = quests.findIndex((q: any) => q.id === questId);

    if (questIndex === -1) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    if (quests[questIndex].completed) {
      return res.status(400).json({ error: 'Quest already completed' });
    }

    // Update quest progress and check for completion
    const quest = quests[questIndex];
    const newProgress = (quest.progress || 0) + 1;
    const isNowCompleted = newProgress >= (quest.target || 1);

    quests[questIndex] = { ...quest, progress: newProgress, completed: isNowCompleted };

    const updates: any = { dailyQuests: quests };

    if (isNowCompleted) {
      // Add rewards
      updates.coins = FieldValue.increment(quest.reward || 0);
      updates.xp = FieldValue.increment(250); // XP_REWARDS.DAILY_CHECK_IN
      
      // Check for level up
      const currentXp = (userData?.xp || 0) + 250;
      const currentLevel = userData?.level || 1;
      if (currentXp >= currentLevel * 1000) { // LEVEL_XP_THRESHOLD
        updates.level = FieldValue.increment(1);
      }
    }

    await userRef.update(updates);
    res.json({ success: true, isCompleted: isNowCompleted });
  } catch (error: any) {
    console.error('Error completing quest:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/unlock-module", verifyAuth, async (req, res) => {
  try {
    const { userId, moduleId, cost } = req.body;
    if (!userId || !moduleId) {
      return res.status(400).json({ error: 'User ID and Module ID are required' });
    }

    const { db } = getFirebase();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const unlocked = userData?.unlockedModules || ['fundamentals'];

    if (unlocked.includes(moduleId)) {
      return res.status(400).json({ error: 'Module already unlocked' });
    }

    const isPro = userData?.isPro || false;
    const currentCoins = userData?.coins || 0;

    if (!isPro && currentCoins < cost) {
      return res.status(403).json({ error: 'Insufficient coins' });
    }

    const updates: any = {
      unlockedModules: FieldValue.arrayUnion(moduleId)
    };

    if (!isPro) {
      updates.coins = FieldValue.increment(-cost);
    }

    await userRef.update(updates);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error unlocking module:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add-xp", verifyAuth, async (req, res) => {
  try {
    const { userId, xpAmount, reason } = req.body;
    if (!userId || !xpAmount || xpAmount <= 0) {
      return res.status(400).json({ error: 'Valid userId and positive xpAmount are required' });
    }

    const { db } = getFirebase();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const currentXp = (userData?.xp || 0) + xpAmount;
    const currentLevel = userData?.level || 1;
    
    const updates: any = {
      xp: FieldValue.increment(xpAmount)
    };

    // Check for level up
    if (currentXp >= currentLevel * 1000) { // LEVEL_XP_THRESHOLD
      updates.level = FieldValue.increment(1);
    }

    await userRef.update(updates);
    res.json({ success: true, newXp: currentXp });
  } catch (error: any) {
    console.error('Error adding XP:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add-coins", verifyAuth, async (req, res) => {
  try {
    const { userId, coinAmount, reason } = req.body;
    if (!userId || !coinAmount || coinAmount <= 0) {
      return res.status(400).json({ error: 'Valid userId and positive coinAmount are required' });
    }

    const { db } = getFirebase();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRef.update({
      coins: FieldValue.increment(coinAmount)
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error adding coins:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/complete-session", verifyAuth, async (req, res) => {
  try {
    const { userId, xpAmount, coinAmount, sessionType } = req.body;
    if (!userId || !xpAmount || xpAmount <= 0 || !coinAmount || coinAmount <= 0) {
      return res.status(400).json({ error: 'Valid userId and positive xp/coin amounts are required' });
    }

    const { db } = getFirebase();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const currentXp = (userData?.xp || 0) + xpAmount;
    const currentLevel = userData?.level || 1;
    
    const updates: any = {
      xp: FieldValue.increment(xpAmount),
      coins: FieldValue.increment(coinAmount)
    };

    // Check for level up
    if (currentXp >= currentLevel * 1000) { // LEVEL_XP_THRESHOLD
      updates.level = FieldValue.increment(1);
    }

    await userRef.update(updates);
    res.json({ success: true, newXp: currentXp, newLevel: currentLevel + (updates.level ? 1 : 0) });
  } catch (error: any) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/use-credits", verifyAuth, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid userId and positive amount are required' });
    }

    const { db } = getFirebase();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const currentCredits = userData?.aiCredits || 0;
    if (currentCredits < amount) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    await userRef.update({
      aiCredits: FieldValue.increment(-amount)
    });

    res.json({ success: true, remainingCredits: currentCredits - amount });
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  try {
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      console.log('VitasMMA: Starting Vite in middleware mode...');
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false,
        },
        appType: "spa",
      });
      
      app.use(vite.middlewares);
      console.log('VitasMMA: Vite middleware attached.');
    } else {
      console.log('VitasMMA: Running in production mode, serving dist...');
      app.use(express.static('dist'));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve('dist/index.html'));
      });
    }

    // ... rest of the app setup ...

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`VitasMMA: Server successfully running on http://0.0.0.0:${PORT}`);
      console.log(`VitasMMA: Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`VitasMMA: FATAL - Port ${PORT} is already in use.`);
        console.error('This usually happens if a previous process didn\'t exit cleanly.');
        console.error('Attempting to exit and let the orchestrator restart...');
        process.exit(1);
      } else {
        console.error('VitasMMA: Server error:', err);
      }
    });
  } catch (err) {
    console.error('VitasMMA: Failed to start server:', err);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error('VitasMMA: Unhandled error in startServer:', err);
});
