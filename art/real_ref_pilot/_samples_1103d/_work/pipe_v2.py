# -*- coding: utf-8 -*-
"""走讀像素美術製程 v2（2026-11-05）：真實照片 → 自動去字 → 深度結構 → FLUX 生圖（可換風格）→ 每格主色像素化。
與 gen3b 的差別：
  1. 去字自動化：Florence-2（本機 Florence-2-base）ocr_with_region 加片語定位（匾額、招牌、對聯）→ 遮罩 → cv2.inpaint，
     不再手估座標、不用純色塊。
  2. 結構保真：去字後照片 → ZoeDepth 深度圖 → XLabs flux-depth-controlnet-v3（ComfyUI 核心 ControlNetApplyAdvanced）；
     Redux 降為只帶色彩材質。深度圖沒有字的筆畫，所以不會把字帶進成品。
  3. 風格：同一張深度圖可換 style 提示詞（faithful／cyberpunk／daopunk／tainanpunk…，見 styles_v2.json）。
  4. 效能：伺服器整批常駐（每 RESTART_EVERY 張才重啟），取樣與解碼同一個工作流；同一張照片的去字結果快取重用；
     保留記憶體租約與 ABORT 看門。
用法：python -X utf8 pipe_v2.py 工單.json 結果.json
工單欄位：name, prompt, seed, w, h, photo（ComfyUI/input 內檔名，可省略＝純提示詞）, redux（0＝不用）,
         cn（深度強度，0＝不用）, cn_end（0~1）, notext_words（片語定位要遮的物件，英文以句點分隔）, steps, guidance
"""
import sys, json, time, shutil, os, subprocess, threading
sys.path.insert(0, 'E:/Downloads/comfy-gen'); sys.path.insert(0, 'E:/Downloads/mcp-governance/tools')
import comfy_core as cc, mem_watchdog as W
# 11-06 楊老師：「這線的 CPU 不要用太多，要留資源給各線」⇒ 執行緒、優先權、核心數三道節流（環境變數可調）
os.environ.setdefault('OMP_NUM_THREADS', os.environ.get('WALK_THREADS', '4'))
os.environ.setdefault('MKL_NUM_THREADS', os.environ.get('WALK_THREADS', '4'))
os.environ.setdefault('OPENBLAS_NUM_THREADS', os.environ.get('WALK_THREADS', '4'))
import numpy as np, cv2
cv2.setNumThreads(int(os.environ.get('WALK_THREADS', '4')))
import psutil
WALK_CORES = int(os.environ.get('WALK_CORES', '4'))      # 只准用最後 N 個邏輯核心（16 核機器上＝25%）


SERVER_PIDS = []


def _fast_server_procs():
    """取代 comfy_core.server_procs：原版對全機 1100+ 行程各讀命令列與記憶體，一次約 17 秒 CPU（11-06 實測）；
    只掃 python.exe 名稱也要約 5 秒。這版改用「誰在監聽 ComfyUI 的埠」查 PID（約 0.02 秒），再只驗證那一個行程的命令列。"""
    out = []
    try:
        pids = {x.pid for x in psutil.net_connections(kind='tcp') if x.status == 'LISTEN' and x.laddr.port == cc.INSTALL['port'] and x.pid}
    except Exception:
        pids = set()
    for pid in pids:
        try:
            p = psutil.Process(pid)
            if any(x.replace(chr(92), '/').endswith(cc.INSTALL['main_suffix']) for x in (p.cmdline() or [])):
                out.append(p)
        except Exception:
            pass
    return out


cc.server_procs = _fast_server_procs      # comfy_core 內的 stop_server、lease 等也會用到這個名稱


def throttle(procs=None):
    """本程序與 ComfyUI 伺服器：降到低於正常優先權、限制核心數。"""
    allc = list(range(psutil.cpu_count()))
    use = allc[-WALK_CORES:] if WALK_CORES < len(allc) else allc
    for p in ([psutil.Process()] + list(procs or [])):
        try:
            p.nice(psutil.BELOW_NORMAL_PRIORITY_CLASS)
            p.cpu_affinity(use)
        except Exception:
            pass
from PIL import Image
from pathlib import Path

