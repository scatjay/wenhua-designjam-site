# v2／Q4 生成成品備查索引

更新：2026-11-08。本資料夾收 11-08 用 v2 製程（FLUX.1-dev Q4_K_S／Q8、無 Redux 或低 Redux）生成的人物與警察署場景，**含被品檢退回的**，供日後比對與追溯；上線只採 `ASSET_MANIFEST.json` 內 status＝pass 者。

768 原圖太大不進 git，存在 `E:/Downloads/_walk_refs/_raw/_samples_1103d/`，索引列路徑與 sha1 前 12 碼。工單、提示詞、seed 見各列「工單檔」（皆在 `art/real_ref_pilot/_samples_1103d/`）。品檢報告：`QA_v2_agents_r4.md`、`QA_v2_agents_r5.md`、`QA_v2_police2.md`。逐檔生成記錄與授權見 `art/CREDITS.md`。

統計：共 69 張；pass 26、reject 23、human 14、比對用 6。

| 資料夾 | 檔名 | 狀態 | 採用中 | seed | 模型 | 備註 |
|---|---|---|---|---|---|---|
| agents_npc_r4 | char_a01_captain_r4_s7101_128.png | pass | 是 | 7101 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a01_captain_r4_s7102_128.png | pass |  | 7102 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a02_navigator_r4_s7111_128.png | reject |  | 7111 | FLUX.1-dev Q4_K_S GGUF | 缺羅盤與地圖 |
| agents_npc_r4 | char_a02_navigator_r4_s7112_128.png | human | 是 | 7112 | FLUX.1-dev Q4_K_S GGUF | 母線代決：有條件採用（缺地圖） |
| agents_npc_r4 | char_a03_strategist_r4_s7121_128.png | human |  | 7121 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a03_strategist_r4_s7122_128.png | reject |  | 7122 | FLUX.1-dev Q4_K_S GGUF | 帶 Redux 0.30 參考圖，整張壞掉 |
| agents_npc_r4 | char_a04_scout_r4_s7131_128.png | pass | 是 | 7131 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a04_scout_r4_s7132_128.png | pass |  | 7132 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a05_archivist_r4_s7141_128.png | pass |  | 7141 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a05_archivist_r4_s7142_128.png | pass | 是 | 7142 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a06_interviewer_r4_s7151_128.png | pass | 是 | 7151 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a06_interviewer_r4_s7152_128.png | reject |  | 7152 | FLUX.1-dev Q4_K_S GGUF | 帶 Redux，雜訊 |
| agents_npc_r4 | char_a07_photographer_r4_s7161_128.png | human |  | 7161 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a07_photographer_r4_s7162_128.png | pass | 是 | 7162 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a08_recorder_r4_s7171_128.png | pass | 是 | 7171 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a08_recorder_r4_s7172_128.png | human |  | 7172 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a09_designer_r4_s7181_128.png | pass | 是 | 7181 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a09_designer_r4_s7182_128.png | pass |  | 7182 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a10_radio_r4_s7191_128.png | pass |  | 7191 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a10_radio_r4_s7192_128.png | pass | 是 | 7192 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a11_safety_r4_s7201_128.png | reject |  | 7201 | FLUX.1-dev Q4_K_S GGUF | 胸前名牌疑似字樣 |
| agents_npc_r4 | char_a11_safety_r4_s7202_128.png | human |  | 7202 | FLUX.1-dev Q4_K_S GGUF | 紅十字貼片（母線代決：不得進遊戲） |
| agents_npc_r4 | char_a12_supply_r4_s7211_128.png | reject |  | 7211 | FLUX.1-dev Q4_K_S GGUF | 無算盤 |
| agents_npc_r4 | char_a12_supply_r4_s7212_128.png | reject |  | 7212 | FLUX.1-dev Q4_K_S GGUF | 無算盤、肌肉男 |
| agents_npc_r4 | char_a13_forensic_r4_s7221_128.png | pass | 是 | 7221 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a13_forensic_r4_s7222_128.png | human |  | 7222 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a14_tech_r4_s7231_128.png | pass | 是 | 7231 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a14_tech_r4_s7232_128.png | reject |  | 7232 | FLUX.1-dev Q4_K_S GGUF | 帶 Redux，全黑 |
| agents_npc_r4 | char_a15_local_guide_r4_s7241_128.png | reject |  | 7241 | FLUX.1-dev Q4_K_S GGUF | 全身 Q 版、年齡不符 |
| agents_npc_r4 | char_a15_local_guide_r4_s7242_128.png | reject |  | 7242 | FLUX.1-dev Q4_K_S GGUF | 帶 Redux，原樣吐回麵碗照片 |
| agents_npc_r4 | char_a16_actor_r4_s7251_128.png | human |  | 7251 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_a16_actor_r4_s7252_128.png | reject |  | 7252 | FLUX.1-dev Q4_K_S GGUF | 帶 Redux，白底小人 |
| agents_npc_r4 | char_n14_archivist_r4_s7301_128.png | pass | 是 | 7301 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_n18_carpenter_r4_s7311_128.png | human |  | 7311 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_n13_signpost_r4_s7321_128.png | human |  | 7321 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r4 | char_n15_janitor_r4_s7331_128.png | reject |  | 7331 | FLUX.1-dev Q4_K_S GGUF | 年輕男孩、全身 Q 版 |
| agents_npc_r4 | char_n02_nightguard_r4_s7341_128.png | reject |  | 7341 | FLUX.1-dev Q4_K_S GGUF | 無手電筒 |
| agents_npc_r5 | char_a12_supply_r5_s7401_128.png | pass | 是 | 7401 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r5 | char_a12_supply_r5_s7402_128.png | pass |  | 7402 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r5 | char_a15_local_guide_r5_s7411_128.png | human | 是 | 7411 | FLUX.1-dev Q4_K_S GGUF | 母線代決：有條件採用（臉偏年輕） |
| agents_npc_r5 | char_a15_local_guide_r5_s7412_128.png | reject |  | 7412 | FLUX.1-dev Q4_K_S GGUF | 少女臉、斗笠壓住上半臉 |
| agents_npc_r5 | char_a02_navigator_r5_s7421_128.png | reject |  | 7421 | FLUX.1-dev Q4_K_S GGUF | 仍缺摺疊地圖 |
| agents_npc_r5 | char_a03_strategist_r5_s7431_128.png | pass | 是 | 7431 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r5 | char_a11_safety_r5_s7441_128.png | reject |  | 7441 | FLUX.1-dev Q4_K_S GGUF | 胸前名牌放大可讀「POLICE」 |
| agents_npc_r5 | char_a11_safety_r5_s7442_128.png | pass | 是 | 7442 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r5 | char_a16_actor_r5_s7451_128.png | human |  | 7451 | FLUX.1-dev Q4_K_S GGUF | 母線代決：不放行（面具在臉側、無手偶） |
| agents_npc_r5 | char_n02_nightguard_r5_s7461_128.png | pass | 是 | 7461 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r5 | char_n02_nightguard_r5_s7462_128.png | human |  | 7462 | FLUX.1-dev Q4_K_S GGUF | 手電筒像相機或手槍 |
| agents_npc_r5 | char_n15_janitor_r5_s7471_128.png | human |  | 7471 | FLUX.1-dev Q4_K_S GGUF | 畫面太小、掃把被切 |
| agents_npc_r5 | char_n15_janitor_r5_s7472_128.png | pass | 是 | 7472 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r5 | char_n13_signpost_r5_s7481_128.png | pass | 是 | 7481 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_npc_r5 | char_n18_carpenter_r5_s7491_128.png | pass | 是 | 7491 | FLUX.1-dev Q4_K_S GGUF |  |
| agents_r6 | char_a16_actor_r6_s7501_128.png | reject |  | 7501 | FLUX.1-dev Q4_K_S GGUF | 面具在頭頂但很小、無手偶 |
| agents_r6 | char_a16_actor_r6_s7502_128.png | reject |  | 7502 | FLUX.1-dev Q4_K_S GGUF | 面具在頭頂最清楚、無手偶 |
| agents_r6 | char_a16_actor_r6p_s7503_128.png | pass | 是 | 7503 | FLUX.1-dev Q4_K_S GGUF | 有條件採用（可逆）：只畫手偶、不戴面具；QA 需人眼，主線看圖判定偶清楚但偏小 |
| agents_r6 | char_a15_local_guide_r6_s7511_128.png | reject |  | 7511 | FLUX.1-dev Q4_K_S GGUF | 臉年輕無皺紋灰絲、碗偏青綠 |
| agents_r6 | char_a15_local_guide_r6_s7512_128.png | reject |  | 7512 | FLUX.1-dev Q4_K_S GGUF | 臉年輕無皺紋灰絲 |
| cmp_q8_vs_q4 | char_a03_strategist_r4_s7121_cmp_q4_128.png | 比對用 |  | 7121 | FLUX.1-dev Q4_K_S GGUF | Q8／Q4 同 seed 對照，非成品 |
| cmp_q8_vs_q4 | char_a11_safety_r4_s7201_cmp_q4_128.png | 比對用 |  | 7201 | FLUX.1-dev Q4_K_S GGUF | Q8／Q4 同 seed 對照，非成品 |
| cmp_q8_vs_q4 | char_a16_actor_r4_s7251_cmp_q4_128.png | 比對用 |  | 7251 | FLUX.1-dev Q4_K_S GGUF | Q8／Q4 同 seed 對照，非成品 |
| cmp_q8_vs_q4 | char_a03_strategist_r4_s7121_cmp_q8_128.png | 比對用 |  | 7121 | FLUX.1-dev Q8_0 GGUF | Q8／Q4 同 seed 對照，非成品 |
| cmp_q8_vs_q4 | char_a11_safety_r4_s7201_cmp_q8_128.png | 比對用 |  | 7201 | FLUX.1-dev Q8_0 GGUF | Q8／Q4 同 seed 對照，非成品 |
| cmp_q8_vs_q4 | char_a16_actor_r4_s7251_cmp_q8_128.png | 比對用 |  | 7251 | FLUX.1-dev Q8_0 GGUF | Q8／Q4 同 seed 對照，非成品 |
| scenes_police | scene_police_A_v2b1_180x320.png | reject |  |  | FLUX.1-dev Q8_0 GGUF | 偽字、路面髒、紅旗、建築佔比約 28%（QA_v2_police2.md） |
| scenes_police | scene_police_A_v2b2_180x320.png | reject |  |  | FLUX.1-dev Q8_0 GGUF | 圓塔招牌偽英文、建築畫成別的（QA_v2_police2.md） |
| scenes_police | scene_police_A_v3a_180x320.png | reject |  |  | FLUX.1-dev Q8_0 GGUF | 深紅招牌板與飾帶、門楣偽字、像戲院（QA_v2_police3.md） |
| scenes_police | scene_police_A_v3b_180x320.png | human |  |  | FLUX.1-dev Q8_0 GGUF | 門楣小字、屋頂細桿、檔案 46 KB；由 v3b_fix 取代 |
| scenes_police | scene_police_A_v3c_180x320.png | reject |  |  | FLUX.1-dev Q8_0 GGUF | 路面鮮紅像紅地毯、像歐式宮殿（QA_v2_police3.md） |
| scenes_police | scene_police_A_v3b_fix_180x320.png | pass | 是 |  | FLUX.1-dev Q8_0 GGUF | 有條件採用（可逆）：v3b 後處理衍生圖；QA 需人眼＝右側白飾與小頂亭偏弱，主線判為建築裝飾 |
