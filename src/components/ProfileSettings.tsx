import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, User, Scale, Ruler, Activity } from 'lucide-react';
import { UserProfile } from '../types';
import { getWeightClassInfo } from '../utils/mma';

export default function ProfileSettings({ profile, onUpdateProfile, onBack }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void }) {
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [nickname, setNickname] = useState(profile.nickname || '');
  const [height, setHeight] = useState(profile.height || '');
  const [weight, setWeight] = useState(profile.weight?.toString() || '');
  
  const [striking, setStriking] = useState(profile.striking || 50);
  const [grappling, setGrappling] = useState(profile.grappling || 50);
  const [clinch, setClinch] = useState(profile.clinch || 50);

  const getWeightClass = (wStr: string) => {
    const w = parseFloat(wStr);
    if (!w || isNaN(w)) return 'Unknown';
    const { currentClass } = getWeightClassInfo(profile.gender || 'Male', w);
    return currentClass.name;
  };

  const getArchetype = () => {
    if (striking > 70 && grappling < 40) return 'Pressure Striker';
    if (grappling > 70 && striking < 40) return 'Submission Specialist';
    if (striking > 60 && grappling > 60) return 'Well-Rounded';
    if (clinch > 70) return 'Grinder';
    return 'Prospect';
  };

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      firstName,
      lastName,
      nickname,
      height,
      weight: parseFloat(weight) || 0,
      weightClass: getWeightClass(weight),
      striking,
      grappling,
      clinch,
      archetype: getArchetype()
    });
    onBack();
  };

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-violet/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <header className="sticky top-0 z-50 glass-dark px-6 py-4 flex items-center gap-4 border-b border-white/5">
        <motion.button 
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </motion.button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-gradient">Fighter Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar relative z-10">
        <div className="space-y-8">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-brand-teal to-brand-violet p-1 shadow-[0_0_30px_rgba(168,85,247,0.3)] mb-4"
            >
              <div className="w-full h-full rounded-[1.8rem] bg-brand-bg flex items-center justify-center">
                <User className="w-10 h-10 text-brand-teal" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-center">
              {firstName} {nickname ? `"${nickname}"` : ''} {lastName}
            </h2>
            <p className="text-[10px] font-black italic uppercase tracking-widest text-brand-teal mt-1">{getWeightClass(weight)}</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2">Fight Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="The Beast"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2 flex items-center gap-2">
                  <Ruler className="w-3 h-3" /> Height
                </label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 5'10"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black italic uppercase tracking-widest text-gray-400 ml-2 flex items-center gap-2">
                  <Scale className="w-3 h-3" /> Weight (lbs)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-6">Fighter Attributes</h3>
              
              <div className="space-y-6">
                <Slider label="Striking" value={striking} onChange={setStriking} color="bg-brand-violet" />
                <Slider label="Grappling" value={grappling} onChange={setGrappling} color="bg-brand-teal" />
                <Slider label="Clinch" value={clinch} onChange={setClinch} color="bg-brand-blue" />
              </div>

              <div className="mt-8 glass border border-brand-teal/30 bg-brand-teal/5 rounded-2xl p-6 text-center relative overflow-hidden">
                <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-brand-teal/5" />
                <div className="relative z-10">
                  <p className="text-[10px] font-black italic uppercase tracking-widest text-brand-teal mb-1">Current Archetype</p>
                  <p className="text-2xl font-black italic uppercase tracking-tighter text-white">{getArchetype()}</p>
                </div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-brand-teal to-brand-blue font-black text-xl italic uppercase tracking-tighter flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(0,229,255,0.4)] text-black"
          >
            <Save className="w-6 h-6" /> Save Profile
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, color }: { label: string, value: number, onChange: (v: number) => void, color: string }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-2">
        <span className="text-[10px] font-black italic uppercase tracking-widest text-gray-400">{label}</span>
        <span className="text-lg font-black italic uppercase tracking-tighter text-white">{value}</span>
      </div>
      <div className="relative h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className={`h-full ${color}`}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
}
