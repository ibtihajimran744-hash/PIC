import { GoogleGenAI } from "@google/genai";
import { supabase } from "./supabase";
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DocumentChunk {
  id?: string;
  document_id: string;
  content: string;
  embedding: number[];
  metadata?: any;
}

export const aiService = {
  /**
   * Extract text from a File object (PDF)
   */
  async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(" ") + "\n";
    }

    return fullText;
  },

  /**
   * Split text into chunks with overlap
   */
  chunkText(text: string, chunkSize: number = 800, overlap: number = 100): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    let i = 0;
    while (i < words.length) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      chunks.push(chunk);
      i += (chunkSize - overlap);
    }
    
    return chunks;
  },

  /**
   * Generate embeddings for a list of strings
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is missing. Please set GEMINI_API_KEY in the environment.");
    }
    
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      // @ts-ignore - The SDK types might be behind or slightly different
      const result = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: [{ parts: [{ text }] }]
      });
      embeddings.push(result.embeddings[0].values);
    }
    
    return embeddings;
  },

  /**
   * Save a document and its chunks to the database
   */
  async processAndSaveDocument(
    file: File, 
    courseId: string, 
    subject: string, 
    semester: string,
    uploadedBy: string
  ) {
    const { data: docData, error: docError } = await supabase
      .from('ai_documents')
      .insert([{
        name: file.name,
        course_id: courseId,
        subject,
        semester,
        uploaded_by: uploadedBy,
        type: file.type
      }])
      .select()
      .single();

    if (docError) throw docError;

    const text = await this.extractTextFromPDF(file);
    const chunks = this.chunkText(text);
    const embeddings = await this.generateEmbeddings(chunks);
    
    const chunkPromises = chunks.map((content, i) => {
      return supabase.from('ai_document_chunks').insert({
        document_id: docData.id,
        content,
        embedding: embeddings[i],
        metadata: { page: Math.floor(i / 2) }
      });
    });

    await Promise.all(chunkPromises);
    return docData;
  },

  /**
   * Perform vector search
   */
  async searchSimilarChunks(query: string, courseId: string, limit: number = 5) {
    // @ts-ignore
    const result = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: [{ parts: [{ text: query }] }]
    });
    const embedding = result.embeddings[0].values;

    const { data, error } = await supabase.rpc('match_ai_chunks', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
      filter_course_id: courseId
    });

    if (error) throw error;
    return data;
  },

  /**
   * Ask the AI a question with context
   */
  async getChatAssistantResponse(
    query: string, 
    courseId: string, 
    history: { role: string, content: string }[] = []
  ) {
    const contextChunks = await this.searchSimilarChunks(query, courseId);
    const contextText = contextChunks
      .map((c: any) => `[Source: ${c.document_name}] ${c.content}`)
      .join("\n\n");

    const systemPrompt = `You are a helpful and accurate academic tutor. 
Your goal is to answer the user's questions based EXCLUSIVELY on the provided source materials. 
If the answer is not in the material, say you don't have that information.
Always cite the source document name when providing information.

CONTEXT FROM UPLOADED MATERIALS:
${contextText}`;

    const chatHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    // @ts-ignore
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: query + "\n\nPlease refer only to the context provided above." }] }
      ],
      config: {
        systemInstruction: systemPrompt
      }
    });

    return {
        text: response.text,
        sources: contextChunks.map((c: any) => c.document_name)
    };
  }
};
