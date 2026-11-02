"""
Railway Animal Detection — Video Processing Service
Background-thread job queue for processing videos frame-by-frame.
"""
from __future__ import annotations
import logging
import threading
import time
import uuid
from pathlib import Path
from typing import TYPE_CHECKING

import cv2

if TYPE_CHECKING:
    from app.services.detection_service import DetectionService

logger = logging.getLogger(__name__)

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

_ALERT_MSG = {
    "danger":  "⚠️ ALERT: Animal detected in the railway track danger zone!",
    "warning": "Animal detected outside the configured danger zone.",
    "none":    "No supported animals detected.",
}


class VideoJob:
    """Holds state for a single video processing job."""

    def __init__(self, job_id: str, filename: str):
        self.job_id      = job_id
        self.filename    = filename
        self.status      = "queued"   # queued | processing | completed | error
        self.progress    = 0.0
        self.message     = "Waiting to start…"
        self.frames_processed = 0
        self.total_frames     = 0
        self.result: dict | None = None
        self.error: str | None   = None


class VideoService:
    """Manages video processing jobs."""

    _instance: "VideoService | None" = None

    def __new__(cls) -> "VideoService":
        if cls._instance is None:
            obj = super().__new__(cls)
            obj._jobs: dict[str, VideoJob] = {}
            obj._lock = threading.Lock()
            cls._instance = obj
        return cls._instance

    def submit(
        self,
        video_path: Path,
        filename: str,
        detection_svc: "DetectionService",
        confidence: float = 0.40,
        danger_zone: list[dict] | None = None,
        sample_rate: int = 1,
        show_labels: bool = True,
        show_conf: bool = True,
    ) -> str:
        """Submit a video for background processing. Returns job_id."""
        job_id = uuid.uuid4().hex
        job = VideoJob(job_id, filename)
        with self._lock:
            self._jobs[job_id] = job

        thread = threading.Thread(
            target=self._process,
            args=(job, video_path, detection_svc,
                  confidence, danger_zone, sample_rate,
                  show_labels, show_conf),
            daemon=True,
        )
        thread.start()
        return job_id

    def get_status(self, job_id: str) -> dict | None:
        with self._lock:
            job = self._jobs.get(job_id)
        if job is None:
            return None
        return {
            "job_id":           job.job_id,
            "status":           job.status,
            "progress":         round(job.progress, 3),
            "frames_processed": job.frames_processed,
            "total_frames":     job.total_frames,
            "message":          job.message,
        }

    def get_result(self, job_id: str) -> dict | None:
        with self._lock:
            job = self._jobs.get(job_id)
        if job is None or job.status != "completed":
            return None
        return job.result

    def get_error(self, job_id: str) -> str | None:
        with self._lock:
            job = self._jobs.get(job_id)
        if job and job.status == "error":
            return job.error
        return None

    # ── Internal ─────────────────────────────────────────────────────────────
    def _process(
        self,
        job: VideoJob,
        video_path: Path,
        detection_svc: "DetectionService",
        confidence: float,
        danger_zone: list[dict] | None,
        sample_rate: int,
        show_labels: bool,
        show_conf: bool,
    ) -> None:
        t0 = time.perf_counter()
        cap = None
        writer = None
        output_path = OUTPUT_DIR / f"{job.job_id}_out.mp4"

        try:
            job.status  = "processing"
            job.message = "Opening video…"

            cap = cv2.VideoCapture(str(video_path))
            if not cap.isOpened():
                raise ValueError("Cannot open video file. File may be corrupt or unsupported.")

            fps         = cap.get(cv2.CAP_PROP_FPS) or 25.0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width        = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height       = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            if total_frames <= 0:
                raise ValueError("Video has no readable frames.")

            job.total_frames = total_frames
            job.message      = f"Processing {total_frames} frames…"

            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

            frame_detections = []
            alert_frames     = 0
            unique_animals: set[str] = set()
            max_alert        = "none"
            idx              = 0

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if idx % sample_rate == 0:
                    annotated, dets = detection_svc.detect_frame(
                        frame, confidence, danger_zone, show_labels, show_conf
                    )
                    writer.write(annotated)

                    if dets:
                        alert_frames += 1
                        ts = round(idx / fps, 2)
                        frame_detections.append({
                            "frame_index":   idx,
                            "timestamp_sec": ts,
                            "detections":    dets,
                        })
                        for d in dets:
                            unique_animals.add(d["label"])
                            if d["in_danger_zone"] and max_alert != "danger":
                                max_alert = "danger"
                            elif max_alert == "none":
                                max_alert = "warning"
                else:
                    writer.write(frame)   # write original for non-sampled frames

                idx += 1
                job.frames_processed = idx
                job.progress = idx / total_frames if total_frames else 0

            cap.release()
            writer.release()

            elapsed = round(time.perf_counter() - t0, 2)

            job.result = {
                "job_id":           job.job_id,
                "filename":         job.filename,
                "total_frames":     idx,
                "sampled_frames":   (idx // sample_rate) + 1,
                "alert_frames":     alert_frames,
                "unique_animals":   sorted(unique_animals),
                "alert_level":      max_alert,
                "alert_message":    _ALERT_MSG.get(max_alert, ""),
                "frame_detections": frame_detections,
                "output_video_url": f"/outputs/{output_path.name}",
                "processing_time":  elapsed,
            }
            job.status   = "completed"
            job.progress = 1.0
            job.message  = "Processing complete."
            logger.info(f"Job {job.job_id} completed in {elapsed}s")

        except Exception as exc:
            logger.error(f"Job {job.job_id} failed: {exc}", exc_info=True)
            job.status  = "error"
            job.error   = str(exc)
            job.message = f"Error: {exc}"
        finally:
            if cap and cap.isOpened():
                cap.release()
            if writer:
                writer.release()
            # Clean up uploaded source file
            try:
                video_path.unlink(missing_ok=True)
            except Exception:
                pass
