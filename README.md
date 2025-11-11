# Digital Evidence Verification System

A comprehensive digital forensics platform for image authenticity verification and tampering detection.

## Features

- 🔍 **Image Tampering Detection** - Advanced AI-powered analysis
- 📊 **Detailed Forensic Reports** - Professional digital analysis reports
- 🔐 **User Authentication** - Secure login and registration
- 📁 **Evidence Management** - Upload, analyze, and manage digital evidence
- 📄 **Report Generation** - Generate comprehensive HTML reports
- 🔗 **Blockchain Integration** - Immutable evidence storage

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Database:** MongoDB
- **Image Detection:** Python with AI detection APIs
- **Authentication:** bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ and pip
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd application/evi-check
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env.local` file:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB_NAME=evi-check
   IMAGE_DETECTION_API_USER=your_api_user
   IMAGE_DETECTION_API_SECRET=your_api_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Deployment

### Quick Deploy Options

1. **Vercel (Recommended)** - See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
2. **Railway** - See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
3. **Docker** - See [DEPLOYMENT.md](./DEPLOYMENT.md)

### Detailed Deployment Guide

For comprehensive deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Docker Deploy:**
```bash
docker-compose up -d
```

## Project Structure

```
evi-check/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── analyst/           # Analyst dashboard
│   └── ...
├── components/            # React components
├── lib/                   # Utilities and helpers
├── model/                 # Python image detection models
├── public/                # Static assets
└── python-service/        # Optional Python microservice
```

## Environment Variables

Required environment variables:

- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name
- `IMAGE_DETECTION_API_USER` - Image detection API user
- `IMAGE_DETECTION_API_SECRET` - Image detection API secret
- `NEXT_PUBLIC_APP_URL` - Application URL

## Important Notes

### Python Execution

The application uses Python scripts for image detection. In production:

- **Option 1:** Deploy Python service separately (see `python-service/`)
- **Option 2:** Use serverless functions (AWS Lambda, etc.)
- **Option 3:** Use external API directly

### Database Migration

Currently uses `localStorage` for evidence. For production, migrate to:
- MongoDB for evidence storage
- Create API routes for CRUD operations
- Update components to use API instead of localStorage

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

[Your License Here]

## Support

For deployment issues, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Quick deployment options
