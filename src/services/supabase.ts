import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Guard: only create client when URL is a real HTTP(S) URL.
// Placeholder values like "your_supabase_project_url" are truthy but invalid - the
// startsWith check catches them before createClient throws.
const isConfigured =
  supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : (null as any);