RAW = Path('E:/Downloads/_walk_refs/_raw/_samples_1103d')
D = Path(cc.INSTALL['dir']) / 'ComfyUI'
IN = D / 'input'
P = cc.PRESETS['flux-dev-q8']
RESTART_EVERY = int(os.environ.get('RESTART_EVERY', '8'))
ABORT = float(os.environ.get('ABORT_RATIO', '0.875'))
DBG = RAW / 'v2_debug'
DBG.mkdir(parents=True, exist_ok=True)
DEFAULT_WORDS = 'plaque. signboard. couplet. banner. poster. text'


def wf_mask(photo, words):
    w = {'1': {'class_type': 'LoadImage', 'inputs': {'image': photo}},
         '2': {'class_type': 'Florence2ModelLoader', 'inputs': {'model': 'Florence-2-base', 'precision': 'fp16', 'attention': 'sdpa'}},
         '3': {'class_type': 'Florence2Run', 'inputs': {'image': ['1', 0], 'florence2_model': ['2', 0], 'text_input': '', 'task': 'ocr_with_region',
                                                        'fill_mask': True, 'keep_model_loaded': True, 'num_beams': 3, 'max_new_tokens': 1024, 'do_sample': False, 'seed': 1}},
         '4': {'class_type': 'MaskToImage', 'inputs': {'mask': ['3', 1]}},
         '5': {'class_type': 'SaveImage', 'inputs': {'images': ['4', 0], 'filename_prefix': 'v2mask/ocr'}}}
    if words:
        w.update({'6': {'class_type': 'Florence2Run', 'inputs': {'image': ['1', 0], 'florence2_model': ['2', 0], 'text_input': words, 'task': 'caption_to_phrase_grounding',
                                                                 'fill_mask': True, 'keep_model_loaded': False, 'num_beams': 3, 'max_new_tokens': 1024, 'do_sample': False, 'seed': 1}},
                  '7': {'class_type': 'MaskToImage', 'inputs': {'mask': ['6', 1]}},
                  '8': {'class_type': 'SaveImage', 'inputs': {'images': ['7', 0], 'filename_prefix': 'v2mask/grd'}}})
    return w


def wf_gen(j, photo_clean, prefix):
    w = {'1': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': P['unet_gguf']}},
         '2': {'class_type': 'DualCLIPLoader', 'inputs': {'clip_name1': P['clip1'], 'clip_name2': P['clip2'], 'type': 'flux'}},
         '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': P['vae']}},
         '4': {'class_type': 'CLIPTextEncode', 'inputs': {'text': j['prompt'], 'clip': ['2', 0]}},
         '5': {'class_type': 'FluxGuidance', 'inputs': {'conditioning': ['4', 0], 'guidance': j.get('guidance', P['guidance'])}},
         '6': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': j['w'], 'height': j['h'], 'batch_size': 1}},
         '7': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'seed': j['seed'], 'steps': j.get('steps', 24), 'cfg': 1.0, 'sampler_name': P['sampler'],
                                                    'scheduler': P['scheduler'], 'positive': ['5', 0], 'negative': ['5', 0], 'latent_image': ['6', 0], 'denoise': 1.0}},
         '8': {'class_type': 'VAEDecode', 'inputs': {'samples': ['7', 0], 'vae': ['3', 0]}},
         '9': {'class_type': 'SaveImage', 'inputs': {'images': ['8', 0], 'filename_prefix': 'v2/' + prefix}}}
    pos, neg = ['5', 0], ['5', 0]
    if photo_clean and j.get('redux', 0) > 0:
        w.update({'20': {'class_type': 'CLIPVisionLoader', 'inputs': {'clip_name': 'sigclip_vision_patch14_384.safetensors'}},
                  '21': {'class_type': 'StyleModelLoader', 'inputs': {'style_model_name': 'flux1-redux-dev.safetensors'}},
                  '22': {'class_type': 'LoadImage', 'inputs': {'image': photo_clean}},
                  '23': {'class_type': 'CLIPVisionEncode', 'inputs': {'clip_vision': ['20', 0], 'image': ['22', 0], 'crop': 'center'}},
                  '24': {'class_type': 'StyleModelApply', 'inputs': {'conditioning': pos, 'style_model': ['21', 0], 'clip_vision_output': ['23', 0],
                                                                     'strength': j['redux'], 'strength_type': 'multiply'}}})
        pos = ['24', 0]
    if photo_clean and j.get('cn', 0) > 0:
        w.update({'30': {'class_type': 'LoadImage', 'inputs': {'image': photo_clean}},
                  '31': {'class_type': 'Zoe-DepthMapPreprocessor', 'inputs': {'image': ['30', 0], 'resolution': 1024}},
                  '32': {'class_type': 'ImageScale', 'inputs': {'image': ['31', 0], 'upscale_method': 'bilinear', 'width': j['w'], 'height': j['h'], 'crop': 'center'}},
                  '33': {'class_type': 'ControlNetLoader', 'inputs': {'control_net_name': 'flux-depth-controlnet-v3.safetensors'}},
                  '34': {'class_type': 'ControlNetApplyAdvanced', 'inputs': {'positive': pos, 'negative': neg, 'control_net': ['33', 0], 'image': ['32', 0],
                                                                             'strength': j['cn'], 'start_percent': 0.0, 'end_percent': j.get('cn_end', 0.7)}},
                  '35': {'class_type': 'SaveImage', 'inputs': {'images': ['32', 0], 'filename_prefix': 'v2depth/' + prefix}}})
        pos, neg = ['34', 0], ['34', 1]
    # 第二條 ControlNet：canny 邊線（11-06 加；工單 cn2＞0 才啟用，cn2_end 預設 0.6；深度保體塊、canny 保細節線條）
    if photo_clean and j.get('cn2', 0) > 0:
        w.update({'40': {'class_type': 'LoadImage', 'inputs': {'image': photo_clean}},
                  '41': {'class_type': 'CannyEdgePreprocessor', 'inputs': {'image': ['40', 0], 'low_threshold': j.get('canny_lo', 80), 'high_threshold': j.get('canny_hi', 180), 'resolution': 1024}},
                  '42': {'class_type': 'ImageScale', 'inputs': {'image': ['41', 0], 'upscale_method': 'bilinear', 'width': j['w'], 'height': j['h'], 'crop': 'center'}},
                  '43': {'class_type': 'ControlNetLoader', 'inputs': {'control_net_name': 'flux-canny-controlnet-v3.safetensors'}},
                  '44': {'class_type': 'ControlNetApplyAdvanced', 'inputs': {'positive': pos, 'negative': neg, 'control_net': ['43', 0], 'image': ['42', 0],
                                                                             'strength': j['cn2'], 'start_percent': 0.0, 'end_percent': j.get('cn2_end', 0.6)}},
                  '45': {'class_type': 'SaveImage', 'inputs': {'images': ['42', 0], 'filename_prefix': 'v2depth/canny_' + prefix}}})
        pos, neg = ['44', 0], ['44', 1]
    w['7']['inputs']['positive'] = pos
    w['7']['inputs']['negative'] = neg
    return w


