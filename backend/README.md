# Evidence.ai Face Recognition Service

A production-ready FastAPI service that implements face detection and biometric matching using InsightFace (SCRFD & ArcFace Buffalo_L) and PostgreSQL with pgvector.

---

## Architecture Overview

```
backend/
├── main.py            # FastAPI initialization & singleton model lifecycle
├── database.py        # SQLAlchemy & pgvector DB engine configuration
├── models.py          # Person and FaceEmbedding DB tables mapping
├── schemas.py         # Pydantic validation and response schemas
├── routes/
│   └── face_routes.py # API Endpoints (/register, /search)
└── services/
    ├── face_detection.py # SCRFD detection wrapper
    ├── face_embedding.py # ArcFace Buffalo_L feature extractor
    └── face_matching.py  # Cosine similarity search using pgvector
```

---

## Setup & Installation

### 1. Prerequisites
Ensure you have Python 3.8+ and C++ build tools installed on your machine (required for compilation of some InsightFace dependencies).

### 2. Install Dependencies
Install all package dependencies via `pip`:
```bash
pip install -r requirements.txt
```

### 3. Database Setup (Neon / Supabase)
The database must be a PostgreSQL instance with the `pgvector` extension installed.
1. Connect to your database.
2. Enable the vector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. The FastAPI service automatically executes this command and creates the tables (`person` and `face_embedding`) on startup. It also creates an optimized HNSW index:
   ```sql
   CREATE INDEX IF NOT EXISTS face_embedding_hnsw_idx 
   ON face_embedding USING hnsw (embedding vector_cosine_ops);
   ```

### 4. InsightFace Model Download
By default, the service uses the **Buffalo_L** model bundle.
- **Automatic**: On first start, the backend will automatically download the models to `~/.insightface/models/` from the official repository.
- **Manual**: If offline, download the `buffalo_l.zip` archive and extract its contents (`det_10g.onnx`, `w600k_r50.onnx`, etc.) into `C:\Users\<Username>\.insightface\models\buffalo_l\` (Windows) or `~/.insightface/models/buffalo_l/` (Linux).

---

## Environment Variables

Create a `.env` file in the `backend/` directory or export variables:

```ini
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres

# API port for FastAPI
PORT=8000
```

---

## Running Locally

To start the FastAPI service on port 8000:

```bash
python main.py
```
Or run using uvicorn directly:
```bash
uvicorn main:app --port 8000 --reload
```

---

## API Endpoints

### 1. Register Person
* **Endpoint**: `POST /api/faces/register`
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `full_name` (string, required): Full name of the subject.
  * `gender` (string, optional): Male / Female / Other.
  * `age` (integer, optional): Subject age.
  * `case_number` (string, optional): Associated Case File ID.
  * `notes` (string, optional): Background info/notes.
  * `images` (List of files, required): Portrait photographs.
* **Response**:
  ```json
  {
    "success": true,
    "person_id": "8a3e7db0-4e56-4c4f-b6ef-9a5c5ee7fb1c",
    "embeddings_created": 3
  }
  ```

### 2. Search & Match Faces
* **Endpoint**: `POST /api/faces/search`
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `image` (file, required): Image containing one or more faces.
  * `threshold` (float, optional, default: 0.60): Cosine similarity threshold (0.0 to 1.0).
* **Response**:
  ```json
  [
    {
      "face_index": 0,
      "bounding_box": [120, 45, 230, 210],
      "matched": true,
      "confidence": 92.45,
      "person": {
        "id": "8a3e7db0-4e56-4c4f-b6ef-9a5c5ee7fb1c",
        "full_name": "Jane Doe",
        "case_number": "CASE-2026-001",
        "gender": "Female",
        "age": 28,
        "notes": "Key witness",
        "created_at": "2026-06-26T14:10:00Z",
        "registered_images": [
          "/static/faces/8a3e7db0-4e56-4c4f-b6ef-9a5c5ee7fb1c_ref1.jpg"
        ]
      }
    },
    {
      "face_index": 1,
      "bounding_box": [340, 90, 450, 240],
      "matched": false
    }
  ]
  ```

---

## Testing

To run the automated endpoint validation tests:
```bash
python tests/test_api.py
```
