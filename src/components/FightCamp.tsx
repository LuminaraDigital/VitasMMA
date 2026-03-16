import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, CheckCircle2, Circle, Play, ShieldAlert, Zap, Activity, Calendar } from 'lucide-react';
import { UserProfile, FightCamp as FightCampType, CampTask } from '../types';

const AVAILABLE_CAMPS: FightCampType[] = [
  {
    id: 'striking_camp_1',
    title: 'Striking Fundamentals',
    description: '4-week camp focusing on boxing and kickboxing basics. Perfect for building a solid foundation.',
    durationWeeks: 4,
    currentDay: 1,
    progress: 0,
    tasks: [
      { id: 't1', title: 'Jab Cross Mechanics', description: 'Throw 50 reps of 1-2 combos', type: 'drill', verificationCriteria: 'Confirm 50+ punches thrown. Check if rear heel is planted on the cross and hands return to guard.', completed: false, xpReward: 150 },
      { id: 't2', title: 'Shadowboxing Flow', description: '3 minutes continuous movement', type: 'conditioning', verificationCriteria: 'Confirm continuous movement for at least 60 seconds in the clip. Check head movement and footwork.', completed: false, xpReward: 100 },
      { id: 't3', title: 'Active Recovery', description: '10 mins stretching', type: 'recovery', verificationCriteria: 'Confirm user is performing static or dynamic stretches.', completed: false, xpReward: 50 },
    ]
  },
  {
    id: 'fight_prep_1',
    title: '8-Week Fight Prep',
    description: 'Intense 8-week camp simulating a real fight camp. High volume, high intensity.',
    durationWeeks: 8,
    currentDay: 1,
    progress: 0,
    tasks: [
      { id: 't4', title: 'Heavy Bag Sprints', description: '5 rounds of 3 mins on the bag', type: 'conditioning', verificationCriteria: 'Confirm high intensity striking on a heavy bag. Check for power and volume.', completed: false, xpReward: 200 },
      { id: 't5', title: 'Sprawl & Brawl', description: '20 sprawls into 1-2 combos', type: 'drill', verificationCriteria: 'Confirm user is sprawling and immediately throwing a 1-2 combo upon standing.', completed: false, xpReward: 150 },
    ]
  }
];

export default function FightCamp({ profile, onUpdateProfile, onBack, onVerifyTask }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void, onVerifyTask: (task: CampTask) => void }) {
  const [selectedCamp, setSelectedCamp] = useState<FightCampType | null>(profile.activeCamp || null);

  const handleJoinCamp = (camp: FightCampType) => {
    const newProfile = { ...profile, activeCamp: camp };
    onUpdateProfile(newProfile);
    setSelectedCamp(camp);
  };

  const handleCompleteDay = () => {
    if (!selectedCamp) return;
    
    const totalDays = selectedCamp.durationWeeks * 7;
    const nextDay = selectedCamp.currentDay + 1;
    const newProgress = Math.round((nextDay / totalDays) * 100);
    
    // Reset tasks for the next day (in a real app, we'd load new tasks)
    const resetTasks = selectedCamp.tasks.map(t => ({ ...t, completed: false }));
    
    const updatedCamp = {
      ...selectedCamp,
      currentDay: nextDay,
      progress: newProgress,
      tasks: resetTasks
    };

    const newProfile = { ...profile, activeCamp: updatedCamp };
    onUpdateProfile(newProfile);
    setSelectedCamp(updatedCamp);
  };

  const handleQuitCamp = () => {
    if (confirm("Are you sure you want to quit this camp? All progress will be lost.")) {
      const newProfile = { ...profile, activeCamp: null };
      onUpdateProfile(newProfile);
      setSelectedCamp(null);
    }
  };

  if (!selectedCamp) {
    return (
      <div className="h-full p-6 flex flex-col bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
        <header className="flex items-center gap-4 mb-8 shrink-0">
          <button onClick={onBack} className="p-2 bg-[#1A2235] rounded-full hover:bg-[#2A3245] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold uppercase tracking-wider">Fight Camps</h1>
        </header>

        <div className="mb-6">
          <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-2">Select a Program</h2>
          <p className="text-xs text-gray-500">Commit to a 4-8 week structured program. Complete daily tasks, verify with AI, and earn exclusive badges.</p>
        </div>

        <div className="space-y-4">
          {AVAILABLE_CAMPS.map(camp => (
            <div key={camp.id} className="bg-[#111623] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF2A2A]/5 rounded-full blur-[50px]"></div>
              <h3 className="text-lg font-bold text-[#FF2A2A] uppercase tracking-wider mb-1">{camp.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{camp.description}</p>
              <div className="flex items-center gap-4 text-xs font-mono text-gray-500 mb-6">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {camp.durationWeeks} Weeks</span>
                <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {camp.tasks.length} Tasks/Day</span>
              </div>
              <button 
                onClick={() => handleJoinCamp(camp)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 font-bold uppercase tracking-wider hover:bg-white/10 transition-colors text-sm"
              >
                Join Camp
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allTasksCompleted = selectedCamp.tasks.every(t => t.completed);

  return (
    <div className="h-full p-6 flex flex-col bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <header className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-[#1A2235] rounded-full hover:bg-[#2A3245] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wider text-[#FF2A2A]">{selectedCamp.title}</h1>
            <p className="text-xs text-gray-400 font-mono">Day {selectedCamp.currentDay} of {selectedCamp.durationWeeks * 7}</p>
          </div>
        </div>
        <button onClick={handleQuitCamp} className="text-xs text-gray-500 hover:text-white underline">Quit</button>
      </header>

      <div className="bg-[#111623] border border-white/10 rounded-2xl p-5 mb-8">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-xs text-gray-400 uppercase tracking-widest">Camp Progress</h2>
          <span className="text-sm font-mono text-[#00E5FF]">{selectedCamp.progress}%</span>
        </div>
        <div className="h-1.5 bg-[#0B0F19] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#00E5FF]"
            initial={{ width: 0 }}
            animate={{ width: `${selectedCamp.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4">Today's Tasks</h3>
      
      <div className="space-y-3 flex-1">
        {selectedCamp.tasks.map(task => (
          <div key={task.id} className={`bg-[#1A2235] border ${task.completed ? 'border-[#00E5FF]/50' : 'border-white/5'} rounded-xl p-4 transition-all`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00E5FF]" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <h4 className={`font-bold ${task.completed ? 'text-white' : 'text-gray-300'}`}>{task.title}</h4>
                  <p className="text-xs text-gray-500">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-[#FF2A2A] bg-[#FF2A2A]/10 px-2 py-1 rounded">
                <Zap className="w-3 h-3" /> {task.xpReward}
              </div>
            </div>
            
            {!task.completed && (
              <button 
                onClick={() => onVerifyTask(task)}
                className="w-full mt-3 py-2 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#00E5FF]/20 transition-colors"
              >
                <Play className="w-3 h-3 fill-current" /> Verify with AI
              </button>
            )}
          </div>
        ))}
      </div>

      {allTasksCompleted && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <button 
            onClick={handleCompleteDay}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0088FF] font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.3)] text-black"
          >
            <Trophy className="w-5 h-5" /> Complete Day {selectedCamp.currentDay}
          </button>
        </motion.div>
      )}
    </div>
  );
}
