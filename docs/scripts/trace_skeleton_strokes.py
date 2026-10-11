import cv2
import numpy as np

# Load the skeleton
skel = cv2.imread('frontend/public/test_skel.png', cv2.IMREAD_GRAYSCALE)
h, w = skel.shape

# Let's extract paths by following skeleton pixels from endpoints or intersections
# A pixel in a skeleton has:
# 1 neighbor -> endpoint
# 2 neighbors -> interior point along line
# >2 neighbors -> junction / branch point

# Find degree of each skeleton pixel
nbr_kernel = np.array([[1, 1, 1], [1, 0, 1], [1, 1, 1]], dtype=np.uint8)
skel_bin = (skel > 0).astype(np.uint8)
nbr_count = cv2.filter2D(skel_bin, -1, nbr_kernel) * skel_bin

endpoints = np.argwhere((nbr_count == 1) & (skel_bin == 1))
junctions = np.argwhere((nbr_count > 2) & (skel_bin == 1))
print(f"Skeleton endpoints: {len(endpoints)}, junctions: {len(junctions)}")

# We can trace lines between endpoints and junctions
# Or we can simplify into distinct curves!
# Let's write a tracker that traces lines
visited = np.zeros_like(skel_bin)
lines = []

def get_neighbors(pt):
    r, c = pt
    res = []
    for dr in [-1, 0, 1]:
        for dc in [-1, 0, 1]:
            if dr == 0 and dc == 0:
                continue
            nr, nc = r + dr, c + dc
            if 0 <= nr < h and 0 <= nc < w:
                if skel_bin[nr, nc] == 1:
                    res.append((nr, nc))
    return res

# Start tracing from endpoints
for ep in endpoints:
    r, c = ep
    if visited[r, c]:
        continue
    path = [(c, r)]
    visited[r, c] = 1
    curr = (r, c)
    while True:
        nbrs = [p for p in get_neighbors(curr) if not visited[p[0], p[1]]]
        if not nbrs:
            break
        curr = nbrs[0]
        visited[curr[0], curr[1]] = 1
        path.append((curr[1], curr[0]))
        if nbr_count[curr[0], curr[1]] > 2:
            # Junction reached
            break
    if len(path) > 8:
        lines.append(path)

# Trace any remaining loops/segments
unvisited = np.argwhere((skel_bin == 1) & (visited == 0))
for pt in unvisited:
    r, c = pt
    if visited[r, c]:
        continue
    path = [(c, r)]
    visited[r, c] = 1
    curr = (r, c)
    while True:
        nbrs = [p for p in get_neighbors(curr) if not visited[p[0], p[1]]]
        if not nbrs:
            break
        curr = nbrs[0]
        visited[curr[0], curr[1]] = 1
        path.append((curr[1], curr[0]))
    if len(path) > 8:
        lines.append(path)

print(f"Extracted {len(lines)} ridge stroke curves")
lines.sort(key=lambda l: len(l), reverse=True)
for i, l in enumerate(lines[:20]):
    print(f"Stroke {i}: len={len(l)}, start={l[0]}, end={l[-1]}")
