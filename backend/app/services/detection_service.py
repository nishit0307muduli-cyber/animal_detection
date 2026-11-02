"""
Railway Animal Detection — Core Detection Service
Loads YOLOv8, runs inference, draws annotations, checks danger-zone overlap.
"""
from __future__ import annotations
import base64
import io
import logging
import time
from pathlib import Path
import os

import cv2
import numpy as np
from PIL import Image

from app.utils.zone_utils import bbox_overlaps_zone, zone_points_to_pixels

logger = logging.getLogger(__name__)

# ── COCO animal classes ────────────────────────────────────────────────────────
ANIMAL_CLASSES: dict[int, str] = {
    14: "bird",
    15: "cat",
    16: "dog",
    17: "horse",
    18: "sheep",
    19: "cow",
    20: "elephant",
    21: "bear",
    22: "zebra",
    23: "giraffe",
}

# BGR colors per class
CLASS_COLORS: dict[str, tuple[int, int, int]] = {
    "bird":     (0,   200, 255),
    "cat":      (255, 120,   0),
    "dog":      (0,   255, 120),
    "horse":    (200,   0, 255),
    "sheep":    (255, 200,   0),
    "cow":      (50,  100, 255),
    "elephant": (100,   0, 200),
    "bear":     (255,   0, 100),
    "zebra":    (0,   255, 200),
    "giraffe":  (200, 255,   0),
}
DEFAULT_COLOR = (100, 100, 255)


def _alert_message(alert_level: str) -> str:
    if alert_level == "danger":
        return "⚠️ ALERT: Animal detected in the railway track danger zone!"
    if alert_level == "warning":
        return "Animal detected outside the configured danger zone."
    return "No supported animals detected."


