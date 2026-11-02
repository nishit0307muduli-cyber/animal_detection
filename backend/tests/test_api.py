"""
Railway Animal Detection — Backend Tests
"""
import base64
import io
import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from PIL import Image

# ── Fixture: test client ───────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def client():
    """Start the app with a mock detection service."""
    with patch("app.services.detection_service.DetectionService._load_model"):
        from app.main import app
        with TestClient(app) as c:
            yield c


def _make_mock_detection_service(num_detections=1, in_danger_zone=False):
    """Return a DetectionService instance with a mocked detect_image."""
    svc = MagicMock()
    svc.model_loaded = True
    svc.model_info   = {"type": "YOLOv8", "path": "yolov8n.pt"}
    svc.ANIMAL_CLASSES = {19: "cow"}

    # Build a small red JPEG as the annotated image
    img = Image.new("RGB", (100, 100), color=(200, 50, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode()

    detections = []
    for _ in range(num_detections):
        detections.append({
            "label":          "cow",
            "confidence":     0.85,
            "bbox":           {"x1": 10, "y1": 10, "x2": 50, "y2": 50},
            "in_danger_zone": in_danger_zone,
        })

    svc.detect_image.return_value = {
        "status":               "success",
        "filename":             "test.jpg",
        "detections":           detections,
        "count":                num_detections,
        "alert_level":          "danger" if in_danger_zone else ("warning" if detections else "none"),
        "alert_message":        "⚠️ ALERT" if in_danger_zone else "Animal detected outside zone.",
        "annotated_image":      b64,
        "image_size":           {"width": 100, "height": 100},
        "processing_time":      0.05,
        "confidence_threshold": 0.40,
    }
    return svc


def _small_jpeg() -> bytes:
    img = Image.new("RGB", (50, 50), color=(100, 100, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ── Health Check ──────────────────────────────────────────────────────────────
def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert "status" in body
    assert "model_loaded" in body


# ── Image Detection ───────────────────────────────────────────────────────────
def test_detect_image_valid(client):
    img_bytes = _small_jpeg()
    svc = _make_mock_detection_service(num_detections=1)

    with patch("app.routes.detect.DetectionService", return_value=svc):
        resp = client.post(
            "/api/detect/image",
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
            data={"confidence": "0.4", "show_labels": "true", "show_conf": "true", "danger_zone": "[]"},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"]      == "success"
    assert body["count"]       >= 0
    assert "detections"        in body
    assert "annotated_image"   in body
    assert "processing_time"   in body
    assert "alert_level"       in body


def test_detect_image_no_detections(client):
    img_bytes = _small_jpeg()
    svc = _make_mock_detection_service(num_detections=0)

    with patch("app.routes.detect.DetectionService", return_value=svc):
        resp = client.post(
            "/api/detect/image",
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
            data={"confidence": "0.4", "danger_zone": "[]"},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["count"]       == 0
    assert body["alert_level"] == "none"


def test_detect_image_invalid_extension(client):
    resp = client.post(
        "/api/detect/image",
        files={"file": ("test.txt", b"not an image", "text/plain")},
        data={"confidence": "0.4"},
    )
    assert resp.status_code == 400


def test_detect_image_empty_bytes(client):
    resp = client.post(
        "/api/detect/image",
        files={"file": ("test.jpg", b"", "image/jpeg")},
        data={"confidence": "0.4"},
    )
    # Should fail at validation, inference, or model-not-loaded — not a 200.
    # 503 = model not loaded (expected in the mocked test environment).
    assert resp.status_code in (400, 422, 500, 503)


# ── Response Schema ───────────────────────────────────────────────────────────
def test_detect_image_response_schema(client):
    img_bytes = _small_jpeg()
    svc = _make_mock_detection_service(num_detections=1, in_danger_zone=True)

    with patch("app.routes.detect.DetectionService", return_value=svc):
        resp = client.post(
            "/api/detect/image",
            files={"file": ("track.jpg", img_bytes, "image/jpeg")},
            data={"confidence": "0.4", "danger_zone": json.dumps([
                {"x": 0, "y": 30}, {"x": 100, "y": 30},
                {"x": 100, "y": 70}, {"x": 0, "y": 70},
            ])},
        )

    body = resp.json()
    required_keys = {"status", "detections", "count", "alert_level", "alert_message",
                     "annotated_image", "processing_time", "confidence_threshold"}
    assert required_keys.issubset(body.keys()), f"Missing keys: {required_keys - body.keys()}"

    if body["count"] > 0:
        det = body["detections"][0]
        assert "label"          in det
        assert "confidence"     in det
        assert "bbox"           in det
        assert "in_danger_zone" in det


# ── Danger Zone ───────────────────────────────────────────────────────────────
def test_danger_zone_overlap():
    """Unit-test the zone utility directly."""
    from app.utils.zone_utils import bbox_overlaps_zone

    zone = [{"x": 30, "y": 30}, {"x": 70, "y": 30},
            {"x": 70, "y": 70}, {"x": 30, "y": 70}]

    # Fully inside
    assert bbox_overlaps_zone([40, 40, 60, 60], zone, 100, 100) is True
    # Fully outside
    assert bbox_overlaps_zone([5,  5, 20, 20], zone, 100, 100) is False
    # Overlapping edge
    assert bbox_overlaps_zone([20, 20, 50, 50], zone, 100, 100) is True


def test_danger_zone_too_few_points():
    from app.utils.zone_utils import bbox_overlaps_zone
    zone = [{"x": 10, "y": 10}, {"x": 50, "y": 10}]  # only 2 points
    assert bbox_overlaps_zone([0, 0, 20, 20], zone, 100, 100) is False


# ── Job Endpoints ─────────────────────────────────────────────────────────────
def test_job_not_found(client):
    resp = client.get("/api/jobs/nonexistent_job_id")
    assert resp.status_code == 404


def test_results_not_found(client):
    resp = client.get("/api/results/nonexistent_job_id")
    assert resp.status_code == 404


def test_download_not_found(client):
    resp = client.get("/api/download/nonexistent_job_id")
    assert resp.status_code == 404
