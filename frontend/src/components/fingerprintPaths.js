// High-fidelity vector ridge curves and geometric data fragments for BreachShield logo identity
// Precision-matched to logo-icon-mark.png (viewBox 0 0 409 409)

export const FINGERPRINT_RIDGES = [
  // Wave 0: The Central 'B' Monogram (Exact identity core)
  { id: 'ridge-b-bar1', d: 'M 160 137 L 215 137', length: 55.0, cx: 187, cy: 137, wave: 0 },
  { id: 'ridge-b-loop1', d: 'M 215 137 C 248 137 258 155 256 175 C 254 195 242 207 215 207', length: 135.6, cx: 238, cy: 172, wave: 0 },
  { id: 'ridge-b-bar2', d: 'M 215 207 L 160 207', length: 55.0, cx: 187, cy: 207, wave: 0 },
  { id: 'ridge-b-loop2', d: 'M 215 207 C 248 207 258 225 256 248 C 254 268 240 275 215 275', length: 133.1, cx: 238, cy: 241, wave: 0 },
  { id: 'ridge-b-stem', d: 'M 215 275 L 180 275 Q 175 292 175 315', length: 75.7, cx: 182, cy: 288, wave: 0 },
  { id: 'ridge-b-inner-bar', d: 'M 152 178 L 195 178', length: 43.0, cx: 173, cy: 178, wave: 0 },

  // Wave 1: Core wrapping ridges
  { id: 'ridge-core-wrap', d: 'M 158 185 C 146 220 148 262 165 298 Q 172 312 178 320', length: 144.4, cx: 155, cy: 252, wave: 1 },
  { id: 'ridge-diag-mid', d: 'M 168 158 C 142 190 126 235 128 280 C 130 305 145 328 160 340', length: 202.0, cx: 142, cy: 249, wave: 1 },
  { id: 'ridge-diag-low', d: 'M 175 130 C 138 152 115 190 102 245 C 96 280 115 320 135 345', length: 249.3, cx: 125, cy: 238, wave: 1 },

  // Wave 2: Concentric Inner Arch 2
  { id: 'ridge-arch2-top', d: 'M 242 118 Q 195 90 155 105 Q 125 125 108 148', length: 161.1, cx: 175, cy: 115, wave: 2 },
  { id: 'ridge-arch2-mid', d: 'M 108 148 C 88 185 76 230 78 275 C 80 295 86 312 95 328', length: 189.3, cx: 88, cy: 238, wave: 2 },
  { id: 'ridge-arch2-bot', d: 'M 95 328 C 105 348 122 362 142 372', length: 64.6, cx: 118, cy: 350, wave: 2 },

  // Wave 3: Concentric Mid Arch 1
  { id: 'ridge-arch1-top', d: 'M 252 88 Q 195 62 145 78 Q 110 98 92 120', length: 182.8, cx: 172, cy: 87, wave: 3 },
  { id: 'ridge-arch1-mid', d: 'M 92 120 C 68 160 54 210 55 260 C 56 288 64 312 75 335', length: 226.2, cx: 68, cy: 227, wave: 3 },
  { id: 'ridge-arch1-bot', d: 'M 75 335 C 88 360 105 374 122 382', length: 67.2, cx: 98, cy: 358, wave: 3 },

  // Wave 4: Outermost Shield Arch 0
  { id: 'ridge-arch0-crest', d: 'M 262 58 Q 195 32 135 48 Q 95 70 75 95', length: 210.2, cx: 168, cy: 58, wave: 4 },
  { id: 'ridge-arch0-mid', d: 'M 75 95 C 46 138 32 190 32 245 C 32 278 40 308 52 335', length: 252.9, cx: 47, cy: 215, wave: 4 },
  { id: 'ridge-arch0-low', d: 'M 52 335 C 68 368 100 390 145 400', length: 116.9, cx: 98, cy: 367, wave: 4 },

  // Wave 5: Accents and Right-Side Anchors
  { id: 'ridge-accent-bot', d: 'M 205 342 L 245 342', length: 40.0, cx: 225, cy: 342, wave: 5 },
  { id: 'ridge-accent-lat1', d: 'M 268 195 Q 266 215 262 235', length: 40.5, cx: 265, cy: 215, wave: 5 },
  { id: 'ridge-accent-lat2', d: 'M 278 260 Q 272 278 265 295', length: 37.4, cx: 271, cy: 277, wave: 5 },
  { id: 'ridge-accent-lat3', d: 'M 322 170 Q 315 185 308 200', length: 33.1, cx: 315, cy: 185, wave: 5 }
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
