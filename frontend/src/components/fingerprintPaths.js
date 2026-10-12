// High-fidelity vector ridge curves and geometric data fragments for BreachShield logo identity
// Precision-matched to logo-icon-mark.png (viewBox 0 0 409 409)

export const FINGERPRINT_RIDGES = [
  // 1. Central 'B' Upper Spine & Bar
  { id: 'ridge-b-bar1', d: 'M 160 190 Q 185 190 215 190', length: 55.0, cx: 187, cy: 190, wave: 0 },
  // 2. Central 'B' Upper Loop
  { id: 'ridge-b-loop1', d: 'M 215 190 C 248 190 252 210 246 222 C 240 234 225 235 200 235', length: 95.0, cx: 230, cy: 212, wave: 0 },
  // 3. Central 'B' Mid Connecting Bar
  { id: 'ridge-b-bar2', d: 'M 200 235 Q 180 235 160 235', length: 40.0, cx: 180, cy: 235, wave: 0 },
  // 4. Central 'B' Lower Loop
  { id: 'ridge-b-loop2', d: 'M 200 235 C 235 235 258 250 254 275 C 250 298 230 305 195 305', length: 120.0, cx: 235, cy: 270, wave: 0 },
  // 5. Central 'B' Lower Stem & Curve
  { id: 'ridge-b-stem', d: 'M 195 305 Q 175 305 175 335 Q 175 365 198 375', length: 105.0, cx: 182, cy: 340, wave: 0 },

  // 6. Inner Core Ridge 1
  { id: 'ridge-inner-1', d: 'M 188 165 C 168 170 152 188 150 215 C 148 240 158 268 168 285', length: 135.0, cx: 162, cy: 225, wave: 0 },
  // 7. Inner Core Ridge 2
  { id: 'ridge-inner-2', d: 'M 160 145 C 140 155 128 178 126 210', length: 75.0, cx: 140, cy: 175, wave: 0 },

  // 8. Mid Concentric Arch 3 - Top
  { id: 'ridge-mid3-top', d: 'M 205 152 Q 175 155 150 172 Q 132 192 125 225', length: 110.0, cx: 162, cy: 180, wave: 1 },
  // 9. Mid Concentric Arch 3 - Bottom
  { id: 'ridge-mid3-bot', d: 'M 125 225 C 120 260 126 295 150 326', length: 105.0, cx: 132, cy: 275, wave: 1 },

  // 10. Mid Concentric Arch 2 - Top
  { id: 'ridge-mid2-top', d: 'M 220 118 Q 185 120 148 140 Q 115 168 102 205', length: 140.0, cx: 160, cy: 150, wave: 1 },
  // 11. Mid Concentric Arch 2 - Bottom
  { id: 'ridge-mid2-bot', d: 'M 102 205 C 92 245 98 285 122 330 Q 138 352 158 368', length: 175.0, cx: 118, cy: 275, wave: 1 },

  // 12. Outer Shield Arch 1 - Upper Crest
  { id: 'ridge-arch1-crest', d: 'M 228 82 Q 185 84 138 108 Q 98 140 76 185', length: 180.0, cx: 150, cy: 125, wave: 2 },
  // 13. Outer Shield Arch 1 - Mid Arc
  { id: 'ridge-arch1-mid', 'd': 'M 76 185 C 64 225 66 265 88 312', length: 130.0, cx: 74, cy: 248, wave: 2 },
  // 14. Outer Shield Arch 1 - Lower Swoop
  { id: 'ridge-arch1-low', d: 'M 88 312 C 105 348 140 378 185 396', length: 135.0, cx: 135, cy: 355, wave: 2 },

  // 15. Outermost Boundary 0 - Top Crest
  { id: 'ridge-arch0-crest', d: 'M 230 48 Q 175 52 122 75 Q 72 110 50 162', length: 210.0, cx: 140, cy: 100, wave: 2 },
  // 16. Outermost Boundary 0 - Lateral Arc
  { id: 'ridge-arch0-mid', d: 'M 50 162 C 38 205 38 252 64 308', length: 150.0, cx: 46, cy: 235, wave: 2 },
  // 17. Outermost Boundary 0 - Bottom Arc
  { id: 'ridge-arch0-low', d: 'M 64 308 C 85 352 120 382 165 402', length: 140.0, cx: 115, cy: 365, wave: 2 },

  // 18. Bottom Detail Accents
  { id: 'ridge-accent-1', d: 'M 190 398 Q 202 388 208 376', length: 32.0, cx: 200, cy: 386, wave: 3 },
  { id: 'ridge-accent-2', d: 'M 225 342 Q 236 348 245 352', length: 28.0, cx: 235, cy: 347, wave: 3 },
  { id: 'ridge-accent-3', d: 'M 245 315 Q 256 322 265 328', length: 28.0, cx: 255, cy: 322, wave: 3 },

  // 19. Lateral Connecting Bridges
  { id: 'ridge-lat-1', d: 'M 276 195 Q 274 216 270 238', length: 44.0, cx: 274, cy: 216, wave: 3 },
  { id: 'ridge-lat-2', d: 'M 282 268 Q 276 285 268 302', length: 38.0, cx: 275, cy: 285, wave: 3 },
  { id: 'ridge-lat-3', d: 'M 338 166 Q 330 176 322 186', length: 32.0, cx: 330, cy: 176, wave: 3 },
  { id: 'ridge-lat-4', d: 'M 368 225 Q 360 236 352 248', length: 34.0, cx: 360, cy: 236, wave: 3 }
];

export const FINGERPRINT_FRAGMENTS = [
  { id: "frag-0", d: "M 266 57 L 285 57 L 285 75 L 266 75 Z", cx: 274.8, cy: 65.5, w: 19, h: 18, delay: 0.05 },
  { id: "frag-1", d: "M 324 69 L 352 69 L 352 98 L 324 98 Z", cx: 337.4, cy: 82.9, w: 28, h: 29, delay: 0.10 },
  { id: "frag-2", d: "M 226 102 L 257 102 L 257 126 L 226 126 Z", cx: 239.1, cy: 113.5, w: 31, h: 24, delay: 0.15 },
  { id: "frag-3", d: "M 374 128 L 400 128 L 400 155 L 374 155 Z", cx: 386.2, cy: 140.7, w: 26, h: 27, delay: 0.18 },
  { id: "frag-4", d: "M 292 159 L 347 159 L 347 201 L 292 201 Z", cx: 318.5, cy: 179.6, w: 55, h: 42, delay: 0.22 },
  { id: "frag-5", d: "M 370 185 L 378 185 L 378 193 L 370 193 Z", cx: 373.6, cy: 188.4, w: 8, h: 8, delay: 0.25 },
  { id: "frag-6", d: "M 338 223 L 377 223 L 377 250 L 338 250 Z", cx: 360.0, cy: 235.8, w: 39, h: 27, delay: 0.28 },
  { id: "frag-7", d: "M 314 268 L 343 268 L 343 296 L 314 296 Z", cx: 328.3, cy: 281.1, w: 29, h: 28, delay: 0.32 },
  { id: "frag-8", d: "M 205 318 L 296 318 L 296 366 L 205 366 Z", cx: 243.0, cy: 343.3, w: 91, h: 48, delay: 0.35 },
  { id: "frag-9", d: "M 220 376 L 228 376 L 228 384 L 220 384 Z", cx: 223.4, cy: 379.4, w: 8, h: 8, delay: 0.38 }
];
