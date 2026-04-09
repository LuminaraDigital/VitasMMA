import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Upload, Play, Loader2, CheckCircle2, Camera, Square, Circle, ZoomIn, Activity, Shield, Search, Cpu, Youtube, ExternalLink, Zap, Dumbbell, XCircle, Brain } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { getAIContext } from '../utils/aiContext';
import { AI_COSTS, XP_REWARDS } from '../constants';
import { UserProfile } from '../types';
import { fetchWithAuth } from '../utils/api';

function LoadingState() {
  const [step, setStep] = useState(0);
  
  const steps = [
    { icon: <Activity className="w-12 h-12 text-brand-blue" />, text: "Tracking bar path & velocity..." },
    { icon: <Shield className="w-12 h-12 text-brand-violet" />, text: "Analyzing depth & posture..." },
    { icon: <Search className="w-12 h-12 text-brand-teal" />, text: "Evaluating stability & mechanics..." },
    { icon: <Cpu className="w-12 h-12 text-brand-blue" />, text: "Generating form corrections..." },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-blue/5 blur-[150px] animate-pulse pointer-events-none"></div>
      <div className="relative mb-16 perspective-1000">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="absolute -inset-12 border-2 border-dashed border-brand-blue/20 rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute -inset-16 border border-brand-violet/20 rounded-full"
        />
        <motion.div 
          key={step}
          initial={{ scale: 0.8, opacity: 0, rotateY: 90, z: -100 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0, z: 0 }}
          exit={{ scale: 1.2, opacity: 0, rotateY: -90, z: 100 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="w-32 h-32 glass-dark rounded-[2.5rem] flex items-center justify-center shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative z-10 border border-white/15 backdrop-blur-3xl transform-gpu"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[2.5rem]" />
          <div className="drop-shadow-[0_0_20px_rgba(0,195,255,0.4)]">
            {steps[step].icon}
          </div>
        </motion.div>
      </div>
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black italic uppercase tracking-tighter text-brand-blue animate-pulse mb-4 drop-shadow-[0_0_15px_rgba(0,195,255,0.6)]"
      >
        AI is analyzing
      </motion.h3>
      <motion.p 
        key={step + 'text'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg text-white/50 text-center h-10 font-black italic uppercase tracking-tight opacity-80"
      >
        {steps[step].text}
      </motion.p>
    </div>
  );
}

export default function SncVideoAnalysis({ profile, onUpdateProfile, onBack, onUpgrade }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void, onUpgrade: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [groundingUrls, setGroundingUrls] = useState<{uri: string, title: string}[]>([]);
  const [gearType, setGearType] = useState<string>("");
  const [rpe, setRpe] = useState<number>(7);
  const [formScore, setFormScore] = useState<number | null>(null);
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState<{min: number, max: number, step: number} | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (isRecording && stream && liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [isRecording, stream]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setAnalysis(null);
    }
  };

  const startRecording = async () => {
    if (!gearType) {
      setError("Please select a gear type/exercise first.");
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', zoom: true } as any, 
        audio: true 
      });
      setStream(mediaStream);
      setIsRecording(true);
      
      const track = mediaStream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities() as any;
        if (capabilities.zoom) {
          setZoomCapabilities({
            min: capabilities.zoom.min || 1,
            max: capabilities.zoom.max || 3,
            step: capabilities.zoom.step || 0.1
          });
          const settings = track.getSettings() as any;
          setZoom(settings.zoom || 1);
        }
      }
      
      const recorder = new MediaRecorder(mediaStream);
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const recordedFile = new File([blob], 'live-recording.webm', { type: 'video/webm' });
        setFile(recordedFile);
        setPreviewUrl(URL.createObjectURL(blob));
        
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsRecording(false);
        setZoomCapabilities(null);
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.applyConstraints({ advanced: [{ zoom: newZoom }] } as any).catch(console.error);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const analyzeVideo = async () => {
    if (!file) return;

    if (!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.SNC_VIDEO_ANALYSIS) {
      onUpgrade();
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        const promptText = `You are Vitas, an elite AI Strength & Conditioning coach and world-class expert in biomechanics and powerlifting. 
Analyze this S&C video for the exercise: ${gearType}.

PROVIDE A HIGHLY STRUCTURED ANALYSIS USING THIS EXACT FORMAT (use markdown):
# 🏋️ Exercise & Context
(Confirm the exercise and briefly describe the execution.)

# 💯 Form Score
(Provide a score from 0-100 based on form, depth, bar path, speed, and stability. Format exactly as: "Score: [number]/100")

# 🔬 Biomechanical Breakdown
(Analyze their posture, depth, bar path, speed, and stability. Score technique.)

# 🎯 Actionable Fixes
(Provide exactly 3 highly specific, technical corrections. Do not be generic. Explain exactly HOW to fix the issue.)

# 🛠️ Coach Tips
(Suggest 2-3 specific cues or accessory exercises to fix the weaknesses identified above.)

Use Google Search to look up YouTube videos of professional lifters performing this exercise to reference gold-standard techniques in your analysis if helpful. Format as clean markdown.`;

        // Deduct credits via server if not Pro
        if (!profile.isPro) {
          try {
            await fetchWithAuth('/api/use-credits', {
              method: 'POST',
              body: JSON.stringify({ userId: profile.id, amount: AI_COSTS.SNC_VIDEO_ANALYSIS })
            });
          } catch (err: any) {
            throw new Error(err.message || 'Failed to deduct credits');
          }
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64data
                  }
                },
                { text: promptText }
              ]
            }
          ],
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            tools: [{ googleSearch: {} }]
          }
        });
        
        const newAnalysis = response.text || "Analysis complete.";
        setAnalysis(newAnalysis);
        
        let currentFormScore = 50;
        const scoreMatch = newAnalysis.match(/Score:\s*(\d+)\/100/i);
        if (scoreMatch && scoreMatch[1]) {
          currentFormScore = parseInt(scoreMatch[1], 10);
        }
        setFormScore(currentFormScore);
        
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          const urls = chunks.map((c: any) => c.web).filter(Boolean);
          setGroundingUrls(urls);
        } else {
          setGroundingUrls([]);
        }
        
        onUpdateProfile({
          ...profile,
          // Optimistic update for credits if not Pro
          aiCredits: profile.isPro ? profile.aiCredits : (profile.aiCredits || 0) - AI_COSTS.SNC_VIDEO_ANALYSIS
        });

        // Add XP via server for successful analysis
        if (currentFormScore >= 70) {
          try {
            await fetchWithAuth('/api/add-xp', {
              method: 'POST',
              body: JSON.stringify({ userId: profile.id, xpAmount: XP_REWARDS.VIDEO_ANALYSIS_BASE, reason: 'snc_analysis' })
            });
          } catch (err) {
            console.error('Error adding XP:', err);
          }
        }
        
        setIsAnalyzing(false);
      };
    } catch (error) {
      console.error(error);
      setAnalysis("Error analyzing video. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleAutoLog = () => {
    if (!gearType || weight <= 0 || reps <= 0) {
      setError("Please enter weight and reps to log.");
      return;
    }
    const newLog = {
      date: new Date().toISOString().split('T')[0],
      exercise: gearType,
      weight,
      reps,
      rpe,
      formScore
    };
    
    const updatedLogs = [...(profile.strengthLogs || []), newLog];
    
    // Update PR Tracker if applicable
    const currentPr = profile.prTracker?.[gearType.toLowerCase()] || 0;
    const updatedPrTracker = { ...profile.prTracker };
    if (weight > currentPr) {
      updatedPrTracker[gearType.toLowerCase()] = weight;
    }

    onUpdateProfile({
      ...profile,
      strengthLogs: updatedLogs,
      prTracker: updatedPrTracker
    });
    
    onBack();
  };

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white overflow-hidden relative font-sans">
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-blue/20 rounded-full blur-[120px] animate-pulse opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-violet/20 rounded-full blur-[120px] animate-pulse opacity-40" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-brand-teal/10 rounded-full blur-[100px] opacity-30" />
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <header className="sticky top-0 z-50 glass-dark px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-b-[2rem] md:rounded-b-[3.5rem]">
        <div className="flex items-center gap-4 md:gap-6">
          <motion.button 
            whileHover={{ scale: 1.1, x: -3, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (isRecording) stopRecording();
              onBack();
            }} 
            className="p-2 md:p-3.5 bg-white/5 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all border border-white/10 shadow-2xl backdrop-blur-xl"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white/90" />
          </motion.button>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-gradient leading-none drop-shadow-2xl"
            >
              S&C Analyzer
            </motion.h1>
            <div className="flex items-center gap-2 mt-1 md:mt-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-blue shadow-[0_0_10px_rgba(0,195,255,0.8)] animate-pulse" />
              <p className="text-[8px] md:text-[10px] text-brand-blue font-black uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-70">AI FORM ENGINE</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-brand-violet/10 px-3 py-1.5 rounded-lg border border-brand-violet/30">
          <Brain className="w-4 h-4 text-brand-violet" />
          <span className="font-mono text-xs text-brand-violet font-bold">{profile.aiCredits ?? 100} V-Coins</span>
        </div>
      </header>



      {error && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium relative z-50 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col p-8 overflow-y-auto hide-scrollbar relative z-10 pb-24">
        {!previewUrl && !isRecording ? (
          <div className="flex-1 flex flex-col gap-6 md:gap-10 min-h-0 max-w-4xl mx-auto w-full">
            <div className="glass-dark rounded-[2rem] p-6 border border-white/10">
              <label className="block text-[10px] md:text-xs font-black italic uppercase tracking-[0.3em] text-brand-blue mb-4">Select Exercise / Gear</label>
              <div className="grid grid-cols-2 gap-4">
                {['Squat', 'Bench', 'Deadlift', 'OHP', 'Rows', 'Other'].map(type => (
                  <button
                    key={type}
                    onClick={() => setGearType(type)}
                    className={`p-4 rounded-xl border font-black uppercase tracking-widest text-sm transition-all ${
                      gearType === type 
                        ? 'bg-brand-blue/20 border-brand-blue text-brand-blue shadow-[0_0_20px_rgba(0,195,255,0.3)]' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6 md:gap-10">
              <motion.div 
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                whileHover={{ y: -15, scale: 1.03, rotateX: 5, rotateY: -5, z: 50 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 min-h-[240px] md:min-h-[280px] glass-dark border border-brand-violet/40 rounded-[2rem] md:rounded-[3.5rem] flex flex-col items-center justify-center bg-brand-violet/5 cursor-pointer hover:bg-brand-violet/10 transition-all p-8 md:p-12 group relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] md:shadow-[0_40px_80px_rgba(0,0,0,0.5)] perspective-2000 transform-gpu"
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => {
                  if (!gearType) {
                    setError("Please select an exercise first.");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative z-10 w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-[2.5rem] bg-black/60 flex items-center justify-center mb-6 md:mb-10 border border-brand-violet/40 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-[0_0_40px_rgba(168,85,247,0.4)] md:shadow-[0_0_60px_rgba(168,85,247,0.4)] transform-gpu" style={{ transform: 'translateZ(50px)' }}>
                  <Upload className="w-10 h-10 md:w-14 md:h-14 text-brand-violet drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                </div>
                <h2 className="relative z-10 text-2xl md:text-4xl font-black italic uppercase tracking-tighter mb-2 md:mb-4 group-hover:text-brand-violet transition-colors drop-shadow-lg" style={{ transform: 'translateZ(30px)' }}>Upload Clip</h2>
                <input 
                  type="file" 
                  accept="video/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -15, scale: 1.03, rotateX: 5, rotateY: 5, z: 50 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 min-h-[240px] md:min-h-[280px] glass-dark border border-brand-blue/40 rounded-[2rem] md:rounded-[3.5rem] flex flex-col items-center justify-center bg-brand-blue/5 cursor-pointer hover:bg-brand-blue/10 transition-all p-8 md:p-12 group relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] md:shadow-[0_40px_80px_rgba(0,0,0,0.5)] perspective-2000 transform-gpu"
                style={{ transformStyle: 'preserve-3d' }}
                onClick={startRecording}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative z-10 w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-[2.5rem] bg-black/60 flex items-center justify-center mb-6 md:mb-10 border border-brand-blue/40 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 shadow-[0_0_40px_rgba(0,195,255,0.4)] md:shadow-[0_0_60px_rgba(0,195,255,0.4)] transform-gpu" style={{ transform: 'translateZ(50px)' }}>
                  <Camera className="w-10 h-10 md:w-14 md:h-14 text-brand-blue drop-shadow-[0_0_15px_rgba(0,195,255,0.8)]" />
                </div>
                <h2 className="relative z-10 text-2xl md:text-4xl font-black italic uppercase tracking-tighter mb-2 md:mb-4 text-brand-blue drop-shadow-lg" style={{ transform: 'translateZ(30px)' }}>Record Live</h2>
              </motion.div>
            </div>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
            <div className="relative rounded-[2rem] md:rounded-[3.5rem] overflow-hidden bg-black flex-1 mb-6 md:mb-10 border border-brand-violet/50 shadow-[0_20px_50px_rgba(0,0,0,0.7)] md:shadow-[0_40px_100px_rgba(0,0,0,0.7)] perspective-2000">
              <video 
                ref={liveVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-6 right-6 md:top-10 md:right-10 flex items-center gap-3 md:gap-5 glass-dark px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-2xl border border-brand-violet/50 shadow-2xl backdrop-blur-3xl">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-brand-violet animate-pulse shadow-[0_0_20px_rgba(168,85,247,1)]" />
                <span className="text-xs md:text-sm font-black italic uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-violet">Live Feed</span>
              </div>
              
              {zoomCapabilities && (
                <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 glass-dark p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-white/15 flex items-center gap-4 md:gap-10 shadow-2xl backdrop-blur-3xl">
                  <ZoomIn className="w-6 h-6 md:w-10 md:h-10 text-white/40" />
                  <span className="text-[10px] md:text-xs font-black font-mono text-white/40">{zoomCapabilities.min}x</span>
                  <input 
                    type="range" 
                    min={zoomCapabilities.min} 
                    max={zoomCapabilities.max} 
                    step={zoomCapabilities.step} 
                    value={zoom} 
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="flex-1 h-2 md:h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand-blue shadow-inner"
                  />
                  <span className="text-[10px] md:text-xs font-black font-mono text-brand-blue">{zoom.toFixed(1)}x</span>
                </div>
              )}
            </div>
            <motion.button 
              whileHover={{ scale: 1.02, y: -6, boxShadow: '0 30px 60px rgba(168,85,247,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={stopRecording}
              className="w-full py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-r from-brand-violet to-brand-blue font-black text-xl md:text-2xl italic uppercase tracking-tighter flex items-center justify-center gap-4 md:gap-6 shadow-[0_15px_30px_rgba(0,0,0,0.5)] md:shadow-[0_25px_50px_rgba(0,0,0,0.5)] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
              <Square className="w-6 h-6 md:w-8 md:h-8 fill-current group-hover:scale-110 transition-transform" /> Stop Recording
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              className="relative rounded-[2rem] md:rounded-[3.5rem] overflow-hidden bg-black aspect-video mb-8 md:mb-12 border border-white/15 shadow-[0_25px_50px_rgba(0,0,0,0.6)] md:shadow-[0_50px_100px_rgba(0,0,0,0.6)] group transform-gpu"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <video src={previewUrl!} controls className="w-full h-full object-contain" />
              <div className="absolute inset-0 pointer-events-none border-[10px] md:border-[20px] border-black/20 rounded-[2rem] md:rounded-[3.5rem]" />
            </motion.div>

            {!analysis && !isAnalyzing && (
              <div className="flex flex-col gap-6 md:gap-10">
                <motion.button 
                  whileHover={{ scale: 1.02, y: -8, boxShadow: '0 40px 80px rgba(0,195,255,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={analyzeVideo}
                  className="w-full py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-r from-brand-blue to-brand-violet font-black text-2xl md:text-3xl italic uppercase tracking-tighter flex items-center justify-center gap-4 md:gap-6 shadow-[0_15px_30px_rgba(0,0,0,0.5)] md:shadow-[0_30px_60px_rgba(0,0,0,0.5)] group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                  <Brain className="w-8 h-8 md:w-10 md:h-10 fill-current group-hover:scale-125 transition-transform drop-shadow-lg" /> Analyze Form 
                  <span className="text-sm md:text-base bg-black/20 px-3 py-1 rounded-full flex items-center gap-2 ml-2"><Brain className="w-4 h-4 md:w-5 md:h-5" /> {AI_COSTS.SNC_VIDEO_ANALYSIS}</span>
                </motion.button>
              </div>
            )}

            {isAnalyzing && <LoadingState />}

            {analysis && (
              <motion.div 
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                className="flex-1 glass-dark rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 border border-brand-blue/40 shadow-[0_30px_60px_rgba(0,0,0,0.6)] md:shadow-[0_60px_120px_rgba(0,0,0,0.6)] mb-8 md:mb-12 relative overflow-hidden group perspective-2000 transform-gpu"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/15 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12 text-brand-blue relative z-10" style={{ transform: 'translateZ(40px)' }}>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.8 }}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-brand-blue/20 flex items-center justify-center border border-brand-blue/40 shadow-xl"
                  >
                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
                  </motion.div>
                  <h3 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter drop-shadow-lg">Analysis Complete</h3>
                </div>

                {formScore !== null && (
                  <div className="mb-10 md:mb-16 relative z-10" style={{ transform: 'translateZ(30px)' }}>
                    <motion.div 
                      whileHover={{ y: -10, scale: 1.03, rotateY: -5 }}
                      className="glass-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-brand-blue/40 text-center relative overflow-hidden group shadow-xl md:shadow-2xl transform-gpu"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="text-[9px] md:text-[11px] text-white/40 uppercase tracking-[0.3em] md:tracking-[0.5em] font-black italic mb-2 md:mb-4 relative z-10">Form Score</div>
                      <div className="text-5xl md:text-7xl font-black text-brand-blue relative z-10 drop-shadow-[0_10px_20px_rgba(0,195,255,0.4)]">{formScore}<span className="text-xl md:text-2xl text-gray-500 font-mono opacity-50">/100</span></div>
                    </motion.div>
                  </div>
                )}

                <div className="prose prose-invert prose-base md:prose-lg max-w-none prose-headings:text-brand-blue prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-white/70 prose-p:font-medium prose-li:text-white/70 prose-li:font-medium relative z-10 leading-relaxed italic" style={{ transform: 'translateZ(20px)' }}>
                  {analysis.split('\n').map((line, i) => {
                    if (line.startsWith('###')) return <h4 key={i} className="text-xl md:text-2xl mt-8 md:mt-10 mb-4 md:mb-5 text-white drop-shadow-md">{line.replace('###', '')}</h4>;
                    if (line.startsWith('##')) return <h3 key={i} className="text-2xl md:text-3xl mt-10 md:mt-12 mb-5 md:mb-6 drop-shadow-lg">{line.replace('##', '')}</h3>;
                    if (line.startsWith('#')) return <h2 key={i} className="text-3xl md:text-4xl mt-12 md:mt-16 mb-6 md:mb-8 text-brand-violet drop-shadow-xl">{line.replace('#', '')}</h2>;
                    if (line.startsWith('-')) return <li key={i} className="ml-4 md:ml-6 mb-3 md:mb-4 list-none flex items-start gap-3 md:gap-4"><div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-blue rounded-full mt-2 md:mt-2.5 shrink-0 shadow-[0_0_10px_rgba(0,195,255,0.6)]" />{line.replace('-', '')}</li>;
                    if (line.startsWith('*')) return <li key={i} className="ml-4 md:ml-6 mb-3 md:mb-4 list-none flex items-start gap-3 md:gap-4"><div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-blue rounded-full mt-2 md:mt-2.5 shrink-0 shadow-[0_0_10px_rgba(0,195,255,0.6)]" />{line.replace('*', '')}</li>;
                    if (line.trim() === '') return <div key={i} className="h-4 md:h-6" />;
                    return <p key={i} className="mb-4 md:mb-6 opacity-90">{line}</p>;
                  })}
                </div>

                {groundingUrls.length > 0 && (
                  <div className="mt-12 md:mt-20 pt-10 md:pt-16 border-t border-white/10 relative z-10" style={{ transform: 'translateZ(30px)' }}>
                    <div className="flex items-center gap-4 md:gap-5 mb-8 md:mb-10">
                      <div className="p-2 md:p-3 bg-brand-blue/20 rounded-xl md:rounded-2xl border border-brand-blue/40 shadow-lg">
                        <Youtube className="w-6 h-6 md:w-8 md:h-8 text-brand-blue" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-brand-blue drop-shadow-lg">Reference Lifts</h3>
                    </div>
                    <div className="grid gap-6 md:gap-8">
                      {groundingUrls.map((url, i) => (
                        <motion.a 
                          key={i} 
                          href={url.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          whileHover={{ x: 15, scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)', z: 50 }}
                          className="block p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-black/40 hover:border-brand-violet/50 transition-all shadow-xl md:shadow-2xl backdrop-blur-2xl group transform-gpu"
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          <div className="flex justify-between items-start mb-3 md:mb-4" style={{ transform: 'translateZ(20px)' }}>
                            <h4 className="font-black italic uppercase tracking-tighter text-white text-xl md:text-2xl line-clamp-2 mb-2 group-hover:text-brand-blue transition-colors leading-tight">{url.title}</h4>
                            <div className="p-2 md:p-3 bg-white/10 rounded-lg md:rounded-xl group-hover:bg-brand-blue/30 transition-all shadow-lg">
                              <ExternalLink className="w-5 h-5 md:w-6 md:h-6 text-white/40 group-hover:text-brand-blue" />
                            </div>
                          </div>
                          <p className="text-[10px] md:text-xs text-brand-blue font-mono truncate opacity-60 group-hover:opacity-100 transition-opacity" style={{ transform: 'translateZ(10px)' }}>{url.uri}</p>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-log Section */}
                <div className="mt-12 md:mt-16 glass-dark rounded-[2rem] p-6 md:p-8 border border-white/10 relative z-10">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Log This Set</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Weight (lbs)</label>
                      <input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xl font-black text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Reps</label>
                      <input 
                        type="number" 
                        value={reps} 
                        onChange={(e) => setReps(Number(e.target.value))}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xl font-black text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">RPE (1-10)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="1" max="10" 
                          value={rpe} 
                          onChange={(e) => setRpe(Number(e.target.value))}
                          className="flex-1 accent-brand-blue"
                        />
                        <span className="text-xl font-black text-brand-blue w-8 text-center">{rpe}</span>
                      </div>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAutoLog}
                    className="w-full py-4 rounded-xl bg-brand-blue text-black font-black uppercase tracking-widest text-sm hover:bg-brand-blue/90 transition-colors"
                  >
                    Save to PR Tracker
                  </motion.button>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02, y: -4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setFile(null); setPreviewUrl(null); setAnalysis(null); setGroundingUrls([]); setFormScore(null); }}
                  className="w-full mt-8 py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/15 glass-dark font-black italic uppercase tracking-[0.2em] md:tracking-[0.4em] text-sm md:text-base hover:bg-white/10 transition-all shadow-xl md:shadow-2xl backdrop-blur-3xl relative z-10"
                >
                  Analyze Another Lift
                </motion.button>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
