import cv2
import numpy as np

mask = cv2.imread('frontend/public/ridge_mask.png', cv2.IMREAD_GRAYSCALE)
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask)

# Component 1 mask
c1 = (labels == 1).astype(np.uint8) * 255

# In Component 1, find RETR_TREE contours:
cnts, hier = cv2.findContours(c1, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)
print(f"Component 1 contours count: {len(cnts)}")
for i, c in enumerate(cnts):
    area = cv2.contourArea(c)
    parent = hier[0][i][3]
    print(f"C1 contour {i}: area={area:.0f}, parent={parent}, points={len(c)}")
