import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Telegram Bot
const telegramToken = process.env.TELEGRAM_BOT_TOKEN || "8143890371:AAFRofKTjW58zHmKLdCaf_F1vqNc4JVPrII";

const globalForTelegram = globalThis as unknown as {
  telegramBot: TelegramBot | undefined;
};

let bot = globalForTelegram.telegramBot;

if (!bot) {
  try {
    bot = new TelegramBot(telegramToken, { polling: true });
    globalForTelegram.telegramBot = bot;
    
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const domain = process.env.APP_URL || `https://ais-dev-47b5ihpnk4lxl476zi5uny-56994982069.asia-southeast1.run.app`;
      
      bot?.sendMessage(chatId, "Welcome to VitasMMA! Your elite AI MMA fight coach. Tap the button below to start your training.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Open VitasMMA", web_app: { url: domain } }]
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

// API routes go here
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { userId } = req.body;
    const stripe = getStripe();
    
    // The APP_URL is provided by the environment, fallback to localhost for local dev
    const domain = process.env.APP_URL || `http://localhost:${PORT}`;

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
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
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

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
