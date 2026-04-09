import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Crown, Check, X, AlertCircle, Loader2, Brain } from 'lucide-react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { getUsdtTransaction, DESTINATION_ADDRESS } from '../utils/ton';
import { fetchWithAuth } from '../utils/api';
import { UserProfile } from '../types';
import BuyCoinsModal from './BuyCoinsModal';
import { SUBSCRIPTION_PRICES } from '../constants';

export default function ProUpgrade({ profile, onBack, onUpgrade, onTonUpgradeSuccess, checkoutError, onUpdateProfile }: { profile?: UserProfile, onBack: () => void, onUpgrade: () => void, onTonUpgradeSuccess: (boc: string) => void, checkoutError?: string | null, onUpdateProfile?: (p: UserProfile) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTonLoading, setIsTonLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'TON' | 'USDT'>('TON');
  const [tonPrice, setTonPrice] = useState<number>(1.253);
  const [showBuyCoins, setShowBuyCoins] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress();

  useEffect(() => {
    const fetchTonPrice = async () => {
      try {
        const response = await fetch('/api/ton-price');
        const data = await response.json();
        if (data.price) {
          setTonPrice(data.price);
        }
      } catch (error) {
        console.error('Failed to fetch TON price:', error);
      }
    };
    fetchTonPrice();
  }, []);

  const handleUpgrade = async () => {
    setIsLoading(true);
    await onUpgrade();
    setIsLoading(false);
  };

  const handleTonPayment = async () => {
    if (!userFriendlyAddress) {
      tonConnectUI.openModal();
      return;
    }

    setIsTonLoading(true);
    try {
      let transaction;
      const usdtAmount = SUBSCRIPTION_PRICES.PRO_MONTHLY;
      const tonAmount = (usdtAmount / tonPrice).toFixed(2);
      const tonNanoAmount = Math.floor(parseFloat(tonAmount) * 1e9).toString();

      if (paymentMethod === 'USDT') {
        transaction = await getUsdtTransaction(userFriendlyAddress, usdtAmount);
      } else {
        transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [
            {
              address: DESTINATION_ADDRESS, // User's TON Wallet Address
              amount: tonNanoAmount,
            }
          ]
        };
      }

      const result = await tonConnectUI.sendTransaction(transaction);
      onTonUpgradeSuccess(result.boc);
    } catch (e) {
      console.error("TON Payment failed", e);
    } finally {
      setIsTonLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 relative bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-50 opacity-20 mix-blend-overlay"></div>
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-[#FF2A2A]/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-[#00E5FF]/20 rounded-full blur-[120px]"></div>
      </div>

      <button onClick={onBack} className="absolute top-6 left-6 z-20 text-gray-400 hover:text-white transition-colors">
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center z-10 mt-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ type: "spring", duration: 1.5 }}
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FF2A2A] to-[#00E5FF] p-1 shadow-[0_0_50px_rgba(0,229,255,0.3)] mb-6"
        >
          <div className="w-full h-full bg-[#0B0F19] rounded-xl flex items-center justify-center">
            <Crown className="w-12 h-12 text-[#00E5FF]" />
          </div>
        </motion.div>

        <h1 className="text-4xl font-black uppercase tracking-widest italic text-center mb-2">
          Vitas<span className="text-[#00E5FF]">PRO</span>
        </h1>
        <p className="text-gray-400 text-center mb-8 text-sm">Unlock the ultimate AI fight coaching experience.</p>

        <div className="w-full space-y-3 mb-8">
          <Feature text="1,000 V-Coins Monthly Allowance" />
          <Feature text="Advanced Fight IQ Breakdown (5 V-Coins)" />
          <Feature text="Pro Fighter Voice Packs (Khabib, GSP)" />
          <Feature text="Personalized Nutrition & Cut Plans" />
          <Feature text="Exclusive 'Champion' Profile Badge" />
          <Feature text="2,000 V-Coins Sign-up Bonus" />
        </div>

        {checkoutError && (
          <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200 leading-relaxed text-left">
              {checkoutError.includes('STRIPE_SECRET_KEY') 
                ? 'Stripe is not configured. Please add your STRIPE_SECRET_KEY to the environment variables to enable payments.'
                : checkoutError}
            </p>
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <div className="w-full bg-[#1A2235]/50 rounded-xl p-4 border border-white/5 mb-2">
            <div className="flex justify-center gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="proUpgradePaymentMethod" 
                  value="TON" 
                  checked={paymentMethod === 'TON'} 
                  onChange={() => setPaymentMethod('TON')}
                  className="accent-[#0098EA]"
                />
                <span className={`text-sm font-bold ${paymentMethod === 'TON' ? 'text-[#0098EA]' : 'text-gray-400'}`}>TON</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="proUpgradePaymentMethod" 
                  value="USDT" 
                  checked={paymentMethod === 'USDT'} 
                  onChange={() => setPaymentMethod('USDT')}
                  className="accent-[#26A17B]"
                />
                <span className={`text-sm font-bold ${paymentMethod === 'USDT' ? 'text-[#26A17B]' : 'text-gray-400'}`}>USDT</span>
              </label>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTonPayment}
              disabled={isTonLoading}
              className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest relative overflow-hidden group disabled:opacity-50 ${paymentMethod === 'USDT' ? 'bg-[#26A17B] shadow-[0_0_30px_rgba(38,161,123,0.4)]' : 'bg-[#0098EA] shadow-[0_0_30px_rgba(0,152,234,0.4)]'}`}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
              {isTonLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (userFriendlyAddress ? `Pay ${paymentMethod === 'USDT' ? `${SUBSCRIPTION_PRICES.PRO_MONTHLY} USDT` : `${(SUBSCRIPTION_PRICES.PRO_MONTHLY / tonPrice).toFixed(2)} TON`}` : 'Connect Wallet to Pay')}
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#00E5FF] font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(255,42,42,0.4)] relative overflow-hidden group disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : `Pay with Card - $${SUBSCRIPTION_PRICES.PRO_MONTHLY}/mo`}
          </motion.button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-white/40 text-xs font-bold uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowBuyCoins(true)}
            className="w-full py-4 rounded-xl bg-[#1A2235] border border-brand-violet/30 text-brand-violet font-black text-lg uppercase tracking-widest relative overflow-hidden group flex items-center justify-center gap-2"
          >
            <Brain className="w-5 h-5" />
            Buy V-Coins (AI Credits)
          </motion.button>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">Cancel anytime. Billed monthly.</p>
      </div>
      
      {showBuyCoins && profile && (
        <BuyCoinsModal 
          onClose={() => setShowBuyCoins(false)} 
          userId={profile.id} 
          isPro={profile.isPro} 
          profile={profile}
          onUpdateProfile={onUpdateProfile}
        />
      )}
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex items-center gap-3 bg-[#1A2235]/50 p-4 rounded-xl border border-white/5"
    >
      <div className="w-6 h-6 rounded-full bg-[#00E5FF]/20 flex items-center justify-center shrink-0">
        <Check className="w-4 h-4 text-[#00E5FF]" />
      </div>
      <span className="font-medium text-sm">{text}</span>
    </motion.div>
  );
}
