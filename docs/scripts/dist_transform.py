import cv2
import numpy as np

img = cv2.imread('frontend/public/ridge_mask.png', cv2.IMREAD_GRAYSCALE)
h, w = img.shape

# Distance transform on the ridges: peak points correspond to centerlines of ridges!
dist = cv2.distanceTransform(img, cv2.DIST_L2, 5)
print(f"Max distance (half ridge width): {dist.max():.2f}")

# Ridge width is around dist.max() * 2!
# Let's see: dist.max() is about:
print("Dist percentiles:", [np.percentile(dist[dist > 0], p) for p in [25, 50, 75, 90, 99]])
