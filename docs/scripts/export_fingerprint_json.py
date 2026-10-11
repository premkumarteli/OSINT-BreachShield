import cv2
import numpy as np
import json

skel = cv2.imread('frontend/public/test_skel.png', cv2.IMREAD_GRAYSCALE)
contours, _ = cv2.findContours(skel, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)

ridges = []
for idx, c in enumerate(contours):
    arc_len = cv2.arcLength(c, False)
    if arc_len > 35:
        pts = c.reshape(-1, 2)
        n = len(pts)
        half = pts[:n//2 + 1]
        approx = cv2.approxPolyDP(half, 2.0, False).reshape(-1, 2)
        if len(approx) >= 2:
            dists = np.sqrt(np.sum(np.diff(approx, axis=0)**2, axis=1))
            length = float(np.sum(dists))
            if length > 22:
                # Format path string
                d = f"M {approx[0][0]} {approx[0][1]} " + " ".join([f"L {p[0]} {p[1]}" for p in approx[1:]])
                # Calculate centroid / order
                c_mean = np.mean(approx, axis=0)
                ridges.append({
                    'id': f"ridge-{len(ridges)}",
                    'd': d,
                    'length': round(length, 1),
                    'cx': round(float(c_mean[0]), 1),
                    'cy': round(float(c_mean[1]), 1)
                })

# Sort ridges logically (from inner whorl to outer boundary, staggered reveal)
ridges.sort(key=lambda r: (r['cy'], r['cx']))

# Also extract the geometric data fragments from the right-hand side of logo-icon-mark.png
mask = cv2.imread('frontend/public/ridge_mask.png', cv2.IMREAD_GRAYSCALE)
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask)

fragments = []
for i in range(1, num_labels):
    area = stats[i, cv2.CC_STAT_AREA]
    x = int(stats[i, 0])
    y = int(stats[i, 1])
    w = int(stats[i, 2])
    h = int(stats[i, 3])
    # Fragment blocks are typically on the right or smaller modular chunks
    if x > 180 and area < 5000:
        cmask = (labels == i).astype(np.uint8) * 255
        cnts, _ = cv2.findContours(cmask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS)
        if cnts:
            approx = cv2.approxPolyDP(cnts[0], 1.2, True).reshape(-1, 2)
            d = f"M {approx[0][0]} {approx[0][1]} " + " ".join([f"L {p[0]} {p[1]}" for p in approx[1:]]) + " Z"
            fragments.append({
                'id': f"frag-{len(fragments)}",
                'x': x, 'y': y, 'w': w, 'h': h,
                'cx': round(float(centroids[i][0]), 1),
                'cy': round(float(centroids[i][1]), 1),
                'd': d,
                'area': int(area)
            })

fragments.sort(key=lambda f: (f['cy'], f['cx']))

output_data = {
    'ridges': ridges,
    'fragments': fragments
}

with open('frontend/src/components/fingerprint_paths.json', 'w') as f:
    json.dump(output_data, f, indent=2)

print(f"Extracted {len(ridges)} ridges and {len(fragments)} fragments to fingerprint_paths.json")
