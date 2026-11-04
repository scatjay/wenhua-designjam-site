# -*- coding: utf-8 -*-
"""r2_retry 品檢（QA_r2_retry.md）退回項的第 2 輪重生。由 jobs_r2_retry.json 取提示詞後加強，換新種子。"""
import json
d = {j['name']: j for j in json.load(open('jobs_r2_retry.json', encoding='utf-8'))}
def mk(src, new, seed, add='', rep=(), st=None):
    j = dict(d[src]); p = j['prompt']
    for a, b in rep: p = p.replace(a, b)
    j.update(name=new, seed=seed, prompt=p + add)
    if st is not None and 'strength' in j: j['strength'] = st
    return j
ANEMO = ", the anemometer is a short stick with exactly three small round cups on three crossed arms like a tiny pinwheel, no cross shape, no light bulb"
FLAG = ", the flag is a triangular pennant, not swallowtail"
jobs = [
 mk('char_observer_r2_s3211', 'char_observer_r3_s3311', 3311, ANEMO + FLAG + ", clean empty corners, no signature, no scribbles"),
 mk('char_observer_r2_s3213', 'char_observer_r3_s3312', 3312, ANEMO + FLAG + ", clean empty corners, no signature, no scribbles"),
 mk('char_observer_r2_s3211', 'char_observer_r3_s3313', 3313, ANEMO + FLAG + ", clean empty corners, no signature, no scribbles"),
 mk('char_jianjian_r2_s4214', 'char_jianjian_r3_s4311', 4311, ", a white towel clearly hanging around the neck over the shoulders, no suspenders, no straps"),
 mk('char_jianjian_r2_s4214', 'char_jianjian_r3_s4312', 4312, ", a white towel clearly hanging around the neck over the shoulders, no suspenders, no straps"),
 mk('scene_police_A_r2_s2301', 'scene_police_A_r3_s2311', 2311, ", extreme wide establishing shot, camera far back, building takes only the middle third of the height, both left and right side wings fully visible with their own arched windows, nothing cropped at the sides, blank plain rectangular band panel without any writing", st=0.4),
 mk('scene_police_A_r2_s2302', 'scene_police_A_r3_s2312', 2312, ", extreme wide establishing shot, camera far back, building takes only the middle third of the height, both left and right side wings fully visible with their own arched windows, nothing cropped at the sides, blank plain rectangular band panel without any writing", st=0.4),
 mk('scene_butokuden_porch_r2_s1203', 'scene_butokuden_porch_r3_s1311', 1311, ", the white gable wall behind is completely plain and blank, no plaque, no sign, no dark marks or characters, no statues on the balustrade, the curved porch roof clearly verdigris teal-green", st=0.5),
 mk('scene_butokuden_porch_r2_s1204', 'scene_butokuden_porch_r3_s1312', 1312, ", the white gable wall behind is completely plain and blank, no plaque, no sign, no dark marks or characters, no statues on the balustrade, the curved porch roof clearly verdigris teal-green", st=0.5),
 mk('scene_butokuden_sideB_r2_s1205', 'scene_butokuden_sideB_r3_s1321', 1321, ", the ridge end ornaments are short straight vertical fins pointing straight up, not curled, not swallowtail, not bird shaped", st=0.5),
 mk('scene_butokuden_sideB_r2_s1206', 'scene_butokuden_sideB_r3_s1322', 1322, ", the ridge end ornaments are short straight vertical fins pointing straight up, not curled, not swallowtail, not bird shaped", st=0.5),
]
json.dump(jobs, open('jobs_r3_retry.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), [j['name'] for j in jobs])
