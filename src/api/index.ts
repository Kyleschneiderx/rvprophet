import { mockApi } from './mockApi';
import { supabaseApi } from './supabaseApi';
import { isSupabaseConfigured } from '../lib/supabase';

// Use Supabase API if configured, otherwise fall back to mock API
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true' && isSupabaseConfigured;

export const api = USE_SUPABASE ? supabaseApi : mockApi;

// Re-export both APIs for direct access if needed
export { mockApi, supabaseApi };
