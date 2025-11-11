# Check Vercel Environment Variables

## ⚠️ IMPORTANT: The CSP Error is Normal

The Content Security Policy error you see in the browser console is **expected** when testing directly from the browser. That's not the issue.

The **real issue** is that your Vercel API route needs to call the Railway backend, and it can't because:

1. **BACKEND_SERVICE_URL is not set in Vercel**, OR
2. **The URL is wrong**

## 🔍 How to Check Vercel Environment Variables

### Step 1: Go to Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project (`evidence-checker` or whatever it's named)
3. Go to **Settings** → **Environment Variables**

### Step 2: Verify BACKEND_SERVICE_URL

Look for:
```
BACKEND_SERVICE_URL
```

**It should be set to:**
```
https://web-production-a6016.up.railway.app
```

**Make sure:**
- ✅ No trailing slash
- ✅ Uses `https://`
- ✅ Matches your Railway URL exactly
- ✅ Is set for **Production** environment (or All environments)

### Step 3: If It's Missing or Wrong

1. **Add/Edit the variable:**
   - Key: `BACKEND_SERVICE_URL`
   - Value: `https://web-production-a6016.up.railway.app`
   - Environment: **Production** (or All)

2. **Save**

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click the three dots on latest deployment
   - Click **Redeploy**
   - OR push a new commit

## 🧪 Test After Setting Environment Variable

1. **Wait for redeploy to complete**

2. **Try uploading an image again**

3. **Check Vercel Function Logs:**
   - Go to Deployments → Latest deployment
   - Click **Functions** tab
   - Click `/api/detect-tampering`
   - Look for logs that say:
     - `Calling backend at: https://web-production-a6016.up.railway.app/detect`
     - `Backend response status: 200` (if successful)

## 🔧 If Still Not Working

### Check Railway Backend

1. **Test backend directly (from Railway logs or curl):**
   ```bash
   curl https://web-production-a6016.up.railway.app/health
   ```

2. **Should return:**
   ```json
   {"status":"ok","service":"image-detection-backend","version":"1.0.0"}
   ```

### Check Vercel Function Logs

The logs will show:
- What URL is being called
- What error is occurring
- Backend response status

## 📋 Quick Checklist

- [ ] `BACKEND_SERVICE_URL` exists in Vercel environment variables
- [ ] Value is: `https://web-production-a6016.up.railway.app`
- [ ] No trailing slash
- [ ] Set for Production environment
- [ ] Redeployed after setting variable
- [ ] Backend health endpoint works
- [ ] Checked Vercel function logs

## 🎯 Most Likely Fix

**Add this to Vercel Environment Variables:**

```
BACKEND_SERVICE_URL = https://web-production-a6016.up.railway.app
```

Then **redeploy**, and it should work!

