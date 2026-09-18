import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) console.warn('Supabase is not configured; set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
export const supabaseAdmin = createClient(url || 'http://localhost:54321', key || 'development-only-key', { auth: { persistSession: false } });
