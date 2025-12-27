import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createWriteStream, unlink, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';
import https from 'node:https';
import http from 'node:http';
import { AssemblyAI } from 'assemblyai';

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple GET route to show server is running
app.get('/', (req, res) => {
  res.json({
    message: 'SpeechPrep API server is running',
    endpoints: {
      analyze: 'POST /api/analyze - Upload a video recording for AI analysis',
      health: 'GET /api/health - Check transcription service status'
    }
  });
});

// Health check endpoint to verify transcription services
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    codeVersion: 'SIMPLIFIED_V2', // Added to verify new code is running
    services: {
      openai: {
        configured: !!openaiApiKey,
        available: false,
        error: null
      },
      assemblyai: {
        configured: !!assemblyAiApiKey,
        available: false,
        error: null
      }
    },
    transcription: {
      primary: assemblyAiApiKey ? 'AssemblyAI' : 'OpenAI',
      fallback: assemblyAiApiKey ? 'OpenAI' : null,
      available: false
    },
    nextSteps: []
  };

  // Test OpenAI if configured
  if (openaiApiKey && openai) {
    try {
      // Simple test - just check if client is initialized
      // We don't make an actual API call to avoid costs
      health.services.openai.available = true;
    } catch (error) {
      health.services.openai.error = error.message;
      health.services.openai.available = false;
    }
  } else {
    health.nextSteps.push('Configure OPENAI_API_KEY in your .env file (required for analysis)');
  }

  // Test AssemblyAI if configured
  if (assemblyAiApiKey && assemblyai) {
    try {
      // Simple test - just check if client is initialized
      health.services.assemblyai.available = true;
    } catch (error) {
      health.services.assemblyai.error = error.message;
      health.services.assemblyai.available = false;
    }
  }

  // Determine overall transcription availability
  if (health.services.assemblyai.available || health.services.openai.available) {
    health.transcription.available = true;
  } else {
    health.status = 'error';
    if (!assemblyAiApiKey && !openaiApiKey) {
      health.nextSteps.push('Configure at least one transcription service:');
      health.nextSteps.push('  1. Add ASSEMBLYAI_API_KEY to .env (recommended)');
      health.nextSteps.push('  2. OR add OPENAI_API_KEY to .env (required for analysis anyway)');
    } else if (!openaiApiKey) {
      health.nextSteps.push('Configure OPENAI_API_KEY in .env (required for speech analysis)');
    }
  }

  // Add specific next steps based on configuration
  if (!openaiApiKey) {
    health.nextSteps.push('Get OpenAI API key: https://platform.openai.com/api-keys');
  }
  if (!assemblyAiApiKey) {
    health.nextSteps.push('Get AssemblyAI API key (optional): https://www.assemblyai.com/app/account');
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

const openaiApiKey = process.env.OPENAI_API_KEY;
const assemblyAiApiKey = process.env.ASSEMBLYAI_API_KEY;

console.log('OPENAI_API_KEY loaded:', openaiApiKey ? 'yes' : 'no');
console.log('ASSEMBLYAI_API_KEY loaded:', assemblyAiApiKey ? 'yes' : 'no');
console.log('Using transcription service:', assemblyAiApiKey ? 'AssemblyAI (primary)' : 'OpenAI (fallback)');

// Create custom HTTP/HTTPS agents with relaxed settings for firewall/proxy compatibility
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  rejectUnauthorized: true, // Keep SSL verification
  timeout: 180000, // Increased to 3 minutes
});

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  timeout: 180000, // Increased to 3 minutes
});

const openai = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
      timeout: 180000, // 180 second timeout for large audio files
      maxRetries: 2, // Retry failed requests up to 2 times (reduced to avoid long waits)
      // Note: OpenAI SDK v4+ uses fetch() which may not respect httpAgent
      // We'll handle retries manually for better control
    })
  : null;

