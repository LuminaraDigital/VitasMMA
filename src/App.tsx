import { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import VideoAnalysis from './components/VideoAnalysis';
import LiveCoach from './components/LiveCoach';
import Login from './components/Login';
import FightCamp from './components/FightCamp';
import CampVerification from './components/CampVerification';
import Leaderboard from './components/Leaderboard';
import ProUpgrade from './components/ProUpgrade';
import ProfileSettings from './components/ProfileSettings';
import TrainingHub from './components/TrainingHub';
import StrengthLayer from './components/StrengthLayer';
import { UserProfile, CampTask } from './types';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'loading' | 'onboarding' | 'dashboard' | 'video_analysis' | 'live_coach' | 'fight_camp' | 'camp_verification' | 'leaderboard' | 'pro_upgrade' | 'profile_settings' | 'training_hub' | 'strength_layer'>('loading');
  const [selectedTask, setSelectedTask] = useState<CampTask | null>(null);

  const fetchProfile = useCallback(async (sessionToken?: string) => {
    try {
      const token = sessionToken || (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        setCurrentView('login');
        return;
      }
      
      const res = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Clean up URL if we just came from auth callback
        if (window.location.pathname === '/auth/callback') {
          window.history.replaceState({}, document.title, '/');
        }

        if (data.profile) {
          setProfile(data.profile);
          setCurrentView('dashboard');
        } else {
          setCurrentView('onboarding');
        }
      } else {
        setCurrentView('login');
      }
    } catch (err) {
      console.error(err);
      setCurrentView('login');
    }
  }, []);

  const handleDemoLogin = () => {
    setProfile(null);
    setCurrentView('onboarding');
  };

  useEffect(() => {
    // Check initial session
    fetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchProfile(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setCurrentView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleSaveProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    setCurrentView('dashboard');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ profile: newProfile })
      });
    } catch (err) {
      console.error('Failed to save profile', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCurrentView('login');
  };

  const handleUpgrade = () => {
    if (profile) {
      handleSaveProfile({ ...profile, isPro: true, coins: (profile.coins || 0) + 10000 });
      setCurrentView('dashboard');
    }
  };

  if (currentView === 'loading') {
    return (
      <div className="h-[100dvh] bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#FF2A2A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#0B0F19] text-white font-sans overflow-hidden max-w-md mx-auto relative shadow-2xl flex flex-col">
      {currentView === 'login' && <Login onLoginSuccess={fetchProfile} onDemoLogin={handleDemoLogin} />}
      {currentView === 'onboarding' && <Onboarding onComplete={handleSaveProfile} />}
      {currentView === 'dashboard' && profile && (
        <div className="flex-1 flex flex-col h-full">
          <Dashboard profile={profile} onNavigate={(v) => setCurrentView(v as any)} onUpdateProfile={handleSaveProfile} />
          <button 
            onClick={handleLogout}
            className="absolute top-4 right-4 text-xs text-gray-500 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      )}
      {currentView === 'video_analysis' && <VideoAnalysis profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'live_coach' && <LiveCoach profile={profile!} onBack={() => setCurrentView('dashboard')} onUpdateProfile={handleSaveProfile} />}
      {currentView === 'fight_camp' && <FightCamp profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} onVerifyTask={(task) => { setSelectedTask(task); setCurrentView('camp_verification'); }} />}
      {currentView === 'camp_verification' && selectedTask && <CampVerification profile={profile!} task={selectedTask} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('fight_camp')} onVerifySuccess={() => setCurrentView('fight_camp')} />}
      {currentView === 'leaderboard' && <Leaderboard profile={profile!} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'pro_upgrade' && <ProUpgrade onBack={() => setCurrentView('dashboard')} onUpgrade={handleUpgrade} />}
      {currentView === 'profile_settings' && <ProfileSettings profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'training_hub' && <TrainingHub profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'strength_layer' && <StrengthLayer profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
    </div>
  );
}
