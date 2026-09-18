import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) console.warn('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
export const supabase = createClient(url || 'http://localhost:54321', key || 'development-only-key', { auth: { storage: localStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
