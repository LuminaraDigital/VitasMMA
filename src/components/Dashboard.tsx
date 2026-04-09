import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video, Mic, Flame, ChevronRight, Activity, Trophy, Medal, Crown, Coins, Zap, Check, Lock, Edit2, Dumbbell, Target, Brain, Swords, Plus, Wallet, BookOpen } from 'lucide-react';
import { UserProfile } from '../types';
import { AI_COSTS, LEVEL_XP_THRESHOLD, XP_REWARDS } from '../constants';
import Logo from './Logo';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import StrengthLayerDashboard from './StrengthLayerDashboard';
import BuyCoinsModal from './BuyCoinsModal';
import { fetchWithAuth } from '../utils/api';

export default function Dashboard({ profile, onNavigate, onUpdateProfile, onLogout }: { profile: UserProfile, onNavigate: (v: string) => void, onUpdateProfile: (p: UserProfile) => void, onLogout: () => void }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'mma' | 'snc'>('mma');
  const [showBuyCoins, setShowBuyCoins] = useState(false);
  const userFriendlyAddress = useTonAddress();
  const [tonBalance, setTonBalance] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastCoinRegenDate !== today) {
      // Call server to add credits
      fetchWithAuth('/api/add-credits', {
        method: 'POST',
        body: JSON.stringify({ userId: profile.id, amount: AI_COSTS.DAILY_REGEN, source: 'daily_regen' })
      }).then(res => {
        onUpdateProfile({
          ...profile,
          lastCoinRegenDate: today
        });
      }).catch(console.error);
    }
  }, [profile.lastCoinRegenDate, profile.id, onUpdateProfile]);

  useEffect(() => {
    if (userFriendlyAddress) {
      fetch(`https://tonapi.io/v2/accounts/${userFriendlyAddress}`)
        .then(res => res.json())
        .then(data => {
          if (data.balance) {
            setTonBalance((parseInt(data.balance) / 1e9).toFixed(2));
          }
        })
        .catch(console.error);
    } else {
      setTonBalance(null);
    }
  }, [userFriendlyAddress]);

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

  const handleQuestClick = async (questId: string) => {
    if (!profile.dailyQuests) return;
    
    const quest = profile.dailyQuests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    try {
      await fetchWithAuth('/api/complete-quest', {
        method: 'POST',
        body: JSON.stringify({ userId: profile.id, questId })
      });
      
      // The profile will be updated via the onSnapshot listener in App.tsx
    } catch (err) {
      console.error('Error completing quest:', err);
    }
  };

  return (
    <div className="h-full p-4 md:p-6 relative bg-brand-bg text-white overflow-y-auto hide-scrollbar pb-24 selection:bg-brand-teal/30">
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-blue/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[60%] bg-brand-violet/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[40%] h-[40%] bg-brand-teal/8 rounded-full blur-[100px]" />
        
        {/* Animated Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
          }} 
        />
      </div>

      <header className="flex justify-between items-center mb-6 md:mb-10 sticky top-0 z-50 glass-dark p-3 md:p-5 -mx-4 md:-mx-6 px-4 md:px-6 rounded-b-[2rem] md:rounded-b-[3rem] border-b border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
        <div className="flex items-center gap-2 md:gap-5 cursor-pointer group" onClick={() => onNavigate('profile_settings')}>
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.15, rotate: 8 }}
              className="relative z-10"
            >
              <div className="absolute inset-0 bg-brand-teal/30 rounded-full blur-lg md:blur-2xl group-hover:bg-brand-teal/50 transition-colors"></div>
              <Logo className="w-10 h-10 md:w-16 md:h-16 relative z-10 drop-shadow-[0_0_15px_rgba(0,245,160,0.4)]" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-5 md:h-5 bg-brand-teal rounded-full border-2 md:border-4 border-brand-bg shadow-[0_0_20px_rgba(0,245,160,0.9)] z-20"></div>
            </motion.div>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm md:text-2xl font-black uppercase tracking-tighter italic flex flex-col leading-none">
              <span className="text-white/40 text-[7px] md:text-[10px] not-italic font-black tracking-[0.4em] block mb-0.5 md:mb-1.5 opacity-60">ELITE FIGHTER</span>
              <div className="flex items-center gap-1.5">
                <span className="truncate max-w-[80px] md:max-w-none">{profile.firstName || 'Fighter'}</span>
                {profile.isPro ? (
                  <Crown className="w-3 h-3 md:w-5 md:h-5 text-brand-blue shrink-0" />
                ) : (
                  <motion.button 
                    onClick={(e) => { e.stopPropagation(); onNavigate('pro_upgrade'); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-brand-violet text-white text-[7px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] ml-1"
                  >
                    Upgrade
                  </motion.button>
                )}
              </div>
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 md:gap-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <TonConnectButton className="scale-75 md:scale-100 origin-right" />
            </div>
            <button 
              onClick={onLogout}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-end">
            {userFriendlyAddress && tonBalance !== null && (
              <div className="flex items-center gap-1 bg-[#0098EA]/10 px-2 py-0.5 rounded-lg border border-[#0098EA]/20">
                <Wallet className="w-2.5 h-2.5 text-[#0098EA]" />
                <span className="font-mono text-[9px] text-[#0098EA] font-bold">{tonBalance}</span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
              <Flame className="text-brand-teal w-2.5 h-2.5" />
              <span className="font-black font-mono text-[9px] text-white/90">{profile.streak}D</span>
            </div>
            <motion.button 
              onClick={() => setShowBuyCoins(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-brand-violet/10 px-3 py-1.5 rounded-xl border border-brand-violet/30 hover:bg-brand-violet/20 transition-all"
            >
              <Brain className="text-brand-violet w-3.5 h-3.5 md:w-4 md:h-4" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[7px] md:text-[8px] font-black text-brand-violet/60 uppercase tracking-widest">V-COINS</span>
                <span className="font-black font-mono text-xs md:text-sm text-brand-violet">{profile.aiCredits ?? 100}</span>
              </div>
              <Plus className="w-3 h-3 md:w-4 md:h-4 text-brand-violet ml-1" />
            </motion.button>
          </div>
        </div>
      </header>

      {showBuyCoins && <BuyCoinsModal onClose={() => setShowBuyCoins(false)} userId={profile.id} isPro={profile.isPro} profile={profile} onUpdateProfile={onUpdateProfile} />}

      {(profile.aiCredits || 0) < AI_COSTS.VIDEO_ANALYSIS && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-brand-violet/20 to-brand-blue/20 border border-brand-violet/30 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-violet/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-brand-violet" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm md:text-base">🔥 Low V-Coins!</h3>
              <p className="text-gray-400 text-xs md:text-sm">Top up to continue using AI analysis ({AI_COSTS.VIDEO_ANALYSIS} coins/analysis).</p>
            </div>
          </div>
          <button 
            onClick={() => setShowBuyCoins(true)}
            className="w-full md:w-auto px-6 py-2 bg-brand-violet text-white font-bold rounded-xl hover:bg-brand-violet/80 transition-colors whitespace-nowrap text-sm"
          >
            Get V-Coins
          </button>
        </motion.div>
      )}

      {activeTab === 'mma' ? (
        <>
          {/* DNA Card - Premium 3D */}
          <motion.div 
            className="relative glass rounded-[2rem] md:rounded-[3.5rem] p-5 md:p-10 mb-8 md:mb-16 overflow-visible shadow-[0_20px_40px_rgba(0,0,0,0.5)] md:shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/15 group"
            style={{ transformStyle: 'preserve-3d', perspective: 1500 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: tilt.x, rotateY: tilt.y }}
            transition={{ type: 'spring', stiffness: 120, damping: 25 }}
          >
        {/* Animated Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/15 via-transparent to-brand-violet/15 rounded-[2rem] md:rounded-[3.5rem] pointer-events-none group-hover:opacity-100 transition-opacity duration-700 opacity-60"></div>
        <div className="absolute -inset-px bg-gradient-to-br from-white/25 via-transparent to-white/5 rounded-[2rem] md:rounded-[3.5rem] pointer-events-none opacity-40"></div>
        
        {/* Floating Background Icon */}
        <div className="absolute -right-8 md:-right-16 -top-8 md:-top-16 opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12" style={{ transform: 'translateZ(-20px)' }}>
          <Activity className="w-48 h-48 md:w-96 md:h-96 text-brand-teal" />
        </div>
        
        <div className="flex justify-between items-start mb-8 md:mb-16 relative z-10 [transform:translateZ(40px)] md:[transform:translateZ(80px)]">
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
              <motion.div 
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-1 h-1 md:w-2 md:h-2 bg-brand-teal rounded-full shadow-[0_0_12px_rgba(0,245,160,1)]"
              ></motion.div>
              <h2 className="text-[7px] md:text-[10px] text-brand-teal uppercase tracking-[0.3em] md:tracking-[0.6em] font-black drop-shadow-[0_0_12px_rgba(0,245,160,0.6)]">FIGHTER DNA</h2>
            </div>
            <p className="text-lg md:text-3xl font-black italic uppercase tracking-tighter leading-tight flex flex-wrap items-baseline gap-1 md:gap-2">
              <span className="text-white">{profile.baseStyle}</span>
              <span className="text-brand-blue/30 text-sm md:text-2xl">/</span>
              <span className="text-white/80 text-base md:text-2xl">{profile.stance}</span>
            </p>
            {profile.weightClass && (
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-3 md:mt-6">
                <span className="text-[7px] md:text-[10px] text-white/60 uppercase tracking-[0.2em] md:tracking-[0.4em] font-black px-1.5 md:px-3 py-0.5 md:py-1.5 bg-white/5 rounded-md md:rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
                  {profile.weightClass}
                </span>
                <span className="text-[7px] md:text-[10px] text-white/60 uppercase tracking-[0.2em] md:tracking-[0.4em] font-black px-1.5 md:px-3 py-0.5 md:py-1.5 bg-white/5 rounded-md md:rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
                  {profile.weight} LBS
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-[7px] md:text-[10px] text-brand-blue uppercase tracking-[0.3em] md:tracking-[0.6em] font-black mb-1 md:mb-4 drop-shadow-[0_0_12px_rgba(0,217,245,0.6)]">XP PROGRESS</h2>
            <p className="text-lg md:text-3xl font-black font-mono text-brand-blue tracking-tighter leading-none">
              {profile.xp} <span className="text-white/10 text-[10px] md:text-sm font-bold tracking-normal block md:inline mt-0.5 md:mt-0">/ {profile.level * LEVEL_XP_THRESHOLD}</span>
            </p>
          </div>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="h-2 md:h-4 bg-black/50 rounded-full overflow-hidden mb-8 md:mb-16 relative z-10 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] p-0.5 md:p-1" style={{ transform: 'translateZ(30px) md:translateZ(60px)' }}>
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-brand-teal via-brand-blue to-brand-violet relative"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (profile.xp / (profile.level * 1000)) * 100)}%` }}
            transition={{ duration: 2.5, ease: "circOut" }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-40"></div>
            <div className="absolute top-0 right-0 w-12 h-full bg-white/50 blur-xl -skew-x-12 animate-pulse"></div>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-10 relative z-10 [transform:translateZ(50px)] md:[transform:translateZ(100px)]">
          <StatCircle label="STRIKING" value={profile.striking} color="text-brand-teal" glowColor="rgba(0,245,160,0.5)" />
          <StatCircle label="GRAPPLING" value={profile.grappling} color="text-brand-blue" glowColor="rgba(0,217,245,0.5)" />
          <StatCircle label="CLINCH" value={profile.clinch} color="text-brand-violet" glowColor="rgba(168,85,247,0.5)" />
        </div>
      </motion.div>

      <div className="flex items-center justify-between mb-6 md:mb-10">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-8 md:w-12 h-px bg-gradient-to-r from-transparent to-brand-teal/50"></div>
          <h3 className="text-[9px] md:text-[11px] text-white/60 uppercase tracking-[0.4em] md:tracking-[0.6em] font-black italic">Training Hub</h3>
          <div className="w-8 md:w-12 h-px bg-gradient-to-l from-transparent to-brand-teal/50"></div>
        </div>
        <div className="h-px flex-1 bg-white/5 ml-4 md:ml-6"></div>
      </div>

      {/* Actions Grid - Premium Bento Style */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-12 md:mb-16">
        <ActionButton 
          icon={<Dumbbell className="w-6 h-6 md:w-7 md:h-7 text-brand-teal" />} 
          title="Training" 
          subtitle="Refine your arsenal in the hub"
          onClick={() => onNavigate('training_hub')}
          color="teal"
          className="col-span-1 h-48 md:h-56"
        />
        <ActionButton 
          icon={<Trophy className="w-6 h-6 md:w-7 md:h-7 text-yellow-400" />} 
          title="Fight" 
          subtitle="Join the elite camp mode"
          onClick={() => (profile.isPro || (profile.aiCredits || 0) >= AI_COSTS.CAMP_VERIFICATION) ? onNavigate('fight_camp') : setShowBuyCoins(true)}
          color="yellow"
          className="col-span-1 h-48 md:h-56"
          isLocked={!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.CAMP_VERIFICATION}
          cost={profile.isPro ? 0 : AI_COSTS.CAMP_VERIFICATION}
        />
        <ActionButton 
          icon={<Video className="w-6 h-6 md:w-7 md:h-7 text-brand-blue" />} 
          title="AI Video Analysis" 
          subtitle="Frame-by-frame technical breakdown"
          onClick={() => (profile.isPro || (profile.aiCredits || 0) >= AI_COSTS.VIDEO_ANALYSIS) ? onNavigate('video_analysis') : setShowBuyCoins(true)}
          color="blue"
          className="col-span-2 h-32 md:h-36 flex-row items-center"
          isLocked={!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.VIDEO_ANALYSIS}
          cost={profile.isPro ? 0 : AI_COSTS.VIDEO_ANALYSIS}
        />
        <ActionButton 
          icon={<Target className="w-6 h-6 md:w-7 md:h-7 text-emerald-400" />} 
          title="Strength" 
          subtitle="Build the foundation"
          onClick={() => (profile.isPro || (profile.aiCredits || 0) >= AI_COSTS.STRENGTH_LAYER_LOG) ? onNavigate('strength_layer') : setShowBuyCoins(true)}
          color="emerald"
          className="col-span-1 h-40 md:h-48"
          isLocked={!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.STRENGTH_LAYER_LOG}
          cost={profile.isPro ? 0 : AI_COSTS.STRENGTH_LAYER_LOG}
        />
        <ActionButton 
          icon={<Mic className="w-6 h-6 md:w-7 md:h-7 text-brand-violet" />} 
          title="Live Coach" 
          subtitle="Real-time tactical feedback"
          onClick={() => (profile.isPro || (profile.aiCredits || 0) >= AI_COSTS.LIVE_COACH) ? onNavigate('live_coach') : setShowBuyCoins(true)}
          color="violet"
          className="col-span-1 h-40 md:h-48"
          isLocked={!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.LIVE_COACH}
          cost={profile.isPro ? 0 : AI_COSTS.LIVE_COACH}
        />
        <ActionButton 
          icon={<Brain className="w-6 h-6 md:w-7 md:h-7 text-indigo-400" />} 
          title="Strategy Advisor" 
          subtitle="AI-Powered fight intelligence"
          onClick={() => (profile.isPro || (profile.aiCredits || 0) >= AI_COSTS.STRATEGY_ADVISOR) ? onNavigate('strategy_advisor') : setShowBuyCoins(true)}
          color="indigo"
          className="col-span-2 h-32 md:h-36 flex-row items-center"
          isLocked={!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.STRATEGY_ADVISOR}
          cost={profile.isPro ? 0 : AI_COSTS.STRATEGY_ADVISOR}
        />
        <ActionButton 
          icon={<Brain className="w-6 h-6 md:w-7 md:h-7 text-brand-violet" />} 
          title="V-Coins Store" 
          subtitle="Top up your AI Credits"
          onClick={() => setShowBuyCoins(true)}
          color="violet"
          className="col-span-1 h-40 md:h-48"
        />
        <ActionButton 
          icon={<BookOpen className="w-6 h-6 md:w-7 md:h-7 text-brand-teal" />} 
          title="Knowledge Base" 
          subtitle="Manage your RAG library"
          onClick={() => (profile.isPro || (profile.aiCredits || 0) >= AI_COSTS.KNOWLEDGE_BASE_UPLOAD) ? onNavigate('knowledge_base') : setShowBuyCoins(true)}
          color="teal"
          className="col-span-2 h-32 md:h-36 flex-row items-center"
          isLocked={!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.KNOWLEDGE_BASE_UPLOAD}
          cost={profile.isPro ? 0 : AI_COSTS.KNOWLEDGE_BASE_UPLOAD}
        />
      </div>

      <div className="flex items-center justify-between mb-6 md:mb-10">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-8 md:w-12 h-px bg-gradient-to-r from-transparent to-brand-violet/50"></div>
          <h3 className="text-[9px] md:text-[11px] text-white/60 uppercase tracking-[0.4em] md:tracking-[0.6em] font-black italic">Daily Quests</h3>
          <div className="w-8 md:w-12 h-px bg-gradient-to-l from-transparent to-brand-violet/50"></div>
        </div>
        <div className="h-px flex-1 bg-white/5 ml-4 md:ml-6"></div>
      </div>

      <div className="space-y-3 md:space-y-5 mb-10 md:mb-16">
        {profile.dailyQuests?.map((q, idx) => (
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
                : 'glass border-white/10 cursor-pointer hover:border-brand-teal/50 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)]'
            }`}
          >
            {!q.completed && (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            )}
            <div className="flex items-center gap-3 md:gap-6 relative z-10 flex-1 min-w-0">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-xl shrink-0 ${
                q.completed 
                  ? 'border-brand-teal bg-brand-teal/20 rotate-12' 
                  : 'border-white/15 bg-black/40 group-hover:border-brand-teal/60 group-hover:rotate-6'
              }`}>
                {q.completed ? <Check className="w-5 h-5 md:w-6 md:h-6 text-brand-teal" /> : <Zap className="w-5 h-5 md:w-6 md:h-6 text-white/30 group-hover:text-brand-teal transition-colors" />}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <span className={`text-xs md:text-lg tracking-tighter block leading-tight mb-1 md:mb-2 line-clamp-2 ${
                  q.completed ? 'text-white/40 line-through' : 'text-white font-black italic uppercase'
                }`}>{q.desc}</span>
                
                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      {!q.completed && <div className="w-1 h-1 bg-brand-teal rounded-full animate-ping shrink-0"></div>}
                      <span className="text-[8px] md:text-[10px] text-brand-teal font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-80 truncate">
                        {q.completed ? 'Objective Complete' : 'Active Objective'}
                      </span>
                    </div>
                    <span className="text-[8px] md:text-[10px] text-white/70 font-black font-mono">{q.completed ? (q.target || 1) : (q.progress || 0)} / {q.target || 1}</span>
                  </div>
                  <div className="h-1.5 md:h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div 
                      className={`absolute top-0 left-0 h-full rounded-full ${q.completed ? 'bg-brand-teal' : 'bg-gradient-to-r from-brand-teal to-brand-blue'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (q.completed ? 1 : ((q.progress || 0) / (q.target || 1)))) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
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
        </>
      ) : (
        <StrengthLayerDashboard profile={profile} onNavigate={onNavigate} onUpdateProfile={onUpdateProfile} />
      )}

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-white/10 pb-safe">
        <div className="flex justify-around items-center p-2 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('mma')}
            className={`flex flex-col items-center gap-1 p-2 w-1/2 transition-colors ${activeTab === 'mma' ? 'text-brand-teal' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Swords className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">MMA Hub</span>
          </button>
          <button
            onClick={() => setActiveTab('snc')}
            className={`flex flex-col items-center gap-1 p-2 w-1/2 transition-colors ${activeTab === 'snc' ? 'text-brand-blue' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Dumbbell className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">S&C Hub</span>
          </button>
        </div>
      </div>
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
      <span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-white/30 group-hover:text-brand-teal transition-colors text-center leading-tight">{label}</span>
    </div>
  );
}

function ActionButton({ icon, title, subtitle, onClick, color, className, isLocked, cost }: any) {
  const colors: any = {
    teal: 'hover:border-brand-teal/50 hover:shadow-[0_0_40px_rgba(0,245,160,0.2)]',
    blue: 'hover:border-brand-blue/50 hover:shadow-[0_0_40px_rgba(0,217,245,0.2)]',
    violet: 'hover:border-brand-violet/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]',
    yellow: 'hover:border-yellow-400/50 hover:shadow-[0_0_40px_rgba(250,204,21,0.2)]',
    emerald: 'hover:border-emerald-400/50 hover:shadow-[0_0_40px_rgba(52,211,153,0.2)]',
    indigo: 'hover:border-indigo-400/50 hover:shadow-[0_0_40px_rgba(129,140,248,0.2)]',
  };

  const bgGlows: any = {
    teal: 'bg-brand-teal/5',
    blue: 'bg-brand-blue/5',
    violet: 'bg-brand-violet/5',
    yellow: 'bg-yellow-400/5',
    emerald: 'bg-emerald-400/5',
    indigo: 'bg-indigo-400/5',
  };

  const iconGlows: any = {
    teal: 'shadow-[0_0_20px_rgba(0,245,160,0.3)]',
    blue: 'shadow-[0_0_20px_rgba(0,217,245,0.3)]',
    violet: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    yellow: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]',
    emerald: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]',
    indigo: 'shadow-[0_0_20px_rgba(129,140,248,0.3)]',
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
        {cost && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-brand-violet bg-brand-violet/10 px-2 py-0.5 rounded-full border border-brand-violet/20">
              {cost} V-Coins
            </span>
          </div>
        )}
      </div>
      <div className="absolute top-4 right-4 md:top-8 md:right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
        <ChevronRight className={`w-4 h-4 md:w-6 md:h-6 ${color === 'teal' ? 'text-brand-teal' : 'text-white/40'}`} />
      </div>
    </motion.button>
  );
}
