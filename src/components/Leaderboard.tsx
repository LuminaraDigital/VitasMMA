import { ArrowLeft, Trophy, Medal, Flame, Star, Shield } from 'lucide-react';
import { UserProfile } from '../types';

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
    <div className="h-full p-6 flex flex-col bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <header className="flex items-center gap-4 mb-8 shrink-0">
        <button onClick={onBack} className="p-2 bg-[#1A2235] rounded-full hover:bg-[#2A3245] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Rankings & Badges
        </h1>
      </header>

      <main className="flex-1 flex flex-col gap-8">
        {/* Badges Section */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Your Badges</h2>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map(badge => {
              const earned = earnedBadges.includes(badge.id);
              return (
                <div key={badge.id} className={`p-3 rounded-xl border ${earned ? 'border-[#00E5FF]/30 bg-[#1A2235]' : 'border-white/5 bg-black/20 opacity-50'} flex flex-col items-center text-center gap-2`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${earned ? 'bg-black/50' : 'bg-white/5 grayscale'}`}>
                    {badge.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase">{badge.name}</div>
                    <div className="text-[10px] text-gray-400 leading-tight mt-1">{badge.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Leaderboard Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Global Leaderboard</h2>
            <div className="text-xs font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-1 rounded">Your Rank: #{userRank}</div>
          </div>
          
          <div className="bg-[#1A2235] rounded-2xl border border-white/10 overflow-hidden">
            {allUsers.map((user, idx) => (
              <div key={user.id} className={`flex items-center p-4 border-b border-white/5 last:border-0 ${user.id === 'me' ? 'bg-[#00E5FF]/10' : ''}`}>
                <div className="w-6 text-center font-mono font-bold text-gray-500 mr-3">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm flex items-center gap-2">
                    {user.name}
                    {user.id === 'me' && <span className="text-[10px] bg-[#FF2A2A] text-white px-1.5 py-0.5 rounded uppercase">You</span>}
                  </div>
                  <div className="text-xs text-gray-400">{user.style} • Lvl {user.level}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#00E5FF]">{user.xp.toLocaleString()} XP</div>
                  <div className="text-xs text-[#FF2A2A] flex items-center justify-end gap-1 mt-0.5">
                    <Flame className="w-3 h-3" /> {user.streak} Day Streak
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
