import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Circle, Trophy, CalendarDays } from 'lucide-react';
import { UserProfile } from '../types';

const CAMPS = [
  { id: 'striking_4w', title: '4-Week Striking Camp', desc: 'Focus on distance management and combinations.', level: 'Intermediate' },
  { id: 'fight_prep_8w', title: '8-Week Fight Prep', desc: 'Full MMA conditioning, sparring, and weight cut prep.', level: 'Advanced' },
  { id: 'grappling_base', title: 'Grappling Foundations', desc: 'Takedown entries and positional control.', level: 'Beginner' },
];

export default function FightCamps({ profile, onUpdateProfile, onBack }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void }) {
  const [activeCamp, setActiveCamp] = useState('striking_4w');
  const drills = profile.activeDrills || [];

  const toggleDrill = (id: string) => {
    const updatedDrills = drills.map(d => d.id === id ? { ...d, completed: !d.completed } : d);
    onUpdateProfile({ ...profile, activeDrills: updatedDrills });
  };

  const completedCount = drills.filter(d => d.completed).length;
  const progress = drills.length === 0 ? 0 : (completedCount / drills.length) * 100;

  return (
    <div className="h-full p-6 flex flex-col bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <header className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-[#1A2235] rounded-full hover:bg-[#2A3245] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold uppercase tracking-wider">Fight Camps</h1>
        </div>
        <div className="flex items-center gap-2 text-[#00E5FF]">
          <Trophy className="w-5 h-5" />
          <span className="font-mono font-bold">{profile.xp} XP</span>
        </div>
      </header>

      <div className="flex overflow-x-auto gap-4 pb-4 mb-6 snap-x hide-scrollbar">
        {CAMPS.map(camp => (
          <button
            key={camp.id}
            onClick={() => setActiveCamp(camp.id)}
            className={`min-w-[240px] p-4 rounded-2xl border text-left snap-start transition-all ${activeCamp === camp.id ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-[#1A2235] bg-[#1A2235]/50'}`}
          >
            <h3 className="font-bold text-lg mb-1">{camp.title}</h3>
            <p className="text-xs text-gray-400 mb-3">{camp.desc}</p>
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-black/50 rounded-full text-purple-400">{camp.level}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-[#111623] rounded-t-3xl border-t border-x border-[#1A2235] p-6 -mx-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="text-purple-500" /> Day 7 / 28
            </h2>
            <p className="text-gray-400">Complete tasks to earn +50 XP</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-mono text-purple-500">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="h-2 bg-[#0B0F19] rounded-full overflow-hidden mb-8">
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-3">
          {drills.map(drill => (
            <motion.div 
              key={drill.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleDrill(drill.id)}
              className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${drill.completed ? 'border-purple-500/50 bg-purple-500/5 opacity-70' : 'border-[#1A2235] bg-[#1A2235]/30 hover:border-gray-500'}`}
            >
              {drill.completed ? (
                <CheckCircle2 className="w-6 h-6 text-purple-500 flex-shrink-0" />
              ) : (
                <Circle className="w-6 h-6 text-gray-500 flex-shrink-0" />
              )}
              <div>
                <h4 className={`font-bold ${drill.completed ? 'line-through text-gray-400' : 'text-white'}`}>{drill.title}</h4>
                <p className="text-sm text-gray-500">{drill.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {progress === 100 && (
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            Claim +50 XP
          </motion.button>
        )}
      </div>
    </div>
  );
}
