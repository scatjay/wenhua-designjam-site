寫檔方式：Bash（楊老師授權，白名單見主 session 訊息）

# 走讀美術接力 STATUS

更新：2026-11-05 03:55

## 起始狀態
- 監督員 cwd：worktree sleepy-poitras-5fdf1d，分支 claude/sleepy-poitras-5fdf1d
- 開始時 commit_gb：37.3
- 排程行程齊全：ComfyUI(1552)、run_queue.sh(1844、18248)、gen3b.py
- 佇列：jobs_r2_retry → props → stickers → scene → char → liuC → END
- 23:32:52 開始 jobs_r2_retry.json
- 顯卡 23:44：52–56°C，生圖 50 W／1755 MHz，正常

## 各批紀錄
| 批 | 張數 | 過 | 退回 | 需人眼 | 最高溫／功率 | 重排 |
|---|---|---|---|---|---|---|
| b1（QA_b1.md） | 11 | 0 | 7 | 4 | — | 進入 jobs_r2_retry |
| r2_retry（00:02 完成，QA_r2_retry.md） | 14 | 0 | 7 | 7 | 約 61°C／約 50 W（23:52 取樣；全程最高待補） | jobs_r3_retry 11 張已排入佇列（觀測員3、剪黏1+1、警察署2、門廊2、側面B 2） |
| r2_props（00:02–00:59，QA_r2_props.md） | 17 | 1（jianjian） | 14 | 2（clipboard、noodle） | 00:36 取樣 60°C／143 W 峰值 | jobs_r3_props 14 張已排入（去掉 Redux 參考照、前置單一物件平底、補必現項） |

| r2_stickers（01:18 完成，QA_r2_stickers.md） | 10 | 3（learn、pass、case_done） | 5（split、gather、like、first_room、dex） | 2（roles、wow：章偏小） | 待補 | jobs_r3_stickers 7 張已排入 |

| r2_scene（01:48 完成，QA_r2_scene.md） | 15 | 4（twl_A、twl_B_tower、chikan_A、hall_A） | 7（hayashi_A/B、matsu_A/B、lingyou_A、hall_B_aerial、patriotic_A） | 4（twh_A、twh_B_bridge、tang_A、patriotic_B） | 66°C／147 W（01:20 取樣） | jobs_r3_scene 7 張已排入（strength 降到 0.35–0.4、補空白牆面負向） |

| r2_char（02:30 完成，QA_r2_char.md） | 22 | 4（yantian s6111、jianzhu 兩張、dengji s6181） | 11 | 7 | 全程最高 73°C／215 W；高負載最低時脈 1695 MHz（02:20 統計） | jobs_r3_char 11 張已排入（不帶 Redux、改相反性別、手持物簡化；Redux 第二張 8 張失敗 6 張） |

| r3_retry（02:54 完成，QA_r3_retry.md；第 2 輪） | 11 | 0 | 5（observer 3、police_A 2） | 6（jianjian 2、porch 2、sideB 2） | 見下 | 已達 2 輪上限，不再重排 |

| r3_props（03:21 完成，QA_r3_props.md；第 2 輪） | 14 | 1（watch） | 9（inkline、roadsign、document、liftbtn、facebrick、oldkey、lantern、scanner、trowel） | 4（abacus、compass、gong、broom） | 見下 | 已達 2 輪上限，不再重排 |

| r3_stickers（03:34 完成，QA_r3_stickers.md；第 2 輪） | 7 | 2（roles、like） | 4（split、gather、first_room、dex） | 1（wow：外輪廓鋸齒星芒、與圓章不成套） | 見下 | 已達 2 輪上限，不再重排 |

| r3_scene（03:49 完成，QA_r3_scene.md；第 2 輪） | 7 | 0 | 7（全部） | 0 | 見下 | 已達 2 輪上限，不再重排 |

## 道具 32×32 縮圖驗收（S6，thumb32_r2_props.png）
- 平底的 6 張（墨斗、夾板、懷錶、紅磚、鑰匙、剪黏龍）縮到 32 像素輪廓仍認得；懷錶與鑰匙偏糊。
- 帶照片場景的約 8 張縮小後只剩色塊，退回重生。

- r3 道具 32×32（thumb32_r3_props.png）：背景已改平底，算盤、銅鑼、鑰匙、掃描儀、路牌縮小後輪廓仍可辨；羅盤、文件、墨斗、掃把、懷錶、燈籠畫得偏小，32 像素下只剩細線或色塊。

## 待問楊老師
- 「箭頭放最前面」：不確定指哪裡的箭頭，已請教。
- 需人眼 7 張見 QA_r2_retry.md。
- CREDITS 缺口：J3 剪黏參考作者與網址空白；武德殿 porch 來源作者欄是「—」。

## 需楊老師看（已重生 2 輪仍不過或無法判定）
- 觀測員 3 張（s3311～s3313）：風速計畫不出三杯、旗無法分色。建議改為旗與風速計擇一，或由楊老師決定接受風車樣式。
- 警察署 A 2 張（s2311、s2312）：橫額花飾與貝殼棕葉飾畫不出。
- r3_retry 需人眼 6 張：剪黏藝師 s4311/s4312（毛巾、性別比）、門廊 s1311/s1312（石獅狀雕像、破風板有無字）、側面 s1321/s1322（鴟尾樣式、s1322 左上角雜點與山牆徽章）。
- r3 道具退回 9 張（見 QA_r3_props.md）：墨斗 L 形曲尺與紅磚雙色磚兩輪都畫不出，建議改成程式補畫或後處理，請楊老師決定。
- r3 貼紙退回 4 張：split 足跡、gather 棋子數、first_room 與 dex 的圓角方形底形兩輪都畫不出；建議改成程式先畫底板再貼固定數量與位置的元件，請楊老師決定。
- r3 場景 7 張全退回：Redux 會保留參考照的徽章、匾額、楹聯與殿內人影，提示詞擋不住。建議生圖前先把參考照上這些區域塗成素面，或生成後遮罩補素面；hall_B 換參考視角。請楊老師決定。
- 劉永福 liu_r2_C_feature_s7103：臉部不在監督範圍，未品檢。
