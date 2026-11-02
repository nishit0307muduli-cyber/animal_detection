# Railway Animal Detection — Pydantic Schemas
from typing import Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class Detection(BaseModel):
    label: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox: BoundingBox
    in_danger_zone: bool = False


class ZonePoint(BaseModel):
    x: float = Field(..., ge=0, le=100, description="X as % of image width")
    y: float = Field(..., ge=0, le=100, description="Y as % of image height")


class ImageDetectionResponse(BaseModel):
    status: str
    filename: str
    detections: list[Detection]
    count: int
    alert_level: str          # "none" | "warning" | "danger"
    alert_message: str
    annotated_image: str      # base64 JPEG
    image_size: dict
    processing_time: float
    confidence_threshold: float


class FrameDetection(BaseModel):
    frame_index: int
    timestamp_sec: float
    detections: list[Detection]


class VideoJobStatus(BaseModel):
    job_id: str
    status: str               # "queued" | "processing" | "completed" | "error"
    progress: float = 0.0     # 0.0 – 1.0
    frames_processed: int = 0
    total_frames: int = 0
    message: str = ""


class VideoDetectionResult(BaseModel):
    job_id: str
    filename: str
    total_frames: int
    sampled_frames: int
    alert_frames: int
    unique_animals: list[str]
    alert_level: str
    alert_message: str
    frame_detections: list[FrameDetection]
    output_video_url: Optional[str] = None
    processing_time: float
