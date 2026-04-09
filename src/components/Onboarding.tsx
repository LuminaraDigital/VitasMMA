import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Activity, Crosshair, Scale, ArrowDown, Target, Zap, Dumbbell, Swords, Flame } from 'lucide-react';
import { UserProfile, Drill } from '../types';
import { getWeightClassInfo } from '../utils/mma';
import Logo from './Logo';
import { INITIAL_USER_STATS, QUEST_REWARDS } from '../constants';

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
  { id: 'q1', desc: 'Complete your first Video Analysis', completed: false, reward: QUEST_REWARDS.VIDEO_ANALYSIS, progress: 0, target: 1 },
  { id: 'q2', desc: 'Train with the Live Voice Coach', completed: false, reward: QUEST_REWARDS.LIVE_COACH, progress: 0, target: 1 },
  { id: 'q3', desc: 'Log in for 3 consecutive days', completed: false, reward: QUEST_REWARDS.STREAK_3_DAY, progress: 1, target: 3 },
];

export default function Onboarding({ user, profile, onComplete }: { user?: any, profile?: UserProfile | null, onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(1);
  
  // Try to parse name from Google Auth or Telegram
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const defaultFirstName = telegramUser?.first_name || (user?.displayName ? user.displayName.split(' ')[0] : '');
  const defaultLastName = telegramUser?.last_name || (user?.displayName ? user.displayName.split(' ').slice(1).join(' ') : '');
  
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [nickname, setNickname] = useState(telegramUser?.username || '');
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

  const [trainingTrack, setTrainingTrack] = useState<'mma' | 'snc' | 'hybrid' | null>(null);
  const [power, setPower] = useState(50);
  const [hypertrophy, setHypertrophy] = useState(50);
  const [endurance, setEndurance] = useState(50);
  const [recovery, setRecovery] = useState(50);

  const steps = useMemo(() => {
    const base = ['identity', 'track'];
    if (trainingTrack === 'mma') {
      return [...base, 'weight', 'level', 'style', 'attributes', 'blueprint'];
    } else if (trainingTrack === 'snc') {
      return [...base, 'snc_attributes', 'blueprint'];
    } else if (trainingTrack === 'hybrid') {
      return [...base, 'weight', 'level', 'style', 'attributes', 'snc_attributes', 'blueprint'];
    }
    return base;
  }, [trainingTrack]);

  const currentStepName = steps[step - 1];
  const totalSteps = trainingTrack ? steps.length : 2;
  const progress = (step / totalSteps) * 100;

  const getArchetype = () => {
    if (striking > 70 && grappling < 40) return 'Pressure Striker';
    if (grappling > 70 && striking < 40) return 'Submission Specialist';
    if (striking > 60 && grappling > 60) return 'Well-Rounded';
    if (clinch > 70) return 'Grinder';
    return 'Prospect';
  };

  const getSncArchetype = () => {
    if (power > 70 && endurance < 40) return 'Power Beast';
    if (hypertrophy > 70 && power < 50) return 'Volume Shredder';
    if (endurance > 70 && power < 40) return 'Endurance Machine';
    if (power > 60 && hypertrophy > 60 && endurance > 60) return 'Balanced Athlete';
    return 'Gym Rat';
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
      baseStyle: baseStyle || 'None',
      stance: stance || 'Orthodox',
      striking,
      grappling,
      clinch,
      aiCredits: profile?.aiCredits ?? INITIAL_USER_STATS.AI_CREDITS,
      archetype: trainingTrack === 'snc' ? 'S&C Athlete' : getArchetype(),
      trainingTrack: trainingTrack || 'mma',
      power,
      hypertrophy,
      endurance,
      recovery,
      sncArchetype: getSncArchetype(),
      prTracker: {},
      xp: INITIAL_USER_STATS.XP,
      level: INITIAL_USER_STATS.LEVEL,
      streak: 1,
      activeDrills: DEFAULT_DRILLS,
      analysisHistory: [],
      isPro: profile?.isPro ?? false,
      coins: profile?.coins ?? INITIAL_USER_STATS.COINS,
      dailyQuests: DEFAULT_QUESTS
    });
  };

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-violet/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <header className="sticky top-0 z-50 glass-dark px-6 py-6 border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-gradient flex items-center gap-3">
            <Logo className="w-8 h-8 md:w-10 md:h-10" /> VitasMMA
          </h1>
          <span className="text-xs font-black italic uppercase tracking-widest text-brand-teal">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            className="h-full bg-gradient-to-r from-brand-teal to-brand-violet"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-24 hide-scrollbar relative z-10 flex flex-col">
        {currentStepName === 'identity' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-gradient mb-2">Fighter Identity</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium mb-8 md:mb-10">Enter your personal details to begin your journey.</p>
            
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none" placeholder="Jon" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none" placeholder="Jones" />
                </div>
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2">Fight Nickname</label>
                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none" placeholder='"Bones"' />
              </div>

              <div className="space-y-1 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2">Gender (For Weight Classes)</label>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {['Male', 'Female'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g as 'Male' | 'Female')}
                      className={`py-3 md:py-4 rounded-xl md:rounded-2xl font-black italic uppercase tracking-widest text-[9px] md:text-[10px] border transition-all ${
                        gender === g 
                          ? 'bg-brand-teal/20 border-brand-teal text-brand-teal shadow-[0_0_20px_rgba(0,245,160,0.2)]' 
                          : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2">Height</label>
                  <input type="text" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none" placeholder="6'4" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2">Weight (lbs)</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none" placeholder="205" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentStepName === 'track' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-gradient mb-2">Choose Your Training Track</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium mb-8 md:mb-10">Select your primary focus.</p>
            
            <div className="space-y-4 md:space-y-6">
              <motion.button 
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTrainingTrack('mma')} 
                className={`w-full p-5 md:p-6 rounded-3xl md:rounded-[2rem] border-2 text-left transition-all shadow-xl relative overflow-hidden ${
                  trainingTrack === 'mma' 
                    ? 'border-brand-teal bg-brand-teal/10' 
                    : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <h3 className="font-black italic uppercase tracking-tighter text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-3">
                  <Swords className={`w-5 h-5 md:w-6 md:h-6 ${trainingTrack === 'mma' ? 'text-brand-teal' : 'text-gray-500'}`} /> 
                  🥊 MMA Fight Camps
                </h3>
                <p className="text-[10px] md:text-xs text-gray-400 font-medium leading-relaxed">Focus entirely on martial arts, fight IQ, and camp preparation.</p>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTrainingTrack('snc')} 
                className={`w-full p-5 md:p-6 rounded-3xl md:rounded-[2rem] border-2 text-left transition-all shadow-xl relative overflow-hidden ${
                  trainingTrack === 'snc' 
                    ? 'border-brand-blue bg-brand-blue/10' 
                    : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <h3 className="font-black italic uppercase tracking-tighter text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-3">
                  <Dumbbell className={`w-5 h-5 md:w-6 md:h-6 ${trainingTrack === 'snc' ? 'text-brand-blue' : 'text-gray-500'}`} /> 
                  💪 Strength & Conditioning
                </h3>
                <p className="text-[10px] md:text-xs text-gray-400 font-medium leading-relaxed">AI-powered hypertrophy, power, and conditioning for the gym.</p>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTrainingTrack('hybrid')} 
                className={`w-full p-5 md:p-6 rounded-3xl md:rounded-[2rem] border-2 text-left transition-all shadow-xl relative overflow-hidden ${
                  trainingTrack === 'hybrid' 
                    ? 'border-brand-violet bg-brand-violet/10' 
                    : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <h3 className="font-black italic uppercase tracking-tighter text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-3">
                  <Flame className={`w-5 h-5 md:w-6 md:h-6 ${trainingTrack === 'hybrid' ? 'text-brand-violet' : 'text-gray-500'}`} /> 
                  🔥 Hybrid Mode
                </h3>
                <p className="text-[10px] md:text-xs text-gray-400 font-medium leading-relaxed">The ultimate path. Combine MMA skills with elite strength training.</p>
              </motion.button>
            </div>
          </motion.div>
        )}

        {currentStepName === 'weight' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-gradient mb-2">Weight Strategy</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium mb-8 md:mb-10">Decide your path in the {gender} divisions.</p>
            
            {(() => {
              const { currentClass, nextClassDown } = getWeightClassInfo(gender || 'Male', parseFloat(weight));
              
              return (
                <div className="space-y-4 md:space-y-6">
                  <div className="glass border border-white/10 rounded-3xl md:rounded-[2rem] p-5 md:p-6 mb-6 md:mb-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/10 rounded-full blur-[40px]" />
                    <p className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-500 mb-1">Walk-Around Weight</p>
                    <p className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white mb-2">{weight} lbs</p>
                    <p className="text-xs md:text-sm font-black italic uppercase tracking-widest text-brand-teal">Natural Division: {currentClass.name} ({currentClass.limit} lbs)</p>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setWeightDecision('stay')} 
                    className={`w-full p-5 md:p-6 rounded-3xl md:rounded-[2rem] border-2 text-left transition-all shadow-xl relative overflow-hidden ${
                      weightDecision === 'stay' 
                        ? 'border-brand-teal bg-brand-teal/10' 
                        : 'border-white/5 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <h3 className="font-black italic uppercase tracking-tighter text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-3">
                      <Scale className={`w-5 h-5 md:w-6 md:h-6 ${weightDecision === 'stay' ? 'text-brand-teal' : 'text-gray-500'}`} /> 
                      Stay at {currentClass.name}
                    </h3>
                    <div className="text-[10px] md:text-xs font-medium space-y-1.5 md:space-y-2">
                      <p className="text-brand-teal flex items-center gap-2">✓ Maintain power and durability</p>
                      <p className="text-red-400/70 flex items-center gap-2">✗ May face larger opponents</p>
                    </div>
                  </motion.button>

                  {nextClassDown && (
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setWeightDecision('down')} 
                      className={`w-full p-5 md:p-6 rounded-3xl md:rounded-[2rem] border-2 text-left transition-all shadow-xl relative overflow-hidden ${
                        weightDecision === 'down' 
                          ? 'border-brand-violet bg-brand-violet/10' 
                          : 'border-white/5 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <h3 className="font-black italic uppercase tracking-tighter text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-3">
                        <ArrowDown className={`w-5 h-5 md:w-6 md:h-6 ${weightDecision === 'down' ? 'text-brand-violet' : 'text-gray-500'}`} /> 
                        Move down to {nextClassDown.name}
                      </h3>
                      <div className="text-[10px] md:text-xs font-medium space-y-1.5 md:space-y-2">
                        <p className="text-brand-teal flex items-center gap-2">✓ Size and reach advantage</p>
                        <p className="text-red-400/70 flex items-center gap-2">✗ Grueling weight cut</p>
                      </div>
                    </motion.button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}

        {currentStepName === 'level' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-gradient mb-2">Competition Level</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium mb-8 md:mb-10">What are your goals in the sport?</p>
            <div className="space-y-3 md:space-y-4">
              {LEVELS.map((l, idx) => (
                <motion.button
                  key={l}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCompLevel(l as any)}
                  className={`w-full p-5 md:p-6 rounded-3xl md:rounded-[2rem] border-2 text-left transition-all shadow-xl ${
                    compLevel === l 
                      ? 'border-brand-teal bg-brand-teal/10 shadow-[0_0_30px_rgba(0,245,160,0.2)]' 
                      : 'border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="font-black italic uppercase tracking-tighter text-lg md:text-xl block mb-1 md:mb-2">{l}</span>
                  <p className="text-[10px] md:text-xs text-gray-400 font-medium leading-relaxed">
                    {l === 'Hobbyist' && 'Training for fitness, self-defense, and fun.'}
                    {l === 'Amateur' && 'Preparing for or actively competing in regional bouts.'}
                    {l === 'Professional' && 'Fighting for a living. Marginal gains matter.'}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {currentStepName === 'style' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-gradient mb-2">Base Style & Stance</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium mb-8 md:mb-10">Define your martial arts foundation.</p>
            
            <div className="mb-8 md:mb-10">
              <label className="block text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 mb-3 md:mb-4 ml-2">Primary Style</label>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setBaseStyle(s)}
                    className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 text-center transition-all font-black italic uppercase tracking-widest text-[9px] md:text-[10px] ${
                      baseStyle === s 
                        ? 'border-brand-teal bg-brand-teal/10 text-brand-teal' 
                        : 'border-white/5 bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 mb-3 md:mb-4 ml-2">Fighting Stance</label>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {STANCES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStance(s)}
                    className={`p-2 md:p-4 rounded-xl md:rounded-2xl border-2 text-center transition-all font-black italic uppercase tracking-widest text-[8px] md:text-[10px] ${
                      stance === s 
                        ? 'border-brand-violet bg-brand-violet/10 text-brand-violet' 
                        : 'border-white/5 bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {currentStepName === 'attributes' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-gradient mb-2">Fighter Attributes</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium mb-8 md:mb-10">Rate your current skill levels (0-100).</p>
            
            <div className="space-y-8 md:space-y-10">
              <Slider label="Striking" value={striking} onChange={setStriking} color="bg-brand-violet" />
              <Slider label="Grappling" value={grappling} onChange={setGrappling} color="bg-brand-teal" />
              <Slider label="Clinch" value={clinch} onChange={setClinch} color="bg-brand-blue" />
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 md:mt-12 glass border border-brand-teal/30 bg-brand-teal/5 rounded-3xl md:rounded-[2rem] p-6 md:p-8 text-center relative overflow-hidden shadow-2xl"
            >
              <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 text-brand-teal/5" />
              <h3 className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 mb-1 md:mb-2 relative z-10">Detected Archetype</h3>
              <p className="text-2xl md:text-4xl font-black text-brand-teal uppercase italic tracking-tighter relative z-10">{getArchetype()}</p>
            </motion.div>
          </motion.div>
        )}

        {currentStepName === 'snc_attributes' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-gradient mb-2">Strength Layer DNA</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium mb-8 md:mb-10">Rate your current S&C levels (0-100).</p>
            
            <div className="space-y-8 md:space-y-10">
              <Slider label="Power (Explosive Lifts)" value={power} onChange={setPower} color="bg-brand-blue" />
              <Slider label="Hypertrophy (Volume)" value={hypertrophy} onChange={setHypertrophy} color="bg-brand-violet" />
              <Slider label="Endurance (Circuits)" value={endurance} onChange={setEndurance} color="bg-brand-teal" />
              <Slider label="Recovery (Mobility)" value={recovery} onChange={setRecovery} color="bg-white/50" />
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 md:mt-12 glass border border-brand-blue/30 bg-brand-blue/5 rounded-3xl md:rounded-[2rem] p-6 md:p-8 text-center relative overflow-hidden shadow-2xl"
            >
              <Dumbbell className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 text-brand-blue/5" />
              <h3 className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-400 mb-1 md:mb-2 relative z-10">Detected S&C Archetype</h3>
              <p className="text-2xl md:text-4xl font-black text-brand-blue uppercase italic tracking-tighter relative z-10">{getSncArchetype()}</p>
            </motion.div>
          </motion.div>
        )}

        {currentStepName === 'blueprint' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-gradient mb-2">VitasMMA Blueprint</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium mb-8 md:mb-10">Here is how we will help you on your journey.</p>
            
            {(() => {
              const { currentClass, nextClassDown } = getWeightClassInfo(gender || 'Male', parseFloat(weight));
              const targetClass = weightDecision === 'down' && nextClassDown ? nextClassDown.name : currentClass.name;

              return (
                <div className="space-y-4 md:space-y-6">
                  <div className="glass border border-white/10 rounded-3xl md:rounded-[2rem] p-5 md:p-6 shadow-2xl">
                    <div className="space-y-3 md:space-y-4">
                      {trainingTrack !== 'snc' && (
                        <>
                          <div className="flex justify-between items-center border-b border-white/5 pb-3 md:pb-4">
                            <span className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-500">League</span>
                            <span className="text-xs md:text-sm font-black italic uppercase tracking-tighter text-white">{compLevel}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-3 md:pb-4">
                            <span className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-500">Target Weight</span>
                            <span className="text-xs md:text-sm font-black italic uppercase tracking-tighter text-brand-teal">{targetClass}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-500">Base Style</span>
                            <span className="text-xs md:text-sm font-black italic uppercase tracking-tighter text-brand-violet">{baseStyle} ({stance})</span>
                          </div>
                        </>
                      )}
                      {trainingTrack === 'snc' && (
                        <>
                          <div className="flex justify-between items-center border-b border-white/5 pb-3 md:pb-4">
                            <span className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-500">Track</span>
                            <span className="text-xs md:text-sm font-black italic uppercase tracking-tighter text-brand-blue">Strength & Conditioning</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-500">Archetype</span>
                            <span className="text-xs md:text-sm font-black italic uppercase tracking-tighter text-brand-teal">{getSncArchetype()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="glass border border-brand-violet/20 bg-brand-violet/5 rounded-3xl md:rounded-[2rem] p-5 md:p-6 shadow-xl"
                  >
                    <h3 className="font-black italic uppercase tracking-tighter text-base md:text-lg mb-2 md:mb-3 flex items-center gap-2 md:gap-3 text-brand-violet">
                      <Target className="w-4 h-4 md:w-5 md:h-5" /> Training Focus
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-400 font-medium leading-relaxed">
                      {trainingTrack === 'snc' && "We'll focus entirely on building elite physical attributes—power, hypertrophy, endurance, and recovery—tailored to your body type."}
                      {trainingTrack !== 'snc' && compLevel === 'Hobbyist' && "We'll build your skills safely, focusing on technique, fitness, and longevity without the grueling pressure of a fight camp. Enjoy the martial arts journey."}
                      {trainingTrack !== 'snc' && compLevel === 'Amateur' && "We'll structure your training to build a rock-solid foundation, manage your weight safely, and prepare you for the regional scene with structured camps."}
                      {trainingTrack !== 'snc' && compLevel === 'Professional' && "We'll optimize your peak performance, track advanced analytics, and periodize your fight camps to ensure you step into the cage at 100%."}
                    </p>
                  </motion.div>

                  {trainingTrack !== 'snc' && (
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="glass border border-brand-teal/20 bg-brand-teal/5 rounded-3xl md:rounded-[2rem] p-5 md:p-6 shadow-xl"
                    >
                      <h3 className="font-black italic uppercase tracking-tighter text-base md:text-lg mb-2 md:mb-3 flex items-center gap-2 md:gap-3 text-brand-teal">
                        <Zap className="w-4 h-4 md:w-5 md:h-5" /> Weight Strategy
                      </h3>
                      <p className="text-[10px] md:text-xs text-gray-400 font-medium leading-relaxed">
                        {weightDecision === 'down' 
                          ? `We will integrate a safe, phased descent to ${targetClass} while maintaining your power and cardio, ensuring you have the size advantage.` 
                          : `We will focus on strength & conditioning to ensure you hit hard and fast for your natural weight at ${targetClass}, avoiding the depletion of a cut.`}
                      </p>
                    </motion.div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </main>

      <footer className="sticky bottom-0 z-50 glass-dark px-4 md:px-6 py-6 md:py-8 border-t border-white/5">
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (currentStepName === 'identity' && (!firstName || !lastName || !height || !weight || !gender)) return;
            if (currentStepName === 'track' && !trainingTrack) return;
            if (currentStepName === 'weight' && !weightDecision) return;
            if (currentStepName === 'level' && !compLevel) return;
            if (currentStepName === 'style' && (!baseStyle || !stance)) return;
            
            if (step < totalSteps) {
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          disabled={
            (currentStepName === 'identity' && (!firstName || !lastName || !height || !weight || !gender)) ||
            (currentStepName === 'track' && !trainingTrack) ||
            (currentStepName === 'weight' && !weightDecision) ||
            (currentStepName === 'level' && !compLevel) ||
            (currentStepName === 'style' && (!baseStyle || !stance))
          }
          className="w-full py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] bg-gradient-to-r from-brand-teal to-brand-blue font-black text-lg md:text-xl italic uppercase tracking-tighter flex items-center justify-center gap-2 md:gap-3 shadow-[0_0_40px_rgba(0,229,255,0.4)] text-black disabled:opacity-50 disabled:grayscale transition-all"
        >
          {step === totalSteps ? 'Enter the Gym' : 'Next Step'} <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
      </footer>
    </div>
  );
}

function Slider({ label, value, onChange, color }: { label: string, value: number, onChange: (v: number) => void, color: string }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-2">
        <span className="text-[10px] font-black italic uppercase tracking-widest text-gray-400">{label}</span>
        <span className="text-lg font-black italic uppercase tracking-tighter text-white">{value}</span>
      </div>
      <div className="relative h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className={`h-full ${color}`}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
}
