# -*- coding: utf-8 -*-
"""r2_props 品檢（QA_r2_props.md）退回項第 2 輪：純提示詞（不帶 Redux 參考照，避免把照片場景一起帶進來），
前置「單一物件、平底米色、無場景」，並依品檢的缺漏補強必現項。"""
import json
d = {j['name']: j for j in json.load(open('jobs_r2_props.json', encoding='utf-8'))}
PRE = "chunky 16-bit pixel art, a single isolated object centered on a completely plain flat beige background, no scene, no floor, no wall, no sky, no table, no shadow scene, nothing else in the picture, no person, no hands, no text, no letters, no numbers, "
FIX = {
 'abacus': "a rectangular dark brown wooden abacus frame lying flat seen from above, one horizontal beam dividing the beads into an upper and a lower section, about nine rows of round beads strung on vertical rods, beads a bit lighter than the frame",
 'inkline': "a boat-shaped wooden carpenter ink line tool with a small ink pot, a thin black string pulled out from the front, next to it a clearly L-shaped light wooden try square with two arms at a right angle",
 'compass': "a round orange-yellow lacquered geomantic compass disc, small round center compass with a red needle, concentric ring color bands without readable characters, red lacquer rim",
 'roadsign': "a green rectangular street sign plate with a thin white border and four tiny corner screws, the face completely blank plain green",
 'watch': "a gold round pocket watch with the lid open, crown and ring on top, a long chain hanging down, cream watch face with only small dots and two hands, no numbers",
 'document': "an old Chinese thread-bound book lying closed, cream paper cover with a blank label strip, stitched spine on the left with red thread, no writing anywhere",
 'gong': "a round bronze gong hanging in a dark red lacquered wooden frame with a small mallet, only the gong and its frame",
 'liftbtn': "a small vertical wall panel with one round elevator call button glowing, and above it a fan-shaped floor indicator with unlabeled dots, just the panel object",
 'facebrick': "a small stack pattern of old face bricks in mixed reddish-brown and yellow-brown tones, clearly some bricks yellow-brown and some red-brown, mortar lines",
 'broom': "a straw hand broom with a wooden handle and a small metal dustpan beside it, only these two objects",
 'oldkey': "an old brass key, golden-yellow brass color, round ring bow with a hole at the top, long shaft with teeth, a single key only",
 'lantern': "a round white paper lantern with a painted pattern of blue waves and magenta clouds in traditional style without any characters, hanging cord on top",
 'scanner': "a total station surveying instrument on a tripod, white ball-shaped lens housing, three tripod legs clearly visible, no logo, plain gray body",
 'trowel': "a plasterer's trowel with a wooden handle and steel blade, resting next to a small square patch of half-plastered gray cement wall, no marks on the handle",
}
jobs = []
for k, fx in FIX.items():
    j = dict(d['prop_%s_r2' % k]); j.pop('ref', None); j.pop('strength', None)
    j.update(name='prop_%s_r3' % k, seed=j['seed'] + 1000,
             prompt=PRE + fx + ", clean dark outlines, soft shading, 16-bit SNES JRPG item icon style, no text, no letters, no numbers, no logos")
    jobs.append(j)
json.dump(jobs, open('jobs_r3_props.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs))