// Helper function for retrying with exponential backoff
async function retryWithBackoff(fn, maxRetries = 2, initialDelay = 2000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries - 1;

      // Check if it's a connection/timeout error worth retrying
      const isConnectionError = error?.message?.includes('Connection') ||
                                error?.message?.includes('timeout') ||
                                error?.message?.includes('ETIMEDOUT') ||
                                error?.message?.includes('ECONNREFUSED') ||
                                error?.message?.includes('ENOTFOUND') ||
                                error?.code === 'ETIMEDOUT' ||
                                error?.code === 'ECONNREFUSED' ||
                                error?.code === 'ENOTFOUND' ||
                                error?.code === 'ECONNRESET' ||
                                error?.type === 'APIConnectionError';

      // Don't retry on auth errors or non-connection errors
      if (isLastAttempt || !isConnectionError) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`   ⚠️  Connection error on attempt ${attempt + 1}/${maxRetries}: ${error?.message}`);
      console.log(`   ⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

const assemblyai = assemblyAiApiKey
  ? new AssemblyAI({ 
      apiKey: assemblyAiApiKey,
      // Add timeout and retry configuration
    })
  : null;

if (assemblyai) {
  console.log('✅ AssemblyAI client initialized successfully');
} else {
  console.log('⚠️  AssemblyAI not configured - will use OpenAI only');
}

// Catch any unhandled promise rejections (safety net for AssemblyAI)
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Promise Rejection:', reason);
  console.error('   This should not happen - all promises should be handled');
  // Don't crash the server, just log it
});

app.post('/api/analyze', (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      }
      return res.status(500).json({ error: 'Upload error: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  let tempFilePath = null;
  try {
    console.log('Received analyze request:', {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      body: req.body,
    });
    
    if (!req.file) {
      return res.status(400).json({ error: 'No recording uploaded' });
    }

    // Check if at least one AI service is configured
    if (!openai && !assemblyai) {
      return res.status(500).json({
        error: 'Server is not configured with an AI service.',
        nextSteps: [
          '1. Add OPENAI_API_KEY to your .env file (required for analysis)',
          '   Get it from: https://platform.openai.com/api-keys',
          '2. Optionally add ASSEMBLYAI_API_KEY for transcription (recommended)',
          '   Get it from: https://www.assemblyai.com/app/account',
          '3. Restart your server after adding keys',
          '4. Check service status: GET http://localhost:' + port + '/api/health'
        ]
      });
    }
    
    // Analysis still needs OpenAI for chat completion
    if (!openai) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY is required for analysis.',
        nextSteps: [
          '1. Add OPENAI_API_KEY to your .env file',
          '   Get it from: https://platform.openai.com/api-keys',
          '2. Make sure the key is correct (no extra spaces or quotes)',
          '3. Restart your server after adding the key',
          '4. Check service status: GET http://localhost:' + port + '/api/health'
        ]
      });
    }

    const mode = (req.body?.mode === 'topic' ? 'topic' : 'script');
    const script = req.body?.script || '';
    const scriptTone = req.body?.scriptTone || '';
    const topic = req.body?.topic || '';
    const timeLimitSeconds = req.body?.timeLimitSeconds
      ? Number(req.body.timeLimitSeconds)
      : null;
    const elapsedSeconds = req.body?.elapsedSeconds
      ? Number(req.body.elapsedSeconds)
      : null;

    // Check if file is too small (likely empty or invalid)
    if (req.file.size < 1000) {
      return res.status(400).json({
        error: 'Recording is too short or empty. Please record for at least 1 second.',
      });
    }

    // Create temp file for OpenAI (required format)
    const tempId = randomUUID();
    const uploadsDir = path.join(process.cwd(), 'tmp');
    try {
      mkdirSync(uploadsDir, { recursive: true });
    } catch (dirError) {
      console.error('Error creating uploads directory:', dirError);
      return res.status(500).json({
        error: 'Failed to create temporary directory for file upload.',
        details: dirError?.message || String(dirError),
      });
    }
    tempFilePath = path.join(uploadsDir, `${tempId}.webm`);

    // Write buffer to temporary file
    try {
      await new Promise((resolve, reject) => {
        const writeStream = createWriteStream(tempFilePath);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        writeStream.end(req.file.buffer);
      });
    } catch (writeError) {
      console.error('Error writing temporary file:', writeError);
      return res.status(500).json({
        error: 'Failed to save uploaded file.',
        details: writeError?.message || String(writeError),
      });
    }

    // 1) Transcribe the recording - try AssemblyAI first, fallback to OpenAI
    let transcription;
    let assemblyAIFailed = false; // Track if AssemblyAI was attempted and failed
    try {
      console.log('Starting transcription...');
      console.log('File size:', req.file.size, 'bytes');
      console.log('File type: webm');

      const fileBuffer = readFileSync(tempFilePath);
      console.log('File buffer size:', fileBuffer.length, 'bytes');

      // Try AssemblyAI first (if configured) - SIMPLIFIED VERSION
      if (assemblyai) {
        try {
          console.log('🎤 Attempting transcription with AssemblyAI...');

          // Upload file to AssemblyAI - let SDK handle its own timeouts
          console.log('📤 Uploading file to AssemblyAI...');
          const uploadResponse = await assemblyai.files.upload(fileBuffer);
          console.log('✅ File uploaded to AssemblyAI');

          // Create transcription job
          console.log('🔄 Creating transcription job...');
          const transcriptResponse = await assemblyai.transcripts.transcribe({
            audio: uploadResponse,
            language_code: 'en',
          });

          // The transcribe() method waits for completion automatically
          if (transcriptResponse.status === 'completed') {
            if (transcriptResponse.text) {
              transcription = transcriptResponse.text;
              console.log('✅ AssemblyAI transcription successful!');
              console.log('   Transcription length:', transcription.length, 'characters');
            } else {
              console.error('❌ AssemblyAI returned empty transcription');
              throw new Error('AssemblyAI transcription completed but returned empty text');
            }
          } else if (transcriptResponse.status === 'error') {
            const errorMsg = transcriptResponse.error || 'AssemblyAI transcription failed';
            console.error('❌ AssemblyAI returned error status:', errorMsg);
            throw new Error('AssemblyAI transcription error: ' + errorMsg);
          } else {
            console.error('❌ Unexpected transcription status:', transcriptResponse.status);
            throw new Error(`Unexpected transcription status: ${transcriptResponse.status}`);
          }
        } catch (assemblyError) {
          // AssemblyAI failed - log and fall back to OpenAI
          console.error('❌ AssemblyAI transcription failed!');
          console.error('   Error:', assemblyError?.message || String(assemblyError));

          assemblyAIFailed = true;
          console.log('🔄 Falling back to OpenAI Whisper...');
          // transcription remains undefined, will try OpenAI next
        }
      }

      // Fallback to OpenAI Whisper if AssemblyAI failed or isn't configured
      if (!transcription) {
        if (openai) {
          try {
            console.log('🎤 Attempting transcription with OpenAI Whisper...');

            // Convert buffer to file for OpenAI
            const fileForOpenAI = await OpenAI.toFile(fileBuffer, `${tempId}.webm`);
            console.log('✅ File object created for OpenAI');

            // Call OpenAI Whisper - SDK handles retries automatically
            transcription = await openai.audio.transcriptions.create({
              file: fileForOpenAI,
              model: 'whisper-1',
              response_format: 'text',
              language: 'en',
            });

            console.log('✅ OpenAI Whisper transcription successful!');
            console.log('   Transcription length:', transcription.length, 'characters');
          } catch (openaiError) {
            console.error('❌ OpenAI Whisper transcription failed!');
            console.error('   Error:', openaiError?.message || String(openaiError));
            throw openaiError; // Let outer catch handle it
          }
        } else {
          throw new Error('No transcription service available. Please configure OPENAI_API_KEY or ASSEMBLYAI_API_KEY in your .env file.');
        }
      }

      // Final check - if we still don't have transcription, something went wrong
      if (!transcription) {
        throw new Error('Transcription failed - no text was generated from the audio.');
      }
      
      console.log('Transcription successful, length:', transcription?.length || 0);
      
      // Clean up temp file
      unlink(tempFilePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
      
      if (!transcription || transcription.trim().length === 0) {
        return res.status(400).json({
          error: 'No speech detected in recording. Please try again and speak clearly.',
        });
      }
    } catch (transcriptionError) {
      // Clean up temp file on error
      unlink(tempFilePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
      
      console.error('=== TRANSCRIPTION ERROR ===');
      console.error('Error message:', transcriptionError?.message);
      console.error('Error status:', transcriptionError?.status);
      console.error('Error code:', transcriptionError?.code);
      console.error('Error type:', transcriptionError?.type);
      console.error('Error name:', transcriptionError?.name);
      console.error('Error syscall:', transcriptionError?.syscall);
      console.error('Error address:', transcriptionError?.address);
      console.error('Error port:', transcriptionError?.port);
      console.error('Error errno:', transcriptionError?.errno);
      if (transcriptionError?.stack) {
        console.error('Error stack:', transcriptionError.stack);
      }
      console.error('Full error object:', JSON.stringify(transcriptionError, Object.getOwnPropertyNames(transcriptionError), 2));
      console.error('===========================');
      
      // Provide more helpful error messages with next steps
      // Note: If assemblyAIFailed is true, it means AssemblyAI was tried but failed silently
      // and we fell back to OpenAI, which also failed. Don't mention AssemblyAI to the user
      // unless it's relevant (e.g., both services failed due to connection issues)
      let errorMessage = 'Failed to transcribe audio.';
      let nextSteps = [];
      const errorMsg = transcriptionError?.message || String(transcriptionError);
      
      // Check if AssemblyAI was tried and failed, or if it fell back to OpenAI
      const isConnectionError = errorMsg.includes('Connection error') || 
                                errorMsg.includes('ECONNREFUSED') || 
                                errorMsg.includes('ENOTFOUND') || 
                                errorMsg.includes('ETIMEDOUT') ||
                                errorMsg.includes('ECONNRESET') ||
                                errorMsg.includes('socket hang up') ||
                                transcriptionError?.code === 'ECONNREFUSED' ||
                                transcriptionError?.code === 'ENOTFOUND' ||
                                transcriptionError?.code === 'ETIMEDOUT' ||
                                transcriptionError?.code === 'ECONNRESET' ||
                                transcriptionError?.type === 'APIConnectionError';
      
      if (isConnectionError) {
        if (assemblyAIFailed && assemblyai) {
          // Both AssemblyAI and OpenAI failed - mention both
          errorMessage = 'Transcription service connection failed. Both AssemblyAI and OpenAI could not be reached.';
          nextSteps = [
            '🔧 FIX FIREWALL (Most Common):',
            '   Run PowerShell as Administrator and execute:',
            '   New-NetFirewallRule -DisplayName "Node.js API Access" -Direction Outbound -Program (Get-Command node).Source -Action Allow',
            '',
            '1. Check your internet connection',
            '2. Verify your API keys are correct in the .env file',
            '3. Check server console logs for detailed error information',
            '4. Try visiting https://status.assemblyai.com/ and https://status.openai.com/',
            '5. Restart your server after making firewall changes'
          ];
        } else {
          errorMessage = 'Cannot connect to transcription service.';
          nextSteps = [
            '🔧 FIX FIREWALL (Most Common):',
            '   Run PowerShell as Administrator and execute:',
            '   New-NetFirewallRule -DisplayName "Node.js API Access" -Direction Outbound -Program (Get-Command node).Source -Action Allow',
            '',
            '1. Check your internet connection',
            '2. Verify your API keys are correct in the .env file',
            '3. Check server console logs for detailed error information',
            '4. Restart your server after making firewall changes'
          ];
        }
      } else if (errorMsg.includes('Invalid file format') || errorMsg.includes('unsupported format')) {
        errorMessage = 'Invalid audio format.';
        nextSteps = [
          '1. Try recording again',
          '2. Make sure your microphone is working',
          '3. Check that you\'re using a supported browser (Chrome, Firefox, Edge)'
        ];
      } else if (errorMsg.includes('rate limit') || transcriptionError?.status === 429) {
        errorMessage = 'API rate limit exceeded.';
        nextSteps = [
          '1. Wait a few minutes and try again',
          '2. Check your API usage limits',
          '3. If using AssemblyAI free tier, you may have exceeded 5 hours/month',
          '4. Consider upgrading your API plan if needed'
        ];
      } else if (transcriptionError?.status === 401) {
        // Don't mention AssemblyAI if it failed silently - only mention the service that actually threw the error
        errorMessage = 'Invalid API key.';
        nextSteps = [
          '1. Check your OPENAI_API_KEY in the .env file',
          '2. Verify the key is correct (no extra spaces or quotes)',
          '3. Get a new key from https://platform.openai.com/api-keys if needed',
          '4. Restart your server after updating .env'
        ];
      } else if (transcriptionError?.status === 413) {
        errorMessage = 'File too large.';
        nextSteps = [
          '1. Record a shorter speech (under 50MB)',
          '2. Try speaking for less time',
          '3. Check your recording quality settings'
        ];
      } else if (errorMsg.includes('timeout')) {
        errorMessage = 'Request timed out.';
        nextSteps = [
          '1. Try recording a shorter speech',
          '2. Check your internet connection speed',
          '3. Wait a moment and try again'
        ];
      } else if (errorMsg.includes('No transcription service available')) {
        errorMessage = 'No transcription service available.';
        nextSteps = [
          '1. Add ASSEMBLYAI_API_KEY to your .env file (recommended)',
          '   Get it from: https://www.assemblyai.com/app/account',
          '2. OR ensure OPENAI_API_KEY is set in your .env file',
          '   Get it from: https://platform.openai.com/api-keys',
          '3. Restart your server after adding the key',
          '4. Check server status: GET http://localhost:' + port + '/api/health'
        ];
      } else {
        // Generic error - provide general troubleshooting steps
        nextSteps = [
          '1. Check your .env file has valid API keys',
          '2. Verify your internet connection',
          '3. Check server logs for more details',
          '4. Try restarting your server',
          '5. Check service status: GET http://localhost:' + port + '/api/health'
        ];
      }
      
      return res.status(500).json({
        error: errorMessage,
        details: transcriptionError?.message || String(transcriptionError),
        nextSteps: nextSteps
      });
    }

    const prompt = `You are a world-class speaking coach helping someone practice public speaking in stages.
The current training mode is: "${mode}".

If mode is "script", the learner was asked to read this one-sentence script out loud (if provided):
---
${script || '(no script provided)'}
---
They were also instructed to convey this specific tone/emotion: "${scriptTone || 'neutral'}"
You must analyze whether the tone was noticeable in their delivery and provide specific feedback on how well they conveyed the required tone.

If mode is "topic", the learner was asked to speak about this topic within a time limit:
Topic: ${topic || '(no topic provided)'}
Time limit (seconds): ${timeLimitSeconds ?? 'unknown'}
Actual speaking time (seconds): ${elapsedSeconds ?? 'unknown'}

Here is the full transcript of their speech:
---
${transcription}
---

Analyze their performance and return JSON only with this shape:
{
  "summary": string,               // short overview of how they did
  "strengths": string[],           // bullet list
  "improvements": string[],        // concrete, actionable tips
  "scores": {
    "overall": number,             // 0-100
    "clarity": number,             // 0-10
    "pacing": number,              // 0-10
    "fillerWords": number,         // 0-10 (higher = better, fewer fillers)
    "confidence": number,          // 0-10
    "structure": number            // 0-10
  },
  "insights": {
    "fillerWordsExamples": string[],
    "strongMoments": string[],
    "weakMoments": string[]
  },
  "stage": "script" | "topic",
  "checks": {
    "script"?: {
      "scriptText"?: string,
      "matchScore": number,        // 0-100, how closely they followed the given script (only for mode="script")
      "feedback": string,
      "tone"?: {
        "requiredTone": string,    // The tone they were asked to convey
        "detectedTone": string,    // The tone you detected in their speech
        "toneScore": number,       // 0-100, how well they conveyed the required tone
        "toneNoticeable": boolean, // Whether the tone was clearly noticeable
        "toneFeedback": string     // Specific feedback on tone delivery and how to improve
      }
    },
    "topic"?: {
      "topicText"?: string,
      "relevanceScore": number,    // 0-100, how well they stayed on the requested topic (only for mode="topic")
      "feedback": string
    },
    "time"?: {
      "timeLimitSeconds"?: number,
      "actualSeconds"?: number,
      "withinTimeLimit": boolean,
      "feedback": string
    },
    "recommendedStage"?: "script" | "topic"
  }
}

Choose "stage" and "checks.recommendedStage" based on how advanced the learner seems.
Focus on specific feedback for spoken delivery, not for writing quality.

IMPORTANT: For script mode, if a tone was specified, you MUST include a "tone" object in "checks.script" with:
- requiredTone: the tone they were asked to convey
- detectedTone: what tone you actually detected in their speech (be specific)
- toneScore: 0-100 rating of how well they conveyed the required tone
- toneNoticeable: true if the tone was clearly noticeable, false if it was neutral/missing
- toneFeedback: concrete advice on how to better convey the required tone (e.g., "To sound more confident, speak with a stronger voice, avoid upward inflections at the end of statements, and maintain steady pacing.")`;

    // 2) Ask GPT for structured speaking feedback
    let completion;
    try {
      console.log('Starting GPT analysis...');
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      }, {
        timeout: 60000, // 60 second timeout
      });
      console.log('GPT analysis successful');
    } catch (gptError) {
      console.error('GPT analysis error:', gptError);
      return res.status(500).json({
        error: 'Failed to analyze speech with AI.',
        details: gptError?.message || String(gptError),
      });
    }

    let feedback;
    try {
      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new Error('No content in AI response');
      }
      feedback = JSON.parse(text);
    } catch (err) {
      console.error('Error parsing AI feedback:', err);
      console.error('AI response:', completion);
      // Clean up temp file if still exists
      if (tempFilePath) {
        try {
          unlink(tempFilePath, () => {});
        } catch {}
      }
      return res.status(500).json({
        error: 'Failed to parse AI feedback.',
        details: String(err),
      });
    }

    res.json({
      transcript: transcription,
      feedback,
    });
  } catch (error) {
    // Clean up temp file if exists
    if (tempFilePath) {
      try {
        unlink(tempFilePath, () => {});
      } catch {}
    }
    console.error('Error in /api/analyze:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error name:', error?.name);
    console.error('Error code:', error?.code);
    
    // Don't send response if it was already sent
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to analyze speech.',
        details: error?.message || String(error),
      });
    }
  }
});

app.listen(port, () => {
  console.log(`SpeechPrep server listening on http://localhost:${port}`);
});


