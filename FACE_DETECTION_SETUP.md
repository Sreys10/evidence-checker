# Face Detection Feature - Setup & Running Guide

This guide explains how to run the face detection and matching feature that has been integrated into the analyst segment.

## Prerequisites

- **Node.js 18+** and npm
- **Python 3.11+** and pip
- **MongoDB** (for the main application)

## Step 1: Install Backend Dependencies

Navigate to the `backend-service` directory and install Python dependencies:

```bash
cd backend-service
pip install -r requirements.txt
```

**Note:** Installing DeepFace and TensorFlow may take several minutes as they are large packages.

## Step 2: Install Frontend Dependencies

In the root directory, install Node.js dependencies (if not already done):

```bash
npm install
```

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the root directory (if it doesn't exist):

```bash
# Backend Service URL
BACKEND_SERVICE_URL=http://localhost:5000

# MongoDB (if needed)
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=evi-check

# Other environment variables...
```

## Step 4: Run the Backend Service

### Option A: Using Python directly (Development)

```bash
cd backend-service
python app.py
```

The backend service will start on `http://localhost:5000`

### Option B: Using Gunicorn (Production-like)

```bash
cd backend-service
gunicorn app:app --bind 0.0.0.0:5000 --workers 2 --timeout 120
```

### Option C: Using the start script

```bash
cd backend-service
bash start.sh
```

**Verify the backend is running:**
- Open `http://localhost:5000/health` in your browser
- You should see a JSON response with status information

## Step 5: Run the Frontend (Next.js)

In a **new terminal**, navigate to the root directory and run:

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## Step 6: Access the Face Detection Feature

1. **Open your browser** and go to `http://localhost:3000`
2. **Login** as an analyst user
3. **Navigate to the Analyst Dashboard**
4. **Click on the "Face Detection" tab** (with the camera icon)
5. **Upload an image** containing faces
6. **Click "Detect & Match Faces"**

## Testing the Feature

### Test with the Database Images

The database folder (`backend-service/database/`) contains sample images:
- `hrishikesh.png`
- `niranjan_photo.jpg`
- `snehal.jpg`
- `swanandd.jpg`

You can test by uploading an image that contains one of these people.

### Configuration Options

In the Face Detection tab, you can adjust:
- **Face Detector**: RetinaFace (recommended), OpenCV, SSD, Dlib, MTCNN
- **Recognition Model**: ArcFace (recommended), VGG-Face, Facenet, etc.
- **Distance Threshold**: Lower values = stricter matching (default: 0.5)

## Troubleshooting

### Backend Service Issues

1. **Port already in use:**
   ```bash
   # Change the port in app.py or set PORT environment variable
   PORT=5001 python app.py
   ```

2. **DeepFace installation issues:**
   ```bash
   # Try installing dependencies one by one
   pip install deepface
   pip install opencv-python
   pip install tensorflow
   ```

3. **Import errors:**
   - Make sure you're in the `backend-service` directory
   - Verify all dependencies are installed: `pip list | grep deepface`

### Frontend Issues

1. **Cannot connect to backend:**
   - Check that `BACKEND_SERVICE_URL` in `.env.local` matches your backend URL
   - Verify the backend service is running on the correct port
   - Check browser console for CORS errors

2. **API errors:**
   - Open browser DevTools (F12) → Network tab
   - Check the API request/response details
   - Verify the backend service health endpoint

### Database Path Issues

If you get "Database path does not exist" errors:
- Verify `backend-service/database/` folder exists
- Check that it contains image files
- The database path is set to `database/` by default (relative to backend-service directory)

## Running Both Services Together

### Windows (PowerShell)

Terminal 1 (Backend):
```powershell
cd backend-service
python app.py
```

Terminal 2 (Frontend):
```powershell
npm run dev
```

### Linux/Mac

Terminal 1 (Backend):
```bash
cd backend-service && python app.py
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## Production Deployment (Railway)

The backend service is already configured for Railway deployment:

1. **Push your code to GitHub**
2. **Connect Railway to your repository**
3. **Set environment variables in Railway:**
   - `PORT` (automatically set by Railway)
   - `BACKEND_SERVICE_URL` (your Railway backend URL)
4. **Deploy** - Railway will automatically build using the Dockerfile

The Dockerfile includes:
- All Python dependencies
- System libraries for OpenCV
- Database folder with face images
- Proper startup configuration

## API Endpoints

The backend service provides these endpoints:

- `GET /health` - Health check
- `POST /face/detect` - Detect faces in image
- `POST /face/search` - Search faces in database
- `POST /face/detect-and-search` - Combined detection and matching
- `POST /detect` - Image tampering detection (existing)

## Next Steps

- Add more images to `backend-service/database/` to expand the face database
- Adjust detection and matching parameters for better accuracy
- Integrate face detection results into evidence records

