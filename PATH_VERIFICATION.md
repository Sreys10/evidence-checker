# Path Verification Guide

## ✅ Path Flow (All Correct!)

### 1. Frontend → Next.js API Route
**Frontend Component:** `components/analyst/tampering-detection.tsx`
```typescript
fetch('/api/detect-tampering', {
  method: 'POST',
  body: formData,
})
```
**Path:** `/api/detect-tampering` ✅

### 2. Next.js API Route → Backend Service
**API Route:** `app/api/detect-tampering/route.ts`
```typescript
const backendUrl = `${BACKEND_SERVICE_URL}/detect`;
fetch(backendUrl, { ... })
```
**Path:** `https://web-production-a6016.up.railway.app/detect` ✅

### 3. Backend Service Endpoint
**Backend:** `backend-service/app.py`
```python
@app.route('/detect', methods=['POST'])
def detect():
    ...
```
**Path:** `/detect` ✅

## 📁 File Structure

```
Frontend (Vercel)
├── app/
│   └── api/
│       └── detect-tampering/
│           └── route.ts  ✅ (handles /api/detect-tampering)

Backend (Railway)
└── backend-service/
    └── app.py  ✅ (handles /detect)
```

## 🔗 Complete Request Flow

```
Browser (Frontend)
  ↓ POST /api/detect-tampering
Next.js API Route (Vercel)
  ↓ POST https://web-production-a6016.up.railway.app/detect
Backend Service (Railway)
  ↓ Processes image
Backend Service
  ↓ Returns JSON
Next.js API Route
  ↓ Transforms response
Browser (Frontend)
  ↓ Displays results
```

## ✅ All Paths Are Correct!

1. ✅ Frontend calls: `/api/detect-tampering`
2. ✅ Next.js route exists: `app/api/detect-tampering/route.ts`
3. ✅ Next.js calls backend: `${BACKEND_SERVICE_URL}/detect`
4. ✅ Backend endpoint exists: `/detect` in `app.py`
5. ✅ Backend URL is set: `https://web-production-a6016.up.railway.app`

## 🔍 Verification Checklist

- [x] Frontend path: `/api/detect-tampering` ✅
- [x] API route file: `app/api/detect-tampering/route.ts` ✅
- [x] Backend URL: `https://web-production-a6016.up.railway.app` ✅
- [x] Backend endpoint: `/detect` ✅
- [x] Backend route defined: `@app.route('/detect', methods=['POST'])` ✅

## 🎯 The Only Issue Was Environment Variable!

The paths are **all correct**. The only issue was:
- ❌ `BACKEND_SERVICE_URL` not set for **Production** environment

Once you:
1. ✅ Check "Production" checkbox for `BACKEND_SERVICE_URL`
2. ✅ Save
3. ✅ Redeploy

Everything should work perfectly!

## 🧪 Test the Paths

### Test 1: Backend Health (from Railway)
```bash
curl https://web-production-a6016.up.railway.app/health
```
**Expected:** `{"status":"ok","service":"image-detection-backend",...}`

### Test 2: Backend Detect (from Railway)
```bash
curl -X POST https://web-production-a6016.up.railway.app/detect \
  -F "image=@test.jpg"
```
**Expected:** JSON with detection results

### Test 3: Frontend API Route (from Vercel)
After deployment, check Vercel Function Logs:
- Should see: `Calling backend at: https://web-production-a6016.up.railway.app/detect`
- Should see: `Backend response status: 200`

## ✅ Summary

**All paths are correct!** The file structure and route definitions are perfect. The only thing needed was setting the environment variable for Production environment.

