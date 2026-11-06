# -*- coding: utf-8 -*-
"""走讀美術：等條件才自動開工（常駐等待程式）。
條件：全機認可 <= LIMIT_GB（預設 63.5）且埠 8288 沒人聽、沒有別人的 ComfyUI 行程。
流程：每 POLL 秒查一次 census --brief（不洗版；被拒不重試，只在日誌記一行）；條件到了登記預約→start→
依序跑 階段（探員16 → NPC5 → 警察署雙CN），每階段 Popen 啟動，逾時殺整棵行程樹；全部做完或中斷都 kill 伺服器、done 預約、確認埠釋放。
已完成的階段記在 STATE（重啟不重做）。單例：pid 檔鎖。日誌：LOG。
用法：python wait_and_run.py   （背景執行）；停止：TaskStop 該工作，再用 psutil 確認沒有殘留。"""
import subprocess, sys, time, os, re, json, psutil

W = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103d/_work'
S = 'C:/Users/user/AppData/Local/Temp/claude/95791ac1e5ee61d4/c1191369-0d37-48e7-8d65-ccaaeec5530a/scratchpad'
RS = 'E:/Downloads/mcp-governance/tools/resource_schedule.py'
CENSUS = 'E:/Downloads/mcp-governance/tools/nested_session_census.py'
RAW = 'E:/Downloads/_walk_refs/_raw/_samples_1103d'
BASH = 'D:/Git/bin/bash.exe'
LOG = S + '/wait_and_run.log'
STATE = S + '/wait_and_run.state.json'
PIDF = S + '/wait_and_run.pid'
LIMIT_GB = float(os.environ.get('LIMIT_GB', '63.5'))
POLL = int(os.environ.get('POLL', '600'))
DRY = os.environ.get('DRY') == '1'

# 階段：(名稱, 工單, 腳本, 日誌前綴, 逾時分鐘, 額外環境, 預期輸出檔名清單來源)
STAGES = [
    ('agents16', 'jobs_v2_agents16.json', 'run_v2_chars.sh', 'v2agents', 100, {}),
    ('npc5', 'jobs_v2_npc5.json', 'run_v2_chars.sh', 'v2npc', 30, {}),
    ('police', 'jobs_v2_police.json', 'run_v2_batch.sh', 'v2pol', 40,
     {'PIX_METHOD': 'median', 'PIX_COLORS': '48', 'PROTECT_LIST': 'stone lion. lion statue. balustrade. window'}),
]


def log(m):
    open(LOG, 'a', encoding='utf-8').write(time.strftime('%m-%d %H:%M:%S ') + m + '\n')


def load_state():
    try:
        return json.load(open(STATE, encoding='utf-8'))
    except Exception:
        return {'done': []}


def save_state(st):
    json.dump(st, open(STATE, 'w', encoding='utf-8'))


def commit_gb():
    try:
        r = subprocess.run([sys.executable, CENSUS, '--brief'], capture_output=True, text=True, timeout=120, encoding='utf-8', errors='replace')
        m = re.search(r'全機認可\s*([0-9.]+)\s*/\s*([0-9.]+)', r.stdout)
        return float(m.group(1)) if m else None
    except Exception as e:
        log('census err %s' % e)
        return None


def port_busy():
    return any(x.status == 'LISTEN' and x.laddr.port == 8288 for x in psutil.net_connections(kind='tcp'))


def other_comfy():
    n = 0
    for p in psutil.process_iter(['cmdline']):
        try:
            c = ' '.join(p.info['cmdline'] or [])
            if 'ComfyUI' in c and 'main.py' in c:
                n += 1
        except Exception:
            pass
    return n


def kill_tree(pid):
    try:
        pr = psutil.Process(pid)
        for c in pr.children(recursive=True):
            try: c.kill()
            except Exception: pass
        pr.kill()
    except Exception:
        pass


def kill_server():
    for x in psutil.net_connections(kind='tcp'):
        if x.status == 'LISTEN' and x.laddr.port == 8288 and x.pid:
            kill_tree(x.pid)
            log('killed server %d' % x.pid)


