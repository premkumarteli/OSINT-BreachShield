import cv2
import numpy as np

img = cv2.imread('frontend/public/logo-icon-mark.png', cv2.IMREAD_UNCHANGED)
alpha = img[:, :, 3]

# Create a clear ASCII diagram of the logo at 80x50
small = cv2.resize(alpha, (80, 50), interpolation=cv2.INTER_AREA)
for r in range(50):
    line = []
    for c in range(80):
        val = small[r, c]
        if val > 180:
            line.append('#')
        elif val > 60:
            line.append('.')
        else:
            line.append(' ')
    print(''.join(line))
