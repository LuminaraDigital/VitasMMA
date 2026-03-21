import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Loader2, Zap, XCircle, Send } from 'lucide-react';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import Logo from './Logo';

export default function Login({ onLoginSuccess, onDemoLogin }: { onLoginSuccess: (token: string) => void, onDemoLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      setIsTelegram(true);
    }
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in App.tsx will handle the rest
    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Sign in anonymously to create a Firebase user for this Telegram session
      const result = await signInAnonymously(auth);
      // We can store the Telegram user data in Firestore later in the onboarding or dashboard
      // onAuthStateChanged in App.tsx will handle the rest
    } catch (err: any) {
      console.error('Telegram login error:', err);
      setError(err.message || 'Failed to sign in with Telegram. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center p-4 md:p-6 relative bg-brand-bg text-white overflow-x-hidden overflow-y-auto">
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-brand-teal/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-violet/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Animated Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
          }} 
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="flex-1 min-h-0 shrink-0"></div>

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.9, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className="z-10 flex flex-col items-center text-center max-w-md w-full glass p-6 md:p-12 rounded-3xl md:rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border border-white/15 relative overflow-hidden group shrink-0 my-4"
      >
        {/* Card Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/10 via-transparent to-brand-violet/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        
        <motion.div 
          className="mb-8 md:mb-12 relative"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="absolute inset-0 bg-brand-teal/20 rounded-full blur-3xl animate-pulse"></div>
          <Logo className="w-24 h-24 md:w-40 md:h-40 relative z-10 drop-shadow-[0_0_20px_rgba(0,245,160,0.4)]" />
        </motion.div>
        
        <div className="space-y-3 mb-8 md:mb-14 relative z-10">
          <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
            Vitas<span className="text-brand-blue drop-shadow-[0_0_15px_rgba(0,217,245,0.5)]">MMA</span>
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 md:w-8 h-px bg-gradient-to-r from-transparent to-brand-teal/50"></div>
            <p className="text-brand-teal font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-90">Elite AI Fight Coach</p>
            <div className="w-6 md:w-8 h-px bg-gradient-to-l from-transparent to-brand-teal/50"></div>
          </div>
        </div>

        <div className="w-full space-y-4 md:space-y-5 relative z-10">
          {error && (
            <div className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs md:text-sm font-medium flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-full transition-colors ml-4 shrink-0">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {isTelegram ? (
            <motion.button
              onClick={handleTelegramLogin}
              disabled={isLoading}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 md:py-6 rounded-2xl md:rounded-[2rem] bg-[#2AABEE] text-white font-black text-sm md:text-xl uppercase tracking-widest flex items-center justify-center gap-3 md:gap-4 shadow-[0_15px_30px_rgba(42,171,238,0.2)] hover:shadow-[0_20px_40px_rgba(42,171,238,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 md:w-7 md:h-7 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 md:w-7 md:h-7 group-hover/btn:rotate-12 transition-transform" /> Continue with Telegram
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleLogin}
              disabled={isLoading}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 md:py-6 rounded-2xl md:rounded-[2rem] bg-white text-black font-black text-sm md:text-xl uppercase tracking-widest flex items-center justify-center gap-3 md:gap-4 shadow-[0_15px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_20px_40px_rgba(255,255,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 md:w-7 md:h-7 animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5 md:w-7 md:h-7 group-hover/btn:rotate-12 transition-transform" /> Continue with Gmail
                </>
              )}
            </motion.button>
          )}

          <div className="flex items-center gap-4 md:gap-6 py-2 md:py-4">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-white/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">OR</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <motion.button
            onClick={onDemoLogin}
            disabled={isLoading}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 md:py-6 rounded-2xl md:rounded-[2rem] bg-black/40 border border-white/15 text-white font-black text-sm md:text-xl uppercase tracking-widest flex items-center justify-center gap-3 md:gap-4 hover:bg-white/10 hover:border-brand-teal/30 transition-all group/demo shadow-xl"
          >
            <Zap className="w-5 h-5 md:w-7 md:h-7 text-brand-teal group-hover/demo:scale-125 transition-transform drop-shadow-[0_0_10px_rgba(0,245,160,0.5)]" /> Try Demo Mode
          </motion.button>
        </div>
        
        <p className="text-[10px] md:text-[11px] text-white/40 mt-8 md:mt-12 leading-relaxed max-w-[280px] relative z-10">
          Sign in to secure your <span className="text-brand-teal font-black italic">Fighter DNA</span> and unlock global rankings.
        </p>

        {/* Decorative elements inside card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-brand-teal/20 to-transparent"></div>
      </motion.div>

      <div className="flex-1 min-h-[100px] shrink-0"></div>

      {/* Bottom decorative bar */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: 128 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 h-1.5 bg-white/10 rounded-full overflow-hidden"
      >
        <motion.div 
          animate={{ x: [-128, 128] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-1/2 h-full bg-brand-teal/40 blur-sm"
        ></motion.div>
      </motion.div>
    </div>
  );
}
