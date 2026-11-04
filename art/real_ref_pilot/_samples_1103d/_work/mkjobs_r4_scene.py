# -*- coding: utf-8 -*-
"""r4 場景：改用 prep_refs_r4.py 預處理後的參考照（徽章／匾額／楹聯／殿內人影已塗成素面）；每類只跑 1 輪。
lingyou_A 的 LIN 照片為 BY-SA（只當形狀參考，不進成品），維持純提示詞；hall_B 沒有別的鳥瞰角度，改用緊裁版。"""
import json
d = {j['name']: j for j in json.load(open('jobs_r3_scene.json', encoding='utf-8'))}
REF = {'hayashi_A': ('s1103d_r4_hayashi_A.png', 0.55), 'hayashi_B': ('s1103d_r4_hayashi_B.png', 0.55),
       'matsu_A': ('s1103d_r4_matsu_A.png', 0.55), 'matsu_B': ('s1103d_r4_matsu_B.png', 0.55),
       'hall_B_aerial': ('s1103d_r4_hall_B.png', 0.6), 'patriotic_A': ('s1103d_r4_patriotic_A.png', 0.55),
       'lingyou_A': (None, None)}
jobs = []
for k, (ref, st) in REF.items():
    j = dict(d['scene_%s_r3' % k]); j['name'] = 'scene_%s_r4' % k; j['seed'] = j['seed'] + 1000
    if ref: j['ref'] = ref; j['strength'] = st
    jobs.append(j)
json.dump(jobs, open('jobs_r4_scene.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), [(j['name'], j.get('ref'), j.get('strength')) for j in jobs])
