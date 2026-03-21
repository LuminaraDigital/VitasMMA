import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Video, Mic, Target, Zap, ShieldCheck } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    title: "Welcome to VitasMMA",
    desc: "Your elite AI fight coach. Let's walk through how this app will elevate your game.",
    icon: <ShieldCheck className="w-12 h-12 text-brand-teal" />,
    color: "from-brand-teal/20 to-transparent"
  },
  {
    title: "AI Video Analysis",
    desc: "Upload sparring or bag work footage. Our AI breaks down your technique, spots openings, and gives you pro-level feedback.",
    icon: <Video className="w-12 h-12 text-brand-violet" />,
    color: "from-brand-violet/20 to-transparent"
  },
  {
    title: "Live Voice Coach",
    desc: "Put your phone down and train. The AI coach calls out combos, reacts to your pace, and pushes you through the rounds.",
    icon: <Mic className="w-12 h-12 text-blue-500" />,
    color: "from-blue-500/20 to-transparent"
  },
  {
    title: "Fight Camp & Strategy",
    desc: "Get a personalized 8-week camp schedule. The Strategy Advisor builds game plans based on your opponent's style.",
    icon: <Target className="w-12 h-12 text-red-500" />,
    color: "from-red-500/20 to-transparent"
  }
];

export default function Tutorial({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = TUTORIAL_STEPS[step];

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b ${current.color} transition-colors duration-1000`} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center max-w-sm"
          >
            <div className="w-24 h-24 rounded-full glass flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              {current.icon}
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tight mb-4">{current.title}</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              {current.desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 relative z-10">
        <div className="flex justify-center gap-2 mb-8">
          {TUTORIAL_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-brand-teal' : 'w-2 bg-white/20'}`} 
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          {step === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
