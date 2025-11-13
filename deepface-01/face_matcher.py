import cv2
from deepface import DeepFace
import os

# -------------------------------
# CONFIG
# -------------------------------
INPUT_IMAGE = "v4.jpg"          # image containing multiple faces
DATABASE_PATH = "database/"        # folder containing known faces
FACES_OUTPUT_DIR = "extracted_faces/"  # folder to save cropped faces
DETECTOR = "retinaface"            # best detector
MODEL = "ArcFace"                  # best recognition model
# -------------------------------


# Create folder to save cropped faces
os.makedirs(FACES_OUTPUT_DIR, exist_ok=True)


print("\n🔍 Detecting faces in input image...\n")

# Step 1: Extract all faces
faces = DeepFace.extract_faces(
    img_path=INPUT_IMAGE,
    detector_backend=DETECTOR,
    enforce_detection=False
)

print(f"Total faces detected: {len(faces)}\n")


# Step 2: Loop over each face and run comparison
for idx, face in enumerate(faces):
    face_img = face["face"]
    
    # Convert to uint8 if needed (DeepFace may return float64)
    if face_img.dtype != 'uint8':
        # If values are normalized (0-1), scale to 0-255
        if face_img.max() <= 1.0:
            face_img = (face_img * 255).astype('uint8')
        else:
            face_img = face_img.astype('uint8')
    
    # Save cropped face
    face_path = os.path.join(FACES_OUTPUT_DIR, f"face_{idx+1}.jpg")
    cv2.imwrite(face_path, cv2.cvtColor(face_img, cv2.COLOR_RGB2BGR))

    print(f"🟦 Processing Face {idx+1}: {face_path}")

    # Step 3: Search this face in the database
    result = DeepFace.find(
        img_path=face_path,
        db_path=DATABASE_PATH,
        model_name=MODEL,
        detector_backend=DETECTOR,
        enforce_detection=False
    )

    if len(result) > 0 and len(result[0]) > 0:
        # Best match is the first row
        best = result[0].iloc[0]
        print(f"✔ Match found: {best['identity']}")
        print(f"📊 Distance: {best['distance']:.4f}\n")
    else:
        print("❌ No match found in database.\n")


print("\n✅ DONE — All faces processed.")
