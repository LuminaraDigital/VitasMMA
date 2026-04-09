import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Brain, Loader2, Target, Shield, Zap, Swords, Activity, ShieldAlert, XCircle, BookOpen } from 'lucide-react';
import { UserProfile } from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import { getAIContext } from '../utils/aiContext';
import { AI_COSTS } from '../constants';
import ReactMarkdown from 'react-markdown';
import { fetchWithAuth } from '../utils/api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts';
import { searchKnowledgeBase } from '../services/ragService';

interface FighterAttributes {
  striking: number;
  grappling: number;
  clinch: number;
  speed: number;
  power: number;
  cardio: number;
}

interface StrategyData {
  strategy: string;
  userAttributes: FighterAttributes;
  opponentAttributes: FighterAttributes;
  insights: {
    userAdvantage: string;
    opponentThreat: string;
  };
}

export default function StrategyAdvisor({ profile, onBack, onUpdateProfile, onUpgrade }: { profile: UserProfile, onBack: () => void, onUpdateProfile: (p: UserProfile) => void, onUpgrade: () => void }) {
  const [opponentName, setOpponentName] = useState('');
  const [opponentStyle, setOpponentStyle] = useState('');
  const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRAG, setUseRAG] = useState(true);

  const generateStrategy = async () => {
    if (!opponentStyle.trim()) return;
    if (!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.STRATEGY_ADVISOR) {
      onUpgrade();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let ragContext = "";
      if (useRAG) {
        try {
          const relevantChunks = await searchKnowledgeBase(profile.id, opponentStyle, 3);
          if (relevantChunks.length > 0) {
            ragContext = `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${relevantChunks.join('\n---\n')}\n\n`;
          }
        } catch (ragErr) {
          console.warn("RAG search failed, proceeding without it:", ragErr);
        }
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        You are an elite MMA fight strategist. 
        Analyze the following matchup and provide a detailed game plan and counter-strategies.
        
        ${getAIContext(profile)}
        ${ragContext}
        
        OPPONENT NAME: ${opponentName || 'Unknown'}
        OPPONENT STYLE & DESCRIPTION:
        - ${opponentStyle}
        
        Please provide:
        1. OVERALL GAME PLAN: The core strategy to win.
        2. STRIKING STRATEGY: How to handle the stand-up.
        3. GRAPPLING/CLINCH STRATEGY: How to handle the ground and clinch.
        4. KEY COUNTERS: Specific techniques to counter their style.
        5. DANGER ZONES: What to avoid at all costs.
        
        Also, provide numeric ratings (0-100) for both fighters across these 6 attributes:
        - Striking
        - Grappling
        - Clinch
        - Speed
        - Power
        - Cardio
        
        Finally, identify:
        - userAdvantage: My single biggest tactical advantage in this specific matchup.
        - opponentThreat: The opponent's single most dangerous threat I must neutralize.
        
        For my fighter, use the provided Striking, Grappling, and Clinch values, and estimate Speed, Power, and Cardio based on my profile (Base Style: ${profile.baseStyle}, Archetype: ${profile.archetype}).
        For the opponent, estimate all 6 attributes based on the provided description.
        
        Format the response in clear sections with bold headings using Markdown for the strategy.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategy: { type: Type.STRING, description: "The detailed fight strategy in Markdown format." },
              userAttributes: {
                type: Type.OBJECT,
                properties: {
                  striking: { type: Type.NUMBER },
                  grappling: { type: Type.NUMBER },
                  clinch: { type: Type.NUMBER },
                  speed: { type: Type.NUMBER },
                  power: { type: Type.NUMBER },
                  cardio: { type: Type.NUMBER },
                },
                required: ["striking", "grappling", "clinch", "speed", "power", "cardio"]
              },
              opponentAttributes: {
                type: Type.OBJECT,
                properties: {
                  striking: { type: Type.NUMBER },
                  grappling: { type: Type.NUMBER },
                  clinch: { type: Type.NUMBER },
                  speed: { type: Type.NUMBER },
                  power: { type: Type.NUMBER },
                  cardio: { type: Type.NUMBER },
                },
                required: ["striking", "grappling", "clinch", "speed", "power", "cardio"]
              },
              insights: {
                type: Type.OBJECT,
                properties: {
                  userAdvantage: { type: Type.STRING },
                  opponentThreat: { type: Type.STRING }
                },
                required: ["userAdvantage", "opponentThreat"]
              }
            },
            required: ["strategy", "userAttributes", "opponentAttributes", "insights"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      setStrategyData(data);
      
      // Deduct credits via server if not Pro
      if (!profile.isPro) {
        const creditRes = await fetchWithAuth('/api/use-credits', {
          method: 'POST',
          body: JSON.stringify({ userId: profile.id, amount: AI_COSTS.STRATEGY_ADVISOR })
        });
        if (!creditRes.ok) {
          const err = await creditRes.json();
          throw new Error(err.error || 'Failed to deduct credits');
        }
      }

      const newStrategy = {
        opponent: opponentName || 'Unknown',
        strategy: data.strategy,
        date: new Date().toISOString()
      };

      onUpdateProfile({
        ...profile,
        aiCredits: profile.isPro ? profile.aiCredits : (profile.aiCredits || 0) - AI_COSTS.STRATEGY_ADVISOR,
        strategyHistory: [...(profile.strategyHistory || []), newStrategy].slice(-5)
      });
    } catch (err) {
      console.error(err);
      setError("Failed to generate strategy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = strategyData ? [
    { subject: 'Striking', A: strategyData.userAttributes.striking, B: strategyData.opponentAttributes.striking, fullMark: 100 },
    { subject: 'Grappling', A: strategyData.userAttributes.grappling, B: strategyData.opponentAttributes.grappling, fullMark: 100 },
    { subject: 'Clinch', A: strategyData.userAttributes.clinch, B: strategyData.opponentAttributes.clinch, fullMark: 100 },
    { subject: 'Speed', A: strategyData.userAttributes.speed, B: strategyData.opponentAttributes.speed, fullMark: 100 },
    { subject: 'Power', A: strategyData.userAttributes.power, B: strategyData.opponentAttributes.power, fullMark: 100 },
    { subject: 'Cardio', A: strategyData.userAttributes.cardio, B: strategyData.opponentAttributes.cardio, fullMark: 100 },
  ] : [];

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white relative overflow-hidden font-sans">
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] right-[-15%] w-[80%] h-[80%] bg-brand-blue/20 rounded-full blur-[150px] animate-pulse opacity-40" />
        <div className="absolute bottom-[5%] left-[-15%] w-[70%] h-[70%] bg-brand-violet/20 rounded-full blur-[130px] animate-pulse opacity-40" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] left-[10%] w-[50%] h-[50%] bg-brand-teal/10 rounded-full blur-[100px] opacity-30" />
        
        {/* Animated Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent h-[200%] animate-[scan_10s_linear_infinite] pointer-events-none" />
      </div>

      <header className="sticky top-0 z-50 glass-dark px-8 py-6 flex items-center justify-between border-b border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-b-[3rem]">
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.1, x: -3, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack} 
            className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 shadow-xl backdrop-blur-xl"
          >
            <ArrowLeft className="w-6 h-6 text-white/90" />
          </motion.button>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3 leading-none drop-shadow-2xl"
            >
              STRATEGY <span className="text-brand-teal">ADVISOR</span>
            </motion.h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-brand-teal shadow-[0_0_10px_rgba(0,245,160,0.8)] animate-pulse" />
              <p className="text-[10px] text-brand-teal font-black uppercase tracking-[0.4em] opacity-70">AI FIGHT IQ ENGINE</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-brand-teal/10 px-3 py-1.5 rounded-lg border border-brand-teal/30">
          <Brain className="w-4 h-4 text-brand-teal" />
          <span className="font-mono text-xs text-brand-teal font-bold">{profile.aiCredits ?? 100} V-Coins</span>
        </div>
      </header>



      <div className="flex-1 overflow-y-auto p-8 space-y-10 hide-scrollbar relative z-10 pb-24">
        {!strategyData ? (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 max-w-4xl mx-auto"
          >
            <div className="glass-dark rounded-[3.5rem] p-12 border border-white/15 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group perspective-2000">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/15 via-transparent to-brand-violet/15 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              
              <div className="relative z-10 transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5, translateZ: 50 }}
                  className="w-20 h-20 bg-brand-teal/20 rounded-[2rem] flex items-center justify-center mb-10 border border-brand-teal/40 shadow-[0_0_40px_rgba(0,245,160,0.3)] transition-all duration-700 transform-gpu"
                >
                  <Brain className="w-10 h-10 text-brand-teal drop-shadow-[0_0_10px_rgba(0,245,160,0.8)]" />
                </motion.div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 drop-shadow-lg">Analyze Opponent</h2>
                <p className="text-lg text-white/50 font-medium mb-12 leading-relaxed italic opacity-80">
                  Input your opponent's style, strengths, or specific habits to generate a tailored game plan based on your Fighter DNA.
                </p>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black italic uppercase tracking-[0.4em] text-white/40 ml-4">Opponent Name (Optional)</label>
                    <input 
                      type="text"
                      value={opponentName}
                      onChange={(e) => setOpponentName(e.target.value)}
                      placeholder="e.g., Jon 'Bones' Jones"
                      className="w-full bg-black/40 border border-white/10 rounded-3xl px-8 py-6 text-lg font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/5 transition-all outline-none shadow-inner backdrop-blur-xl"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black italic uppercase tracking-[0.4em] text-white/40 ml-4">Fighting Style & Details</label>
                    <textarea 
                      value={opponentStyle}
                      onChange={(e) => setOpponentStyle(e.target.value)}
                      placeholder="Describe their style, strengths, weaknesses, or specific habits (e.g., heavy pressure striker, lanky BJJ specialist, gasses out in round 3...)"
                      className="w-full bg-black/40 border border-white/10 rounded-[2.5rem] p-8 text-lg font-black italic uppercase tracking-tighter focus:border-brand-teal/50 focus:bg-white/5 transition-all outline-none min-h-[220px] resize-none leading-relaxed shadow-inner backdrop-blur-xl"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-brand-teal" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/90">Knowledge Base RAG</p>
                        <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Use your uploaded manuals</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setUseRAG(!useRAG)}
                      className={`w-12 h-6 rounded-full transition-all relative ${useRAG ? 'bg-brand-teal' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: useRAG ? 24 : 4 }}
                        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                  
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                      </div>
                      <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-full transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02, y: -6, boxShadow: '0 30px 60px rgba(0,245,160,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateStrategy}
                    disabled={loading || !opponentStyle.trim()}
                    className="w-full py-7 bg-gradient-to-r from-brand-teal to-brand-blue text-brand-bg rounded-3xl font-black italic uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-[0_25px_50px_rgba(0,245,160,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                    {loading ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin" />
                        Analyzing Matchup...
                      </>
                    ) : (
                      <>
                        <Zap className="w-8 h-8 group-hover:scale-125 transition-transform drop-shadow-md" />
                        Generate Game Plan 
                        <span className="text-sm md:text-base bg-black/20 px-3 py-1 rounded-full flex items-center gap-2 ml-2"><Brain className="w-4 h-4 md:w-5 md:h-5" /> {AI_COSTS.STRATEGY_ADVISOR}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                whileHover={{ scale: 1.05, y: -8, rotateX: 5 }}
                className="glass-dark p-8 rounded-[2.5rem] border border-white/10 flex flex-col items-start gap-6 shadow-2xl backdrop-blur-2xl group transform-gpu"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="p-4 bg-brand-blue/20 rounded-2xl border border-brand-blue/30 shadow-lg group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-brand-blue" />
                </div>
                <div style={{ transform: 'translateZ(20px)' }}>
                  <h3 className="text-sm font-black italic uppercase tracking-[0.4em] mb-2 text-white/90">Tactical Precision</h3>
                  <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-relaxed italic">Tailored to your {profile.archetype} archetype.</p>
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, y: -8, rotateX: 5 }}
                className="glass-dark p-8 rounded-[2.5rem] border border-white/10 flex flex-col items-start gap-6 shadow-2xl backdrop-blur-2xl group transform-gpu"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="p-4 bg-brand-violet/20 rounded-2xl border border-brand-violet/30 shadow-lg group-hover:scale-110 transition-transform">
                  <Swords className="w-8 h-8 text-brand-violet" />
                </div>
                <div style={{ transform: 'translateZ(20px)' }}>
                  <h3 className="text-sm font-black italic uppercase tracking-[0.4em] mb-2 text-white/90">Counter-Based IQ</h3>
                  <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-relaxed italic">Focuses on neutralizing specific threats.</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            className="space-y-12 max-w-5xl mx-auto"
          >
            {/* Radar Chart Visualization */}
            <div className="glass-dark rounded-[3.5rem] p-12 border border-white/15 shadow-[0_60px_120px_rgba(0,0,0,0.7)] relative overflow-hidden group perspective-2000">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              
              <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-6">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.8 }}
                    className="w-16 h-16 bg-brand-blue/20 rounded-2xl flex items-center justify-center border border-brand-blue/40 shadow-xl"
                  >
                    <Activity className="w-8 h-8 text-brand-blue" />
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none drop-shadow-lg">Attribute Comparison</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                      <p className="text-[11px] text-brand-blue font-black uppercase tracking-[0.4em] opacity-80">YOU VS. {opponentName || 'OPPONENT'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[450px] w-full relative z-10 transform-gpu" style={{ transform: 'translateZ(50px)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 900, letterSpacing: '0.1em' }} />
                    <Radar
                      name="You"
                      dataKey="A"
                      stroke="#00E5FF"
                      strokeWidth={3}
                      fill="#00E5FF"
                      fillOpacity={0.4}
                      animationDuration={2000}
                    />
                    <Radar
                      name={opponentName || "Opponent"}
                      dataKey="B"
                      stroke="#FF2A2A"
                      strokeWidth={3}
                      fill="#FF2A2A"
                      fillOpacity={0.4}
                      animationDuration={2000}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{ 
                        fontSize: '12px', 
                        paddingTop: '40px', 
                        textTransform: 'uppercase', 
                        fontWeight: 900, 
                        letterSpacing: '0.2em',
                        color: 'rgba(255,255,255,0.8)'
                      }} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Matchup Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 relative z-10">
                <motion.div 
                  whileHover={{ y: -10, scale: 1.02, backgroundColor: 'rgba(0,229,255,0.1)' }}
                  className="p-8 rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/20 backdrop-blur-xl shadow-2xl transition-all group/card"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="p-3 bg-brand-blue/20 rounded-xl border border-brand-blue/30 group-hover/card:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-brand-blue" />
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-blue">Your Advantage</span>
                  </div>
                  <p className="text-sm text-white/70 font-medium leading-relaxed italic opacity-90">{strategyData.insights.userAdvantage}</p>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -10, scale: 1.02, backgroundColor: 'rgba(239,68,68,0.1)' }}
                  className="p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/20 backdrop-blur-xl shadow-2xl transition-all group/card"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30 group-hover/card:scale-110 transition-transform">
                      <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-[0.4em] text-red-500">Their Threat</span>
                  </div>
                  <p className="text-sm text-white/70 font-medium leading-relaxed italic opacity-90">{strategyData.insights.opponentThreat}</p>
                </motion.div>
              </div>
            </div>

            <div className="glass-dark p-12 rounded-[3.5rem] border border-white/15 relative overflow-hidden group shadow-[0_60px_120px_rgba(0,0,0,0.7)] perspective-2000">
              <div className="absolute -top-32 -right-32 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-1000 pointer-events-none">
                <Brain className="w-96 h-96 text-brand-teal" />
              </div>
              
              <div className="flex items-center gap-6 mb-12 relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  className="w-16 h-16 bg-brand-teal/20 rounded-2xl flex items-center justify-center border border-brand-teal/40 shadow-xl"
                >
                  <Shield className="w-8 h-8 text-brand-teal" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none drop-shadow-lg">Tactical Analysis</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
                    <p className="text-[11px] text-brand-teal font-black uppercase tracking-[0.4em] opacity-80">AI GENERATED STRATEGY</p>
                  </div>
                </div>
              </div>

              <div className="markdown-body prose prose-invert prose-lg max-w-none text-white/80 leading-relaxed font-medium relative z-10" style={{ transform: 'translateZ(20px)' }}>
                <ReactMarkdown>{strategyData.strategy}</ReactMarkdown>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, y: -4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStrategyData(null)}
                className="mt-16 w-full py-6 bg-white/5 border border-white/10 rounded-3xl text-[12px] uppercase tracking-[0.5em] font-black hover:bg-white/10 transition-all shadow-2xl backdrop-blur-xl"
              >
                New Analysis
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
