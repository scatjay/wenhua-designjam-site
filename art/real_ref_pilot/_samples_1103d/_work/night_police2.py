# -*- coding: utf-8 -*-
"""夜間批次排程：等到預約時間才 start 預約、跑警察署雙 ControlNet 批次、done、確認伺服器釋放。
被拒就直接結束（不重試、不反覆開關 ComfyUI）。等待期間幾乎不耗 CPU（sleep 30 秒一次）。"""
import subprocess, sys, time, datetime, os, psutil
RID = '07061940'
RS = 'E:/Downloads/mcp-governance/tools/resource_schedule.py'
W = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/art/real_ref_pilot/_samples_1103d/_work'
S = 'C:/Users/user/AppData/Local/Temp/claude/95791ac1e5ee61d4/c1191369-0d37-48e7-8d65-ccaaeec5530a/scratchpad'
LOG = S + '/night_police2.log'


def log(m):
    open(LOG, 'a', encoding='utf-8').write(time.strftime('%m-%d %H:%M:%S ') + m + '\n')


def server_listening():
    return any(x.status == 'LISTEN' and x.laddr.port == 8288 for x in psutil.net_connections(kind='tcp'))


def kill_server():
    for x in psutil.net_connections(kind='tcp'):
        if x.status == 'LISTEN' and x.laddr.port == 8288 and x.pid:
            try:
                psutil.Process(x.pid).kill(); log('killed server %d' % x.pid)
            except Exception as e:
                log('kill err %s' % e)


target = datetime.datetime.now().replace(hour=3, minute=40, second=0, microsecond=0)
if target <= datetime.datetime.now():
    target += datetime.timedelta(days=1)
log('waiting until %s' % target)
while datetime.datetime.now() < target:
    time.sleep(30)
r = subprocess.run([sys.executable, RS, 'start', RID], capture_output=True, text=True, timeout=60)
log('start: rc=%s %s %s' % (r.returncode, r.stdout.strip()[:200], r.stderr.strip()[:200]))
if r.returncode != 0 or '✋' in r.stdout or '拒' in r.stdout:
    log('預約被拒，結束（不重試）'); sys.exit(2)
try:
    env = dict(os.environ, WAIT_GB='80', PIX_METHOD='median', PIX_COLORS='48', PROTECT_LIST='stone lion. lion statue. balustrade. window')
    rr = subprocess.run(['D:/Git/bin/bash.exe', W + '/run_v2_batch.sh', 'jobs_v2_police.json', S + '/v2pol'], cwd=W, env=env, capture_output=True, text=True, timeout=2400)
    open(S + '/v2pol.out', 'w', encoding='utf-8').write(rr.stdout[-6000:] + rr.stderr[-2000:])
    log('batch rc=%s' % rr.returncode)
except subprocess.TimeoutExpired:
    log('batch 逾時 40 分，強制收')
finally:
    kill_server()
    time.sleep(2)
    r = subprocess.run([sys.executable, RS, 'done', RID], capture_output=True, text=True, timeout=60)
    log('done: rc=%s %s' % (r.returncode, r.stdout.strip()[:160]))
    log('port 8288 listening after = %s' % server_listening())
