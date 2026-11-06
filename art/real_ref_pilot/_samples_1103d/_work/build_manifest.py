# -*- coding: utf-8 -*-
"""產生 art/ASSET_MANIFEST.json 與 art/walk_assets.js（接線用；只讀遊戲程式，不改它）。
對應原則：場景＝最新品檢「過」的版本；「需人眼」「暫定」照實標 status；缺的給 null。
"""
import json, re, os
from pathlib import Path
ROOT = Path('E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt')
D = 'art/real_ref_pilot/_samples_1103d/'
D3 = 'art/real_ref_pilot/_samples_1103/'

def S(name, status, note='', folder=D):
    p = folder + ('scene_%s_180x320.png' % name)
    assert (ROOT / p).exists(), p
    return {'file': p, 'status': status, 'note': note}

SCENES = {
    's0': S('twl_A_r2', 'pass', '集合點，共用台文館'),
    's1': S('twl_A_r2', 'pass', '替代：scene_twl_B_tower_r2（過）；州會 scene_twh_A_r2、天橋 scene_twh_B_bridge_r2 需人眼'),
    's2': {'file': None, 'status': 'missing', 'note': '警察署 5 版全退回；備援 scene_police_B_r1（需人眼）；11-07 雙 ControlNet 重做'},
    's3': S('butokuden_front_scenepal', 'pass', '11-03 ACCEPT，楊老師稱讚過的取景', D3),
    's4': S('hayashi_A_r5', 'pass', '替代：scene_hayashi_B_v2d（過，上層特寫）'),
    's5': S('matsu_A_v2', 'pass', '替代：scene_matsu_B_v2c（需人眼）'),
    's6': S('chikan_A_r2', 'pass', '靈祐宮另有 scene_lingyou_A_v2c（文字過、文史待定，暫用）'),
    's7': S('twl_A_r2', 'pass', '終點，共用台文館'),
    't1': S('twl_A_r2', 'pass'),
    't2': S('tang_A_r2', 'human', '雕塑畫成鳥形，待重生'),
    't3': {'file': None, 'status': 'missing', 'note': '同 s2'},
    't4': S('butokuden_front_scenepal', 'pass', '', D3),
    't5': S('hayashi_A_r5', 'pass'),
    't6': S('matsu_A_v2', 'pass'),
    't7': S('chikan_A_r2', 'pass'),
    't8': S('hall_A_r2', 'pass'),
    't9': S('patriotic_A_v2_faithful_dt_median', 'human', 'median 修正後未複檢'),
    'tx': {'file': None, 'status': 'missing', 'note': '車站無照片，不做'},
    'tf': S('twl_A_r2', 'pass'),
}
STYLE_NIGHT = {  # 府城龐克版（展示用，楊老師決定要不要上）
    's4': S('hayashi_B_tainanpunk_c', 'provisional'),
    's5': S('matsu_A_tainanpunk', 'pass'),
    't5': S('hayashi_B_tainanpunk_c', 'provisional'),
    't6': S('matsu_A_tainanpunk', 'pass'),
    't8': S('hall_B_aerial_tainanpunk_c', 'provisional'),
    't9': S('patriotic_A_v2b_tainanpunk_dt', 'pass'),
}

# NPC：依 stop 的 npc.name 對 npc_pixel16/index.json
idx = json.load(open(ROOT / 'art/npc_pixel16/index.json', encoding='utf-8'))
ALIAS = {'公布欄上的便條（畢不了學姊）': '畢不了學姊', '時安局局長（廣播）': '時安局局長'}
def find_npc(name):
    n = ALIAS.get(name, name)
    if n in idx:
        return 'art/npc_pixel16/' + idx[n]['png_128']
    for k in idx:
        if k in n or n in k:
            return 'art/npc_pixel16/' + idx[k]['png_128']
    return None
NPCS = {}
for js in ['js/walk_route.js', 'js/walk_route_tw.js']:
    txt = open(ROOT / js, encoding='utf-8').read()
    for m in re.finditer(r"id:\s*'([a-z0-9]+)'[^\n]*?\n(?:.*\n){0,3}?\s*npc:\s*\{\s*name:\s*'([^']+)'", txt):
        sid, name = m.group(1), m.group(2)
        f = find_npc(name)
        NPCS[sid] = {'name': name, 'file': f, 'status': 'unqa' if f else 'missing'}
