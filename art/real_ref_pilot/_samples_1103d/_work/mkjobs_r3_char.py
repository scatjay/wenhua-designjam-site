# -*- coding: utf-8 -*-
"""r2_char 品檢（QA_r2_char.md）退回項第 2 輪：不帶 Redux 參考照（第二張用 Redux 8 張失敗 6 張）、
同職業另一張改為與第 1 輪相反的性別（全批只有 3 位女性）、手持物簡化並拆成一手一件、胸前不放標籤徽章。"""
import json
d = {j['name']: j for j in json.load(open('jobs_r2_char.json', encoding='utf-8'))}
base = d['char_yangzhi_r2_s6121']['prompt']
STY = base[:base.index('young Taiwanese fish farmer')]
TAIL = ", plain clothes with nothing on the chest or shoulders, no badge, no label, no patch, no logo, bust portrait cropped at the waist, a person clearly visible filling most of the frame"
P = {
 'yangzhi_f': ("young Taiwanese woman fish farmer, Taiwanese features, black hair in a ponytail, baseball cap, light blue polo shirt, in her right hand a slender silver milkfish with a deeply forked tail held up, in her left hand a smartphone held up, a small paddlewheel aerator with two dark blue floats drawn small behind her shoulder", 6321),
 'yangzhi_m': ("young Taiwanese man fish farmer, Taiwanese features, short black hair, baseball cap, light blue polo shirt, in his right hand a slender silver milkfish with a deeply forked tail held up, in his left hand a smartphone held up", 6322),
 'cehui_f': ("Taiwanese woman heritage surveyor, Taiwanese features, short black hair, round glasses, utility vest over a plain shirt, in her right hand a white sphere target on a thin pole held up, in her left hand a tablet, a small tripod with a boxy laser scanner beside her", 6341),
 'caihui_f': ("Taiwanese woman temple painter craftsperson, Taiwanese features, black hair tied back, simple dark apron over a work shirt, in her right hand a long thin paintbrush held up, in her left hand a flat wooden straightedge ruler held up, a half-finished red wooden door board behind her with thin gold lines", 6351),
 'wutai_f': ("cheerful Taiwanese woman stage truck host, Taiwanese features, black hair, wireless headset microphone, shiny dark jacket with colorful neon stripes only on the sleeves, one hand holding a handheld microphone, the other hand pointing to the side, two stacked black speaker boxes beside her, completely plain chest", 6371),
 'dengji_m': ("Taiwanese man lantern painter, Taiwanese features, black hair, paint-spotted apron over a long-sleeve shirt, in one hand a big round white paper lantern painted with a green coiling Chinese dragon with red flames, in the other hand a fine paintbrush, the lantern has no writing", 6381),
 'muzuo_f': ("Taiwanese woman carpenter, Taiwanese features, black hair tied back, canvas apron with wood shavings, in her right hand a boat-shaped wooden ink line marker with a thin black string held up at chest height, in her left hand a wooden L-shaped try square with two arms at a right angle held up at chest height", 6391),
 'muzuo_m': ("Taiwanese man carpenter, Taiwanese features, black hair, canvas apron with wood shavings, in his right hand a boat-shaped wooden ink line marker with a thin black string held up at chest height, in his left hand a wooden L-shaped try square with two arms at a right angle held up at chest height", 6392),
 'danzai_f': ("middle-aged Taiwanese woman street noodle vendor, Taiwanese features, black hair in a bun, white sleeveless undershirt and clean apron, a wooden shoulder pole across her shoulder with a bamboo basket hanging at each end, one hand holding a small light blue porcelain bowl of noodles, a small blank red paper lantern hanging from the pole", 6401),
 'danzai_m': ("middle-aged Taiwanese man street noodle vendor, Taiwanese features, black hair, white sleeveless undershirt and clean apron, a thin wooden shoulder pole across his shoulder with a bamboo basket hanging at each end, one hand holding a small light blue porcelain bowl of noodles, a small blank red paper lantern hanging from the pole", 6402),
 'budaixi_f': ("Taiwanese woman glove puppet master, Taiwanese features, black hair, simple dark traditional shirt, one raised hand inside a cloth glove puppet that is only a head and a robe over her hand with no legs and no feet, white porcelain painted head, pink embroidered robe, small headdress, the puppeteer's face and body clearly visible", 6411),
}
jobs = []
for k, (fx, seed) in P.items():
    j = dict(d['char_yangzhi_r2_s6121']); j.pop('ref', None); j.pop('strength', None)
    j.update(name='char_%s_r3_s%d' % (k, seed), framing='r3 ' + k, seed=seed, prompt=STY + fx + TAIL)
    jobs.append(j)
json.dump(jobs, open('jobs_r3_char.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), [j['name'] for j in jobs])
