import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Video, Mic, Flame, ShieldAlert, ChevronRight, Activity, Trophy, Medal, Crown, Coins, Zap, Check, Lock, Edit2, Dumbbell, Target } from 'lucide-react';
import { UserProfile } from '../types';

export default function Dashboard({ profile, onNavigate, onUpdateProfile }: { profile: UserProfile, onNavigate: (v: string) => void, onUpdateProfile: (p: UserProfile) => void }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setTilt({
      x: ((y - centerY) / centerY) * -15,
      y: ((x - centerX) / centerX) * 15
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleQuestClick = (questId: string) => {
    if (!profile.dailyQuests) return;
    
    const quest = profile.dailyQuests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    const updatedQuests = profile.dailyQuests.map(q => 
      q.id === questId ? { ...q, completed: true } : q
    );

    const newXp = profile.xp + 250;
    const newLevel = Math.floor(newXp / 1000) + 1;

    onUpdateProfile({
      ...profile,
      coins: (profile.coins || 0) + quest.reward,
      xp: newXp,
      level: newLevel,
      dailyQuests: updatedQuests
    });
  };

  return (
    <div className="h-full p-6 relative bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar pb-12">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E5FF]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('profile_settings')}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF2A2A] to-[#00E5FF] flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B0F19] rounded-full flex items-center justify-center">
              <ShieldAlert className="text-[#00E5FF] w-6 h-6" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider italic flex items-center gap-2">
              {profile.firstName ? `${profile.firstName} ` : ''}
              {profile.nickname ? `"${profile.nickname}" ` : ''}
              {profile.lastName ? profile.lastName : 'Fighter'}
              {profile.isPro && <Crown className="w-5 h-5 text-[#00E5FF]" />}
            </h1>
            <p className="text-xs text-[#00E5FF] font-mono group-hover:text-white transition-colors flex items-center gap-1">
              {profile.archetype} • LVL {profile.level} <Edit2 className="w-3 h-3 ml-1" />
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-[#1A2235] px-3 py-1.5 rounded-full border border-[#FF2A2A]/30 shadow-[0_0_10px_rgba(255,42,42,0.1)]">
            <Flame className="text-[#FF2A2A] w-4 h-4" />
            <span className="font-bold font-mono">{profile.streak}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1A2235] px-3 py-1.5 rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
            <Coins className="text-yellow-500 w-4 h-4" />
            <span className="font-bold font-mono text-yellow-500">{profile.coins || 0}</span>
          </div>
        </div>
      </header>

      {/* DNA Card */}
      <motion.div 
        className="relative bg-[#111623] rounded-2xl p-6 mb-8 border border-[#1A2235] overflow-visible shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, opacity: { duration: 0.5 }, y: { duration: 0.5 } }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(125deg,transparent_20%,rgba(0,229,255,0.03)_40%,rgba(255,42,42,0.03)_60%,transparent_80%)] bg-[length:200%_200%] animate-[pulse_4s_ease-in-out_infinite] pointer-events-none rounded-2xl"></div>
        
        <div className="absolute -right-10 -top-10 opacity-5" style={{ transform: 'translateZ(10px)' }}>
          <Activity className="w-64 h-64" />
        </div>
        
        <div className="flex justify-between items-end mb-2 relative z-10" style={{ transform: 'translateZ(30px)' }}>
          <div>
            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-1">Fighter DNA</h2>
            <p className="text-lg font-bold">{profile.baseStyle} • {profile.stance}</p>
            {profile.weightClass && <p className="text-xs text-[#00E5FF] mt-1 uppercase tracking-wider">{profile.weightClass} ({profile.weight} lbs)</p>}
          </div>
          <div className="text-right">
            <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-1">XP</h2>
            <p className="text-lg font-mono text-[#00E5FF]">{profile.xp} / {profile.level * 1000}</p>
          </div>
        </div>
        
        <div className="h-1 bg-[#0B0F19] rounded-full overflow-hidden mb-6 relative z-10" style={{ transform: 'translateZ(20px)' }}>
          <motion.div 
            className="h-full bg-[#00E5FF]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (profile.xp / (profile.level * 1000)) * 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        <div className="space-y-4 relative z-10" style={{ transform: 'translateZ(40px)' }}>
          <StatBar label="Striking" value={profile.striking} color="bg-[#FF2A2A]" />
          <StatBar label="Grappling" value={profile.grappling} color="bg-[#00E5FF]" />
          <StatBar label="Clinch" value={profile.clinch} color="bg-purple-500" />
        </div>
      </motion.div>

      <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4">Today's Session</h3>

      {/* Actions */}
      <div className="grid gap-4 mb-8">
        <ActionButton 
          icon={<Dumbbell className="w-6 h-6 text-[#00E5FF]" />} 
          title="Training Hub" 
          subtitle="Unlock Modules & Track Progress"
          onClick={() => onNavigate('training_hub')}
          border="border-[#00E5FF]/30"
          bg="bg-[#00E5FF]/5"
        />
        <ActionButton 
          icon={<Trophy className="w-6 h-6 text-yellow-400" />} 
          title={profile.activeCamp ? "Continue Fight Camp" : "Join Fight Camp"} 
          subtitle={profile.activeCamp ? `${profile.activeCamp.title} - Day ${profile.activeCamp.currentDay}` : "Structured 4-8 week programs"}
          onClick={() => onNavigate('fight_camp')}
          border="border-yellow-400/30"
          bg="bg-yellow-400/5"
        />
        <ActionButton 
          icon={<Video className="w-6 h-6 text-[#FF2A2A]" />} 
          title="Record Training" 
          subtitle="AI Video Analysis"
          onClick={() => onNavigate('video_analysis')}
          border="border-[#FF2A2A]/30"
          bg="bg-[#FF2A2A]/5"
        />
        <ActionButton 
          icon={<Target className="w-6 h-6 text-green-400" />} 
          title="Strength Layer" 
          subtitle="MMA Foundation (20-30 min)"
          onClick={() => onNavigate('strength_layer')}
          border="border-green-400/30"
          bg="bg-green-400/5"
        />
        <ActionButton 
          icon={<Mic className="w-6 h-6 text-[#00E5FF]" />} 
          title="Voice Coach" 
          subtitle="Live Gemini Feedback"
          onClick={() => onNavigate('live_coach')}
          border="border-[#00E5FF]/30"
          bg="bg-[#00E5FF]/5"
        />
        {!profile.isPro && (
          <ActionButton 
            icon={<Lock className="w-6 h-6 text-gray-500" />} 
            title="Advanced Fight IQ" 
            subtitle="Unlock PRO Analysis"
            onClick={() => onNavigate('pro_upgrade')}
            border="border-gray-700"
            bg="bg-gray-900/50"
            isLocked={true}
          />
        )}
      </div>

      <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4">Daily Quests</h3>
      <div className="space-y-3">
        {profile.dailyQuests?.map(q => (
          <motion.div 
            key={q.id} 
            whileHover={{ scale: q.completed ? 1 : 1.02 }}
            onClick={() => handleQuestClick(q.id)}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${q.completed ? 'bg-[#1A2235]/20 border-white/5 opacity-60' : 'bg-[#1A2235]/60 border-[#00E5FF]/20 cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.1)] hover:border-[#00E5FF]/50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.completed ? 'border-[#00E5FF] bg-[#00E5FF]/20' : 'border-gray-600'}`}>
                {q.completed && <Check className="w-3 h-3 text-[#00E5FF]" />}
              </div>
              <span className={`text-sm ${q.completed ? 'text-gray-400 line-through' : 'text-white font-medium'}`}>{q.desc}</span>
            </div>
            <div className={`flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-md ${q.completed ? 'text-gray-500 bg-gray-800' : 'text-yellow-500 bg-yellow-500/10'}`}>
              <Coins className="w-3 h-3" /> +{q.reward}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="uppercase tracking-wider text-gray-300">{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-1.5 bg-[#0B0F19] rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function ActionButton({ icon, title, subtitle, onClick, border, bg, isLocked }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 rounded-2xl border ${border} ${bg} flex items-center justify-between transition-all hover:bg-opacity-20 relative overflow-hidden`}
    >
      {isLocked && <div className="absolute inset-0 bg-black/40 z-0"></div>}
      <div className="flex items-center gap-4 relative z-10">
        <div className="p-3 bg-[#0B0F19] rounded-xl border border-white/5 shadow-inner">
          {icon}
        </div>
        <div className="text-left">
          <h3 className={`font-bold text-lg ${isLocked ? 'text-gray-400' : 'text-white'}`}>{title}</h3>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className={`relative z-10 ${isLocked ? 'text-gray-600' : 'text-gray-500'}`} />
    </motion.button>
  );
}
