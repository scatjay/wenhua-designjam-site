# -*- coding: utf-8 -*-
"""r4 道具／貼紙「程式先畫」：生成式重生兩輪仍畫不出的固定元件，改由 PIL 以 128 像素直接畫（無抗鋸齒、共用米色底）。
  - prop_inkline_r4：在 r3 墨斗旁畫出 L 形曲尺（兩臂成直角）
  - prop_facebrick_r4：整張程式畫，酒紅與褐黃兩色面磚錯縫
  - stk_seal_split_r4：在 r3 羅盤章上畫三條向不同方向分岔的足跡
  - stk_seal_gather_r4：整張程式畫，金邊圓章、小紅旗、五顆相同棋子
  - stk_first_room_r4／stk_dex_collect_r4：把 r3 圖放到圓角方形底板上（去背後貼上），first_room 另畫黃銅小鑰匙
輸出 *_r4_128.png；32×32 輪廓驗收見 check32()。"""
import numpy as np
from PIL import Image, ImageDraw
D = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103d/'
BG = (248, 231, 190)
def load(n): return Image.open(D + n + '_128.png').convert('RGB')
def canvas(): return Image.new('RGB', (128, 128), BG)
def keyed(im, tol=10):
    a = np.array(im).astype(int)
    m = (np.abs(a - np.array(BG)).sum(axis=2) > tol * 3)
    rgba = np.dstack([a.astype(np.uint8), (m * 255).astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')

def inkline():
    im = load('prop_inkline_r3'); d = ImageDraw.Draw(im)
    W, DK = (226, 188, 128), (96, 62, 36)
    # L 形曲尺：垂直臂 + 水平臂，外框深色、內填淺木色，右下方
    d.polygon([(74, 70), (86, 70), (86, 104), (112, 104), (112, 116), (74, 116)], fill=DK)
    d.polygon([(77, 73), (83, 73), (83, 107), (109, 107), (109, 113), (77, 113)], fill=W)
    for y in range(80, 108, 6): d.line([(77, y), (79, y)], fill=DK)           # 刻度
    for x in range(88, 110, 6): d.line([(x, 111), (x, 113)], fill=DK)
    im.save(D + 'prop_inkline_r4_128.png')

def facebrick():
    im = canvas(); d = ImageDraw.Draw(im)
    RED, YEL, MORT, DK = (146, 58, 46), (192, 142, 72), (222, 212, 192), (92, 56, 40)
    ox, oy, bw, bh, rows = 12, 26, 20, 11, 5
    W = 5 * bw
    d.rectangle([ox, oy, ox + W, oy + rows * bh], fill=MORT)                       # 淺灰灰縫底
    for r in range(rows):
        off = 0 if r % 2 == 0 else bw // 2
        for c in range(-1, 6):
            x0 = ox + c * bw + off + 1; x1 = x0 + bw - 3
            x0c, x1c = max(ox + 1, x0), min(ox + W - 1, x1)
            if x1c - x0c < 5: continue
            col = RED if (r * 2 + c) % 3 != 0 else YEL
            y0 = oy + r * bh + 1; y1 = y0 + bh - 3
            d.rectangle([x0c, y0, x1c, y1], fill=col)
            d.line([(x0c, y0), (x1c, y0)], fill=tuple(min(255, v + 26) for v in col))
            d.line([(x0c, y1), (x1c, y1)], fill=tuple(max(0, v - 26) for v in col))
    d.rectangle([ox, oy, ox + W, oy + rows * bh], outline=DK)
    d.rectangle([ox + 3, oy + rows * bh + 1, ox + W + 3, oy + rows * bh + 5], fill=(222, 204, 160))
    im.save(D + 'prop_facebrick_r4_128.png')

def feet(d, cx, cy, ang_deg, n, r0, r1, col):
    import math
    a = math.radians(ang_deg); ux, uy = math.cos(a), -math.sin(a); vx, vy = -uy, ux
    def blob(x, y, rx, ry, c):
        pts = [(x + ux * rx * math.cos(t) + vx * ry * math.sin(t), y + uy * rx * math.cos(t) + vy * ry * math.sin(t)) for t in [i * math.pi / 8 for i in range(16)]]
        d.polygon(pts, fill=c)
    for i in range(n):
        r = r0 + (r1 - r0) * i / (n - 1); side = -1 if i % 2 == 0 else 1
        x, y = cx + r * ux + vx * 4 * side, cy + r * uy + vy * 4 * side
        for (dx, rx, ry, c) in ((0, 6.5, 4.5, (70, 40, 26)), (-8, 4.5, 3.5, (70, 40, 26))):
            blob(x + ux * dx, y + uy * dx, rx, ry, c)
        for (dx, rx, ry) in ((0, 5, 3), (-8, 3, 2)):
            blob(x + ux * dx, y + uy * dx, rx, ry, (252, 242, 214))

def split():
    im = load('stk_seal_split_r3'); d = ImageDraw.Draw(im)
    for ang in (90, 210, 330):                       # 向上、左下、右下三個方向
        feet(d, 64, 64, ang, 3, 22, 42, None)
    im.save(D + 'stk_seal_split_r4_128.png')

def gather():
    im = canvas(); d = ImageDraw.Draw(im)
    d.ellipse([3, 3, 124, 124], fill=(255, 255, 255))                   # 白色貼紙描邊
    d.ellipse([6, 6, 121, 121], fill=(150, 98, 30))                     # 金邊外
    d.ellipse([10, 10, 117, 117], fill=(226, 172, 60))                  # 金邊
    d.ellipse([18, 18, 109, 109], fill=(246, 206, 112))                 # 章面
    d.ellipse([24, 24, 70, 62], fill=(252, 226, 150))                   # 高光
    d.rectangle([62, 28, 65, 84], fill=(96, 62, 36))                    # 旗桿
    d.polygon([(66, 30), (92, 38), (66, 48)], fill=(200, 40, 40)); d.line([(66, 30), (92, 38), (66, 48)], fill=(110, 20, 20))
    pts = [(30, 84), (47, 94), (64, 98), (81, 94), (98, 84)]            # 旗腳下一排五顆
    for (x, y) in pts:
        d.ellipse([x - 11, y - 11, x + 11, y + 11], fill=(46, 36, 60))
        d.ellipse([x - 10, y - 10, x + 10, y + 10], fill=(64, 116, 178))
        d.ellipse([x - 6, y - 7, x - 1, y - 2], fill=(150, 196, 236))
    im.save(D + 'stk_seal_gather_r4_128.png')

def plate(base):
    im = canvas(); d = ImageDraw.Draw(im)
    d.rounded_rectangle([4, 4, 123, 123], radius=22, fill=(255, 255, 255))           # 白色貼紙描邊
    d.rounded_rectangle([7, 7, 120, 120], radius=20, fill=(120, 78, 44))             # 深色外框
    d.rounded_rectangle([10, 10, 117, 117], radius=18, fill=(238, 208, 150))         # 方形底板
    sp = keyed(load(base)).resize((100, 100), Image.NEAREST)
    im.paste(sp, (14, 12), sp)
    return im

def first_room():
    im = plate('stk_first_room_r3'); d = ImageDraw.Draw(im)
    B, DK = (222, 168, 40), (110, 70, 20)
    d.ellipse([84, 88, 98, 102], fill=DK); d.ellipse([86, 90, 96, 100], fill=B); d.ellipse([89, 93, 93, 97], fill=(238, 208, 150))   # 鑰匙環
    d.rectangle([96, 94, 114, 96], fill=DK); d.rectangle([96, 94, 114, 95], fill=B)                                                 # 鑰匙桿
    d.rectangle([106, 96, 108, 101], fill=DK); d.rectangle([111, 96, 113, 100], fill=DK)                                            # 鑰匙齒
    im.save(D + 'stk_first_room_r4_128.png')

def dex():
    plate('stk_dex_collect_r3').save(D + 'stk_dex_collect_r4_128.png')

def check32(names):
    """32×32 輪廓驗收：縮小後非底色像素占比與對比；回傳 {名稱:(占比%, 標準差)}，並輸出放大並排圖。"""
    res = {}; tiles = []
    for n in names:
        sm = Image.open(D + n + '_128.png').convert('RGB').resize((32, 32), Image.BOX)
        a = np.array(sm).astype(int)
        fg = (np.abs(a - np.array(BG)).sum(axis=2) > 40)
        res[n] = (round(float(fg.mean()) * 100, 1), round(float(a.std()), 1)); tiles.append(sm.resize((128, 128), Image.NEAREST))
    sheet = Image.new('RGB', (len(tiles) * 136 + 8, 144), (40, 40, 40))
    for i, t in enumerate(tiles): sheet.paste(t, (8 + i * 136, 8))
    sheet.save(D + 'thumb32_r4_props_stickers.png')
    return res

if __name__ == '__main__':
    inkline(); facebrick(); split(); gather(); first_room(); dex()
    names = ['prop_inkline_r4', 'prop_facebrick_r4', 'stk_seal_split_r4', 'stk_seal_gather_r4', 'stk_first_room_r4', 'stk_dex_collect_r4']
    for k, v in check32(names).items(): print(k, '前景%', v[0], '標準差', v[1])
    sheet = Image.new('RGB', (len(names) * 264 + 8, 264), (40, 40, 40))
    for i, n in enumerate(names): sheet.paste(Image.open(D + n + '_128.png').resize((256, 256), Image.NEAREST), (8 + i * 264, 4))
    sheet.save(D + 'contact_r4_props_stickers.png')
