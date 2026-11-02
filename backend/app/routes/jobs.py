"""
Railway Animal Detection — Job Status / Results / Download Routes
"""
from __future__ import annotations
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.services.video_service import VideoService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Jobs"])

OUTPUT_DIR = Path("outputs")


@router.get("/jobs/{job_id}")
async def job_status(job_id: str):
    """Poll video-processing progress."""
    svc    = VideoService()
    status = svc.get_status(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    # Attach error detail if failed
    if status["status"] == "error":
        status["error"] = svc.get_error(job_id)
    return status


@router.get("/results/{job_id}")
async def job_results(job_id: str):
    """Retrieve completed video detection results."""
    svc    = VideoService()
    status = svc.get_status(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    if status["status"] == "error":
        raise HTTPException(status_code=422, detail=svc.get_error(job_id) or "Processing failed.")
    if status["status"] != "completed":
        raise HTTPException(
            status_code=202,
            detail=f"Job not yet complete (status: {status['status']}, "
                   f"progress: {status['progress']:.0%}).",
        )

    result = svc.get_result(job_id)
    if result is None:
        raise HTTPException(status_code=500, detail="Result unexpectedly missing.")
    return result


@router.get("/download/{job_id}")
async def download_video(job_id: str):
    """Download the annotated output video."""
    result = VideoService().get_result(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Job not found or not yet complete.")

    output_file = OUTPUT_DIR / f"{job_id}_out.mp4"
    if not output_file.exists():
        raise HTTPException(status_code=404, detail="Output video file not found on server.")

    return FileResponse(
        path        = str(output_file),
        media_type  = "video/mp4",
        filename    = f"detected_{result.get('filename', 'output')}.mp4",
    )
