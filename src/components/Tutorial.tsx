import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Brain, Video, Zap, Dumbbell, Target, CheckCircle2, Crown } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  feature: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to VitasMMA",
    description: "Your AI-powered combat sports laboratory. We've combined elite coaching logic with advanced computer vision to accelerate your progress.",
    icon: <Target className="w-12 h-12" />,
    color: "brand-teal",
    feature: "The Lab"
  },
  {
    title: "AI Video Analysis",
    description: "Upload your sparring or drill footage. Our AI identifies technical flaws, tracks your volume, and provides actionable feedback to sharpen your game.",
    icon: <Video className="w-12 h-12" />,
    color: "brand-violet",
    feature: "Computer Vision"
  },
  {
    title: "V-Coins & Credits",
    description: "V-Coins power our AI features. You start with 100 free credits. Use them for video analysis, strategy advice, and live coaching sessions.",
    icon: <Brain className="w-12 h-12" />,
    color: "brand-violet",
    feature: "AI Economy"
  },
  {
    title: "Strength Layer",
    description: "Track your S&C DNA. Whether you're a Power Beast or an Endurance Machine, we build your physical foundation to support your technical skills.",
    icon: <Dumbbell className="w-12 h-12" />,
    color: "brand-teal",
    feature: "S&C Integration"
  },
  {
    title: "Go PRO for Max Gains",
    description: "PRO members get 500 monthly credits, 20% discounts on V-Coin top-ups, and exclusive access to Advanced Camp modules.",
    icon: <Crown className="w-12 h-12" />,
    color: "yellow-400",
    feature: "Elite Access"
  }
];

export default function Tutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TUTORIAL_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg glass-dark border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
      >
        {/* Background Glow */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 bg-brand-violet/20 rounded-full blur-[100px] transition-colors duration-700`} />
        <div className={`absolute -bottom-24 -left-24 w-64 h-64 bg-brand-teal/10 rounded-full blur-[100px] transition-colors duration-700`} />

        <div className="p-8 md:p-12 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <div className="flex gap-1.5">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-500 ${
                    idx === currentStep ? `w-8 bg-brand-teal` : 'w-2 bg-white/10'
                  }`} 
                />
              ))}
            </div>
            <button 
              onClick={onComplete}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="flex flex-col items-center text-center"
            >
              <div className={`w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(0,0,0,0.3)]`}>
                <div className="text-brand-teal">
                  {step.icon}
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase tracking-[0.4em] text-brand-teal mb-3`}>
                {step.feature}
              </span>
              
              <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white mb-6 leading-tight">
                {step.title}
              </h2>
              
              <p className="text-white/60 text-sm md:text-base leading-relaxed font-medium mb-12 max-w-sm">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className={`w-full py-5 rounded-2xl bg-white text-black font-black italic uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-colors duration-500`}
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? (
              <>Start Training <CheckCircle2 className="w-5 h-5" /></>
            ) : (
              <>Next Step <ChevronRight className="w-5 h-5" /></>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
