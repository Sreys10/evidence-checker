import os
import requests
import json

# Configuration
BACKEND_URL = "http://localhost:8000"
TEST_NAME = "Test Person"
TEST_CASE = "CASE-999"
TEST_NOTES = "Automated test notes"

def run_tests():
    print("=== STARTING FACE RECOGNITION API TESTS ===")
    
    # 1. Health check
    print("\n1. Testing /health...")
    try:
        res = requests.get(f"{BACKEND_URL}/health")
        print(f"Status: {res.status_code}")
        print(f"Response: {json.dumps(res.json(), indent=2)}")
    except Exception as e:
        print(f"Health check failed (make sure backend is running on {BACKEND_URL}): {str(e)}")
        return

    # Check if we have sample images for testing
    # If not, we will print guidance.
    print("\n2. Testing /api/faces/register...")
    # Check if test files exist. If not, create dummy files.
    dummy_file1 = "test_face_1.jpg"
    dummy_file2 = "test_face_2.jpg"
    
    # Create tiny dummy images (10x10 white jpeg) using PIL if they don't exist
    for filename in [dummy_file1, dummy_file2]:
        if not os.path.exists(filename):
            from PIL import Image
            img = Image.new('RGB', (200, 200), color = 'white')
            img.save(filename)
            print(f"Created dummy image: {filename}")

    try:
        files = [
            ('images', (dummy_file1, open(dummy_file1, 'rb'), 'image/jpeg')),
            ('images', (dummy_file2, open(dummy_file2, 'rb'), 'image/jpeg'))
        ]
        
        data = {
            'full_name': TEST_NAME,
            'gender': "Male",
            'age': "30",
            'case_number': TEST_CASE,
            'notes': TEST_NOTES
        }
        
        # Registration (will trigger InsightFace face detection)
        # Note: If dummy images contain no faces, this will return 400 Bad Request: "No face found".
        # This is expected and verifies the detector throws proper errors.
        res = requests.post(f"{BACKEND_URL}/api/faces/register", data=data, files=files)
        print(f"Status: {res.status_code}")
        print(f"Response: {json.dumps(res.json(), indent=2)}")
        
        if res.status_code == 400 and "No face found" in res.json().get("detail", ""):
            print("✓ Detected expected rejection error (No face found in dummy white image).")
        elif res.status_code == 201:
            print("✓ Registration succeeded (valid face was found).")
        else:
            print(f"Rejection/Error Details: {res.text}")
            
    except Exception as e:
        print(f"Registration request failed: {str(e)}")

    print("\n3. Testing /api/faces/search...")
    try:
        files = {
            'image': (dummy_file1, open(dummy_file1, 'rb'), 'image/jpeg')
        }
        data = {
            'threshold': '0.60'
        }
        res = requests.post(f"{BACKEND_URL}/api/faces/search", data=data, files=files)
        print(f"Status: {res.status_code}")
        print(f"Response: {json.dumps(res.json(), indent=2)}")
        
        if res.status_code == 200:
            print("✓ Search request returned successfully.")
            
    except Exception as e:
        print(f"Search request failed: {str(e)}")

    # Clean up dummy images
    for filename in [dummy_file1, dummy_file2]:
        if os.path.exists(filename):
            try:
                os.remove(filename)
            except:
                pass
                
    print("\n=== API TESTS COMPLETED ===")

if __name__ == "__main__":
    run_tests()
