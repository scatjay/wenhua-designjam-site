# -*- coding: utf-8 -*-
"""生圖後去字閘門 v2（2026-11-05）：FLUX 會自己「長出」招牌、對聯、海報上的偽字，生圖前去字擋不住。
流程：生成圖 → Florence 逐一片語定位（base 與 Flux-Large 兩個模型取聯集；丟掉 >15% 畫面的框＝誤判整張）
      → 框膨脹 → FLUX.1 Fill（Q3_K_S GGUF）在原解析度把框內補成素面 → 存 <名>_dt.png 與框列表。
量測依據：_work/ocr_probe2.py／ocr_probe2_result.json（純 OCR 對偽字 0%；片語定位三張都對到偽字位置）。
注意：定位也會框到少數非文字小物件，Fill 只是把它們補成素面，品檢仍要人眼看。
用法：python -X utf8 detext_v2.py 原圖1.png [原圖2.png ...]   （原圖在 _walk_refs/_raw/_samples_1103d/）
"""
import sys, json, time, shutil, os
sys.path.insert(0, 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103d/_work')
import pipe_v2 as P
import numpy as np, cv2
from PIL import Image
from pathlib import Path

cc = P.cc
BS = chr(92)
PHRASES = ['text', 'chinese characters', 'sign with writing', 'banner', 'couplet', 'plaque',
           'writing on the pillar', 'vertical red strip with gold writing']
# Florence 每個片語只回一個框，左右對稱的一對對聯只抓得到一邊 ⇒ 原圖與左右翻轉圖各偵測一次取聯集（11-05 媽祖廟實測）
MODELS = ['Florence-2-base', 'Florence-2-Flux-Large']
MAX_PCT = 15.0
# 保護清單：辨識特徵常被誤判成字（11-05 媽祖廟石獅被補掉）⇒ 定位後從遮罩扣除；可用環境變數 PROTECT 以句點分隔覆寫
PROTECT = [x.strip() for x in os.environ.get('PROTECT', 'stone lion. lion statue. dragon pillar. lantern').split('.') if x.strip()]
import os
# 正面描述（FLUX 不懂否定，寫「no letters」反而招字）；可用環境變數 FILL_PROMPT 依場景換
FILL_PROMPT = os.environ.get('FILL_PROMPT', 'smooth plain dark red lacquered wood surface with a thin gold edge, '
               'evenly lit like its surroundings, chunky 16-bit pixel art')


def wf_ground(img, model, ph):
    return {'1': {'class_type': 'LoadImage', 'inputs': {'image': img}},
            '2': {'class_type': 'Florence2ModelLoader', 'inputs': {'model': model, 'precision': 'fp16', 'attention': 'sdpa'}},
            '3': {'class_type': 'Florence2Run', 'inputs': {'image': ['1', 0], 'florence2_model': ['2', 0], 'text_input': ph, 'task': 'caption_to_phrase_grounding',
                  'fill_mask': True, 'keep_model_loaded': True, 'num_beams': 3, 'max_new_tokens': 1024, 'do_sample': False, 'seed': 1}},
            '4': {'class_type': 'MaskToImage', 'inputs': {'mask': ['3', 1]}},
            '5': {'class_type': 'SaveImage', 'inputs': {'images': ['4', 0], 'filename_prefix': 'v2gate/m'}}}


def wf_fill(img, mask, seed, prefix):
    return {
        '1': {'class_type': 'LoadImage', 'inputs': {'image': img}},
        '2': {'class_type': 'LoadImageMask', 'inputs': {'image': mask, 'channel': 'red'}},
        '3': {'class_type': 'ImpactGaussianBlurMask', 'inputs': {'mask': ['2', 0], 'kernel_size': 9, 'sigma': 3.0}},
        '9': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': 'flux1-fill-dev-Q3_K_S.gguf'}},
        '10': {'class_type': 'DifferentialDiffusion', 'inputs': {'model': ['9', 0]}},
        '11': {'class_type': 'DualCLIPLoader', 'inputs': {'clip_name1': P.P['clip1'], 'clip_name2': P.P['clip2'], 'type': 'flux'}},
        '12': {'class_type': 'VAELoader', 'inputs': {'vae_name': P.P['vae']}},
        '13': {'class_type': 'CLIPTextEncode', 'inputs': {'text': FILL_PROMPT, 'clip': ['11', 0]}},
        '14': {'class_type': 'FluxGuidance', 'inputs': {'conditioning': ['13', 0], 'guidance': 30.0}},
        '15': {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': ['13', 0]}},
        '16': {'class_type': 'InpaintModelConditioning', 'inputs': {'positive': ['14', 0], 'negative': ['15', 0], 'vae': ['12', 0], 'pixels': ['1', 0], 'mask': ['3', 0], 'noise_mask': True}},
        '17': {'class_type': 'KSampler', 'inputs': {'model': ['10', 0], 'seed': seed, 'steps': 20, 'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'normal',
                                                    'positive': ['16', 0], 'negative': ['16', 1], 'latent_image': ['16', 2], 'denoise': 1.0}},
        '18': {'class_type': 'VAEDecode', 'inputs': {'samples': ['17', 0], 'vae': ['12', 0]}},
        '19': {'class_type': 'SaveImage', 'inputs': {'images': ['18', 0], 'filename_prefix': 'v2gate/' + prefix}}}


def detect(fn):
    """回傳 (遮罩 uint8, 框列表, 秒)。"""
    t = time.time()
    src = Image.open(P.IN / fn)
    W, H = src.size
    union = np.zeros((H, W), np.uint8)
    boxes = []
    ffn = 'flip_' + fn
    src.transpose(Image.FLIP_LEFT_RIGHT).save(P.IN / ffn)
    for flip, img in [(False, fn), (True, ffn)]:
      for model in MODELS:
        for ph in PHRASES:
            h, _ = P.run(wf_ground(img, model, ph), img, 600)
            im = P.outputs(h)[0]
            m = (np.array(Image.open(P.D / 'output' / im.get('subfolder', '') / im['filename']).convert('L').resize((W, H))) > 127).astype(np.uint8)
            if flip:
                m = np.ascontiguousarray(m[:, ::-1])
            k, lab, st, _ = cv2.connectedComponentsWithStats(m)
            for i in range(1, k):
                pct = st[i][4] / m.size * 100
                if pct <= MAX_PCT:
                    union[lab == i] = 255
                    boxes.append({'model': model[-5:], 'phrase': ph, 'flip': flip, 'x': int(st[i][0]), 'y': int(st[i][1]), 'w': int(st[i][2]), 'h': int(st[i][3]), 'pct': round(pct, 2)})
    k = max(5, W // 60)
    union = cv2.dilate(union, np.ones((k, k), np.uint8), iterations=1)
    prot = np.zeros((H, W), np.uint8)
    for flip, img in [(False, fn), (True, ffn)]:
        for ph in PROTECT:
            h, _ = P.run(wf_ground(img, MODELS[1], ph), img, 600)
            im = P.outputs(h)[0]
            m = (np.array(Image.open(P.D / 'output' / im.get('subfolder', '') / im['filename']).convert('L').resize((W, H))) > 127).astype(np.uint8)
            if flip:
                m = np.ascontiguousarray(m[:, ::-1])
            if m.mean() * 100 <= 40:
                prot |= m * 255
    union[prot > 0] = 0
    boxes.append({'protect_pct': round(float((prot > 0).mean()) * 100, 2)})
    return union, boxes, round(time.time() - t, 1)


def gate(raw, seed=777):
    raw = Path(raw)
    fn = 'v2gate_in_' + raw.name
    shutil.copy(raw, P.IN / fn)
    mask, boxes, sec_det = detect(fn)
    rec = {'name': raw.stem, 'boxes': boxes, 'mask_pct': round(float((mask > 0).mean()) * 100, 2), 'sec_detect': sec_det}
    out = P.RAW / (raw.stem + '_dt.png')
    if not boxes:
        shutil.copy(raw, out)
        rec['sec_fill'] = 0
    else:
        mfn = 'v2gate_mask_' + raw.stem + '.png'
        Image.fromarray(mask).convert('RGB').save(P.IN / mfn)
        Image.fromarray(mask).save(P.DBG / (raw.stem + '_gate_mask.png'))
        h, rec['sec_fill'] = P.run(wf_fill(fn, mfn, seed, 'dt_' + raw.stem), raw.stem + '_fill', 900)
        im = P.outputs(h)[0]
        shutil.copy(P.D / 'output' / im.get('subfolder', '') / im['filename'], out)
    rec['out'] = str(out)
    return rec


if __name__ == '__main__':
    srv = str(P.RAW / 'server_v2.log')
    P.boot(srv)
    recs = []
    try:
        for a in sys.argv[1:]:
            r = gate(a)
            recs.append(r)
            print(r['name'], 'boxes', len(r['boxes']), 'mask%', r['mask_pct'], 'det', r['sec_detect'], 'fill', r['sec_fill'], flush=True)
    finally:
        cc.stop_server(); P.release()
        json.dump(recs, open(P.RAW / 'detext_v2_log.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
