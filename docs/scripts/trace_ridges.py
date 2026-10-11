import cv2
import numpy as np

skel = cv2.imread('frontend/public/test_skel.png', cv2.IMREAD_GRAYSCALE)

# Find contours or graph lines of the skeleton
# In OpenCV, cv2.findContours on a skeleton gives closed loops and open lines as contours
contours, _ = cv2.findContours(skel, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
print(f"Total skeleton contours: {len(contours)}")

# Sort contours by length
sorted_cnts = sorted([c for c in contours if len(c) > 10], key=lambda c: len(c), reverse=True)
print(f"Contours with len > 10: {len(sorted_cnts)}")
for i, c in enumerate(sorted_cnts[:20]):
    print(f"Ridge {i}: points={len(c)}, start=({c[0][0][0]},{c[0][0][1]}), end=({c[-1][0][0]},{c[-1][0][1]})")
