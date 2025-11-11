# Separate Deployment Setup Guide

This guide will help you deploy the frontend on Vercel and backend on Railway as separate repositories.

## 📁 Repository Structure

You'll have **two separate repositories**:

1. **Frontend Repository** (Next.js) → Deploy on Vercel
2. **Backend Repository** (Python Flask) → Deploy on Railway

---

## 🚀 Step 1: Setup Backend Repository (Railway)

### 1.1 Create Backend Repository

```bash
# Navigate to backend-service folder
cd evi-check/backend-service

# Initialize git repository
git init
git add .
git commit -m "Initial backend service commit"

# Create a new repository on GitHub and push
git remote add origin https://github.com/yourusername/evi-check-backend.git
git branch -M main
git push -u origin main
```

### 1.2 Deploy on Railway

1. **Go to [railway.app](https://railway.app)** and sign up/login
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your backend repository** (`evi-check-backend`)
5. **Railway will auto-detect Python and start deploying**

### 1.3 Configure Environment Variables on Railway

1. Go to your Railway project
2. Click on your service
3. Go to **Variables** tab
4. Add these environment variables:

```
IMAGE_DETECTION_API_USER=1969601374
IMAGE_DETECTION_API_SECRET=uk7Rwq4Bh8kURjU3WauN3J7nhtGgjSQz
```

5. **Note the service URL** - Railway will provide something like:
   ```
   https://your-service-name.railway.app
   ```

### 1.4 Test Backend Service

Once deployed, test it:

```bash
# Health check
curl https://your-service-name.railway.app/health

# Should return: {"status":"ok","service":"image-detection-backend","version":"1.0.0"}
```

---

## 🎨 Step 2: Setup Frontend Repository (Vercel)

### 2.1 Update Frontend Configuration

1. **Update environment variables** in your frontend:

Create or update `.env.local`:

```bash
# Backend service URL (from Railway)
BACKEND_SERVICE_URL=https://your-service-name.railway.app

# MongoDB
MONGODB_URI=your_mongodb_uri
MONGODB_DB_NAME=evi-check

# App URL
NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
```

2. **Remove Python model files** (optional, since we're using external service):
   - You can keep them for reference, but they won't be used
   - The API route now calls the external backend

### 2.2 Create Frontend Repository

```bash
# Navigate to frontend root
cd evi-check

# Remove backend-service folder from frontend repo (it's separate now)
# Or add it to .gitignore

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial frontend commit"

# Create a new repository on GitHub and push
git remote add origin https://github.com/yourusername/evi-check-frontend.git
git branch -M main
git push -u origin main
```

### 2.3 Deploy on Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Click "Add New Project"**
3. **Import your frontend repository** from GitHub
4. **Configure project:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (or leave default)
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Add Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Add:
     ```
     BACKEND_SERVICE_URL=https://your-service-name.railway.app
     MONGODB_URI=your_mongodb_uri
     MONGODB_DB_NAME=evi-check
     NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
     ```

6. **Click "Deploy"**

---

## ✅ Step 3: Verify Deployment

### 3.1 Test Backend (Railway)

```bash
# Health check
curl https://your-service-name.railway.app/health

# Expected response:
# {"status":"ok","service":"image-detection-backend","version":"1.0.0"}
```

### 3.2 Test Frontend (Vercel)

1. Visit your Vercel URL: `https://your-frontend.vercel.app`
2. Try uploading an image for detection
3. Check browser console for any errors

### 3.3 Test Integration

1. Open browser DevTools → Network tab
2. Upload an image in the frontend
3. Check if the request goes to your Railway backend URL
4. Verify the response is received correctly

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** Backend returns 500 error
- **Solution:** Check Railway logs, verify API credentials are set correctly

**Problem:** CORS errors
- **Solution:** Backend already has CORS enabled, but verify your frontend URL is allowed

**Problem:** Backend not reachable
- **Solution:** Check Railway service is running, verify the URL is correct

### Frontend Issues

**Problem:** "Backend service unavailable" error
- **Solution:** 
  1. Verify `BACKEND_SERVICE_URL` is set correctly in Vercel
  2. Check Railway service is running
  3. Test backend URL directly with curl

**Problem:** Build fails on Vercel
- **Solution:** 
  1. Check build logs in Vercel dashboard
  2. Ensure all dependencies are in `package.json`
  3. Verify Node.js version compatibility

### Connection Issues

**Problem:** Frontend can't reach backend
- **Solution:**
  1. Verify backend URL is accessible (test with curl)
  2. Check CORS settings in backend
  3. Ensure environment variable is set correctly

---

## 📝 Environment Variables Summary

### Backend (Railway)
```
IMAGE_DETECTION_API_USER=your_api_user
IMAGE_DETECTION_API_SECRET=your_api_secret
PORT=5000 (auto-set by Railway)
```

### Frontend (Vercel)
```
BACKEND_SERVICE_URL=https://your-service-name.railway.app
MONGODB_URI=your_mongodb_uri
MONGODB_DB_NAME=evi-check
NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
```

---

## 🔄 Updating Deployments

### Update Backend

```bash
cd backend-service
# Make changes
git add .
git commit -m "Update backend"
git push
# Railway will auto-deploy
```

### Update Frontend

```bash
cd evi-check
# Make changes
git add .
git commit -m "Update frontend"
git push
# Vercel will auto-deploy
```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Flask CORS Documentation](https://flask-cors.readthedocs.io/)

---

## 🎉 You're Done!

Your application is now deployed with:
- ✅ Frontend on Vercel (fast, global CDN)
- ✅ Backend on Railway (Python service)
- ✅ Separate repositories for better organization
- ✅ Independent scaling and updates

