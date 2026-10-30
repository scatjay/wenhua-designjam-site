# -*- coding: utf-8 -*-
"""探員設定 A–D 四方向各 4 位的像素頭像樣張（SDXL Juggernaut Lightning + pixel-art-xl，文字生圖，臺灣人長相）。
等全機提交量降到門檻以下才啟動；跑完關伺服器、歸還租約。"""
import sys, json, time, shutil, threading
sys.path.insert(0, 'E:/Downloads/comfy-gen'); sys.path.insert(0, 'E:/Downloads/mcp-governance/tools')
import comfy_core as cc, mem_watchdog as W, subprocess
from pathlib import Path
OUT = Path('.').resolve(); RAW = OUT / '_raw_agents_v3c'; RAW.mkdir(exist_ok=True)
GATE = float(sys.argv[1]) if len(sys.argv) > 1 else 0.74
BS = chr(92)
BASE = 'pixel art, pixelated low resolution sprite portrait, visible square pixels, 16-bit SNES JRPG style, close-up bust shot, head and shoulders, large clear face in the center, three-quarter view, expressive lively face, confident smile, Taiwanese person, East Asian face, black hair, dark brown eyes, {d}, {pal}, strong color contrast, simple colorful backdrop with {bg}, clean outlines, no text, no letters, no signs'
NEG = 'photograph, photorealistic, realistic skin, smooth gradient, high resolution photo, muted colors, desaturated, dull, brown and gray tones, beige, monochrome, caucasian, western face, blue eyes, blond hair, realistic photo, 3d render, anime, text, letters, watermark, blurry, signboard, calligraphy, gamepad, game controller, helmet covering face, mask'
PAL = {'A': 'highly saturated vibrant palette, bright vermilion red, gold yellow, neon cyan and magenta accents', 'B': 'warm saturated palette, lantern red, tea-house amber yellow, polished wood brown, jade green accents', 'C': 'fresh saturated palette, sea teal, salt white, sunset orange, mangrove green accents', 'D': 'saturated palette, glazed-tile green, terracotta red, gold line accents, clear blue sky'}
BG = {'A': 'red lanterns and neon lights of a temple fair', 'B': 'warm lantern light of an old street alley', 'C': 'a tidal lagoon and coastal wetland at golden hour', 'D': 'a heritage building restoration site with an old tiled roof'}
ROLES = [('A1', 'a cheerful young man holding a microphone near his chin, jacket with neon LED strips, a container-truck stage and speakers small in the backdrop'), ('A2', 'a young woman stage-truck technician holding a glowing tablet in front of her chest, tool belt, neon light panels small in the backdrop'), ('A3', 'a middle-aged woman lantern painter holding a long thin brush and a big round lantern painted with a green and gold dragon, paint pots at the bottom'), ('A4', 'an elderly man temple keeper with white hair holding a bundle of incense sticks and a wooden fortune-stick cylinder in front of his chest, incense burner at the bottom'), ('B1', 'a middle-aged man accountant in round glasses and a vest, holding a wooden abacus with a horizontal beam and two rows of beads in front of his chest'), ('B2', 'an elderly craftsman carpenter with a pencil behind the ear, holding a carved wooden ink-line pot in one hand and a wooden carpenter square in the other'), ('B3', 'a woman street noodle vendor with a bamboo shoulder pole and two baskets over her shoulder, holding a small blue porcelain bowl of noodles, a plain red lantern'), ('B4', 'a man glove-puppet performer holding up a colorful glove puppet in a pink embroidered robe on his raised hand, a small golden carved theater stage in the backdrop'), ('C1', 'a middle-aged man lagoon raft captain in a straw hat, standing on a flat raft with plastic floats, oyster rack bamboo poles and a white egret small in the backdrop'), ('C2', 'a young woman salt field lookout in a wide-brim hat, a small leaning stone watchtower and a white salt mountain in the backdrop, a small quadcopter drone hovering beside her and a remote in her hand'), ('C3', 'a young man milkfish pond farmer in rubber boots holding a silver milkfish with a deeply forked tail up in one hand and a slim water probe in the other, a paddlewheel aerator splashing small in the backdrop'), ('C4', 'a young woman weather observer holding a triangular signal flag and a handheld anemometer, a tall white round cylinder tower and a yellow-brick heritage building in the backdrop'), ('D1', 'a woman heritage restoration architect with a hard hat pushed back and her whole face visible, holding rolled plans and a tablet, bamboo scaffolding with green mesh in the backdrop'), ('D2', 'a young man heritage surveyor next to a tripod-mounted laser scanner and a white sphere target, holding a tablet showing a point cloud, old brick wall in the backdrop'), ('D3', 'an old man traditional temple painter holding a long thin brush and a ruler, a half-painted red door panel with gold line patterns beside him'), ('D4', 'a middle-aged man plasterer holding a steel trowel, a half-plastered white lime wall and a bucket of lime behind him, glazed face-brick wall')]
import os
SEEDS = [7001, 7002, 7003][:int(os.environ.get('SEED_N', '3'))]
ONLY = [x for x in os.environ.get('ONLY', '').split(',') if x]
ROLES = [r for r in ROLES if not ONLY or r[0] in ONLY]
FAST = '--fast' in sys.argv
def lease():
    pr = cc.server_procs()
    if pr: subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'set', '--pid', str(pr[0].pid), '--line', 'course-walk-agents', '--job', 'agent_samples_v3', '--minutes', '30', '--cap-gb', '24', '--est-gb', '14'], capture_output=True, text=True, timeout=30)
