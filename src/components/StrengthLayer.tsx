import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Dumbbell, CheckCircle2, Zap, Target, Activity, Youtube, ExternalLink } from 'lucide-react';
import { UserProfile } from '../types';

export default function StrengthLayer({ profile, onUpdateProfile, onBack }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void }) {
  const [completed, setCompleted] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, { weight: string, reps: string }>>({});

  const plan = useMemo(() => {
    const style = profile.baseStyle?.toLowerCase() || '';
    
    if (style.includes('wrestling') || style.includes('bjj') || style.includes('jiu')) {
      return {
        type: 'Grappling',
        exercises: [
          { name: 'Deadlift / Heavy Band Pulls', reps: '3x8', benefit: 'grappling takedown power' },
          { name: 'Pull-ups / Inverted Rows', reps: '4x6', benefit: 'guard retention & clinch pulls' },
          { name: 'Turkish Get-ups', reps: '3x5/side', benefit: 'endurance + stability' }
        ],
        videos: [
          { title: 'BJJ Strength: The Perfect Deadlift', channel: 'BJJ Fanatics', duration: '8:45', why: 'Builds hip drive from your DNA weakness', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
          { title: 'Wrestling Takedown Power Lifts', channel: 'Jordan Burroughs', duration: '12:20', why: 'Develops explosive double-leg power', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
        ],
        expected: '+15% takedown success in 4 weeks'
      };
    } else if (style.includes('boxing') || style.includes('muay') || style.includes('kickboxing') || style.includes('striker')) {
      return {
        type: 'Striking',
        exercises: [
          { name: 'Plyo Push-ups', reps: '3x10', benefit: 'explosive punching power' },
          { name: 'Rotational Twists / Slams', reps: '3x8/side', benefit: 'core torque for kicks' },
          { name: 'Bulgarian Split Squats', reps: '3x8/leg', benefit: 'base stability & power generation' }
        ],
        videos: [
          { title: 'Explosive Pushups for Knockout Power', channel: 'FightTips', duration: '6:30', why: 'Directly translates to punching speed and snap', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
          { title: 'Rotational Core Training for Kickboxers', channel: 'MMAShredded', duration: '10:15', why: 'Increases torque for roundhouse kicks', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
        ],
        expected: '+20% strike impact in 4 weeks'
      };
    } else {
      return {
        type: 'Endurance',
        exercises: [
          { name: 'Kettlebell / DB Swings', reps: '4x15', benefit: 'hip explosiveness & cardio' },
          { name: 'Farmer Carries', reps: '3x60s', benefit: 'grip strength & clinch control' },
          { name: 'Burpees with Sprawl', reps: '3x12', benefit: 'takedown defense endurance' }
        ],
        videos: [
          { title: 'Kettlebell Circuits for MMA Cardio', channel: 'Phil Daru Strong', duration: '14:00', why: 'Mimics the lactic acid buildup of a 5-minute round', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
          { title: 'Championship Gas Tank: EMOM Protocols', channel: 'MMA On Point', duration: '9:50', why: 'Builds recovery speed between explosive bursts', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
        ],
        expected: '+25% gas tank in championship rounds'
      };
    }
  }, [profile.baseStyle]);

  const loggedCount = plan.exercises.filter(ex => exerciseLogs[ex.name]?.weight || exerciseLogs[ex.name]?.reps).length;

  const handleComplete = () => {
    if (completed) return;
    setCompleted(true);
    
    // Gamification: Award VMMA (Coins) and XP
    const rewardCoins = 150;
    const rewardXp = 300;
    const newXp = profile.xp + rewardXp;
    const newLevel = Math.floor(newXp / 1000) + 1;

    const newLogs = Object.entries(exerciseLogs).map(([exercise, data]: [string, { weight: string, reps: string }]) => ({
      date: new Date().toISOString(),
      exercise,
      weight: parseFloat(data.weight) || 0,
      reps: parseInt(data.reps, 10) || 0
    })).filter(log => log.weight > 0 || log.reps > 0);

    setTimeout(() => {
      onUpdateProfile({
        ...profile,
        coins: (profile.coins || 0) + rewardCoins,
        xp: newXp,
        level: newLevel,
        streak: profile.streak + 1,
        strengthLogs: [...(profile.strengthLogs || []), ...newLogs]
      });
      onBack();
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col p-6 relative bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FF2A2A]/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <header className="flex justify-between items-center mb-6 relative z-10">
        <button onClick={onBack} className="p-2 bg-[#1A2235] rounded-full hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest italic flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[#FF2A2A]" /> Strength Layer
        </h1>
        <div className="w-9"></div>
      </header>

      <div className="flex-1 relative z-10 space-y-6">
        <div className="bg-[#111623] border border-[#1A2235] rounded-2xl p-5 shadow-lg">
          <h2 className="text-sm text-[#00E5FF] uppercase tracking-widest font-bold mb-2">Strength Foundation for Your MMA Style</h2>
          <p className="text-gray-400 text-sm mb-4">2-3 weekly sessions (20-30 min). Scheduled around your existing striking/grappling workouts. Home equipment prioritized.</p>
          
          <div className="p-4 bg-[#1A2235]/50 rounded-xl border border-white/5 mb-4">
            <p className="text-sm font-mono text-gray-300">
              Based on your <span className="text-white font-bold">{plan.type}-focused DNA</span>, add these 3x/week:
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400 uppercase tracking-wider">Session Progress</span>
              <span className="font-mono text-[#00E5FF]">{loggedCount} / {plan.exercises.length}</span>
            </div>
            <div className="h-1.5 bg-[#0B0F19] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#00E5FF]"
                initial={{ width: 0 }}
                animate={{ width: `${(loggedCount / plan.exercises.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {plan.exercises.map((ex, i) => {
            const pastLogs = profile.strengthLogs?.filter(l => l.exercise === ex.name).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const lastLog = pastLogs?.[0];
            const isLogged = !!(exerciseLogs[ex.name]?.weight || exerciseLogs[ex.name]?.reps);

            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-xl border flex flex-col gap-2 transition-colors duration-300 ${isLogged ? 'bg-[#00E5FF]/5 border-[#00E5FF]/30' : 'bg-[#1A2235]/40 border-white/5'}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {isLogged ? <CheckCircle2 className="w-5 h-5 text-[#00E5FF]" /> : <span className="text-gray-500 text-sm">{i + 1}.</span>}
                    {ex.name}
                  </h3>
                  <span className={`text-xs font-mono px-2 py-1 rounded-md ${isLogged ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'bg-gray-800 text-gray-300'}`}>{ex.reps}</span>
                </div>
                <p className="text-sm text-[#00E5FF] flex items-center gap-1 mb-2">
                  <Target className="w-3 h-3" /> {ex.benefit}
                </p>

                {lastLog && (
                  <div className="text-xs text-gray-400 italic mb-2">
                    Last session: {lastLog.weight > 0 ? `${lastLog.weight} lbs × ` : ''}{lastLog.reps} reps
                  </div>
                )}

                <div className="flex gap-3 mt-1">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Weight (lbs)</label>
                    <input
                      type="number"
                      placeholder="e.g. 135"
                      value={exerciseLogs[ex.name]?.weight || ''}
                      onChange={e => setExerciseLogs(prev => ({ ...prev, [ex.name]: { ...prev[ex.name], weight: e.target.value } }))}
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00E5FF]/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Actual Reps</label>
                    <input
                      type="number"
                      placeholder="e.g. 8"
                      value={exerciseLogs[ex.name]?.reps || ''}
                      onChange={e => setExerciseLogs(prev => ({ ...prev, [ex.name]: { ...prev[ex.name], reps: e.target.value } }))}
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00E5FF]/50"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* YouTube Recommendations */}
        <div className="mt-8">
          <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" /> Recommended Study
          </h3>
          <div className="space-y-3">
            {plan.videos.map((vid, i) => (
              <motion.a
                key={i}
                href={vid.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="block p-4 bg-[#111623] border border-red-500/20 rounded-xl hover:border-red-500/50 transition-colors group"
                onClick={(e) => {
                  if (!window.confirm(`Open "${vid.title}" in YouTube?`)) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white group-hover:text-red-400 transition-colors pr-4">{vid.title}</h4>
                  <ExternalLink className="w-4 h-4 text-gray-500 shrink-0 group-hover:text-red-400" />
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400 mb-2">
                  <span className="bg-[#1A2235] px-2 py-1 rounded">{vid.channel}</span>
                  <span className="bg-[#1A2235] px-2 py-1 rounded">{vid.duration}</span>
                </div>
                <p className="text-sm text-gray-300 italic">"{vid.why}"</p>
              </motion.a>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-gradient-to-r from-[#FF2A2A]/10 to-transparent border-l-4 border-[#FF2A2A] rounded-r-xl"
        >
          <p className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF2A2A]" /> Expected: {plan.expected}
          </p>
        </motion.div>
      </div>

      <div className="mt-8 relative z-10">
        <p className="text-center text-xs text-gray-400 mb-3 italic">Tap link to watch, then log your session for VMMA!</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleComplete}
          disabled={completed}
          className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            completed 
              ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
              : 'bg-gradient-to-r from-[#FF2A2A] to-[#aa1111] shadow-[0_0_20px_rgba(255,42,42,0.3)]'
          }`}
        >
          {completed ? (
            <>
              <CheckCircle2 className="w-5 h-5" /> Session Logged (+150 VMMA)
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" /> Complete Session
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
