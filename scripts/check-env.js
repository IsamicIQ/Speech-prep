#!/usr/bin/env node

import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Checking environment setup...\n');

// Check if .env file exists
const envPath = join(rootDir, '.env');
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('\n📝 Please create a .env file in the root directory with:');
  console.log('   VITE_SUPABASE_URL=https://mwrvdznuluxquekhnvyw.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your_anon_key');
  console.log('   OPENAI_API_KEY=your_openai_api_key\n');
  process.exit(1);
}

console.log('✅ .env file found');

// Read and check environment variables
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

let hasErrors = false;

// Check Supabase URL
if (!envVars.VITE_SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL not found in .env');
  hasErrors = true;
  } else {
  console.log('✅ VITE_SUPABASE_URL is set');
}

// Check Supabase Anon Key
if (!envVars.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in .env');
  hasErrors = true;
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY is set');
}

// Check OpenAI API Key
if (!envVars.OPENAI_API_KEY || envVars.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.error('❌ OPENAI_API_KEY not set or still has placeholder value');
  console.log('   Please add your OpenAI API key to .env file');
  hasErrors = true;
} else {
  console.log('✅ OPENAI_API_KEY is set');
}

// Check if OpenAI key looks valid (starts with sk-)
if (envVars.OPENAI_API_KEY && !envVars.OPENAI_API_KEY.startsWith('sk-')) {
  console.warn('⚠️  OPENAI_API_KEY does not start with "sk-". Make sure it\'s correct.');
}

console.log('\n📋 Summary:');
if (hasErrors) {
  console.log('❌ Some environment variables are missing or incorrect.');
  console.log('   Please check your .env file and try again.\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!\n');
  console.log('🚀 You can now run: npm run dev:full\n');
}
