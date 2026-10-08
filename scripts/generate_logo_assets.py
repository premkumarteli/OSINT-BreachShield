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

def make_transparent(rgb_img, bg_color=(1.0, 8.0, 20.0), low_cut=10.0, high_cut=100.0):
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

    # 1. Square Emblem Icon (the Fingerprint + B + dispersing cubes)
    # x: 68..332 (264), y: 42..306 (264)
    crop_box_icon = (68, 42, 332, 306)
    icon_solid_raw = src.crop(crop_box_icon)
    icon_trans_raw = make_transparent(icon_solid_raw, low_cut=7.0, high_cut=85.0)

    # High-res 512x512
    icon_512 = icon_trans_raw.resize((512, 512), Image.Resampling.LANCZOS)
    icon_solid_512 = icon_solid_raw.resize((512, 512), Image.Resampling.LANCZOS)

    # 2. Text Region: BREACHSHIELD + EXPOSURE INTELLIGENCE
    # x: 334..945 (611), y: 130..232 (102)
    crop_box_text = (334, 130, 945, 232)
    text_solid_raw = src.crop(crop_box_text)
    text_trans_raw = make_transparent(text_solid_raw, low_cut=10.0, high_cut=95.0)

    # Scale text down by 25% (0.75x) as requested
    new_text_w = int(text_solid_raw.width * 0.75)
    new_text_h = int(text_solid_raw.height * 0.75)
    text_trans_scaled = text_trans_raw.resize((new_text_w, new_text_h), Image.Resampling.LANCZOS)
    text_solid_scaled = text_solid_raw.resize((new_text_w, new_text_h), Image.Resampling.LANCZOS)

    # Scale icon up by 35% (1.35x) so icon is significantly more visible than text
    new_icon_w = int(icon_solid_raw.width * 1.35)
    new_icon_h = int(icon_solid_raw.height * 1.35)
    icon_trans_scaled = icon_trans_raw.resize((new_icon_w, new_icon_h), Image.Resampling.LANCZOS)
    icon_solid_scaled = icon_solid_raw.resize((new_icon_w, new_icon_h), Image.Resampling.LANCZOS)

    # 1. Vertical Stacked Logo (Icon on top, BreachShield text at bottom)
    # Icon: 320x320
    icon_w, icon_h = 320, 320
    icon_stack_trans = icon_trans_raw.resize((icon_w, icon_h), Image.Resampling.LANCZOS)
    icon_stack_solid = icon_solid_raw.resize((icon_w, icon_h), Image.Resampling.LANCZOS)

    # Text scaled proportionally under the icon
    text_w = 280
    text_h = int(text_solid_raw.height * (text_w / text_solid_raw.width))
    text_stack_trans = text_trans_raw.resize((text_w, text_h), Image.Resampling.LANCZOS)
    text_stack_solid = text_solid_raw.resize((text_w, text_h), Image.Resampling.LANCZOS)

    gap_y = 10
    total_stack_w = max(icon_w, text_w) + 20
    total_stack_h = icon_h + gap_y + text_h + 10

    logo_trans = Image.new("RGBA", (total_stack_w, total_stack_h), (0, 0, 0, 0))
    icon_x = (total_stack_w - icon_w) // 2
    logo_trans.paste(icon_stack_trans, (icon_x, 5), icon_stack_trans)
    text_x = (total_stack_w - text_w) // 2
    text_y = 5 + icon_h + gap_y
    logo_trans.paste(text_stack_trans, (text_x, text_y), text_stack_trans)

    logo_solid = Image.new("RGB", (total_stack_w, total_stack_h), (1, 8, 20))
    logo_solid.paste(icon_stack_solid, (icon_x, 5))
    logo_solid.paste(text_stack_solid, (text_x, text_y))

    # Also generate Horizontal Logo variant
    gap_x = 22
    total_h_w = icon_w + gap_x + new_text_w
    total_h_h = icon_h
    logo_horiz_trans = Image.new("RGBA", (total_h_w, total_h_h), (0, 0, 0, 0))
    logo_horiz_trans.paste(icon_trans_scaled, (0, 0), icon_trans_scaled)
    text_h_y = (total_h_h - new_text_h) // 2
    logo_horiz_trans.paste(text_trans_scaled, (icon_w + gap_x, text_h_y), text_trans_scaled)

    # Save to frontend/public
    # Full logos (Stacked is default logo.png)
    logo_trans.save(os.path.join(PUBLIC_DIR, "logo.png"), optimize=True)
    logo_trans.save(os.path.join(PUBLIC_DIR, "logo-vertical.png"), optimize=True)
    logo_horiz_trans.save(os.path.join(PUBLIC_DIR, "logo-horizontal.png"), optimize=True)
    logo_solid.save(os.path.join(PUBLIC_DIR, "logo-solid.png"), optimize=True)

    # Square icon
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
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_stack_w} {total_stack_h}" width="100%" height="100%">
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="{total_stack_w}" height="{total_stack_h}" />
</svg>
'''
    with open(os.path.join(REPO_DIR, "frontend", "src", "logo.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)

    print("All BreachShield logo & icon assets generated successfully!")

if __name__ == "__main__":
    main()
