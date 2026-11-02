import asyncio
import base64
import io
import json
import time
import uuid
import os
from collections import defaultdict, deque
from datetime import datetime
from pathlib import Path
from typing import Optional

import aiofiles
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from ultralytics import YOLO

# ─────────────────────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="Animal Detection - Railway Tracks", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static frontend
FRONTEND_DIR = Path(__file__).parent / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ─────────────────────────────────────────────────────────────
# YOLO Model
# ─────────────────────────────────────────────────────────────
print("Loading YOLOv8 model...")
model = YOLO("yolov8n.pt")  # nano – downloads automatically on first run
print("Model loaded successfully!")

# COCO animal class IDs  (0-indexed)
ANIMAL_CLASSES = {
    14: "bird", 15: "cat", 16: "dog", 17: "horse", 18: "sheep",
    19: "cow", 20: "elephant", 21: "bear", 22: "zebra", 23: "giraffe",
}

# ─────────────────────────────────────────────────────────────
# In-memory detection history & stats
# ─────────────────────────────────────────────────────────────
detection_history: deque = deque(maxlen=200)
detection_stats: dict = defaultdict(int)
total_detections: int = 0
session_start: float = time.time()

# Connected WebSocket clients
ws_clients: list[WebSocket] = []


# ─────────────────────────────────────────────────────────────
# Helper: run YOLO on a PIL Image, return annotated image + results
# ─────────────────────────────────────────────────────────────
def detect_animals(pil_img: Image.Image, conf: float = 0.35):
    """Run YOLOv8 detection and return (annotated_img, detections_list)."""
    global total_detections

    img_np = np.array(pil_img)
    results = model(img_np, conf=conf, verbose=False)[0]

    detections = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        if cls_id not in ANIMAL_CLASSES:
            continue
        label = ANIMAL_CLASSES[cls_id]
        conf_val = float(box.conf[0])
        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
        detections.append({
            "id": str(uuid.uuid4())[:8],
            "label": label,
            "confidence": round(conf_val * 100, 1),
            "bbox": [x1, y1, x2, y2],
            "timestamp": datetime.now().isoformat(),
        })
        detection_stats[label] += 1
        total_detections += 1

    # Draw bounding boxes
    annotated = img_np.copy()
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        label = det["label"]
        conf_pct = det["confidence"]

        # Alert colour (red) with thick box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 50, 255), 3)

        # Label background
        tag = f"{label.upper()}  {conf_pct}%"
        (tw, th), _ = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.65, 2)
        cv2.rectangle(annotated, (x1, y1 - th - 10), (x1 + tw + 8, y1), (0, 50, 255), -1)
        cv2.putText(annotated, tag, (x1 + 4, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)

    return Image.fromarray(annotated), detections


def pil_to_b64(img: Image.Image, fmt: str = "JPEG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt, quality=85)
    return base64.b64encode(buf.getvalue()).decode()


async def broadcast(message: dict):
    """Broadcast a JSON message to all connected WebSocket clients."""
    if not ws_clients:
        return
    data = json.dumps(message)
    dead = []
    for ws in ws_clients:
        try:
            await ws.send_text(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_clients.remove(ws)


# ─────────────────────────────────────────────────────────────
# REST Endpoints
# ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    from fastapi.responses import FileResponse
    return FileResponse(str(FRONTEND_DIR / "index.html"))


@app.post("/api/detect/image")
async def detect_image(file: UploadFile = File(...), conf: float = 0.35):
    """Upload an image, run detection, return annotated image + results."""
    contents = await file.read()
    pil_img = Image.open(io.BytesIO(contents)).convert("RGB")

    annotated, detections = detect_animals(pil_img, conf)

    # Add to history
    for det in detections:
        detection_history.appendleft({**det, "source": "image", "filename": file.filename})

    # Broadcast alert to dashboard clients
    if detections:
        await broadcast({
            "type": "alert",
            "detections": detections,
            "source": "image",
            "filename": file.filename,
        })

    return JSONResponse({
        "success": True,
        "filename": file.filename,
        "detections": detections,
        "count": len(detections),
        "annotated_image": pil_to_b64(annotated),
    })


@app.post("/api/detect/video")
async def detect_video(file: UploadFile = File(...), conf: float = 0.35, sample_rate: int = 5):
    """
    Upload a video, sample every `sample_rate` frames, run detection.
    Returns per-frame results and a summary.
    """
    contents = await file.read()
    tmp_path = UPLOAD_DIR / f"{uuid.uuid4()}.mp4"
    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(contents)

    cap = cv2.VideoCapture(str(tmp_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_results = []
    frame_idx = 0
    animal_frames = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % sample_rate == 0:
            pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            _, detections = detect_animals(pil_img, conf)
            if detections:
                animal_frames += 1
                ts = frame_idx / fps
                frame_results.append({
                    "frame": frame_idx,
                    "timestamp_sec": round(ts, 2),
                    "detections": detections,
                })
                for det in detections:
                    detection_history.appendleft({**det, "source": "video",
                                                  "filename": file.filename,
                                                  "frame": frame_idx})
        frame_idx += 1

    cap.release()
    tmp_path.unlink(missing_ok=True)

    if frame_results:
        await broadcast({
            "type": "video_complete",
            "filename": file.filename,
            "animal_frames": animal_frames,
            "results": frame_results[:10],  # first 10 only for broadcast
        })

    return JSONResponse({
        "success": True,
        "filename": file.filename,
        "total_frames": total_frames,
        "sampled_frames": frame_idx // sample_rate,
        "animal_frames": animal_frames,
        "frame_results": frame_results,
    })


@app.get("/api/stats")
async def get_stats():
    uptime = int(time.time() - session_start)
    return {
        "total_detections": total_detections,
        "detections_by_animal": dict(detection_stats),
        "uptime_seconds": uptime,
        "history_count": len(detection_history),
    }


@app.get("/api/history")
async def get_history(limit: int = 50):
    return {"history": list(detection_history)[:limit]}


@app.delete("/api/history")
async def clear_history():
    global total_detections
    detection_history.clear()
    detection_stats.clear()
    total_detections = 0
    await broadcast({"type": "stats_reset"})
    return {"success": True}


# ─────────────────────────────────────────────────────────────
# WebSocket – live webcam / stream processing
# ─────────────────────────────────────────────────────────────
@app.websocket("/ws/stream")
async def websocket_stream(ws: WebSocket):
    """
    Client sends raw JPEG frames as binary messages.
    Server replies with JSON {detections, annotated_image}.
    """
    await ws.accept()
    ws_clients.append(ws)
    print(f"WebSocket client connected. Total: {len(ws_clients)}")
    try:
        while True:
            data = await ws.receive_bytes()
            pil_img = Image.open(io.BytesIO(data)).convert("RGB")
            annotated, detections = detect_animals(pil_img)

            for det in detections:
                detection_history.appendleft({**det, "source": "webcam"})

            await ws.send_text(json.dumps({
                "type": "frame_result",
                "detections": detections,
                "annotated_image": pil_to_b64(annotated, "JPEG"),
                "has_animal": len(detections) > 0,
            }))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if ws in ws_clients:
            ws_clients.remove(ws)
        print(f"WebSocket disconnected. Total: {len(ws_clients)}")


@app.websocket("/ws/dashboard")
async def websocket_dashboard(ws: WebSocket):
    """Dashboard receives broadcast alerts (read-only)."""
    await ws.accept()
    ws_clients.append(ws)
    # Send current stats on connect
    await ws.send_text(json.dumps({
        "type": "init",
        "stats": {
            "total_detections": total_detections,
            "detections_by_animal": dict(detection_stats),
        }
    }))
    try:
        while True:
            await asyncio.sleep(30)
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        if ws in ws_clients:
            ws_clients.remove(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
