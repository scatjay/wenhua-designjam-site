# -*- coding: utf-8 -*-
"""探員替補 16 位（每位 2 個種子）＋NPC 退回 5 位（各 1 個種子），共 37 張；768×768 純文字（有核准低強度 Redux 參考者，第 2 個種子加 0.30）。
設計依據：品檢 QA_agents16_old.md／QA_npc20.md；職務形象取自 js/walk_agents.js 的 look，背景職業（fl）道具取自 ROLE_CARDS／jobs_r2_char；
規則（walk-real-reference-art 第七節）：臺灣人長相、性別年齡明寫、每位一個主色（不要全部土褐灰）、半身四分之三側身＋招牌動作、
不寫 pocket／badge／pin／patch／name tag 等容易長出字的詞（FLUX 不懂否定，寫「no text」反而招字），改寫「plain clean clothing」。
性別分配：探員 8 女 8 男；NPC 5 位 2 女 3 男。"""
import json
STY = ("chunky 16-bit pixel art with large visible square pixels, pixel art sprite portrait, 16-bit SNES JRPG character portrait, "
       "clean pixel art, clear dark outlines, soft shading with minimal dithering, half-body bust, three-quarter view, "
       "plain flat beige background, single character, plain clean solid-color clothing, ")
TAI = "Taiwanese features, warm light-brown skin tone, black or dark brown hair, dark brown eyes, "
# key: (職務, 中文名, 提示詞, [seed1, seed2], 第 2 個 seed 的 Redux 參考檔或 None)
A = {
 'a01_captain': ('隊長', 'confident middle-aged Taiwanese man field commander, ' + TAI + 'short neat black hair with a little gray at the temples, deep navy jacket with a bright orange scarf, one hand holding a white hard hat, a rolled blueprint tube under his other arm, calm sturdy stance', [7101, 7102], None),
 'a02_navigator': ('領航員', 'young Taiwanese woman navigator, ' + TAI + 'hair in a high ponytail, teal windbreaker jacket, a brass compass hanging from her neck, one hand holding a folded paper map, a woven bamboo hat hanging on her back, focused bright eyes', [7111, 7112], None),
 'a03_strategist': ('軍師', 'thoughtful Taiwanese man strategist in his thirties, ' + TAI + 'round glasses, plum purple long scarf over a cream shirt, one hand holding a small teacup, the other hand holding a white sphere on a thin pole, gentle smile', [7121, 7122], 's1103d_r2_ref_cehui.png'),
 'a04_scout': ('偵查員', 'energetic young Taiwanese woman scout, ' + TAI + 'red headband, bright green light vest, wide-brim straw hat pushed back, a small pair of binoculars raised in one hand, big grin', [7131, 7132], None),
 'a05_archivist': ('檔案官', 'gentle Taiwanese woman archivist in her thirties, ' + TAI + 'thin glasses, hair in a low bun, maroon knit vest over a white blouse, black sleeve covers on her forearms, a flat stack of manila folders in her arms, one finger with a little ink', [7141, 7142], None),
 'a06_interviewer': ('訪談員', 'warm Taiwanese woman interviewer, ' + TAI + 'shoulder-length hair, mustard yellow cardigan, one hand holding a small handheld microphone toward the viewer, the other hand holding a notebook, kind attentive expression', [7151, 7152], 's1103d_r2_ref_yangzhi.png'),
 'a07_photographer': ('蒐證員', 'cheerful young Taiwanese man photographer, ' + TAI + 'bright orange jacket, a cloth bucket hat, a camera hanging around his neck, one hand holding a small colorful ceramic dragon piece, playful wink', [7161, 7162], None),
 'a08_recorder': ('記錄官', 'quiet dreamy young Taiwanese man recorder, ' + TAI + 'slightly messy black hair, oversized lavender sweater, one hand holding a fountain pen, the other holding a closed leather journal, a thin paintbrush tucked behind his ear, soft smile', [7171, 7172], None),
 'a09_designer': ('文化設計員', 'colorful creative young Taiwanese woman game designer, ' + TAI + 'short bob hair with a small red bead earring, patchwork jacket of red blue and yellow squares, one hand holding a sketchbook, the other hand raising a pair of dice, excited expression', [7181, 7182], None),
 'a10_radio': ('通訊官', 'lively Taiwanese man radio operator in his thirties, ' + TAI + 'big black headset on his head, bright yellow scarf, one hand holding a handheld microphone, mischievous smile, a short antenna on his shoulder strap', [7191, 7192], None),
 'a11_safety': ('安全官', 'caring Taiwanese woman safety officer in her thirties, ' + TAI + 'hair tied back, fluorescent yellow reflective vest over a navy shirt, a silver whistle on a cord, a small white first aid pouch on her belt, warm protective eyes', [7201, 7202], None),
 'a12_supply': ('補給官', 'friendly round-cheeked Taiwanese man supply officer in his forties, ' + TAI + 'dark green vest, a huge backpack with many small pouches behind him, one hand holding a wooden abacus, cheerful smile', [7211, 7212], None),
 'a13_forensic': ('鑑識員', 'sharp middle-aged Taiwanese man forensic examiner, ' + TAI + 'dark blue work apron with curly wood shavings on the shoulder, one hand holding a large magnifying glass up to his eye, the other hand holding a pair of tweezers, cool analytical gaze', [7221, 7222], None),
 'a14_tech': ('技術專家', 'laid-back young Taiwanese man tech specialist, ' + TAI + 'goggles pushed up on his forehead, a leather tool belt, a coil of cable over his shoulder, one hand holding a big round white paper lantern painted with a green coiling dragon, sleepy half smile', [7231, 7232], 's1103d_r2_ref_dengji.png'),
 'a15_local_guide': ('在地嚮導', 'friendly talkative Taiwanese woman local guide in her fifties, ' + TAI + 'straw hat, cloth shoulder bag, a red apron over a floral blouse, comfortable slippers, one hand holding a small light-blue porcelain bowl of noodles, warm smile', [7241, 7242], 's1103d_r2_ref_danzai.png'),
 'a16_actor': ('扮演專員', 'theatrical young Taiwanese woman actor, ' + TAI + 'a plain white half mask pushed up on the side of her head, a costume vest of deep red and gold, one raised hand inside a glove puppet with a white porcelain painted head and a small headdress, dramatic pose, playful eyes', [7251, 7252], 's1103d_r2_ref_budaixi.png'),
}
N = {
 'n14_archivist': ('NN_14 檔案室管理員', 'young Taiwanese woman archivist, ' + TAI + 'round glasses, short black hair, white shirt with black sleeve garters, holding a flat stack of manila case folders and one blank cream memo sheet, serious polite look', [7301]),
 'n18_carpenter': ('NN_18 搬廟木匠學徒', 'young Taiwanese man carpenter apprentice, ' + TAI + 'white cloth headband, wooden workshop apron, one hand holding a yellow tape measure, the other hand holding a black wooden ink-line pot with a thin string, earnest honest face', [7311]),
 'n13_signpost': ('NN_13 路牌檢查員', 'Taiwanese woman road sign inspector, ' + TAI + 'orange safety vest and yellow hard hat, holding a green rectangular street sign board with a plain white stripe, a clipboard under her arm', [7321]),
 'n15_janitor': ('NN_15 老工友', 'elderly Taiwanese school janitor man, ' + TAI + 'short black-and-gray hair, gray work uniform, holding a straw broom in both hands, a ring of old keys hanging from his belt, kind weathered face', [7331]),
 'n02_nightguard': ('NN_02 夜班管理員', 'middle-aged Taiwanese night guard man, ' + TAI + 'plain dark cap, dark blue uniform jacket, a flashlight tucked under his left arm, a ring of keys on his belt, calm sleepy eyes', [7341]),
}
jobs = []
for k, (role, pr, seeds, ref) in A.items():
    for i, sd in enumerate(seeds):
        d = {'name': 'char_%s_r4_s%d' % (k, sd), 'prompt': STY + pr, 'seed': sd, 'w': 768, 'h': 768, 'redux': 0, 'cn': 0, 'style': 'agent'}
        if i == 1 and ref:
            d.update({'photo': ref, 'redux': 0.30, 'notext_words': 'text. letters. sign. label'})
        jobs.append(d)
for k, (zh, pr, seeds) in N.items():
    for sd in seeds:
        jobs.append({'name': 'char_%s_r4_s%d' % (k, sd), 'prompt': STY + pr, 'seed': sd, 'w': 768, 'h': 768, 'redux': 0, 'cn': 0, 'style': 'npc'})
json.dump(jobs, open('jobs_v2_agents.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), 'jobs;', sum(1 for j in jobs if j.get('photo')), 'with Redux ref')
