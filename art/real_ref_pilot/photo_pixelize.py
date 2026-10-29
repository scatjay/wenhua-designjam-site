# -*- coding: utf-8 -*-
"""不用生成式模型：真實照片 → 16 位元風場景（裁 9:16、BOX 縮到 180×320、提高飽和、中位切分色盤、邊緣加深）。零 GPU、零下載。"""
import sys
from PIL import Image, ImageEnhance, ImageFilter, ImageChops
W, H = 180, 320
def pix(src, out, ncol=28, edge=70, dark=0.62, focus=0.5):
    im = Image.open(src).convert('RGB'); w, h = im.size
    tw = int(h * W / H)
    if tw <= w: x0 = int((w - tw) * focus); im = im.crop((x0, 0, x0 + tw, h))
    else:
        th = int(w * H / W); y0 = (h - th) // 2; im = im.crop((0, y0, w, y0 + th))
    im = im.resize((W * 2, H * 2), Image.LANCZOS).resize((W, H), Image.BOX)
    im = im.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.SMOOTH); im = ImageEnhance.Color(im).enhance(1.3); im = ImageEnhance.Contrast(im).enhance(1.08)
    g = im.convert('L'); e = g.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > edge else 0)
    q = im.quantize(colors=ncol, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    dk = q.point(lambda v: int(v * dark))
    q = Image.composite(dk, q, e)
    q.save(out + '_180x320.png'); q.resize((W * 3, H * 3), Image.NEAREST).save(out + '_x3.png')
    return len(set(q.getdata()))
if __name__ == '__main__':
    print(pix(sys.argv[1], sys.argv[2]))
