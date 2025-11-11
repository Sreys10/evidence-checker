# Debugging 400 Error

## 🔍 What the 400 Error Means

A **400 Bad Request** means the backend is receiving the request, but something is wrong with the data format.

## 📋 Steps to Debug

### Step 1: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Go to **Functions** tab
4. Click `/api/detect-tampering`
5. Look for logs showing:
   - `Calling backend at: ...`
   - `File name: ...`
   - `File type: ...`
   - `File size: ...`
   - `Axios error status: 400`
   - `Axios error data: ...` ← **This will show the backend's error message**

### Step 2: Check Railway Backend Logs

1. Go to Railway Dashboard → Your Service
2. Click on **Deployments** or **Logs**
3. Look for the debug logs we added:
   - `Request method: POST`
   - `Content-Type: ...`
   - `Request files keys: [...]` ← **This shows what Flask received**
   - `Request form keys: [...]`
   - Error messages

### Step 3: Common Causes of 400 Error

#### Cause 1: File Not in request.files
**Backend Error:** `"No image file provided"` or `"received_files": []`

**Solution:** The FormData isn't being sent correctly. Axios should handle this, but verify:
- File buffer is not empty
- FormData is created correctly
- Headers include Content-Type with boundary

#### Cause 2: Empty Filename
**Backend Error:** `"No file selected or filename is empty"`

**Solution:** Make sure `file.name` is not empty when creating FormData

#### Cause 3: Wrong Content-Type
**Backend Error:** `"File must be an image. Received content-type: ..."`

**Solution:** Verify file.type is set correctly

#### Cause 4: Flask Not Parsing Multipart
**Backend Error:** `"received_files": []` and `"content_type": "application/json"` or similar

**Solution:** The Content-Type header might be wrong. Axios should set it automatically.

## 🔧 Quick Fixes

### Fix 1: Verify Backend is Receiving Request

Check Railway logs - you should see:
```
Request method: POST
Content-Type: multipart/form-data; boundary=...
Request files keys: ['image']
```

If you see `Request files keys: []`, the file isn't being sent correctly.

### Fix 2: Test Backend Directly

Use curl to test if backend works:
```bash
curl -X POST https://web-production-a6016.up.railway.app/detect \
  -F "image=@test-image.jpg" \
  -v
```

If this works, the issue is with how Next.js is sending the data.

### Fix 3: Check Error Details in Frontend

The error should now show more details. Check:
- Browser console for the error
- Network tab → `/api/detect-tampering` → Response
- Look for `details` field in error response

## 🎯 Next Steps

1. **Check Vercel Function Logs** - See what error axios is returning
2. **Check Railway Backend Logs** - See what Flask is receiving
3. **Share the error details** - The logs will show exactly what's wrong

## 📝 What to Look For

In Vercel logs, look for:
```
Axios error status: 400
Axios error data: {
  "status": "error",
  "error": "...",
  "received_files": [...],
  "content_type": "..."
}
```

This will tell us exactly what Flask received (or didn't receive).

## ✅ Expected Flow

1. Frontend sends file to `/api/detect-tampering`
2. Next.js API route receives file
3. Next.js creates FormData with file buffer
4. Next.js sends to Railway backend via axios
5. Railway backend receives multipart/form-data
6. Flask parses `request.files['image']`
7. Backend processes image
8. Backend returns results

The 400 error is happening at step 5 or 6 - Flask isn't receiving the file correctly.

