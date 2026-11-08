# r6 重生（11-08，母線代決）：a16 扮演專員 3 張（面具單獨寫成放頭頂、避免舉手、手偶與面具拆開）＋a15 在地嚮導補 2 張熟齡種子；Q4、半身、無 Redux。
import json
STY = ("chunky 16-bit pixel art with large visible square pixels, pixel art sprite portrait, 16-bit SNES JRPG character portrait, "
       "clean pixel art, clear dark outlines, soft shading with minimal dithering, half-body bust, three-quarter view, "
       "plain flat beige background, single character, plain clean solid-color clothing, ")
TAI = "Taiwanese features, warm light-brown skin tone, black or dark brown hair, dark brown eyes, "
HALF = "bust portrait cropped at the waist, face and shoulders large in the frame, "
J = [
 ('a16_actor_r6', 'agent', 'theatrical young Taiwanese woman actor, ' + TAI + 'hair in a low bun, a plain white half mask resting on top of her head above the forehead, both hands relaxed at her sides out of frame, costume vest of deep red and gold with a stand-up collar, playful eyes, ' + HALF + 'plenty of space above the hair', [7501, 7502]),
 ('a16_actor_r6p', 'agent', 'theatrical young Taiwanese woman actor, ' + TAI + 'hair in a low bun, costume vest of deep red and gold with a stand-up collar, one hand held at chest height inside a brown glove puppet with a white porcelain painted head and a small headdress, playful eyes, ' + HALF + 'plenty of space above the hair', [7503]),
 ('a15_local_guide_r6', 'agent', 'friendly talkative Taiwanese grandmother-aged woman local guide in her fifties, smile lines around the eyes, gray hair tied in a bun, ' + TAI + 'wide straw hat tilted back, red apron over a floral blouse, one hand holding a small light-blue porcelain bowl of noodles near her chest, warm smile, ' + HALF, [7511, 7512]),
]
jobs = []
for k, style, pr, seeds in J:
    for sd in seeds:
        jobs.append({'name': 'char_%s_s%d' % (k, sd), 'prompt': STY + pr, 'seed': sd, 'w': 768, 'h': 768, 'redux': 0, 'cn': 0, 'style': style})
json.dump(jobs, open('jobs_v2_agents_r6.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), 'jobs')
