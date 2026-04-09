import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Lock, Unlock, Zap, Coins, Shield, TrendingUp, Youtube, ExternalLink } from 'lucide-react';
import { UserProfile } from '../types';
import { MODULE_COSTS } from '../constants';
import { fetchWithAuth } from '../utils/api';

const MODULES = [
  { 
    id: 'fundamentals', title: 'MMA Fundamentals', desc: 'Stance, distance management, and basic positioning.', cost: MODULE_COSTS.FUNDAMENTALS, icon: '🥊', stat: 'Striking +5',
    videos: [
      { title: 'MMA Cage Control & Ground and Pound', channel: 'MMA Shredded', duration: '15:45', why: 'Integrating striking with wrestling and cage pressure', url: 'https://youtu.be/W3O0x8O0x8O' },
      { title: 'Stance, Distance & Footwork', channel: 'Georges St-Pierre', duration: '22:15', why: 'Master the ground floor of fighting with a legend', url: 'https://youtu.be/cP-E4YHSYQg' },
      { title: 'BJJ Glossary & Positions', channel: 'Jiu-Jitsu Times', duration: '12:45', why: 'Learn the essential positions and terms', url: 'https://youtu.be/36Yv3f8LgsA' }
    ]
  },
  { 
    id: 'advanced_striking', title: 'Advanced Striking', desc: 'Elite combinations, counters, and MMA boxing.', cost: MODULE_COSTS.ADVANCED_STRIKING, icon: '⚡', stat: 'Striking +10',
    videos: [
      { title: 'Kickboxing Fundamentals & Combinations', channel: 'Gabriel Varga', duration: '18:20', why: 'Core striking mechanics and high-percentage combos', url: 'https://youtu.be/Yp_O6Z-C6vE' },
      { title: 'MMA Striking Combinations', channel: 'Anderson Silva', duration: '1:05:20', why: 'Elite flow between strikes and counters', url: 'https://youtu.be/nxKukVoomL0' },
      { title: '4-Round Kickboxing Workout', channel: 'FightCamp', duration: '21:10', why: 'High-intensity follow-along striking drill', url: 'https://youtu.be/bs7X3F-XYTc' }
    ]
  },
  { 
    id: 'wrestling_chain', title: 'Wrestling & Smesh', desc: 'Takedown mechanics and heavy top pressure.', cost: MODULE_COSTS.WRESTLING_CHAIN, icon: '🤼', stat: 'Grappling +10',
    videos: [
      { title: 'Takedown Mechanics & Decoys', channel: 'Georges St-Pierre', duration: '15:00', why: 'The art of the level change and connection', url: 'https://youtu.be/EkhvG6nFDUU' },
      { title: 'The GSP Takedown System', channel: 'MMA Shredded', duration: '11:10', why: 'Integrating shots with your striking game', url: 'https://youtu.be/04axE4WidO8' },
      { title: 'Khabib Smesh Philosophy', channel: 'Khabib Nurmagomedov', duration: '08:30', why: 'Using legs and hips for ultimate control', url: 'https://youtu.be/x_IrC_-zzYU' }
    ]
  },
  { 
    id: 'submission_escapes', title: 'Survival & Escapes', desc: 'Mount escapes, survival mindset, and self-defense.', cost: MODULE_COSTS.SUBMISSION_ESCAPES, icon: '🐍', stat: 'Grappling +15',
    videos: [
      { title: '3 Essential Mount Escapes', channel: 'Brandon Mccaghren', duration: '07:50', why: 'Regain guard and transition to safety', url: 'https://youtu.be/SYel-mVSMAI' },
      { title: 'White Belt Survival Guide', channel: 'Chewjitsu', duration: '14:20', why: 'Prioritize control and survival over offense', url: 'https://youtu.be/khd9tFAyIyQ' },
      { title: 'BJJ Self-Defense Fundamentals', channel: 'Gracie Breakdown', duration: '1:45:30', why: 'Neutralize power with distance management', url: 'https://youtu.be/bErptxD1jho' }
    ]
  },
  { 
    id: 'clinch_mastery', title: 'Thai Clinch Mastery', desc: 'Plum control, knees, and off-balancing.', cost: MODULE_COSTS.CLINCH_MASTERY, icon: '🌪️', stat: 'Clinch +15',
    videos: [
      { title: 'Muay Thai Clinch Fundamentals', channel: 'Anderson Silva', duration: '1:02:05', why: 'Plum control and devastating knee attacks', url: 'https://youtu.be/rYmDwDnjXCE' }
    ]
  },
  { 
    id: 'champ_mentality', title: 'Submission Finishing', desc: 'High-percentage finishes and finishing mechanics.', cost: MODULE_COSTS.CHAMP_MENTALITY, icon: '👑', stat: 'All Stats +5',
    videos: [
      { title: '10 High-Percentage Submissions', channel: 'BJJ Fanatics', duration: '13:15', why: 'Master the Arm Bar, Americana, Kimura, and essential chokes', url: 'https://youtu.be/ALEeReC3u5Y' },
      { title: '3 Essential Submissions', channel: 'Brandon Mccaghren', duration: '16:30', why: 'Proper mechanics for RNC, Armbar, and Triangle', url: 'https://youtu.be/PzRARzgBBNo' }
    ]
  },
];

