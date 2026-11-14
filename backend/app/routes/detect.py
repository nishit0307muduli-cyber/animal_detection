"""
Railway Animal Detection — Detection Routes (image + video upload)
"""
from __future__ import annotations
import json
import logging
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status

from app.services.detection_service import DetectionService
from app.services.video_service import VideoService
from app.utils.file_utils import (
    safe_filename,
    validate_image_file,
    ALLOWED_VIDEO_EXTS,
    ALLOWED_VIDEO_TYPES,
    MAX_VIDEO_BYTES,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Detection"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# ── Health ────────────────────────────────────────────────────────────────────
@router.get("/health")
async def health():
    svc = DetectionService()
    return {
        "status":         "ok",
        "model_loaded":   svc.model_loaded,
        "model_info":     svc.model_info,
        "animal_classes": list(svc.ANIMAL_CLASSES.values()),
    }


# ── Image Detection ───────────────────────────────────────────────────────────
@router.post("/detect/image")
async def detect_image(
    file:        UploadFile = File(...),
    confidence:  float      = Form(0.40),
    show_labels: bool       = Form(True),
    show_conf:   bool       = Form(True),
    danger_zone: str        = Form("[]"),   # JSON array of {x, y} objects
):
    """
    Upload an image → run YOLOv8 animal detection → return annotated image + detections.
    """
    contents = await file.read()

    # Validate
    try:
        validate_image_file(file.filename or "upload", file.content_type or "", len(contents))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Parse danger zone
    try:
        zone: list[dict] = json.loads(danger_zone) if danger_zone else []
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid danger_zone JSON.")

    # Clamp confidence
    confidence = max(0.05, min(0.95, confidence))

    # Run inference
    svc = DetectionService()
    try:
        result = svc.detect_image(
            image_bytes = contents,
            confidence  = confidence,
            show_labels = show_labels,
            show_conf   = show_conf,
            danger_zone = zone if len(zone) >= 3 else None,
            filename    = file.filename or "upload",
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Image detection failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal detection error.")

    return result


# ── Video Upload (Chunked streaming up to 500 MB) ──────────────────────────────
@router.post("/detect/video")
async def detect_video(
    file:        UploadFile = File(...),
    confidence:  float      = Form(0.40),
    show_labels: bool       = Form(True),
    show_conf:   bool       = Form(True),
    sample_rate: int        = Form(1),      # process every N-th frame
    danger_zone: str        = Form("[]"),
):
    """
    Upload a video up to 500 MB → stream chunks to disk to protect RAM →
    submit background job → return job_id for polling.
    """
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video extension: {ext}. Allowed: {sorted(ALLOWED_VIDEO_EXTS)}"
        )

    try:
        zone: list[dict] = json.loads(danger_zone) if danger_zone else []
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid danger_zone JSON.")

    confidence  = max(0.05, min(0.95, confidence))
    sample_rate = max(1, min(30, sample_rate))

    # Stream video directly to disk in 2 MB chunks (keeps memory footprint under 15 MB)
    safe_name  = safe_filename(file.filename or "video.mp4")
    video_path = UPLOAD_DIR / safe_name
    total_bytes = 0

    try:
        async with aiofiles.open(video_path, "wb") as f:
            while chunk := await file.read(2 * 1024 * 1024):  # 2MB chunks
                total_bytes += len(chunk)
                if total_bytes > MAX_VIDEO_BYTES:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Video exceeds limit ({total_bytes / 1e6:.1f} MB). Maximum allowed is 500 MB."
                    )
                await f.write(chunk)
    except HTTPException:
        video_path.unlink(missing_ok=True)
        raise
    except Exception as e:
        video_path.unlink(missing_ok=True)
        logger.error(f"Failed to stream video upload: {e}")
        raise HTTPException(status_code=500, detail="Video streaming write error.")

    # Submit job
    detection_svc = DetectionService()
    video_svc     = VideoService()
    job_id = video_svc.submit(
        video_path    = video_path,
        filename      = file.filename or "video.mp4",
        detection_svc = detection_svc,
        confidence    = confidence,
        danger_zone   = zone if len(zone) >= 3 else None,
        sample_rate   = sample_rate,
        show_labels   = show_labels,
        show_conf     = show_conf,
    )

    return {
        "status": "queued",
        "job_id": job_id,
        "message": f"High-capacity video ({total_bytes / 1e6:.1f} MB) submitted for processing.",
    }
