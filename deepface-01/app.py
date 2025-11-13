import streamlit as st
import cv2
from deepface import DeepFace
import os
import numpy as np
from PIL import Image
import tempfile

# Page config
st.set_page_config(
    page_title="Face Matcher",
    page_icon="🔍",
    layout="wide"
)

# Title
st.title("🔍 Face Recognition & Matching System")
st.markdown("Upload an image to detect and match faces against your database")

# Sidebar for configuration
with st.sidebar:
    st.header("⚙️ Configuration")
    
    detector = st.selectbox(
        "Face Detector",
        ["retinaface", "opencv", "ssd", "dlib", "mtcnn"],
        index=0,
        help="Choose the face detection backend"
    )
    
    model = st.selectbox(
        "Recognition Model",
        ["ArcFace", "VGG-Face", "Facenet", "OpenFace", "DeepFace", "DeepID"],
        index=0,
        help="Choose the face recognition model"
    )
    
    database_path = st.text_input(
        "Database Path",
        value="database/",
        help="Path to folder containing known faces"
    )
    
    threshold = st.slider(
        "Distance Threshold",
        min_value=0.0,
        max_value=1.0,
        value=0.5,
        step=0.05,
        help="Maximum distance for a match (lower = stricter)"
    )

# Main content
uploaded_file = st.file_uploader(
    "Upload an image with faces",
    type=["jpg", "jpeg", "png"],
    help="Upload an image containing one or more faces to match"
)

if uploaded_file is not None:
    # Display uploaded image
    image = Image.open(uploaded_file)
    st.image(image, caption="Uploaded Image")
    
    # Process button
    if st.button("🔍 Detect & Match Faces", type="primary"):
        with st.spinner("Processing image... This may take a moment."):
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
                image.save(tmp_file.name)
                tmp_path = tmp_file.name
            
            try:
                # Step 1: Extract all faces
                st.info("🔍 Detecting faces in image...")
                faces = DeepFace.extract_faces(
                    img_path=tmp_path,
                    detector_backend=detector,
                    enforce_detection=False
                )
                
                st.success(f"✅ Found {len(faces)} face(s) in the image!")
                
                if len(faces) == 0:
                    st.warning("No faces detected in the image. Please try another image or a different detector.")
                else:
                    # Create columns for displaying faces
                    cols = st.columns(min(len(faces), 3))
                    
                    results = []
                    
                    # Step 2: Process each face
                    for idx, face in enumerate(faces):
                        face_img = face["face"]
                        
                        # Convert to uint8 if needed
                        if face_img.dtype != 'uint8':
                            if face_img.max() <= 1.0:
                                face_img = (face_img * 255).astype('uint8')
                            else:
                                face_img = face_img.astype('uint8')
                        
                        # Convert BGR to RGB for display
                        if len(face_img.shape) == 3 and face_img.shape[2] == 3:
                            face_img_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
                        else:
                            face_img_rgb = face_img
                        
                        # Save face temporarily for matching
                        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as face_tmp:
                            cv2.imwrite(face_tmp.name, cv2.cvtColor(face_img, cv2.COLOR_RGB2BGR))
                            face_path = face_tmp.name
                        
                        # Display face in column
                        col_idx = idx % 3
                        with cols[col_idx]:
                            st.image(face_img_rgb, caption=f"Face {idx+1}")
                        
                        # Step 3: Search in database
                        try:
                            if os.path.exists(database_path) and os.path.isdir(database_path):
                                result = DeepFace.find(
                                    img_path=face_path,
                                    db_path=database_path,
                                    model_name=model,
                                    detector_backend=detector,
                                    enforce_detection=False
                                )
                                
                                match_found = False
                                match_info = None
                                
                                if len(result) > 0 and len(result[0]) > 0:
                                    best = result[0].iloc[0]
                                    if best['distance'] <= threshold:
                                        match_found = True
                                        match_info = {
                                            'identity': best['identity'],
                                            'distance': best['distance']
                                        }
                                
                                results.append({
                                    'face_num': idx + 1,
                                    'match_found': match_found,
                                    'match_info': match_info
                                })
                            else:
                                st.warning(f"⚠️ Database path '{database_path}' does not exist!")
                                results.append({
                                    'face_num': idx + 1,
                                    'match_found': False,
                                    'match_info': None
                                })
                        except Exception as e:
                            st.error(f"Error matching face {idx+1}: {str(e)}")
                            results.append({
                                'face_num': idx + 1,
                                'match_found': False,
                                'match_info': None
                            })
                        
                        # Clean up temp file
                        try:
                            os.unlink(face_path)
                        except:
                            pass
                    
                    # Display results
                    st.markdown("---")
                    st.header("📊 Matching Results")
                    
                    for result in results:
                        with st.container():
                            if result['match_found']:
                                st.success(
                                    f"✅ **Face {result['face_num']}**: Match found! "
                                    f"Identity: `{os.path.basename(result['match_info']['identity'])}` | "
                                    f"Distance: {result['match_info']['distance']:.4f}"
                                )
                            else:
                                st.info(f"❌ **Face {result['face_num']}**: No match found in database")
                    
            except Exception as e:
                st.error(f"❌ Error processing image: {str(e)}")
                st.exception(e)
            finally:
                # Clean up temp file
                try:
                    os.unlink(tmp_path)
                except:
                    pass

else:
    st.info("👆 Please upload an image to get started")

# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: gray;'>
        <p>Face Recognition System powered by DeepFace</p>
    </div>
    """,
    unsafe_allow_html=True
)

