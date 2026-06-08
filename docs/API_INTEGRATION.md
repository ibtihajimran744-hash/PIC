# 🌐 Edunova API Integration & Credentials Playbook

Edunova is a high-performance educational ERP that integrates with the cloud-hosted Supabase platform to power real-time databases and transaction pipelines. This document details how to configure, audit, and customize these integrations.

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

## 🔒 2. Credentials & Keys Security

1. **Client-Side Secrets Guard:** All client-side variables (`VITE_SUPABASE_URL`) are loaded from browser memory and thus are publicly visible. Sensitive administrative or database passwords should never be stored raw or exposed through client code.
2. **Local Storage Fallbacks:** During connectivity drops, local registers utilize standard client-side state buffers to cache transactions, syncing them with Supabase when online.

---

*Verified API Handbook for Edunova ERP Integration.*
