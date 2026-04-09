import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, CheckCircle2, Circle, Play, ShieldAlert, Zap, Activity, Calendar } from 'lucide-react';
import { UserProfile, FightCamp as FightCampType, CampTask } from '../types';
import { CAMP_XP_REWARDS } from '../constants';

const AVAILABLE_CAMPS: FightCampType[] = [
  {
    id: 'striking_camp_1',
    title: 'Striking Fundamentals',
    description: '4-week camp focusing on boxing and kickboxing basics. Perfect for building a solid foundation.',
    durationWeeks: 4,
    currentDay: 1,
    progress: 0,
    tasks: [
      { id: 't1', title: 'Jab Cross Mechanics', description: 'Throw 50 reps of 1-2 combos', type: 'drill', priority: 'High', verificationCriteria: 'Confirm 50+ punches thrown. Check if rear heel is planted on the cross and hands return to guard.', completed: false, xpReward: CAMP_XP_REWARDS.DRILL_HIGH },
      { id: 't2', title: 'Shadowboxing Flow', description: '3 minutes continuous movement', type: 'conditioning', priority: 'Medium', verificationCriteria: 'Confirm continuous movement for at least 60 seconds in the clip. Check head movement and footwork.', completed: false, xpReward: CAMP_XP_REWARDS.CONDITIONING_MEDIUM },
      { id: 't3', title: 'Active Recovery', description: '10 mins stretching', type: 'recovery', priority: 'Low', verificationCriteria: 'Confirm user is performing static or dynamic stretches.', completed: false, xpReward: CAMP_XP_REWARDS.RECOVERY_LOW },
      { id: 't4', title: 'Lead Hook Pivot', description: '25 reps of lead hook with pivot', type: 'drill', priority: 'High', verificationCriteria: 'Confirm 25+ lead hooks thrown. Check if lead foot pivots correctly and weight transfers.', completed: false, xpReward: CAMP_XP_REWARDS.DRILL_HIGH },
      { id: 't5', title: 'Jump Rope', description: '5 minutes of jump rope', type: 'conditioning', priority: 'Medium', verificationCriteria: 'Confirm continuous jump rope for at least 60 seconds in the clip.', completed: false, xpReward: CAMP_XP_REWARDS.CONDITIONING_MEDIUM }
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
      { id: 't6', title: 'Heavy Bag Sprints', description: '5 rounds of 3 mins on the bag', type: 'conditioning', priority: 'High', verificationCriteria: 'Confirm high intensity striking on a heavy bag. Check for power and volume.', completed: false, xpReward: CAMP_XP_REWARDS.CONDITIONING_HIGH },
      { id: 't7', title: 'Sprawl & Brawl', description: '20 sprawls into 1-2 combos', type: 'drill', priority: 'High', verificationCriteria: 'Confirm user is sprawling and immediately throwing a 1-2 combo upon standing.', completed: false, xpReward: CAMP_XP_REWARDS.DRILL_HIGH },
    ]
  }
];

