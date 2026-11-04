# -*- coding: utf-8 -*-
"""r2_stickers 品檢（QA_r2_stickers.md）退回／偏小項第 2 輪。"""
import json
d = {j['name']: j for j in json.load(open('jobs_r2_stickers.json', encoding='utf-8'))}
BIG = ", the badge fills about 90 percent of the frame, large and centered"
ROUND = ", round enamel medal badge with a clear gold rim"
SQ = ", the sticker has a clean rounded-corner SQUARE shape as its base, filling about 90 percent of the frame, a flat colored square tile background inside the white outline"
FIX = {
 'seal_split': ("a compass rose in the middle and exactly three separate small footprint trails clearly branching out in three different directions from the center, each trail made of 3 to 4 tiny footprints" + BIG, 7101),
 'seal_gather': ("exactly five small identical round pawn tokens all in the same color, closely gathered around one small red flag, count them: five" + BIG, 7102),
 'seal_roles': ("three different tool icons arranged in a triangle: a magnifying glass, a notebook and a camera" + BIG, 7103),
 'fp_like': ("one big red heart with small sparkles inside a round enamel medal badge with a gold rim, the heart sits in the middle of the round gold-rimmed badge" + BIG, 7104),
 'fp_wow': ("a big yellow star burst with radiating lines and several small separate white sparkles around it" + BIG, 7105),
 'first_room': ("a small cozy house with a round door and a small golden-yellow brass key with a ring bow clearly drawn in front of the house" + SQ, 7106),
 'dex_collect': ("an open picture book with a small spotted egg resting on its pages" + SQ, 7107),
}
jobs = []
for k, (fx, seed) in FIX.items():
    src = d[[n for n in d if n.startswith('stk_' + k)][0]] if k not in ('first_room', 'dex_collect') else d['stk_%s_r2' % k]
    j = dict(src)
    base = "chunky 16-bit pixel art with large visible square pixels, SNES JRPG style, game sticker icon"
    shape = ROUND if k.startswith(('seal', 'fp')) and k != 'fp_like' else ""
    j.update(name='stk_%s_r3' % k, seed=seed,
             prompt=base + shape + ", " + fx + ", plain flat beige background, thick white sticker outline, clean dark outlines, soft shading, bright cheerful colors, no people, no faces, no text, no letters, no numbers, no logos, no writing")
    j.pop('ref', None); j.pop('strength', None)
    jobs.append(j)
json.dump(jobs, open('jobs_r3_stickers.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), [j['name'] for j in jobs])
