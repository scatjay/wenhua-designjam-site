# -*- coding: utf-8 -*-
"""把 11-08 v2／Q4 生成完的成品（含退回的）整理進 art/v2_gen_archive/ 備查：各輪子資料夾放 128 圖（場景放 180x320），附 INDEX.md 與 index.json。
可重複執行（已有就覆蓋同名）。768 原圖太大不進 git，只在索引記路徑與 sha1 前 12 碼。用法：python archive_gen.py"""
import json, os, glob, shutil, hashlib, datetime, re
SITE = 'E:/Downloads/課程管理與備課/文化遊戲松_designjam/_site_master_wt/'
D = SITE + 'art/real_ref_pilot/_samples_1103d/'
RAW = 'E:/Downloads/_walk_refs/_raw/_samples_1103d/'
OUT = SITE + 'art/v2_gen_archive/'
S = 'C:/Users/user/AppData/Local/Temp/claude/95791ac1e5ee61d4/c1191369-0d37-48e7-8d65-ccaaeec5530a/scratchpad/'
Q4 = 'FLUX.1-dev Q4_K_S GGUF'
Q8 = 'FLUX.1-dev Q8_0 GGUF'

# 品檢結論（來源：QA_v2_agents_r4.md、QA_v2_agents_r5.md、QA_v2_police2.md；r6 與 police3 的品檢完成後補進來）
P = 'pass'; H = 'human'; R = 'reject'
R4 = {}
for k in 'a01_captain_s7101 a01_captain_s7102 a04_scout_s7131 a04_scout_s7132 a05_archivist_s7141 a05_archivist_s7142 a06_interviewer_s7151 a07_photographer_s7162 a08_recorder_s7171 a09_designer_s7181 a09_designer_s7182 a10_radio_s7191 a10_radio_s7192 a13_forensic_s7221 a14_tech_s7231 n14_archivist_s7301'.split(): R4[k] = P
for k in 'a02_navigator_s7112 a03_strategist_s7121 a07_photographer_s7161 a08_recorder_s7172 a11_safety_s7202 a13_forensic_s7222 a16_actor_s7251 n13_signpost_s7321 n18_carpenter_s7311'.split(): R4[k] = H
for k in 'a02_navigator_s7111 a03_strategist_s7122 a06_interviewer_s7152 a11_safety_s7201 a12_supply_s7211 a12_supply_s7212 a14_tech_s7232 a15_local_guide_s7241 a15_local_guide_s7242 a16_actor_s7252 n02_nightguard_s7341 n15_janitor_s7331'.split(): R4[k] = R
R4NOTE = {'a03_strategist_s7122': '帶 Redux 0.30 參考圖，整張壞掉', 'a06_interviewer_s7152': '帶 Redux，雜訊', 'a14_tech_s7232': '帶 Redux，全黑', 'a15_local_guide_s7242': '帶 Redux，原樣吐回麵碗照片', 'a16_actor_s7252': '帶 Redux，白底小人',
          'a11_safety_s7201': '胸前名牌疑似字樣', 'a11_safety_s7202': '紅十字貼片（母線代決：不得進遊戲）', 'a12_supply_s7211': '無算盤', 'a12_supply_s7212': '無算盤、肌肉男', 'a15_local_guide_s7241': '全身 Q 版、年齡不符',
          'a02_navigator_s7111': '缺羅盤與地圖', 'a02_navigator_s7112': '母線代決：有條件採用（缺地圖）', 'n02_nightguard_s7341': '無手電筒', 'n15_janitor_s7331': '年輕男孩、全身 Q 版'}
R5 = {'a03_strategist_s7431': P, 'a11_safety_s7442': P, 'a12_supply_s7401': P, 'a12_supply_s7402': P, 'n02_nightguard_s7461': P, 'n13_signpost_s7481': P, 'n15_janitor_s7472': P, 'n18_carpenter_s7491': P,
      'a15_local_guide_s7411': H, 'a16_actor_s7451': H, 'n02_nightguard_s7462': H, 'n15_janitor_s7471': H, 'a02_navigator_s7421': R, 'a11_safety_s7441': R, 'a15_local_guide_s7412': R}
R5NOTE = {'a11_safety_s7441': '胸前名牌放大可讀「POLICE」', 'a02_navigator_s7421': '仍缺摺疊地圖', 'a15_local_guide_s7412': '少女臉、斗笠壓住上半臉', 'a15_local_guide_s7411': '母線代決：有條件採用（臉偏年輕）',
          'a16_actor_s7451': '母線代決：不放行（面具在臉側、無手偶）', 'n02_nightguard_s7462': '手電筒像相機或手槍', 'n15_janitor_s7471': '畫面太小、掃把被切'}
EXTRA = {}   # 後補的輪次：{'r6': {名稱: (status, note)}, 'police3': {...}}
if os.path.exists(S + 'archive_extra.json'):
    EXTRA = json.load(open(S + 'archive_extra.json', encoding='utf-8'))

man = json.load(open(SITE + 'art/ASSET_MANIFEST.json', encoding='utf-8'))
adopted = set()
for v in man['agents']['r4_Q4'].values():
    if v.get('file'): adopted.add(os.path.basename(v['file']))
for v in man['npcs_by_stop'].values():
    if v.get('file'): adopted.add(os.path.basename(v['file']))
for v in man['scenes'].values():
    if v.get('file'): adopted.add(os.path.basename(v['file']))


def sha(p):
    h = hashlib.sha1()
    h.update(open(p, 'rb').read())
    return h.hexdigest()[:12]


def day(p):
    return datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat() if os.path.exists(p) else '查不到'


rows = []


