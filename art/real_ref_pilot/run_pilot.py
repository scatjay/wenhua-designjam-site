# -*- coding: utf-8 -*-
"""走讀真實照片改繪試作：FLUX.1-dev Q8 GGUF + Redux（core StyleModelApply）。
用法：python -X utf8 run_pilot.py <butokuden|hayashi_lift|abacus_nmth|liu_yongfu_1896> [strength=0.7]
沿用 comfy_core 的 start/stop/_req（每段用全新伺服器行程，避免單行程超過 24GB 被看門狗砍）。
"""
import sys, json, time, shutil, threading, os
sys.path.insert(0, 'E:/Downloads/comfy-gen')
import comfy_core as cc, psutil
from pathlib import Path

OUT = Path('E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot')
RAW = OUT / '_raw'
STYLE = ('pixel art, 16-bit SNES JRPG style, {obj}, limited palette, clean outlines, soft shading, '
         'no text, no letters, no logo')
JOBS = {
 'butokuden': dict(ref='butokuden_sq.png', w=768, h=1344, seed=3101,
   obj='vertical background scene of a Japanese colonial era martial arts hall in Tainan Taiwan, gray tiled hip-and-gable roof, cream-yellow walls, white wooden veranda railing, green copper eaves, blue sky, garden with trees, no people',
   tail=''),
 'hayashi_lift': dict(ref='hayashi_lift_sq.png', w=768, h=1344, seed=3102,
   obj='vertical background scene of an old department store lobby in Tainan Taiwan, brass framed brown elevator door with a golden fan shaped floor indicator above it, white wall, marble staircase on the right, checkered orange and gray floor, hanging glass lamp, no people',
   tail=''),
 'abacus_nmth': dict(ref='abacus_sq.png', w=768, h=768, seed=3103,
   obj='game item icon of an old wooden Chinese abacus with dark brown beads and a thin bamboo beam, centered single object',
   tail=', plain flat beige background'),
 'liu_yongfu_1896': dict(ref='liu_bust_sq.png', w=768, h=768, seed=3104,
   obj='half-body portrait of an elderly Taiwanese man with black hair under a dark round cap, black hair, Taiwanese features, dark long Qing era Chinese robe with knot buttons, calm serious expression, single character',
   tail=', plain flat beige background'),
}


def wf_stage1(j, prompt, strength, prefix, steps=24):
    P = cc.PRESETS['flux-dev-q8']
    return {
     '1': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': P['unet_gguf']}},
     '2': {'class_type': 'DualCLIPLoader', 'inputs': {'clip_name1': P['clip1'], 'clip_name2': P['clip2'], 'type': 'flux'}},
     '4': {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': ['2', 0]}},
     '5': {'class_type': 'FluxGuidance', 'inputs': {'conditioning': ['4', 0], 'guidance': P['guidance']}},
     '20': {'class_type': 'CLIPVisionLoader', 'inputs': {'clip_name': 'sigclip_vision_patch14_384.safetensors'}},
     '21': {'class_type': 'StyleModelLoader', 'inputs': {'style_model_name': 'flux1-redux-dev.safetensors'}},
     '22': {'class_type': 'LoadImage', 'inputs': {'image': j['ref']}},
     '23': {'class_type': 'CLIPVisionEncode', 'inputs': {'clip_vision': ['20', 0], 'image': ['22', 0], 'crop': 'center'}},
     '24': {'class_type': 'StyleModelApply', 'inputs': {'conditioning': ['5', 0], 'style_model': ['21', 0], 'clip_vision_output': ['23', 0], 'strength': strength, 'strength_type': 'multiply'}},
     '6': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': j['w'], 'height': j['h'], 'batch_size': 1}},
     '7': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'seed': j['seed'], 'steps': steps, 'cfg': 1.0, 'sampler_name': P['sampler'], 'scheduler': P['scheduler'],
                                                'positive': ['24', 0], 'negative': ['5', 0], 'latent_image': ['6', 0], 'denoise': 1.0}},
     '8': {'class_type': 'SaveLatent', 'inputs': {'samples': ['7', 0], 'filename_prefix': 'latents/' + prefix}},
    }



def lease_set(job):
    """向記憶體看門狗申報 ComfyUI 租約（官方機制 mem_lease.py；單一行程上限 24→32 GB，30 分鐘，用完 release）。"""
    import subprocess
    pr = cc.server_procs()
    if not pr:
        return None
    r = subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'set', '--pid', str(pr[0].pid), '--line', 'course-walk-redux-pilot', '--job', job, '--minutes', '30', '--cap-gb', '32', '--est-gb', '27'], capture_output=True, text=True, timeout=30)
    return (r.stdout + r.stderr)[:300]


