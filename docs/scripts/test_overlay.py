import cv2
import numpy as np

# Load original logo
img = cv2.imread('frontend/public/logo-icon-mark.png', cv2.IMREAD_UNCHANGED)
h, w, _ = img.shape

# Run skeleton tracing
skel = cv2.imread('frontend/public/test_skel.png', cv2.IMREAD_GRAYSCALE)
skel_bin = (skel > 0).astype(np.uint8)

# Find connected curves
# We can find contours or curves
contours, _ = cv2.findContours(skel_bin, cv2.RETR_LIST, cv2.CHAIN_APPROX_TC89_KCOS)

overlay = img.copy()
# Draw contours
for i, c in enumerate(contours):
    if len(c) < 4:
        continue
    # Draw polyline
    cv2.polylines(overlay, [c], False, (0, 255, 255, 255), 2)

cv2.imwrite('frontend/public/ridge_overlay_test.png', overlay)
print(f"Overlay test saved with {len(contours)} contours")
