# 走讀 NPC 16 位元像素頭像 提示詞紀錄（2026-10-29）

生成：FLUX.1-dev Q8_0 GGUF（preset flux-dev-q8，comfy-gen）｜768x768｜24 步｜每張約 111-131 秒（RTX 3070 8GB）。
提示詞 = 角色段 + 共用風格段（第一批 01-09 的風格段少了 no numbers／no symbols，其餘相同）。
共用風格段：`pixel art sprite portrait, 16-bit SNES JRPG character portrait, clean pixel art, limited palette, clear outlines, soft shading with minimal dithering, half-body bust, plain flat beige background, single character, no text, no letters, no logos, no numbers, no symbols, no writing on clothes`

FLUX 沒有負面提示欄位；楊老師要的負面詞（8-bit、NES、blurry、anti-aliased、realistic、text、letters、logo）無法使用，只能寫成正面描述，已把 no text/letters/logos 與 16-bit SNES 寫進風格段。

## 後處理（最終採用）
1. proper-pixel-art（MIT，E:/Downloads/_er3d_assets/repos_2d3d/proper-pixel-art，pixelate() 預設設定）偵測像素格並還原；FLUX 輸出的格子約 6-10 px，所以最終解析度採 **128x128**（96 太糊：鑰匙、手看不清，已實測比較）。
2. 偵測格寬 >=15 px 的 6 張（02、11、15、17、18、19）網格偵測不穩（02 的臉被裁、15/18/19 出現雜訊），改用 PIL BOX 縮到 128。
3. 共用調色盤：全部 20 張的前景像素拼成一張圖，MEDIANCUT 取 95 色加背景色 1 色＝96 色共用調色盤（palette_shared.json），每張再用此調色盤 quantize(palette=..., dither=NONE)。每張實際用到 67-97 色。未使用 ComfyUI-PixelPipeline 節點，改用 PIL 達成同樣效果；與原本「每張 32 色」不同，原因是 32 色時臉與膚色層次過少。
4. 背景統一為同一米色 RGB(248,231,190)：與背景距離小於 60（RGB 絕對差總和）的像素一律設成該色；右下角 16x12 範圍若只有少量非背景點（生成器偶爾留下的小印記）就塗成背景色（04 號 3 px、11 號、19 號有觸發）。
5. 輸出：NN_<編號>_<短名>_128.png（遊戲內用，128x128）與 NN_<編號>_<短名>.png（NEAREST 放大 8 倍＝1024x1024，不是 768）。FLUX 原圖（768）移到 _raw/。

## 授權
pixel-art-xl 與 animagine 模型授權待楊老師確認是否可用於課程與公開遊戲（只用於 A/B 測試，最終成品未使用）；FLUX.1-dev 授權亦請楊老師確認公開遊戲用途。

## A/B 測試（校史館志工學姊，存於 _ab/）
A=FLUX＋後處理（2 張，約 117-121 秒）；B=SDXL animagine-xl4＋pixel-art-xl LoRA 強度 1.0、1024x1024、28 步（2 張，約 24 秒）。B 變成動漫特寫臉、半身構圖失敗、邊緣有色散雜點、手與鑰匙混亂、B2 背心冒出像徽章/字樣的圖樣、背景色偏。結論：A 明顯較像 16-bit JRPG 頭像，選 A（耗時較長但品質差距大）。

## 逐張紀錄

