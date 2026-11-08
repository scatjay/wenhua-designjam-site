# -*- coding: utf-8 -*-
"""走讀美術：等條件才自動開工（常駐等待程式）。
條件：全機認可 <= LIMIT_GB（預設 63.5）且埠 8288 沒人聽、沒有別人的 ComfyUI 行程。
流程：每 POLL 秒查一次 census --brief（不洗版；被拒不重試，只在日誌記一行）；條件到了登記預約→start→
依序跑 階段（探員16 → NPC5 → 警察署雙CN），每階段 Popen 啟動，逾時殺整棵行程樹；全部做完或中斷都 kill 伺服器、done 預約、確認埠釋放。
已完成的階段記在 STATE（重啟不重做）。單例：pid 檔鎖。日誌：LOG。
用法：python wait_and_run.py   （背景執行）；停止：TaskStop 該工作，再用 psutil 確認沒有殘留。"""
import subprocess, sys, time, os, re, json, psutil, datetime

W = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103d/_work'
S = 'C:/Users/user/AppData/Local/Temp/claude/95791ac1e5ee61d4/c1191369-0d37-48e7-8d65-ccaaeec5530a/scratchpad'
RS = 'E:/Downloads/mcp-governance/tools/resource_schedule.py'
CENSUS = 'E:/Downloads/mcp-governance/tools/nested_session_census.py'
RAW = 'E:/Downloads/_walk_refs/_raw/_samples_1103d'
BASH = 'D:/Git/bin/bash.exe'
LOG = S + '/wait_and_run.log'
STATE = S + '/wait_and_run.state.json'
PIDF = S + '/wait_and_run.pid'
LIMIT_GB = float(os.environ.get('LIMIT_GB', '75.5'))   # Q4 申請 18 GB：認可 <= 93.5-18；Q8（30 GB）階段另檢查 <= Q8_LIMIT_GB
Q8_LIMIT_GB = 63.5
FALLBACK_BY = datetime.datetime(2026, 11, 12, 20, 0)
POLL = int(os.environ.get('POLL', '600'))
DRY = os.environ.get('DRY') == '1'

