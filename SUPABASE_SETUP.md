# Supabase Setup Guide for SpeechPrep

## Prerequisites
1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Steps

### 1. Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGci...`)

### 2. Set Environment Variables (Optional)
If you want to use environment variables instead of hardcoded values:

Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

The app will use these if set, otherwise it will use the default values in `src/lib/supabase.ts`.

### 3. Run the Database Setup SQL
1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase-setup.sql` from this project
3. Copy and paste the entire SQL script into the SQL Editor
4. Click **Run** to execute the script

This will create:
- `profiles` table for user information
- `sessions` table for practice session history
- Row Level Security (RLS) policies
- Automatic profile creation trigger

### 4. Verify Tables Were Created
1. Go to **Table Editor** in your Supabase dashboard
2. You should see:
   - `profiles` table
   - `sessions` table

### 5. Test the Application
1. Start your development server: `npm run dev`
2. Start your backend server: `npm run dev:server`
3. Navigate to the app and try signing up/logging in
4. Create a practice session and verify it's saved to Supabase

## Troubleshooting

### Authentication Issues
- Make sure email confirmation is disabled in Supabase (Settings > Authentication > Email Auth)
- Or enable email confirmation and check your email

### Database Errors
- Verify RLS policies are enabled and correct
- Check that the trigger function was created successfully
- Ensure your Supabase project is active (not paused)

### Session Saving Issues
- Check browser console for errors
- Verify the `sessions` table exists and has the correct columns
- Ensure the user is authenticated before saving sessions

