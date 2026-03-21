import { ArrowLeft, Trophy, Medal, Flame, Star, Shield, Crown } from 'lucide-react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';

const MOCK_LEADERBOARD = [
  { id: '1', name: 'Alex "The Viper" Chen', level: 12, xp: 12450, streak: 14, style: 'Muay Thai' },
  { id: '2', name: 'Sarah "Iron" Jenkins', level: 11, xp: 11200, streak: 8, style: 'BJJ' },
  { id: '3', name: 'Marcus "Bulldozer" Reed', level: 10, xp: 10800, streak: 21, style: 'Wrestling' },
  { id: '4', name: 'Elena "Ghost" Silva', level: 9, xp: 9500, streak: 5, style: 'Boxing' },
  { id: '5', name: 'David "Thunder" Kim', level: 8, xp: 8100, streak: 2, style: 'Kickboxing' },
];

const BADGES = [
  { id: 'first_blood', name: 'First Blood', desc: 'Complete your first video analysis', icon: <Medal className="w-6 h-6 text-yellow-400" /> },
  { id: 'streak_7', name: 'Iron Will', desc: 'Maintain a 7-day training streak', icon: <Flame className="w-6 h-6 text-[#FF2A2A]" /> },
  { id: 'level_5', name: 'Contender', desc: 'Reach Level 5', icon: <Star className="w-6 h-6 text-[#00E5FF]" /> },
  { id: 'camp_completed', name: 'Camp Survivor', desc: 'Complete a full Fight Camp', icon: <Shield className="w-6 h-6 text-purple-500" /> },
];

