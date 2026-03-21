import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Dumbbell, Activity, Flame, Zap, ChevronRight, Lock, Target, Brain, Medal, Check, Coins, Video, X } from 'lucide-react';
import { UserProfile } from '../types';

export default function StrengthLayerDashboard({ profile, onNavigate, onUpdateProfile }: { profile: UserProfile, onNavigate: (v: string) => void, onUpdateProfile: (p: UserProfile) => void }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [gearMode, setGearMode] = useState<'barbell' | 'dumbbells' | 'bodyweight' | 'machines'>('barbell');
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [prForm, setPrForm] = useState({
    squat: profile.prTracker?.squat || 0,
    bench: profile.prTracker?.bench || 0,
    deadlift: profile.prTracker?.deadlift || 0,
    ohp: profile.prTracker?.ohp || 0,
    rows: profile.prTracker?.rows || 0,
  });

  const handleSavePRs = () => {
    onUpdateProfile({
      ...profile,
      prTracker: {
        ...profile.prTracker,
        ...prForm
      }
    });
    setIsPRModalOpen(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -10;
    const tiltY = ((x - centerX) / centerX) * 10;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const prs = [
    { name: 'Squat', value: profile.prTracker?.squat || 0, unit: 'lbs', icon: <Dumbbell className="w-5 h-5" /> },
    { name: 'Bench', value: profile.prTracker?.bench || 0, unit: 'lbs', icon: <Dumbbell className="w-5 h-5" /> },
    { name: 'Deadlift', value: profile.prTracker?.deadlift || 0, unit: 'lbs', icon: <Dumbbell className="w-5 h-5" /> },
    { name: 'OHP', value: profile.prTracker?.ohp || 0, unit: 'lbs', icon: <Dumbbell className="w-5 h-5" /> },
    { name: 'Rows', value: profile.prTracker?.rows || 0, unit: 'lbs', icon: <Dumbbell className="w-5 h-5" /> },
  ];

  const sncQuests = [
    { id: 'q1', desc: 'Log 3 sets of squats', completed: false, reward: 50 },
    { id: 'q2', desc: 'Complete a mobility routine', completed: true, reward: 30 },
    { id: 'q3', desc: 'Hit a new PR on Bench', completed: false, reward: 100 },
  ];

  const handleQuestClick = (id: string) => {
    // Mock quest completion
  };

  return (
    <div className="pb-24">
      {/* S&C DNA Card - Premium 3D */}
      <motion.div 
        className="relative glass rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 mb-12 md:mb-16 overflow-visible shadow-[0_20px_40px_rgba(0,0,0,0.5)] md:shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/15 group"
        style={{ transformStyle: 'preserve-3d', perspective: 1500 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 50, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 120, damping: 25 }}
      >
        {/* Animated Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/15 via-transparent to-brand-violet/15 rounded-[2.5rem] md:rounded-[3.5rem] pointer-events-none group-hover:opacity-100 transition-opacity duration-700 opacity-60"></div>
        <div className="absolute -inset-px bg-gradient-to-br from-white/25 via-transparent to-white/5 rounded-[2.5rem] md:rounded-[3.5rem] pointer-events-none opacity-40"></div>
        
        <div className="flex justify-between items-start mb-8 md:mb-12 relative z-10" style={{ transform: 'translateZ(30px)' }}>
          <div>
            <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white via-brand-blue to-brand-violet bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,245,160,0.3)] line-clamp-2">
              {profile.sncArchetype || 'S&C Athlete'}
            </h2>
            <p className="text-brand-blue font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-xs mt-2 opacity-80">Strength Layer DNA</p>
          </div>
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full glass border-2 border-brand-blue/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,245,160,0.3)] relative group-hover:scale-110 transition-transform duration-500">
            <div className="absolute inset-0 rounded-full border border-brand-blue animate-ping opacity-20"></div>
            <Dumbbell className="w-8 h-8 md:w-12 md:h-12 text-brand-blue drop-shadow-[0_0_10px_rgba(0,245,160,0.8)]" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 md:gap-8 relative z-10" style={{ transform: 'translateZ(40px)' }}>
          <StatCircle label="Power" value={profile.power || 50} color="text-brand-blue" glowColor="rgba(0, 195, 255, 0.4)" />
          <StatCircle label="Hypertrophy" value={profile.hypertrophy || 50} color="text-brand-violet" glowColor="rgba(168, 85, 247, 0.4)" />
          <StatCircle label="Endurance" value={profile.endurance || 50} color="text-brand-teal" glowColor="rgba(0, 245, 160, 0.4)" />
          <StatCircle label="Recovery" value={profile.recovery || 50} color="text-yellow-400" glowColor="rgba(250, 204, 21, 0.4)" />
        </div>
      </motion.div>

      {/* Gear Mode Toggle */}
      <div className="mb-8 md:mb-12">
        <h3 className="text-xs md:text-sm font-black text-white/40 uppercase tracking-[0.3em] mb-4 md:mb-6 px-4">Gear Mode</h3>
        <div className="flex gap-2 overflow-x-auto pb-4 px-4 hide-scrollbar">
          {['barbell', 'dumbbells', 'bodyweight', 'machines'].map((mode) => (
            <button
              key={mode}
              onClick={() => setGearMode(mode as any)}
              className={`px-4 py-2 rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap transition-all shrink-0 ${
                gearMode === mode 
                  ? 'bg-brand-blue text-black shadow-[0_0_20px_rgba(0,195,255,0.4)]' 
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* PR Tracker */}
      <div className="mb-12 md:mb-16">
        <div className="flex justify-between items-end mb-4 md:mb-6 px-4">
          <h3 className="text-xs md:text-sm font-black text-white/40 uppercase tracking-[0.3em]">PR Tracker</h3>
          <div className="flex gap-4">
            <button onClick={() => setIsPRModalOpen(true)} className="text-[10px] md:text-xs font-black text-brand-blue uppercase tracking-widest hover:text-white transition-colors">Update PRs</button>
            <button className="text-[10px] md:text-xs font-black text-brand-blue uppercase tracking-widest hover:text-white transition-colors">View All</button>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 px-4 hide-scrollbar">
          {prs.map((pr, idx) => (
            <motion.div
              key={pr.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass rounded-2xl p-4 min-w-[140px] md:min-w-[180px] border border-white/10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex items-center gap-2 mb-3 text-white/60 group-hover:text-brand-blue transition-colors">
                {pr.icon}
                <span className="font-black uppercase tracking-widest text-[10px] md:text-xs">{pr.name}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-4xl font-black italic tracking-tighter">{pr.value}</span>
                <span className="text-[10px] md:text-xs font-black text-white/40 uppercase tracking-widest">{pr.unit}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* S&C Training Hub Buttons */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-12 md:mb-16 px-4">
        <ActionButton 
          icon={<Target className="w-6 h-6 md:w-8 md:h-8" />} 
          title="Lift Templates" 
          subtitle="AI Generated" 
          color="blue" 
          onClick={() => onNavigate('lift_templates')} 
        />
        <ActionButton 
          icon={<Activity className="w-6 h-6 md:w-8 md:h-8" />} 
          title="Circuit Builder" 
          subtitle="Custom WODs" 
          color="violet" 
          onClick={() => onNavigate('circuit_builder')} 
        />
        <ActionButton 
          icon={<Dumbbell className="w-6 h-6 md:w-8 md:h-8" />} 
          title="Gear Library" 
          subtitle="Equipment Setup" 
          color="teal" 
          onClick={() => onNavigate('gear_library')} 
        />
        <ActionButton 
          icon={<Brain className="w-6 h-6 md:w-8 md:h-8" />} 
          title="Progression" 
          subtitle="Volume Tracking" 
          color="yellow" 
          onClick={() => onNavigate('progression')} 
        />
      </div>

      {/* AI Video Analyzer for S&C */}
      <div className="px-4 mb-12 md:mb-16">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('snc_video_analysis')}
          className="w-full relative group p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] glass border-brand-blue/30 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/20 via-brand-violet/20 to-brand-blue/20 opacity-50 group-hover:opacity-100 transition-opacity duration-700 bg-[length:200%_auto] animate-gradient"></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-blue/20 rounded-full blur-3xl group-hover:bg-brand-blue/30 transition-all duration-700"></div>
          
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-brand-blue animate-pulse shrink-0" />
                <span className="text-[9px] md:text-xs font-black text-brand-blue uppercase tracking-[0.3em] truncate">Pro Feature</span>
              </div>
              <h3 className="text-xl md:text-4xl font-black italic uppercase tracking-tighter mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-brand-blue transition-all line-clamp-2">
                S&C Form Analyzer
              </h3>
              <p className="text-[9px] md:text-xs text-white/60 font-black uppercase tracking-widest max-w-[200px] md:max-w-[300px] line-clamp-2">
                AI-powered bar path & depth tracking
              </p>
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-blue/20 flex items-center justify-center border border-brand-blue/50 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-[0_0_30px_rgba(0,195,255,0.3)] shrink-0">
              {profile.isPro ? <Video className="w-5 h-5 md:w-8 md:h-8 text-brand-blue" /> : <Lock className="w-5 h-5 md:w-8 md:h-8 text-brand-blue" />}
            </div>
          </div>
        </motion.button>
      </div>

      {/* Daily S&C Quests */}
      <div className="px-4">
        <div className="flex justify-between items-end mb-6 md:mb-8">
          <div>
            <h3 className="text-xs md:text-sm font-black text-white/40 uppercase tracking-[0.3em] mb-1">Daily S&C Quests</h3>
            <p className="text-[10px] md:text-xs text-brand-blue font-black uppercase tracking-widest">Complete for XP & Coins</p>
          </div>
          <span className="text-xs md:text-sm font-black text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            {sncQuests.filter(q => q.completed).length}/{sncQuests.length}
          </span>
        </div>

        <div className="space-y-3 md:space-y-4">
          {sncQuests.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: q.completed ? 1 : 1.03, x: q.completed ? 0 : 12 }}
              whileTap={{ scale: q.completed ? 1 : 0.98 }}
              onClick={() => handleQuestClick(q.id)}
              className={`flex items-center justify-between p-3 md:p-7 rounded-2xl md:rounded-[2.5rem] border transition-all relative overflow-hidden group ${
                q.completed 
                  ? 'bg-white/5 border-white/5 opacity-40 grayscale' 
                  : 'glass border-white/10 cursor-pointer hover:border-brand-blue/50 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)]'
              }`}
            >
              {!q.completed && (
                <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              )}
              <div className="flex items-center gap-3 md:gap-6 relative z-10 flex-1 min-w-0">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-xl shrink-0 ${
                  q.completed 
                    ? 'border-brand-blue bg-brand-blue/20 rotate-12' 
                    : 'border-white/15 bg-black/40 group-hover:border-brand-blue/60 group-hover:rotate-6'
                }`}>
                  {q.completed ? <Check className="w-5 h-5 md:w-6 md:h-6 text-brand-blue" /> : <Zap className="w-5 h-5 md:w-6 md:h-6 text-white/30 group-hover:text-brand-blue transition-colors" />}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <span className={`text-xs md:text-lg tracking-tighter block leading-tight mb-1 md:mb-2 line-clamp-2 ${
                    q.completed ? 'text-white/40 line-through' : 'text-white font-black italic uppercase'
                  }`}>{q.desc}</span>
                  {!q.completed && (
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-1 h-1 bg-brand-blue rounded-full animate-ping shrink-0"></div>
                      <span className="text-[8px] md:text-[10px] text-brand-blue font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-80 truncate">Active Objective</span>
                    </div>
                  )}
                </div>
              </div>
              <div className={`flex items-center gap-1.5 md:gap-2.5 font-black font-mono text-xs md:text-sm px-2 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border relative z-10 transition-all shrink-0 ${
                q.completed 
                  ? 'text-white/20 bg-white/5 border-transparent' 
                  : 'text-yellow-500 bg-yellow-500/15 border-yellow-500/30 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]'
              }`}>
                <Coins className="w-3.5 h-3.5 md:w-5 md:h-5" /> +{q.reward}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* PR Modal */}
      {isPRModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md glass-dark border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6 md:mb-8 relative z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-gradient">Update PRs</h2>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-brand-blue/60 mt-1">Log your max lifts</p>
              </div>
              <button 
                onClick={() => setIsPRModalOpen(false)}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/10"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4 relative z-10 mb-8">
              {['squat', 'bench', 'deadlift', 'ohp', 'rows'].map((lift) => (
                <div key={lift} className="flex items-center justify-between bg-black/40 p-3 md:p-4 rounded-xl border border-white/5">
                  <span className="font-black uppercase tracking-widest text-xs md:text-sm text-white/80 w-24">{lift}</span>
                  <div className="flex items-center gap-2 flex-1 max-w-[150px]">
                    <input 
                      type="number" 
                      value={prForm[lift as keyof typeof prForm]}
                      onChange={(e) => setPrForm({...prForm, [lift]: parseInt(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-right font-mono font-black text-lg focus:outline-none focus:border-brand-blue transition-colors"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">lbs</span>
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSavePRs}
              className="w-full py-4 rounded-xl bg-brand-blue text-black font-black italic uppercase tracking-widest shadow-[0_0_20px_rgba(0,195,255,0.3)] hover:shadow-[0_0_30px_rgba(0,195,255,0.5)] transition-all relative z-10"
            >
              Save Records
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCircle({ label, value, color, glowColor }: { label: string, value: number, color: string, glowColor: string }) {
  return (
    <div className="flex flex-col items-center group">
      <div className="relative w-16 h-16 md:w-24 md:h-24 flex items-center justify-center mb-2 md:mb-4">
        <div className="absolute inset-0 rounded-full blur-xl md:blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ backgroundColor: glowColor }}></div>
        <div className="absolute inset-0 rounded-full bg-black/40 border border-white/5 shadow-inner"></div>
        <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
          <motion.circle 
            cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="6" 
            strokeDasharray="263.8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 263.8 }}
            animate={{ strokeDashoffset: 263.8 - (263.8 * value) / 100 }}
            transition={{ duration: 2.5, ease: "circOut" }}
            className={color}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center z-20">
          <span className="font-mono text-base md:text-xl font-black tracking-tighter leading-none">{value}</span>
          <span className="text-[5px] md:text-[7px] font-black text-white/20 uppercase tracking-widest mt-0.5 md:mt-1">PTS</span>
        </div>
      </div>
      <span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-white/30 group-hover:text-brand-blue transition-colors text-center leading-tight">{label}</span>
    </div>
  );
}

function ActionButton({ icon, title, subtitle, onClick, color, className, isLocked }: any) {
  const colors: any = {
    teal: 'hover:border-brand-teal/50 hover:shadow-[0_0_40px_rgba(0,245,160,0.2)]',
    blue: 'hover:border-brand-blue/50 hover:shadow-[0_0_40px_rgba(0,195,255,0.2)]',
    violet: 'hover:border-brand-violet/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]',
    yellow: 'hover:border-yellow-400/50 hover:shadow-[0_0_40px_rgba(250,204,21,0.2)]',
  };

  const bgGlows: any = {
    teal: 'bg-gradient-to-br from-brand-teal/20 to-transparent',
    blue: 'bg-gradient-to-br from-brand-blue/20 to-transparent',
    violet: 'bg-gradient-to-br from-brand-violet/20 to-transparent',
    yellow: 'bg-gradient-to-br from-yellow-400/20 to-transparent',
  };

  const iconGlows: any = {
    teal: 'shadow-[0_0_20px_rgba(0,245,160,0.3)]',
    blue: 'shadow-[0_0_20px_rgba(0,195,255,0.3)]',
    violet: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    yellow: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative group p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] glass border-white/10 flex flex-col items-start gap-3 md:gap-6 transition-all duration-500 ${colors[color] || ''} ${className} overflow-hidden`}
    >
      <div className={`absolute inset-0 ${bgGlows[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700 group-hover:scale-150"></div>
      
      <div className={`relative z-10 p-3 md:p-5 bg-black/60 rounded-xl md:rounded-2xl border border-white/5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shrink-0 ${iconGlows[color]}`}>
        {icon}
      </div>
      <div className="text-left relative z-10 w-full flex-1 flex flex-col justify-end">
        <h3 className="font-black italic uppercase tracking-tighter text-sm md:text-xl leading-tight mb-1 md:mb-2 group-hover:text-white transition-colors flex items-center gap-2 line-clamp-2">
          {title}
          {isLocked && <Lock className="w-3 h-3 md:w-4 md:h-4 text-brand-violet shrink-0" />}
        </h3>
        <p className="text-[8px] md:text-[10px] text-white/40 font-black uppercase tracking-[0.2em] leading-relaxed line-clamp-2 w-full pr-4">{subtitle}</p>
      </div>
      <div className="absolute top-4 right-4 md:top-8 md:right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
        <ChevronRight className={`w-4 h-4 md:w-6 md:h-6 ${color === 'blue' ? 'text-brand-blue' : 'text-white/40'}`} />
      </div>
    </motion.button>
  );
}
