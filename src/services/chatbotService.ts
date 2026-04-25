import { supabase } from "./supabase";

export async function getChatbotResponse(prompt: string, userContext: any) {
  try {
    // Return a default response instead of calling Gemini
    return "The AI assistant is currently offline. How else can I help you today?";
  } catch (error) {
    console.error("Chatbot error:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}
