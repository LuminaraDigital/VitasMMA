import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, ChevronRight, Activity, Crosshair, Scale, ArrowDown, Target, Zap } from 'lucide-react';
import { UserProfile, Drill } from '../types';
import { getWeightClassInfo } from '../utils/mma';

const STYLES = ['Boxing', 'Muay Thai', 'Kickboxing', 'Wrestling', 'BJJ', 'Judo', 'Sambo', 'MMA Hybrid'];
const STANCES = ['Orthodox', 'Southpaw', 'Switch'];
const LEVELS = ['Hobbyist', 'Amateur', 'Professional'];

const DEFAULT_DRILLS: Drill[] = [
  { id: '1', title: 'Shadowboxing (15 min)', desc: 'Focus on footwork and head movement.', completed: false },
  { id: '2', title: 'Heavy Bag Intervals', desc: '5x 3-minute rounds. High output.', completed: false },
  { id: '3', title: 'Neck Conditioning', desc: '3 sets of 20 reps. Front, back, sides.', completed: false },
  { id: '4', title: 'Active Recovery', desc: '20 min light stretching & foam rolling.', completed: false },
];

const DEFAULT_QUESTS = [
  { id: 'q1', desc: 'Complete your first Video Analysis', completed: false, reward: 100 },
  { id: 'q2', desc: 'Train with the Live Voice Coach', completed: false, reward: 150 },
  { id: 'q3', desc: 'Log in for 3 consecutive days', completed: false, reward: 300 },
];

