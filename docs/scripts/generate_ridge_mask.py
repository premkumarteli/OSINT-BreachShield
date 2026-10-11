import cv2
import numpy as np

img = cv2.imread('frontend/public/logo-icon-mark.png', cv2.IMREAD_UNCHANGED)
alpha = img[:, :, 3]

# The logo is 409x409. Let's analyze where the ridge lines run.
# In OpenCV, we can find contours of the alpha channel.
# But even better: let's inspect the actual ridge curves of the logo.
# Let's save a high-contrast image of the ridges.
_, binary = cv2.threshold(alpha, 100, 255, cv2.THRESH_BINARY)
cv2.imwrite('frontend/public/ridge_mask.png', binary)
print("Binary ridge mask written")
