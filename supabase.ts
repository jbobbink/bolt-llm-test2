import { createClient } from '@supabase/supabase-js';

// These variables are expected to be set in the environment.
// For the purpose of this tool, we assume `process.env` is pre-configured with
// SUPABASE_URL and SUPABASE_ANON_KEY.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Provide a fallback for the interactive development environment if env vars are missing.
  // In a real production deployment, these should be securely provided.
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #f87171; color: white; padding: 1rem; text-align: center; z-index: 1000;';
  errorDiv.innerHTML = '<strong>Configuration Error:</strong> Supabase URL and anonymous key are not set. Please provide them as environment variables.';
  document.body.prepend(errorDiv);
  throw new Error("Supabase URL and anon key are not set. Please check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