def release(): subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'release'], capture_output=True, text=True, timeout=30)
def wf(prompt, seed, prefix):
    return {'1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'RunDiffusion' + BS + 'Juggernaut-XI-Lightning-unetfp8.safetensors'}},
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
    print('GATE_TIMEOUT', flush=True); open('agents_v3c_done.txt', 'w').write('timeout'); sys.exit(1)
rec = []
def guard():
    while True:
        c, l = W.perf()
        if c / l >= 0.899 and cc.server_procs(): print('SELF_ABORT', round(c / l, 3), flush=True); cc.stop_server()
        time.sleep(1)
threading.Thread(target=guard, daemon=True).start()
try:
    cc.stop_server()
    B = cc.INSTALL['dir']; lg = open(str(OUT / 'server_agents_v3.log'), 'a', encoding='utf-8', errors='replace')
    subprocess.Popen([B + '/python_embeded/python.exe', '-s', B + '/ComfyUI/main.py', '--windows-standalone-build', '--port', str(cc.INSTALL['port']), '--listen', '127.0.0.1', '--disable-auto-launch', '--disable-all-custom-nodes', '--disable-cuda-malloc', '--gpu-only',
                      ] + ([] if FAST else ['--disable-smart-memory']), cwd=B, stdout=lg, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, creationflags=cc.NO_WINDOW)
    for _ in range(120):
        time.sleep(2)
        if cc.server_up(): break
    assert cc.server_up(); lease()
    D = Path(cc.INSTALL['dir']) / 'ComfyUI'
    for si, seed in enumerate(SEEDS):
        for tag, d in ROLES:
            t = time.time(); name = '%s_s%d' % (tag, si + 1)
            if (RAW / (name + '.png')).exists(): continue
            pr = BASE.format(d=d, pal=PAL[tag[0]], bg=BG[tag[0]])
            pid = cc._req('/prompt', {'prompt': wf(pr, seed + ord(tag[0]) * 10 + int(tag[1]), 'agv3c_' + name)})['prompt_id']
            h = cc._wait(pid, t, {'timeout_sec': 600}, {'name': name})
            im = [x for o in h['outputs'].values() for x in o.get('images', [])][0]
            shutil.copy(D / 'output' / im.get('subfolder', '') / im['filename'], RAW / (name + '.png'))
            rec.append({'tag': name, 'desc': d, 'sec': round(time.time() - t, 1)}); print(rec[-1], flush=True)
finally:
    cc.stop_server(); release()
    json.dump(rec, open('agents_v3c_log.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open('agents_v3c_done.txt', 'w').write('done')