def add(folder, name, png, status, note, model, workfile, kind, seed=None, redux=None):
    if not os.path.exists(png):
        return
    os.makedirs(OUT + folder, exist_ok=True)
    dst = OUT + folder + '/' + os.path.basename(png)
    shutil.copy2(png, dst)
    raw = RAW + name + '.png'
    rows.append({'folder': folder, 'file': 'art/v2_gen_archive/%s/%s' % (folder, os.path.basename(png)), 'name': name, 'kind': kind, 'seed': seed,
                 'model': model, 'workfile': workfile, 'status': status, 'adopted': os.path.basename(png) in adopted, 'note': note,
                 'raw_768': raw if os.path.exists(raw) else None, 'raw_sha1_12': sha(raw) if os.path.exists(raw) else None, 'generated': day(raw if os.path.exists(raw) else png)})


def seed_of(n):
    m = re.search(r's(\d{4})', n)
    return int(m.group(1)) if m else None


# r4 探員／NPC
for j in json.load(open(D + '_work/jobs_v2_agents.json', encoding='utf-8')):
    n = j['name']; key = re.sub(r'^char_|_r4', '', n)
    add('agents_npc_r4', n, D + n + '_128.png', R4.get(key, '未品檢'), R4NOTE.get(key, ''), Q4, '_work/jobs_v2_agents.json', 'npc' if '_n' in n[:7] else 'agent', seed_of(n))
# r5
for j in json.load(open(D + '_work/jobs_v2_agents_r5.json', encoding='utf-8')):
    n = j['name']; key = re.sub(r'^char_|_r5', '', n)
    add('agents_npc_r5', n, D + n + '_128.png', R5.get(key, '未品檢'), R5NOTE.get(key, ''), Q4, '_work/jobs_v2_agents_r5.json', 'npc' if '_n' in n[:7] else 'agent', seed_of(n))
# r6（品檢後補）
if os.path.exists(D + '_work/jobs_v2_agents_r6.json'):
    ex = EXTRA.get('r6', {})
    for j in json.load(open(D + '_work/jobs_v2_agents_r6.json', encoding='utf-8')):
        n = j['name']; st, nt = ex.get(n, ('未品檢', ''))
        add('agents_r6', n, D + n + '_128.png', st, nt, Q4, '_work/jobs_v2_agents_r6.json', 'agent', seed_of(n))
# Q8／Q4 對照
for tag, model in (('q4', Q4), ('q8', Q8)):
    for j in json.load(open(D + '_work/jobs_v2_cmp_%s.json' % tag, encoding='utf-8')):
        n = j['name']
        add('cmp_q8_vs_q4', n, D + n + '_128.png', '比對用', 'Q8／Q4 同 seed 對照，非成品', model, '_work/jobs_v2_cmp_%s.json' % tag, 'agent', seed_of(n))
# 警察署場景
for n, wf, st, nt in (('scene_police_A_v2b1', 'jobs_v2_police.json', R, '偽字、路面髒、紅旗、建築佔比約 28%（QA_v2_police2.md）'), ('scene_police_A_v2b2', 'jobs_v2_police.json', R, '圓塔招牌偽英文、建築畫成別的（QA_v2_police2.md）')):
    add('scenes_police', n, D + n + '_180x320.png', st, nt, Q8 + '＋flux depth／canny ControlNet', '_work/' + wf, 'scene', seed_of(n) or None)
for n in ('scene_police_A_v3a', 'scene_police_A_v3b', 'scene_police_A_v3c'):
    st, nt = EXTRA.get('police3', {}).get(n, ('未品檢', ''))
    add('scenes_police', n, D + n + '_180x320.png', st, nt, Q8 + '＋flux depth／canny ControlNet', '_work/jobs_v2_police3.json；prep_police_v3.py', 'scene')

json.dump({'generated_on': datetime.date.today().isoformat(), 'count': len(rows), 'items': rows}, open(OUT + 'index.json', 'w', encoding='utf-8', newline=''), ensure_ascii=False, indent=1)
from collections import Counter
cnt = Counter(r['status'] for r in rows)
md = ['# v2／Q4 生成成品備查索引', '', '更新：%s。本資料夾收 11-08 用 v2 製程（FLUX.1-dev Q4_K_S／Q8、無 Redux 或低 Redux）生成的人物與警察署場景，**含被品檢退回的**，供日後比對與追溯；上線只採 `ASSET_MANIFEST.json` 內 status＝pass 者。' % datetime.date.today().isoformat(), '',
      '768 原圖太大不進 git，存在 `E:/Downloads/_walk_refs/_raw/_samples_1103d/`，索引列路徑與 sha1 前 12 碼。工單、提示詞、seed 見各列「工單檔」（皆在 `art/real_ref_pilot/_samples_1103d/`）。品檢報告：`QA_v2_agents_r4.md`、`QA_v2_agents_r5.md`、`QA_v2_police2.md`。逐檔生成記錄與授權見 `art/CREDITS.md`。', '',
      '統計：共 %d 張；%s。' % (len(rows), '、'.join('%s %d' % kv for kv in cnt.most_common())), '',
      '| 資料夾 | 檔名 | 狀態 | 採用中 | seed | 模型 | 備註 |', '|---|---|---|---|---|---|---|']
for r in rows:
    md.append('| %s | %s | %s | %s | %s | %s | %s |' % (r['folder'], os.path.basename(r['file']), r['status'], '是' if r['adopted'] else '', r['seed'] or '', r['model'].split('＋')[0], r['note']))
open(OUT + 'INDEX.md', 'w', encoding='utf-8', newline='').write('\n'.join(md) + '\n')
print(len(rows), dict(cnt), sum(1 for r in rows if r['adopted']), 'adopted')
