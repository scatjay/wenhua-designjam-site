# 手動框補：python -X utf8 fill_box.py 原圖.png x0 y0 x1 y1 "正面提示詞" 輸出名 [seed]（座標＝原圖像素）
import sys, shutil
import detext_v2 as G
import numpy as np
from PIL import Image
P = G.P; cc = P.cc
src, x0, y0, x1, y1, prompt, name = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6], sys.argv[7]
seed = int(sys.argv[8]) if len(sys.argv) > 8 else 4242
G.FILL_PROMPT = prompt
im = Image.open(src); W, H = im.size
m = np.zeros((H, W), np.uint8); m[y0:y1, x0:x1] = 255
fn = 'fillbox_in_' + name + '.png'; mfn = 'fillbox_mask_' + name + '.png'
shutil.copy(src, P.IN / fn); Image.fromarray(m).convert('RGB').save(P.IN / mfn)
P.boot(str(P.RAW / 'server_v2.log'))
try:
    h, sec = P.run(G.wf_fill(fn, mfn, seed, 'fb_' + name), name, 900)
    o = P.outputs(h)[0]
    out = P.RAW / (name + '.png')
    shutil.copy(P.D / 'output' / o.get('subfolder', '') / o['filename'], out)
    print('OK', out, sec)
finally:
    cc.stop_server(); P.release()
