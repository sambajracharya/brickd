// Supabase client. Reads project credentials from .env.local:
//   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
//
// The publishable key is safe to ship in the app (row-level security
// protects data). If the env vars aren't set, `supabase` is null and
// the UI shows setup instructions instead of crashing.

import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          // PKCE: OAuth sends back a one-time ?code= that we exchange
          // for a session — the modern, recommended mobile flow.
          flowType: 'pkce',
          // On web, Supabase can parse the OAuth redirect automatically.
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;
