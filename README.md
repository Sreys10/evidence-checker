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

4. **Set up MongoDB Atlas (Recommended):**
   - Follow the detailed guide in [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
   - Or use local MongoDB (see [SETUP_MONGODB.md](./SETUP_MONGODB.md))
   
   **Quick Setup:**
   - Get your MongoDB Atlas connection string from https://cloud.mongodb.com/
   - Format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

5. **Set up environment variables:**
   
   **For Next.js app** - Create `.env.local` in root:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   MONGODB_DB_NAME=evi-check
   NEXT_PUBLIC_API_URL=http://localhost:5000
   BACKEND_SERVICE_URL=http://localhost:5000
   IMAGE_DETECTION_API_USER=your_api_user
   IMAGE_DETECTION_API_SECRET=your_api_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   
   **For Backend service** - Create `.env` in `backend-service/`:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   MONGODB_DB_NAME=evi-check
   PORT=5000
   ```

6. **Start the backend service:**
   ```bash
   cd backend-service
   python app.py
   # Or: python start.py
   ```
   You should see: `✓ Successfully connected to MongoDB: evi-check`

7. **Run the development server (in a new terminal):**
   ```bash
   npm run dev
   ```

8. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Deployment

### Quick Deploy Options

1. **Vercel (Recommended)** - Deploy directly from GitHub
2. **Railway** - Connect your repository and deploy
3. **Docker** - Use the provided Dockerfile

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

For deployment and setup assistance, refer to the installation and deployment sections above.
