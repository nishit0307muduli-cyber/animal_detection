"""
Railway Animal Detection — FastAPI Application Entry Point
"""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.routes import detect, jobs
from app.services.detection_service import DetectionService
from app.services.video_service import VideoService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── Directories ────────────────────────────────────────────────────────────────
for d in ("uploads", "outputs", "static"):
    Path(d).mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("═" * 50)
    logger.info("  Railway Animal Detection API starting…")
    logger.info("═" * 50)

    # Pre-load singleton services (downloads yolov8n.pt on first run)
    DetectionService()
    VideoService()

    logger.info("Services ready. API is live.")
    yield
    logger.info("API shutting down.")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "Railway Animal Detection API",
    description = (
        "AI-powered animal detection for railway track safety monitoring. "
        "⚠️ Research prototype — NOT a certified safety system."
    ),
    version  = "1.0.0",
    lifespan = lifespan,
    docs_url = "/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow any origin (Render, localhost, etc.)
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── API Routers ───────────────────────────────────────────────────────────────
app.include_router(detect.router, prefix="/api")
app.include_router(jobs.router,   prefix="/api")

# Serve annotated output videos / images
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# ── Serve Static Assets & SPA Frontend (Render Single-Container Deploy) ───────
STATIC_DIR = Path("static")

# Mount assets directory if present (from React/Vite build)
assets_dir = STATIC_DIR / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    Serves static files (favicon, manifest, assets) or falls back to
    index.html for single-page application routing.
    """
    file_path = STATIC_DIR / full_path
    if full_path and file_path.is_file():
        return FileResponse(str(file_path))

    index_path = STATIC_DIR / "index.html"
    if index_path.is_file():
        return FileResponse(str(index_path))

    return {
        "status": "online",
        "service": "Railway Animal Detection API",
        "docs": "/docs",
        "note": "Static frontend not mounted. Deploy via Dockerfile to serve full UI."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
