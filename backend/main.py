import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.face_routes import router as face_router
from database import init_db

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("face_recognition")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing Face Recognition Backend...")
    
    # 1. Initialize PostgreSQL Database & pgvector Tables
    init_db()
    
    # 2. Initialize InsightFace buffalo_l model once
    try:
        import onnxruntime
        from insightface.app import FaceAnalysis
        
        # Check GPU availability
        available_providers = onnxruntime.get_available_providers()
        logger.info(f"Available ONNXRuntime providers: {available_providers}")
        
        if "CUDAExecutionProvider" in available_providers:
            ctx_id = 0
            logger.info("✓ CUDA GPU detected! InsightFace will run on GPU.")
        else:
            ctx_id = -1
            logger.info("CUDA GPU not detected. InsightFace will run on CPU.")
            
        # Initialize FaceAnalysis with the buffalo_l model bundle
        # buffalo_l includes SCRFD for face detection & ArcFace for embeddings
        face_app = FaceAnalysis(name="buffalo_l", root="~/.insightface")
        # prepare models: det_size governs SCRFD detection bounding size
        face_app.prepare(ctx_id=ctx_id, det_size=(640, 640))
        
        # Store in app state to be accessed as a singleton in routes
        app.state.face_analysis = face_app
        logger.info("✓ InsightFace model successfully loaded in memory.")
        
    except Exception as e:
        logger.critical(f"✗ Failed to load InsightFace model: {str(e)}")
        logger.critical("Check if insightface and onnxruntime are installed correctly.")
        # We don't crash the server immediately so that /health can still run and report issues
        app.state.face_analysis = None
        
    yield
    
    # Shutdown actions
    logger.info("Shutting down Face Recognition Backend...")

# Create FastAPI app
app = FastAPI(
    title="Evidence.ai Face Recognition Service",
    description="Production-ready FastAPI service for face detection and pgvector-based matching.",
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Mount the storage directory statically so uploaded face images are viewable
os.makedirs("storage", exist_ok=True)
app.mount("/static", StaticFiles(directory="storage"), name="static")

# Include routes
app.include_router(face_router)

@app.get("/health")
def health_check():
    """Health check endpoint to verify backend status and model status."""
    model_loaded = False
    if hasattr(app.state, "face_analysis") and app.state.face_analysis is not None:
        model_loaded = True
        
    return {
        "status": "healthy" if model_loaded else "degraded",
        "service": "face_recognition",
        "model_loaded": model_loaded,
        "onnx_providers": getattr(sys.modules.get("onnxruntime"), "get_available_providers", lambda: [])()
    }

if __name__ == "__main__":
    import uvicorn
    # Allow port to be configurable via PORT environment variable, defaults to 8000
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting server on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
