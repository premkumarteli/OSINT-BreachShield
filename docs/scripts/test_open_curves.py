import cv2
import numpy as np

skel = cv2.imread('frontend/public/test_skel.png', cv2.IMREAD_GRAYSCALE)
contours, _ = cv2.findContours(skel, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)

open_curves = []
for c in contours:
    arc_len = cv2.arcLength(c, False)
    if arc_len > 40:
        # Take forward half
        pts = c.reshape(-1, 2)
        n = len(pts)
        half = pts[:n//2 + 1]
        # Smooth
        approx = cv2.approxPolyDP(half, 2.5, False).reshape(-1, 2)
        if len(approx) >= 2:
            dists = np.sqrt(np.sum(np.diff(approx, axis=0)**2, axis=1))
            length = np.sum(dists)
            if length > 20:
                open_curves.append((length, approx))

open_curves.sort(key=lambda x: x[0], reverse=True)
print(f"Open curves extracted: {len(open_curves)}")
for i, (l, pts) in enumerate(open_curves[:15]):
    print(f"Curve {i}: len={l:.1f}, start={pts[0]}, end={pts[-1]}, pts={len(pts)}")
