import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mic, MicOff, Activity, Loader2, Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { UserProfile } from '../types';

export default function LiveCoach({ profile, onBack, onUpdateProfile }: { profile: UserProfile, onBack: () => void, onUpdateProfile: (p: UserProfile) => void }) {
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

  const connectLive = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const historyContext = profile.analysisHistory && profile.analysisHistory.length > 0
        ? `\n\nPAST SESSIONS & ANALYSIS:\n${profile.analysisHistory.slice(-3).map((a, i) => `--- Session ${i+1} ---\n${a}`).join('\n\n')}`
        : "";

      const systemInstruction = `You are Vitas, an elite AI MMA fight coach. You are gritty, direct, and highly knowledgeable about all martial arts. The user is a ${profile.baseStyle} fighter, stance: ${profile.stance}, archetype: ${profile.archetype}. Keep responses concise, intense, and focused on improvement. You have access to Google Search to find specific techniques, drills, or YouTube fights to reference. If you find a good video or resource, mention it and provide the link. If the user uploads a photo, analyze their form or homework proof.${historyContext}`;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
          tools: [{ googleSearch: {} }]
        },
        callbacks: {
          onopen: async () => {
            setIsConnected(true);
            setIsConnecting(false);
            await startAudioCapture(sessionPromise);
          },
          onmessage: (message: any) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playAudioChunk(base64Audio);
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      mediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
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
              media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
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
            media: { data: base64data, mimeType: 'image/jpeg' }
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
    <div className="h-full p-6 flex flex-col bg-[#0B0F19] text-white overflow-y-auto hide-scrollbar">
      <header className="flex items-center gap-4 mb-12 shrink-0">
        <button onClick={() => { disconnectLive(); onBack(); }} className="p-2 bg-[#1A2235] rounded-full hover:bg-[#2A3245] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wider">Voice Coach</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative">
        {groundingUrls.length > 0 && (
          <div className="absolute top-0 left-0 right-0 p-4 z-20">
            <div className="bg-[#1A2235]/90 backdrop-blur-md border border-[#00E5FF]/30 rounded-xl p-3 max-h-32 overflow-y-auto hide-scrollbar">
              <h3 className="text-xs text-[#00E5FF] font-bold uppercase tracking-widest mb-2 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Coach References</h3>
              <ul className="space-y-2">
                {groundingUrls.map((url, i) => (
                  <li key={i}>
                    <a href={url.uri} target="_blank" rel="noreferrer" className="text-xs text-gray-300 hover:text-white hover:underline line-clamp-1">
                      {url.title || url.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {uploadedImage && (
          <div className="absolute top-4 right-4 z-20 w-24 h-24 rounded-lg overflow-hidden border-2 border-[#00E5FF]/50 shadow-lg">
            <img src={uploadedImage} alt="Uploaded proof" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-center py-0.5 font-bold">SENT TO COACH</div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isConnected && (
            <>
              <motion.div 
                className="absolute w-64 h-64 border border-[#00E5FF]/20 rounded-full"
                animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute w-64 h-64 border border-[#00E5FF]/20 rounded-full"
                animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
              />
            </>
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            className={`w-40 h-40 rounded-full flex items-center justify-center mb-8 shadow-2xl transition-colors duration-500 ${isConnected ? (isSpeaking ? 'bg-[#FF2A2A]/20 shadow-[0_0_50px_rgba(255,42,42,0.4)]' : 'bg-[#00E5FF]/20 shadow-[0_0_50px_rgba(0,229,255,0.4)]') : 'bg-[#1A2235]'}`}
            animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${isConnected ? (isSpeaking ? 'bg-[#FF2A2A]' : 'bg-[#00E5FF]') : 'bg-[#2A3245]'}`}>
              {isConnecting ? (
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              ) : isConnected ? (
                <Activity className="w-16 h-16 text-white" />
              ) : (
                <MicOff className="w-12 h-12 text-gray-400" />
              )}
            </div>
          </motion.div>

          <h2 className="text-2xl font-black uppercase tracking-widest mb-2">
            {isConnecting ? 'Connecting...' : isConnected ? 'Coach Vitas' : 'Ready to Train'}
          </h2>
          <p className="text-gray-400 text-center max-w-xs mb-12 h-12">
            {isConnecting ? 'Establishing secure link to AI Coach...' : 
             isConnected ? (isSpeaking ? 'Coach is speaking...' : 'Listening... Ask for advice on technique, strategy, or conditioning.') : 
             'Tap connect to start a live voice session with your AI Coach.'}
          </p>

          {error && <p className="text-[#FF2A2A] mb-6">{error}</p>}

          {!isConnected && !isConnecting ? (
            <button 
              onClick={connectLive}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#0099ff] font-bold text-lg uppercase tracking-wider flex items-center gap-3 shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:scale-105 transition-transform"
            >
              <Mic className="w-5 h-5" /> Connect to Coach
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={disconnectLive}
                className="px-8 py-4 rounded-full bg-transparent border-2 border-[#FF2A2A] text-[#FF2A2A] font-bold text-lg uppercase tracking-wider flex items-center gap-3 hover:bg-[#FF2A2A]/10 transition-colors"
              >
                <MicOff className="w-5 h-5" /> End Session
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-full bg-[#1A2235] border border-white/10 text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:bg-[#2A3245] transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-[#00E5FF]" /> Send Photo Proof
              </button>
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