class DetectionService:
    """Singleton YOLO detection service."""

    _instance: "DetectionService | None" = None

    def __new__(cls, model_path: str = "yolov8n.pt") -> "DetectionService":
        if cls._instance is None:
            obj = super().__new__(cls)
            obj._initialized = False
            cls._instance = obj
        return cls._instance

    def __init__(self, model_path: str = os.getenv("YOLO_MODEL", "yolov8s.pt")) -> None:
        if self._initialized:
            return
        self._initialized = True
        self.model = None
        self.model_loaded = False
        self.model_info: dict = {}
        self.ANIMAL_CLASSES = ANIMAL_CLASSES
        self._load_model(model_path)

    # ── Model Loading ──────────────────────────────────────────────────────────
    def _load_model(self, model_path: str) -> None:
        try:
            from ultralytics import YOLO
            logger.info(f"Loading YOLO model from: {model_path}")
            self.model = YOLO(model_path)
            # Warmup
            dummy = np.zeros((64, 64, 3), dtype=np.uint8)
            self.model(dummy, verbose=False)
            self.model_loaded = True
            self.model_info = {
                "path": model_path,
                "type": "YOLOv8",
                "task": "detection",
                "classes": len(ANIMAL_CLASSES),
            }
            logger.info("YOLO model loaded and warmed up successfully.")
        except Exception as exc:
            logger.error(f"Failed to load model: {exc}")
            self.model_loaded = False
            self.model_info = {"error": str(exc)}

    # ── Image Detection ────────────────────────────────────────────────────────
    def detect_image(
        self,
        image_bytes: bytes,
        confidence: float = 0.55,
        max_dim: int = 800,
        show_labels: bool = True,
        show_conf: bool = True,
        danger_zone: list[dict] | None = None,
        filename: str = "upload",
    ) -> dict:
        """Run detection on raw image bytes. Returns a result dict."""
        if not self.model_loaded:
            raise RuntimeError("Model not loaded. Check server logs for details.")

        t0 = time.perf_counter()

        # Decode image
        arr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Could not decode image. File may be corrupt or unsupported.")
        h, w = img_bgr.shape[:2]
        # Resize to keep max dimension at max_dim while preserving aspect ratio
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            h, w = img_bgr.shape[:2]

        # Inference
        results = self.model(img_bgr, conf=confidence, verbose=False)[0]

        # Collect animal detections
        raw_detections = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in ANIMAL_CLASSES:
                continue
            label = ANIMAL_CLASSES[cls_id]
            conf_val = float(box.conf[0])
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0])
            in_zone = (
                bbox_overlaps_zone([x1, y1, x2, y2], danger_zone, w, h)
                if danger_zone and len(danger_zone) >= 3
                else False
            )
            raw_detections.append({
                "label":         label,
                "confidence":    round(conf_val, 4),
                "bbox":          {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "in_danger_zone": in_zone,
            })

        # Annotate image
        annotated = self._draw_annotations(
            img_bgr.copy(), raw_detections, danger_zone, w, h, show_labels, show_conf
        )

        # Encode annotated image as base64 JPEG
        _, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])
        annotated_b64 = base64.b64encode(buf.tobytes()).decode()

        alert_level = self._alert_level(raw_detections)
        elapsed = round(time.perf_counter() - t0, 3)

        return {
            "status":               "success",
            "filename":             filename,
            "detections":           raw_detections,
            "count":                len(raw_detections),
            "alert_level":          alert_level,
            "alert_message":        _alert_message(alert_level),
            "annotated_image":      annotated_b64,
            "image_size":           {"width": w, "height": h},
            "processing_time":      elapsed,
            "confidence_threshold": confidence,
        }

    # ── Frame Detection (used by video service) ────────────────────────────────
    def detect_frame(
        self,
        frame_bgr: np.ndarray,
        confidence: float = 0.40,
        danger_zone: list[dict] | None = None,
        show_labels: bool = True,
        show_conf: bool = True,
    ) -> tuple[np.ndarray, list[dict]]:
        """
        Run detection on a single BGR frame (numpy array).
        Returns (annotated_frame, list_of_detections).
        """
        h, w = frame_bgr.shape[:2]
        results = self.model(frame_bgr, conf=confidence, verbose=False)[0]

        detections = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in ANIMAL_CLASSES:
                continue
            label = ANIMAL_CLASSES[cls_id]
            conf_val = float(box.conf[0])
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0])
            in_zone = (
                bbox_overlaps_zone([x1, y1, x2, y2], danger_zone, w, h)
                if danger_zone and len(danger_zone) >= 3
                else False
            )
            detections.append({
                "label":          label,
                "confidence":     round(conf_val, 4),
                "bbox":           {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "in_danger_zone": in_zone,
            })

        annotated = self._draw_annotations(
            frame_bgr.copy(), detections, danger_zone, w, h, show_labels, show_conf
        )
        return annotated, detections

    # ── Drawing ────────────────────────────────────────────────────────────────
    def _draw_annotations(
        self,
        img: np.ndarray,
        detections: list[dict],
        danger_zone: list[dict] | None,
        img_w: int,
        img_h: int,
        show_labels: bool,
        show_conf: bool,
    ) -> np.ndarray:
        # Draw danger zone polygon
        if danger_zone and len(danger_zone) >= 3:
            pts = zone_points_to_pixels(danger_zone, img_w, img_h)
            overlay = img.copy()
            cv2.fillPoly(overlay, [pts], (0, 30, 180))
            cv2.addWeighted(overlay, 0.25, img, 0.75, 0, img)
            cv2.polylines(img, [pts], isClosed=True, color=(0, 80, 255), thickness=2)
            # Zone label
            cx = int(np.mean(pts[:, 0]))
            cy = int(np.mean(pts[:, 1]))
            cv2.putText(img, "DANGER ZONE", (cx - 55, cy),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 80, 255), 2)

        # Draw each detection
        for det in detections:
            b = det["bbox"]
            x1, y1, x2, y2 = b["x1"], b["y1"], b["x2"], b["y2"]
            label     = det["label"]
            conf_val  = det["confidence"]
            in_zone   = det["in_danger_zone"]

            color = (0, 30, 220) if in_zone else CLASS_COLORS.get(label, DEFAULT_COLOR)
            thickness = 3 if in_zone else 2

            cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)

            if show_labels:
                text = label
                if show_conf:
                    text += f" {conf_val:.0%}"
                (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                cv2.rectangle(img, (x1, y1 - th - 10), (x1 + tw + 8, y1), color, -1)
                cv2.putText(img, text, (x1 + 4, y1 - 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            if in_zone:
                # Red warning triangle icon near top-right of box
                cv2.putText(img, "!", (x2 - 14, y1 + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 30, 220), 3)

        return img

    @staticmethod
    def _alert_level(detections: list[dict]) -> str:
        if not detections:
            return "none"
        if any(d["in_danger_zone"] for d in detections):
            return "danger"
        return "warning"