def outputs(h, key='images'):
    return [x for o in h['outputs'].values() for x in o.get(key, [])]


def run(wf, name, timeout=1500):
    t = time.time()
    pid = cc._req('/prompt', {'prompt': wf})['prompt_id']
    h = cc._wait(pid, t, {'timeout_sec': timeout}, {'name': name})
    if h.get('status', {}).get('status_str') == 'error':
        raise RuntimeError(json.dumps(h['status'], ensure_ascii=False)[:900])
    return h, round(time.time() - t, 1)


_CLEAN = {}


def clean_photo(j):
    """去字：Florence 遮罩（OCR 與片語定位聯集）膨脹後 cv2.inpaint；同一張照片只做一次。回傳（去字後檔名, 秒, 遮罩占比%）。"""
    key = (j['photo'], j.get('notext_words', DEFAULT_WORDS))
    if key in _CLEAN:
        return _CLEAN[key][0], 0.0, _CLEAN[key][1]
    h, sec = run(wf_mask(j['photo'], j.get('notext_words', DEFAULT_WORDS)), j['name'] + '_mask', 600)
    src = np.array(Image.open(IN / j['photo']).convert('RGB'))
    m = np.zeros(src.shape[:2], np.uint8)
    for im in outputs(h):
        a = np.array(Image.open(D / 'output' / im.get('subfolder', '') / im['filename']).convert('L').resize((src.shape[1], src.shape[0])))
        m |= ((a > 127).astype(np.uint8) * 255)
    k = max(3, src.shape[1] // 120)
    m = cv2.dilate(m, np.ones((k, k), np.uint8), iterations=2)
    out = cv2.inpaint(src[:, :, ::-1].copy(), m, max(5, k * 2), cv2.INPAINT_TELEA)[:, :, ::-1]
    stem = Path(j['photo']).stem
    name = 'v2clean_' + stem + '.png'
    Image.fromarray(out).save(IN / name)
    Image.fromarray(m).save(DBG / (stem + '_mask.png'))
    Image.fromarray(out).save(DBG / (stem + '_clean.png'))
    pct = round(float((m > 0).mean()) * 100, 1)
    _CLEAN[key] = (name, pct)
    return name, sec, pct


def lease(job, est):
    pr = cc.server_procs()
    if pr:
        return subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'set', '--pid', str(pr[0].pid), '--line', 'course-walk-art-v2',
                               '--job', job, '--minutes', '30', '--cap-gb', '32', '--est-gb', str(est)], capture_output=True, text=True, timeout=30).stdout[:200]


