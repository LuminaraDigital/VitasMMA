import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, Plus, Trash2, FileText, Loader2, Search, Zap, ShieldCheck, Upload, FileUp, Coins } from 'lucide-react';
import { UserProfile } from '../types';
import { saveToKnowledgeBase, getKnowledgeDocs, deleteKnowledgeDoc, KnowledgeDoc, saveMultimodalToKnowledgeBase } from '../services/ragService';
import { AI_COSTS } from '../constants';
import { fetchWithAuth } from '../utils/api';

export default function KnowledgeBase({ profile, onBack, onUpdateProfile, onUpgrade }: { profile: UserProfile, onBack: () => void, onUpdateProfile: (p: UserProfile) => void, onUpgrade: () => void }) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', content: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadType, setUploadType] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await getKnowledgeDocs(profile.id);
      setDocs(data);
    } catch (error) {
      console.error("Failed to load knowledge base:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!profile.isPro && (profile.aiCredits || 0) < AI_COSTS.KNOWLEDGE_BASE_UPLOAD) {
      onUpgrade();
      return;
    }

    if (uploadType === 'text') {
      if (!newDoc.title || !newDoc.content) return;
      setIsUploading(true);
      try {
        await saveToKnowledgeBase(profile.id, newDoc.title, newDoc.content);
        
        // Deduct credits if not pro
        if (!profile.isPro) {
          try {
            await fetchWithAuth('/api/use-credits', {
              method: 'POST',
              body: JSON.stringify({ userId: profile.id, amount: AI_COSTS.KNOWLEDGE_BASE_UPLOAD })
            });
          } catch (err) {
            console.error('Error deducting credits:', err);
          }
        }

        setNewDoc({ title: '', content: '' });
        setShowAddModal(false);
        await loadDocs();
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    } else {
      if (!selectedFile || !newDoc.title) return;
      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            await saveMultimodalToKnowledgeBase(profile.id, newDoc.title, base64, selectedFile.type);
            
            // Deduct credits if not pro
            if (!profile.isPro) {
              try {
                await fetchWithAuth('/api/use-credits', {
                  method: 'POST',
                  body: JSON.stringify({ userId: profile.id, amount: AI_COSTS.KNOWLEDGE_BASE_UPLOAD })
                });
              } catch (err) {
                console.error('Error deducting credits:', err);
              }
            }

            setSelectedFile(null);
            setNewDoc({ title: '', content: '' });
            setShowAddModal(false);
            await loadDocs();
          } catch (error) {
            console.error("File processing failed:", error);
          } finally {
            setIsUploading(false);
          }
        };
      } catch (error) {
        console.error("File upload failed:", error);
        setIsUploading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteKnowledgeDoc(id);
      await loadDocs();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-brand-bg text-white relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-teal/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[60%] bg-brand-violet/10 rounded-full blur-[100px] opacity-40" />
      </div>

      <header className="sticky top-0 z-50 glass-dark px-6 py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-3xl shadow-2xl rounded-b-[2.5rem]">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack} 
            className="p-2.5 bg-white/5 rounded-xl border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
              KNOWLEDGE <span className="text-brand-teal">BASE</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-brand-teal font-black uppercase tracking-[0.3em] opacity-70">AI RAG SYSTEM</p>
              <div className="flex items-center gap-1 bg-brand-teal/10 px-1.5 py-0.5 rounded border border-brand-teal/20">
                <Coins className="w-2 h-2 text-brand-teal" />
                <span className="text-[8px] font-black font-mono text-brand-teal">{profile.aiCredits || 0}</span>
              </div>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="p-3 bg-brand-teal text-brand-bg rounded-xl shadow-[0_0_20px_rgba(0,245,160,0.4)]"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 pb-24 hide-scrollbar">
        <div className="glass-dark p-6 rounded-3xl border border-white/10 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-brand-teal/20 rounded-xl border border-brand-teal/30">
              <ShieldCheck className="w-6 h-6 text-brand-teal" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Smart Retrieval</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Upload manuals to power your AI Advisor</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-brand-teal animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Syncing Knowledge...</p>
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <BookOpen className="w-10 h-10 text-white/20" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tighter mb-2">Library Empty</h3>
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest max-w-[200px] mx-auto">Upload technique manuals or fight rules to get started.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {docs.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-dark p-5 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-brand-teal/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-brand-teal/10 group-hover:border-brand-teal/20 transition-all">
                    <FileText className="w-5 h-5 text-white/60 group-hover:text-brand-teal" />
                  </div>
                  <div>
                    <h4 className="font-black italic uppercase tracking-tighter text-sm">{doc.title}</h4>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">
                      {doc.chunks.length} Chunks • {new Date(doc.createdAt?.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => doc.id && handleDelete(doc.id)}
                  className="p-2 text-white/20 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg glass-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/10 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gradient">Add to Library</h2>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => setUploadType('text')}
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${uploadType === 'text' ? 'bg-brand-teal text-brand-bg' : 'bg-white/5 text-white/40 border border-white/10'}`}
                    >
                      Text
                    </button>
                    <button 
                      onClick={() => setUploadType('file')}
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${uploadType === 'file' ? 'bg-brand-teal text-brand-bg' : 'bg-white/5 text-white/40 border border-white/10'}`}
                    >
                      Multimodal (PDF/IMG)
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/10"
                >
                  <Plus className="w-5 h-5 text-white/60 rotate-45" />
                </button>
              </div>

              <div className="space-y-6 relative z-10 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Document Title</label>
                  <input 
                    type="text"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                    placeholder="e.g., BJJ Escapes Manual"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 transition-all outline-none"
                  />
                </div>
                
                {uploadType === 'text' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Content</label>
                    <textarea 
                      value={newDoc.content}
                      onChange={(e) => setNewDoc({...newDoc, content: e.target.value})}
                      placeholder="Paste the text content here..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-black italic uppercase tracking-tighter focus:border-brand-teal/50 transition-all outline-none min-h-[200px] resize-none leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Upload File</label>
                    <div 
                      className="w-full h-40 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-brand-teal/50 transition-all cursor-pointer relative overflow-hidden"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      {selectedFile ? (
                        <>
                          <FileUp className="w-10 h-10 text-brand-teal" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/90">{selectedFile.name}</p>
                          <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-white/20" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Drop PDF or Image here</p>
                          <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Max 6 pages / 80s audio / 120s video</p>
                        </>
                      )}
                      <input 
                        id="file-upload"
                        type="file"
                        accept="application/pdf,image/*,audio/*,video/*"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                disabled={isUploading || !newDoc.title || (uploadType === 'text' ? !newDoc.content : !selectedFile)}
                className="w-full py-5 rounded-2xl bg-brand-teal text-brand-bg font-black italic uppercase tracking-widest shadow-[0_0_30px_rgba(0,245,160,0.3)] hover:shadow-[0_0_40px_rgba(0,245,160,0.5)] transition-all relative z-10 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Embedding Knowledge...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Ingest Document
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
