import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key
// This bypasses RLS and should only be used in API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log warnings instead of throwing errors during build time
if (!supabaseUrl && process.env.NODE_ENV !== 'production') {
  console.warn(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please add it to your .env.local file.'
  );
}

if (!supabaseServiceRole && process.env.NODE_ENV !== 'production') {
  console.warn(
    'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
    'This is required for server-side operations. ' +
    'Get it from your Supabase project settings.'
  );
}

// Create server-side Supabase client with service role (use placeholders for build)
export const supabaseServer = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRole || 'placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