def release():
    subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'release'], capture_output=True, text=True, timeout=30)


def boot(srv):
    cc.stop_server()
    tw = time.time()
    while True:
        c0, l0 = W.perf()
        if c0 / 2**30 <= float(os.environ.get('WAIT_GB', '69.0')) or time.time() - tw > 2400:
            break
        time.sleep(10)
    for _ in range(30):
        assert cc.start_server(srv)
        lr = lease('v2batch', os.environ.get('EST_GB', '30'))
        if lr and '✋' not in lr:
            sp = cc.server_procs()                 # 全機掃描很吃 CPU，只在開機時做一次，其餘靠快取的 PID
            SERVER_PIDS[:] = [q.pid for q in sp]
            throttle(sp)
            return round(time.time() - tw)
        print('LEASE_REFUSED', (lr or 'no server proc').strip()[:160], flush=True)
        cc.stop_server()
        time.sleep(40)
    raise RuntimeError('lease refused')


if __name__ == '__main__':
    jobs = json.load(open(sys.argv[1], encoding='utf-8'))
    LOG = Path(sys.argv[2])
    peak = {'commit_gb': 0, 'proc_gb': 0}
    stop = threading.Event()

    def samp():
        while not stop.is_set():
            c, l = W.perf()
            peak['commit_gb'] = max(peak['commit_gb'], c / 2**30)
            if c / l >= ABORT and SERVER_PIDS:
                peak['self_abort'] = round(c / l, 3)
                cc.stop_server()
                SERVER_PIDS[:] = []
            for pid in list(SERVER_PIDS):
                try:
                    peak['proc_gb'] = max(peak['proc_gb'], psutil.Process(pid).memory_info().rss / 2**30)
                except Exception:
                    SERVER_PIDS.remove(pid)
            time.sleep(10)

    threading.Thread(target=samp, daemon=True).start()
    srv = str(RAW / 'server_v2.log')
    recs = []
    t00 = time.time()
    n_since = 0
    boots = []
    try:
        boots.append(boot(srv))
        for j in jobs:
            if n_since >= RESTART_EVERY:
                boots.append(boot(srv))
                n_since = 0
            r = {'name': j['name'], 'seed': j['seed'], 'photo': j.get('photo'), 'redux': j.get('redux'), 'cn': j.get('cn'), 'cn_end': j.get('cn_end'), 'style': j.get('style')}
            t = time.time()
            try:
                clean = None
                if j.get('photo'):
                    clean, r['sec_mask'], r['mask_pct'] = clean_photo(j)
                h, r['sec_gen'] = run(wf_gen(j, clean, 'v2_' + j['name']), j['name'])
                ims = outputs(h)
                main = [i for i in ims if 'v2depth' not in i.get('subfolder', '')][0]
                shutil.copy(D / 'output' / main.get('subfolder', '') / main['filename'], RAW / (j['name'] + '.png'))
                for d in ims:
                    if 'v2depth' in d.get('subfolder', ''):
                        shutil.copy(D / 'output' / d['subfolder'] / d['filename'], DBG / (j['name'] + '_depth.png'))
                r['raw'] = str(RAW / (j['name'] + '.png'))
            except Exception as e:
                r['error'] = str(e)[:900]
                if not cc.server_up():
                    boots.append(boot(srv))
                    n_since = 0
            r['sec_total'] = round(time.time() - t, 1)
            recs.append(r)
            n_since += 1
            print(r['name'], r.get('sec_mask'), r.get('sec_gen'), r.get('mask_pct'), r.get('error'), flush=True)
            json.dump({'jobs': recs}, open(LOG, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    finally:
        stop.set()
        cc.stop_server()
        release()
        json.dump({'total_sec': round(time.time() - t00), 'boot_wait_sec': boots, 'peak': {k: round(v, 2) for k, v in peak.items()}, 'jobs': recs},
                  open(LOG, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('DONE', flush=True)
