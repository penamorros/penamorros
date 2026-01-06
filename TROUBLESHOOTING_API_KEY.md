# 🔧 Troubleshooting API Key Error

## Error Message
```
Incorrect API key provided: [REDACTED]-********************************************************************************************************************************************************qVsA
```

## Possible Causes

### 1. **API Key Has Extra Spaces**
The API key might have leading/trailing spaces when copied.

**Solution:**
- Go to Netlify Dashboard → Site settings → Environment variables
- Click on `OPENAI_API_KEY` to edit it
- Make sure there are NO spaces before or after the key
- The key should start with `sk-proj-` and end with `qVsA`
- Copy the key again and paste it carefully

### 2. **API Key Was Truncated**
The key might have been cut off when copying.

**Full API Key:**
```
[YOUR_API_KEY_HERE]
```

**Check:**
- The key should be exactly this length
- It should start with `sk-proj-`
- It should end with `qVsA`

### 3. **API Key Not Set in Production**
The key might only be set for other environments.

**Solution:**
- Go to Netlify Dashboard → Site settings → Environment variables
- Find `OPENAI_API_KEY`
- Make sure it's set for **"Production"** scope
- If it's only set for "Development" or "Branch deploys", add it for Production

### 4. **Site Not Redeployed After Setting Key**
Environment variables only take effect after redeployment.

**Solution:**
- Go to Netlify Dashboard → Deploys
- Click **"Trigger deploy"** → **"Deploy site"**
- Wait for deployment to complete
- Test the chat again

### 5. **API Key Expired or Revoked**
The key might have been revoked by OpenAI.

**Solution:**
- Go to https://platform.openai.com/account/api-keys
- Check if the key is still active
- If not, create a new key and update it in Netlify

## Step-by-Step Fix

1. **Verify the Key in Netlify:**
   - Go to https://app.netlify.com
   - Your site → Site settings → Environment variables
   - Click on `OPENAI_API_KEY` to view/edit
   - Verify it matches your API key exactly (should start with `sk-proj-` and be the full length)

2. **Delete and Re-add (if needed):**
   - Delete the `OPENAI_API_KEY` variable
   - Click "Add variable"
   - Key: `OPENAI_API_KEY`
   - Value: (paste the full key above, no spaces)
   - Scope: **Production** (check this!)
   - Save

3. **Redeploy:**
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"
   - Wait for completion

4. **Test:**
   - Visit your live site
   - Try the chat feature
   - Should work now!

## Quick Test

To verify the key is set correctly, you can check the Netlify function logs:
- Go to Netlify Dashboard → Functions
- Click on `chat` function
- Check the logs for any errors

## Still Not Working?

If the error persists:
1. Create a NEW API key at https://platform.openai.com/account/api-keys
2. Update it in Netlify
3. Redeploy
4. Test again

