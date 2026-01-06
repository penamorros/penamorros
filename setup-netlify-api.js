#!/usr/bin/env node

/**
 * Script to set up OpenAI API key in Netlify using the API directly
 * This bypasses the need for CLI linking
 */

import fetch from 'node-fetch';

const API_KEY = process.env.OPENAI_API_KEY || "[YOUR_API_KEY_HERE]";
const EMAIL = process.env.NETLIFY_EMAIL || "[YOUR_EMAIL_HERE]";
const PASSWORD = process.env.NETLIFY_PASSWORD || "[YOUR_PASSWORD_HERE]";

console.log('🔧 Setting up OpenAI API key in Netlify via API...\n');

async function setupNetlifyEnv() {
  try {
    // Step 1: Get access token
    console.log('🔐 Authenticating with Netlify...');
    const authResponse = await fetch('https://api.netlify.com/api/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'password',
        username: EMAIL,
        password: PASSWORD,
        client_id: 'netlify-cli'
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ Authentication failed:', errorText);
      throw new Error('Authentication failed');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    console.log('✅ Authenticated successfully\n');

    // Step 2: Get sites list
    console.log('🔍 Finding your site...');
    const sitesResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!sitesResponse.ok) {
      throw new Error('Failed to fetch sites');
    }

    const sites = await sitesResponse.json();
    if (sites.length === 0) {
      throw new Error('No sites found');
    }

    // Find site by git remote or use first site
    const site = sites.find(s => s.name === 'penamorros' || s.name.includes('penamorros')) || sites[0];
    console.log(`✅ Found site: ${site.name} (${site.id})\n`);

    // Step 3: Set environment variable
    console.log('🔐 Setting OPENAI_API_KEY...');
    const envResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/env`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: 'OPENAI_API_KEY',
        values: [{
          value: API_KEY,
          context: 'production'
        }]
      })
    });

    if (!envResponse.ok) {
      const errorText = await envResponse.text();
      // Check if it already exists
      if (errorText.includes('already exists')) {
        console.log('⚠️  OPENAI_API_KEY already exists, updating...');
        // Delete and recreate
        const deleteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/env/OPENAI_API_KEY`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        // Retry creation
        const retryResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/env`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key: 'OPENAI_API_KEY',
            values: [{
              value: API_KEY,
              context: 'production'
            }]
          })
        });
        if (!retryResponse.ok) {
          throw new Error('Failed to set environment variable');
        }
      } else {
        throw new Error(`Failed to set environment variable: ${errorText}`);
      }
    }
    console.log('✅ Successfully set OPENAI_API_KEY\n');

    // Step 4: Check and remove VITE_OPENAI_API_KEY
    console.log('🔍 Checking for VITE_OPENAI_API_KEY...');
    const envListResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/env`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (envListResponse.ok) {
      const envVars = await envListResponse.json();
      const viteKey = envVars.find(e => e.key === 'VITE_OPENAI_API_KEY');
      if (viteKey) {
        console.log('⚠️  VITE_OPENAI_API_KEY found! Removing it...');
        await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/env/VITE_OPENAI_API_KEY`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        console.log('✅ Removed VITE_OPENAI_API_KEY\n');
      } else {
        console.log('✅ VITE_OPENAI_API_KEY not found (good!)\n');
      }
    }

    console.log('✅ Setup complete!');
    console.log('🚀 Next: Redeploy your site in Netlify Dashboard\n');
    console.log(`📋 Site URL: ${site.url || site.ssl_url || 'Check Netlify Dashboard'}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to https://app.netlify.com');
    console.log('2. Login with:', EMAIL);
    console.log('3. Select your site');
    console.log('4. Go to Site settings → Environment variables');
    console.log('5. Add variable:');
    console.log('   Key: OPENAI_API_KEY');
    console.log(`   Value: [YOUR_API_KEY_HERE]`);
    console.log('   Scope: Production');
    console.log('6. Delete VITE_OPENAI_API_KEY if it exists');
    console.log('7. Redeploy your site');
    process.exit(1);
  }
}

setupNetlifyEnv();

