# -*- coding: utf-8 -*-
"""r5 場景（r4 品檢後第二步，只跑 1 輪）：換用 r5 預處理參考照，並依 QA_r4_scene.md 的殘留項補強提示詞。"""
import json
d = {j['name']: j for j in json.load(open('jobs_r4_scene.json', encoding='utf-8'))}
REF = {'matsu_A': 's1103d_r5_matsu_A.png', 'matsu_B': 's1103d_r5_matsu_B.png',
       'patriotic_A': 's1103d_r5_patriotic_A.png', 'hall_B_aerial': 's1103d_r5_hall_B.png'}
ADD = {
 'hayashi_B': ", the balcony railing has exactly five simple plain round holes in a row, no letters, no characters, no patterns, no diamond emblem, no orange sign board",
 'matsu_A': ", the entrance doors are two plain golden door panels with a thin center seam, the lintel above is a plain red beam with no carving of characters, the red pillars are plain red lacquer without any vertical gold inscriptions",
 'matsu_B': ", the entrance doors are two plain golden door panels with a thin center seam, the red pillars are plain red lacquer without any vertical gold inscriptions or characters",
 'lingyou_A': ", wide facade showing the full width of all three bays, camera far back, bright vermilion red lintel beam clearly red not orange, exactly three small figurines between the two dragons, no yellow sign board on the wall",
 'hall_B_aerial': ", bare clean roof surfaces with no air conditioners, no white boxes, no rooftop equipment",
 'patriotic_A': ", the slim window on the ground floor right is an elongated octagon with eight straight sides, clearly not a circle, clean smooth blue sky with no patches",
}
jobs = []
for k, j0 in ((n.replace('scene_', '').replace('_r4', ''), j) for n, j in d.items()):
    j = dict(j0); j['name'] = 'scene_%s_r5' % k; j['seed'] = j['seed'] + 1000
    if k in REF: j['ref'] = REF[k]
    if k in ADD: j['prompt'] = j['prompt'] + ADD[k]
    jobs.append(j)
json.dump(jobs, open('jobs_r5_scene.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), [(j['name'], j.get('ref')) for j in jobs])
