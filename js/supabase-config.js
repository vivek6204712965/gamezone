/**
 * GameZone - Supabase Configuration
 *
 * Provide your Supabase project URL and publishable (anon) key below.
 * You can find these in your Supabase Dashboard:
 *   Project Settings -> API -> Project URL & Project API Keys ("anon" / "publishable")
 *
 * IMPORTANT SECURITY RULES:
 * - Only use your Project URL and Publishable / "anon" key here.
 * - NEVER use or paste your secret "service_role" key or database password.
 * - Ensure Row Level Security (RLS) is enabled on public.games with a SELECT policy for public/anon users.
 */
const SUPABASE_CONFIG = {
  url: 'https://ajxehjkedtkdixnlofrk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqeGVoamtlZHRrZGl4bmxvZnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNTY0NDQsImV4cCI6MjEwODczMjQ0NH0.E41YpS5j35hTtRO__N-nNM1RQbsLzul6eySPWwHim7U'
};

if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
