# ==========================================
# 1. Build React frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# ==========================================
# 2. Final Python runtime
# ==========================================
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=10000

# Install required system libraries for OpenCV and FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Optimize image size & RAM: Install lightweight CPU-only PyTorch first
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy React production build into backend/static
COPY --from=frontend-builder /frontend/dist ./static

# Pre-download YOLOv8 nano model weights so it's instantly ready
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" || true

# Render default port
EXPOSE 10000

# Start FastAPI serving both API and Frontend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
