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
# NPC 品檢結論（QA_npc20.md，2026-11-06）；重生品檢過後在此改狀態
QA_NPC = {'12':'pass','03':'pass','01':'pass','05':'pass','06':'pass','07':'pass','10':'pass','11':'pass','20':'pass','19':'pass','08':'pass',
          '14':'reject','18':'reject','13':'reject','15':'reject','17':'human','02':'human','04':'human','16':'human','09':'human'}
for v in NPCS.values():
    if v['file']:
        mm = re.search(r'NN_(\d\d)_', v['file'])
        if mm and mm.group(1) in QA_NPC:
            v['status'] = QA_NPC[mm.group(1)]
            v['nn'] = mm.group(1)

# r4 重生（11-08，Q4_K_S）品檢結果（QA_v2_agents_r4.md）：職務 → (採用 seed 或 None, status)；探員 16 位
AG_R4 = {'a01_captain': (7101, 'pass', 4), 'a02_navigator': (7112, 'pass', 4), 'a03_strategist': (7431, 'pass', 5), 'a04_scout': (7131, 'pass', 4),
         'a05_archivist': (7142, 'pass', 4), 'a06_interviewer': (7151, 'pass', 4), 'a07_photographer': (7162, 'pass', 4), 'a08_recorder': (7171, 'pass', 4),
         'a09_designer': (7181, 'pass', 4), 'a10_radio': (7192, 'pass', 4), 'a11_safety': (7442, 'pass', 5), 'a12_supply': (7401, 'pass', 5),
         'a13_forensic': (7221, 'pass', 4), 'a14_tech': (7231, 'pass', 4), 'a15_local_guide': (7411, 'human', 5), 'a16_actor': (7251, 'human', 4)}
# 母線 11-08 代決（可逆）：a02 s7112 有條件採用（缺地圖）；a11 兩張都不採用（紅十字為受保護標誌、s7201 名牌疑似字）；a07 採 s7162
AG_COND = {'a02_navigator': '有條件採用（r4 s7112）：缺摺疊地圖，肩與前臂有米色小方塊貼片（無字）；r5 重生仍缺地圖（s7421 退回），維持此張',
           'a15_local_guide': '需人眼：道具全中、半身，但臉是少女非五十多歲（熟齡是否硬性要求待定）',
           'a16_actor': '需人眼：r4 s7251 有手偶與立領背心，但面具戴在雙眼上、髮髻頂邊被裁；r5 s7451 面具拿在臉側且無手偶'}
AGENTS_R4 = {}
for k, (sd, stt, rnd) in AG_R4.items():
    f = D + 'char_%s_r%d_s%d_128.png' % (k, rnd, sd) if sd else None
    if f: assert (ROOT / f).exists(), f
    AGENTS_R4[k] = {'file': f, 'seed': sd, 'status': stt}
    if k in AG_COND: AGENTS_R4[k]['condition'] = AG_COND[k]
# NPC r4 重生：n14 過；n13、n18 需人眼；n02、n15 退回（舊 NN 檔對應的 stop 用新檔取代 n14／n13／n18）
NPC_R4 = {'s2': ('n14_archivist_r4_s7301', 'pass'), 't2': ('n13_signpost_r5_s7481', 'pass'), 's6': ('n18_carpenter_r5_s7491', 'pass'),
          'c2': ('n02_nightguard_r5_s7461', 'pass'), 't4': ('n15_janitor_r5_s7472', 'pass')}
for sid, (stem, stt) in NPC_R4.items():
    f = D + 'char_%s_128.png' % stem
    assert (ROOT / f).exists(), f
    if sid in NPCS:
        NPCS[sid].update({'file': f, 'status': stt, 'r4': True})

AGENTS_NOTE = '[品檢 QA_agents16_old：1 過 8 退回 7 需人眼；母線裁示 AG_IMG_ON 維持 false，只開品檢過的替補] 程式 js/walk_agents.js 已組路徑 art/agents16/NN_<en>_128.png；只要把 js/walk.js:1350 的 AG_IMG_ON 改 true。舊版 16 張未品檢（臺灣人長相未驗）'
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
    'npcs_by_stop': NPCS, 'agents': {'note': AGENTS_NOTE, 'ship_recommend': False, 'r4_Q4': AGENTS_R4},
    'stickers': STICKERS,
    'credits': 'CC BY 參考照的署名見 art/CREDITS.md「v2 製程成品對應」；上線頁面要有一行署名（結算頁或 walk_intro）。',
}
out = ROOT / 'art/ASSET_MANIFEST.json'
json.dump(man, open(out, 'w', encoding='utf-8', newline=''), ensure_ascii=False, indent=1)
js = '/* 由 build_manifest.py 產生；接線時 <script src="art/walk_assets.js?v=時間戳"> 載入，程式用 window.WALK_ASSETS */\nwindow.WALK_ASSETS = ' + json.dumps(man, ensure_ascii=False, indent=1) + ';\n'
open(ROOT / 'art/walk_assets.js', 'w', encoding='utf-8', newline='').write(js)
print('scenes', sum(1 for v in SCENES.values() if v['file']), '/', len(SCENES))
print('npcs', {k: (v['name'], os.path.basename(v['file']) if v['file'] else None) for k, v in NPCS.items()})

# 可上線／不可上線清單（只有 status==pass 算可上線）
def line(k, v): return '- %s：%s（%s）%s' % (k, v.get('name') or v.get('file') or '無', v['status'], v.get('note', ''))
ok, ng = [], []
for k, v in SCENES.items(): (ok if v['status'] == 'pass' else ng).append('場景 ' + line(k, v))
for k, v in NPCS.items(): (ok if v['status'] == 'pass' else ng).append('NPC ' + line(k, v))
for k, v in STICKERS['ach_status'].items(): (ok if v == 'pass' else ng).append('成就章 %s（%s）' % (k, v))
for k, v in STICKERS['footprint_status'].items(): (ok if v == 'pass' else ng).append('足跡 %s（%s）' % (k, v))
NL = chr(10)
for k, v in AGENTS_R4.items(): (ok if v['status'] == 'pass' else ng).append('探員 %s：%s（%s）%s' % (k, v['file'] or '無可用 seed', v['status'], v.get('condition', '')))
md = ('# 走讀美術 可上線／不可上線清單（自動由 build_manifest.py 產生）' + NL + NL
      + '只有品檢「過」才列可上線；human＝需楊老師肉眼，reject＝退回待重生，unqa＝沒品檢，missing＝沒成品。AG_IMG_ON 建議：false（探員替補品檢過幾位再說）。授權：pass 成品來源鏈已補齊（CREDITS 末段），walk_license_check exit=0；但需署名的 CC BY 成品（林百貨、赤崁樓、大天后宮、愛國婦人館風格版）在結算頁或 walk_intro 接線署名前，只算素材合格；臺灣建築照片著作權例外待法務確認。' + NL + NL
      + '## 可上線（%d）' % len(ok) + NL + NL.join(ok) + NL + NL + '## 不可上線（%d）' % len(ng) + NL + NL.join(ng) + NL)
open(ROOT / D / 'SHIP_LIST.md', 'w', encoding='utf-8', newline='').write(md)
print('ship ok', len(ok), 'not', len(ng))
