import cv2
import numpy as np

# Load ridge mask
mask = cv2.imread('frontend/public/ridge_mask.png', cv2.IMREAD_GRAYSCALE)
h, w = mask.shape

# In the logo (409x409), the fingerprint ridges have distinct curves.
# Let's extract the main curved ridge centerlines and fragments.
# We can represent the fingerprint with:
# 1) Outer shield boundary path
# 2) Concentric curved ridge paths running through the fingerprint whorl
# 3) The data block fragments on the right side

# Let's inspect the connected components of the ridges to identify the main ridges and the fragment blocks
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask)
print(f"Total components: {num_labels}")

# Sort components by area
comps = []
for i in range(1, num_labels):
    area = stats[i, cv2.CC_STAT_AREA]
    x = stats[i, cv2.CC_STAT_LEFT]
    y = stats[i, cv2.CC_STAT_TOP]
    bw = stats[i, cv2.CC_STAT_WIDTH]
    bh = stats[i, cv2.CC_STAT_HEIGHT]
    cx, cy = centroids[i]
    comps.append({
        'id': i, 'area': area, 'bbox': (x, y, bw, bh), 'center': (cx, cy)
    })

comps.sort(key=lambda c: c['area'], reverse=True)
print("Largest components:")
for c in comps[:15]:
    print(c)
