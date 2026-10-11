import cv2
import numpy as np

img = cv2.imread('frontend/public/logo-icon-mark.png', cv2.IMREAD_UNCHANGED)
alpha = img[:, :, 3]
h, w = alpha.shape

# Threshold to get crisp binary
_, thresh = cv2.threshold(alpha, 80, 255, cv2.THRESH_BINARY)

# Find all contours with hierarchy
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)

print(f"Image dimensions: {w}x{h}")
print(f"Total contours: {len(contours)}")

# We can categorize contours:
# 1. Main outer shield contour and primary ridges
# 2. Fragment blocks on the right
# Let's inspect the bounding boxes and centroids of each contour
items = []
for i, cnt in enumerate(contours):
    area = cv2.contourArea(cnt)
    if area < 8:
        continue
    x, y, bw, bh = cv2.boundingRect(cnt)
    cx, cy = x + bw/2, y + bh/2
    parent = hierarchy[0][i][3]
    items.append({
        'id': i,
        'area': area,
        'bbox': (x, y, bw, bh),
        'center': (cx, cy),
        'parent': parent,
        'cnt': cnt
    })

items.sort(key=lambda it: it['area'], reverse=True)
print(f"Filtered {len(items)} items")
for it in items[:25]:
    print(f"ID {it['id']}: area={it['area']:.1f}, bbox={it['bbox']}, parent={it['parent']}")
