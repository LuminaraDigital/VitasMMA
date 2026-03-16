import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, User, Scale, Ruler } from 'lucide-react';
import { UserProfile } from '../types';
import { getWeightClassInfo } from '../utils/mma';

export default function ProfileSettings({ profile, onUpdateProfile, onBack }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void }) {
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [nickname, setNickname] = useState(profile.nickname || '');
  const [height, setHeight] = useState(profile.height || '');
  const [weight, setWeight] = useState(profile.weight?.toString() || '');

  const getWeightClass = (wStr: string) => {
    const w = parseFloat(wStr);
    if (!w || isNaN(w)) return 'Unknown';
    const { currentClass } = getWeightClassInfo(profile.gender || 'Male', w);
    return currentClass.name;
  };

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      firstName,
      lastName,
      nickname,
      height,
      weight: parseFloat(weight) || 0,
      weightClass: getWeightClass(weight)
    });
    onBack();
  };

  return (
    <div className="h-full flex flex-col p-6 relative bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#FF2A2A]/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-[#00E5FF]/20 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="flex justify-between items-center mb-8 relative z-10">
        <button onClick={onBack} className="p-2 bg-[#1A2235] rounded-full hover:bg-gray-800 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest italic">Fighter Profile</h1>
        <div className="w-9"></div>
      </header>

      <div className="flex-1 space-y-6 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF2A2A] to-[#00E5FF] p-1 shadow-[0_0_30px_rgba(0,229,255,0.2)] mb-4">
            <div className="w-full h-full bg-[#0B0F19] rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-[#00E5FF]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">
            {firstName} {nickname ? `"${nickname}"` : ''} {lastName}
          </h2>
          <p className="text-[#00E5FF] font-mono text-sm mt-1">{getWeightClass(weight)}</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">First Name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none transition-colors" placeholder="First Name" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none transition-colors" placeholder="Last Name" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Fight Nickname</label>
            <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none transition-colors" placeholder="Nickname" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Ruler className="w-3 h-3" /> Height</label>
              <input type="text" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none transition-colors" placeholder="e.g. 5'10&quot;" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Scale className="w-3 h-3" /> Weight (lbs)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-[#1A2235] border border-gray-800 rounded-xl p-3 text-white focus:border-[#FF2A2A] outline-none transition-colors" placeholder="Weight" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#aa1111] font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,42,42,0.3)] transition-all"
        >
          <Save className="w-5 h-5" /> Save Profile
        </motion.button>
      </div>
    </div>
  );
}
