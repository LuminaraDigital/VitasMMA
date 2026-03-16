import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Loader2, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login({ onLoginSuccess, onDemoLogin }: { onLoginSuccess: () => void, onDemoLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('OAuth error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative bg-[#0B0F19] text-white overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#FF2A2A]/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-[#00E5FF]/20 rounded-full blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 flex flex-col items-center text-center max-w-sm w-full"
      >
        <div className="w-24 h-24 bg-[#1A2235] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,42,42,0.2)]">
          <Shield className="w-12 h-12 text-[#FF2A2A]" />
        </div>
        
        <h1 className="text-4xl font-black uppercase tracking-widest italic mb-2">
          Vitas<span className="text-[#00E5FF]">MMA</span>
        </h1>
        <p className="text-gray-400 mb-12">Elite AI Fight Coach</p>

        <button
          onClick={handleLogin}
          disabled={isLoading || !import.meta.env.VITE_SUPABASE_URL}
          className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Mail className="w-6 h-6" /> Continue with Gmail
            </>
          )}
        </button>

        <div className="w-full flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-800"></div>
          <span className="text-gray-500 text-sm uppercase tracking-wider">OR</span>
          <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        <button
          onClick={onDemoLogin}
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-[#1A2235] border border-[#FF2A2A]/30 text-white font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-[#1A2235]/80 transition-all active:scale-95"
        >
          <Zap className="w-6 h-6 text-[#FF2A2A]" /> Try Demo Mode
        </button>
        
        <p className="text-xs text-gray-500 mt-6">
          Sign in to save your fighter DNA and analysis history. Demo mode data will be lost on refresh.
        </p>
      </motion.div>
    </div>
  );
}
