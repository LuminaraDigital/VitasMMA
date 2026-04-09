import { GoogleGenAI } from "@google/genai";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { supabase } from "../lib/supabase";

/**
 * SQL Setup for Supabase (Run this in SQL Editor):
 * 
 * -- Enable pgvector extension
 * create extension if not exists vector;
 * 
 * -- Create the RAG table
 * create table if not exists "VitasMMA_RAG_System" (
 *   id bigserial primary key,
 *   user_id text not null,
 *   doc_id text not null,
 *   content text not null,
 *   embedding vector(768) -- Matches Gemini embedding dimensionality
 * );
 * 
 * -- Create the similarity search function
 * create or replace function match_vitas_mma (
 *   query_embedding vector(768),
 *   match_threshold float,
 *   match_count int,
 *   p_user_id text
 * )
 * returns table (
 *   id bigint,
 *   content text,
 *   similarity float
 * )
 * language plpgsql
 * as $$
 * begin
 *   return query
 *   select
 *     "VitasMMA_RAG_System".id,
 *     "VitasMMA_RAG_System".content,
 *     1 - ("VitasMMA_RAG_System".embedding <=> query_embedding) as similarity
 *   from "VitasMMA_RAG_System"
 *   where "VitasMMA_RAG_System".user_id = p_user_id
 *     and 1 - ("VitasMMA_RAG_System".embedding <=> query_embedding) > match_threshold
 *   order by similarity desc
 *   limit match_count;
 * end;
 * $$;
 */

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface KnowledgeChunk {
  text: string;
  embedding: number[];
}

export interface KnowledgeDoc {
  id?: string;
  title: string;
  content: string;
  chunks: KnowledgeChunk[];
  userId: string;
  createdAt: any;
}

/**
 * Split text into chunks of roughly `chunkSize` characters with `overlap`.
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

/**
 * Generate embeddings for a list of text chunks.
 */
export async function generateEmbeddings(chunks: string[], taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT'): Promise<number[][]> {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2-preview',
    contents: chunks,
    config: { taskType, outputDimensionality: 768 },
  });
  
  if (!response.embeddings) return [];
  return response.embeddings.map(e => e.values);
}

/**
 * Generate an embedding for multimodal content (e.g., PDF, Image).
 */
export async function generateMultimodalEmbedding(data: string, mimeType: string, taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT'): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2-preview',
    contents: [{
      inlineData: {
        mimeType,
        data,
      },
    }],
    config: { taskType, outputDimensionality: 768 },
  });
  
  if (!response.embeddings || response.embeddings.length === 0) return [];
  return response.embeddings[0].values;
}

/**
 * Save a document and its embeddings to Firestore.
 */
export async function saveToKnowledgeBase(userId: string, title: string, content: string) {
  const textChunks = chunkText(content);
  const embeddings = await generateEmbeddings(textChunks);
  
  const chunks: KnowledgeChunk[] = textChunks.map((text, i) => ({
    text,
    embedding: embeddings[i]
  }));

  const docData: KnowledgeDoc = {
    title,
    content,
    chunks,
    userId,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "knowledge_base"), docData);
  
  // 2. Save to Supabase for efficient vector search
  const supabaseData = chunks.map(chunk => ({
    user_id: userId,
    doc_id: docRef.id,
    content: chunk.text,
    embedding: chunk.embedding
  }));

  const { error } = await supabase.from('VitasMMA_RAG_System').insert(supabaseData);
  if (error) console.error("Supabase vector storage failed:", error);
}

/**
 * Save a multimodal document (e.g., PDF) to the knowledge base.
 */
export async function saveMultimodalToKnowledgeBase(userId: string, title: string, base64Data: string, mimeType: string) {
  // Generate a single embedding for the entire file
  const embedding = await generateMultimodalEmbedding(base64Data, mimeType, 'RETRIEVAL_DOCUMENT');
  
  const docData: KnowledgeDoc = {
    title,
    content: `[Multimodal Document: ${mimeType}]`, // We store a placeholder or summary
    chunks: [{
      text: `Content from document: ${title}`,
      embedding
    }],
    userId,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "knowledge_base"), docData);

  // Save to Supabase
  const { error } = await supabase.from('VitasMMA_RAG_System').insert({
    user_id: userId,
    doc_id: docRef.id,
    content: `Content from document: ${title}`,
    embedding
  });
  if (error) console.error("Supabase multimodal vector storage failed:", error);
}

/**
 * Search the knowledge base for relevant chunks using Supabase vector search.
 */
export async function searchKnowledgeBase(userId: string, queryText: string, topK: number = 5): Promise<string[]> {
  // 1. Generate embedding for the query using RETRIEVAL_QUERY task type
  const queryEmbeddings = await generateEmbeddings([queryText], 'RETRIEVAL_QUERY');
  if (queryEmbeddings.length === 0) return [];
  const queryEmbedding = queryEmbeddings[0];

  // 2. Perform vector similarity search in Supabase
  const { data, error } = await supabase.rpc('match_vitas_mma', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5, // Adjust as needed
    match_count: topK,
    p_user_id: userId
  });

  if (error) {
    console.error("Supabase vector search failed, falling back to Firestore:", error);
    // Fallback to Firestore in-memory search (original logic)
    const q = query(collection(db, "knowledge_base"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const allChunks: { text: string; score: number }[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as KnowledgeDoc;
      data.chunks.forEach((chunk) => {
        const score = cosineSimilarity(queryEmbedding, chunk.embedding);
        allChunks.push({ text: chunk.text, score });
      });
    });

    return allChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(c => c.text);
  }

  return data.map((item: any) => item.content);
}

/**
 * Cosine Similarity calculation.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get all documents in the knowledge base for a user.
 */
export async function getKnowledgeDocs(userId: string): Promise<KnowledgeDoc[]> {
  const q = query(collection(db, "knowledge_base"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeDoc));
}

/**
 * Delete a document from the knowledge base.
 */
export async function deleteKnowledgeDoc(docId: string) {
  // 1. Delete from Firestore
  await deleteDoc(doc(db, "knowledge_base", docId));
  
  // 2. Delete from Supabase
  const { error } = await supabase.from('VitasMMA_RAG_System').delete().eq('doc_id', docId);
  if (error) console.error("Supabase vector deletion failed:", error);
}
