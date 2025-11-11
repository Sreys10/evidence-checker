# Vercel Deployment Guide

## ✅ Prerequisites Completed

- ✅ Backend deployed on Railway
- ✅ Railway environment variables set
- ✅ Backend service URL obtained

## 🧹 Step 1: Clean Up Frontend Repository

You don't need these folders/files in your frontend repo:
- ❌ `model/` - Backend handles this
- ❌ `backend-service/` - Separate repo
- ❌ `python-service/` - Not needed
- ❌ `requirements.txt` - Python dependency file
- ❌ `Dockerfile` - Not needed for Vercel
- ❌ `docker-compose.yml` - Not needed for Vercel

**These are already in `.gitignore`**, so they won't be pushed. But if they're already tracked, remove them:

```bash
cd evi-check

# Remove backend-related folders (they're in separate repo)
git rm -r --cached model/ backend-service/ python-service/ 2>/dev/null || true
git rm --cached requirements.txt Dockerfile docker-compose.yml 2>/dev/null || true

# Commit the cleanup
git commit -m "Remove backend files - using separate backend service"
```

## 🚀 Step 2: Prepare Frontend for Deployment

### 2.1 Install Dependencies

Make sure you have the latest dependencies:

```bash
cd evi-check
npm install
```

### 2.2 Test Build Locally (Optional)

```bash
npm run build
```

If build succeeds, you're ready to deploy!

## 📦 Step 3: Push to GitHub

### 3.1 Initialize Git (if not done)

```bash
cd evi-check
git init
git add .
git commit -m "Initial frontend commit"
```

### 3.2 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `evi-check-frontend` (or any name)
4. **Don't** initialize with README
5. Click "Create repository"

### 3.3 Push to GitHub

```bash
git remote add origin https://github.com/yourusername/evi-check-frontend.git
git branch -M main
git push -u origin main
```

## 🎯 Step 4: Deploy on Vercel

### 4.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login (use GitHub)
3. Click **"Add New Project"**
4. Click **"Import Git Repository"**
5. Select your `evi-check-frontend` repository
6. Click **"Import"**

### 4.2 Configure Project

Vercel will auto-detect Next.js. Verify:
- **Framework Preset:** Next.js ✅
- **Root Directory:** `./` ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅

### 4.3 Add Environment Variables

**IMPORTANT:** Before clicking "Deploy", add environment variables:

Click **"Environment Variables"** and add:

```
BACKEND_SERVICE_URL = https://your-railway-service.railway.app
```

Replace `your-railway-service.railway.app` with your actual Railway service URL.

**Also add:**
```
MONGODB_URI = your_mongodb_connection_string
MONGODB_DB_NAME = evi-check
NEXT_PUBLIC_APP_URL = https://your-vercel-app.vercel.app
```

(You'll get the Vercel URL after first deployment, then update this)

### 4.4 Deploy!

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Your app will be live at: `https://your-app.vercel.app`

## ✅ Step 5: Update Environment Variables

After first deployment:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
3. Redeploy (or it will auto-update)

## 🧪 Step 6: Test Deployment

### 6.1 Test Frontend

1. Visit your Vercel URL
2. Try to register/login
3. Upload an image for detection
4. Check if it calls your Railway backend

### 6.2 Check Browser Console

1. Open DevTools (F12)
2. Go to Network tab
3. Upload an image
4. Look for request to `/api/detect-tampering`
5. Check if it forwards to your Railway backend

### 6.3 Test Backend Connection

In browser console, test:
```javascript
fetch('https://your-railway-service.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

Should return: `{status: "ok", service: "image-detection-backend", ...}`

## 🔧 Troubleshooting

### Build Fails

**Error:** Module not found
- Run `npm install` locally
- Check `package.json` has all dependencies
- Push `package-lock.json`

**Error:** TypeScript errors
- Fix TypeScript errors locally first
- Run `npm run build` to test

### Backend Not Reaching

**Error:** "Backend service unavailable"
- Check `BACKEND_SERVICE_URL` in Vercel env vars
- Verify Railway service is running
- Test Railway URL directly in browser

**Error:** CORS errors
- Backend already has CORS enabled
- Check Railway service is accessible
- Verify URL has no trailing slash

### Environment Variables Not Working

- Make sure variables are set in Vercel
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

## 📋 Checklist

Before deploying:
- [ ] Removed backend folders from frontend repo
- [ ] Installed dependencies (`npm install`)
- [ ] Tested build locally (`npm run build`)
- [ ] Pushed to GitHub
- [ ] Got Railway backend URL
- [ ] Ready to add environment variables in Vercel

After deploying:
- [ ] Frontend deployed successfully
- [ ] Environment variables set
- [ ] Tested frontend URL
- [ ] Tested image upload
- [ ] Verified backend connection
- [ ] Everything working! 🎉

## 🎉 You're Done!

Your application is now:
- ✅ Frontend on Vercel
- ✅ Backend on Railway
- ✅ Separate repositories
- ✅ Fully deployed!

