# ---- Dockerfile for Render (single service) ----
# Multi‑stage build
# 1️⃣ Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# Build production assets (Vite outputs to ./dist)
RUN npm run build

# 2️⃣ Install Python backend dependencies
FROM python:3.12-slim AS backend-builder
# Install OS packages needed by OpenCV & others
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ffmpeg libgl1-mesa-glx && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
# Pre‑load YOLO model (optional, speeds up first request)
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" || true

# 3️⃣ Final runtime image
FROM python:3.12-slim
WORKDIR /app
# Copy backend code and installed packages
COPY --from=backend-builder /app /app
# Copy built frontend into "static" directory (served by FastAPI)
COPY --from=frontend-builder /frontend/dist /app/static
# Expose Render’s dynamic port (Render injects $PORT)
EXPOSE 10000
# Run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]