| 編號 | 中文名 | 檔名 | 採用 seed | 秒 | 重生 | 需人工看／備註 | 色數 | 後處理 |
|---|---|---|---|---|---|---|---|---|
| 01 | 校史館的志工學姊 | NN_01_volunteer | 2031 | 112 | 是（原 seed 2001 背心有白色星形小圖樣；採 2031） | 背心被畫成圍裙狀；手持銅鑰匙清楚 | 82 | ppa_w=6 |
| 02 | 西淮館的夜班管理員 | NN_02_night_guard | 2043 | 120 | 是（2002 帽徽為金星；r1 2035 為圓徽；r2 2043 仍有小圓徽，縮到 128 後糊成一點） | 需人工看：帽上小圓徽（已用盡兩次重生） | 87 | ppa_w=26 偵測不穩，改用 BOX 縮放 |
| 03 | 銅像旁的老園丁 | NN_03_gardener | 2003 | 125 | 否 | 否 | 97 | ppa_w=6 |
| 04 | 時安局局長 | NN_04_chief | 2032 | 111 | 是（2004 領口與肩有金色小符號；2032 已拿掉） | 胸口小收音機保留；錶鍊在 128 下偏細 | 93 | ppa_w=8；右下角小印記已塗成背景色(3 px) |
| 05 | 畢不了學姊 | NN_05_senior_student | 2005 | 118 | 否 | 否 | 97 | ppa_w=8 |
| 06 | 還書櫃旁的夜讀生 | NN_06_night_reader | 2006 | 122 | 否 | 背包上有小紅點（燈），非文字 | 95 | ppa_w=10 |
| 07 | 夜跑的學長 | NN_07_night_runner | 2033 | 114 | 是（2007 背心有數字 10；2033 純色無數字） | 否 | 90 | ppa_w=6 |
| 08 | 水邊的看守者 | NN_08_water_watcher | 2008 | 117 | 否 | 構圖偏全身（半身要求未完全達成） | 72 | ppa_w=12 |
| 09 | 榕樹下的老先生 | NN_09_banyan_elder | 2009 | 118 | 否 | 偏全身；手在背後 | 68 | ppa_w=8 |
| 10 | 守夜的警衛伯伯 | NN_10_guard_uncle | 2041 | 123 | 是（2010 帽徽紅星；r1 2034 帽上有黃色扳手狀徽；r2 2041 帽徽空白） | 保溫杯清楚，另一手拿深色瓶子而非手電筒（可接受） | 90 | ppa_w=8 |
| 11 | 涼亭裡的等車阿姨 | NN_11_aunt_waiting | 2012 | 122 | 否 | 臉部縮小後稍糊（已改 BOX 縮放） | 88 | ppa_w=15 偵測不穩，改用 BOX 縮放 |
| 12 | 州知事的祕書 | NN_12_governor_secretary | 2013 | 131 | 否 | 否 | 77 | ppa_w=6 |
| 13 | 圓環旁的路牌檢查員 | NN_13_signpost_inspector | 2014 | 118 | 否 | 只有夾板，沒有小路牌（提示詞未達成） | 94 | ppa_w=6 |
| 14 | 檔案室管理員 | NN_14_archivist | 2015 | 114 | 否 | 拿的像舊書堆而非檔案夾 | 84 | ppa_w=10 |
| 15 | 看守校舍的老工友 | NN_15_school_janitor | 2016 | 117 | 否 | 鑰匙串在腰側很小；已改 BOX 縮放 | 75 | ppa_w=19 偵測不穩，改用 BOX 縮放 |
| 16 | 電梯學徒（時安局編外） | NN_16_elevator_apprentice | 2042 | 119 | 是（2017 帽徽閃電形加背心方形徽；2042 僅一顆金扣） | 否 | 91 | ppa_w=8 |
| 17 | 三郊的老帳房 | NN_17_old_accountant | 2018 | 114 | 否 | 偏全身、人物較小；算盤上有格線 | 69 | ppa_w=21 偵測不穩，改用 BOX 縮放 |
| 18 | 搬廟那年的木匠學徒 | NN_18_carpenter_apprentice | 2019 | 112 | 否 | 否 | 68 | ppa_w=18 偵測不穩，改用 BOX 縮放 |
| 19 | 夜間守門人 | NN_19_night_gatekeeper | 2020 | 112 | 否 | 原圖右下角有小印記，已塗成背景色；下緣被裁 | 82 | ppa_w=22 偵測不穩，改用 BOX 縮放；右下角小印記已塗成背景色(30 px) |
| 20 | 老圖書館員 | NN_20_old_librarian | 2021 | 112 | 否 | 否 | 83 | ppa_w=10 |

## 完整提示詞（角色段；後面接共用風格段）

