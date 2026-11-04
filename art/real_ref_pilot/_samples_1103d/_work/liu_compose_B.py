# -*- coding: utf-8 -*-
"""劉永福方法 B（零 GPU）：真實臉部縮成與底圖同一格寬（8 px 格）的小點陣，色彩對齊底圖調色盤，羽化合成回臉部橢圓。
底圖 liu_yongfu_1896.png 是 1024 方形、每格 8 px。臉區 (480,112)-(688,344) = 26x29 格。"""
import numpy as np, sys
from PIL import Image, ImageFilter, ImageEnhance
A = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/'
W = A + '_samples_1103d/_work/'
base = Image.open(A + 'liu_yongfu_1896.png').convert('RGB')
src = Image.open('E:/Downloads/_walk_refs/portrait/liu_yongfu_1896.jpg').convert('RGB')
import os
CELL = int(os.environ.get('CELL','8')); X0, Y0, GW, GH = 480, 112, 208 // CELL, 232 // CELL
# 真實臉：目視（方格校準）x385..460,y462..535，臉寬約 70；取與格子同長寬比 26:29
cx, cy, cw = 422, 497, 80
ch = int(cw * 232 / 208)
face = src.crop((cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2))
face = face.resize((face.width * 4, face.height * 4), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=4, percent=180, threshold=2))
face = ImageEnhance.Contrast(face).enhance(1.45)
small = face.resize((GW, GH), Image.BOX)
# 調色盤＝底圖臉部附近用過的顏色（最多 40 色，避免整張調色盤太雜）
reg = base.crop((X0 - 40, Y0 - 40, X0 + GW * CELL + 40, Y0 + GH * CELL + 40))
pal = reg.quantize(colors=40, method=Image.MEDIANCUT, dither=Image.NONE)
q = small.quantize(palette=pal, dither=Image.NONE).convert('RGB')
big = q.resize((GW * CELL, GH * CELL), Image.NEAREST)
mask = Image.new('L', base.size, 0)
from PIL import ImageDraw
ImageDraw.Draw(mask).ellipse((X0 + 4, Y0 + 2, X0 + GW * CELL - 4, Y0 + GH * CELL - 2), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(8))
layer = base.copy(); layer.paste(big, (X0, Y0))
out = Image.composite(layer, base, mask)
out.save(A + '_samples_1103d/liu_r2_B_composite_c%d_1024.png' % CELL + '')
cmp = Image.new('RGB', (1024 * 2 // 2, 512), (240, 236, 226))
cmp.paste(base.resize((512, 512), Image.NEAREST), (0, 0)); cmp.paste(out.resize((512, 512), Image.NEAREST), (512, 0))
cmp.save(A + '_samples_1103d/liu_B_compare_c%d.png' % CELL + '')
print('ok', len(set(q.getdata())), 'colors in face')