export default function FightCamp({ profile, onUpdateProfile, onBack, onVerifyTask }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void, onVerifyTask: (task: CampTask) => void }) {
  const [selectedCamp, setSelectedCamp] = useState<FightCampType | null>(profile.activeCamp || null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  useEffect(() => {
    if (selectedCamp?.startDate) {
      const start = new Date(selectedCamp.startDate);
      const now = new Date();
      const diffTime = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (diffDays !== selectedCamp.currentDay && diffDays > 0) {
        const updatedCamp = { ...selectedCamp, currentDay: diffDays };
        setSelectedCamp(updatedCamp);
        onUpdateProfile({ ...profile, activeCamp: updatedCamp });
      }
    }
  }, [selectedCamp?.startDate, profile, onUpdateProfile]);

  useEffect(() => {
    if (selectedCamp && (!selectedCamp.tasks || selectedCamp.tasks.length === 0)) {
      const defaultTasks: CampTask[] = [
        { id: 't1', title: 'Jab Cross Mechanics', description: 'Throw 50 reps of 1-2 combos', type: 'drill', priority: 'High', verificationCriteria: 'Confirm 50+ punches thrown. Check if rear heel is planted on the cross and hands return to guard.', completed: false, xpReward: CAMP_XP_REWARDS.DRILL_HIGH },
        { id: 't2', title: 'Shadowboxing Flow', description: '3 minutes continuous movement', type: 'conditioning', priority: 'Medium', verificationCriteria: 'Confirm continuous movement for at least 60 seconds in the clip. Check head movement and footwork.', completed: false, xpReward: CAMP_XP_REWARDS.CONDITIONING_MEDIUM },
        { id: 't3', title: 'Active Recovery', description: '10 mins stretching', type: 'recovery', priority: 'Low', verificationCriteria: 'Confirm user is performing static or dynamic stretches.', completed: false, xpReward: CAMP_XP_REWARDS.RECOVERY_LOW },
        { id: 't4', title: 'Lead Hook Pivot', description: '25 reps of lead hook with pivot', type: 'drill', priority: 'High', verificationCriteria: 'Confirm 25+ lead hooks thrown. Check if lead foot pivots correctly and weight transfers.', completed: false, xpReward: CAMP_XP_REWARDS.DRILL_HIGH },
        { id: 't5', title: 'Jump Rope', description: '5 minutes of jump rope', type: 'conditioning', priority: 'Medium', verificationCriteria: 'Confirm continuous jump rope for at least 60 seconds in the clip.', completed: false, xpReward: CAMP_XP_REWARDS.CONDITIONING_MEDIUM }
      ];
      
      const updatedCamp = { ...selectedCamp, tasks: defaultTasks };
      setSelectedCamp(updatedCamp);
      onUpdateProfile({ ...profile, activeCamp: updatedCamp });
    }
  }, [selectedCamp, profile, onUpdateProfile]);

  const handleJoinCamp = (camp: FightCampType) => {
    const updatedCamp = { ...camp, startDate: new Date().toISOString() };
    const newProfile = { ...profile, activeCamp: updatedCamp };
    onUpdateProfile(newProfile);
    setSelectedCamp(updatedCamp);
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
    setShowQuitConfirm(true);
  };

  const handleTogglePriority = (taskId: string) => {
    if (!selectedCamp) return;
    
    const priorities: ('High' | 'Medium' | 'Low')[] = ['Low', 'Medium', 'High'];
    const updatedTasks = selectedCamp.tasks.map(t => {
      if (t.id === taskId) {
        const currentIndex = priorities.indexOf(t.priority);
        const nextIndex = (currentIndex + 1) % priorities.length;
        return { ...t, priority: priorities[nextIndex] };
      }
      return t;
    });

    const updatedCamp = { ...selectedCamp, tasks: updatedTasks };
    setSelectedCamp(updatedCamp);
    onUpdateProfile({ ...profile, activeCamp: updatedCamp });
  };

  const confirmQuitCamp = () => {
    const newProfile = { ...profile, activeCamp: null };
    onUpdateProfile(newProfile);
    setSelectedCamp(null);
    setShowQuitConfirm(false);
  };

  if (!selectedCamp) {
    return (
      <div className="h-full flex flex-col bg-brand-bg text-white overflow-hidden relative font-sans">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-violet/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
        </div>

        <header className="sticky top-0 z-50 glass-dark px-4 md:px-6 py-4 md:py-5 flex items-center gap-4 border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <motion.button 
            whileHover={{ scale: 1.1, x: -2, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack} 
            className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-gradient leading-none">Fight Camps</h1>
            <span className="text-[8px] font-black italic uppercase tracking-[0.3em] text-brand-teal/60 mt-1">Structured Evolution</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 hide-scrollbar relative z-10">
          <div className="mb-6 md:mb-10 px-2">
            <h2 className="text-xs font-black italic uppercase tracking-[0.3em] text-brand-teal mb-3">Select a Program</h2>
            <p className="text-sm text-gray-400 font-bold leading-relaxed">Commit to a 4-8 week structured program. Complete daily tasks, verify with AI, and earn exclusive badges.</p>
          </div>

          <div className="space-y-6 md:space-y-8">
            {AVAILABLE_CAMPS.map((camp, idx) => (
              <motion.div 
                key={camp.id} 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8, rotateX: 2, scale: 1.02 }}
                className="glass-dark border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.5)] md:shadow-[0_30px_60px_rgba(0,0,0,0.5)] perspective-1000"
              >
                <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-brand-violet/10 rounded-full blur-[60px] md:blur-[80px] group-hover:bg-brand-violet/20 transition-colors duration-500" />
                <div className="relative z-10">
                  <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-gradient mb-2 md:mb-3">{camp.title}</h3>
                  <p className="text-xs md:text-sm text-gray-400 mb-6 md:mb-8 font-bold leading-relaxed">{camp.description}</p>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-500 mb-8 md:mb-10">
                    <span className="flex items-center gap-2 bg-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-white/10 shadow-md backdrop-blur-md">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-teal" /> {camp.durationWeeks} Weeks
                    </span>
                    <span className="flex items-center gap-2 bg-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-white/10 shadow-md backdrop-blur-md">
                      <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-violet" /> {camp.tasks.length} Tasks/Day
                    </span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleJoinCamp(camp)}
                    className="w-full py-3 md:py-5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 font-black italic uppercase tracking-widest hover:bg-white/10 transition-all text-xs md:text-sm shadow-2xl group-hover:border-brand-teal/30 group-hover:shadow-brand-teal/10"
                  >
                    Join Camp
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allTasksCompleted = selectedCamp.tasks.every(t => t.completed);
  const completedTasksCount = selectedCamp.tasks.filter(t => t.completed).length;
  const totalTasksCount = selectedCamp.tasks.length;
  const dailyProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  
  const totalDays = selectedCamp.durationWeeks * 7;
  const completedDays = selectedCamp.currentDay - 1;
  const overallProgress = Math.round(((completedDays + (totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0)) / totalDays) * 100);

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white overflow-hidden relative font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-violet/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
      </div>

      <header className="sticky top-0 z-50 glass-dark px-4 md:px-6 py-4 md:py-5 flex justify-between items-center border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3 md:gap-4">
          <motion.button 
            whileHover={{ scale: 1.1, x: -2, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack} 
            className="p-2 md:p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-black italic uppercase tracking-tighter text-gradient leading-none">{selectedCamp.title}</h1>
            <span className="text-[7px] md:text-[8px] font-black italic uppercase tracking-[0.3em] text-brand-teal/60 mt-1">Day {selectedCamp.currentDay} of {selectedCamp.durationWeeks * 7}</span>
          </div>
        </div>
        <button onClick={handleQuitCamp} className="text-[8px] md:text-[10px] font-black italic uppercase tracking-widest text-gray-500 hover:text-brand-violet transition-colors">Quit Camp</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 hide-scrollbar relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02 }}
          className="glass-dark border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 mb-8 md:mb-12 shadow-[0_20px_40px_rgba(0,0,0,0.5)] md:shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group perspective-1000"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
              <h2 className="text-[10px] font-black italic uppercase tracking-[0.4em] text-brand-teal mb-1">Camp Progress</h2>
              <span className="text-[8px] font-black italic uppercase tracking-[0.2em] text-gray-400">Day {selectedCamp.currentDay} of {selectedCamp.durationWeeks * 7}</span>
            </div>
            <span className="text-2xl font-black italic uppercase tracking-tighter text-gradient">{overallProgress}%</span>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-brand-teal via-brand-blue to-brand-violet relative"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 2, ease: "circOut" }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
              </motion.div>
            </div>
            
            <div className="flex gap-0.5 md:gap-1 w-full">
              {Array.from({ length: selectedCamp.durationWeeks * 7 }).map((_, i) => {
                const isCompleted = i < selectedCamp.currentDay - 1;
                const isCurrent = i === selectedCamp.currentDay - 1;
                
                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className={`h-1.5 md:h-2 flex-1 rounded-full ${
                      isCompleted 
                        ? 'bg-brand-teal shadow-[0_0_5px_rgba(0,245,160,0.5)]' 
                        : isCurrent 
                          ? 'bg-brand-violet animate-pulse shadow-[0_0_8px_rgba(157,78,221,0.8)]' 
                          : 'bg-white/10'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="mb-6 px-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-black italic uppercase tracking-[0.5em] text-white/40">Today's Tasks</h3>
            <span className="text-[10px] font-black italic uppercase tracking-widest text-brand-teal">{completedTasksCount}/{totalTasksCount} Completed</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-brand-teal to-brand-blue"
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        
        <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
          {selectedCamp.tasks.map((task, idx) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ x: 6, scale: 1.02 }}
              className={`glass-dark border transition-all duration-500 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] md:shadow-[0_15px_40px_rgba(0,0,0,0.3)] perspective-1000 ${task.completed ? 'border-brand-teal/40 bg-brand-teal/5' : 'border-white/5 bg-white/[0.02]'}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-4 md:mb-6">
                <div className="flex items-center gap-3 md:gap-5">
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-lg shrink-0 ${task.completed ? 'bg-brand-teal/20 border-brand-teal/40' : 'bg-black/40 border-white/10'}`}>
                    <AnimatePresence mode="wait">
                      {task.completed ? (
                        <motion.div
                          key="completed"
                          initial={{ scale: 0, opacity: 0, rotate: -180 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0, rotate: 180 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                          <CheckCircle2 className="w-5 h-5 md:w-8 md:h-8 text-brand-teal drop-shadow-[0_0_8px_rgba(0,245,160,0.5)]" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="incomplete"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Circle className="w-5 h-5 md:w-8 md:h-8 text-gray-700" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-base md:text-xl font-black italic uppercase tracking-tighter transition-colors leading-tight ${task.completed ? 'text-white' : 'text-gray-300'}`}>{task.title}</h4>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePriority(task.id);
                        }}
                        className={`text-[7px] md:text-[9px] font-black italic uppercase tracking-widest px-1.5 md:px-2 py-0.5 md:py-1 rounded border transition-colors ${
                          task.priority === 'High' 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : task.priority === 'Medium'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {task.priority}
                      </motion.button>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 font-bold mt-1">{task.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-black italic uppercase tracking-widest text-brand-violet bg-brand-violet/10 px-2 md:px-3 py-1 md:py-2 rounded-lg md:rounded-xl border border-brand-violet/20 shadow-md shrink-0 self-start md:self-auto">
                  <Zap className="w-2.5 h-2.5 md:w-3 md:h-3" /> {task.xpReward} XP
                </div>
              </div>
              
              {!task.completed && (
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2, backgroundColor: 'rgba(0,245,160,0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onVerifyTask(task)}
                  className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl bg-brand-teal/10 text-brand-teal text-[10px] md:text-xs font-black italic uppercase tracking-widest border border-brand-teal/20 flex items-center justify-center gap-2 md:gap-3 hover:bg-brand-teal/20 transition-all shadow-xl backdrop-blur-md"
                >
                  <Play className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" /> Verify with AI
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>

        {allTasksCompleted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="pb-8 md:pb-12"
          >
            <motion.button 
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCompleteDay}
              className="w-full py-4 md:py-6 rounded-2xl md:rounded-[2rem] bg-gradient-to-r from-brand-teal via-brand-blue to-brand-violet font-black text-xl md:text-2xl italic uppercase tracking-tighter flex items-center justify-center gap-3 md:gap-4 shadow-[0_15px_40px_rgba(0,229,255,0.4)] md:shadow-[0_20px_60px_rgba(0,229,255,0.4)] text-black relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Trophy className="w-5 h-5 md:w-7 md:h-7 relative z-10" /> 
              <span className="relative z-10">Complete Day {selectedCamp.currentDay}</span>
            </motion.button>
          </motion.div>
        )}
      </div>

      {showQuitConfirm && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-dark border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 mx-auto">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-center mb-2">Quit Camp?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">Are you sure you want to quit this camp? All progress will be lost.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-bold text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmQuitCamp}
                className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors font-bold text-sm"
              >
                Quit Camp
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