# 階段：(名稱, 工單, 腳本, 日誌前綴, 逾時分鐘, 額外環境, 預期輸出檔名清單來源)
STAGES = [
    ('cmp_q4', 'jobs_v2_cmp_q4.json', 'run_v2_chars.sh', 'v2cmpq4', 15, {'COMFY_EXTRA': '--disable-smart-memory', 'UNET': 'Q4'}),
    ('agents16', 'jobs_v2_agents16.json', 'run_v2_chars.sh', 'v2agents', 100, {'COMFY_EXTRA': '--disable-smart-memory'}),
    ('npc5', 'jobs_v2_npc5.json', 'run_v2_chars.sh', 'v2npc', 30, {}),
    ('police', 'jobs_v2_police.json', 'run_v2_batch.sh', 'v2pol', 40,
     {'PIX_METHOD': 'median', 'PIX_COLORS': '48', 'PROTECT_LIST': 'stone lion. lion statue. balustrade. window'}),
    ('regen_r5', 'jobs_v2_agents_r5.json', 'run_v2_chars.sh', 'v2r5', 40, {'UNET': 'Q4'}),
    ('cmp_q8', 'jobs_v2_cmp_q8.json', 'run_v2_chars.sh', 'v2cmpq8', 15, {'COMFY_EXTRA': '--disable-smart-memory'}),
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


def pick_reservation():
    """優先用預約簿裡「走讀美術 v2 夜間時窗」且現在落在時窗內的 pending 預約；否則臨時登記一筆 110 分的預約（0 張就 cancel）。
    回傳 (id, 是否臨時, 時窗結束時間)。"""
    r = subprocess.run([sys.executable, RS, 'list'], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
    now = datetime.datetime.now()
    for l in r.stdout.split('\n'):
        m = re.match(r'^([0-9a-f]{8})\s+pending\s+(\d\d)-(\d\d) (\d\d):(\d\d)\s+(\d+) 分', l)
        if m and 'course-walk-art-v2' in l and 'comfyui' in l:   # 依 line＋resource＋時窗比對，不寫死 id
            t0 = datetime.datetime(now.year, int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5)))
            t1 = t0 + datetime.timedelta(minutes=int(m.group(6)))
            if t0 <= now < t1:
                log('使用預約簿時窗預約 %s（到 %s）' % (m.group(1), t1.strftime('%m-%d %H:%M')))
                return m.group(1), False, t1
    r = subprocess.run([sys.executable, RS, 'add', '--line', 'course-walk-art-v2', '--resource', 'comfyui', '--gb', '18', '--gpu',
                        '--start', 'now', '--minutes', '110', '--note', '走讀美術 v2 臨時（等條件到）；0 張會 cancel'], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
    m = re.search(r'預約 ([0-9a-f]{8})', r.stdout)
    log('臨時登記 rc=%s id=%s %s' % (r.returncode, m.group(1) if m else None, r.stdout.strip()[:120]))
    return (m.group(1) if m else None), True, now + datetime.timedelta(minutes=110)


DECISION = S + '/cmp_decision.txt'


def read_decision(wait_min=12):
    t0 = time.time()
    while time.time() - t0 < wait_min * 60:
        if os.path.exists(DECISION):
            v = open(DECISION, encoding='utf-8').read().strip().upper()
            log('讀到比對決策：%s' % v)
            return 'Q4' if v.startswith('Q4') else 'Q8'
        time.sleep(20)
    log('等不到比對決策檔，預設 Q8')
    return 'Q8'


def rollover():
    """時窗過了仍是 pending 的預約（list --all 顯示 expired）→ cancel，登記下一個 01:00 起 110 分、24 GB；超過 11-12 20:00 就不再登記，寫 fallback.flag。"""
    r = subprocess.run([sys.executable, RS, 'list', '--all'], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
    rows = [l for l in r.stdout.split(chr(10)) if re.match(r'^[0-9a-f]{8}\s+expired\s', l) and 'course-walk-art-v2' in l and 'comfyui' in l]
    if not rows:
        return
    pend = [l for l in subprocess.run([sys.executable, RS, 'list'], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace').stdout.split(chr(10))
            if re.match(r'^[0-9a-f]{8}\s+pending\s', l) and 'course-walk-art-v2' in l and 'comfyui' in l]
    for l in rows:
        rid = l.split()[0]
        d = subprocess.run([sys.executable, RS, 'cancel', rid], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
        log('時窗已過仍未開工，cancel %s：%s' % (rid, d.stdout.strip()[:60]))
    if pend:
        return
    now = datetime.datetime.now()
    nxt = now.replace(hour=1, minute=0, second=0, microsecond=0)
    if nxt <= now:
        nxt += datetime.timedelta(days=1)
    if nxt >= FALLBACK_BY:
        open(S + '/fallback.flag', 'w').write(now.isoformat())
        log('已到 %s 仍沒跑成，不再順延，寫 fallback.flag（改用已驗證的 34 個可上線＋emoji 探員）' % FALLBACK_BY.strftime('%m-%d %H:%M'))
        return
    note = '走讀美術 course-walk-art-v2：Q4_K_S 量化預估18GB（行程提交量實測峰值 17.5 GB）；%s 夜因認可未達 75.5 GB 順延' % (nxt - datetime.timedelta(days=1)).strftime('%m-%d')
    a = subprocess.run([sys.executable, RS, 'add', '--line', 'course-walk-art-v2', '--resource', 'comfyui', '--gb', '18', '--gpu',
                        '--start', nxt.strftime('%Y-%m-%d %H:%M'), '--minutes', '110', '--note', note], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
    log('順延登記 %s rc=%s %s' % (nxt.strftime('%m-%d %H:%M'), a.returncode, a.stdout.strip()[:80]))


def prep_jobs():
    a = json.load(open(W + '/jobs_v2_agents.json', encoding='utf-8'))
    json.dump([j for j in a if j['style'] == 'agent'], open(W + '/jobs_v2_agents16.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump([j for j in a if j['style'] == 'npc'], open(W + '/jobs_v2_npc5.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def run_stage(name, jobs, script, prefix, minutes, extra):
    env = dict(os.environ, WAIT_GB=str((LIMIT_GB if extra.get('UNET') else Q8_LIMIT_GB) - 0.5), EST_GB=('18' if extra.get('UNET') else '30'), **extra)   # Q4 向租約申請 24 GB，Q8 仍 30 GB
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
    try:
        pk = json.load(open(S + '/%s_gen.json' % prefix, encoding='utf-8')).get('peak')
        log('stage %s 峰值（旋鈕=%s）：%s' % (name, extra.get('COMFY_EXTRA', '無'), pk))
    except Exception as e:
        log('stage %s 讀不到峰值：%s' % (name, e))
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
        rollover()
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
        rid, adhoc, win_end = pick_reservation()
        if not rid:
            time.sleep(POLL); continue
        r = subprocess.run([sys.executable, RS, 'start', rid], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
        log('start rc=%s %s' % (r.returncode, r.stdout.strip()[:160]))
        total = 0
        decision = ('Q4' if open(DECISION, encoding='utf-8').read().strip().upper().startswith('Q4') else 'Q8') if os.path.exists(DECISION) else 'Q8'
        try:
            if r.returncode != 0 or '✋' in r.stdout or '拒' in r.stdout:
                log('預約被拒，回到等待（%s）' % ('臨時預約，稍後取消' if adhoc else '保留 pending'))
            else:
                for s in todo:
                    remain = int((win_end - datetime.datetime.now()).total_seconds() / 60) - 2
                    if remain < 8:
                        log('時窗剩 %d 分，不再開新階段' % remain); break
                    name, jobs, script, prefix, minutes, extra = s
                    if name == 'cmp_q8' and (commit_gb() or 999) > Q8_LIMIT_GB:
                        log('認可量 > %.1f，略過 Q8 對照（僅看 Q4 單獨結果）' % Q8_LIMIT_GB)
                        st['done'].append(name); save_state(st)
                        log('Q8 對照未做（認可量未達 %.1f），不阻擋 Q4 整批' % Q8_LIMIT_GB)
                        continue
                    if name in ('agents16', 'npc5', 'regen_r5') and decision == 'Q4':
                        extra = dict(extra, UNET='Q4')
                    got = run_stage(name, jobs, script, prefix, min(minutes, remain), extra)
                    total += got
                    if name == 'cmp_q4':
                        decision = read_decision()
                    if got > 0:
                        st['done'].append(name); save_state(st)
                    else:
                        log('階段 %s 0 張（可能租約被拒），不連續重試' % name); break
        finally:
            kill_server(); time.sleep(2)
            # 規則：只有真的出圖才 done；0 張一律 cancel，不可標 done
            cmd = 'done' if total > 0 else ('cancel' if (adhoc or r.returncode == 0) else None)
            if cmd:
                d = subprocess.run([sys.executable, RS, cmd, rid], capture_output=True, text=True, timeout=60, encoding='utf-8', errors='replace')
                log('%s rc=%s %s；本輪共出 %d 張；埠 8288 仍聽=%s' % (cmd, d.returncode, d.stdout.strip()[:100], total, port_busy()))
            else:
                log('預約 %s 保留 pending；埠 8288 仍聽=%s' % (rid, port_busy()))
        time.sleep(POLL)
    try: os.remove(PIDF)
    except Exception: pass


if __name__ == '__main__':
    main()
