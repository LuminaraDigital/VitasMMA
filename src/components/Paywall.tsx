import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Lock, Zap, ArrowRight, Loader2 } from 'lucide-react';

export default function Paywall({ onContinueDemo, onUpgrade, isDemo, checkoutError }: { onContinueDemo: () => void, onUpgrade: () => void, isDemo?: boolean, checkoutError?: string | null }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    await onUpgrade();
    setIsLoading(false);
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
              'Unlimited AI Video Analysis',
              'Live Voice Coach Sessions',
              'Custom 8-Week Fight Camps',
              'Opponent Strategy Advisor',
              'Advanced Strength & Conditioning'
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
          
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-brand-violet text-white font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Upgrade Now'}
          </button>
          
          <button
            onClick={onContinueDemo}
            className="w-full py-4 rounded-2xl glass border border-white/10 text-gray-400 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:text-white transition-colors"
          >
            {isDemo ? 'Continue to Demo' : 'Sign out & Try Demo'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