def lease_release():
    import subprocess
    subprocess.run([sys.executable, 'E:/Downloads/mcp-governance/tools/mem_lease.py', 'release'], capture_output=True, text=True, timeout=30)

def main():
    name = sys.argv[1]
    strength = float(sys.argv[2]) if len(sys.argv) > 2 else 0.7
    j = JOBS[name]
    if os.environ.get('PILOT_W'): j = dict(j, w=int(os.environ['PILOT_W']), h=int(os.environ.get('PILOT_H', j['h'])))
    prompt = STYLE.format(obj=j['obj']) + j['tail']
    prefix = 'pilot_' + name
    peak = {'ram_pct': 0, 'proc_gb': 0}
    stop = threading.Event()

    sys.path.insert(0, 'E:/Downloads/mcp-governance/tools')
    import mem_watchdog as W
    peak['commit_gb'] = 0
    peak['commit_base_gb'] = round(W.perf()[0] / 2**30, 1)
    ABORT = float(os.environ.get('PILOT_ABORT_RATIO', '0.875'))   # 自己先收，不讓全機走到看門狗 0.90 紅燈（紅燈會擋別線的 Agent）

    def samp():
        while not stop.is_set():
            c, l = W.perf()
            peak['commit_gb'] = max(peak['commit_gb'], c / 2**30)
            if c / l >= ABORT and cc.server_procs():
                peak['self_abort'] = round(c / l, 3)
                cc.stop_server()
            peak['ram_pct'] = max(peak['ram_pct'], psutil.virtual_memory().percent)
            for p in cc.server_procs():
                try:
                    peak['proc_gb'] = max(peak['proc_gb'], p.memory_info().rss / 2**30)
                except Exception:
                    pass
            time.sleep(1)
    threading.Thread(target=samp, daemon=True).start()
    log = str(OUT / 'server.log')
    t0 = time.time()
    rec = {'name': name, 'strength': strength, 'seed': j['seed'], 'size': [j['w'], j['h']], 'prompt': prompt, 'ref': j['ref'], 'steps': 24}
    try:
        cc.stop_server()
        assert cc.start_server(log), 'server not up'
        rec['lease1'] = lease_set(name)
        rec['sec_boot1'] = round(time.time() - t0)
        wf = wf_stage1(j, prompt, strength, prefix)
        json.dump(wf, open(OUT / 'redux_workflow_api.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        t1 = time.time()
        pid = cc._req('/prompt', {'prompt': wf})['prompt_id']
        h1 = cc._wait(pid, t1, {'timeout_sec': 1500}, {'name': name})
        rec['sec_sample'] = round(time.time() - t1)
        if h1.get('status', {}).get('status_str') == 'error':
            raise RuntimeError(json.dumps(h1['status'], ensure_ascii=False)[:1500])
        lat = [x for o in h1['outputs'].values() for x in o.get('latents', [])][0]
        lat_name = prefix + '.latent'
        D = Path(cc.INSTALL['dir']) / 'ComfyUI'
        shutil.copy(D / 'output' / lat.get('subfolder', '') / lat['filename'], D / 'input' / lat_name)
        cc.stop_server()
        assert cc.start_server(log)
        rec['lease2'] = lease_set(name)
        t2 = time.time()
        pid = cc._req('/prompt', {'prompt': cc.workflow_decode('flux-dev-q8', lat_name, prefix)})['prompt_id']
        h2 = cc._wait(pid, t2, {'timeout_sec': 600}, {'name': name})
        rec['sec_decode'] = round(time.time() - t2)
        im = [i for o in h2['outputs'].values() for i in o.get('images', [])][0]
        shutil.copy(D / 'output' / im.get('subfolder', '') / im['filename'], RAW / ('%s_s%d_seed%d.png' % (name, int(strength * 100), j['seed'])))
        os.remove(D / 'input' / lat_name)
        rec['ok'] = True
    except Exception as e:
        rec['ok'] = False
        rec['error'] = str(e)[:1500]
    finally:
        rec['sec_total'] = round(time.time() - t0)
        stop.set()
        rec['peak'] = {k: round(v, 1) for k, v in peak.items()}
        rec['stop'] = cc.stop_server()
        lease_release()
        with open(OUT / 'pilot_log.jsonl', 'a', encoding='utf-8') as f:
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')
        print(json.dumps(rec, ensure_ascii=False, indent=1))


main()
