# -*- coding: utf-8 -*-
"""r6 場景（只跑 1 輪）：換用 r6 預處理參考照（內容感知填補、金門板、八角窗描邊、靈佑宮程式畫立面樣板）。hayashi_A 在 r4／r5 已過，不重跑。"""
import json
d = {j['name']: j for j in json.load(open('jobs_r5_scene.json', encoding='utf-8'))}
REF = {'hayashi_B': ('s1103d_r6_hayashi_B.png', 0.55), 'matsu_A': ('s1103d_r6_matsu_A.png', 0.55), 'matsu_B': ('s1103d_r6_matsu_B.png', 0.55),
       'hall_B_aerial': ('s1103d_r6_hall_B.png', 0.6), 'patriotic_A': ('s1103d_r6_patriotic_A.png', 0.6), 'lingyou_A': ('s1103d_r6_lingyou_A.png', 0.6)}
EXTRA = {'lingyou_A': ", facade made of three bays: red-brown wall left, a center gate with two gray stone pillars and blue-green double doors, red-brown wall right, vivid vermilion red lintel beam, a row of yellow lanterns, two golden dragons with exactly three small golden figurines between them on the teal tile ridge"}
jobs = []
for k, (ref, st) in REF.items():
    j = dict(d['scene_%s_r5' % k]); j['name'] = 'scene_%s_r6' % k; j['seed'] = j['seed'] + 1000
    j['ref'] = ref; j['strength'] = st
    if k in EXTRA: j['prompt'] = j['prompt'] + EXTRA[k]
    jobs.append(j)
json.dump(jobs, open('jobs_r6_scene.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), [(j['name'], j['ref'], j['strength']) for j in jobs])
