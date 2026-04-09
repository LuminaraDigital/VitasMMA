import { ArrowLeft, Play, Upload, Camera, Square, Loader2, CheckCircle2, XCircle, Zap, Brain } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { UserProfile, CampTask } from '../types';
import { getAIContext } from '../utils/aiContext';
import { AI_COSTS, LEVEL_XP_THRESHOLD } from '../constants';
import { fetchWithAuth } from '../utils/api';

export default function CampVerification({ profile, task, onUpdateProfile, onBack, onVerifySuccess, onUpgrade }: { profile: UserProfile, task: CampTask, onUpdateProfile: (p: UserProfile) => void, onBack: () => void, onVerifySuccess: () => void, onUpgrade: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [isUploadingToAI, setIsUploadingToAI] = useState(false);
  const [uploadToAIProgress, setUploadToAIProgress] = useState(0);
  
  const [recordingTime, setRecordingTime] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("Preparing video...");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let messageInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    if (isAnalyzing) {
      const messages = [
        "Extracting biomechanical data...",
        "Analyzing technique and form...",
        "Comparing against elite benchmarks...",
        "Finalizing verification score..."
      ];
      let msgIndex = 0;
      setAnalysisMessage(messages[0]);
      setAnalysisProgress(0);

      messageInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        setAnalysisMessage(messages[msgIndex]);
      }, 3500);

      progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const remaining = 95 - prev;
          return prev + remaining * 0.05;
        });
      }, 500);
    }

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isAnalyzing]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File too large. Please upload a video under 50MB.");
        return;
      }
      
      setIsUploading(true);
      setUploadProgress(0);
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            return 100;
          }
          return prev + 15;
        });
      }, 100);
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      setStream(mediaStream);
      setIsRecording(true);
      
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = mediaStream;
      }
      
      const recorder = new MediaRecorder(mediaStream);
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const recordedFile = new File([blob], 'live-recording.webm', { type: 'video/webm' });
        
        setIsUploading(true);
        setUploadProgress(0);
        
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              setFile(recordedFile);
              setPreviewUrl(URL.createObjectURL(blob));
              return 100;
            }
            return prev + 15;
          });
        }, 100);
        
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsRecording(false);
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const analyzeVideo = async () => {
    if (!file) return;

    if (!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.CAMP_VERIFICATION) {
      onUpgrade();
      return;
    }
    
    setIsUploadingToAI(true);
    setUploadToAIProgress(0);
    
    // Simulate network upload to AI servers
    await new Promise<void>((resolve) => {
      const duration = 2000; // 2 seconds simulated upload
      const intervalTime = 50;
      const steps = duration / intervalTime;
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        const progress = (currentStep / steps) * 100;
        setUploadToAIProgress(progress);
        
        if (currentStep >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, intervalTime);
    });
    
    setIsUploadingToAI(false);
    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        let taskSpecificInstructions = "";
        if (task.type === 'drill') {
          taskSpecificInstructions = "Focus your analysis on technique, form, speed, power, combinations, balance, and footwork. Ensure they are executing the specific martial arts movements correctly.";
        } else if (task.type === 'conditioning') {
          taskSpecificInstructions = "Focus your analysis on intensity, pacing, rep counts, stamina, and proper range of motion. Ensure they are pushing their cardiovascular and muscular endurance.";
        } else if (task.type === 'recovery') {
          taskSpecificInstructions = "Focus your analysis on controlled breathing, stretching form, mobility, and relaxation. Ensure they are performing the recovery movements safely and effectively.";
        }

        const promptText = `You are Vitas, an elite AI MMA fight coach.
TASK VERIFICATION:
The user is participating in a Fight Camp and claims to have completed the following task:
Task: "${task.title}"
Type: "${task.type}"
Description: "${task.description}"
Verification Criteria: "${task.verificationCriteria}"

${getAIContext(profile)}

${taskSpecificInstructions}

Analyze the provided video to verify if the user actually completed this task according to the criteria.

RETURN A JSON OBJECT WITH THESE FIELDS:
{
  "isVerified": boolean,
  "analysis": "string (detailed explanation)",
  "formCorrections": ["string (tip 1)", "string (tip 2)"]
}`;

        // Deduct credits via server if not Pro
        if (!profile.isPro) {
          const creditRes = await fetchWithAuth('/api/use-credits', {
            method: 'POST',
            body: JSON.stringify({ userId: profile.id, amount: AI_COSTS.CAMP_VERIFICATION })
          });
          if (!creditRes.ok) {
            const err = await creditRes.json();
            throw new Error(err.error || 'Failed to deduct credits');
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
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isVerified: { type: Type.BOOLEAN },
                analysis: { type: Type.STRING },
                formCorrections: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['isVerified', 'analysis', 'formCorrections']
            }
          }
        });

        const result = JSON.parse(response.text || '{}');
        
        const verified = result.isVerified === true;
        setIsVerified(verified);
        
        let formattedAnalysis = `## Analysis\n${result.analysis || 'No analysis provided.'}\n\n`;
        if (result.formCorrections && result.formCorrections.length > 0) {
          formattedAnalysis += `## Form Corrections\n`;
          result.formCorrections.forEach((tip: string) => {
            formattedAnalysis += `- ${tip}\n`;
          });
        }
        setAnalysis(formattedAnalysis);
        
        if (verified) {
          const xp = task.xpReward;
          setXpEarned(xp);
          
          // Add XP via server
          try {
            await fetchWithAuth('/api/add-xp', {
              method: 'POST',
              body: JSON.stringify({ userId: profile.id, xpAmount: xp, reason: 'camp_verification' })
            });
          } catch (err) {
            console.error('Error adding XP:', err);
          }

          // Mark task complete in active camp
          let updatedCamp = profile.activeCamp;
          if (updatedCamp) {
            updatedCamp = {
              ...updatedCamp,
              tasks: updatedCamp.tasks.map(t => t.id === task.id ? { ...t, completed: true } : t)
            };
          }

          onUpdateProfile({
            ...profile,
            activeCamp: updatedCamp,
            // Optimistic update for credits if not Pro
            aiCredits: profile.isPro ? profile.aiCredits : (profile.aiCredits || 0) - AI_COSTS.CAMP_VERIFICATION
          });
        }
        
        setIsAnalyzing(false);
      };
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Error verifying task. Please try again.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full p-4 md:p-6 flex flex-col bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <header className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 shrink-0">
        <button onClick={() => {
          if (isRecording) stopRecording();
          onBack();
        }} className="p-2 bg-[#1A2235] rounded-full hover:bg-[#2A3245] transition-colors">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider">Task Verification</h1>
          <p className="text-[10px] md:text-xs text-gray-400 font-mono">{task.title}</p>
        </div>
      </header>

      <div className="bg-[#111623] border border-white/10 rounded-2xl p-4 md:p-5 mb-4 md:mb-6 shrink-0">
        <h2 className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2">Verification Criteria</h2>
        <p className="text-xs md:text-sm text-gray-300 italic">"{task.verificationCriteria}"</p>
      </div>

      <main className="flex-1 flex flex-col">
        {error && (
          <div className="bg-[#FF2A2A]/10 border border-[#FF2A2A]/50 text-[#FF2A2A] p-3 md:p-4 rounded-xl mb-4 text-xs md:text-sm flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-[#FF2A2A]/20 rounded-full transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
        {!previewUrl && !isRecording && !isUploading ? (
          <div className="flex-1 flex flex-col gap-3 md:gap-4 min-h-0 pb-4">
            <div 
              className="flex-1 min-h-[140px] md:min-h-[180px] border-2 border-dashed border-[#00E5FF]/30 rounded-2xl flex flex-col items-center justify-center bg-[#00E5FF]/5 cursor-pointer hover:bg-[#00E5FF]/10 transition-colors p-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 md:w-10 md:h-10 text-[#00E5FF] mb-2 md:mb-3" />
              <h2 className="text-base md:text-lg font-bold mb-1">Upload Proof</h2>
              <p className="text-[10px] md:text-xs text-gray-400 text-center max-w-xs">Select a video showing you completing the task.</p>
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
            
            <div 
              className="flex-1 min-h-[140px] md:min-h-[180px] border-2 border-dashed border-[#FF2A2A]/30 rounded-2xl flex flex-col items-center justify-center bg-[#FF2A2A]/5 cursor-pointer hover:bg-[#FF2A2A]/10 transition-colors p-4"
              onClick={startRecording}
            >
              <Camera className="w-8 h-8 md:w-10 md:h-10 text-[#FF2A2A] mb-2 md:mb-3" />
              <h2 className="text-base md:text-lg font-bold mb-1">Record Live</h2>
              <p className="text-[10px] md:text-xs text-gray-400 text-center max-w-xs">Capture your task execution in real-time.</p>
            </div>
          </div>
        ) : isUploading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#111623] rounded-2xl border border-white/10 p-6 md:p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-[#00E5FF]/5 to-transparent opacity-50"></div>
            <Upload className="w-12 h-12 md:w-16 md:h-16 text-[#00E5FF] animate-bounce mb-4 md:mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
            <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-[#00E5FF] mb-3 md:mb-4 relative z-10">Uploading Video</h3>
            
            <div className="w-full max-w-xs h-1.5 md:h-2 bg-black/50 rounded-full overflow-hidden mb-2 relative z-10 border border-white/10 shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#00E5FF] to-[#0088FF]"
                animate={{ width: `${uploadProgress}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
            <p className="text-xs md:text-sm text-gray-300 font-bold tracking-wide relative z-10">{Math.round(uploadProgress)}%</p>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col h-full">
            <div className="relative rounded-2xl overflow-hidden bg-black flex-1 mb-4 md:mb-6 border border-[#FF2A2A]/50 shadow-[0_0_15px_rgba(255,42,42,0.2)]">
              <video 
                ref={liveVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-4 right-4 flex items-center gap-2 md:gap-3 bg-black/60 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md border border-[#FF2A2A]/30 shadow-lg">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#FF2A2A] animate-pulse shadow-[0_0_8px_rgba(255,42,42,0.8)]" />
                <span className="text-xs md:text-sm font-black text-[#FF2A2A] uppercase tracking-widest">REC</span>
                <span className="text-xs md:text-sm font-mono text-white/90 font-bold">{formatTime(recordingTime)}</span>
              </div>
            </div>
            <button 
              onClick={stopRecording}
              className="w-full py-3 md:py-4 rounded-xl bg-gradient-to-r from-[#FF2A2A] to-[#aa1111] font-bold text-base md:text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,42,42,0.3)] animate-pulse"
            >
              <Square className="w-4 h-4 md:w-5 md:h-5 fill-current" /> Stop Recording
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-4 md:mb-6 border border-white/10 shadow-lg">
              <video src={previewUrl!} controls className="w-full h-full object-contain" />
            </div>

            {!analysis && !isAnalyzing && !isUploadingToAI && (
              <button 
                onClick={analyzeVideo}
                className="w-full py-3 md:py-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0088FF] font-bold text-base md:text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.3)] text-black"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> Verify Task 
                <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1 ml-2"><Brain className="w-3 h-3" /> {AI_COSTS.CAMP_VERIFICATION}</span>
              </button>
            )}

            {isUploadingToAI && (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#111623] rounded-2xl border border-white/10 p-6 md:p-8 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00E5FF]/5 to-transparent opacity-50"></div>
                <Upload className="w-10 h-10 md:w-12 md:h-12 text-[#00E5FF] animate-bounce mb-3 md:mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
                <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-[#00E5FF] mb-2 md:mb-3 relative z-10">Uploading to AI</h3>
                
                <div className="w-full max-w-xs h-1.5 md:h-2 bg-black/50 rounded-full overflow-hidden mb-2 relative z-10 border border-white/10 shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#00E5FF] to-[#0088FF]"
                    animate={{ width: `${uploadToAIProgress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                  />
                </div>
                <p className="text-[10px] md:text-xs text-gray-300 font-bold tracking-wide relative z-10">{Math.round(uploadToAIProgress)}%</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#111623] rounded-2xl border border-white/10 p-6 md:p-8 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00E5FF]/5 to-transparent opacity-50"></div>
                <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-[#00E5FF] animate-spin mb-4 md:mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
                <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-[#00E5FF] mb-3 md:mb-4 relative z-10">Analyzing Execution</h3>
                
                <div className="w-full max-w-xs h-1.5 md:h-2 bg-black/50 rounded-full overflow-hidden mb-4 md:mb-6 relative z-10 border border-white/10 shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#00E5FF] to-[#0088FF]"
                    animate={{ width: `${analysisProgress}%` }}
                    transition={{ ease: "linear", duration: 0.5 }}
                  />
                </div>
                
                <div className="h-6 relative z-10 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={analysisMessage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs md:text-sm text-gray-300 font-bold tracking-wide absolute"
                    >
                      {analysisMessage}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            )}

            {analysis && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex-1 bg-[#111623] rounded-2xl p-4 md:p-6 border ${isVerified ? 'border-[#00E5FF]/50' : 'border-[#FF2A2A]/50'} overflow-y-auto`}
              >
                <div className={`flex items-center gap-2 mb-4 ${isVerified ? 'text-[#00E5FF]' : 'text-[#FF2A2A]'}`}>
                  {isVerified ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <XCircle className="w-5 h-5 md:w-6 md:h-6" />}
                  <h3 className="font-bold uppercase tracking-widest text-base md:text-lg">
                    {isVerified ? 'Task Verified' : 'Verification Failed'}
                  </h3>
                </div>

                {isVerified && xpEarned !== null && (
                  <div className="bg-[#1A2235] rounded-xl p-3 md:p-4 border border-[#00E5FF]/30 text-center mb-4 md:mb-6">
                    <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">XP Earned</div>
                    <div className="text-2xl md:text-3xl font-black text-[#00E5FF] flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5 md:w-6 md:h-6" /> +{xpEarned}
                    </div>
                  </div>
                )}

                <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:text-[#00E5FF] prose-a:text-[#FF2A2A]">
                  {analysis.split('\n').map((line, i) => {
                    if (line.startsWith('###')) return <h4 key={i} className="text-sm md:text-md font-bold mt-3 md:mt-4 mb-1 md:mb-2 text-white">{line.replace('###', '')}</h4>;
                    if (line.startsWith('##')) return <h3 key={i} className="text-base md:text-lg font-bold mt-4 md:mt-6 mb-2 md:mb-3 text-[#00E5FF] uppercase tracking-wider">{line.replace('##', '')}</h3>;
                    if (line.startsWith('#')) return <h2 key={i} className="text-lg md:text-xl font-black mt-6 md:mt-8 mb-3 md:mb-4 text-[#FF2A2A] uppercase italic">{line.replace('#', '')}</h2>;
                    if (line.startsWith('-')) return <li key={i} className="ml-3 md:ml-4 mb-1 text-gray-300">{line.replace('-', '')}</li>;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="mb-2 text-gray-300 leading-relaxed">{line}</p>;
                  })}
                </div>

                {isVerified ? (
                  <button 
                    onClick={onVerifySuccess}
                    className="w-full mt-6 md:mt-8 py-3 md:py-4 rounded-xl bg-[#00E5FF]/20 text-[#00E5FF] font-bold uppercase tracking-wider hover:bg-[#00E5FF]/30 transition-colors text-sm md:text-base"
                  >
                    Return to Camp
                  </button>
                ) : (
                  <button 
                    onClick={() => { setFile(null); setPreviewUrl(null); setAnalysis(null); setIsVerified(null); setXpEarned(null); }}
                    className="w-full mt-6 md:mt-8 py-3 rounded-xl border border-[#FF2A2A]/50 text-[#FF2A2A] font-bold uppercase tracking-wider hover:bg-[#FF2A2A]/10 transition-colors text-sm md:text-base"
                  >
                    Try Again
                  </button>
                )}
              </motion.div>
            )}
          </div>
        )}
      </main>


    </div>
  );
}