export default function TrainingHub({ profile, onUpdateProfile, onBack }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void }) {
  const unlocked = profile.unlockedModules || ['fundamentals'];

  const handleUnlock = async (mod: typeof MODULES[0]) => {
    if ((profile.isPro || (profile.coins || 0) >= mod.cost) && !unlocked.includes(mod.id)) {
      try {
        const response = await fetchWithAuth('/api/unlock-module', {
          method: 'POST',
          body: JSON.stringify({ userId: profile.id, moduleId: mod.id, cost: mod.cost })
        });
        
        if (!response.ok) {
          throw new Error('Failed to unlock module');
        }
        
        // The profile will be updated via the onSnapshot listener in App.tsx
      } catch (err) {
        console.error('Error unlocking module:', err);
      }
    }
  };

  const progressPercentage = Math.round((unlocked.length / MODULES.length) * 100);

  return (
    <div className="h-full flex flex-col p-6 relative bg-brand-bg text-white overflow-y-auto hide-scrollbar pb-24 font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-teal/20 rounded-full blur-[120px] animate-pulse opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-violet/20 rounded-full blur-[120px] animate-pulse opacity-50" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-brand-blue/10 rounded-full blur-[100px] animate-pulse opacity-30" style={{ animationDelay: '1.5s' }} />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        {/* Floating Particles Simulation */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      </div>
      
      <header className="sticky top-0 z-50 glass-dark px-6 py-6 flex items-center justify-between border-b border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl -mx-6 rounded-b-[3.5rem]">
        <motion.button 
          whileHover={{ scale: 1.1, x: -3, backgroundColor: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-3.5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 shadow-2xl backdrop-blur-xl"
        >
          <ChevronLeft className="w-6 h-6 text-white/90" />
        </motion.button>
        <div className="flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black italic uppercase tracking-tighter text-gradient leading-none drop-shadow-2xl"
          >
            Training Hub
          </motion.h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-brand-teal shadow-[0_0_10px_rgba(0,245,160,0.8)] animate-pulse" />
            <span className="text-[10px] font-black italic uppercase tracking-[0.5em] text-white/50">Skill Evolution</span>
          </div>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05, y: -2 }}
          className="flex items-center gap-3 bg-black/60 px-6 py-3.5 rounded-2xl border border-yellow-500/40 shadow-[0_0_40px_rgba(234,179,8,0.2)] backdrop-blur-2xl"
        >
          <Coins className="text-yellow-500 w-6 h-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
          <span className="font-black font-mono text-xl text-yellow-500 leading-none">{profile.coins || 0}</span>
        </motion.div>
      </header>

      <div className="mt-12 mb-20 relative z-10 perspective-2000">
        <motion.div 
          initial={{ opacity: 0, y: 40, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          whileHover={{ rotateX: 8, rotateY: -8, scale: 1.03, z: 100 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="glass-dark rounded-[3.5rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.7)] relative overflow-hidden border border-white/15 group transform-gpu"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/20 via-transparent to-brand-violet/20 opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute -inset-[100%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] group-hover:animate-[spin_10s_linear_infinite] pointer-events-none" />
          
          <div className="flex justify-between items-end mb-10 relative z-10" style={{ transform: 'translateZ(40px)' }}>
            <div>
              <h2 className="text-[11px] text-brand-teal font-black italic uppercase tracking-[0.6em] mb-5 flex items-center gap-4">
                <div className="w-8 h-px bg-brand-teal/30" />
                <TrendingUp className="w-5 h-5"/> Mastery Progress
              </h2>
              <p className="text-7xl font-black italic uppercase tracking-tighter text-gradient drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]">{progressPercentage}%</p>
            </div>
            <div className="text-right">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="inline-flex items-center gap-4 bg-brand-blue/20 px-6 py-3 rounded-2xl border border-brand-blue/30 backdrop-blur-xl shadow-xl"
              >
                <span className="text-[11px] text-brand-blue font-black italic uppercase tracking-[0.4em]">{unlocked.length} / {MODULES.length} Modules</span>
              </motion.div>
            </div>
          </div>
          
          <div className="h-5 bg-black/70 rounded-full overflow-hidden relative z-10 shadow-[inset_0_4px_15px_rgba(0,0,0,0.6)] border border-white/10" style={{ transform: 'translateZ(20px)' }}>
            <motion.div 
              className="h-full bg-gradient-to-r from-brand-teal via-brand-blue to-brand-violet relative"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 3, ease: "circOut" }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[size:50px_50px] animate-[shimmer_2s_linear_infinite]" />
              <div className="absolute top-0 right-0 w-12 h-full bg-white/50 blur-xl" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="space-y-12 relative z-10 pb-24">
        <div className="flex items-center justify-between mb-8 px-6">
          <div className="flex items-center gap-5">
            <div className="w-3 h-3 rounded-full bg-brand-teal shadow-[0_0_20px_rgba(0,245,160,0.6)] animate-pulse" />
            <h3 className="text-[12px] text-white/60 font-black italic uppercase tracking-[0.7em]">Available Modules</h3>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-white/20 via-white/10 to-transparent ml-10"></div>
        </div>
        
        {MODULES.map((mod, i) => {
          const isUnlocked = unlocked.includes(mod.id);
          const canAfford = (profile.coins || 0) >= mod.cost;

          return (
            <motion.div 
              key={mod.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -15, rotateX: 5, scale: 1.03, z: 50 }}
              className={`p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border transition-all duration-700 relative overflow-hidden perspective-2000 group transform-gpu ${isUnlocked ? 'glass-dark border-brand-teal/40 bg-brand-teal/5 shadow-[0_40px_100px_rgba(0,0,0,0.5)]' : 'glass-dark border-white/10 bg-white/[0.03] shadow-2xl'}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-[80px] group-hover:bg-brand-teal/10 transition-colors duration-1000" />
              
              <div className="flex flex-col lg:flex-row gap-6 md:gap-12 relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.15, rotate: 8, translateZ: 50 }}
                  className={`w-20 h-20 md:w-28 md:h-28 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-4xl md:text-6xl shrink-0 shadow-[0_25px_50px_rgba(0,0,0,0.5)] relative group/icon transform-gpu ${isUnlocked ? 'bg-brand-teal/25 border border-brand-teal/40' : 'bg-black/50 border border-white/15'}`}
                >
                  <div className="absolute inset-0 bg-white/15 rounded-[2.5rem] opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500" />
                  <span className="drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)]">{mod.icon}</span>
                </motion.div>
                
                <div className="flex-1" style={{ transform: 'translateZ(30px)' }}>
                  <div className="flex flex-wrap justify-between items-start gap-4 md:gap-6 mb-6">
                    <h4 className={`text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none drop-shadow-lg ${isUnlocked ? 'text-white' : 'text-white/70'}`}>{mod.title}</h4>
                    {isUnlocked ? (
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="text-[10px] md:text-[11px] font-black italic text-brand-teal flex items-center gap-2 md:gap-4 bg-brand-teal/20 px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl uppercase tracking-[0.3em] border border-brand-teal/30 shadow-2xl backdrop-blur-xl"
                      >
                        <Unlock className="w-3 h-3 md:w-4 md:h-4" /> Unlocked
                      </motion.div>
                    ) : (
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="text-[10px] md:text-[11px] font-black italic text-yellow-500 flex items-center gap-2 md:gap-4 bg-yellow-500/20 px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl uppercase tracking-[0.3em] border border-yellow-500/30 shadow-2xl backdrop-blur-xl"
                      >
                        <Coins className="w-3 h-3 md:w-4 md:h-4" /> {profile.isPro ? 'FREE' : mod.cost}
                      </motion.div>
                    )}
                  </div>
                  <p className="text-base md:text-lg text-white/60 font-medium leading-relaxed mb-8 md:mb-10 max-w-3xl italic opacity-80">{mod.desc}</p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 md:gap-8">
                    <motion.div 
                      whileHover={{ scale: 1.05, x: 5 }}
                      className="text-[10px] md:text-[11px] font-black italic text-brand-violet bg-brand-violet/20 px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-4 uppercase tracking-[0.3em] border border-brand-violet/30 shadow-2xl backdrop-blur-xl"
                    >
                      <Zap className="w-3 h-3 md:w-4 md:h-4" /> {mod.stat}
                    </motion.div>
                    
                    {!isUnlocked && (
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -6, boxShadow: '0 30px 60px rgba(0,245,160,0.4)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleUnlock(mod)}
                        disabled={!canAfford}
                        className={`text-xs md:text-sm font-black italic uppercase tracking-[0.2em] md:tracking-[0.4em] px-6 py-4 md:px-12 md:py-6 rounded-full md:rounded-[2rem] flex items-center gap-3 md:gap-5 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] transform-gpu ${canAfford ? 'bg-gradient-to-br from-brand-teal to-brand-blue text-black font-black hover:brightness-110' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'}`}
                      >
                        <Lock className="w-4 h-4 md:w-5 md:h-5" /> Unlock Module
                      </motion.button>
                    )}
                  </div>

                  {isUnlocked && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-12 pt-12 border-t border-white/10 space-y-10"
                    >
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-red-500/25 rounded-2xl border border-red-500/40 shadow-lg">
                          <Youtube className="w-6 h-6 text-red-500" />
                        </div>
                        <h5 className="text-[12px] text-brand-teal font-black italic uppercase tracking-[0.6em]">Recommended Study</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {mod.videos.map((vid, vIdx) => (
                          <motion.a
                            key={vIdx}
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -10, backgroundColor: 'rgba(255,255,255,0.08)', scale: 1.03, z: 30 }}
                            className="block p-8 bg-black/50 border border-white/10 rounded-[2.5rem] transition-all group shadow-2xl backdrop-blur-2xl relative overflow-hidden transform-gpu"
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            <div className="flex justify-between items-start mb-4 md:mb-6 relative z-10" style={{ transform: 'translateZ(20px)' }}>
                              <h6 className="font-black italic text-lg md:text-xl text-white/95 group-hover:text-brand-teal transition-colors pr-6 md:pr-10 leading-tight uppercase tracking-tighter">{vid.title}</h6>
                              <div className="p-2 md:p-3 bg-white/10 rounded-xl group-hover:bg-brand-teal/30 transition-all shadow-lg shrink-0">
                                <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-white/40 group-hover:text-brand-teal transition-colors" />
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-[10px] font-black italic uppercase tracking-[0.3em] text-white/40 mb-6 relative z-10" style={{ transform: 'translateZ(15px)' }}>
                              <span className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-sm">{vid.channel}</span>
                              <span className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-sm">{vid.duration}</span>
                            </div>
                            
                            <p className="text-sm text-white/50 italic font-bold leading-relaxed group-hover:text-white/80 transition-colors relative z-10" style={{ transform: 'translateZ(10px)' }}>"{vid.why}"</p>
                          </motion.a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
