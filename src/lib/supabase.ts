import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mwrvdznuluxquekhnvyw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnZkem51bHV4cXVla2hudnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTMwNjcsImV4cCI6MjA4MTYyOTA2N30.K2otk31StoKpOjxN85azlNJYGGwkFbFm3LON3nqv5Gw'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


