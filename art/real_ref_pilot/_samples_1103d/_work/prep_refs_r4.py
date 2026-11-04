# -*- coding: utf-8 -*-
"""r4 場景參考照預處理：把徽章、匾額、楹聯、公告牌、殿內人影塗成素面（框以 640 座標系記，依原圖尺寸等比換算）。
輸入＝ComfyUI/input/s1103d_r2_*.png（舊檔不動）；輸出＝同資料夾新檔 s1103d_r4_*.png。fill=None 取框外 6px 環的中位色，或給 RGB 固定色。"""
import numpy as np
from PIL import Image
IN = 'E:/ComfyUI_windows_portable_0529/ComfyUI/input/'
DARK = (22, 16, 16)
JOBS = {
 'hayashi_A': [((230, 30, 335, 72), None)],
 'hayashi_B': [((165, 30, 355, 100), None)],
 'matsu_A': [((185, 395, 490, 450), None), ((95, 420, 130, 640), None), ((160, 420, 200, 640), None),
             ((540, 420, 575, 640), None), ((555, 430, 590, 600), None), ((480, 560, 550, 625), None),
             ((35, 480, 95, 620), None), ((620, 470, 640, 600), None), ((260, 480, 400, 640), DARK)],
 'matsu_B': [((140, 330, 500, 395), None), ((5, 375, 35, 640), None), ((215, 415, 245, 625), None),
             ((425, 415, 450, 625), None), ((455, 395, 480, 560), None), ((595, 395, 640, 560), None),
             ((550, 570, 610, 640), None), ((0, 600, 100, 640), None), ((240, 470, 440, 630), DARK)],
 'patriotic_A': [((510, 178, 640, 200), None), ((380, 370, 400, 415), DARK)],
}
def fill(a, box, col, s):
    x0, y0, x1, y1 = [int(round(v * s)) for v in box]
    h, w = a.shape[:2]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(w, x1), min(h, y1)
    if col is None:
        m = 6
        ring = np.concatenate([a[max(0, y0 - m):y0, x0:x1].reshape(-1, 3), a[y1:y1 + m, x0:x1].reshape(-1, 3),
                               a[y0:y1, max(0, x0 - m):x0].reshape(-1, 3), a[y0:y1, x1:x1 + m].reshape(-1, 3)])
        col = np.median(ring, axis=0).astype(np.uint8)
    a[y0:y1, x0:x1] = col
for n, boxes in JOBS.items():
    im = Image.open(IN + 's1103d_r2_%s.png' % n).convert('RGB'); a = np.array(im); s = im.width / 640
    for box, col in boxes: fill(a, box, col, s)
    Image.fromarray(a).save(IN + 's1103d_r4_%s.png' % n); print(n, im.size, len(boxes), 'boxes')
# hall_B：沒有別的鳥瞰角度（核准清單只有 HAL1 一張鳥瞰），改為緊裁：去掉周邊高樓、街上車輛與右下日期戳
src = Image.open('E:/Downloads/_walk_refs/_cand2/scene/HAL1.jpg').convert('RGB')
crop = src.crop((220, 260, 900, 940)).resize((768, 768), Image.LANCZOS)
crop.save(IN + 's1103d_r4_hall_B.png'); print('hall_B crop', crop.size)
