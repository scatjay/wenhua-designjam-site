# 一次開機連續補多個框：python -X utf8 fill_multi.py 原圖.png 輸出名 框清單.json
# 框清單＝[{"box":[x0,y0,x1,y1],"prompt":"正面提示詞"},...]，座標＝原圖像素
import sys, json, shutil
import detext_v2 as G
import numpy as np
from PIL import Image
P = G.P; cc = P.cc
src, name, lst = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3], encoding='utf-8'))
P.boot(str(P.RAW / 'server_v2.log'))
cur = src
try:
    for i, it in enumerate(lst):
        im = Image.open(cur); W, H = im.size
        x0, y0, x1, y1 = it['box']
        m = np.zeros((H, W), np.uint8); m[y0:y1, x0:x1] = 255
        fn = 'fm_in_%s_%d.png' % (name, i); mfn = 'fm_mask_%s_%d.png' % (name, i)
        shutil.copy(cur, P.IN / fn); Image.fromarray(m).convert('RGB').save(P.IN / mfn)
        G.FILL_PROMPT = it['prompt']
        h, sec = P.run(G.wf_fill(fn, mfn, 4242 + i, 'fm_%s_%d' % (name, i)), name, 900)
        o = P.outputs(h)[0]
        out = P.RAW / ('%s_s%d.png' % (name, i))
        shutil.copy(P.D / 'output' / o.get('subfolder', '') / o['filename'], out)
        cur = str(out); print('step', i, it['box'], sec, flush=True)
    shutil.copy(cur, P.RAW / (name + '.png')); print('OK', name)
finally:
    cc.stop_server(); P.release()
