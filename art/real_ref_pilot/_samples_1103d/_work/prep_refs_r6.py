# -*- coding: utf-8 -*-
"""r6 場景參考照預處理：不再用純色塊（會被模型畫成突兀方塊），改為
  - 文字／徽章區：cv2.inpaint（內容感知填補）
  - 門洞：程式畫素色金門板（雙扇、細縫、重複菱紋，無文字）
  - hall_B 屋頂設備：複製上方灰瓦屋頂內容
  - patriotic_A：在參考照上把一樓右側細長窗描成明確的八角形
  - lingyou_A：程式畫三開間立面樣板（雙龍、三尊小像、紅橫楣、黃燈籠、藍綠木門），自繪無授權疑慮
座標沿用 prep_refs_r4／r5（640 座標系，依原圖等比換算）。"""
import numpy as np, cv2
from PIL import Image, ImageDraw
IN = 'E:/ComfyUI_windows_portable_0529/ComfyUI/input/'
def box_px(box, s): return [int(round(v * s)) for v in box]
def inpaint(a, boxes, s, radius=6):
    m = np.zeros(a.shape[:2], np.uint8)
    for b in boxes:
        x0, y0, x1, y1 = box_px(b, s); m[max(0, y0):y1, max(0, x0):x1] = 255
    return cv2.inpaint(a[:, :, ::-1].copy(), m, radius, cv2.INPAINT_TELEA)[:, :, ::-1].copy()
def door(a, box, s):
    x0, y0, x1, y1 = box_px(box, s); h, w = a.shape[:2]; x1, y1 = min(x1, w), min(y1, h)
    im = Image.fromarray(a); d = ImageDraw.Draw(im); wd, ht = x1 - x0, y1 - y0
    for yy in range(ht):                                   # 金色縱向漸層
        t = yy / max(1, ht - 1); c = (int(196 - 38 * t), int(146 - 34 * t), int(58 - 16 * t))
        d.line([(x0, y0 + yy), (x1, y0 + yy)], fill=c)
    d.rectangle([x0, y0, x1, y1], outline=(96, 62, 24), width=max(2, int(3 * s)))
    mid = (x0 + x1) // 2; d.line([(mid, y0), (mid, y1)], fill=(96, 62, 24), width=max(2, int(2 * s)))
    step = max(10, int(22 * s))
    for leaf in ((x0, mid), (mid, x1)):                    # 每扇內框＋菱紋（純幾何、無字）
        lx0, lx1 = leaf[0] + step // 2, leaf[1] - step // 2
        d.rectangle([lx0, y0 + step // 2, lx1, y1 - step // 2], outline=(122, 84, 30), width=max(1, int(2 * s)))
        for cy in range(y0 + step, y1 - step, step):
            cx = (lx0 + lx1) // 2; r = step // 3
            d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], outline=(224, 178, 84))
    return np.array(im)
def prep(name_in, name_out, ops):
    im = Image.open(IN + name_in).convert('RGB'); a = np.array(im); s = im.width / 640
    for op in ops: a = op(a, s)
    Image.fromarray(a).save(IN + name_out); print(name_out)
# hayashi_B：山牆徽章區與牆面小菱形飾，內容感知填補
prep('s1103d_r2_hayashi_B.png', 's1103d_r6_hayashi_B.png', [lambda a, s: inpaint(a, [(165, 30, 355, 100), (60, 105, 100, 165)], s, 8)])
# matsu_A／B：匾額、楹聯、公告牌、黑底書法板改為內容感知填補，門洞畫金門板
MA = [(185, 395, 490, 450), (95, 420, 130, 640), (160, 420, 200, 640), (540, 420, 575, 640), (555, 430, 590, 600), (480, 560, 550, 625), (35, 480, 95, 620), (620, 470, 640, 600)]
MB = [(140, 330, 500, 395), (5, 375, 35, 640), (215, 415, 245, 625), (425, 415, 450, 625), (455, 395, 480, 560), (595, 395, 640, 560), (550, 570, 610, 640), (0, 600, 100, 640)]
prep('s1103d_r2_matsu_A.png', 's1103d_r6_matsu_A.png', [lambda a, s: inpaint(a, MA, s, 7), lambda a, s: door(a, (260, 480, 400, 640), s)])
prep('s1103d_r2_matsu_B.png', 's1103d_r6_matsu_B.png', [lambda a, s: inpaint(a, MB, s, 7), lambda a, s: door(a, (240, 470, 440, 630), s)])
# hall_B：以上方灰瓦屋頂內容覆蓋屋頂設備
def hall(a, s):
    a = a.copy(); a[350:480, 480:745] = a[190:320, 250:515]; return a
