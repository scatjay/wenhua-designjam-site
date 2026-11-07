# -*- coding: utf-8 -*-
"""Q8 與 Q4_K_S 並排聯絡表＋數字表。用法：python make_cmp_sheet.py
讀 RAW 的 768 原圖、後處理的 128 圖、兩份 *_gen.json（峰值、unet、text_scan）；輸出聯絡表 PNG 與表格文字。"""
import json, os, sys
from PIL import Image, ImageDraw

RAW = 'E:/Downloads/_walk_refs/_raw/_samples_1103d/'
D = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103d/'
S = 'C:/Users/user/AppData/Local/Temp/claude/95791ac1e5ee61d4/c1191369-0d37-48e7-8d65-ccaaeec5530a/scratchpad/'
BASES = ['char_a03_strategist_r4_s7121', 'char_a11_safety_r4_s7201', 'char_a16_actor_r4_s7251']
OUT = S + 'cmp_q8_q4_sheet.png'


def gen(p):
    try:
        return json.load(open(p, encoding='utf-8'))
    except Exception:
        return {}


g8, g4 = gen(S + 'v2cmpq8_gen.json'), gen(S + 'v2cmpq4_gen.json')


def rec(g, name):
    for r in g.get('jobs', []) or []:
        if r.get('name') == name:
            return r
    return {}


def ncolors(p):
    try:
        return len(set(Image.open(p).convert('RGB').getdata()))
    except Exception:
        return None


W = 384
sheet = Image.new('RGB', (W * 4, (W + 20) * len(BASES)), (30, 30, 30))
dr = ImageDraw.Draw(sheet)
print('| 圖 | 模型 | 原圖KB | 128圖KB | 色數 | text_scan(n/pct) |')
print('|---|---|---|---|---|---|')
for i, b in enumerate(BASES):
    for j, tag in enumerate(('q8', 'q4')):
        n = '%s_cmp_%s' % (b, tag)
        rp = RAW + n + '.png'
        sp = D + n + '_128.png'
        y = i * (W + 20)
        if os.path.exists(rp):
            sheet.paste(Image.open(rp).convert('RGB').resize((W, W)), (j * W, y + 20))
        if os.path.exists(sp):
            sheet.paste(Image.open(sp).convert('RGB').resize((W, W), Image.NEAREST), ((2 + j) * W, y + 20))
        dr.text((j * W + 4, y + 4), '%s raw %s' % (n[-30:], tag.upper()), fill=(255, 255, 0))
        dr.text(((2 + j) * W + 4, y + 4), '128px %s' % tag.upper(), fill=(255, 255, 0))
        g = g8 if tag == 'q8' else g4
        ts = rec(g, n).get('text_scan', {})
        print('| %s | %s | %s | %s | %s | %s/%s |' % (b, tag.upper(),
              round(os.path.getsize(rp) / 1024) if os.path.exists(rp) else '無', round(os.path.getsize(sp) / 1024, 1) if os.path.exists(sp) else '無',
              ncolors(sp) if os.path.exists(sp) else '無', ts.get('n', '無'), ts.get('pct', '無')))
sheet.save(OUT)
print('contact sheet:', OUT)
for tag, g in (('Q8', g8), ('Q4', g4)):
    print(tag, 'unet=%s peak=%s total_sec=%s boot=%s' % (g.get('unet'), g.get('peak'), g.get('total_sec'), g.get('boot_wait_sec')))
