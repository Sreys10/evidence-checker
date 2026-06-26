import numpy as np
from typing import List, Dict, Any
from insightface.app import FaceAnalysis

def detect_faces(face_app: FaceAnalysis, img: np.ndarray) -> List[Any]:
    """
    Detect all faces in an image using SCRFD (contained in FaceAnalysis).
    
    Args:
        face_app: The pre-loaded FaceAnalysis singleton.
        img: The image as a numpy BGR array.
        
    Returns:
        A list of Face objects detected in the image.
    """
    # face_app.get runs detection, alignment, and representation extraction.
    # We will get all detected faces.
    faces = face_app.get(img)
    return faces
