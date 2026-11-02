"""
Railway Animal Detection — Danger Zone Utility
Uses OpenCV polygon operations to check bounding-box / polygon overlap.
"""
from __future__ import annotations
import numpy as np
import cv2


def zone_points_to_pixels(zone_points: list[dict], img_w: int, img_h: int) -> np.ndarray:
    """Convert percentage-based zone points → pixel coordinates."""
    return np.array(
        [[int(p["x"] * img_w / 100), int(p["y"] * img_h / 100)] for p in zone_points],
        dtype=np.int32,
    )


def bbox_overlaps_zone(
    bbox: list[int],
    zone_points: list[dict],
    img_w: int,
    img_h: int,
) -> bool:
    """
    Return True if the bounding box overlaps the danger-zone polygon.

    Strategy:
      1. Test bbox corners + center against polygon.
      2. Test polygon vertices against bbox rectangle.
      3. Check if bbox edges intersect polygon edges (handles edge cases).
    """
    if not zone_points or len(zone_points) < 3:
        return False

    x1, y1, x2, y2 = bbox
    pts = zone_points_to_pixels(zone_points, img_w, img_h)

    # ── Step 1: test bbox key points vs polygon ───────────────
    test_pts = [
        (x1, y1), (x2, y1), (x1, y2), (x2, y2),
        ((x1 + x2) // 2, (y1 + y2) // 2),
    ]
    for px, py in test_pts:
        if cv2.pointPolygonTest(pts, (float(px), float(py)), False) >= 0:
            return True

    # ── Step 2: test polygon vertices vs bbox rect ────────────
    for vx, vy in pts:
        if x1 <= vx <= x2 and y1 <= vy <= y2:
            return True

    # ── Step 3: polygon mask vs bbox mask intersection ────────
    mask_size = (img_h, img_w)
    zone_mask = np.zeros(mask_size, dtype=np.uint8)
    bbox_mask = np.zeros(mask_size, dtype=np.uint8)
    cv2.fillPoly(zone_mask, [pts], 1)
    cv2.rectangle(bbox_mask, (x1, y1), (x2, y2), 1, -1)
    return bool(np.any(zone_mask & bbox_mask))


def default_danger_zone(pct_top: float = 35.0, pct_bottom: float = 65.0) -> list[dict]:
    """
    Return a horizontal strip across the middle of the image as the default
    danger zone (simulating railway track area).
    Points are in percentage coordinates.
    """
    return [
        {"x": 0.0,   "y": pct_top},
        {"x": 100.0, "y": pct_top},
        {"x": 100.0, "y": pct_bottom},
        {"x": 0.0,   "y": pct_bottom},
    ]
