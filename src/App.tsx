import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './utils/firebaseErrors';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import VideoAnalysis from './components/VideoAnalysis';
import SncVideoAnalysis from './components/SncVideoAnalysis';
import LiveCoach from './components/LiveCoach';
import Login from './components/Login';
import FightCamp from './components/FightCamp';
import CampVerification from './components/CampVerification';
import Leaderboard from './components/Leaderboard';
import ProUpgrade from './components/ProUpgrade';
import ProfileSettings from './components/ProfileSettings';
import TrainingHub from './components/TrainingHub';
import StrengthLayer from './components/StrengthLayer';
import StrategyAdvisor from './components/StrategyAdvisor';
import Tutorial from './components/Tutorial';
import Paywall from './components/Paywall';
import Logo from './components/Logo';
import { UserProfile, CampTask } from './types';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'login' | 'loading' | 'tutorial' | 'paywall' | 'onboarding' | 'dashboard' | 'video_analysis' | 'snc_video_analysis' | 'live_coach' | 'fight_camp' | 'camp_verification' | 'leaderboard' | 'pro_upgrade' | 'profile_settings' | 'training_hub' | 'strength_layer' | 'strategy_advisor'>('loading');
  const [selectedTask, setSelectedTask] = useState<CampTask | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [isProPending, setIsProPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Optional: Set theme parameters based on Telegram's theme
      const themeParams = window.Telegram.WebApp.themeParams;
      if (themeParams.bg_color) {
        document.body.style.backgroundColor = themeParams.bg_color;
      }
    }
  }, []);

  if (error) {
    throw error;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (!u && !isDemo) {
        setCurrentView('login');
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, [isDemo]);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (isDemo) {
      // Demo mode doesn't use Firebase
      return;
    }

    if (!user) return;

    // Check URL parameters for successful payment
    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('success') === 'true';
    const isCanceled = urlParams.get('canceled') === 'true';
    if (isSuccess) {
      setIsProPending(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isCanceled) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const profileRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        
        // If they just paid but the DB doesn't reflect it yet, update it
        if (isSuccess && !data.isPro) {
          try {
            await setDoc(profileRef, { isPro: true }, { merge: true });
            data.isPro = true;
          } catch (e) {
            console.error('Failed to update pro status', e);
          }
        }
        
        setProfile(data);
        
        if (!data.isPro && !isDemo) {
          setCurrentView('paywall');
        } else {
          setCurrentView(prev => {
            if (prev === 'loading' || prev === 'login' || prev === 'onboarding' || prev === 'tutorial' || prev === 'paywall') {
              return 'dashboard';
            }
            return prev;
          });
        }
      } else {
        setCurrentView(prev => {
          if (prev === 'loading' || prev === 'login') {
            if (isSuccess) return 'onboarding';
            if (isCanceled) return 'paywall';
            return 'tutorial';
          }
          return prev;
        });
      }
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      } catch (e) {
        setError(e as Error);
      }
    });

    return () => unsubscribe();
  }, [isAuthReady, user, isDemo]);

  const handleDemoLogin = () => {
    setIsDemo(true);
    setProfile(null);
    setCurrentView('tutorial');
  };

  const handleContinueDemo = async () => {
    if (!isDemo && user) {
      setIsDemo(true);
      await signOut(auth);
      setProfile(null);
      setCurrentView('onboarding');
    } else {
      setCurrentView('onboarding');
    }
  };

  const handleUpgrade = async () => {
    setCheckoutError(null);
    if (isDemo || !user) {
      // If they are in demo mode or not logged in, they need to log in first
      setIsDemo(false);
      setProfile(null);
      setCurrentView('login');
      return;
    }
    
    setIsProPending(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || 'Failed to create checkout session');
        setIsProPending(false);
      }
    } catch (err: any) {
      console.error('Failed to create checkout session:', err);
      setCheckoutError(err.message || 'Failed to create checkout session');
      setIsProPending(false);
    }
  };

  const handleSaveProfile = async (newProfile: UserProfile) => {
    const finalProfile = { ...newProfile, isPro: isProPending || newProfile.isPro };
    setProfile(finalProfile);
    
    if (isDemo) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, { ...finalProfile, uid: user.uid }, { merge: true });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      } catch (e) {
        setError(e as Error);
      }
    }
  };

  const handleLogout = async () => {
    if (isDemo) {
      setIsDemo(false);
      setProfile(null);
      setCurrentView('login');
      return;
    }
    
    try {
      await signOut(auth);
      setProfile(null);
      setCurrentView('login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (currentView === 'loading') {
    return (
      <div className="h-[100dvh] bg-brand-bg flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <Logo className="w-20 h-20" />
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-gradient">VitasMMA</h1>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-teal animate-spin" />
              <span className="text-[10px] font-black italic uppercase tracking-widest text-gray-500">Initializing Fighter Profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#050814] flex items-center justify-center sm:p-4 md:p-8">
      <div className="h-[100dvh] sm:h-[90vh] w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-brand-bg text-white font-sans overflow-hidden relative shadow-[0_0_50px_rgba(0,217,245,0.1)] flex flex-col sm:rounded-[2.5rem] border-x sm:border border-white/10 transition-all duration-500 ring-1 ring-white/5">
        {currentView === 'login' && <Login onLoginSuccess={() => {}} onDemoLogin={handleDemoLogin} />}
        {currentView === 'tutorial' && <Tutorial onComplete={() => setCurrentView('paywall')} />}
        {currentView === 'paywall' && <Paywall isDemo={isDemo} onContinueDemo={handleContinueDemo} onUpgrade={handleUpgrade} checkoutError={checkoutError} />}
        {currentView === 'onboarding' && <Onboarding user={user} onComplete={(p) => { handleSaveProfile(p); setCurrentView('dashboard'); }} />}
        {currentView === 'dashboard' && profile && (
          <div className="flex-1 flex flex-col h-full relative">
            <Dashboard profile={profile} onNavigate={(v) => setCurrentView(v as any)} onUpdateProfile={handleSaveProfile} />
            <button 
              onClick={handleLogout}
              className="absolute top-6 right-6 z-[60] p-2 rounded-full glass border border-white/10 text-gray-500 hover:text-white transition-all hover:scale-110 active:scale-95"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        )}
        {currentView === 'video_analysis' && <VideoAnalysis profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'snc_video_analysis' && <SncVideoAnalysis profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'live_coach' && <LiveCoach profile={profile!} onBack={() => setCurrentView('dashboard')} onUpdateProfile={handleSaveProfile} />}
        {currentView === 'fight_camp' && <FightCamp profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} onVerifyTask={(task) => { setSelectedTask(task); setCurrentView('camp_verification'); }} />}
        {currentView === 'camp_verification' && selectedTask && <CampVerification profile={profile!} task={selectedTask} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('fight_camp')} onVerifySuccess={() => setCurrentView('fight_camp')} />}
        {currentView === 'leaderboard' && <Leaderboard profile={profile!} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'pro_upgrade' && <ProUpgrade onBack={() => setCurrentView('dashboard')} onUpgrade={handleUpgrade} checkoutError={checkoutError} />}
        {currentView === 'profile_settings' && <ProfileSettings profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'training_hub' && <TrainingHub profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'strength_layer' && <StrengthLayer profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'strategy_advisor' && <StrategyAdvisor profile={profile!} onBack={() => setCurrentView('dashboard')} />}
      </div>
    </div>
  );
}
