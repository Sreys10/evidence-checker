# Vercel Environment Variables Setup

## ✅ Correct Settings

### BACKEND_SERVICE_URL

**Name:** `BACKEND_SERVICE_URL`
**Value:** `https://web-production-a6016.up.railway.app`
**Environment Scope:** 
- ✅ **Production** (MUST be checked!)
- ✅ Preview (optional)
- ✅ Development (optional)

### NEXT_PUBLIC_APP_URL

**Name:** `NEXT_PUBLIC_APP_URL`
**Value:** `https://evidenceai.vercel.app` (no trailing slash)
**Environment Scope:**
- ✅ Production
- ✅ Preview
- ✅ Development

### Other Variables

**MONGODB_URI:** Your MongoDB connection string
**MONGODB_DB_NAME:** `evi-check`

## ⚠️ Important: Production Must Be Checked!

**The issue:** You have `BACKEND_SERVICE_URL` set, but **Production is NOT checked**!

This means:
- ❌ Your production deployment can't access the backend URL
- ✅ Preview/Development environments can (but you're using Production)

## 🔧 How to Fix

1. **Edit BACKEND_SERVICE_URL:**
   - Click on the variable
   - **CHECK the "Production" checkbox**
   - Keep Preview and Development checked too
   - Click **Save**

2. **Redeploy:**
   - Go to **Deployments** tab
   - Click three dots (⋯) on latest deployment
   - Click **Redeploy**
   - OR push a new commit

3. **Test:**
   - Wait for redeploy
   - Try uploading an image
   - Should work now!

## 📋 Environment Scope Explained

- **Production:** Your live website (evidenceai.vercel.app)
- **Preview:** Preview deployments (from pull requests)
- **Development:** Local development (vercel dev)

**For your use case:** Check ALL THREE to ensure it works everywhere.

## ✅ Final Checklist

- [ ] `BACKEND_SERVICE_URL` = `https://web-production-a6016.up.railway.app`
- [ ] **Production checkbox is CHECKED** ✅
- [ ] Preview checkbox is checked ✅
- [ ] Development checkbox is checked ✅
- [ ] Saved the changes
- [ ] Redeployed the application
- [ ] Tested by uploading an image

