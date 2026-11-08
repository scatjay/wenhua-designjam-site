# -*- coding: utf-8 -*-
"""r5 重生工單（11-08，依 QA_v2_agents_r4.md 的建議）：全部不帶 Redux、半身、顏色取共用色盤內有的色段（琥珀、橘、赭、青綠、藏青、酒紅）。
必須重生：a12 補給官×2、a15 在地嚮導×2、n02 夜班管理員×2、n15 老工友×2；補生一張：a02、a03、a11×2、a16、n13、n18。共 17 張。
提示詞維持正面描述（FLUX 不懂否定），不寫 badge／pocket／name tag／cross 等易長出字或符號的詞。"""
import json
STY = ("chunky 16-bit pixel art with large visible square pixels, pixel art sprite portrait, 16-bit SNES JRPG character portrait, "
       "clean pixel art, clear dark outlines, soft shading with minimal dithering, half-body bust, three-quarter view, "
       "plain flat beige background, single character, plain clean solid-color clothing, ")
TAI = "Taiwanese features, warm light-brown skin tone, black or dark brown hair, dark brown eyes, "
HALF = "bust portrait cropped at the waist, face and shoulders large in the frame, "
J = [
 # (key, style, 提示詞, [seeds])
 ('a12_supply_r5', 'agent', 'friendly round-faced slim Taiwanese man supply officer in his forties, ' + TAI + 'short black hair, dark green vest over a white shirt with sleeves to the elbow, a medium brown backpack strap on the shoulder, holding a large brown wooden abacus with rows of round beads in front of his chest with both hands, cheerful smile, ' + HALF, [7401, 7402]),
 ('a15_local_guide_r5', 'agent', 'friendly talkative Taiwanese woman local guide in her fifties with a few wrinkles and gray streaks in her black hair, ' + TAI + 'wide straw hat, red apron over a floral blouse, one hand holding a small light-blue porcelain bowl of noodles up near her shoulder, warm smile, ' + HALF, [7411, 7412]),
 ('a02_navigator_r5', 'agent', 'young Taiwanese woman navigator, ' + TAI + 'hair in a high ponytail, teal windbreaker jacket, a brass compass clearly held in one hand, a folded paper map held open in the other hand, a woven bamboo hat on her back, focused bright eyes, ' + HALF, [7421]),
 ('a03_strategist_r5', 'agent', 'thoughtful Taiwanese man strategist in his thirties, ' + TAI + 'round glasses, charcoal gray long scarf over a cream shirt, one hand holding a small teacup, the other hand holding a white sphere on top of a thin wooden pole, gentle smile, ' + HALF, [7431]),
 ('a11_safety_r5', 'agent', 'caring Taiwanese woman safety officer in her thirties, ' + TAI + 'hair tied back, bright orange safety vest over a navy shirt, a silver whistle hanging on a cord around her neck, warm protective eyes, plain clean vest, ' + HALF, [7441, 7442]),
 ('a16_actor_r5', 'agent', 'theatrical young Taiwanese woman actor, ' + TAI + 'hair in a bun placed lower on the back of the head, a plain white half mask pushed up and resting on the top of her head above the forehead, costume vest of deep red and gold, one raised hand inside a glove puppet with a white porcelain painted head and a small headdress, dramatic pose, playful eyes, ' + HALF + 'plenty of space above the hair', [7451]),
 ('n02_nightguard_r5', 'npc', 'middle-aged Taiwanese night guard man, ' + TAI + 'plain dark cap, dark blue uniform jacket, holding a black flashlight in one hand in front of his chest and a ring of brass keys in the other hand, calm sleepy eyes, ' + HALF, [7461, 7462]),
 ('n15_janitor_r5', 'npc', 'elderly Taiwanese school janitor man in his sixties with deep wrinkles and gray hair, weathered kind face, ' + TAI + 'gray work uniform, holding a straw broom in both hands, a ring of old keys hanging from his belt, ' + HALF, [7471, 7472]),
 ('n13_signpost_r5', 'npc', 'Taiwanese woman road sign inspector in her thirties, ' + TAI + 'orange safety vest and yellow hard hat, holding a green rectangular street sign board with a plain white stripe in front of her chest, ' + HALF, [7481]),
 ('n18_carpenter_r5', 'npc', 'young Taiwanese man carpenter apprentice, ' + TAI + 'white cloth headband, wooden workshop apron, one hand holding a yellow tape measure with a visible round case, the other hand holding a black wooden ink-line pot with a thin string, earnest honest face, ' + HALF, [7491]),
]
jobs = []
for k, style, pr, seeds in J:
    for sd in seeds:
        jobs.append({'name': 'char_%s_s%d' % (k, sd), 'prompt': STY + pr, 'seed': sd, 'w': 768, 'h': 768, 'redux': 0, 'cn': 0, 'style': style})
json.dump(jobs, open('jobs_v2_agents_r5.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), 'jobs')
