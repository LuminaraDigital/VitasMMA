import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';

console.log('VitasMMA: App.tsx module loading...');
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
import KnowledgeBase from './components/KnowledgeBase';
import Tutorial from './components/Tutorial';
import Paywall from './components/Paywall';
import Logo from './components/Logo';
import { UserProfile, CampTask } from './types';
import { Loader2, AlertTriangle, LogOut, X } from 'lucide-react';
import { fetchWithAuth } from './utils/api';

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
  const [currentView, setCurrentView] = useState<'login' | 'loading' | 'tutorial' | 'paywall' | 'onboarding' | 'dashboard' | 'video_analysis' | 'snc_video_analysis' | 'live_coach' | 'fight_camp' | 'camp_verification' | 'leaderboard' | 'pro_upgrade' | 'profile_settings' | 'training_hub' | 'strength_layer' | 'strategy_advisor' | 'knowledge_base'>('loading');
  const [selectedTask, setSelectedTask] = useState<CampTask | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isProPending, setIsProPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Handle user interaction to unlock audio
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Play/Pause logic based on current view
  useEffect(() => {
    if (!audioRef.current || !hasInteracted) return;

    const isAIFeature = [
      'video_analysis', 
      'snc_video_analysis', 
      'live_coach', 
      'camp_verification', 
      'strategy_advisor'
    ].includes(currentView);

    if (isAIFeature) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [currentView, hasInteracted]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      const themeParams = window.Telegram.WebApp.themeParams;
      if (themeParams.bg_color) {
        document.body.style.backgroundColor = themeParams.bg_color;
      }
    }
  }, []);

  useEffect(() => {
    console.log('App: Setting up onAuthStateChanged listener...');
    
    const authTimeout = setTimeout(() => {
      if (!isAuthReady) {
        console.warn('App: Auth readiness timeout reached (5s). Forcing ready state.');
        setIsAuthReady(true);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      clearTimeout(authTimeout);
      console.log('App: onAuthStateChanged fired. User:', u?.uid || 'null');
      setUser(u);
      setIsAuthReady(true);
      if (!u) {
        console.log('App: No user, setting view to login.');
        setCurrentView('login');
        setProfile(null);
      }
    }, (error) => {
      console.error('App: onAuthStateChanged error:', error);
      clearTimeout(authTimeout);
      setIsAuthReady(true);
      setCurrentView('login');
    });

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('success') === 'true';
    const isCreditsSuccess = urlParams.get('credits_success') === 'true';
    const packId = urlParams.get('pack');
    const isCanceled = urlParams.get('canceled') === 'true';
    
    if (isSuccess) {
      setIsProPending(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isCreditsSuccess) {
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isCanceled) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const profileRef = doc(db, 'users', user.uid);
    
    let processedSuccess = false;
    let processedCredits = false;

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      console.log('App: onSnapshot fired for profile. Exists:', docSnap.exists());
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as UserProfile;
        
        // Only show success toast when the data actually reflects the upgrade
        if (isSuccess && data.isPro && !processedSuccess) {
          processedSuccess = true;
          setIsProPending(false); // Clear pending state once we see the update
          setToastMessage(`Successfully upgraded to PRO!`);
        }

        if (isCreditsSuccess && !processedCredits) {
          // For credits, we might want to check if they actually increased, 
          // but since we don't know the previous value here easily, 
          // we'll just show it once.
          processedCredits = true;
          let addedCredits = 0;
          if (packId === 'starter') addedCredits = 200;
          else if (packId === 'fighter') addedCredits = 600;
          else if (packId === 'pro') addedCredits = 1500;
          
          if (addedCredits > 0) {
            setToastMessage(`Successfully added ${addedCredits} V-Coins!`);
          }
        }
        
        setProfile(data);
        
        setCurrentView(prev => {
          if (prev === 'loading' || prev === 'login') {
            if (!data.weightClass && !data.baseStyle) {
              if (isSuccess) return 'onboarding';
              if (isCanceled) return 'paywall';
              return 'paywall';
            }
            return 'dashboard';
          }
          if (prev === 'onboarding' && data.weightClass && data.baseStyle) {
            return 'dashboard';
          }
          return prev;
        });
      } else {
        setCurrentView(prev => {
          if (prev === 'loading' || prev === 'login') {
            if (isSuccess) return 'onboarding';
            if (isCanceled) return 'paywall';
            return 'paywall';
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
  }, [isAuthReady, user]);

  if (error) {
    return (
      <div className="h-[100dvh] bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md glass p-8 rounded-[2.5rem] border-red-500/30 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4">System Error</h2>
          <div className="bg-black/40 rounded-2xl p-4 mb-6 border border-white/5 max-h-40 overflow-y-auto">
            <p className="text-red-400 text-xs font-mono break-words leading-relaxed">
              {error.message || "An unexpected error occurred."}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white text-black font-black italic uppercase tracking-tighter rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
            >
              Restart Application
            </button>
            <button 
              onClick={() => setError(null)}
              className="w-full py-3 bg-white/5 text-white/60 font-black italic uppercase tracking-tighter rounded-xl hover:bg-white/10 transition-all active:scale-95 border border-white/10"
            >
              Dismiss & Continue
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleUpgrade = async () => {
    setCheckoutError(null);
    if (!user) {
      // If they are not logged in, they need to log in first
      setProfile(null);
      setCurrentView('login');
      return;
    }
    
    setIsProPending(true);
    try {
      const response = await fetchWithAuth('/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ userId: user.uid })
      });
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
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

  const handleTonUpgradeSuccess = async (boc?: string) => {
    setIsProPending(true);
    if (profile && auth.currentUser) {
      try {
        const response = await fetchWithAuth('/api/verify-ton-payment', {
          method: 'POST',
          body: JSON.stringify({ 
            userId: auth.currentUser.uid, 
            type: 'pro_upgrade',
            boc 
          })
        });
        
        if (response.ok) {
          // The profile will be updated via the onSnapshot listener automatically
          console.log('TON Pro upgrade verified successfully');
        } else {
          console.error('Failed to verify TON payment');
        }
      } catch (err) {
        console.error('Error verifying TON payment:', err);
      }
    }
    setCurrentView('dashboard');
  };

  const handleCompleteTutorial = async () => {
    if (!profile || !user) return;
    const updatedProfile = { ...profile, hasSeenTutorial: true };
    setProfile(updatedProfile);
    try {
      await setDoc(doc(db, 'users', user.uid), { hasSeenTutorial: true }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveProfile = async (newProfile: UserProfile) => {
    const isNew = !profile;
    
    // On update, we strip sensitive billing fields to avoid rule violations.
    // On initial creation (onboarding), we include them to set initial values.
    const dataToSave = { ...newProfile };
    if (!isNew) {
      delete (dataToSave as any).isPro;
      delete (dataToSave as any).aiCredits;
      delete (dataToSave as any).coins;
      delete (dataToSave as any).xp;
      delete (dataToSave as any).level;
      delete (dataToSave as any).unlockedModules;
      // Note: coins, xp, level, and unlockedModules are now handled via secure server endpoints
    } else {
      // Ensure new profiles have hasSeenTutorial set to false initially
      (dataToSave as any).hasSeenTutorial = false;
    }
    
    setProfile(newProfile);
    
    const user = auth.currentUser;
    if (!user) return;

    try {
      const profileRef = doc(db, 'users', user.uid);
      // Only merge updatable fields to avoid rule violations
      await setDoc(profileRef, { ...dataToSave, uid: user.uid }, { merge: true });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      } catch (e) {
        setError(e as Error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setCurrentView('login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  console.log('App: Rendering currentView:', currentView);

  if (currentView === 'loading') {
    console.log('App: Showing loading screen');
    return (
      <div className="h-[100dvh] bg-brand-bg flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-teal to-brand-blue animate-bounce flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-brand-bg flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-brand-teal animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-gradient">VitasMMA</h1>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-teal animate-spin" />
              <span className="text-[10px] font-black italic uppercase tracking-widest text-gray-500">Initializing Fighter Profile...</span>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:bg-white/10"
          >
            Reset & Reload
          </button>
        </div>
      </div>
    );
  }

  console.log('App: Rendering main layout for view:', currentView);
  return (
    <div className="min-h-[100dvh] w-full bg-[#050814] flex items-center justify-center sm:p-4 md:p-8">
      <div className="h-[100dvh] sm:h-[90vh] w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-brand-bg text-white font-sans overflow-hidden relative shadow-[0_0_50px_rgba(0,217,245,0.1)] flex flex-col sm:rounded-[2.5rem] border-x sm:border border-white/10 transition-all duration-500 ring-1 ring-white/5">
        {currentView === 'login' && <Login onLoginSuccess={() => {}} />}
        {currentView === 'tutorial' && <Tutorial onComplete={() => setCurrentView('paywall')} />}
        {currentView === 'paywall' && <Paywall onSignOut={handleLogout} onUpgrade={handleUpgrade} onTonUpgradeSuccess={handleTonUpgradeSuccess} checkoutError={checkoutError} />}
        {currentView === 'onboarding' && <Onboarding user={user} profile={profile} onComplete={(p) => { handleSaveProfile(p); setCurrentView('dashboard'); }} />}
        {currentView === 'dashboard' && profile && (
          <>
            <Dashboard 
              profile={profile} 
              onNavigate={(v) => setCurrentView(v as any)} 
              onUpdateProfile={handleSaveProfile} 
              onLogout={handleLogout}
            />
            {profile.hasSeenTutorial === false && (
              <Tutorial onComplete={handleCompleteTutorial} />
            )}
          </>
        )}
        {currentView === 'video_analysis' && <VideoAnalysis profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} onUpgrade={() => setCurrentView('pro_upgrade')} />}
        {currentView === 'snc_video_analysis' && <SncVideoAnalysis profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} onUpgrade={() => setCurrentView('pro_upgrade')} />}
        {currentView === 'live_coach' && <LiveCoach profile={profile!} onBack={() => setCurrentView('dashboard')} onUpdateProfile={handleSaveProfile} onUpgrade={() => setCurrentView('pro_upgrade')} />}
        {currentView === 'fight_camp' && <FightCamp profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} onVerifyTask={(task) => { setSelectedTask(task); setCurrentView('camp_verification'); }} />}
        {currentView === 'camp_verification' && selectedTask && <CampVerification profile={profile!} task={selectedTask} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('fight_camp')} onVerifySuccess={() => setCurrentView('fight_camp')} onUpgrade={() => setCurrentView('pro_upgrade')} />}
        {currentView === 'leaderboard' && <Leaderboard profile={profile!} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'pro_upgrade' && <ProUpgrade profile={profile!} onBack={() => setCurrentView('dashboard')} onUpgrade={handleUpgrade} onTonUpgradeSuccess={handleTonUpgradeSuccess} checkoutError={checkoutError} onUpdateProfile={handleSaveProfile} />}
        {currentView === 'profile_settings' && <ProfileSettings profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'training_hub' && <TrainingHub profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'strength_layer' && <StrengthLayer profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'strategy_advisor' && <StrategyAdvisor profile={profile!} onUpdateProfile={handleSaveProfile} onBack={() => setCurrentView('dashboard')} onUpgrade={() => setCurrentView('pro_upgrade')} />}
        {currentView === 'knowledge_base' && <KnowledgeBase profile={profile!} onBack={() => setCurrentView('dashboard')} onUpdateProfile={handleSaveProfile} onUpgrade={() => setCurrentView('pro_upgrade')} />}
        
        {/* Toast Notification */}
        {isProPending && (
        <div className="fixed inset-0 z-[100] bg-brand-bg/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md glass p-8 rounded-[2.5rem] border-brand-blue/30 text-center shadow-[0_0_50px_rgba(0,217,245,0.2)]"
          >
            <div className="w-20 h-20 bg-brand-blue/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-blue/30">
              <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4">Upgrading to PRO</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              We're finalizing your subscription. This will only take a moment...
            </p>
          </motion.div>
        </div>
      )}

      {toastMessage && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-brand-teal text-black px-6 py-3 rounded-full font-black italic uppercase tracking-widest shadow-[0_10px_30px_rgba(0,245,160,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-300">
            {toastMessage}
          </div>
        )}

        {/* Background Music */}
        <audio 
          ref={audioRef} 
          src="/bg-music.mp3" 
          loop 
          preload="auto"
        />
      </div>
    </div>
  );
}