def prep_jobs():
    a = json.load(open(W + '/jobs_v2_agents.json', encoding='utf-8'))
    json.dump([j for j in a if j['style'] == 'agent'], open(W + '/jobs_v2_agents16.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump([j for j in a if j['style'] == 'npc'], open(W + '/jobs_v2_npc5.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def run_stage(name, jobs, script, prefix, minutes, extra):
    env = dict(os.environ, WAIT_GB=str(LIMIT_GB - 0.5), **extra)
    outp = open(S + '/%s.out' % prefix, 'w', encoding='utf-8')
    p = subprocess.Popen([BASH, W + '/' + script, jobs, S + '/' + prefix], cwd=W, env=env, stdout=outp, stderr=subprocess.STDOUT)
    log('stage %s started pid=%d' % (name, p.pid))
    t0 = time.time()
    while p.poll() is None:
        if time.time() - t0 > minutes * 60:
            log('stage %s 逾時 %d 分，殺整棵行程樹' % (name, minutes))
            kill_tree(p.pid); break
        time.sleep(15)
    outp.close()
    tail = open(S + '/%s.out' % prefix, encoding='utf-8', errors='replace').read()[-400:].replace('\n', ' | ')
    log('stage %s end rc=%s tail=%s' % (name, p.poll(), tail))
    kill_server()
    names = [j['name'] for j in json.load(open(W + '/' + jobs, encoding='utf-8'))]
    got = sum(1 for n in names if os.path.exists('%s/%s.png' % (RAW, n)))
    log('stage %s 產出原圖 %d/%d' % (name, got, len(names)))
    return got


def main():
    if os.path.exists(PIDF):
        try:
            op = int(open(PIDF).read().strip())
            if psutil.pid_exists(op) and op != os.getpid() and 'wait_and_run' in ' '.join(psutil.Process(op).cmdline()):
                print('already running', op); return
        except Exception:
            pass
    open(PIDF, 'w').write(str(os.getpid()))
    prep_jobs()
    st = load_state()
    log('start; LIMIT=%.1f POLL=%d done=%s DRY=%s' % (LIMIT_GB, POLL, st['done'], DRY))
    last_gb = None
    while True:
        todo = [s for s in STAGES if s[0] not in st['done']]
        if not todo:
            log('全部階段完成，結束'); break
        gb = commit_gb()
        if gb is not None and gb != last_gb:
            log('認可 %.1f GB（需 <= %.1f）' % (gb, LIMIT_GB)); last_gb = gb
        ok = gb is not None and gb <= LIMIT_GB and not port_busy() and other_comfy() == 0
        if DRY:
            log('DRY：條件=%s，下一階段=%s' % (ok, todo[0][0])); break
        if not ok:
            time.sleep(POLL); continue
        r = subprocess.run([sys.executable, RS, 'add', '--line', 'course-walk-art-v2', '--resource', 'comfyui', '--gb', '30', '--gpu',
                            '--start', 'now', '--minutes', '150', '--note', '走讀美術 v2 自動開工（等條件）'], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
        m = re.search(r'\b([0-9a-f]{8})\b', r.stdout)
        rid = m.group(1) if m else None
        log('add rc=%s id=%s %s' % (r.returncode, rid, r.stdout.strip()[:160]))
        if not rid:
            time.sleep(POLL); continue
        r = subprocess.run([sys.executable, RS, 'start', rid], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
        log('start rc=%s %s' % (r.returncode, r.stdout.strip()[:160]))
        try:
            if r.returncode != 0 or '✋' in r.stdout or '拒' in r.stdout:
                log('預約被拒，回到等待'); continue
            for s in todo:
                got = run_stage(*s)
                if got > 0:
                    st['done'].append(s[0]); save_state(st)
                else:
                    log('階段 %s 0 張（可能租約被拒），釋放後回到等待，不連續重試' % s[0]); break
        finally:
            kill_server(); time.sleep(2)
            d = subprocess.run([sys.executable, RS, 'done', rid], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
            log('done rc=%s %s；埠 8288 仍聽=%s' % (d.returncode, d.stdout.strip()[:120], port_busy()))
        time.sleep(POLL)
    try: os.remove(PIDF)
    except Exception: pass


if __name__ == '__main__':
    main()
