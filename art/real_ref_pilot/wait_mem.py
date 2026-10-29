import sys, time
sys.path.insert(0, 'E:/Downloads/mcp-governance/tools')
import mem_watchdog as W
thr = float(sys.argv[1]); mx = float(sys.argv[2]); t0 = time.time(); ok = 0; lo = 9
while time.time() - t0 < mx:
    c, l = W.perf(); r = c / l; lo = min(lo, r)
    ok = ok + 1 if r < thr else 0
    if ok >= 3:
        print('GREEN', round(c / 2**30, 1), round(r, 3)); sys.exit(0)
    time.sleep(10)
print('TIMEOUT lowest', round(lo, 3)); sys.exit(1)
