# 🚀 Netlify API Key Setup - DO THIS NOW

## Your API Key
```
[YOUR_API_KEY_HERE]
```

## Quick Setup Steps (5 minutes)

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Login with: `penamorrosm@gmail.com` / `Rionilo500#"`

2. **Select Your Site**
   - Click on your site (should be linked to `penamorros` repository)

3. **Go to Environment Variables**
   - Click: **Site settings** (in the top navigation)
   - Click: **Environment variables** (in the left sidebar)

4. **Add OPENAI_API_KEY**
   - Click: **"Add variable"** button
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `[YOUR_API_KEY_HERE]` (paste your OpenAI API key)
   - **Scope**: Select **"Production"** (and other environments if you want)
   - Click: **"Save"**

5. **DELETE VITE_OPENAI_API_KEY (IMPORTANT!)**
   - Look for `VITE_OPENAI_API_KEY` in the list
   - If it exists, click the **trash icon** to delete it
   - This prevents your API key from being exposed in the client-side code

6. **Redeploy Your Site**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Or just push a new commit to trigger automatic deployment

## ✅ Verification

After setup, verify:
- ✅ `OPENAI_API_KEY` is in the environment variables list
- ❌ `VITE_OPENAI_API_KEY` is NOT in the list
- ✅ Your site redeploys successfully
- ✅ Chat functionality works on your live site

## 🔒 Security Status

Once completed:
- ✅ API key is stored server-side only (secure)
- ✅ API key will NOT be exposed in client-side code
- ✅ OpenAI should stop detecting it as leaked
- ✅ Your site will work without API key exposure

---

**Time to complete**: ~5 minutes
**Difficulty**: Easy (just copy-paste)

