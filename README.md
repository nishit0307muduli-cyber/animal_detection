# 🚂 Railway Animal Detection System

> **⚠️ RESEARCH PROTOTYPE** — This system is NOT a certified railway safety or collision-prevention system. Do not use for real safety-critical decisions.

An AI-powered animal detection system for railway track safety monitoring. Uploads images or videos of railway tracks, detects animals using YOLOv8, draws bounding boxes, and triggers danger-zone alerts.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🖼️ **Image Detection** | Drag-and-drop image upload with instant YOLOv8 animal detection |
| 🎬 **Video Analysis** | Frame-by-frame video processing with progress bar and annotated output |
| 🚨 **Danger Zone Alerts** | Configurable polygon danger zone with visual alerts |
| 📊 **Detection Dashboard** | Stats, timeline, history, confidence threshold slider |
| 🔧 **Configurable** | Confidence threshold, bounding boxes, labels, sample rate |

## 🐾 Detectable Animals (COCO classes)

Dog · Cat · Bird · Horse · Sheep · Cow · Elephant · Bear · Zebra · Giraffe

---

## 📁 Project Structure

```
Animal/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── routes/
│   │   │   ├── detect.py        # /api/detect/image and /api/detect/video
│   │   │   └── jobs.py          # /api/jobs, /api/results, /api/download
│   │   ├── services/
│   │   │   ├── detection_service.py  # YOLOv8 inference singleton
│   │   │   └── video_service.py      # Background video processing jobs
│   │   ├── schemas/
│   │   │   └── detection.py     # Pydantic response schemas
│   │   └── utils/
│   │       ├── file_utils.py    # File validation, safe filenames
│   │       └── zone_utils.py    # Danger zone polygon overlap
│   ├── tests/
│   │   └── test_api.py          # Pytest test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/useDetection.js
│   │   ├── services/api.js      # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 🔧 Prerequisites

- **Python 3.10+** (tested on 3.11, 3.12, 3.13)
- **Node.js 18+** and **npm**
- Internet connection (for downloading YOLOv8 model weights on first run, ~6 MB)
- GPU optional (CPU inference supported)

---

## 🚀 Setup and Running (Windows PowerShell)

### 1. Clone / navigate to the project

```powershell
cd D:\Animal
```

### 2. Backend setup

```powershell
# Create a virtual environment (recommended)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r backend\requirements.txt
```

> **Note:** YOLOv8 weights (`yolov8n.pt`, ~6 MB) download automatically from Ultralytics on the first backend start.

### 3. Frontend setup

```powershell
cd frontend
npm install
cd ..
```

---

## ▶️ Running the Application

Open **two separate PowerShell terminals**:

**Terminal 1 — Backend:**

```powershell
cd D:\Animal
.\.venv\Scripts\Activate.ps1
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**

```powershell
cd D:\Animal\frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend and model status |
| POST | `/api/detect/image` | Run YOLOv8 on an uploaded image |
| POST | `/api/detect/video` | Submit a video for background processing |
| GET | `/api/jobs/{job_id}` | Poll video processing progress |
| GET | `/api/results/{job_id}` | Get completed video results |
| GET | `/api/download/{job_id}` | Download the annotated output video |

**Interactive docs:** http://localhost:8000/docs

---

## 🧪 Running Tests

```powershell
cd D:\Animal
.\.venv\Scripts\Activate.ps1
cd backend
python -m pytest tests/ -v
```

---

## ⚙️ Configuration

| Parameter | Default | Description |
|---|---|---|
| Confidence threshold | 0.40 (40%) | Adjustable 5–95% via UI slider |
| Video sample rate | Every 1 frame | Adjustable 1–10 via UI slider |
| Max image size | 20 MB | Configurable in `backend/app/utils/file_utils.py` |
| Max video size | 500 MB | Configurable in `backend/app/utils/file_utils.py` |
| Danger zone | Central horizontal strip (35%–65%) | Draw custom polygon on the image |

---

## 🧠 Model

- **Default:** `yolov8n.pt` (nano, ~6 MB) — fast, CPU-friendly
- **Better accuracy:** Change the model path in `backend/app/services/detection_service.py`

```python
# In DetectionService.__init__ / lifespan:
DetectionService(model_path="yolov8s.pt")   # small
DetectionService(model_path="yolov8m.pt")   # medium
DetectionService(model_path="custom.pt")    # custom-trained model
```

### Custom Model (for more animal classes)

To detect deer, monkeys, wild boars, etc.:

1. Train a custom YOLOv8 model on your dataset.
2. Place the `.pt` file in the `backend/` directory.
3. Update `model_path` in `detection_service.py`.
4. Add your new class IDs to `ANIMAL_CLASSES` in `detection_service.py`.

---

## 🔍 Danger Zone Configuration

The danger zone is a configurable polygon overlay on the image:

- **Default:** Horizontal strip from 35%–65% of image height (center band).
- **Custom:** After uploading an image, click "Draw Zone" in the left panel, click to add polygon vertices, then "Confirm".
- **No zone:** Click "No Zone" to disable danger-zone alerting.

For video: the zone configured before upload is applied to all frames.

---

## 🛠️ Troubleshooting

**Backend doesn't start:**
```powershell
# Ensure you activated the virtual environment
.\.venv\Scripts\Activate.ps1
# Verify installation
pip list | Select-String "ultralytics"
```

**Model download fails:**
```powershell
# Manually download from Ultralytics
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

**Frontend can't connect to backend:**
- Ensure the backend is running on port 8000.
- Check the Vite proxy in `frontend/vite.config.js` — it proxies `/api` and `/outputs` to `http://localhost:8000`.

**OpenCV error on Windows:**
```powershell
pip install opencv-python-headless --force-reinstall
```

**Test failures:**
```powershell
python -m pytest tests/ -v --tb=short
```

---

## ⚠️ Limitations

- Pretrained COCO model detects 10 animal classes (see list above). It cannot detect deer, monkeys, or other non-COCO animals without custom training.
- Detection accuracy depends on image quality, animal size, and occlusion.
- Video processing is CPU-bound without a GPU; large videos may be slow.
- This is a **research prototype** — not suitable for production railway safety use.
- False positives and missed detections will occur. Always verify alerts manually.

---

## 📝 License

Research prototype — for educational and demonstration purposes only.

## 📤 Pushing to GitHub

This project is version‑controlled with Git. Follow the steps below to push it to a new or existing GitHub repository.

**If the repository does not exist yet**

```bash
# 1️⃣ Initialize a new Git repository
git init

# 2️⃣ Stage all files
git add .

# 3️⃣ Make the first commit
git commit -m "Initial commit"

# 4️⃣ Rename the default branch to main (optional but recommended)
git branch -M main

# 5️⃣ Add the remote URL (replace <username> and <repo> with your own)
git remote add origin https://github.com/<username>/<repo>.git

# 6️⃣ Push the local main branch to GitHub
git push -u origin main
```

**If the repository already exists on GitHub**

```bash
# Add the remote (once)
git remote add origin https://github.com/<username>/<repo>.git

# Push your current branch
git push -u origin main
```

*Make sure you have SSH keys or saved credentials configured so the push succeeds.*

Replace `<username>` with your GitHub username (or organization) and `animal` with the repository name.

If the repository already exists, you can simply add the remote and push:

```bash
git remote add origin https://github.com/<username>/animal.git
git push -u origin main
```

Make sure you have set up your SSH keys or cached your credentials for a smooth push.
