# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Create `.env` file

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://mwrvdznuluxquekhnvyw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cnZkem51bHV4cXVla2hudnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTMwNjcsImV4cCI6MjA4MTYyOTA2N30.K2otk31StoKpOjxN85azlNJYGGwkFbFm3LON3nqv5Gw
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

**Get your OpenAI API key:** https://platform.openai.com/api-keys

### 2. Set up Supabase Database

1. Go to: https://mwrvdznuluxquekhnvyw.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Copy the entire contents of `supabase-setup.sql`
4. Paste and click **Run**

### 3. Run the app

```bash
npm install
npm run dev:full
```

Visit: http://localhost:5173

## ✅ Verify Setup

Run this to check if everything is configured:

```bash
npm run check-env
```

## 🔧 Fix OpenAI API Error

If you see "Failed to analyze recording" error:

1. **Check your `.env` file exists** in the root directory
2. **Verify `OPENAI_API_KEY` is set** (should start with `sk-`)
3. **Restart the server** after adding/changing the API key
4. **Check server console** - you should see "OPENAI_API_KEY loaded: yes"

## 📚 Need More Help?

See `SETUP.md` for detailed instructions.


