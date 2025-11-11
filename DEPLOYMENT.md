# Deployment Guide

This guide covers deploying the Digital Evidence Verification System to production.

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+ with pip
- MongoDB database (local or cloud)
- Image Detection API credentials

## Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env.local` file (or `.env` for production) with the following variables:

```bash
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=evi-check
IMAGE_DETECTION_API_USER=your_api_user
IMAGE_DETECTION_API_SECRET=your_api_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 2. Python Dependencies

Install Python dependencies:

```bash
cd evi-check/model
pip install -r ../../requirements.txt
```

Or create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Build the Application

```bash
cd evi-check
npm install
npm run build
```

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

Vercel is the easiest option for Next.js applications.

#### Steps:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd evi-check
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Add all environment variables from `.env.example`
   - **Important:** For Python execution, you may need to use Vercel's serverless functions or a separate service

5. **Configure Python Execution:**
   - Vercel doesn't natively support Python in serverless functions
   - Consider using an external API service or AWS Lambda for Python execution
   - Alternative: Use a separate Python microservice

#### Vercel Configuration File

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Option 2: AWS (EC2 + ECS/Lambda)

#### Using EC2:

1. **Launch EC2 Instance:**
   - Choose Ubuntu 22.04 LTS
   - Minimum: t3.medium (2 vCPU, 4GB RAM)
   - Configure security groups (ports 3000, 22)

2. **Install Dependencies:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install Python
   sudo apt install python3 python3-pip -y

   # Install PM2 for process management
   sudo npm install -g pm2

   # Install MongoDB (or use MongoDB Atlas)
   # Follow MongoDB installation guide
   ```

3. **Deploy Application:**
   ```bash
   # Clone your repository
   git clone <your-repo-url>
   cd application/evi-check

   # Install dependencies
   npm install
   pip3 install -r requirements.txt

   # Build application
   npm run build

   # Start with PM2
   pm2 start npm --name "evi-check" -- start
   pm2 save
   pm2 startup
   ```

4. **Setup Nginx Reverse Proxy:**
   ```bash
   sudo apt install nginx -y
   
   # Create Nginx config
   sudo nano /etc/nginx/sites-available/evi-check
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/evi-check /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

#### Using AWS Lambda for Python:

For Python image detection, create a Lambda function:

1. **Create Lambda Function:**
   - Runtime: Python 3.11
   - Upload `model/image_detector.py` and dependencies
   - Create API Gateway endpoint

2. **Update API Route:**
   - Modify `app/api/detect-tampering/route.ts` to call Lambda instead of local Python

### Option 3: Docker Deployment

#### Create Dockerfile:

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Create docker-compose.yml:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - MONGODB_DB_NAME=${MONGODB_DB_NAME}
      - IMAGE_DETECTION_API_USER=${IMAGE_DETECTION_API_USER}
      - IMAGE_DETECTION_API_SECRET=${IMAGE_DETECTION_API_SECRET}
      - NODE_ENV=production
    volumes:
      - ./model:/app/model
    depends_on:
      - mongodb

  python-service:
    build:
      context: .
      dockerfile: Dockerfile.python
    environment:
      - IMAGE_DETECTION_API_USER=${IMAGE_DETECTION_API_USER}
      - IMAGE_DETECTION_API_SECRET=${IMAGE_DETECTION_API_SECRET}
    volumes:
      - ./model:/app/model

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=evi-check

volumes:
  mongodb_data:
```

#### Deploy with Docker:

```bash
docker-compose up -d
```

### Option 4: Railway

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize:**
   ```bash
   cd evi-check
   railway init
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Set Environment Variables:**
   ```bash
   railway variables set MONGODB_URI=your_uri
   railway variables set IMAGE_DETECTION_API_USER=your_user
   # ... etc
   ```

## Important Considerations

### 1. Python Execution in Production

Since most hosting platforms don't support direct Python execution in Next.js API routes, consider:

**Option A: Separate Python Microservice**
- Deploy Python service separately (Flask/FastAPI)
- Call it from Next.js API routes via HTTP

**Option B: Serverless Functions**
- Use AWS Lambda, Google Cloud Functions, or Azure Functions
- Create API endpoint for image detection

**Option C: External API**
- Use the image detection API directly from frontend
- Or create a proxy API route

### 2. Database Migration

Currently using `localStorage` for evidence storage. For production:

1. **Create Evidence API Routes:**
   - `/api/evidence` - CRUD operations
   - Store evidence in MongoDB instead of localStorage

2. **Update Components:**
   - Replace `localStorage` calls with API calls
   - Implement proper error handling

### 3. File Storage

For uploaded images:
- Use cloud storage (AWS S3, Cloudinary, etc.)
- Don't store files on server filesystem
- Generate signed URLs for access

### 4. Security

- Use HTTPS everywhere
- Implement rate limiting
- Add authentication middleware
- Sanitize file uploads
- Validate API credentials
- Use environment variables (never commit secrets)

### 5. Monitoring

- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Track database performance
- Set up uptime monitoring

## Post-Deployment

1. **Test all features:**
   - User authentication
   - Image upload
   - Tampering detection
   - Report generation

2. **Monitor logs:**
   ```bash
   # If using PM2
   pm2 logs evi-check
   
   # If using Docker
   docker-compose logs -f
   ```

3. **Set up backups:**
   - MongoDB backups
   - Environment variable backups
   - Code repository

4. **Performance optimization:**
   - Enable Next.js caching
   - Optimize images
   - Use CDN for static assets

## Troubleshooting

### Python not found error:
- Ensure Python 3.8+ is installed
- Check PATH environment variable
- Use full path to Python in API route

### MongoDB connection error:
- Verify connection string
- Check firewall rules
- Ensure MongoDB is running

### Build errors:
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

## Support

For issues, check:
- Next.js documentation
- MongoDB Atlas documentation
- Your hosting provider's documentation

