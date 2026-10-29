# -*- coding: utf-8 -*-
"""探員設定 A–D 四方向各 4 位的像素頭像樣張（SDXL Juggernaut Lightning + pixel-art-xl，文字生圖，臺灣人長相）。
等全機提交量降到門檻以下才啟動；跑完關伺服器、歸還租約。"""
import sys, json, time, shutil, threading
sys.path.insert(0, 'E:/Downloads/comfy-gen'); sys.path.insert(0, 'E:/Downloads/mcp-governance/tools')
import comfy_core as cc, mem_watchdog as W, subprocess
from pathlib import Path
OUT = Path('.').resolve(); RAW = OUT / '_raw_agents'; RAW.mkdir(exist_ok=True)
GATE = float(sys.argv[1]) if len(sys.argv) > 1 else 0.74
BS = chr(92)
BASE = 'pixel art, 16-bit SNES JRPG character portrait, bust shot, Taiwanese person, East Asian face, black hair, dark brown eyes, {d}, flat plain beige background, limited palette, clean outlines, no text'
NEG = 'caucasian, western face, blue eyes, blond hair, realistic photo, 3d render, anime, text, letters, watermark, blurry'
CH = {
 'A': ['an operator of an electronic flower-decorated parade truck in a headset and red happi jacket with LED lights', 'a young temple-courtyard engineer with a tablet, wearing a plain work vest and a lantern-shaped badge', 'a middle-aged temple caretaker woman with a data scanner and a cloth apron', 'a lantern technician holding a glowing palace lantern and a soldering tool'],
 'B': ['a glove-puppet (budaixi) performer in embroidered robe holding a small puppet and a tablet', 'an old-street abacus accountant in a vest with round glasses and an abacus', 'a woodworking master carpenter with a pencil behind the ear and a tape measure', 'a street food stall owner woman in apron with a thermos and a handheld POS device'],
 'C': ['a salt-field watcher in a straw hat with binoculars and a weather radio', 'a fishing-port weather officer in an orange vest with an anemometer', 'a milkfish pond technician in rubber boots with a water sensor', 'a sampan boat captain in a bamboo hat with a drone controller'],
 'D': ['a heritage restoration architect in a hard hat with a 3D scanner', 'a drone surveying operator in a field jacket with a drone remote', 'a traditional temple painter with brushes and a color palette tablet', 'a brick-and-tile mason in a cap with a laser measuring tool'],
}
def lease():
    pr = cc.server_procs()
    if pr: subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'set', '--pid', str(pr[0].pid), '--line', 'course-walk-agents', '--job', 'agent_samples', '--minutes', '30', '--cap-gb', '24', '--est-gb', '14'], capture_output=True, text=True, timeout=30)
def release(): subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'release'], capture_output=True, text=True, timeout=30)
def wf(prompt, seed, prefix):
    return {'1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'RunDiffusion' + BS + 'Juggernaut-XI-byRunDiffusion-Lightning.safetensors'}},
     '2': {'class_type': 'LoraLoader', 'inputs': {'model': ['1', 0], 'clip': ['1', 1], 'lora_name': 'pixel' + BS + 'pixel-art-xl.safetensors', 'strength_model': 1.0, 'strength_clip': 1.0}},
     '3': {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': ['2', 1]}}, '4': {'class_type': 'CLIPTextEncode', 'inputs': {'text': NEG, 'clip': ['2', 1]}},
     '5': {'class_type': 'EmptyLatentImage', 'inputs': {'width': 768, 'height': 768, 'batch_size': 1}},
     '8': {'class_type': 'KSampler', 'inputs': {'model': ['2', 0], 'seed': seed, 'steps': 8, 'cfg': 2.0, 'sampler_name': 'dpmpp_sde', 'scheduler': 'karras', 'positive': ['3', 0], 'negative': ['4', 0], 'latent_image': ['5', 0], 'denoise': 1.0}},
     '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['1', 2]}}, '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': prefix}}}
t0 = time.time(); ok = 0
while time.time() - t0 < 3 * 3600:
    c, l = W.perf(); ok = ok + 1 if c / l < GATE else 0
    print('wait', round(c / l, 3), flush=True)
    if ok >= 3: break
    time.sleep(30)
else:
    print('GATE_TIMEOUT', flush=True); open('agents_done.txt', 'w').write('timeout'); sys.exit(1)
rec = []
def guard():
    while True:
        c, l = W.perf()
        if c / l >= 0.89 and cc.server_procs(): print('SELF_ABORT', round(c / l, 3), flush=True); cc.stop_server()
        time.sleep(1)
threading.Thread(target=guard, daemon=True).start()
try:
    cc.stop_server(); assert cc.start_server(str(OUT / 'server_agents.log')); lease()
    D = Path(cc.INSTALL['dir']) / 'ComfyUI'
    for k, lst in CH.items():
        for i, d in enumerate(lst):
            tag = '%s%d' % (k, i + 1); t = time.time()
            pid = cc._req('/prompt', {'prompt': wf(BASE.format(d=d), 5100 + i, 'ag_' + tag)})['prompt_id']
            h = cc._wait(pid, t, {'timeout_sec': 600}, {'name': tag})
            im = [x for o in h['outputs'].values() for x in o.get('images', [])][0]
            shutil.copy(D / 'output' / im.get('subfolder', '') / im['filename'], RAW / (tag + '.png'))
            rec.append({'tag': tag, 'desc': d, 'sec': round(time.time() - t, 1)}); print(rec[-1], flush=True)
finally:
    cc.stop_server(); release()
    json.dump(rec, open('agents_log.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open('agents_done.txt', 'w').write('done')