prep('s1103d_r4_hall_B.png', 's1103d_r6_hall_B.png', [hall])
# patriotic_A：一樓右側窗描成細長八角形（寬 40、高 73，640 座標）
def octo(a, s):
    im = Image.fromarray(a); d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = [v * s for v in (488, 345, 528, 418)]; c = 12 * s
    pts = [(x0 + c, y0), (x1 - c, y0), (x1, y0 + c), (x1, y1 - c), (x1 - c, y1), (x0 + c, y1), (x0, y1 - c), (x0, y0 + c)]
    d.polygon(pts, fill=(40, 36, 38), outline=(206, 196, 172))
    d.line(pts + [pts[0]], fill=(206, 196, 172), width=max(3, int(4 * s)))
    return np.array(im)
prep('s1103d_r5_patriotic_A.png', 's1103d_r6_patriotic_A.png', [octo])
# lingyou_A：程式畫三開間立面樣板
W, H = 576, 1024
im = Image.new('RGB', (W, H), (70, 150, 200)); d = ImageDraw.Draw(im)
for (cx, cy, r) in ((110, 120, 46), (150, 110, 56), (420, 170, 44), (460, 160, 52)): d.ellipse([cx - r, cy - r // 2, cx + r, cy + r // 2], fill=(238, 244, 250))
d.polygon([(30, 440), (60, 372), (516, 372), (546, 440)], fill=(36, 130, 130))                     # 藍綠瓦面
for yy in range(380, 440, 12): d.line([(48 + (yy - 380) // 2, yy), (528 - (yy - 380) // 2, yy)], fill=(24, 96, 100))
d.rectangle([60, 350, 516, 372], fill=(30, 110, 112))                                              # 屋脊
for cx in (150, 426):                                                                              # 雙龍
    d.ellipse([cx - 44, 300, cx + 44, 352], fill=(218, 160, 40)); d.ellipse([cx - 14 if cx < 288 else cx + 2, 288, cx + 30 if cx < 288 else cx + 18, 322], fill=(240, 190, 70))
for cx in (258, 288, 318):                                                                         # 三尊小像
    d.ellipse([cx - 8, 304, cx + 8, 320], fill=(236, 190, 80)); d.rectangle([cx - 10, 320, cx + 10, 352], fill=(208, 150, 40))
d.rectangle([30, 440, 546, 484], fill=(196, 40, 32))                                               # 朱紅橫楣
d.rectangle([30, 484, 546, 770], fill=(176, 98, 46))                                               # 左右紅磚牆
for cx in range(70, 520, 52): d.ellipse([cx - 11, 490, cx + 11, 520], fill=(244, 200, 40))        # 黃燈籠
d.rectangle([196, 484, 380, 770], fill=(150, 80, 40))
for x in (196, 350): d.rectangle([x, 484, x + 34, 770], fill=(186, 186, 190), outline=(110, 110, 116))   # 石柱
d.rectangle([232, 520, 348, 770], fill=(40, 138, 150), outline=(24, 90, 100)); d.line([(290, 520), (290, 770)], fill=(24, 90, 100), width=3)
d.rectangle([0, 770, W, H], fill=(168, 168, 174))
for yy in range(770, H, 40): d.line([(0, yy), (W, yy)], fill=(138, 138, 144))
for (x0, x1, y) in ((180, 396, 770), (160, 416, 790)): d.rectangle([x0, y, x1, y + 14], fill=(196, 196, 200))
im.save(IN + 's1103d_r6_lingyou_A.png'); print('s1103d_r6_lingyou_A.png')
