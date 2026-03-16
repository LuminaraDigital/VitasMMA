import { motion } from 'motion/react';
import { Crown, Check, X } from 'lucide-react';

export default function ProUpgrade({ onBack, onUpgrade }: { onBack: () => void, onUpgrade: () => void }) {
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
          <Feature text="Unlimited Gemini Vision Analysis" />
          <Feature text="Advanced Fight IQ Breakdown" />
          <Feature text="Pro Fighter Voice Packs (Khabib, GSP)" />
          <Feature text="Personalized Nutrition & Cut Plans" />
          <Feature text="Exclusive 'Champion' Profile Badge" />
          <Feature text="10,000 V-Coins Sign-up Bonus" />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onUpgrade}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#00E5FF] font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(255,42,42,0.4)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
          Upgrade Now - $14.99/mo
        </motion.button>
        <p className="text-xs text-gray-500 mt-4 text-center">Cancel anytime. Billed monthly.</p>
      </div>
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
