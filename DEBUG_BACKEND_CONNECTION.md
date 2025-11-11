# Debugging Backend Connection Issues

## 🔍 Quick Diagnosis

If you see "Error: Analysis failed" in the frontend, follow these steps:

### Step 1: Check Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `BACKEND_SERVICE_URL` is set:
   - ✅ Should be: `https://your-railway-service.railway.app`
   - ❌ Should NOT have trailing slash: `https://your-railway-service.railway.app/`
   - ❌ Should NOT be: `http://localhost:5000`

### Step 2: Test Backend Directly

Open your browser console and run:

```javascript
// Test backend health endpoint
fetch('https://your-railway-service.railway.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected:** `{status: "ok", service: "image-detection-backend", ...}`

**If this fails:** Backend is not accessible or URL is wrong.

### Step 3: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Go to "Functions" tab
4. Click on `/api/detect-tampering`
5. Check logs for errors

Look for:
- `Backend Service URL: ...` (should show your Railway URL)
- `Calling backend at: ...`
- `Backend response status: ...`
- Any error messages

### Step 4: Check Railway Logs

1. Go to Railway Dashboard → Your Service
2. Click on "Deployments" or "Logs"
3. Check if requests are coming in
4. Look for errors

### Step 5: Test Backend Detect Endpoint

Use curl or Postman to test:

```bash
curl -X POST https://your-railway-service.railway.app/detect \
  -F "image=@test-image.jpg"
```

**Expected:** JSON response with detection results

**If this fails:** Backend has an issue

## 🐛 Common Issues

### Issue 1: BACKEND_SERVICE_URL Not Set

**Symptoms:**
- Error: "Backend service unavailable"
- Logs show: `Backend Service URL: http://localhost:5000`

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add: `BACKEND_SERVICE_URL = https://your-railway-service.railway.app`
3. Redeploy

### Issue 2: Wrong Backend URL

**Symptoms:**
- Error: "Cannot connect to backend service"
- 404 or connection refused errors

**Fix:**
1. Get correct Railway URL from Railway dashboard
2. Update `BACKEND_SERVICE_URL` in Vercel
3. Make sure no trailing slash
4. Redeploy

### Issue 3: CORS Error

**Symptoms:**
- Browser console shows CORS error
- Network tab shows preflight request failed

**Fix:**
- Backend already has CORS enabled
- Check if backend is actually running
- Verify backend URL is correct

### Issue 4: Backend Not Running

**Symptoms:**
- Health check fails
- Connection timeout

**Fix:**
1. Check Railway dashboard - is service "Active"?
2. Check Railway logs for errors
3. Restart service if needed

### Issue 5: FormData Issue

**Symptoms:**
- Backend receives request but returns error
- 400 Bad Request from backend

**Fix:**
- Check Railway logs for specific error
- Verify backend is expecting `image` field
- Check file size limits

## 🔧 Quick Fixes

### Fix 1: Update Environment Variable

```bash
# In Vercel Dashboard:
BACKEND_SERVICE_URL = https://your-actual-railway-url.railway.app
```

### Fix 2: Verify Backend is Running

1. Visit: `https://your-railway-service.railway.app/health`
2. Should return JSON with `status: "ok"`

### Fix 3: Check Network Tab

1. Open browser DevTools → Network tab
2. Upload an image
3. Find `/api/detect-tampering` request
4. Check:
   - Request URL
   - Request payload
   - Response status
   - Response body

## 📋 Checklist

- [ ] `BACKEND_SERVICE_URL` set in Vercel
- [ ] Backend URL has no trailing slash
- [ ] Backend URL uses `https://`
- [ ] Backend health endpoint works
- [ ] Backend service is "Active" in Railway
- [ ] No CORS errors in browser console
- [ ] Vercel function logs show backend URL
- [ ] Railway logs show incoming requests

## 🆘 Still Not Working?

1. **Check Vercel Function Logs:**
   - Look for the console.log messages we added
   - See what URL is being called
   - Check error messages

2. **Check Railway Logs:**
   - See if requests are reaching backend
   - Check for Python errors
   - Verify API credentials are set

3. **Test Backend Manually:**
   ```bash
   curl -X POST https://your-railway-service.railway.app/detect \
     -F "image=@test.jpg" \
     -v
   ```

4. **Share Error Details:**
   - Vercel function logs
   - Railway logs
   - Browser console errors
   - Network tab response

