import cv2
import numpy as np

img = cv2.imread('frontend/public/ridge_mask.png', cv2.IMREAD_GRAYSCALE)

# We want the ridge lines.
# If we skeletonize the binary image:
def get_skeleton(img):
    skel = np.zeros(img.shape, np.uint8)
    element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    temp = img.copy()
    while True:
        eroded = cv2.erode(temp, element)
        temp2 = cv2.dilate(eroded, element)
        sub = cv2.subtract(temp, temp2)
        skel = cv2.bitwise_or(skel, sub)
        temp = eroded.copy()
        if cv2.countNonZero(temp) == 0:
            break
    return skel

skel = get_skeleton(img)

# Now, let's find the distinct ridge paths in the skeleton.
# We can find connected components or endpoints.
# Let's extract smooth paths from skel.
# For each branch, find ordered points along the curve.
# We can use cv2.findContours on slightly dilated skeleton or on skeleton directly:
# A nice trick: find contours with CHAIN_APPROX_TC89_KCOS on skeleton
contours, hierarchy = cv2.findContours(skel, cv2.RETR_LIST, cv2.CHAIN_APPROX_TC89_KCOS)

paths = []
for c in contours:
    if len(c) < 5:
        continue
    # Smooth with cv2.approxPolyDP
    epsilon = 1.5
    approx = cv2.approxPolyDP(c, epsilon, False)
    if len(approx) < 3:
        continue
    pts = approx.reshape(-1, 2)
    # Check if length along path is substantial
    dists = np.sqrt(np.sum(np.diff(pts, axis=0)**2, axis=1))
    total_len = np.sum(dists)
    if total_len > 25:
        paths.append((total_len, pts))

# Sort paths from longest to shortest
paths.sort(key=lambda x: x[0], reverse=True)
print(f"Extracted {len(paths)} substantial ridge paths")
for i, (l, pts) in enumerate(paths[:15]):
    print(f"Path {i}: length={l:.1f}, points={len(pts)}, start={pts[0]}, end={pts[-1]}")
