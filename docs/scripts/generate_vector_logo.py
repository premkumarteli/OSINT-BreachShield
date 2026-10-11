import cv2
import numpy as np

img = cv2.imread('frontend/public/logo-icon-mark.png', cv2.IMREAD_UNCHANGED)
alpha = img[:, :, 3]
_, thresh = cv2.threshold(alpha, 80, 255, cv2.THRESH_BINARY)
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)

svg_header = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 409 409" width="409" height="409">
  <defs>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="100%" stop-color="#0080ff" />
    </linearGradient>
  </defs>
'''

svg_body = []
# Group paths by parent to handle holes correctly with fill-rule="evenodd"
# All contours:
paths_d = []
for i, cnt in enumerate(contours):
    area = cv2.contourArea(cnt)
    if area < 8:
        continue
    # Smooth points
    epsilon = 0.8
    approx = cv2.approxPolyDP(cnt, epsilon, True)
    pts = approx.reshape(-1, 2)
    if len(pts) < 3:
        continue
    d = f"M {pts[0][0]} {pts[0][1]} " + " ".join([f"L {p[0]} {p[1]}" for p in pts[1:]]) + " Z"
    paths_d.append((i, d, area, cv2.boundingRect(cnt)))

print(f"Total paths: {len(paths_d)}")

# Write test SVG with evenodd fill
full_d = " ".join([d for _, d, _, _ in paths_d])
svg_body.append(f'  <path d="{full_d}" fill="url(#cyanGrad)" fill-rule="evenodd" />')

svg_content = svg_header + "\n".join(svg_body) + "\n</svg>"
with open('frontend/public/logo_vector.svg', 'w') as f:
    f.write(svg_content)
print("Saved frontend/public/logo_vector.svg")
