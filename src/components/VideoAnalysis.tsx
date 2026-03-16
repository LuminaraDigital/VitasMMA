import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Upload, Play, Loader2, CheckCircle2, Camera, Square, Circle, ZoomIn, Activity, Shield, Search, Cpu } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { UserProfile } from '../types';

function LoadingState() {
  const [step, setStep] = useState(0);
  
  const steps = [
    { icon: <Activity className="w-8 h-8 text-[#00E5FF]" />, text: "Detecting biomechanics and posture..." },
    { icon: <Shield className="w-8 h-8 text-purple-500" />, text: "Evaluating distance & guard..." },
    { icon: <Search className="w-8 h-8 text-[#FF2A2A]" />, text: "Comparing to professional fighters..." },
    { icon: <Cpu className="w-8 h-8 text-[#00E5FF]" />, text: "Generating actionable fixes..." },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="relative mb-8">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-0 border-2 border-dashed border-[#FF2A2A]/30 rounded-full w-20 h-20 -ml-2 -mt-2"
        />
        <motion.div 
          key={step}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 bg-[#1A2235] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.2)] relative z-10"
        >
          {steps[step].icon}
        </motion.div>
      </div>
      <h3 className="text-lg font-bold uppercase tracking-widest text-[#FF2A2A] animate-pulse mb-2">Coach is analyzing</h3>
      <motion.p 
        key={step + 'text'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-gray-400 text-center h-8"
      >
        {steps[step].text}
      </motion.p>
    </div>
  );
}

export default function VideoAnalysis({ profile, onUpdateProfile, onBack }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [groundingUrls, setGroundingUrls] = useState<{uri: string, title: string}[]>([]);
  const [analysisDrillIds, setAnalysisDrillIds] = useState<string[]>([]);
  const [userClaim, setUserClaim] = useState<string>("");
  const [requestedXp, setRequestedXp] = useState<number>(50);
  const [sessionScore, setSessionScore] = useState<number | null>(null);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
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

  // Bind stream to video element when it mounts
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
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', zoom: true } as any, 
        audio: true 
      });
      setStream(mediaStream);
      setIsRecording(true);
      
      // Setup Zoom
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
      alert("Could not access camera. Please check permissions.");
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
    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        const historyContext = profile.analysisHistory && profile.analysisHistory.length > 0
          ? `\n\nPREVIOUS ANALYSES OF THIS FIGHTER (Use this to track progression and recurring habits):\n${profile.analysisHistory.slice(-3).map((a, i) => `--- Analysis ${i+1} ---\n${a}`).join('\n\n')}`
          : "";

        const claimContext = userClaim.trim() ? `\n\nUSER CLAIM / FOCUS:\nThe user states they were working on: "${userClaim}" and is requesting ${requestedXp} XP. Verify this claim in your analysis. If the video proves they did this with good effort, explicitly state "VERIFIED: YES" and award a score based on effort/quality. If the video does not match the claim or effort is poor, state "VERIFIED: NO" and give a low score.` : "";

        const promptText = `You are Vitas, an elite AI MMA fight coach and world-class expert in biomechanics, striking, and grappling. 
Analyze this MMA video with extreme precision and depth.

FIGHTER PROFILE:
Base Style: ${profile.baseStyle}
Stance: ${profile.stance}
Level: ${profile.level}${historyContext}${claimContext}

PROVIDE A HIGHLY STRUCTURED ANALYSIS USING THIS EXACT FORMAT (use markdown):
# 🥋 Discipline & Context
(Identify if this is striking, sparring, rolling, or drilling. Briefly describe the scenario.)

# 💯 Session Score
(Provide a score from 0-100 based on technique, guard, distance, and execution. Format exactly as: "Score: [number]/100")

# ✅ Verification
(If the user made a claim, explicitly state "VERIFIED: YES" or "VERIFIED: NO" based on the video evidence. Explain why.)

# 🔬 Biomechanical Breakdown
(Analyze their posture, balance, weight distribution, and kinetic chain efficiency. Score technique: guard up? distance right? rear heel planted?)

# 🎯 Actionable Fixes
(Provide exactly 3 highly specific, technical corrections. Do not be generic. Explain exactly HOW to fix the issue.)

# 🛠️ Suggested Drills
(Suggest 2-3 specific, targeted drills to fix the weaknesses identified above. Include a brief description of how each drill helps improve the specific technique. E.g., "10x sprawl from double leg - helps build muscle memory for quick hip drops against takedowns".)

# 📈 Progression
(Compare this performance to their past habits if previous analyses exist.)

Use Google Search to look up YouTube videos of professional fighters to reference gold-standard techniques in your analysis if helpful. Format as clean markdown.`;

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
        
        // Extract score to calculate XP
        let currentSessionScore = 50; // default
        const scoreMatch = newAnalysis.match(/Score:\s*(\d+)\/100/i);
        if (scoreMatch && scoreMatch[1]) {
          currentSessionScore = parseInt(scoreMatch[1], 10);
        }
        
        let verified = true;
        if (userClaim.trim()) {
          const verifiedMatch = newAnalysis.match(/VERIFIED:\s*(YES|NO)/i);
          if (verifiedMatch && verifiedMatch[1].toUpperCase() === 'NO') {
            verified = false;
          }
        }
        setIsVerified(verified);
        
        const currentXpEarned = verified ? (userClaim.trim() ? requestedXp : Math.floor(currentSessionScore * 1.5)) : 0;
        setSessionScore(currentSessionScore);
        setXpEarned(currentXpEarned);
        
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          const urls = chunks.map((c: any) => c.web).filter(Boolean);
          setGroundingUrls(urls);
        } else {
          setGroundingUrls([]);
        }
        
        const updatedHistory = [...(profile.analysisHistory || []), newAnalysis].slice(-5); // Keep last 5
        
        // Update profile with new XP and history
        let newXp = (profile.xp || 0) + currentXpEarned;
        let newLevel = profile.level || 1;
        
        // Level up logic (every 1000 XP)
        if (newXp >= newLevel * 1000) {
          newLevel += 1;
        }

        // Streak logic
        const today = new Date().toISOString().split('T')[0];
        let newStreak = profile.streak || 0;
        if (verified) {
          if (profile.lastActiveDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (profile.lastActiveDate === yesterdayStr) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
          }
        }

        onUpdateProfile({
          ...profile,
          xp: newXp,
          level: newLevel,
          streak: newStreak,
          lastActiveDate: verified ? today : profile.lastActiveDate,
          analysisHistory: updatedHistory
        });
        
        setIsAnalyzing(false);
      };
    } catch (error) {
      console.error(error);
      setAnalysis("Error analyzing video. Please try again.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full p-6 flex flex-col bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <header className="flex items-center gap-4 mb-8 shrink-0">
        <button onClick={() => {
          if (isRecording) stopRecording();
          onBack();
        }} className="p-2 bg-[#1A2235] rounded-full hover:bg-[#2A3245] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wider">Video Analysis</h1>
      </header>

      <main className="flex-1 flex flex-col">
        {!previewUrl && !isRecording ? (
          <div className="flex-1 flex flex-col gap-4 min-h-0 pb-4">
            <div 
              className="flex-1 min-h-[180px] border-2 border-dashed border-[#FF2A2A]/30 rounded-2xl flex flex-col items-center justify-center bg-[#FF2A2A]/5 cursor-pointer hover:bg-[#FF2A2A]/10 transition-colors p-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-[#FF2A2A] mb-3" />
              <h2 className="text-lg font-bold mb-1">Upload Training Clip</h2>
              <p className="text-xs text-gray-400 text-center max-w-xs">Select a video from your gallery (max 60s).</p>
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
            
            <div 
              className="flex-1 min-h-[180px] border-2 border-dashed border-[#00E5FF]/30 rounded-2xl flex flex-col items-center justify-center bg-[#00E5FF]/5 cursor-pointer hover:bg-[#00E5FF]/10 transition-colors p-4"
              onClick={startRecording}
            >
              <Camera className="w-10 h-10 text-[#00E5FF] mb-3" />
              <h2 className="text-lg font-bold mb-1">Record Live Session</h2>
              <p className="text-xs text-gray-400 text-center max-w-xs">Capture sparring or drills in real-time.</p>
            </div>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col h-full">
            <div className="relative rounded-2xl overflow-hidden bg-black flex-1 mb-6 border border-[#FF2A2A]/50 shadow-[0_0_15px_rgba(255,42,42,0.2)]">
              <video 
                ref={liveVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <div className="w-3 h-3 rounded-full bg-[#FF2A2A] animate-pulse" />
                <span className="text-sm font-bold text-[#FF2A2A] uppercase tracking-wider">Recording</span>
              </div>
              
              {zoomCapabilities && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 p-4 rounded-2xl backdrop-blur-md flex items-center gap-4 border border-white/10">
                  <ZoomIn className="w-5 h-5 text-gray-400" />
                  <span className="text-xs font-bold font-mono text-gray-400">{zoomCapabilities.min}x</span>
                  <input 
                    type="range" 
                    min={zoomCapabilities.min} 
                    max={zoomCapabilities.max} 
                    step={zoomCapabilities.step} 
                    value={zoom} 
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                  />
                  <span className="text-xs font-bold font-mono text-[#00E5FF]">{zoom.toFixed(1)}x</span>
                </div>
              )}
            </div>
            <button 
              onClick={stopRecording}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#aa1111] font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,42,42,0.3)] animate-pulse"
            >
              <Square className="w-5 h-5 fill-current" /> Stop Recording
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-6 border border-white/10 shadow-lg">
              <video src={previewUrl!} controls className="w-full h-full object-contain" />
            </div>

            {!analysis && !isAnalyzing && (
              <div className="flex flex-col gap-4">
                <div className="bg-[#1A2235] rounded-xl p-4 border border-white/10">
                  <label className="block text-sm font-bold text-[#00E5FF] uppercase tracking-wider mb-2">
                    What are you working on? (Optional)
                  </label>
                  <textarea 
                    value={userClaim}
                    onChange={(e) => setUserClaim(e.target.value)}
                    placeholder="e.g., '8x30s sprints for conditioning' or '50 reps of 1-2 combos'"
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/50 resize-none h-20 mb-3"
                  />
                  {userClaim.trim() && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Requested XP
                      </label>
                      <input 
                        type="number" 
                        value={requestedXp}
                        onChange={(e) => setRequestedXp(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00E5FF]/50"
                      />
                    </div>
                  )}
                </div>
                <button 
                  onClick={analyzeVideo}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#aa1111] font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,42,42,0.3)]"
                >
                  <Play className="w-5 h-5 fill-current" /> Analyze & Verify
                </button>
              </div>
            )}

            {isAnalyzing && <LoadingState />}

            {analysis && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 bg-[#111623] rounded-2xl p-6 border border-[#00E5FF]/30 overflow-y-auto"
              >
                <div className="flex items-center gap-2 mb-4 text-[#00E5FF]">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-widest">Analysis Complete</h3>
                </div>

                {sessionScore !== null && xpEarned !== null && (
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-[#1A2235] rounded-xl p-4 border border-[#FF2A2A]/30 text-center relative overflow-hidden">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Session Score</div>
                      <div className="text-3xl font-black text-[#FF2A2A]">{sessionScore}<span className="text-lg text-gray-500">/100</span></div>
                    </div>
                    <div className={`flex-1 bg-[#1A2235] rounded-xl p-4 border ${isVerified === false ? 'border-gray-600' : 'border-[#00E5FF]/30'} text-center relative overflow-hidden`}>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">XP Earned</div>
                      <div className={`text-3xl font-black ${isVerified === false ? 'text-gray-500' : 'text-[#00E5FF]'}`}>+{xpEarned}</div>
                      {isVerified === false && <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]"><span className="text-[#FF2A2A] font-bold text-xs uppercase tracking-widest rotate-[-15deg] border-2 border-[#FF2A2A] px-2 py-1">Failed</span></div>}
                    </div>
                  </div>
                )}

                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#00E5FF] prose-a:text-[#FF2A2A]">
                  {analysis.split('\n').map((line, i) => {
                    if (line.startsWith('###')) return <h4 key={i} className="text-md font-bold mt-4 mb-2 text-white">{line.replace('###', '')}</h4>;
                    if (line.startsWith('##')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3 text-[#00E5FF] uppercase">{line.replace('##', '')}</h3>;
                    if (line.startsWith('#')) return <h2 key={i} className="text-xl font-black mt-8 mb-4 text-[#FF2A2A] uppercase">{line.replace('#', '')}</h2>;
                    if (line.startsWith('-')) return <li key={i} className="ml-4 mb-1 text-gray-300">{line.replace('-', '')}</li>;
                    if (line.startsWith('*')) return <li key={i} className="ml-4 mb-1 text-gray-300">{line.replace('*', '')}</li>;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="mb-2 text-gray-300">{line}</p>;
                  })}
                </div>

                {groundingUrls.length > 0 && (
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-[#00E5FF] mb-4">Reference Videos</h3>
                    <div className="space-y-3">
                      {groundingUrls.map((url, i) => (
                        <a 
                          key={i} 
                          href={url.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block p-4 rounded-xl border border-[#1A2235] bg-[#1A2235]/30 hover:border-[#FF2A2A]/50 transition-all"
                        >
                          <h4 className="font-bold text-white text-sm line-clamp-2">{url.title}</h4>
                          <p className="text-xs text-[#00E5FF] mt-1 truncate">{url.uri}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => { setFile(null); setPreviewUrl(null); setAnalysis(null); setAnalysisDrillIds([]); setGroundingUrls([]); setUserClaim(""); setSessionScore(null); setXpEarned(null); setIsVerified(null); }}
                  className="w-full mt-8 py-3 rounded-xl border border-white/20 font-bold uppercase tracking-wider hover:bg-white/5 transition-colors"
                >
                  Analyze Another Clip
                </button>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