- 01 校史館的志工學姊（seed 2031）：young Taiwanese university woman volunteer with shoulder-length black hair, solid plain orange-yellow vest with completely blank front and no marks, plain white shirt, holding a small brass key, smiling cheerfully
- 02 西淮館的夜班管理員（seed 2043）：middle-aged night-shift building caretaker in a plain dark uniform and a plain dark flat cap with a blank front, bare cap without any badge or emblem or symbol, holding a flashlight in one hand and a ring of keys in the other, calm stiff expression
- 03 銅像旁的老園丁（seed 2003）：elderly gardener with a straw hat and green apron, holding a large pair of garden pruning shears clearly in one hand, kind weathered face
- 04 時安局局長（seed 2032）：dignified elderly chief with white hair and white beard, dark navy formal uniform with plain gold buttons and plain gold shoulder epaulettes, plain collar with no insignia, holding a pocket watch on a chain, small old radio on his chest, calm composed expression
- 05 畢不了學姊（seed 2005）：tired but cute university senior girl with messy hair and dark circles, huge backpack, holding a stack of paper forms, weary half-smile
- 06 還書櫃旁的夜讀生（seed 2006）：young university student with headphones around neck, stack of thick books beside him, smirking challenging look, holding one book
- 07 夜跑的學長（seed 2033）：young male university senior in a solid plain green sports tank top with no number and no print, armband, sweaty, panting with a big grin, towel around neck, hands holding the towel
- 08 水邊的看守者（seed 2008）：fictional quiet mysterious watcher wearing a long hooded cloak, calm silent expression, hands hidden inside the cloak, faint blue tint
- 09 榕樹下的老先生（seed 2009）：elderly man in plain old-fashioned shirt, hands clasped behind his back, few words, gentle serious expression, wise wrinkled face
- 10 守夜的警衛伯伯（seed 2041）：middle-aged night watch security guard uncle in a plain gray work shirt and a plain gray flat cap with a blank front, bare cap without any badge or emblem or symbol, holding a flashlight in one hand and a thermos flask in the other, tired kind face
- 11 涼亭裡的等車阿姨（seed 2012）：chatty cheerful middle-aged auntie with permed hair, holding shopping bags in both hands, big friendly smile
- 12 州知事的祕書（seed 2013）：impatient anxious young man in an old Western-style vest and shirt with bow tie, pinching a pocket watch with one hand, hurried expression, plain uniform without any emblem or flag
- 13 圓環旁的路牌檢查員（seed 2014）：road sign inspector wearing a yellow safety helmet, holding a clipboard and a small blank road sign, focused expression
- 14 檔案室管理員（seed 2015）：archive room keeper with round glasses and sleeve covers on his forearms, holding a stack of folders, neat and quiet
- 15 看守校舍的老工友（seed 2016）：old gentle school janitor in worn work clothes, a big ring of keys hanging from his belt and held in one hand, warm smile
- 16 電梯學徒（時安局編外）（seed 2042）：young apprentice wearing a plain dark pillbox cap with a blank front, bare cap without any badge or emblem or symbol, plain vest with blank front, white gloves, eager earnest expression
- 17 三郊的老帳房（seed 2018）：old accountant in a long traditional robe, thin-framed round glasses, holding a wooden abacus, no religious items, scholarly expression
- 18 搬廟那年的木匠學徒（seed 2019）：honest earnest young carpenter apprentice with a cloth headband, holding a wooden ruler and a chisel, simple work clothes, no statue
- 19 夜間守門人（seed 2020）：stern night gatekeeper holding a lit hand lantern and a large old iron key, dark coat, serious expression
- 20 老圖書館員（seed 2021）：gentle old librarian with glasses on a chain, holding a book against her chest, warm kind smile, cardigan

## 備註
- 重生：01/04/07/16 各 1 次，02/10 各 2 次（楊老師要求拿掉徽章與數字）；02 重生 2 次後仍有小圓徽，需人工看。
- 未下載模型、未安裝節點、未 git。

## 2026-10-29 第二輪修正（08/09/13/15/17/19 改半身）
後處理同上（PIL BOX 縮 128、共用調色盤、米色背景），舊版移到 _raw/old_NN_*。新原圖在 _raw_fix/。第二輪的風格段在 17、13 重生時前面加了 `chunky 16-bit pixel art with large visible square pixels, `。
| 編號 | 採用原圖 | seed | 備註 |
|---|---|---|---|
| 08 | 08_water_watcher | 2108 | 半身連帽披風、雙手交疊；下緣有一圈水波（氛圍），共用調色盤使披風偏綠 |
| 09 | 09_banyan_elder | 2109 | 雙手交疊在身前；兩側榕樹葉與垂根；表情偏嚴肅、人物較小 |
| 13 | 13_signpost_inspector_r4 | 2614 | 雙手拿空白灰色路牌板（無字）；改成無夾板（夾板版 2014/2314/2514 都沒有路牌或變全身） |
| 15 | 15_school_janitor | 2116 | 鑰匙串舉在手上清楚可見 |
| 17 | 17_old_accountant_r1（去陰影） | 2218 | 半身、算盤清楚、細框眼鏡；原圖腳下有橢圓地面陰影，已用像素處理塗成背景；第一輪 2118 與 r2 2418 都變全身（r2 還帶簽名樣印記）而淘汰 |
| 19 | 19_night_gatekeeper_r1 | 2220 | 半身、燈籠與大鑰匙都入鏡（燈籠底部貼近下緣）；第一輪 2120 為全身；r1 兜帽、眼睛偏冷厲 |
