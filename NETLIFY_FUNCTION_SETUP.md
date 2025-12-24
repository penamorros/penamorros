# Netlify Function Setup for OpenAI API

This guide explains how to set up the Netlify Function to proxy OpenAI API calls, which fixes the CORS error you were experiencing.

## 🔧 What Changed

The application now uses a Netlify Function (`netlify/functions/chat.js`) to proxy requests to the OpenAI API instead of making direct calls from the browser. This:
- ✅ Fixes CORS errors
- ✅ Keeps your API key secure (server-side only)
- ✅ Works with your existing Netlify deployment

## 📋 Setup Instructions

### 1. Set Environment Variable in Netlify

1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add variable**
5. Add:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
6. Click **Save**

### 2. Redeploy Your Site

After adding the environment variable, you need to trigger a new deployment:

1. Go to **Deploys** in your Netlify dashboard
2. Click **Trigger deploy** → **Deploy site**
3. Or push a new commit to trigger automatic deployment

### 3. Local Development (Optional)

For local development with Netlify Functions:

1. Install Netlify CLI (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. Create a `.env` file in the project root:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

3. Run Netlify Dev:
   ```bash
   netlify dev
   ```

   This will:
   - Start your Vite dev server
   - Run Netlify Functions locally
   - Load environment variables from `.env`

## 🧪 Testing

After deployment, test the chat functionality:

1. Open your site
2. Try sending a message in the chat
3. Check the browser console - you should see:
   - `📤 Making request to OpenAI API via Netlify Function...`
   - No CORS errors
   - Successful API responses

## 🔍 Troubleshooting

### Function returns "OpenAI API key not configured"
- Make sure you've added `OPENAI_API_KEY` in Netlify environment variables
- Redeploy your site after adding the variable
- Check that the variable name is exactly `OPENAI_API_KEY` (case-sensitive)

### Function returns 404
- Make sure the function file is at `netlify/functions/chat.js`
- Check that your `netlify.toml` has the redirect rules configured correctly
- Redeploy your site

### Still getting CORS errors
- The function should handle CORS automatically
- Check browser console for the exact error message
- Verify the function is being called (check Network tab)

## 📝 Notes

- The API key is now stored securely in Netlify's environment variables
- The function handles CORS automatically
- All OpenAI API calls go through the Netlify Function proxy
- The frontend no longer needs `VITE_OPENAI_API_KEY` (you can remove it from your `.env` file)

## 🔒 Security

- ✅ API key is never exposed to the client
- ✅ API key is stored in Netlify's secure environment variables
- ✅ Function validates requests before forwarding to OpenAI
- ✅ CORS is properly configured

