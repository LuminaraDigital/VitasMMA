import { ArrowLeft, Play, Upload, Camera, Square, Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UserProfile, CampTask } from '../types';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export default function CampVerification({ profile, task, onUpdateProfile, onBack, onVerifySuccess }: { profile: UserProfile, task: CampTask, onUpdateProfile: (p: UserProfile) => void, onBack: () => void, onVerifySuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert("File too large. Please upload a video under 50MB.");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const startRecording = async () => {
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
        setFile(recordedFile);
        setPreviewUrl(URL.createObjectURL(blob));
        
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsRecording(false);
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
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
        
        const promptText = `You are Vitas, an elite AI MMA fight coach.
TASK VERIFICATION:
The user is participating in a Fight Camp and claims to have completed the following task:
Task: "${task.title}"
Description: "${task.description}"
Verification Criteria: "${task.verificationCriteria}"

Analyze the provided video to verify if the user actually completed this task according to the criteria.

Provide your response in the following EXACT format (use markdown):
# 🎯 Verification Status
[VERIFIED] or [FAILED]

# 📊 Analysis
(Explain why it passed or failed. Did they throw enough reps? Was the form correct? Be specific based on the video.)

# 💡 Form Corrections
(1-2 quick tips to improve next time.)`;

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
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
          }
        });
        
        const newAnalysis = response.text || "Analysis complete.";
        setAnalysis(newAnalysis);
        
        const verified = newAnalysis.includes('[VERIFIED]');
        setIsVerified(verified);
        
        if (verified) {
          const xp = task.xpReward;
          setXpEarned(xp);
          
          let newXp = (profile.xp || 0) + xp;
          let newLevel = profile.level || 1;
          
          if (newXp >= newLevel * 1000) {
            newLevel += 1;
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
            xp: newXp,
            level: newLevel,
            activeCamp: updatedCamp
          });
        }
        
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
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Task Verification</h1>
          <p className="text-xs text-gray-400 font-mono">{task.title}</p>
        </div>
      </header>

      <div className="bg-[#111623] border border-white/10 rounded-2xl p-5 mb-6 shrink-0">
        <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Verification Criteria</h2>
        <p className="text-sm text-gray-300 italic">"{task.verificationCriteria}"</p>
      </div>

      <main className="flex-1 flex flex-col">
        {!previewUrl && !isRecording ? (
          <div className="flex-1 flex flex-col gap-4 min-h-0 pb-4">
            <div 
              className="flex-1 min-h-[180px] border-2 border-dashed border-[#00E5FF]/30 rounded-2xl flex flex-col items-center justify-center bg-[#00E5FF]/5 cursor-pointer hover:bg-[#00E5FF]/10 transition-colors p-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-[#00E5FF] mb-3" />
              <h2 className="text-lg font-bold mb-1">Upload Proof</h2>
              <p className="text-xs text-gray-400 text-center max-w-xs">Select a video showing you completing the task.</p>
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
            
            <div 
              className="flex-1 min-h-[180px] border-2 border-dashed border-[#FF2A2A]/30 rounded-2xl flex flex-col items-center justify-center bg-[#FF2A2A]/5 cursor-pointer hover:bg-[#FF2A2A]/10 transition-colors p-4"
              onClick={startRecording}
            >
              <Camera className="w-10 h-10 text-[#FF2A2A] mb-3" />
              <h2 className="text-lg font-bold mb-1">Record Live</h2>
              <p className="text-xs text-gray-400 text-center max-w-xs">Capture your task execution in real-time.</p>
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
              <button 
                onClick={analyzeVideo}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0088FF] font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.3)] text-black"
              >
                <Play className="w-5 h-5 fill-current" /> Verify Task
              </button>
            )}

            {isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#111623] rounded-2xl border border-white/10 p-6 text-center">
                <Loader2 className="w-12 h-12 text-[#00E5FF] animate-spin mb-4" />
                <h3 className="text-lg font-bold uppercase tracking-widest text-[#00E5FF] mb-2">Analyzing Execution</h3>
                <p className="text-sm text-gray-400">Vitas is verifying your reps and form...</p>
              </div>
            )}

            {analysis && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex-1 bg-[#111623] rounded-2xl p-6 border ${isVerified ? 'border-[#00E5FF]/50' : 'border-[#FF2A2A]/50'} overflow-y-auto`}
              >
                <div className={`flex items-center gap-2 mb-4 ${isVerified ? 'text-[#00E5FF]' : 'text-[#FF2A2A]'}`}>
                  {isVerified ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  <h3 className="font-bold uppercase tracking-widest text-lg">
                    {isVerified ? 'Task Verified' : 'Verification Failed'}
                  </h3>
                </div>

                {isVerified && xpEarned !== null && (
                  <div className="bg-[#1A2235] rounded-xl p-4 border border-[#00E5FF]/30 text-center mb-6">
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">XP Earned</div>
                    <div className="text-3xl font-black text-[#00E5FF] flex items-center justify-center gap-2">
                      <Zap className="w-6 h-6" /> +{xpEarned}
                    </div>
                  </div>
                )}

                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#00E5FF] prose-a:text-[#FF2A2A]">
                  {analysis.split('\n').map((line, i) => {
                    if (line.startsWith('###')) return <h4 key={i} className="text-md font-bold mt-4 mb-2 text-white">{line.replace('###', '')}</h4>;
                    if (line.startsWith('##')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3 text-[#00E5FF] uppercase tracking-wider">{line.replace('##', '')}</h3>;
                    if (line.startsWith('#')) return <h2 key={i} className="text-xl font-black mt-8 mb-4 text-[#FF2A2A] uppercase italic">{line.replace('#', '')}</h2>;
                    if (line.startsWith('-')) return <li key={i} className="ml-4 mb-1 text-gray-300">{line.replace('-', '')}</li>;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="mb-2 text-gray-300 leading-relaxed">{line}</p>;
                  })}
                </div>

                {isVerified ? (
                  <button 
                    onClick={onVerifySuccess}
                    className="w-full mt-8 py-4 rounded-xl bg-[#00E5FF]/20 text-[#00E5FF] font-bold uppercase tracking-wider hover:bg-[#00E5FF]/30 transition-colors"
                  >
                    Return to Camp
                  </button>
                ) : (
                  <button 
                    onClick={() => { setFile(null); setPreviewUrl(null); setAnalysis(null); setIsVerified(null); setXpEarned(null); }}
                    className="w-full mt-8 py-3 rounded-xl border border-[#FF2A2A]/50 text-[#FF2A2A] font-bold uppercase tracking-wider hover:bg-[#FF2A2A]/10 transition-colors"
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
