import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Coins, Loader2, Brain, Zap } from 'lucide-react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { getUsdtTransaction, DESTINATION_ADDRESS } from '../utils/ton';

import { UserProfile } from '../types';
import { COIN_PACKAGES, AI_COSTS } from '../constants';
import { fetchWithAuth } from '../utils/api';

export default function BuyCoinsModal({ onClose, userId, isPro, profile, onUpdateProfile }: { onClose: () => void, userId: string, isPro?: boolean, profile?: UserProfile, onUpdateProfile?: (p: UserProfile) => void }) {
  const [paymentMethod, setPaymentMethod] = useState<'TON' | 'USDT'>('TON');
  const [isTonLoading, setIsTonLoading] = useState(false);
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

  const handleBuyCoins = async (credits: number, usdtAmount: number) => {
    if (!userFriendlyAddress) {
      tonConnectUI.openModal();
      return;
    }

    setIsTonLoading(true);
    try {
      let transaction;
      const finalUsdtAmount = isPro ? usdtAmount * 0.8 : usdtAmount;
      const finalTonAmount = (finalUsdtAmount / tonPrice).toFixed(2);
      const tonNanoAmount = Math.floor(parseFloat(finalTonAmount) * 1e9).toString();

      if (paymentMethod === 'USDT') {
        transaction = await getUsdtTransaction(userFriendlyAddress, finalUsdtAmount);
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
      
      // Call server to verify and update
      await fetchWithAuth('/api/verify-ton-payment', {
        method: 'POST',
        body: JSON.stringify({ 
          userId, 
          type: 'ai_credits', 
          credits, 
          boc: result.boc 
        })
      });
      
      onClose();
    } catch (e) {
      console.error("TON Payment failed", e);
    } finally {
      setIsTonLoading(false);
    }
  };

  const getTonAmount = (usdt: number) => {
    const finalUsdt = isPro ? usdt * 0.8 : usdt;
    return (finalUsdt / tonPrice).toFixed(2);
  };

  const getUsdtDisplay = (usdt: number) => {
    const finalUsdt = isPro ? usdt * 0.8 : usdt;
    return `${finalUsdt.toFixed(2)} USDT`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0B0F19] border border-white/10 rounded-3xl p-5 md:p-6 max-w-sm w-full relative overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className={`absolute top-[-50%] left-[-20%] w-64 h-64 rounded-full blur-[80px] transition-colors duration-500 bg-brand-violet/10`}></div>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-[60] p-1 bg-black/40 rounded-full">
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto hide-scrollbar relative z-10 pr-1">
          <div className="flex justify-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="paymentMethod" 
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
                name="paymentMethod" 
                value="USDT" 
                checked={paymentMethod === 'USDT'} 
                onChange={() => setPaymentMethod('USDT')}
                className="accent-[#26A17B]"
              />
              <span className={`text-sm font-bold ${paymentMethod === 'USDT' ? 'text-[#26A17B]' : 'text-gray-400'}`}>USDT</span>
            </label>
          </div>

          <>
            <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-brand-violet/20 rounded-full flex items-center justify-center mb-4 border border-brand-violet/30">
                  <Brain className="w-8 h-8 text-brand-violet" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-white">Buy V-Coins</h2>
                <p className="text-gray-400 text-xs mt-2">V-Coins are used as AI Credits for premium features.</p>
                {isPro && <p className="text-brand-violet text-xs font-bold mt-1">PRO Discount Applied: 20% OFF</p>}
              </div>

              <div className="space-y-3 pb-4">
                {COIN_PACKAGES.map((pkg) => (
                  <CoinPackage 
                    key={pkg.id}
                    credits={pkg.credits} 
                    title={pkg.title}
                    description={pkg.description}
                    tonDisplay={`${getTonAmount(pkg.price)} TON`}
                    usdtDisplay={getUsdtDisplay(pkg.price)}
                    paymentMethod={paymentMethod}
                    onBuy={() => handleBuyCoins(pkg.credits, pkg.price)}
                    isLoading={isTonLoading}
                    popular={pkg.popular}
                  />
                ))}
              </div>
          </>
        </div>
      </motion.div>
    </div>
  );
}

function CoinPackage({ credits, title, description, tonDisplay, usdtDisplay, paymentMethod, onBuy, isLoading, popular }: { credits: number, title: string, description: string, tonDisplay: string, usdtDisplay: string, paymentMethod: 'TON' | 'USDT', onBuy: () => void, isLoading: boolean, popular?: boolean }) {
  return (
    <button 
      onClick={onBuy}
      disabled={isLoading}
      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${popular ? 'bg-brand-violet/10 border-brand-violet/30 hover:bg-brand-violet/20' : 'bg-white/5 border-white/10 hover:bg-white/10'} disabled:opacity-50`}
    >
      <div className="flex items-center gap-3">
        <Brain className={`w-5 h-5 ${popular ? 'text-brand-violet' : 'text-brand-violet/70'}`} />
        <div className="text-left">
          <div className="font-bold text-white">{credits} V-Coins</div>
          <div className="text-[10px] text-gray-400">{description}</div>
        </div>
      </div>
      <div className={`font-mono font-bold px-3 py-1 rounded-lg ${paymentMethod === 'USDT' ? 'text-[#26A17B] bg-[#26A17B]/10' : 'text-[#0098EA] bg-[#0098EA]/10'}`}>
        {paymentMethod === 'USDT' ? usdtDisplay : tonDisplay}
      </div>
    </button>
  );
}


