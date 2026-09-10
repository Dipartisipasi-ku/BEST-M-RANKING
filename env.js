/**
 * env.js - Environment variables loader & validator for Supabase
 * Mendukung Vite (import.meta.env) di browser dan Node.js (process.env) di runtime backend/build
 */

export const env = {
  // Supabase Project URL
  SUPABASE_URL:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    'https://hgxtsgiabjkofimgbwek.supabase.co',

  // Supabase Anon / Public Key (Safe for client-side queries protected by RLS)
  SUPABASE_ANON_KEY:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHRzZ2lhYmprb2ZpbWdid2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MTA4NDQsImV4cCI6MjEwMzk4Njg0NH0.MDW8sDk04fzxko8ZN8piEWBYE7zxTDzExdjQNafTXxY',

  // Mode status
  isConfigured() {
    return Boolean(this.SUPABASE_URL && this.SUPABASE_ANON_KEY && !this.SUPABASE_URL.includes('your-project-ref'));
  }
};

export default env;
