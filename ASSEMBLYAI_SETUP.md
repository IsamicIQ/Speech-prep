# Using AssemblyAI Instead of OpenAI Whisper

Since you're experiencing connection issues with OpenAI's Whisper API, I've added **AssemblyAI** as an alternative transcription service.

## Why AssemblyAI?

- ✅ **Different endpoint** - Might not be blocked by your firewall
- ✅ **Free tier available** - 5 hours of transcription per month
- ✅ **Easy setup** - Just need an API key
- ✅ **Automatic fallback** - Falls back to OpenAI if AssemblyAI fails

## Setup Instructions

### 1. Get Your AssemblyAI API Key

1. Go to https://www.assemblyai.com/
2. Click "Sign Up" (or "Log In" if you have an account)
3. Once logged in, go to https://www.assemblyai.com/app/account
4. Copy your API key (starts with something like `abc123...`)

### 2. Add to .env File

Open your `.env` file and add:

```env
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

**You still need OPENAI_API_KEY for the analysis part** - AssemblyAI only handles transcription.

### 3. Restart Your Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev:server
```

## How It Works

1. **AssemblyAI is tried first** (if API key is configured)
2. **Falls back to OpenAI Whisper** if AssemblyAI fails or isn't configured
3. **OpenAI is still used** for the speech analysis/coaching part

## Cost Comparison

- **AssemblyAI Free Tier**: 5 hours/month free
- **AssemblyAI Pay-as-you-go**: $0.00025 per second (~$0.90 per hour)
- **OpenAI Whisper**: $0.006 per minute (~$0.36 per hour)

Both are affordable for development/testing!

## Troubleshooting

**"No transcription service available"**
- Make sure you added `ASSEMBLYAI_API_KEY` to your `.env` file
- Or ensure `OPENAI_API_KEY` is set and connection works

**AssemblyAI errors**
- Check your API key is correct
- Verify you haven't exceeded free tier limits
- Check https://status.assemblyai.com/ for service status

The server will automatically fall back to OpenAI if AssemblyAI fails, so you're covered either way!


