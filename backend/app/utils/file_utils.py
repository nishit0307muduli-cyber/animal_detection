"""
Railway Animal Detection — File Utility Functions
"""
from __future__ import annotations
import uuid
import re
from pathlib import Path

# Allowed MIME types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/x-msvideo", "video/quicktime", "video/x-matroska"}
ALLOWED_IMAGE_EXTS  = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ALLOWED_VIDEO_EXTS  = {".mp4", ".avi", ".mov", ".mkv"}

MAX_IMAGE_BYTES = 20 * 1024 * 1024   # 20 MB
MAX_VIDEO_BYTES = 500 * 1024 * 1024  # 500 MB


def safe_filename(original: str) -> str:
    """Generate a unique, safe filename that prevents path traversal."""
    ext = Path(original).suffix.lower()
    # Sanitize extension
    ext = re.sub(r"[^a-z0-9.]", "", ext)[:10]
    return f"{uuid.uuid4().hex}{ext}"


def validate_image_file(filename: str, content_type: str, size: int) -> None:
    """Raise ValueError if the image file is invalid."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise ValueError(f"Unsupported image extension: {ext}. Allowed: {sorted(ALLOWED_IMAGE_EXTS)}")
    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError(f"Unsupported content type: {content_type}")
    if size > MAX_IMAGE_BYTES:
        raise ValueError(f"Image too large ({size / 1e6:.1f} MB). Maximum: {MAX_IMAGE_BYTES / 1e6:.0f} MB")


def validate_video_file(filename: str, content_type: str, size: int) -> None:
    """Raise ValueError if the video file is invalid."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTS:
        raise ValueError(f"Unsupported video extension: {ext}. Allowed: {sorted(ALLOWED_VIDEO_EXTS)}")
    if size > MAX_VIDEO_BYTES:
        raise ValueError(f"Video too large ({size / 1e6:.1f} MB). Maximum: {MAX_VIDEO_BYTES / 1e6:.0f} MB")


def cleanup_file(path: Path) -> None:
    """Silently delete a file."""
    try:
        path.unlink(missing_ok=True)
    except Exception:
        pass
