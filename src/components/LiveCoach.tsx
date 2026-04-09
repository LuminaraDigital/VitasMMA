import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mic, MicOff, Activity, Loader2, Upload, Image as ImageIcon, Link as LinkIcon, XCircle, Brain } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { getAIContext } from '../utils/aiContext';
import { UserProfile } from '../types';
import { AI_COSTS } from '../constants';
import { fetchWithAuth } from '../utils/api';

export default function LiveCoach({ profile, onBack, onUpdateProfile, onUpgrade }: { profile: UserProfile, onBack: () => void, onUpdateProfile: (p: UserProfile) => void, onUpgrade: () => void }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [groundingUrls, setGroundingUrls] = useState<{uri: string, title: string}[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const currentSessionTranscriptRef = useRef<{ role: 'user' | 'model', content: string }[]>([]);

  const connectLive = async () => {
    // Pro users get unlimited coaching
    if (!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.LIVE_COACH) {
      onUpgrade();
      return;
    }

    setIsConnecting(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are Vitas, an elite AI combat strategist and MMA coach. You are gritty, direct, and have zero tolerance for mediocrity. Your knowledge of martial arts is absolute.
      
${getAIContext(profile)}

Your tone:
- Gritty, intense, and authoritative.
- Direct and no-nonsense.
- Use combat terminology (e.g., "check the leg", "cut the angle", "sink the choke").
- Focus on high-level improvement and tactical dominance.

Your capabilities:
- You have access to Google Search to find specific techniques, drills, or YouTube fights to reference.
- If you find a good video or resource, mention it and provide the link.
- If the user uploads a photo, analyze their form or homework proof with surgical precision.

Keep responses concise and focused on the next evolution of their game.`;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: systemInstruction + (profile.chatHistory ? `\n\nPREVIOUS CONVERSATION HISTORY:\n${profile.chatHistory.map(m => `${m.role === 'user' ? 'Fighter' : 'Vitas'}: ${m.content}`).join('\n')}` : ''),
          tools: [{ googleSearch: {} }],
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        },
        callbacks: {
          onopen: async () => {
            currentSessionTranscriptRef.current = [];
            setIsConnected(true);
            setIsConnecting(false);
            
            if (!profile.isPro) {
              try {
                const creditRes = await fetchWithAuth('/api/use-credits', {
                  method: 'POST',
                  body: JSON.stringify({ userId: profile.id, amount: AI_COSTS.LIVE_COACH })
                });
                if (!creditRes.ok) {
                  const err = await creditRes.json();
                  throw new Error(err.error || 'Failed to deduct credits');
                }
                onUpdateProfile({
                  ...profile,
                  aiCredits: (profile.aiCredits || 0) - AI_COSTS.LIVE_COACH
                });
              } catch (err: any) {
                console.error("Credit deduction failed:", err);
                setError(err.message || "Failed to deduct credits");
                disconnectLive();
                return;
              }
            }
            
            await startAudioCapture(sessionPromise);
          },
          onmessage: (message: any) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playAudioChunk(base64Audio);
            }
            // Handle transcription for persistent memory
            if (message.serverContent?.modelTurn?.parts) {
              const textPart = message.serverContent.modelTurn.parts.find((p: any) => p.text);
              if (textPart && textPart.text) {
                // Append to current session transcript
                const lastMsg = currentSessionTranscriptRef.current[currentSessionTranscriptRef.current.length - 1];
                if (lastMsg && lastMsg.role === 'model') {
                  lastMsg.content += textPart.text;
                } else {
                  currentSessionTranscriptRef.current.push({ role: 'model', content: textPart.text });
                }
              }
            }
            
            if (message.serverContent?.interrupted) {
              stopPlayback();
            }

            // Extract grounding URLs if available
            const chunks = message.serverContent?.modelTurn?.parts?.[0]?.groundingMetadata?.groundingChunks || message.serverContent?.groundingMetadata?.groundingChunks;
            if (chunks && chunks.length > 0) {
              const urls = chunks.map((c: any) => c.web).filter(Boolean);
              if (urls.length > 0) {
                setGroundingUrls(prev => {
                  const newUrls = [...prev];
                  urls.forEach((u: any) => {
                    if (!newUrls.find(existing => existing.uri === u.uri)) {
                      newUrls.push(u);
                    }
                  });
                  return newUrls;
                });
              }
            }
          },
          onclose: () => {
            setIsConnected(false);
            stopAudioCapture();
            
            // Save accumulated transcript to profile
            if (currentSessionTranscriptRef.current.length > 0) {
              onUpdateProfile({
                ...profile,
                chatHistory: [...(profile.chatHistory || []), ...currentSessionTranscriptRef.current].slice(-20)
              });
            }
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            setError("Connection error. Please try again.");
            setIsConnected(false);
            setIsConnecting(false);
            stopAudioCapture();
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (err) {
      console.error(err);
      setError("Failed to connect to Coach Vitas.");
      setIsConnecting(false);
    }
  };

  const startAudioCapture = async (sessionPromise: Promise<any>) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 24000, channelCount: 1 } });
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        pcm16.forEach((val, i) => view.setInt16(i * 2, val, true));
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);
        
        sessionPromise.then((session) => {
          if (isConnected) {
            session.sendRealtimeInput({
              audio: { data: base64Data, mimeType: 'audio/pcm;rate=24000' }
            });
          }
        });
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
    } catch (err) {
      console.error("Audio capture error:", err);
      setError("Microphone access denied.");
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    stopPlayback();
  };

  const playAudioChunk = async (base64Audio: string) => {
    setIsSpeaking(true);
    if (!audioContextRef.current) return;
    
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }
    
    playbackQueueRef.current.push(float32);
    if (!isPlayingRef.current) {
      scheduleNextBuffer();
    }
  };

  const scheduleNextBuffer = () => {
    if (playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }
    
    isPlayingRef.current = true;
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    
    const float32 = playbackQueueRef.current.shift()!;
    const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    if (nextPlayTimeRef.current < audioContext.currentTime) {
      nextPlayTimeRef.current = audioContext.currentTime;
    }
    
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
    
    source.onended = () => {
      scheduleNextBuffer();
    };
  };

  const stopPlayback = () => {
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    nextPlayTimeRef.current = 0;
  };

  const disconnectLive = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
      
      // Log session
      const newHistory = [...(profile.analysisHistory || []), `Live Voice Session - ${new Date().toLocaleDateString()}`].slice(-5);
      onUpdateProfile({ ...profile, analysisHistory: newHistory });
    }
    setIsConnected(false);
    stopAudioCapture();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        setUploadedImage(URL.createObjectURL(file));
        
        if (sessionRef.current && isConnected) {
          sessionRef.current.sendRealtimeInput({
            video: { data: base64data, mimeType: 'image/jpeg' }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      disconnectLive();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white overflow-hidden relative font-sans">

      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-brand-violet/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-brand-teal/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
        
        {/* Dynamic Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <header className="sticky top-0 z-50 glass-dark px-4 md:px-6 py-4 md:py-6 flex items-center justify-between border-b border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="flex items-center gap-4 md:gap-6">
          <motion.button 
            whileHover={{ scale: 1.1, x: -2, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { disconnectLive(); onBack(); }} 
            className="p-2 md:p-3 bg-white/5 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all border border-white/10 shadow-xl"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </motion.button>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-gradient leading-none">Voice Coach</h1>
            <div className="flex items-center gap-2 mt-1 md:mt-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isConnected ? 'bg-brand-teal' : 'bg-white/20'}`} />
              <span className="text-[8px] md:text-[9px] font-black italic uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40">Live AI Link</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-brand-teal/10 px-3 py-1.5 rounded-lg border border-brand-teal/30">
          <Brain className="w-4 h-4 text-brand-teal" />
          <span className="font-mono text-xs text-brand-teal font-bold">{profile.aiCredits ?? 100} V-Coins</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        {groundingUrls.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 md:top-8 left-4 md:left-8 right-4 md:right-8 z-20"
          >
            <div className="glass-dark border border-brand-teal/20 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 max-h-56 overflow-y-auto hide-scrollbar shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
              <h3 className="text-[10px] text-brand-teal font-black italic uppercase tracking-[0.4em] mb-4 md:mb-5 flex items-center gap-3">
                <LinkIcon className="w-3.5 h-3.5" /> Coach References
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {groundingUrls.map((url, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="list-none"
                  >
                    <a 
                      href={url.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="glass p-3 rounded-xl text-xs text-white/60 hover:text-brand-teal transition-all line-clamp-1 font-bold flex items-center gap-3 group border border-white/5 hover:border-brand-teal/30"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-teal/40 group-hover:bg-brand-teal group-hover:scale-125 transition-all" />
                      {url.title || url.uri}
                    </a>
                  </motion.li>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {uploadedImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: -5 }}
            whileHover={{ scale: 1.1, rotate: 0 }}
            className="absolute top-4 md:top-8 right-4 md:right-8 z-20 w-24 h-24 md:w-40 md:h-40 rounded-2xl md:rounded-[2.5rem] overflow-hidden border-2 border-brand-teal/40 shadow-[0_30px_60px_rgba(0,0,0,0.5)] group cursor-pointer"
          >
            <img src={uploadedImage} alt="Uploaded proof" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[8px] font-black italic uppercase tracking-widest text-white">View Proof</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-brand-teal/90 text-[7px] md:text-[9px] text-black text-center py-1 md:py-2 font-black italic uppercase tracking-widest backdrop-blur-md">SENT TO COACH</div>
          </motion.div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isConnected && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <motion.div 
                  key={i}
                  className="absolute w-64 h-64 md:w-96 md:h-96 border border-brand-teal/10 rounded-full"
                  animate={{ 
                    scale: [1, 2, 3], 
                    opacity: [0.4, 0.1, 0],
                    borderWidth: ['1px', '3px', '1px']
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeOut", 
                    delay: i * 1 
                  }}
                />
              ))}
            </>
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
          <motion.div 
            className={`w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center mb-8 md:mb-12 shadow-[0_0_120px_rgba(0,0,0,0.6)] transition-all duration-1000 relative perspective-2000 ${isConnected ? (isSpeaking ? 'bg-brand-violet/5' : 'bg-brand-teal/5') : 'bg-white/5'}`}
            animate={isSpeaking ? { 
              scale: [1, 1.08, 1],
              rotateY: [0, 10, -10, 0],
              rotateX: [0, -10, 10, 0],
              z: [0, 50, 0]
            } : {
              rotateY: [0, 5, -5, 0],
              rotateX: [0, -5, 5, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* 3D Sphere Glow */}
            <div className={`absolute inset-4 rounded-full blur-3xl opacity-30 transition-colors duration-1000 ${isConnected ? (isSpeaking ? 'bg-brand-violet' : 'bg-brand-teal') : 'bg-white/10'}`} />
            
            <div className={`w-36 h-36 md:w-52 md:h-52 rounded-full flex items-center justify-center transition-all duration-1000 relative z-10 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] border border-white/10 ${isConnected ? (isSpeaking ? 'bg-brand-violet' : 'bg-brand-teal') : 'bg-white/5'}`}>
              {/* Specular Highlights */}
              <div className="absolute top-[15%] left-[25%] w-[40%] h-[40%] bg-white/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-[20%] right-[20%] w-[20%] h-[20%] bg-black/20 rounded-full blur-xl pointer-events-none" />
              
              {isConnecting ? (
                <Loader2 className="w-20 h-20 text-white animate-spin opacity-80" />
              ) : isConnected ? (
                <motion.div
                  animate={isSpeaking ? { 
                    scale: [1, 1.3, 1],
                    filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                  } : {}}
                  transition={{ duration: 0.4, repeat: Infinity }}
                >
                  <Activity className="w-28 h-28 text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]" />
                </motion.div>
              ) : (
                <MicOff className="w-20 h-20 text-white/20" />
              )}
            </div>
          </motion.div>

          <div className="text-center space-y-2 md:space-y-4 mb-8 md:mb-16">
            <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter text-gradient">
              {isConnecting ? 'Establishing Link' : isConnected ? 'Coach Vitas' : 'Ready to Train'}
            </h2>
            <div className="h-12 md:h-20 flex items-center justify-center">
              <p className="text-white/40 text-center max-w-sm font-bold leading-relaxed text-[10px] md:text-sm px-4 md:px-6 italic">
                {isConnecting ? 'Syncing neural patterns with elite combat database...' : 
                 isConnected ? (isSpeaking ? 'Coach is analyzing your performance...' : 'Awaiting your command. Ask for strategy, drills, or analysis.') : 
                 'Initiate a secure voice link for real-time combat guidance.'}
              </p>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 font-black italic uppercase tracking-[0.2em] text-[9px] md:text-[10px] mb-6 md:mb-10 shadow-2xl backdrop-blur-xl flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-full transition-colors ml-4">
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {!isConnected && !isConnecting ? (
            <motion.button 
              whileHover={{ scale: 1.05, y: -8, rotateX: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectLive}
              className="group relative px-6 md:px-16 py-4 md:py-8 rounded-2xl md:rounded-[2.5rem] bg-gradient-to-br from-brand-teal via-brand-blue to-brand-teal bg-[length:200%_200%] animate-gradient font-black text-lg md:text-3xl italic uppercase tracking-tighter flex items-center gap-3 md:gap-6 shadow-[0_20px_50px_rgba(0,229,255,0.4)] md:shadow-[0_30px_70px_rgba(0,229,255,0.4)] text-black overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-expo" />
              <Mic className="w-5 h-5 md:w-8 md:h-8 relative z-10" /> 
              <span className="relative z-10 flex items-center gap-2">
                Connect Link
                <span className="text-xs md:text-sm bg-black/20 px-2 md:px-3 py-1 rounded-full flex items-center gap-1 md:gap-2 ml-2 text-white"><Brain className="w-3 h-3 md:w-4 md:h-4" /> {AI_COSTS.LIVE_COACH}</span>
              </span>
            </motion.button>
          ) : (
            <div className="flex flex-col items-center gap-4 md:gap-10 w-full">
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={disconnectLive}
                className="px-6 md:px-16 py-4 md:py-8 rounded-2xl md:rounded-[2.5rem] bg-transparent border-2 border-brand-violet text-brand-violet font-black text-lg md:text-3xl italic uppercase tracking-tighter flex items-center gap-3 md:gap-6 hover:bg-brand-violet/10 transition-all shadow-[0_15px_40px_rgba(168,85,247,0.3)] md:shadow-[0_20px_50px_rgba(168,85,247,0.3)] backdrop-blur-md"
              >
                <MicOff className="w-5 h-5 md:w-8 md:h-8" /> End Session
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="px-5 md:px-12 py-3 md:py-6 rounded-xl md:rounded-[2rem] glass border border-white/10 text-white font-black text-[10px] md:text-sm italic uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 md:gap-5 hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] md:hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] transition-all"
              >
                <div className="p-1.5 md:p-2 bg-brand-teal/20 rounded-lg">
                  <ImageIcon className="w-4 h-4 md:w-6 md:h-6 text-brand-teal" />
                </div>
                Send Photo Proof
              </motion.button>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
