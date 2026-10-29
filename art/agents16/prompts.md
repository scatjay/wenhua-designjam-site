# 16 位時安局探員 16 位元像素頭像（2026-10-29）

沿用 art/npc_pixel16 同一套流程：FLUX.1-dev Q8_0 GGUF（comfy-gen preset flux-dev-q8）768x768、24 步，每張約 2-3.5 分鐘（記憶體吃緊時較慢）。
後處理：PIL BOX 縮到 128x128 → 與背景（248,231,190）距離 <60 的像素設為背景色 → 右下角 16x12 若僅少量雜點則塗成背景 → 用 npc_pixel16/palette_shared.json（96 色共用調色盤＋背景色）quantize（不抖色）→ 另存最近鄰 8 倍 1024x1024（NN_xx.png）與 128（_128.png）。FLUX 原圖在 _raw/。
注意：BOX 縮放對全部 16 張一律採用（未用 proper-pixel-art 偵測格，因上批 6 張偵測本就不穩）；縮放後動漫感的圖也會變成像素風。

## 風格段
01-03、05-08 使用：`pixel art sprite portrait, 16-bit SNES JRPG character portrait, clean pixel art, limited palette, clear outlines, soft shading with minimal dithering, half-body bust, plain flat beige background, single character, no text, no letters, no logos, no numbers, no symbols, no writing on clothes`
04 重生、09-16 前面加 `chunky 16-bit pixel art with large visible square pixels, `（前幾張出現動漫貼紙風，加了之後較穩）。

## 共同識別
每位皆要求：左胸一枚素色圓形霧面銀色小徽章、表面全空白、無星形、無符號（`a small plain round matte silver badge on the left chest, completely blank smooth surface, no star, no symbol`）。01 隊長的徽章被畫成帶船錨（符合 look 欄位的 brass anchor pin，非真實機關符號）。

## 逐張紀錄（最終採用）
| 編號 | 職務 | 檔名 | 採用原圖 | seed | 重生 |
|---|---|---|---|---|---|
| 01 | 隊長 | 01_captain | 01_captain | 3001 | 否 |
| 02 | 領航員 | 02_navigator | 02_navigator | 3002 | 否（原圖動漫風，縮成 128 後可接受） |
| 03 | 軍師 | 03_strategist | 03_strategist | 3003 | 否 |
| 04 | 偵查員 | 04_scout | 04_scout_r2 | 3204 | 是 2 次（原 3004 貼紙風＋肩章符號；r1 3104 出現星形；r2 3204 袖口一枚素圓章） |
| 05 | 檔案官 | 05_archivist | 05_archivist | 3005 | 否 |
| 06 | 訪談員 | 06_interviewer | 06_interviewer | 3006 | 否 |
| 07 | 蒐證員 | 07_photographer | 07_photographer | 3007 | 否 |
| 08 | 記錄官 | 08_recorder | 08_recorder | 3008 | 否 |
| 09 | 文化設計員 | 09_designer | 09_designer_r1 | 3109 | 是（原 3009 袖口有符號貼片） |
| 10 | 通訊官 | 10_radio | 10_radio | 3010 | 否（去掉 antenna badge 字樣以免畫成符號） |
| 11 | 安全官 | 11_safety | 11_safety_r2 | 3211 | 是 2 次（3011 袖口紅十字；3111 白十字；r2 胸前名牌有字樣小圖，已用像素塗掉名牌並清掉左下角簽名樣小印記） |
| 12 | 補給官 | 12_supply | 12_supply_r2 | 3212 | 是 2 次（3012 肩章星形；3112 肩章圓形圖案；r2 乾淨，徽章在帽子上） |
| 13 | 鑑識員 | 13_forensic | 13_forensic | 3013 | 否 |
| 14 | 技術專家 | 14_tech | 14_tech_r1 | 3114 | 是（原 3014 胸前名牌） |
| 15 | 在地嚮導 | 15_local_guide | 15_local_guide | 3015 | 否 |
| 16 | 扮演專員 | 16_actor | 16_actor | 3016 | 否 |

## 角色段提示詞（後接共同識別與風格段）
01-08 角色段後接 `bust portrait cropped at the waist with the lower body not visible, large head`；09-16 後接 `bust portrait cropped at the waist`（去掉 large head：它讓畫面太特寫、風格偏動漫）。角色描述即 js/walk_agents.js 的 look 欄位原文（15 的 comfortable shoes 因半身不入鏡而略去；10 去掉 antenna badge）。
