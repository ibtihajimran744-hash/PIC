# 🤖 Edunova API Integration & Credentials Playbook

Edunova is a full-featured educational ERP integrating external cloud platforms to power real-time datastores and AI-assisted workflows. This document details how to configure, audit, and customized these integrations.

---

## ☁️ 1. Supabase Client Integration

The state manager interacts with a cloud-hosted Supabase database.

### Initialization Architecture (`/src/services/supabase.ts`)
The Supabase client is initialized using environment variables. To ensure clean fallbacks during preview states, Edunova uses a lazy warning pattern:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Check target environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
```

### Real-Time Channels
The student checkpoints utilize Supabase real-time subscription pipelines. When a biometric gate scan is captured (simulated or integrated with hardware APIs), the database updates the `attendance` table:

```typescript
// Example: Subscribing to instant biometric check-ins
supabase
  .channel('public:attendance')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, payload => {
    console.log('Biometric Check-in Event:', payload.new);
  })
  .subscribe();
```

---

## 🤖 2. Google Gemini AI Integration

Edunova supports integrating intelligence capabilities (smart onboarding advice, routing recommendations, candidate analysis) using the modern `@google/genai` TypeScript SDK.

### Current Implementation & Activation Flow
To provide continuous operation even when external API keys are pending configuration in the preview settings menu, the service layer contains a fallback handler:

```typescript
// Active Gemini Onboarding Call Blueprint 
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeLeadInterests(prompt: string, context: any) {
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze this candidate inquiry and output a suitability status score: ${prompt}`,
  });
  return result.text;
}
```

### Prompt Engineering Configurations
When configuring active chatbots or enrollment helpers like `AdmissionAssistant.tsx`, use the following system parameters to maintain a helpful assistant persona:
1. **Instructs:** *"You are an experienced college registrar advisor helping students explore Intermediate, BS, or ADP programs. Keep responses concise, objective, and supportive."*
2. **Parameters:** `temperature: 0.1` (keeps categorizations stable), `max_tokens: 450` (keeps responses brief and focused).

---

## 🔒 3. Credentials & Keys Security

1. **Client-Side Secrets Guard:** Never prefix sensitive server-only values like `GEMINI_API_KEY` with `VITE_`. All client-side variables (`VITE_SUPABASE_URL`) are loaded from browser memory and thus are publicly visible.
2. **Local Storage Fallbacks:** During connectivity drops, local registers utilize standard client-side state buffers to cache transactions, syncing them with Supabase when online.

---

*Verified API Handbook for Edunova ERP Integration.*
