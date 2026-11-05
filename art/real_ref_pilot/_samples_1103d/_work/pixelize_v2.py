# -*- coding: utf-8 -*-
"""像素化 v2（2026-11-05）：用 unfake.py（MIT，pip 套件）「每格取主色」取代舊版 BOX 平均縮圖。
舊版（walk_pixelize.process）先 BOX 平均再量化，邊緣顏色被平均成中間色，縮小後偏糊。
新版：把原圖調成「目標尺寸 × 4」（場景 720×1280、方圖 512×512），再以 manual_scale=4、dominant 法逐格取主色，
      最後依 mode 決定調色盤：
        fixed：用既有共用調色盤（場景 84 色、人物道具 96 色），維持全站一致（忠實版用這個）
        auto ：由 unfake 自動挑 max_colors 色（風格衍生版用這個，例如 cyberpunk 的霓虹色不在共用調色盤內）
用法：python -X utf8 pixelize_v2.py scene|square 名稱 原圖.png [fixed|auto] [max_colors]
"""
import sys, json, os
from pathlib import Path
from PIL import Image
import unfake

OUT = Path('E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103d')
PAL_SCENE = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103/palette_scene_sample.json'
PAL_SHARED = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/npc_pixel16/palette_shared.json'
SIZES = {'scene': (180, 320), 'square': (128, 128)}
SCALE = 4


def hexes(path):
    d = json.load(open(path, encoding='utf-8'))
    if isinstance(d, dict):
        d = d.get('palette') or d.get('colors') or list(d.values())[0]
    return ['#%02x%02x%02x' % tuple(int(v) for v in c[:3]) for c in d]


def pixelize(kind, name, src, mode='fixed', max_colors=48, suffix=''):
    tw, th = SIZES[kind]
    im = Image.open(src).convert('RGB')
    # 等比裁切到目標長寬比，再放大到 4 倍格（取主色前先讓每格剛好 4×4 原圖像素）
    r = tw / th
    w, h = im.size
    if w / h > r:
        nw = int(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / r); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im = im.resize((tw * SCALE, th * SCALE), Image.LANCZOS)
    # 11-05 對照：dominant＋jaggy 會把細橫木板紋切成磚紋（愛國婦人會館二樓）；median 不開 jaggy 保住紋理。環境變數 PIX_METHOD 可換回
    meth = os.environ.get('PIX_METHOD', 'median')
    kw = dict(manual_scale=SCALE, downscale_method=meth, snap_grid=False, cleanup={'morph': False, 'jaggy': meth == 'dominant'})
    if mode == 'fixed':
        kw['fixed_palette'] = hexes(PAL_SCENE if kind == 'scene' else PAL_SHARED)
    else:
        kw['max_colors'] = int(max_colors)
    res = unfake.process_image_sync(im, **kw)
    out = res['image'].convert('RGB')
    # median 會在格內產生新的中間色 ⇒ 縮完再量化回上限（不抖色）；fixed 模式對回共用調色盤
    if mode == 'fixed':
        pal = [int(h[i:i + 2], 16) for h in kw['fixed_palette'] for i in (1, 3, 5)]
        pimg = Image.new('P', (1, 1)); pimg.putpalette(pal + [0] * (768 - len(pal)))
        out = out.quantize(palette=pimg, dither=Image.Dither.NONE).convert('RGB')
    elif len(out.getcolors(1 << 20) or []) > int(max_colors):
        out = out.quantize(colors=int(max_colors), method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    if out.size != (tw, th):
        out = out.resize((tw, th), Image.NEAREST)
    stem = name + suffix
    p = OUT / ('%s_%dx%d.png' % (stem, tw, th)) if kind == 'scene' else OUT / ('%s_%d.png' % (stem, tw))
    out.save(p)
    out.resize((tw * 3, th * 3), Image.NEAREST).save(OUT / ('%s_x3.png' % stem))
    return {'name': stem, 'kind': kind, 'mode': mode, 'colors': len(out.getcolors(4096) or []), 'size': out.size,
            'ms': res['manifest'].get('processing_time_ms') if isinstance(res.get('manifest'), dict) else None, 'out': str(p)}


if __name__ == '__main__':
    a = sys.argv
    print(json.dumps(pixelize(a[1], a[2], a[3], a[4] if len(a) > 4 else 'fixed', a[5] if len(a) > 5 else 48), ensure_ascii=False))
