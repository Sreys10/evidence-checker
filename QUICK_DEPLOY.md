# Quick Deployment Guide

## 🚀 Fastest Deployment Options

### Option 1: Vercel (Recommended - 5 minutes)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `evi-check`
   - Add environment variables:
     - `MONGODB_URI`
     - `MONGODB_DB_NAME`
     - `IMAGE_DETECTION_API_USER`
     - `IMAGE_DETECTION_API_SECRET`
     - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
   - Click "Deploy"

3. **Note:** Python execution may need a separate service (see below)

### Option 2: Railway (10 minutes)

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
   cd evi-check
   railway login
   railway init
   railway up
   ```

3. **Add Environment Variables:**
   ```bash
   railway variables set MONGODB_URI=your_mongodb_uri
   railway variables set IMAGE_DETECTION_API_USER=your_user
   railway variables set IMAGE_DETECTION_API_SECRET=your_secret
   ```

### Option 3: Docker (Local/Server - 15 minutes)

1. **Build and Run:**
   ```bash
   cd evi-check
   docker-compose up -d
   ```

2. **Access at:** `http://localhost:3000`

3. **For Production Server:**
   - Copy files to server
   - Set environment variables in `.env` file
   - Run `docker-compose up -d`

## ⚠️ Important: Python Execution

Since most platforms don't support Python in Next.js API routes, you have two options:

### Solution A: Use External API (Easiest)

Modify `app/api/detect-tampering/route.ts` to call an external API instead of executing Python locally.

### Solution B: Separate Python Service

1. **Create Python Flask/FastAPI service:**
   ```python
   # python-service/app.py
   from flask import Flask, request, jsonify
   from image_detector import ImageDetector
   
   app = Flask(__name__)
   
   @app.route('/detect', methods=['POST'])
   def detect():
       # Handle image detection
       pass
   ```

2. **Deploy Python service separately:**
   - Railway, Render, or AWS Lambda
   - Update Next.js API route to call this service

## 📋 Pre-Deployment Checklist

- [ ] Set up MongoDB (MongoDB Atlas recommended)
- [ ] Get Image Detection API credentials
- [ ] Create `.env` file with all variables
- [ ] Test build locally: `npm run build`
- [ ] Test Python script: `python model/image_detector.py`
- [ ] Push code to Git repository

## 🔧 Environment Variables Needed

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB_NAME=evi-check
IMAGE_DETECTION_API_USER=your_api_user
IMAGE_DETECTION_API_SECRET=your_api_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## 📝 Next Steps After Deployment

1. Test user registration/login
2. Test image upload
3. Test tampering detection
4. Test report generation
5. Set up monitoring (optional)
6. Configure custom domain (optional)

## 🆘 Troubleshooting

**Build fails?**
- Check Node.js version (18+)
- Clear `.next` folder
- Run `npm install` again

**Python not found?**
- Install Python 3.8+ on server
- Or use external Python service

**MongoDB connection error?**
- Check connection string
- Verify network access
- Check firewall rules

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

