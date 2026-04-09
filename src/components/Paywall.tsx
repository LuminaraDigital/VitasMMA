import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Lock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { getUsdtTransaction, DESTINATION_ADDRESS } from '../utils/ton';
import { SUBSCRIPTION_PRICES } from '../constants';

export default function Paywall({ onSignOut, onUpgrade, onTonUpgradeSuccess, checkoutError }: { onSignOut: () => void, onUpgrade: () => void, onTonUpgradeSuccess: (boc: string) => void, checkoutError?: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTonLoading, setIsTonLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'TON' | 'USDT'>('TON');
  const [tonPrice, setTonPrice] = useState<number>(1.253);
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
      // If wallet is not connected, open the modal
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
          validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
          messages: [
            {
              address: DESTINATION_ADDRESS, // User's TON Wallet Address
              amount: tonNanoAmount, // Dynamic TON amount based on USDT price
            }
          ]
        };
      }

      const result = await tonConnectUI.sendTransaction(transaction);
      // If successful, grant pro access
      onTonUpgradeSuccess(result.boc);
    } catch (e) {
      console.error("TON Payment failed", e);
    } finally {
      setIsTonLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white overflow-y-auto relative p-6 pb-24">
      <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-brand-violet/20 to-transparent pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full pt-12">
        <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-6 border border-brand-violet/30 shadow-[0_0_40px_rgba(139,92,246,0.3)]">
          <Zap className="w-10 h-10 text-brand-violet" />
        </div>
        
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-center mb-2">
          Unlock the <span className="text-brand-violet">AI Coach</span>
        </h1>
        <p className="text-gray-400 text-center mb-8">
          To get personalized video analysis, live voice coaching, and custom fight camps, upgrade to Pro.
        </p>

        <div className="w-full glass rounded-3xl p-6 border border-brand-violet/20 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-brand-violet text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
            Pro Access
          </div>
          
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-black tracking-tighter">$14.99</span>
            <span className="text-gray-400 text-sm font-medium">/month</span>
          </div>

          <ul className="space-y-4">
            {[
              '2,000 V-Coin Sign-up Bonus',
              '1,000 V-Coins Monthly Allowance',
              'Live Voice Coach Sessions (5 V-Coins)',
              'Custom 8-Week Fight Camps (20 V-Coins)',
              'Opponent Strategy Advisor (5 V-Coins)',
              'Advanced Strength & Conditioning (10 V-Coins)'
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-200">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full space-y-4">
          {checkoutError && (
            <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 leading-relaxed">
                {checkoutError.includes('STRIPE_SECRET_KEY') 
                  ? 'Stripe is not configured. Please add your STRIPE_SECRET_KEY to the environment variables to enable payments.'
                  : checkoutError}
              </p>
            </div>
          )}
          
          <div className="w-full glass rounded-2xl p-4 border border-white/10">
            <div className="flex justify-center gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="paywallPaymentMethod" 
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
                  name="paywallPaymentMethod" 
                  value="USDT" 
                  checked={paymentMethod === 'USDT'} 
                  onChange={() => setPaymentMethod('USDT')}
                  className="accent-[#26A17B]"
                />
                <span className={`text-sm font-bold ${paymentMethod === 'USDT' ? 'text-[#26A17B]' : 'text-gray-400'}`}>USDT</span>
              </label>
            </div>
            <button
              onClick={handleTonPayment}
              disabled={isTonLoading}
              className={`w-full py-4 rounded-xl text-white font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 ${paymentMethod === 'USDT' ? 'bg-[#26A17B] shadow-[0_10px_20px_rgba(38,161,123,0.3)]' : 'bg-[#0098EA] shadow-[0_10px_20px_rgba(0,152,234,0.3)]'}`}
            >
              {isTonLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (userFriendlyAddress ? `Pay ${paymentMethod === 'USDT' ? `${SUBSCRIPTION_PRICES.PRO_MONTHLY} USDT` : `${(SUBSCRIPTION_PRICES.PRO_MONTHLY / tonPrice).toFixed(2)} TON`}` : 'Connect Wallet to Pay')}
            </button>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-brand-violet text-white font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Pay with Card'}
          </button>
          
          <button
            onClick={onSignOut}
            className="w-full py-4 rounded-2xl glass border border-white/10 text-gray-400 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:text-white transition-colors"
          >
            Sign out
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
