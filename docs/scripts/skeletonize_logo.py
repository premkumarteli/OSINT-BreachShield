import cv2
import numpy as np

img = cv2.imread('frontend/public/logo-icon-mark.png', cv2.IMREAD_UNCHANGED)
alpha = img[:, :, 3]

# In the logo, ridges are separated by valleys (dark transparent pixels)
# Let's see the ridge lines:
# If we skeletonize the binary image, we get the 1-pixel centerlines of every ridge!
def skeletonize(img):
    size = np.size(img)
    skel = np.zeros(img.shape, np.uint8)
    element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    done = False
    temp = img.copy()
    while not done:
        eroded = cv2.erode(temp, element)
        temp2 = cv2.dilate(eroded, element)
        temp2 = cv2.subtract(temp, temp2)
        skel = cv2.bitwise_or(skel, temp2)
        temp = eroded.copy()
        zeros = size - cv2.countNonZero(temp)
        if zeros == size:
            done = True
    return skel

binary = (alpha > 80).astype(np.uint8) * 255
skel = skeletonize(binary)
cv2.imwrite('frontend/public/test_skel.png', skel)
print('Skeletonized non-zero pixels:', cv2.countNonZero(skel))
