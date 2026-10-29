# -*- coding: utf-8 -*-
"""試作後處理包裝：一律呼叫 test_tools/walk_pixelize.py 的 process()（沒有改該檔）。
場景（非正方形）：先 BOX 縮到 180x320，貼到 320x320 的米色畫布正中，process(size=320) 等於不縮放、
只做它的「近背景色→統一米色」「右下角小印記」「共用調色盤」三步，再裁回中間 180 欄；另輸出放大 3 倍（540x960）。
用法：python -X utf8 postproc.py <名稱> <FLUX原圖.png> <scene|prop|portrait>
"""
import sys, json
sys.path.insert(0, 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/test_tools')
import walk_pixelize as wp
from PIL import Image
from pathlib import Path

OUT = Path('E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot')


def run(name, src, kind):
    if kind == 'scene':
        im = Image.open(src).convert('RGB').resize((180, 320), Image.BOX)
        pad = Image.new('RGB', (320, 320), wp.BG)
        pad.paste(im, (70, 0))
        tmp = OUT / ('_tmp_' + name + '.png')
        pad.save(tmp)
        base = str(OUT / ('_tmp_out_' + name))
        n, nb = wp.process(str(tmp), base, 320)
        q = Image.open(base + '_320.png').convert('RGB').crop((70, 0, 250, 320))
        q.save(OUT / (name + '_180x320.png'))
        q.resize((540, 960), Image.NEAREST).save(OUT / (name + '_x3.png'))
        for f in (tmp, Path(base + '_320.png'), Path(base + '.png')):
            f.unlink()
        colors = len(set(q.getdata()))
        bgpx = sum(1 for p in q.getdata() if p == wp.BG)
        return {'name': name, 'size': q.size, 'colors': colors, 'bg_snapped_pct': round(100 * bgpx / (180 * 320), 1), 'corner_cleared_px': nb}
    base = str(OUT / name)
    n, nb = wp.process(src, base, 128)
    q = Image.open(base + '_128.png')
    bgpx = sum(1 for p in q.convert('RGB').getdata() if p == wp.BG)
    return {'name': name, 'size': q.size, 'colors': n, 'bg_snapped_pct': round(100 * bgpx / (128 * 128), 1), 'corner_cleared_px': nb}


if __name__ == '__main__':
    print(json.dumps(run(sys.argv[1], sys.argv[2], sys.argv[3]), ensure_ascii=False))
