# Test Backend Connection

## Quick Test

### Test 1: Backend Health Check

```bash
curl https://web-production-a6016.up.railway.app/health
```

**Expected:** `{"status":"ok","service":"image-detection-backend",...}`

### Test 2: Backend Detect Endpoint

```bash
curl -X POST https://web-production-a6016.up.railway.app/detect \
  -F "image=@test-image.jpg" \
  -v
```

**Expected:** JSON response with detection results

**If this works:** The backend is fine, issue is with how Next.js sends data.

**If this fails:** The backend has an issue - check Railway logs.

## Check Logs

### Vercel Logs
1. Go to Vercel → Deployments → Latest → Functions → `/api/detect-tampering`
2. Look for:
   - `Axios error status: 400`
   - `Axios error data: {...}` ← This shows what backend returned

### Railway Logs  
1. Go to Railway → Your Service → Logs
2. Look for:
   - `Request files keys: [...]` ← Should show `['image']`
   - Error messages
   - Debug output

## Common Issues

### Issue: `received_files: []`
**Meaning:** Flask isn't receiving the file
**Fix:** FormData format issue - axios should handle this

### Issue: `content_type` is wrong
**Meaning:** Headers aren't set correctly
**Fix:** Make sure FormData headers are used

### Issue: Backend times out
**Meaning:** Image processing takes too long
**Fix:** Increase timeout (already set to 60s)

