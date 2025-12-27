# Speech Prep Setup Guide

## Prerequisites

1. Node.js installed (v18 or higher)
2. A Supabase account and project
3. An OpenAI API key

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://mwrvdznuluxquekhnvyw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnZkem51bHV4cXVla2hudnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTMwNjcsImV4cCI6MjA4MTYyOTA2N30.K2otk31StoKpOjxN85azlNJYGGwkFbFm3LON3nqv5Gw

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Port (optional, defaults to 5001)
PORT=5001
```

**Important:** Replace `your_openai_api_key_here` with your actual OpenAI API key.

## Step 3: Set Up Supabase Database

1. Go to your Supabase project dashboard: https://mwrvdznuluxquekhnvyw.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run** to execute the SQL

This will create:
- `profiles` table for user information
- `sessions` table for storing practice sessions
- Row Level Security (RLS) policies
- Automatic profile creation trigger

## Step 4: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to your `.env` file

## Step 5: Run the Application

### Option 1: Run both frontend and backend together
```bash
npm run dev:full
```

### Option 2: Run separately (in two terminals)

Terminal 1 (Backend):
```bash
npm run dev:server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## Step 6: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

## Troubleshooting

### OpenAI API Error (500 Internal Server Error)

1. **Check if the API key is set:**
   - Make sure your `.env` file exists in the root directory
   - Verify `OPENAI_API_KEY` is set correctly (no quotes, no spaces)
   - Restart the server after adding/changing the API key

2. **Check server logs:**
   - Look for "OPENAI_API_KEY loaded: yes" in the server console
   - If it says "no", the API key is not being loaded

3. **Verify API key is valid:**
   - Test your API key at https://platform.openai.com/api-keys
   - Make sure you have credits/billing set up

### Supabase Connection Issues

1. **Check environment variables:**
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
   - Restart the dev server after changing environment variables

2. **Check Supabase dashboard:**
   - Verify your project is active
   - Check if the tables were created (Database > Tables)

### Port Already in Use

If port 5001 is already in use:
1. Change `PORT` in `.env` to a different port (e.g., `5002`)
2. Update `vite.config.ts` proxy to match the new port

## Additional Supabase Credentials Needed

For most operations, you only need the **Anon Key** (already provided). However, if you need server-side operations that bypass RLS, you might need:

- **Service Role Key**: Found in Supabase Dashboard > Settings > API > Service Role Key
  - ⚠️ **Never expose this in client-side code!** Only use it in server-side code.

For this application, the Anon Key is sufficient since all operations go through the authenticated user context.
