import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Lock, Unlock, Zap, Coins, Shield, TrendingUp, Youtube, ExternalLink } from 'lucide-react';
import { UserProfile } from '../types';

const MODULES = [
  { 
    id: 'fundamentals', title: 'MMA Fundamentals', desc: 'Basic striking, footwork, and grappling defense.', cost: 0, icon: '🥊', stat: 'Striking +5',
    videos: [
      { title: 'MMA Footwork Fundamentals', channel: 'FightTips', duration: '8:15', why: 'Master the basic stance and movement', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
      { title: 'Basic Takedown Defense', channel: 'MMA On Point', duration: '10:30', why: 'Learn to sprawl and defend the double leg', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
    ]
  },
  { 
    id: 'advanced_striking', title: 'Advanced Striking', desc: 'Dutch kickboxing & Muay Thai elbows.', cost: 300, icon: '⚡', stat: 'Striking +10',
    videos: [
      { title: 'Dutch Kickboxing Combos', channel: 'Jeff Chan', duration: '12:45', why: 'Integrate heavy low kicks into your boxing', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
      { title: 'Muay Thai Elbow Setups', channel: 'FightTips', duration: '9:20', why: 'Learn to close the distance for devastating elbows', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
    ]
  },
  { 
    id: 'wrestling_chain', title: 'Chain Wrestling', desc: 'Seamless takedown transitions and top control.', cost: 500, icon: '🤼', stat: 'Grappling +10',
    videos: [
      { title: 'Chain Wrestling Drills', channel: 'Jordan Burroughs', duration: '15:00', why: 'Transition smoothly between single and double legs', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
      { title: 'MMA Top Control Secrets', channel: 'BJJ Fanatics', duration: '11:10', why: 'Maintain heavy pressure to land ground and pound', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
    ]
  },
  { 
    id: 'submission_escapes', title: 'Submission Escapes', desc: 'Late-stage defense mechanics and sweeps.', cost: 800, icon: '🐍', stat: 'Grappling +15',
    videos: [
      { title: 'Late Stage Guillotine Defense', channel: 'BJJ Scout', duration: '7:50', why: 'Survive deep chokes and reverse the position', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
      { title: 'Escaping the Mount in MMA', channel: 'Jeff Chan', duration: '14:20', why: 'Avoid damage and get back to your feet safely', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
    ]
  },
  { 
    id: 'clinch_mastery', title: 'Thai Clinch Mastery', desc: 'Plum control, knees, and sweeps.', cost: 1200, icon: '🌪️', stat: 'Clinch +15',
    videos: [
      { title: 'Thai Plum Fundamentals', channel: 'FightTips', duration: '10:05', why: 'Control your opponent\'s posture for knees', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
      { title: 'Clinch Sweeps and Dumps', channel: 'MMAShredded', duration: '8:40', why: 'Off-balance your opponent from the inside', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
    ]
  },
  { 
    id: 'champ_mentality', title: 'Championship Rounds', desc: 'Cardio management and mental fortitude.', cost: 2000, icon: '👑', stat: 'All Stats +5',
    videos: [
      { title: 'Pacing for 5 Round Fights', channel: 'MMA On Point', duration: '13:15', why: 'Learn how to manage your gas tank', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
      { title: 'Mental Toughness in the Cage', channel: 'Phil Daru Strong', duration: '16:30', why: 'Push through exhaustion when it matters most', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
    ]
  },
];

export default function TrainingHub({ profile, onUpdateProfile, onBack }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void }) {
  const unlocked = profile.unlockedModules || ['fundamentals'];

  const handleUnlock = (mod: typeof MODULES[0]) => {
    if ((profile.coins || 0) >= mod.cost && !unlocked.includes(mod.id)) {
      onUpdateProfile({
        ...profile,
        coins: (profile.coins || 0) - mod.cost,
        unlockedModules: [...unlocked, mod.id]
      });
    }
  };

  const progressPercentage = Math.round((unlocked.length / MODULES.length) * 100);

  return (
    <div className="h-full flex flex-col p-6 relative bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#00E5FF]/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <header className="flex justify-between items-center mb-6 relative z-10">
        <button onClick={onBack} className="p-2 bg-[#1A2235] rounded-full hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest italic">Training Hub</h1>
        <div className="flex items-center gap-1 bg-[#1A2235] px-3 py-1.5 rounded-full border border-yellow-500/30">
          <Coins className="text-yellow-500 w-4 h-4" />
          <span className="font-bold font-mono text-yellow-500">{profile.coins || 0}</span>
        </div>
      </header>

      <div className="mb-8 relative z-10">
        <div className="bg-[#111623] border border-[#1A2235] rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Mastery Progress</h2>
              <p className="text-2xl font-black">{progressPercentage}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#00E5FF] font-mono">{unlocked.length} / {MODULES.length} Modules</p>
            </div>
          </div>
          <div className="h-2 bg-[#0B0F19] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#FF2A2A] to-[#00E5FF]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10 pb-8">
        <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-2">Available Modules</h3>
        
        {MODULES.map((mod, i) => {
          const isUnlocked = unlocked.includes(mod.id);
          const canAfford = (profile.coins || 0) >= mod.cost;

          return (
            <motion.div 
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-2xl border ${isUnlocked ? 'border-[#00E5FF]/30 bg-[#00E5FF]/5' : 'border-[#1A2235] bg-[#111623]'} relative overflow-hidden`}
            >
              <div className="flex gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${isUnlocked ? 'bg-[#00E5FF]/20' : 'bg-[#1A2235]'}`}>
                  {mod.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-300'}`}>{mod.title}</h4>
                    {isUnlocked ? (
                      <span className="text-xs font-bold text-[#00E5FF] flex items-center gap-1 bg-[#00E5FF]/10 px-2 py-1 rounded-md">
                        <Unlock className="w-3 h-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-yellow-500 flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-md">
                        <Coins className="w-3 h-3" /> {mod.cost}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 mb-3">{mod.desc}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {mod.stat}
                    </span>
                    
                    {!isUnlocked && (
                      <button 
                        onClick={() => handleUnlock(mod)}
                        disabled={!canAfford}
                        className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-1 transition-all ${canAfford ? 'bg-[#FF2A2A] text-white hover:bg-[#aa1111]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                      >
                        <Lock className="w-3 h-3" /> Unlock
                      </button>
                    )}
                  </div>

                  {isUnlocked && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h5 className="text-xs text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Youtube className="w-3 h-3 text-red-500" /> Recommended Study
                      </h5>
                      <div className="space-y-2">
                        {mod.videos.map((vid, vIdx) => (
                          <a
                            key={vIdx}
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-[#0B0F19] border border-red-500/10 rounded-lg hover:border-red-500/40 transition-colors group"
                            onClick={(e) => {
                              if (!window.confirm(`Open "${vid.title}" in YouTube?`)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h6 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors pr-2">{vid.title}</h6>
                              <ExternalLink className="w-3 h-3 text-gray-500 shrink-0 group-hover:text-red-400" />
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] font-mono text-gray-400 mb-1">
                              <span className="bg-[#1A2235] px-1.5 py-0.5 rounded">{vid.channel}</span>
                              <span className="bg-[#1A2235] px-1.5 py-0.5 rounded">{vid.duration}</span>
                            </div>
                            <p className="text-xs text-gray-400 italic">"{vid.why}"</p>
                          </a>
                        ))}
                      </div>
                    </div>
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
