# SpeechPrep - Public Speaking Practice with AI

Practice your presentations with AI-powered feedback on clarity, pacing, confidence, and more.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://mwrvdznuluxquekhnvyw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnZkem51bHV4cXVla2hudnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTMwNjcsImV4cCI6MjA4MTYyOTA2N30.K2otk31StoKpOjxN85azlNJYGGwkFbFm3LON3nqv5Gw

# OpenAI API Key (required for speech analysis)
OPENAI_API_KEY=your_openai_api_key_here

# AssemblyAI API Key (optional - for transcription, alternative to OpenAI Whisper)
# Get it from https://www.assemblyai.com/app/account
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Server Port (optional, defaults to 5001)
PORT=5001
```

**To get your OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env` file

**To get your AssemblyAI API key (optional, recommended if OpenAI connection fails):**
1. Go to https://www.assemblyai.com/ and sign up
2. Go to https://www.assemblyai.com/app/account
3. Copy your API key and add it to `.env` as `ASSEMBLYAI_API_KEY`
4. See `ASSEMBLYAI_SETUP.md` for details

### 3. Set Up Supabase Database

1. Go to your Supabase project: https://mwrvdznuluxquekhnvyw.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste it into the SQL Editor and click **Run**

This creates:
- `profiles` table for user information
- `sessions` table for storing practice sessions
- Row Level Security (RLS) policies
- Automatic profile creation trigger

### 4. Verify Setup

Check that all environment variables are set:

```bash
node scripts/check-env.js
```

### 5. Run the Application

You need to run both the backend server and frontend dev server:

**Terminal 1 - Backend Server:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```

### 6. Open in Browser

Navigate to `http://localhost:5173` in your browser.

## Features

- **Supabase Authentication**: Secure user authentication with email/password
- **Cloud Storage**: Practice sessions saved to Supabase database
- **Script Reading Drills**: Practice with AI-generated one-sentence scripts with specific tones
- **Own-Topic Speeches**: Create speeches on given topics with time limits
- **AI Feedback**: Get detailed scores and feedback on clarity, pacing, confidence, and more (powered by OpenAI GPT-4o-mini)
- **Audio Transcription**: Uses OpenAI Whisper for accurate speech-to-text
- **Tone Analysis**: AI detects if you conveyed the required tone and provides improvement tips
- **Progress Tracking**: Save and track your improvement over time
- **Guest Mode**: Try the app without signing up (uses localStorage)

## Troubleshooting

**"Server is not configured with an AI key" error:**
- Make sure you created a `.env` file in the root directory
- Check that `OPENAI_API_KEY` is set correctly (should start with `sk-`)
- Restart the backend server after creating/updating `.env`
- Run `node scripts/check-env.js` to verify your setup

**"Cannot GET /" on localhost:5001:**
- This is normal! The backend only has a POST endpoint at `/api/analyze`
- The frontend at `localhost:5173` will proxy API requests to the backend

**Database/Supabase errors:**
- Make sure you've run the SQL from `supabase-setup.sql` in your Supabase SQL Editor
- Verify your Supabase URL and anon key are correct in `.env`
- Check that Row Level Security policies are enabled in Supabase
- Restart the dev server after changing environment variables

**Camera/mic not working:**
- Make sure you click "Start practice" to request permissions
- Check browser permissions in settings
- Try refreshing the page
