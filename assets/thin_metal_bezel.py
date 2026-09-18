"""Radially compress the brushed-metal bezel of the circular gauge."""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

ROOT = Path(r"E:\Repositores\svetlana sedlova_designer\assets")
SRC = ROOT / "vi-bf-gauge-original.png"
OUT_FULL = ROOT / "vi-bf-gauge-thin-metal-final.png"
OUT_CROP = ROOT / "vi-bf-gauge-thin-metal-crop-final.png"

CX, CY = 975.0, 332.0
INNER_KEEP = 224.0  # LED outer edge — keep unchanged
METAL_SRC_END = 300.0  # original metal outer (ignore corner lugs)
METAL_DST_THICK = 22.0  # new metal thickness — slim bezel
METAL_DST_END = INNER_KEEP + METAL_DST_THICK
GAUGE_SRC_END = 380.0  # original disc including lugs / glow
BG_SAMPLE = 336.0  # dark studio just outside metal


def src_radius(r: np.ndarray) -> np.ndarray:
    r_src = np.empty_like(r)
    inner = r <= INNER_KEEP
    metal = (r > INNER_KEEP) & (r <= METAL_DST_END)
    outer = r > METAL_DST_END

    r_src[inner] = r[inner]
    t = (r[metal] - INNER_KEEP) / METAL_DST_THICK
    r_src[metal] = INNER_KEEP + t * (METAL_SRC_END - INNER_KEEP)
    # Shift leftover ring onto original background, skip the bulky lugs.
    r_src[outer] = BG_SAMPLE + (r[outer] - METAL_DST_END) * 0.15
    return r_src


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    arr = np.asarray(im, dtype=np.float32)
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    dx = xx - CX
    dy = yy - CY
    r = np.sqrt(dx * dx + dy * dy)
    ang = np.arctan2(dy, dx)

    r_src = src_radius(r)
    xs = CX + r_src * np.cos(ang)
    ys = CY + r_src * np.sin(ang)

    out = np.empty_like(arr)
    for c in range(3):
        out[:, :, c] = map_coordinates(
            arr[:, :, c],
            [ys, xs],
            order=1,
            mode="nearest",
        )

    # Only rewrite pixels that belonged to the original gauge disc.
    mask = r <= GAUGE_SRC_END
    result = arr.copy()
    result[mask] = out[mask]
    result = np.clip(result, 0, 255).astype(np.uint8)

    Image.fromarray(result).save(OUT_FULL, "PNG")

    pad = int(METAL_DST_END + 48)
    x0 = max(0, int(CX - pad))
    y0 = max(0, int(CY - pad))
    x1 = min(w, int(CX + pad))
    y1 = min(h, int(CY + pad))
    Image.fromarray(result).crop((x0, y0, x1, y1)).save(OUT_CROP, "PNG")
    print("saved", OUT_FULL, OUT_CROP, "crop", x0, y0, x1, y1)


if __name__ == "__main__":
    main()
