import { GoogleGenAI } from "@google/genai";
import { supabase } from "./supabase";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getChatbotResponse(prompt: string, userContext: any) {
  try {
    // Fetch some context from Supabase to help the AI
    const [timetableRes, teachersRes, notificationsRes] = await Promise.all([
      supabase.from('timetable').select('*'),
      supabase.from('teachers').select('full_name, designation, subject_dept'),
      supabase.from('notifications').select('title, message').order('created_at', { ascending: false }).limit(5)
    ]);

    const context = {
      timetable: timetableRes.data || [],
      teachers: teachersRes.data || [],
      recent_announcements: notificationsRes.data || [],
      user: userContext
    };

    const model = "gemini-3-flash-preview";
    const systemInstruction = `
      You are a helpful college assistant for "Punjab International College".
      Your goal is to answer student, teacher, and parent queries about the college.
      
      Context Information:
      - Timetable: ${JSON.stringify(context.timetable)}
      - Teachers: ${JSON.stringify(context.teachers)}
      - Recent Announcements: ${JSON.stringify(context.recent_announcements)}
      - Current User: ${JSON.stringify(context.user)}

      Guidelines:
      1. Be polite, professional, and concise.
      2. If asked about a specific lecture or schedule, refer to the provided Timetable.
      3. If you don't know the answer, suggest contacting the administration.
      4. Do not answer advanced or unrelated questions (e.g., coding, philosophy, etc.). Stay focused on college queries.
      5. Use the user's name if available.
      6. The current time is ${new Date().toLocaleString()}.
    `;

    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Chatbot error:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}