# 補抓同一行就有 npc 的（tw 檔寫法）
for js in ['js/walk_route_tw.js']:
    txt = open(ROOT / js, encoding='utf-8').read()
    for m in re.finditer(r"id:\s*'([a-z0-9]+)'.*?npc:\s*\{\s*name:\s*'([^']+)'", txt, re.S):
        sid, name = m.group(1), m.group(2)
        if sid not in NPCS and re.match(r'^t[0-9xf]$', sid):
            f = find_npc(name); NPCS[sid] = {'name': name, 'file': f, 'status': 'unqa' if f else 'missing'}

NPCS.pop('final', None)
if 'c0' not in NPCS:
    NPCS['c0'] = {'name': '公布欄上的便條（畢不了學姊）', 'file': find_npc('畢不了學姊'), 'status': 'unqa'}
AGENTS_NOTE = '程式 js/walk_agents.js 已組路徑 art/agents16/NN_<en>_128.png；只要把 js/walk.js:1350 的 AG_IMG_ON 改 true。舊版 16 張未品檢（臺灣人長相未驗）'
STICKERS = {
    'ach': {'split': D + 'stk_seal_split_r4_128.png', 'gather': D + 'stk_seal_gather_r4_128.png', 'roles': D + 'stk_seal_roles_r3_128.png'},
    'ach_status': {'split': 'provisional', 'gather': 'pass', 'roles': 'pass'},
    'case_default': D + 'stk_case_done_r2_128.png',
    'footprint': {'like': D + 'stk_fp_like_r3_128.png', 'wow': D + 'stk_fp_wow_r3_128.png', 'learn': D + 'stk_fp_learn_r2_128.png', 'pass': D + 'stk_fp_pass_r2_128.png'},
    'footprint_status': {'like': 'pass', 'wow': 'human', 'learn': 'pass', 'pass': 'pass'},
    'first_room': D + 'stk_first_room_r4_128.png', 'dex_collect': D + 'stk_dex_collect_r4_128.png',
}
for sec in [STICKERS['ach'], STICKERS['footprint']]:
    for v in sec.values(): assert (ROOT / v).exists(), v
for v in [STICKERS['case_default'], STICKERS['first_room'], STICKERS['dex_collect']]: assert (ROOT / v).exists(), v

man = {
    'version': '2026-11-06',
    'note': '路徑相對站台根目錄。status：pass＝品檢過；human＝需楊老師肉眼；provisional＝補圖後未複檢；unqa＝沒有品檢紀錄；missing＝沒有可用成品。',
    'sizes': {'scene': [180, 320], 'npc': [128, 128], 'agent': [128, 128], 'sticker': [128, 128]},
    'scenes': SCENES, 'scenes_night_tainanpunk': STYLE_NIGHT,
    'npcs_by_stop': NPCS, 'agents': {'note': AGENTS_NOTE},
    'stickers': STICKERS,
    'credits': 'CC BY 參考照的署名見 art/CREDITS.md「v2 製程成品對應」；上線頁面要有一行署名（結算頁或 walk_intro）。',
}
out = ROOT / 'art/ASSET_MANIFEST.json'
json.dump(man, open(out, 'w', encoding='utf-8', newline=''), ensure_ascii=False, indent=1)
js = '/* 由 build_manifest.py 產生；接線時 <script src="art/walk_assets.js?v=時間戳"> 載入，程式用 window.WALK_ASSETS */\nwindow.WALK_ASSETS = ' + json.dumps(man, ensure_ascii=False, indent=1) + ';\n'
open(ROOT / 'art/walk_assets.js', 'w', encoding='utf-8', newline='').write(js)
print('scenes', sum(1 for v in SCENES.values() if v['file']), '/', len(SCENES))
print('npcs', {k: (v['name'], os.path.basename(v['file']) if v['file'] else None) for k, v in NPCS.items()})
