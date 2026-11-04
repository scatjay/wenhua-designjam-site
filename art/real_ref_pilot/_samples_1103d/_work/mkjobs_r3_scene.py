# -*- coding: utf-8 -*-
"""r2_scene 品檢（QA_r2_scene.md）退回 7 張的第 2 輪：Redux strength 降低（少帶入參考照的字與人）、補強必現與負向。"""
import json
d = {j['name']: j for j in json.load(open('jobs_r2_scene.json', encoding='utf-8'))}
BLANK = ", every wall panel, plaque, lintel and gable is completely blank and smooth, no plaque, no emblem, no badge, no sign board, no characters, no inscription, no couplets, no banner with writing, doorway and courtyard completely empty with nobody inside or outside, no silhouette of a person, no yellow notice board"
FIX = {
 'hayashi_A': (BLANK + ", the gable and parapet walls are plain golden-brown brick with no emblem and no ornament", 5231, 0.4),
 'hayashi_B': (BLANK + ", the parapet and top floor walls are plain brick with no emblem, no round badge, no camera or dark box objects", 5232, 0.4),
 'matsu_A': (BLANK + ", two carved gray-white stone dragon pillars clearly visible in front of two gold carved door panels, the hall interior only dark and empty", 5241, 0.4),
 'matsu_B': (BLANK + ", the red cloth banner across the top is plain red without any writing, the hall interior only dark and empty", 5242, 0.4),
 'lingyou_A': (BLANK + ", the roof ridge clearly shows two colorful porcelain dragons facing the center with three small figurines between them, a row of round yellow lanterns under the eave, the red lintel is plain red wood, the blue-green wooden picket gate in the middle, only about 15 percent of the frame is sky", 5261, None),
 'hall_B_aerial': (", a strongly visible green folded roof on the front block, an old small wooden house with gray tiles beside it, clean empty rooftops without equipment, no cars, no vehicles, no people, no text", 5272, 0.35),
 'patriotic_A': (BLANK + ", the whole slim octagonal window on the ground floor right is fully visible and not cropped, clean uniform blue sky without blotches, the paved forecourt takes only the lower quarter", 5281, 0.4),
}
jobs = []
for k, (fx, seed, st) in FIX.items():
    j = dict(d['scene_%s_r2' % k]); j['name'] = 'scene_%s_r3' % k; j['seed'] = seed
    j['prompt'] = j['prompt'] + fx
    if st is not None and 'strength' in j: j['strength'] = st
    jobs.append(j)
json.dump(jobs, open('jobs_r3_scene.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), [j['name'] for j in jobs])
