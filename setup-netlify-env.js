#!/usr/bin/env node

/**
 * Script to set up OpenAI API key in Netlify
 * This uses the Netlify API directly to avoid interactive login
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_KEY = process.env.OPENAI_API_KEY || "[YOUR_API_KEY_HERE]";

// Note: This requires Netlify CLI to be authenticated
// Run: npx netlify-cli login first, then run this script

console.log('🔧 Setting up OpenAI API key in Netlify...\n');

try {
  // Set the environment variable
  console.log('🔐 Setting OPENAI_API_KEY...');
  execSync(`npx netlify-cli env:set OPENAI_API_KEY "${API_KEY}" --context production`, {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('✅ Successfully set OPENAI_API_KEY\n');

  // Check for and remove VITE_OPENAI_API_KEY if it exists
  console.log('🔍 Checking for VITE_OPENAI_API_KEY...');
  try {
    const envList = execSync('npx netlify-cli env:list', { encoding: 'utf-8', cwd: __dirname });
    if (envList.includes('VITE_OPENAI_API_KEY')) {
      console.log('⚠️  VITE_OPENAI_API_KEY found! Removing it...');
      execSync('npx netlify-cli env:unset VITE_OPENAI_API_KEY --context production', {
        stdio: 'inherit',
        cwd: __dirname
      });
      console.log('✅ Removed VITE_OPENAI_API_KEY\n');
    } else {
      console.log('✅ VITE_OPENAI_API_KEY not found (good!)\n');
    }
  } catch (e) {
    console.log('ℹ️  Could not check environment variables list\n');
  }

  console.log('✅ Setup complete!');
  console.log('🚀 Next: Redeploy your site in Netlify Dashboard\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📋 Manual Setup Instructions:');
  console.log('1. Go to https://app.netlify.com');
  console.log('2. Select your site');
  console.log('3. Go to Site settings → Environment variables');
  console.log('4. Add variable:');
  console.log('   Key: OPENAI_API_KEY');
  console.log(`   Value: ${API_KEY}`);
  console.log('   Scope: Production');
  console.log('5. Delete VITE_OPENAI_API_KEY if it exists');
  console.log('6. Redeploy your site');
  process.exit(1);
}

