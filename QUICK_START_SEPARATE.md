# Quick Start: Separate Deployment

## 🎯 What We've Done

✅ Created a **standalone Python backend service** in `backend-service/` folder  
✅ Updated frontend API route to call external backend via HTTP  
✅ Added all necessary configuration files for Railway deployment

## 📋 Quick Steps

### 1. Backend Repository Setup (5 minutes)

```bash
# Navigate to backend folder
cd evi-check/backend-service

# Initialize git
git init
git add .
git commit -m "Initial backend service"

# Create GitHub repo and push
# Then deploy on Railway (see SETUP_SEPARATE_DEPLOYMENT.md)
```

### 2. Frontend Repository Setup (5 minutes)

```bash
# Navigate to frontend root
cd evi-check

# Install new dependency
npm install

# Add environment variable
# Create .env.local with:
# BACKEND_SERVICE_URL=https://your-railway-service.railway.app

# Push to GitHub and deploy on Vercel
```

### 3. Deploy Backend on Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your backend repository
4. Add environment variables:
   - `IMAGE_DETECTION_API_USER`
   - `IMAGE_DETECTION_API_SECRET`
5. Copy the service URL

### 4. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your frontend repository
3. Add environment variable:
   - `BACKEND_SERVICE_URL` = your Railway URL
4. Deploy!

## 📁 File Structure

```
backend-service/          # Separate backend repo
├── app.py               # Flask API
├── image_detector.py    # Detection logic
├── requirements.txt     # Python dependencies
├── Procfile            # Railway config
└── README.md

evi-check/               # Frontend repo
├── app/
│   └── api/
│       └── detect-tampering/
│           └── route.ts  # Updated to call backend
└── package.json         # Added form-data
```

## 🔗 Connection Flow

```
Frontend (Vercel) 
    ↓ HTTP Request
Next.js API Route (/api/detect-tampering)
    ↓ Forward Request
Backend Service (Railway)
    ↓ Process Image
Image Detection API
    ↓ Return Results
Backend Service
    ↓ Return JSON
Next.js API Route
    ↓ Transform & Return
Frontend
```

## ✅ Testing

1. **Test Backend:**
   ```bash
   curl https://your-service.railway.app/health
   ```

2. **Test Frontend:**
   - Visit your Vercel URL
   - Upload an image
   - Check if it calls your Railway backend

## 📚 Full Guide

See [SETUP_SEPARATE_DEPLOYMENT.md](./SETUP_SEPARATE_DEPLOYMENT.md) for detailed instructions.

