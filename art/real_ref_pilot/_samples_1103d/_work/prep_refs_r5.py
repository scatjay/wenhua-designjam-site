# -*- coding: utf-8 -*-
"""r5 場景參考照預處理（r4 品檢後再修）：門洞改素色金門板（不再塗純黑）、patriotic 天空改用左側相鄰欄位複製（去色塊）、
hall_B 緊裁版再把屋頂設備塗成素灰。其餘沿用 prep_refs_r4 的徽章／匾額／楹聯／人影框。"""
import numpy as np
from PIL import Image
import importlib.util, sys
IN = 'E:/ComfyUI_windows_portable_0529/ComfyUI/input/'
GOLD = (178, 126, 44)
def fill_box(a, box, col, s):
    x0, y0, x1, y1 = [int(round(v * s)) for v in box]; h, w = a.shape[:2]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(w, x1), min(h, y1)
    if col is None:
        m = 6
        ring = np.concatenate([a[max(0, y0 - m):y0, x0:x1].reshape(-1, 3), a[y1:y1 + m, x0:x1].reshape(-1, 3),
                               a[y0:y1, max(0, x0 - m):x0].reshape(-1, 3), a[y0:y1, x1:x1 + m].reshape(-1, 3)])
        col = np.median(ring, axis=0).astype(np.uint8)
    a[y0:y1, x0:x1] = col
JOBS = {
 'hayashi_A': [((230, 30, 335, 72), None)],
 'hayashi_B': [((165, 30, 355, 100), None)],
 'matsu_A': [((185, 395, 490, 450), None), ((95, 420, 130, 640), None), ((160, 420, 200, 640), None),
             ((540, 420, 575, 640), None), ((555, 430, 590, 600), None), ((480, 560, 550, 625), None),
             ((35, 480, 95, 620), None), ((620, 470, 640, 600), None), ((260, 480, 400, 640), GOLD)],
 'matsu_B': [((140, 330, 500, 395), None), ((5, 375, 35, 640), None), ((215, 415, 245, 625), None),
             ((425, 415, 450, 625), None), ((455, 395, 480, 560), None), ((595, 395, 640, 560), None),
             ((550, 570, 610, 640), None), ((0, 600, 100, 640), None), ((240, 470, 440, 630), GOLD)],
}
for n, boxes in JOBS.items():
    im = Image.open(IN + 's1103d_r2_%s.png' % n).convert('RGB'); a = np.array(im); s = im.width / 640
    for box, col in boxes: fill_box(a, box, col, s)
    if n.startswith('matsu'):  # 金門板中央加一條細縫（雙扇門）
        x = int(round({'matsu_A': 330, 'matsu_B': 340}[n] * s)); y0 = int(round({'matsu_A': 480, 'matsu_B': 470}[n] * s)); y1 = int(round(630 * s)) if n == 'matsu_B' else a.shape[0]
        a[y0:y1, x - 1:x + 1] = (110, 74, 24)
    Image.fromarray(a).save(IN + 's1103d_r5_%s.png' % n); print(n)
# patriotic_A：天空右上角用左側相鄰欄位（x 380~510）同列像素複製
im = Image.open(IN + 's1103d_r2_patriotic_A.png').convert('RGB'); a = np.array(im); s = im.width / 640
x0, y0, x1, y1 = [int(round(v * s)) for v in (510, 170, 640, 205)]
w = x1 - x0; a[y0:y1, x0:x1] = a[y0:y1, x0 - w:x0]
x0, y0, x1, y1 = [int(round(v * s)) for v in (380, 370, 400, 415)]; a[y0:y1, x0:x1] = (22, 16, 16)
Image.fromarray(a).save(IN + 's1103d_r5_patriotic_A.png'); print('patriotic_A')
# hall_B：屋頂設備塗素灰
im = Image.open(IN + 's1103d_r4_hall_B.png').convert('RGB'); a = np.array(im)
a[350:480, 480:745] = (178, 178, 184)
Image.fromarray(a).save(IN + 's1103d_r5_hall_B.png'); print('hall_B')
