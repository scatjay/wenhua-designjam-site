# 量測二：逐一片語定位、base 與 Flux-Large 兩種模型；列出每個連通框（丟掉 >25% 畫面的）
import sys, json
sys.path.insert(0, 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103d/_work')
import pipe_v2 as P
import numpy as np, cv2
from PIL import Image
cc = P.cc
names = ['scene_patriotic_A_v2_faithful', 'scene_matsu_B_v2_faithful', 'scene_patriotic_A_v2_tainanpunk']
phrases = ['text', 'chinese characters', 'sign with writing', 'poster', 'banner', 'couplet', 'plaque']
def wf(img, model, ph):
    return {'1': {'class_type': 'LoadImage', 'inputs': {'image': img}},
            '2': {'class_type': 'Florence2ModelLoader', 'inputs': {'model': model, 'precision': 'fp16', 'attention': 'sdpa'}},
            '3': {'class_type': 'Florence2Run', 'inputs': {'image': ['1', 0], 'florence2_model': ['2', 0], 'text_input': ph, 'task': 'caption_to_phrase_grounding',
                  'fill_mask': True, 'keep_model_loaded': True, 'num_beams': 3, 'max_new_tokens': 1024, 'do_sample': False, 'seed': 1}},
            '4': {'class_type': 'MaskToImage', 'inputs': {'mask': ['3', 1]}},
            '5': {'class_type': 'SaveImage', 'inputs': {'images': ['4', 0], 'filename_prefix': 'v2probe/m'}}}
assert cc.start_server(str(P.RAW / 'server_v2.log'))
print('lease', P.lease('ocrprobe2', 14)[:30])
res = {}
try:
    for model in ['Florence-2-base', 'Florence-2-Flux-Large']:
        for n in names:
            fn = 'v2out_' + n + '.png'
            for ph in phrases:
                h, sec = P.run(wf(fn, model, ph), n, 600)
                im = P.outputs(h)[0]
                m = (np.array(Image.open(P.D / 'output' / im.get('subfolder', '') / im['filename']).convert('L')) > 127).astype(np.uint8)
                k, lab, st, _ = cv2.connectedComponentsWithStats(m)
                A = m.size
                boxes = [tuple(int(v) for v in st[i][:4]) + (round(st[i][4] / A * 100, 1),) for i in range(1, k)]
                print(model[-5:], n[6:], ph, 'sec', sec, boxes, flush=True)
                res.setdefault(model, {}).setdefault(n, {})[ph] = boxes
finally:
    cc.stop_server(); P.release()
json.dump(res, open('ocr_probe2.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
