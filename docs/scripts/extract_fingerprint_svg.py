import cv2
import numpy as np

img = cv2.imread('frontend/public/logo-icon-mark.png', cv2.IMREAD_UNCHANGED)
alpha = img[:, :, 3]
_, thresh = cv2.threshold(alpha, 80, 255, cv2.THRESH_BINARY)

contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)

print(f"Total contours: {len(contours)}")

# We want actual ridge strokes.
# Notice: the logo is a shield outline + fingerprint ridge curves inside.
# Let's inspect the shapes and their bounding boxes and areas.
for i, cnt in enumerate(contours):
    area = cv2.contourArea(cnt)
    x, y, w, h = cv2.boundingRect(cnt)
    print(f"[{i}] area={area:.1f}, bbox=({x},{y},{w},{h}), len={len(cnt)}")
