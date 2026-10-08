#!/usr/bin/env python3
"""
Generate high-fidelity BreachShield logo and icon assets for frontend.
"""
import os
import numpy as np
from PIL import Image

SRC_PATH = r"C:/Users/prem/.gemini/antigravity/brain/0e0bc738-caa9-4994-a75c-25cdfe8799a5/.user_uploaded/media_1791480803721.png"
REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(REPO_DIR, "frontend", "public")
SRC_ASSETS_DIR = os.path.join(REPO_DIR, "frontend", "src", "assets")

os.makedirs(PUBLIC_DIR, exist_ok=True)
os.makedirs(SRC_ASSETS_DIR, exist_ok=True)

def make_transparent(rgb_img, bg_color=(1.0, 8.0, 20.0), low_cut=10.0, high_cut=90.0):
    arr = np.array(rgb_img, dtype=np.float32)
    bg_arr = np.broadcast_to(np.array(bg_color, dtype=np.float32), arr.shape)
    diff = np.maximum(0, arr - bg_arr)
    v = np.max(diff, axis=2)
    
    alpha = np.clip((v - low_cut) / (high_cut - low_cut), 0.0, 1.0)
    alpha_3d = np.repeat(alpha[:, :, np.newaxis], 3, axis=2)
    
    fg = np.zeros_like(arr)
    valid = alpha_3d > 0.02
    fg[valid] = np.clip((arr[valid] - (1.0 - alpha_3d[valid]) * bg_arr[valid]) / alpha_3d[valid], 0.0, 255.0)
    
    rgba = np.dstack([fg, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")

def main():
    if not os.path.exists(SRC_PATH):
        raise FileNotFoundError(f"Source image not found: {SRC_PATH}")
        
    src = Image.open(SRC_PATH).convert("RGB")
    print(f"Loaded source image: {src.size}")

    # 1. Extract Square Emblem Icon (the Fingerprint + B + dispersing cubes)
    # x: 75..335 (260), y: 48..300 (252) -> clean square containing full glow
    crop_box_icon = (75, 48, 335, 300)
    icon_solid_raw = src.crop(crop_box_icon)
    icon_trans_raw = make_transparent(icon_solid_raw)

    # 2. Extract BREACHSHIELD Wordmark ONLY (strictly excluding EXPOSURE INTELLIGENCE)
    # x: 338..942 (604), y: 136..196 (60)
    crop_box_text = (338, 136, 942, 196)
    text_solid_raw = src.crop(crop_box_text)
    text_trans_raw = make_transparent(text_solid_raw)

    # 3. Create Balanced 1:1 Lockup (Icon height matches Text height visually, no tagline)
    target_h = 220
    icon_w = int(icon_trans_raw.width * target_h / icon_trans_raw.height)
    icon_resized = icon_trans_raw.resize((icon_w, target_h), Image.Resampling.LANCZOS)
    icon_solid_resized = icon_solid_raw.resize((icon_w, target_h), Image.Resampling.LANCZOS)

    # Optical text height: ~88% of icon height (194px) perfectly aligns with circular icon weight
    text_h = int(target_h * 0.88)
    text_w = int(text_trans_raw.width * text_h / text_trans_raw.height)
    text_resized = text_trans_raw.resize((text_w, text_h), Image.Resampling.LANCZOS)
    text_solid_resized = text_solid_raw.resize((text_w, text_h), Image.Resampling.LANCZOS)

    gap = 36
    total_w = icon_w + gap + text_w
    y_offset = (target_h - text_h) // 2

    # Transparent balanced lockup
    logo_trans = Image.new("RGBA", (total_w, target_h), (0, 0, 0, 0))
    logo_trans.paste(icon_resized, (0, 0), icon_resized)
    logo_trans.paste(text_resized, (icon_w + gap, y_offset), text_resized)

    # Solid balanced lockup (with obsidian background)
    logo_solid = Image.new("RGB", (total_w, target_h), (1, 8, 20))
    logo_solid.paste(icon_solid_resized, (0, 0))
    logo_solid.paste(text_solid_resized, (icon_w + gap, y_offset))

    # 4. High-res standalone square icon (512x512)
    icon_512 = icon_trans_raw.resize((512, 512), Image.Resampling.LANCZOS)
    icon_solid_512 = icon_solid_raw.resize((512, 512), Image.Resampling.LANCZOS)

    # Save to frontend/public
    # Balanced logos
    logo_trans.save(os.path.join(PUBLIC_DIR, "logo.png"), optimize=True)
    logo_solid.save(os.path.join(PUBLIC_DIR, "logo-solid.png"), optimize=True)

    # Square icons
    icon_512.save(os.path.join(PUBLIC_DIR, "logo-icon.png"), optimize=True)
    icon_solid_512.save(os.path.join(PUBLIC_DIR, "logo-icon-solid.png"), optimize=True)

    # PWA icons
    icon_192 = icon_512.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join(PUBLIC_DIR, "logo192.png"), optimize=True)
    icon_512.save(os.path.join(PUBLIC_DIR, "logo512.png"), optimize=True)

    # Favicons
    fav_128 = icon_512.resize((128, 128), Image.Resampling.LANCZOS)
    fav_128.save(os.path.join(PUBLIC_DIR, "favicon.png"), optimize=True)

    # Multi-resolution ICO
    icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)]
    ico_imgs = [icon_512.resize(sz, Image.Resampling.LANCZOS) for sz in icon_sizes]
    ico_imgs[0].save(
        os.path.join(PUBLIC_DIR, "favicon.ico"),
        format="ICO",
        sizes=icon_sizes,
        append_images=ico_imgs[1:]
    )

    # Also save to frontend/src/assets
    logo_trans.save(os.path.join(SRC_ASSETS_DIR, "logo.png"), optimize=True)
    logo_solid.save(os.path.join(SRC_ASSETS_DIR, "logo-solid.png"), optimize=True)
    icon_512.save(os.path.join(SRC_ASSETS_DIR, "logo-icon.png"), optimize=True)
    icon_solid_512.save(os.path.join(SRC_ASSETS_DIR, "logo-icon-solid.png"), optimize=True)

    # Generate lightweight SVG in frontend/src/logo.svg
    import base64
    with open(os.path.join(PUBLIC_DIR, "logo.png"), "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w} {target_h}" width="100%" height="100%">
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="{total_w}" height="{target_h}" />
</svg>
'''
    with open(os.path.join(REPO_DIR, "frontend", "src", "logo.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)

    print(f"All BreachShield logo & icon assets generated successfully! Logo size: {total_w}x{target_h}")

if __name__ == "__main__":
    main()
