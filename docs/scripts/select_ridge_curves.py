import cv2
import numpy as np

# Load skeleton
skel = cv2.imread('frontend/public/test_skel.png', cv2.IMREAD_GRAYSCALE)
h, w = skel.shape

# Let's extract the longest continuous skeleton paths
contours, _ = cv2.findContours(skel, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)

# Filter and sort by arc length
curves = []
for c in contours:
    arc_len = cv2.arcLength(c, False)
    if arc_len > 35:
        # Smooth with approxPolyDP
        approx = cv2.approxPolyDP(c, 2.0, False)
        pts = approx.reshape(-1, 2)
        if len(pts) >= 3:
            # Let's check start and end to avoid closed loops if it's open
            curves.append((arc_len, pts))

curves.sort(key=lambda x: x[0], reverse=True)
print(f"Total significant curves: {len(curves)}")

# Select top 16 distinct curves
selected = []
for arc_len, pts in curves[:24]:
    # Check if duplicate of already selected (e.g. centroid distance)
    c_mean = np.mean(pts, axis=0)
    is_dup = False
    for _, s_pts in selected:
        s_mean = np.mean(s_pts, axis=0)
        if np.linalg.norm(c_mean - s_mean) < 8 and abs(len(pts) - len(s_pts)) < 3:
            is_dup = True
            break
    if not is_dup:
        selected.append((arc_len, pts))

print(f"Selected {len(selected)} distinct ridge curves:")
for i, (l, pts) in enumerate(selected):
    print(f"Curve {i}: length={l:.1f}, pts={len(pts)}, start={pts[0]}, end={pts[-1]}")
