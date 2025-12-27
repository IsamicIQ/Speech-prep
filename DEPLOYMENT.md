# 🚀 Deployment Guide for SpeechPrep

This guide will help you deploy your SpeechPrep app to Vercel with a live domain.

## Prerequisites

- GitHub account
- Vercel account (free tier is fine)
- Your API keys ready:
  - `OPENAI_API_KEY` (required)
  - `ASSEMBLYAI_API_KEY` (optional but recommended)
  - `VITE_SUPABASE_URL` (if using authentication)
  - `VITE_SUPABASE_ANON_KEY` (if using authentication)

## Step 1: Push Your Code to GitHub

1. Initialize git repository (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SpeechPrep app"
   ```

2. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it `speech-prep` (or whatever you prefer)
   - Don't initialize with README (we already have code)
   - Click "Create repository"

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/speech-prep.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

1. Go to https://vercel.com and sign in with GitHub

2. Click "Add New Project"

3. Import your `speech-prep` repository

4. Configure your project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should be auto-detected)
   - **Output Directory**: `dist` (should be auto-detected)

5. Add Environment Variables (click "Environment Variables"):
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `ASSEMBLYAI_API_KEY`: Your AssemblyAI API key (optional)
   - `VITE_SUPABASE_URL`: Your Supabase URL (if using auth)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key (if using auth)

   **Important**: Add these to all environments (Production, Preview, Development)

6. Click "Deploy"

## Step 3: Wait for Deployment

Vercel will:
1. Install dependencies
2. Build your frontend
3. Deploy your serverless API functions
4. Give you a live URL (e.g., `https://speech-prep.vercel.app`)

This usually takes 1-2 minutes.

## Step 4: Test Your Deployment

1. Visit your deployment URL
2. Try recording a speech
3. Check if the analysis works

## Important Notes

### Serverless Function Timeout

- Free tier: 10 second timeout
- Hobby tier ($20/month): 60 second timeout

If you're on the free tier and get timeout errors with long speeches, you have two options:

1. **Upgrade to Hobby tier** ($20/month) for 60 second timeout
2. **Deploy backend separately** to Render (see Alternative Deployment below)

### API Usage Costs

- AssemblyAI: Free tier includes 5 hours/month
- OpenAI: Pay per use (typically $0.01-0.05 per speech analysis)

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `speechprep.yourdomain.com`)
4. Follow the DNS configuration instructions

## Troubleshooting

### "Failed to analyze recording" Error

1. Check Vercel deployment logs: Project → Deployments → Click latest deployment → View Function Logs
2. Verify environment variables are set correctly
3. Make sure API keys are valid

### Timeout Errors

If speeches longer than 10 seconds fail:
- Upgrade to Vercel Hobby tier for 60s timeout
- Or use Alternative Deployment (backend on Render)

### Build Errors

If deployment fails:
1. Check the build logs in Vercel
2. Make sure all dependencies are in `package.json`
3. Try building locally first: `npm run build`

## Alternative Deployment: Backend on Render

If you need longer timeouts or want to avoid serverless limitations:

1. **Deploy Backend to Render**:
   - Go to https://render.com
   - Create new "Web Service"
   - Connect your GitHub repo
   - Set build command: `npm install`
   - Set start command: `npm run dev:server`
   - Add environment variables (same as above)
   - Deploy

2. **Update Frontend Configuration**:
   - In `vite.config.ts`, change the proxy target to your Render URL
   - Redeploy to Vercel

3. **Update vercel.json**:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-app.onrender.com/api/:path*"
       }
     ]
   }
   ```

## Support

If you run into issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Make sure API keys are valid and have credits

## Success!

Once deployed, you'll have a live URL you can share with anyone! 🎉

Your app will be available at: `https://your-project-name.vercel.app`