export default function Onboarding({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  
  const [weightDecision, setWeightDecision] = useState<'stay' | 'down' | null>(null);
  const [compLevel, setCompLevel] = useState<'Hobbyist' | 'Amateur' | 'Professional' | null>(null);
  
  const [baseStyle, setBaseStyle] = useState('');
  const [stance, setStance] = useState('');
  
  const [striking, setStriking] = useState(50);
  const [grappling, setGrappling] = useState(50);
  const [clinch, setClinch] = useState(50);

  const getArchetype = () => {
    if (striking > 70 && grappling < 40) return 'Pressure Striker';
    if (grappling > 70 && striking < 40) return 'Submission Specialist';
    if (striking > 60 && grappling > 60) return 'Well-Rounded';
    if (clinch > 70) return 'Grinder';
    return 'Prospect';
  };

  const handleComplete = () => {
    const { currentClass, nextClassDown } = getWeightClassInfo(gender || 'Male', parseFloat(weight));
    const targetClass = weightDecision === 'down' && nextClassDown ? nextClassDown.name : currentClass.name;

    onComplete({
      firstName,
      lastName,
      nickname,
      height,
      weight: parseFloat(weight) || 0,
      gender: gender || 'Male',
      weightClass: currentClass.name,
      targetWeightClass: targetClass,
      competitionLevel: compLevel || 'Hobbyist',
      baseStyle,
      stance,
      striking,
      grappling,
      clinch,
      archetype: getArchetype(),
      xp: 100,
      level: 1,
      streak: 1,
      activeDrills: DEFAULT_DRILLS,
      analysisHistory: [],
      isPro: false,
      coins: 500,
      dailyQuests: DEFAULT_QUESTS
    });
  };

  const progress = (step / 6) * 100;

  return (
    <div className="h-full flex flex-col p-6 relative bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      {/* Cyberpunk Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-50 opacity-20 mix-blend-overlay"></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#FF2A2A]/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-[#00E5FF]/20 rounded-full blur-[100px]"></div>

      <header className="mb-8 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black uppercase tracking-widest italic flex items-center gap-2">
            <Shield className="text-[#FF2A2A]" /> Vitas<span className="text-[#00E5FF]">MMA</span>
          </h1>
          <span className="text-sm font-mono text-[#00E5FF]">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-[#1A2235] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#FF2A2A] to-[#00E5FF]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center z-10">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-bold uppercase mb-2">Fighter Identity</h2>
            <p className="text-gray-400 mb-8">Enter your personal details to begin.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none" placeholder="Jon" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none" placeholder="Jones" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Fight Nickname</label>
                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none" placeholder='"Bones"' />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Gender (For Weight Classes)</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setGender('Male')} className={`p-3 rounded-xl border-2 transition-all ${gender === 'Male' ? 'border-[#00E5FF] bg-[#00E5FF]/10' : 'border-[#1A2235] bg-[#1A2235]/50'}`}>Male</button>
                  <button onClick={() => setGender('Female')} className={`p-3 rounded-xl border-2 transition-all ${gender === 'Female' ? 'border-[#00E5FF] bg-[#00E5FF]/10' : 'border-[#1A2235] bg-[#1A2235]/50'}`}>Female</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Height</label>
                  <input type="text" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none" placeholder="6'4&quot;" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Weight (lbs)</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none" placeholder="205" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-bold uppercase mb-2">Weight Strategy</h2>
            <p className="text-gray-400 mb-8">Decide your path in the {gender} divisions.</p>
            
            {(() => {
              const { currentClass, nextClassDown } = getWeightClassInfo(gender || 'Male', parseFloat(weight));
              
              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-gray-800 bg-[#1A2235]/50 mb-6">
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Walk-Around Weight</p>
                    <p className="text-2xl font-bold">{weight} lbs</p>
                    <p className="text-[#00E5FF] mt-1">Natural Division: {currentClass.name} ({currentClass.limit} lbs)</p>
                  </div>

                  <button 
                    onClick={() => setWeightDecision('stay')} 
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${weightDecision === 'stay' ? 'border-[#00E5FF] bg-[#00E5FF]/10' : 'border-[#1A2235] bg-[#1A2235]/50'}`}
                  >
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Scale className="w-5 h-5 text-[#00E5FF]" /> Stay at {currentClass.name}</h3>
                    <div className="text-sm space-y-1">
                      <p className="text-green-400">✓ Pros: Maintain power, no harsh weight cut, better chin/durability.</p>
                      <p className="text-red-400">✗ Cons: May face larger, taller opponents with reach advantages.</p>
                    </div>
                  </button>

                  {nextClassDown && (
                    <button 
                      onClick={() => setWeightDecision('down')} 
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${weightDecision === 'down' ? 'border-[#FF2A2A] bg-[#FF2A2A]/10' : 'border-[#1A2235] bg-[#1A2235]/50'}`}
                    >
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><ArrowDown className="w-5 h-5 text-[#FF2A2A]" /> Move down to {nextClassDown.name}</h3>
                      <div className="text-sm space-y-1">
                        <p className="text-green-400">✓ Pros: Size and reach advantage, relative strength dominance.</p>
                        <p className="text-red-400">✗ Cons: Grueling weight cut, potential cardio drain, depleted chin.</p>
                      </div>
                    </button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-bold uppercase mb-2">Competition Level</h2>
            <p className="text-gray-400 mb-8">What are your goals in the sport?</p>
            <div className="space-y-3">
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setCompLevel(l as any)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${compLevel === l ? 'border-[#00E5FF] bg-[#00E5FF]/10 shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'border-[#1A2235] bg-[#1A2235]/50 hover:border-gray-600'}`}
                >
                  <span className="font-bold text-lg">{l}</span>
                  <p className="text-sm text-gray-400 mt-1">
                    {l === 'Hobbyist' && 'Training for fitness, self-defense, and fun.'}
                    {l === 'Amateur' && 'Preparing for or actively competing in regional bouts.'}
                    {l === 'Professional' && 'Fighting for a living. Marginal gains matter.'}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-bold uppercase mb-2">Base Style & Stance</h2>
            <p className="text-gray-400 mb-6">Define your martial arts foundation.</p>
            
            <div className="mb-6">
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Primary Style</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setBaseStyle(s)}
                    className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${baseStyle === s ? 'border-[#00E5FF] bg-[#00E5FF]/10' : 'border-[#1A2235] bg-[#1A2235]/50'}`}
                  >
                    <span className="font-bold">{s}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Fighting Stance</label>
              <div className="grid grid-cols-3 gap-2">
                {STANCES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStance(s)}
                    className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${stance === s ? 'border-[#FF2A2A] bg-[#FF2A2A]/10' : 'border-[#1A2235] bg-[#1A2235]/50'}`}
                  >
                    <span className="font-bold">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-bold uppercase mb-2">Fighter Attributes</h2>
            <p className="text-gray-400 mb-8">Rate your current skill levels (0-100).</p>
            
            <div className="space-y-8">
              <Slider label="Striking" value={striking} onChange={setStriking} color="bg-[#FF2A2A]" />
              <Slider label="Grappling" value={grappling} onChange={setGrappling} color="bg-[#00E5FF]" />
              <Slider label="Clinch" value={clinch} onChange={setClinch} color="bg-purple-500" />
            </div>

            <div className="mt-12 p-6 rounded-2xl border border-[#00E5FF]/30 bg-[#00E5FF]/5 text-center relative overflow-hidden">
              <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-[#00E5FF]/10" />
              <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Detected Archetype</h3>
              <p className="text-2xl font-black text-[#00E5FF] uppercase italic">{getArchetype()}</p>
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-black uppercase italic mb-2 text-[#00E5FF]">VitasMMA Blueprint</h2>
            <p className="text-gray-400 mb-6">Here is how we will help you on your journey.</p>
            
            {(() => {
              const { currentClass, nextClassDown } = getWeightClassInfo(gender || 'Male', parseFloat(weight));
              const targetClass = weightDecision === 'down' && nextClassDown ? nextClassDown.name : currentClass.name;

              return (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl border border-gray-800 bg-[#1A2235]/50">
                    <ul className="space-y-3">
                      <li className="flex justify-between border-b border-gray-800 pb-2">
                        <span className="text-gray-400">League</span>
                        <span className="font-bold text-white">{compLevel}</span>
                      </li>
                      <li className="flex justify-between border-b border-gray-800 pb-2">
                        <span className="text-gray-400">Target Weight</span>
                        <span className="font-bold text-white">{targetClass}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-400">Base Style</span>
                        <span className="font-bold text-white">{baseStyle} ({stance})</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-xl border-l-4 border-[#FF2A2A] bg-gradient-to-r from-[#FF2A2A]/10 to-transparent">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Target className="w-5 h-5 text-[#FF2A2A]" /> Training Focus</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {compLevel === 'Hobbyist' && "We'll build your skills safely, focusing on technique, fitness, and longevity without the grueling pressure of a fight camp. Enjoy the martial arts journey."}
                      {compLevel === 'Amateur' && "We'll structure your training to build a rock-solid foundation, manage your weight safely, and prepare you for the regional scene with structured camps."}
                      {compLevel === 'Professional' && "We'll optimize your peak performance, track advanced analytics, and periodize your fight camps to ensure you step into the cage at 100%."}
                    </p>
                  </div>

                  <div className="p-5 rounded-xl border-l-4 border-[#00E5FF] bg-gradient-to-r from-[#00E5FF]/10 to-transparent">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Zap className="w-5 h-5 text-[#00E5FF]" /> Weight Strategy</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {weightDecision === 'down' 
                        ? `We will integrate a safe, phased descent to ${targetClass} while maintaining your power and cardio, ensuring you have the size advantage.` 
                        : `We will focus on strength & conditioning to ensure you hit hard and fast for your natural weight at ${targetClass}, avoiding the depletion of a cut.`}
                    </p>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </main>

      <footer className="mt-8 z-10">
        <button
          onClick={() => {
            if (step === 1 && (!firstName || !lastName || !height || !weight || !gender)) return;
            if (step === 2 && !weightDecision) return;
            if (step === 3 && !compLevel) return;
            if (step === 4 && (!baseStyle || !stance)) return;
            if (step < 6) setStep(step + 1);
            else handleComplete();
          }}
          disabled={
            (step === 1 && (!firstName || !lastName || !height || !weight || !gender)) ||
            (step === 2 && !weightDecision) ||
            (step === 3 && !compLevel) ||
            (step === 4 && (!baseStyle || !stance))
          }
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#aa1111] font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
        >
          {step === 6 ? 'Enter the Gym' : 'Next Step'} <ChevronRight />
        </button>
      </footer>
    </div>
  );
}

function Slider({ label, value, onChange, color }: { label: string, value: number, onChange: (v: number) => void, color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-bold uppercase tracking-wide">{label}</span>
        <span className="font-mono text-gray-400">{value}</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${color}`}
        style={{ WebkitAppearance: 'none', background: `linear-gradient(to right, ${color.replace('bg-', '')} ${value}%, #1A2235 ${value}%)` }}
      />
    </div>
  );
}
