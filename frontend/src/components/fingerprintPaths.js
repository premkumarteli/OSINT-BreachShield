// Extracted vector ridge curves and geometric data fragments from BreachShield logo identity
// Precision-derived from logo-icon-mark.png (viewBox 0 0 409 409)

export const FINGERPRINT_RIDGES = [
  // Core & Inner Whorl (Wave 0: Stagger delay ~0.0s - 0.3s)
  { id: "ridge-core-1", d: "M 235 187 L 228 202 L 218 221 L 209 251 L 202 274 L 192 291", length: 158.1, cx: 214.0, cy: 237.7, wave: 0 },
  { id: "ridge-core-2", d: "M 200 173 L 188 178 L 165 184 L 148 188", length: 57.5, cx: 175.2, cy: 180.8, wave: 0 },
  { id: "ridge-core-3", d: "M 163 132 L 168 137 L 212 138", length: 51.1, cx: 181.0, cy: 135.7, wave: 0 },
  { id: "ridge-core-4", d: "M 169 210 L 176 211 L 195 212 L 210 213", length: 59.2, cx: 187.5, cy: 211.5, wave: 0 },
  { id: "ridge-core-5", d: "M 177 252 L 172 258 L 165 272 L 161 284", length: 99.3, cx: 168.8, cy: 266.5, wave: 0 },

  // Mid Concentric Arcs (Wave 1: Stagger delay ~0.25s - 0.6s)
  { id: "ridge-mid-1", d: "M 124 239 L 110 263 L 95 284 L 83 299", length: 73.0, cx: 103.0, cy: 271.2, wave: 1 },
  { id: "ridge-mid-2", d: "M 105 203 L 98 214 L 89 231 L 83 244", length: 46.5, cx: 93.8, cy: 223.0, wave: 1 },
  { id: "ridge-mid-3", d: "M 111 137 L 103 148 L 94 163 L 86 175", length: 45.5, cx: 98.5, cy: 155.8, wave: 1 },
  { id: "ridge-mid-4", d: "M 126 168 L 123 173 L 116 186 L 108 197", length: 38.0, cx: 118.2, cy: 181.0, wave: 1 },
  { id: "ridge-mid-5", d: "M 135 251 L 133 262 L 131 278 L 129 290", length: 39.5, cx: 132.0, cy: 270.2, wave: 1 },
  { id: "ridge-mid-6", d: "M 128 292 L 121 306 L 109 322 L 98 333", length: 51.1, cx: 114.0, cy: 313.2, wave: 1 },

  // Outer Shield Curve & Crest (Wave 2: Stagger delay ~0.5s - 0.85s)
  { id: "ridge-outer-1", d: "M 191 68 L 166 70 L 144 76 L 122 84 L 108 95", length: 92.4, cx: 146.2, cy: 78.6, wave: 2 },
  { id: "ridge-outer-2", d: "M 64 113 L 53 126 L 44 141 L 38 150", length: 63.4, cx: 49.8, cy: 132.5, wave: 2 },
  { id: "ridge-outer-3", d: "M 62 160 L 51 176 L 43 194", length: 39.0, cx: 52.0, cy: 176.7, wave: 2 },
  { id: "ridge-outer-4", d: "M 81 362 L 105 369 L 135 374 L 165 378 L 191 381", length: 120.2, cx: 135.4, cy: 372.8, wave: 2 },
  { id: "ridge-outer-5", d: "M 230 324 L 222 338 L 210 351 L 202 360", length: 42.1, cx: 216.0, cy: 343.2, wave: 2 },

  // Lateral Connecting Bridges & Right Segments (Wave 3: Stagger delay ~0.75s - 1.1s)
  { id: "ridge-lat-1", d: "M 284 270 L 278 284 L 271 296 L 268 303", length: 39.0, cx: 275.2, cy: 288.2, wave: 3 },
  { id: "ridge-lat-2", d: "M 278 197 L 275 206 L 273 222 L 271 236", length: 41.2, cx: 274.2, cy: 215.2, wave: 3 },
  { id: "ridge-lat-3", d: "M 282 59 L 276 65 L 269 60 L 272 69", length: 28.6, cx: 274.6, cy: 63.6, wave: 3 },
  { id: "ridge-lat-4", d: "M 348 71 L 338 81 L 332 76 L 331 90", length: 44.3, cx: 335.8, cy: 82.2, wave: 3 },
  { id: "ridge-lat-5", d: "M 339 166 L 334 172 L 328 178 L 322 186", length: 32.5, cx: 330.8, cy: 175.5, wave: 3 },
  { id: "ridge-lat-6", d: "M 375 129 L 382 136 L 392 147", length: 56.0, cx: 383.0, cy: 137.3, wave: 3 },
  { id: "ridge-lat-7", d: "M 374 225 L 366 233 L 358 241 L 352 248", length: 34.0, cx: 362.5, cy: 236.8, wave: 3 }
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
