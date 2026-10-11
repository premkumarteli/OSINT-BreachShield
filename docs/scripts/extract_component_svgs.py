import cv2
import numpy as np

# Load mask
mask = cv2.imread('frontend/public/ridge_mask.png', cv2.IMREAD_GRAYSCALE)
h, w = mask.shape

# Let's extract the paths for each component
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask)

# For each component, find its contour
comp_paths = []
for i in range(1, num_labels):
    cmask = (labels == i).astype(np.uint8) * 255
    cnts, _ = cv2.findContours(cmask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS)
    if not cnts:
        continue
    cnt = max(cnts, key=cv2.contourArea)
    area = cv2.contourArea(cnt)
    if area < 20:
        continue
    # Smooth
    approx = cv2.approxPolyDP(cnt, 1.2, True)
    pts = approx.reshape(-1, 2)
    d = f"M {pts[0][0]} {pts[0][1]} " + " ".join([f"L {p[0]} {p[1]}" for p in pts[1:]]) + " Z"
    cx, cy = centroids[i]
    comp_paths.append({
        'id': i,
        'area': area,
        'center': (round(cx, 1), round(cy, 1)),
        'bbox': [int(stats[i, 0]), int(stats[i, 1]), int(stats[i, 2]), int(stats[i, 3])],
        'd': d
    })

print(f"Extracted {len(comp_paths)} component paths")
# Let's inspect them
for cp in comp_paths:
    print(f"Comp {cp['id']}: area={cp['area']:.0f}, center={cp['center']}, bbox={cp['bbox']}")
