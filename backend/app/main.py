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

from app.routes import detect, jobs
from app.services.detection_service import DetectionService
from app.services.video_service import VideoService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── Directories ────────────────────────────────────────────────────────────────
for d in ("uploads", "outputs"):
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

# Serve annotated output videos / images
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Serve the React frontend build (generated in Docker)
# This will serve index.html and static assets under the root path
app.mount("/", StaticFiles(directory="static", html=True), name="frontend")

# Include routers
app.include_router(detect.router, prefix="/api")
app.include_router(jobs.router,   prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