export default function Leaderboard({ profile, onBack }: { profile: UserProfile, onBack: () => void }) {
  // Insert current user into leaderboard for display purposes
  const allUsers = [...MOCK_LEADERBOARD, { id: 'me', name: 'You', level: profile.level, xp: profile.xp, streak: profile.streak, style: profile.baseStyle }]
    .sort((a, b) => b.xp - a.xp);

  const userRank = allUsers.findIndex(u => u.id === 'me') + 1;

  // Determine earned badges
  const earnedBadges = [];
  if (profile.analysisHistory && profile.analysisHistory.length > 0) earnedBadges.push('first_blood');
  if (profile.streak >= 7) earnedBadges.push('streak_7');
  if (profile.level >= 5) earnedBadges.push('level_5');
  // Assuming camp completion logic would add this badge to profile.badges
  if (profile.badges?.includes('camp_completed')) earnedBadges.push('camp_completed');

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white overflow-hidden relative font-sans">
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-brand-violet/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-teal/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Animated Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
          }} 
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <header className="sticky top-0 z-50 glass-dark px-8 py-6 flex items-center gap-6 border-b border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
        <motion.button 
          whileHover={{ scale: 1.1, x: -4, backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 shadow-xl backdrop-blur-md"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none flex items-center gap-4">
            <Trophy className="w-7 h-7 text-brand-teal drop-shadow-[0_0_12px_rgba(0,245,160,0.6)]" /> 
            <span className="text-gradient">Global Rankings</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1 h-1 bg-brand-teal rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black italic uppercase tracking-[0.4em] text-brand-teal/70">Elite Division Standings</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 hide-scrollbar relative z-10">
        {/* Top 3 Podium - Enhanced 3D */}
        <div className="flex gap-6 mb-16 overflow-x-auto pb-8 hide-scrollbar perspective-1500">
          {allUsers.slice(0, 3).map((user, idx) => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              transition={{ delay: idx * 0.15, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -15, rotateX: 5, scale: 1.05, rotateY: idx === 0 ? 0 : idx === 1 ? -5 : 5 }}
              className={`flex-1 min-w-[200px] glass-dark border rounded-[3rem] p-10 flex flex-col items-center relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] transition-all duration-700 ${
                user.id === 'me' ? 'border-brand-teal/50 bg-brand-teal/10' : 'border-white/15'
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Rank Specific Glows */}
              <div className={`absolute inset-0 opacity-20 ${
                idx === 0 ? 'bg-brand-teal/20' : idx === 1 ? 'bg-gray-400/20' : 'bg-brand-violet/20'
              }`} />
              
              <div className="relative mb-8" style={{ transform: 'translateZ(40px)' }}>
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black italic border-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${
                  idx === 0 ? 'bg-brand-teal/30 border-brand-teal text-brand-teal shadow-brand-teal/30' : 
                  idx === 1 ? 'bg-gray-400/30 border-gray-400 text-gray-400 shadow-gray-400/20' : 
                  'bg-brand-violet/30 border-brand-violet text-brand-violet shadow-brand-violet/20'
                }`}>
                  {user.name[0]}
                </div>
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-black border-2 border-white/20 flex items-center justify-center text-sm font-black italic text-gradient shadow-2xl backdrop-blur-xl"
                >
                  #{idx + 1}
                </motion.div>
              </div>

              <div className="text-center relative z-10" style={{ transform: 'translateZ(20px)' }}>
                <h3 className="text-lg font-black italic uppercase tracking-tighter mb-3 truncate w-full leading-tight text-white/90">{user.name}</h3>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[11px] font-black italic uppercase tracking-[0.25em] text-brand-teal bg-brand-teal/15 px-4 py-1.5 rounded-xl border border-brand-teal/30 shadow-lg">
                    {user.xp.toLocaleString()} XP
                  </p>
                  <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">{user.style}</span>
                </div>
              </div>

              {/* Decorative Rank Icon */}
              {idx === 0 && <Crown className="absolute bottom-4 right-4 w-6 h-6 text-brand-teal/20" />}
            </motion.div>
          ))}
        </div>

        <div className="space-y-6 mb-16">
          <div className="flex items-center justify-between mb-8 px-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-px bg-gradient-to-r from-transparent to-white/20"></div>
              <h2 className="text-[11px] font-black italic uppercase tracking-[0.6em] text-white/40">Leaderboard Feed</h2>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-[10px] font-black italic uppercase tracking-widest text-brand-teal bg-brand-teal/15 px-5 py-2.5 rounded-2xl border border-brand-teal/30 shadow-2xl backdrop-blur-xl"
            >
              Personal Rank: <span className="text-white ml-2">#{userRank}</span>
            </motion.div>
          </div>
          
          <div className="space-y-5">
            {allUsers.map((user, idx) => (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ x: 12, backgroundColor: 'rgba(255,255,255,0.08)', scale: 1.02 }}
                className={`glass-dark border rounded-[2rem] p-6 flex items-center justify-between group transition-all shadow-2xl backdrop-blur-xl relative overflow-hidden ${
                  user.id === 'me' ? 'border-brand-teal/50 bg-brand-teal/10' : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-6 relative z-10">
                  <span className="w-10 text-sm font-black italic text-white/20 group-hover:text-brand-teal transition-colors tracking-tighter">#{idx + 1}</span>
                  <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center font-black italic text-brand-violet text-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform">
                    {user.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                      {user.name}
                      {user.id === 'me' && (
                        <span className="text-[9px] bg-brand-violet text-white px-3 py-1 rounded-xl uppercase tracking-widest font-black shadow-lg">YOU</span>
                      )}
                    </h4>
                    <div className="flex items-center gap-4 text-[10px] text-white/30 font-black italic uppercase tracking-widest mt-2">
                      <div className="flex items-center gap-1.5 text-brand-teal/90">
                        <Flame className="w-3 h-3" />
                        <span>{user.streak}D Streak</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      <span className="text-white/50">Level {user.level}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <div className="text-2xl font-black italic uppercase tracking-tighter text-gradient leading-none">{user.xp.toLocaleString()}</div>
                  <div className="text-[9px] font-black italic uppercase tracking-[0.3em] text-white/20 mt-2">TOTAL XP</div>
                </div>
                
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-16 px-4">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-px bg-gradient-to-r from-transparent to-brand-teal/40"></div>
              <h2 className="text-[11px] font-black italic uppercase tracking-[0.6em] text-white/40">Fighter Achievements</h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-8"></div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {BADGES.map((badge, idx) => {
              const earned = earnedBadges.includes(badge.id);
              return (
                <motion.div 
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -12, scale: 1.05, rotateX: 8 }}
                  className={`glass-dark border rounded-[3rem] p-8 flex flex-col items-center text-center gap-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)] transition-all duration-700 perspective-1500 ${
                    earned ? 'border-brand-teal/50 bg-brand-teal/10' : 'border-white/10 opacity-30 grayscale'
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl border transition-all duration-700 shadow-2xl relative ${
                    earned ? 'bg-brand-teal/25 border-brand-teal/50 text-brand-teal shadow-brand-teal/20' : 'bg-white/5 border-white/10 text-gray-700'
                  }`} style={{ transform: 'translateZ(30px)' }}>
                    {badge.icon}
                    {earned && (
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-brand-teal/20 rounded-3xl blur-xl -z-10"
                      ></motion.div>
                    )}
                  </div>
                  <div style={{ transform: 'translateZ(15px)' }}>
                    <div className="text-sm font-black italic uppercase tracking-[0.25em] text-white leading-tight mb-3">{badge.name}</div>
                    <div className="text-[10px] text-white/40 font-bold leading-relaxed px-4">{badge.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
