# 🔒 API Key Security Guide

## ⚠️ CRITICAL: Preventing API Key Leaks

Your OpenAI API key was being exposed because **`VITE_` prefixed environment variables are ALWAYS included in the client-side JavaScript bundle**. This means anyone can view your API key in the browser's developer tools.

## ✅ What We Fixed

1. **Removed all client-side API key usage** - The app now ALWAYS uses the Netlify Function
2. **Added error message sanitization** - Any error messages are now sanitized to prevent key exposure
3. **Removed console logging** - No sensitive information is logged to the console

## 🚨 ACTION REQUIRED: Set Up Your API Key in Netlify

**Your API key has been configured in the code. Now you need to set it in Netlify!**

### Automated Setup (Recommended):

Run the setup script:
```bash
./setup-api-key.sh
```

This will:
- Set `OPENAI_API_KEY` in Netlify
- Remove `VITE_OPENAI_API_KEY` if it exists
- Verify the setup

### Manual Setup Steps:

1. **Go to Netlify Dashboard** → Your Site → **Site settings** → **Environment variables**

2. **Add the API key:**
   - Click **"Add variable"**
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `[YOUR_API_KEY_HERE]` (use the API key provided separately)
   - **Scope**: Production (and other environments if needed)
   - Click **"Save"**

3. **Check for and DELETE `VITE_OPENAI_API_KEY` if it exists:**
   - ❌ **DELETE** `VITE_OPENAI_API_KEY` if it exists (this exposes your key!)
   - ✅ **KEEP** `OPENAI_API_KEY` (this is secure, server-side only)

4. **Why?**
   - `VITE_OPENAI_API_KEY` → Gets baked into client-side code → **EXPOSED** ❌
   - `OPENAI_API_KEY` → Only used in Netlify Functions → **SECURE** ✅

5. **After setup:**
   - Redeploy your site
   - Your API key will be secure and not exposed in the build

## 📋 Current Setup (Secure)

- ✅ API key is stored in Netlify environment variables as `OPENAI_API_KEY`
- ✅ API key is ONLY used in the Netlify Function (server-side)
- ✅ API key is NEVER sent to the client
- ✅ All error messages are sanitized to prevent key leaks
- ✅ No console logging of sensitive information

## 🧪 Local Development

For local development, you can still use a `.env` file with `VITE_OPENAI_API_KEY`, but:

1. **NEVER commit `.env` to Git** (it's already in `.gitignore`)
2. **NEVER add `VITE_OPENAI_API_KEY` to Netlify environment variables**
3. **Only use it locally** - the production build will use the Netlify Function

### Local Development Setup:

1. Create `.env` file in project root:
   ```
   VITE_OPENAI_API_KEY=your-key-here
   ```

2. Run with Netlify Dev (recommended):
   ```bash
   netlify dev
   ```
   This uses the Netlify Function locally with `OPENAI_API_KEY` from `.env`

3. Or run regular dev server:
   ```bash
   npm run dev
   ```
   Note: The app will now always use the Netlify Function, even in dev mode.

## 🔍 How to Verify Your Key is Secure

1. **Build your site:**
   ```bash
   npm run build
   ```

2. **Search the built files for your API key:**
   ```bash
   grep -r "sk-proj" dist/
   ```
   If you find your API key, it means `VITE_OPENAI_API_KEY` is still set in Netlify!

3. **Check Netlify build logs:**
   - Go to Netlify Dashboard → Deploys → Latest deploy → Build log
   - Search for "VITE_OPENAI_API_KEY"
   - It should NOT appear in the build

## 🛡️ Additional Security Measures

The code now includes:
- ✅ Error message sanitization (removes any API keys from error messages)
- ✅ No client-side API key references
- ✅ Secure server-side only API key usage
- ✅ No sensitive logging

## 📞 If OpenAI Still Detects a Leak

1. **Rotate your API key** in OpenAI dashboard
2. **Update `OPENAI_API_KEY` in Netlify** with the new key
3. **Verify `VITE_OPENAI_API_KEY` is NOT in Netlify**
4. **Redeploy your site**
5. **Wait 24-48 hours** for OpenAI's detection to update

## ✅ Summary

- ❌ **NEVER** use `VITE_OPENAI_API_KEY` in Netlify
- ✅ **ALWAYS** use `OPENAI_API_KEY` in Netlify (server-side only)
- ✅ The app now always uses the Netlify Function (secure)
- ✅ Your API key is now protected from client-side exposure

