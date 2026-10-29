# -*- coding: utf-8 -*-
"""SDXL(Juggernaut XI Lightning)+pixel-art-xl LoRA 的 img2img 掃參數；對照組不載 LoRA。同一個伺服器行程連跑，結束關伺服器、歸還租約。"""
import sys, json, time, shutil, os
sys.path.insert(0, 'E:/Downloads/comfy-gen')
import comfy_core as cc
from pathlib import Path
sys.argv = [sys.argv[0]]
import importlib.util
spec = importlib.util.spec_from_file_location('rp', 'run_pilot.py')
OUT = Path('.').resolve(); RAW = OUT / '_raw_sdxl'; RAW.mkdir(exist_ok=True)
def lease(job):
    import subprocess
    pr = cc.server_procs()
    if pr: subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'set', '--pid', str(pr[0].pid), '--line', 'course-walk-sdxl', '--job', job, '--minutes', '30', '--cap-gb', '24', '--est-gb', '12'], capture_output=True, text=True, timeout=30)
def release():
    import subprocess
    subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'release'], capture_output=True, text=True, timeout=30)
OBJ = {
 'butokuden_sq.png': ('pixel art, 16-bit SNES JRPG style, Japanese colonial era martial arts hall in Tainan Taiwan, gray tiled roof, cream yellow walls, white veranda railing, green eaves, blue sky, limited palette, clean outlines', 1024, 1024),
 'liu_bust_sq.png': ('pixel art, 16-bit SNES JRPG style portrait of an elderly Taiwanese man in a dark round cap and dark Qing era robe, Taiwanese features, flat beige background, limited palette, clean outlines', 1024, 1024),
 'abacus_sq.png': ('pixel art, 16-bit game item icon, old wooden Chinese abacus with dark brown wooden frame and beads, flat beige background, limited palette, clean outlines', 1024, 1024),
}
def wf(img, prompt, w, h, den, lora, seed, prefix):
    m = ['1', 0]; c = ['1', 1]
    g = {'1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'RunDiffusion'+chr(92)+'Juggernaut-XI-byRunDiffusion-Lightning.safetensors'}}}
    if lora:
        g['2'] = {'class_type': 'LoraLoader', 'inputs': {'model': ['1', 0], 'clip': ['1', 1], 'lora_name': 'pixel'+chr(92)+'pixel-art-xl.safetensors', 'strength_model': 1.0, 'strength_clip': 1.0}}
        m = ['2', 0]; c = ['2', 1]
    g.update({
     '3': {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': c}},
     '4': {'class_type': 'CLIPTextEncode', 'inputs': {'text': 'blurry, photo, realistic, text, letters, watermark, 3d render, anime face, western face', 'clip': c}},
     '5': {'class_type': 'LoadImage', 'inputs': {'image': img}},
     '6': {'class_type': 'ImageScale', 'inputs': {'image': ['5', 0], 'upscale_method': 'lanczos', 'width': w, 'height': h, 'crop': 'center'}},
     '7': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['6', 0], 'vae': ['1', 2]}},
     '8': {'class_type': 'KSampler', 'inputs': {'model': m, 'seed': seed, 'steps': 8, 'cfg': 2.0, 'sampler_name': 'dpmpp_sde', 'scheduler': 'karras', 'positive': ['3', 0], 'negative': ['4', 0], 'latent_image': ['7', 0], 'denoise': den}},
     '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['1', 2]}},
     '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': prefix}}})
    return g
import threading
sys.path.insert(0, 'E:/Downloads/mcp-governance/tools')
import mem_watchdog as W
def _guard():
    while True:
        c, l = W.perf()
        if c / l >= 0.95 and cc.server_procs():
            print('SELF_ABORT', round(c / l, 3), flush=True); cc.stop_server()
        time.sleep(1)
threading.Thread(target=_guard, daemon=True).start()
jobs = []
for img, (p, w, h) in OBJ.items():
    n = img.split('_')[0]
    for den in (0.5, 0.65, 0.8):
        jobs.append((n, img, p, w, h, den, True))
    jobs.append((n, img, p, w, h, 0.65, False))
log = str(OUT / 'server_sdxl.log'); rec = []
try:
    cc.stop_server(); assert cc.start_server(log); lease('sdxl')
    D = Path(cc.INSTALL['dir']) / 'ComfyUI'
    for n, img, p, w, h, den, lora in jobs:
        t = time.time(); tag = '%s_d%d_%s' % (n, int(den * 100), 'lora' if lora else 'nolora')
        pid = cc._req('/prompt', {'prompt': wf(img, p, w, h, den, lora, 4101, 'sdxl_' + tag)})['prompt_id']
        h1 = cc._wait(pid, t, {'timeout_sec': 600}, {'name': tag})
        ok = h1.get('status', {}).get('status_str') != 'error'
        if ok:
            im = [i for o in h1['outputs'].values() for i in o.get('images', [])][0]
            shutil.copy(D / 'output' / im.get('subfolder', '') / im['filename'], RAW / (tag + '.png'))
        rec.append({'tag': tag, 'ok': ok, 'sec': round(time.time() - t, 1)}); print(rec[-1], flush=True)
finally:
    cc.stop_server(); release()
    json.dump(rec, open(OUT / 'sdxl_log.json', 'w'), ensure_ascii=False, indent=1)
    open(OUT / 'sdxl_done.txt', 'w').write('done')
