# -*- coding: utf-8 -*-
"""r7 場景「程式補畫關鍵部位」：對已生成的 180×320 像素圖做局部修補（cv2.inpaint 去徽章／空白牌／字牌；PIL 畫細長八角窗），
修補後以 PIL 量化回 ≤84 色。座標為圖面像素（看 patchview 格線目視取得）。輸出 *_fix_180x320.png（不覆蓋原圖）。"""
import numpy as np, cv2
from PIL import Image, ImageDraw
D = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103d/'
def load(n): return Image.open(D + n + '_180x320.png').convert('RGB')
def inpaint(im, boxes, r=3):
    a = np.array(im); m = np.zeros(a.shape[:2], np.uint8)
    for x0, y0, x1, y1 in boxes: m[y0:y1, x0:x1] = 255
    return Image.fromarray(cv2.inpaint(a[:, :, ::-1].copy(), m, r, cv2.INPAINT_TELEA)[:, :, ::-1].copy())
def save(im, n):
    q = im.quantize(colors=84, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    q.save(D + n + '_fix_180x320.png'); q.resize((540, 960), Image.NEAREST).save(D + n + '_fix_x3.png')
    print(n, len(q.getcolors(4096)), 'colors')
# 林百貨風格 B（r5）：山牆菱形章與空白牌去除
im = inpaint(load('scene_hayashi_B_r5'), [(80, 28, 95, 45), (95, 44, 150, 79)], 4); d = ImageDraw.Draw(im)
for b in ((43, 160, 54, 170), (68, 157, 81, 167), (92, 152, 105, 163)):   # 陽台三個圓孔：內部白色像字的符號改成素色深洞
    d.ellipse(list(b), fill=(30, 24, 26))
save(im, 'scene_hayashi_B_r5')
# 媽祖廟 A（r6）：橫楣小牌去字
save(inpaint(load('scene_matsu_A_r6'), [(66, 178, 112, 196), (32, 210, 41, 282), (136, 210, 145, 282), (30, 282, 47, 305), (131, 282, 148, 305)], 3), 'scene_matsu_A_r6')   # 橫楣小牌、兩柱直排金色筆畫、柱礎刻痕
# 媽祖廟 B（r5）：橫楣牌去字
save(inpaint(load('scene_matsu_B_r5'), [(38, 176, 138, 198), (62, 78, 120, 90)], 3), 'scene_matsu_B_r5')   # 下橫楣牌＋上層匾
# 愛國婦人會 A（r5）：一樓右側圓窗改畫細長八角窗（寬 16、高 36，切角 5）
im = load('scene_patriotic_A_r5'); d = ImageDraw.Draw(im)
x0, y0, x1, y1, c = 149, 174, 165, 210, 5
pts = [(x0 + c, y0), (x1 - c, y0), (x1, y0 + c), (x1, y1 - c), (x1 - c, y1), (x0 + c, y1), (x0, y1 - c), (x0, y0 + c)]
d.polygon(pts, fill=(34, 30, 32)); d.line(pts + [pts[0]], fill=(204, 194, 170), width=2)
d.line([(x0 + 8, y0 + 3), (x0 + 8, y1 - 3)], fill=(70, 62, 60))
save(im, 'scene_patriotic_A_r5')
