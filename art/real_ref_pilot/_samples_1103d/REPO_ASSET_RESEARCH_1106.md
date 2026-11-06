# 現成 repo 與開放授權素材研究：臺南走讀像素美術製程

撰寫日期：2026-11-06　對象：走讀遊戲（2026-11-14 上線）像素美術製程 v2
前置文件（本文不重複）：`.claude/skills/walk-pixel-pipeline-v2/SKILL.md`、`PIXEL_STYLE_TECHNIQUES.md`

## 0. 閱讀須知

**讀取程度標記**：【本機讀】＝我在本機實際讀了 README／目錄／授權檔；【全文】＝網頁抓取後針對全頁提問（抓取工具會先濃縮，不等於逐字通讀）；【摘要】＝只看到搜尋結果摘要；【未讀】＝只知道名字。
**【推論】** ＝我從事實推出，沒有單一出處，需要 smoke 驗證。**【未測】** ＝所有效益數字都是估計，沒有在本機跑過。
**授權日期**：多數 HuggingFace／GitHub 頁面抓取結果不顯示最後更新日，我不補編；有日期的才寫。
**本次沒有下載、安裝、pip install、改程式、commit 任何東西。** 本機沒有的東西一律「先回報」。

### 一個要先看的授權風險（影響整條製程）
v2 的生圖核心是 FLUX.1-dev（Q8 GGUF）加 XLabs 深度 ControlNet、Redux、Fill，全都在 FLUX.1 [dev] Non-Commercial License 之下。我開了授權全文【全文】：
- 第 2(d) 條寫 You may use Output for any purpose (including for commercial purposes)，輸出可用於任何目的。
- 但第 4(a) 條又限制 commercial or production use of data produced by the model，兩條互相矛盾，抓取工具自己也說「ambiguous」。
- 第 2(b) 條：模型本身（含微調衍生）只能非商業使用；授權文沒有提到教育。
- 第 2(e) 條：要有內容過濾或審查，並在法律要求時揭露為 AI 生成。

這不是我能下結論的法律問題。遊戲是教學用、會公開錄影，是否構成「商業或正式上線」要楊老師（必要時加計畫辦公室）判斷。建議至少：①在 `art/CREDITS.md` 補一行「圖像由 FLUX.1 [dev] 衍生流程生成」②決定要不要把替代路線（FLUX.1 schnell，Apache-2.0，1 到 4 步【全文】）列為備案；但 XLabs 深度 ControlNet v3 與 Redux 是為 dev 訓練，能否沿用【未測】。

---

## 1. 本機已有可用的

### 1.1 已安裝節點（`custom_nodes` 實際讀過 README／目錄／授權檔）

| 節點 | 授權 | 能替製程做什麼 | 目前缺什麼 |
|---|---|---|---|
| **ComfyUI-PixelArt-Detector**（dimtoneff，v1.7.3）【本機讀】 | MIT | 像素偵測、縮圖、調色盤載入與預覽（`palettes/` 內有 1x／32x／others 多組）、**PixelArtAddDitherPattern**、轉換節點有 `dither` 選項：floyd-steinberg、**bayer-2／4／8／16**；`PixelArtPaletteGenerator` 從圖片產調色盤；k-means 量化（opencv、pyclustering） | 需實際在 ComfyUI 載入確認節點都可用【未測】 |
| **pixel_palette_art**（ranska）【本機讀】 | MIT | 純調色盤工具：建色、RGB／HSV 混色、**漸層調色盤**、排序、局部置換、合併、**GIMP .gpl／.pal／.aco 載入**、匯出 hex／gpl／css、Pixel Palette Extractor（取圖中不重複顏色） | 沒有「對圖套色盤」節點，要配 PixelArt-Detector 或 PixelPipeline 的 Apply |
| **ComfyUI-SpriteSheetPack**（UnlimitedEditing）【本機讀】 | MIT | 六個節點：Prepare Reference（還原像素格、整數倍重畫參考圖）、**Build Sheet**（最多 15 個視圖，格線偏移偵測＋逐格投票、鎖共用調色盤、alpha 二值化、去背、拼表）、**Save Turntable GIF**、**Standardize Sheet**（讀任何精靈表，統一成等大格、每列一個狀態、**所有格錨定同一腳點或中心點**，可還原放大、鎖調色盤、輸出版面 JSON：cell、pivot、fps、各狀態幀數）。純 numpy／scipy／Pillow，無模型 | README 是為 Qwen Image 2.1 設計的流程；我們用 FLUX 時只用後半段節點即可【推論】 |
| **ComfyUI-PixelPipeline**（PearLi，v0.1.0）【本機讀】 | **GPL-3.0** | 七個節點：PixelGridRestore、PixelPaletteExtract／Apply、PixelExportScale、PixelBackgroundRemove、PixelSpriteSheet、PixelVideoGridRestore。刻意「做不到就大聲失敗」，k-means 固定種子、輸出位元組相同 | 你的清單沒列它，但目錄裡有。本機當工具用沒問題，**不要把它的程式碼複製進遊戲 repo 發布**；能否載入【未測】 |
| **comfyui_layerstyle**（chflame163，v1.0.90）【本機讀，只讀 README 關鍵字與目錄】 | MIT | 去背節點（RMBG、**BiRefNet／BiRefNetUltra／V2**）、SegmentAnything／**SAM2 Ultra**、EVF-SAM、**color_map**、**LUT 套用**、PixelSpread（遮罩邊緣像素擴張）等上百個影像節點 | **本機沒有 BiRefNet／RMBG 權重資料夾**（`models/` 頂層沒有），要用需下載（見 2.2） |
| **ComfyUI-segment-anything-2**【本機讀】 | Apache-2.0 | 有 `Sam2Segmentation`、`Sam2AutoSegmentation`、**`Florence2toCoordinates`**、`OwlV2Detector`。本機已有權重：`sam2.1_hiera_large-fp16`（449 MB）、`sam2_hiera_small`（184 MB）、`sam_vit_b`（375 MB）。**Florence-2 本機也有**（`LLM/Florence-2-base`、`Florence-2-Flux-Large`） | 無缺。「Florence 片語定位 → SAM2 遮罩」整條在本機能走【推論，未測】 |
| **comfyui-impact-pack**（v8.15.1）【本機讀，只讀目錄與授權】 | GPL-3.0 | SEGS、Detailer 類（局部重繪迴圈）、SAM 載入 | 臉部偵測模型（ultralytics）本機沒看到；我沒有逐一讀 nodes，不判斷細節 |
| **x-flux-comfyui**（XLabs）【本機讀】 | 程式 Apache-2.0；權重 FLUX.1 [dev] NC | ControlNet（已在用）、IP-Adapter 節點 | `models/xlabs/ipadapters/` 是空的，**IP-Adapter 權重不在本機**。`models/xlabs/` 下另有 **flux-hed／canny／depth** 三個 ControlNet 檔 |
| **comfyui_controlnet_aux**【本機讀】 | Apache-2.0 | 前處理節點：zoe、depth_anything(_v2)、lineart、anyline、teed、hed、normalbae、dsine、canny、tile… | `ckpts/` 目前只有 lllyasviel 一個資料夾；除了已用的 Zoe，其他前處理器權重有沒有，首次使用才知道（可能連網下載）【未測】 |

### 1.2 本機模型
- **unet／GGUF**：`flux1-dev-Q8_0.gguf`（12.7 GB）、`flux1-fill-dev-Q3_K_S.gguf`（5.2 GB）。
- **diffusion_models/FLUX1**：`flux1-dev-fp8`（11.9 GB）、`fluxFillFP8_v10`（11.9 GB）。
- **controlnet**：`flux-depth-controlnet-v3`、`flux-canny-controlnet-v3`（各 1.49 GB，硬連結）、`controlnet-scribble-sdxl-1.0`（2.5 GB）。`xlabs/controlnets` 另有 `flux-hed-controlnet-v3`。
- **style_models**：`flux1-redux-dev`（129 MB）；**clip_vision**：`sigclip_vision_patch14_384`。
- **checkpoints（SDXL 系）**：`animagineXL40_v40`（6.9 GB）、`Juggernaut-XI-byRunDiffusion-Lightning`（6.9 GB）與其 fp8 unet 版（4.4 GB）、`v1-5-pruned-emaonly-fp16`。
- **loras**：像素類只有 `pixel/pixel-art-xl.safetensors`（170 MB，SDXL 用，即 nerijs 那支）。其他 FLUX 風格 LoRA：`chibi_characters_flux_v1`（344 MB）、`flatcolor_anime_minimalism_v1`（86 MB）、`vector_flat_outline_v1`（613 MB）、`Animeo`（613 MB）、xlabs 的 `art_lora`／`scenery_lora`、`scatjay-01-000003`。**這些 LoRA 的來源與授權我沒有查**【未讀】。
- **沒有**：upscale_models（空）、onnx（空）、insightface、PuLID、Kontext、BiRefNet／RMBG 權重、任何 FLUX 像素 LoRA。

### 1.3 本機現成、可直接驗證的三個小機會（不需下載）
1. **Bayer 抖色與坡道色盤，補足 `PIXEL_STYLE_TECHNIQUES.md` §4.4、§4.6**：PixelArt-Detector 已內建 Bayer-2／4／8／16 與自訂圖樣；pixel_palette_art 可用「漸層調色盤＋局部置換」手工建 tainanpunk 的橘青坡道（暗部偏青、亮部偏橘），輸出 .gpl 再載入。先前文件列為「要自己寫 PIL」的兩項，可能改成現成節點【推論，未測】。
2. **去背走 Florence-2 → SAM2**，不用下載新權重，可處理 NPC、道具、貼紙的透明背景。
3. **SpriteSheetPack 的 Standardize Sheet**：把小精靈四型態（蛋／嬰／成／覺醒）與房間家具的幀統一成等大格＋同一腳點＋版面 JSON，遊戲端可直接讀。

---

## 2. 建議整合

每項：做什麼／怎麼接進 v2／預估效益／風險／授權／下載與大小。效益全部是【推論，未測】，用 1 張圖做 smoke 再放大。

### 2.1 像素化後處理 A/B：unfake.js 的進階方法與 proper-pixel-art
- **做什麼**：unfake.py 現在用 `dominant`。兩個現成替代：
  - **unfake.js**（jenissimo，MIT）【全文】：除了 dominant，還有 median、mode、mean、**qvote**、**content-adaptive** 降採樣；**邊緣感知的像素尺度偵測（含小數格線）**；**grid snapping、morphological cleanup、jaggy cleanup、alpha 二值化**；固定色盤。核心是 Rust crate（WASM／原生 CLI）。unfake.py 是另一人的 Python 移植，宣稱 Rust 加速量化比 JS 快 10 到 20%【全文】。**unfake.py 是否已含 content-adaptive 與 jaggy cleanup，我沒讀它的 README，需對照**【未讀】。
  - **proper-pixel-art**（KennethJAllen，MIT）【全文】：把生成式模型的雜訊像素圖還原到真實像素解析度，**也支援影片與 GIF，並讓格線與色盤跨幀一致**；`pip install proper-pixel-art`，CLI `ppa 輸入 -o 輸出 -c 色數 -s 倍率`，`-c` 最需調整。頁面沒顯示最後更新日。
- **怎麼接進 v2**：`pixelize_v2.py` 旁加一個旗標，同一張原圖三種輸出並排（dominant／content-adaptive／ppa），用 `PIXEL_STYLE_TECHNIQUES.md` §2.3 的問題當評分：細線有沒有斷、孤立像素數、屋脊階梯是否乾淨。
- **效益**：改善「細線被背景吃掉、斜線階梯不整齊」，對燕尾脊、匾額邊、人物眉眼最有感。
- **風險**：這兩個工具原本設計給「偵測原圖未知格距」；我們格距已知，可能優勢有限；影片模式對小精靈動畫有潛力。
- **下載**：兩者皆 pip／npm／Rust，體積小（MB 級，未量）。**先回報，等楊老師同意**。

### 2.2 去背（NPC、道具、貼紙、小精靈需要透明底）
- **先用本機**：Florence-2 片語定位（已有）→ SAM2（已有權重），見 1.3 第 2 項。
- **要更準再加 BiRefNet**：官方 repo MIT【全文】，`BiRefNet_lite` 權重頁標 MIT【全文】，**44.4M 參數（以 fp32 推算約 0.18 GB，頁面未給檔案大小）**，輸入 1024×1024；官方表列推論約 3.5 GB（FP16）到 4.8 GB（FP32）VRAM。ComfyUI 整合可用 `lldacing/ComfyUI_BiRefNet_ll`【全文，授權頁未顯示】，或 comfyui_layerstyle 已安裝的 BiRefNetUltra 節點（只缺權重）。
- **效益**：BiRefNet 對髮絲與細邊通常比 SAM 少一輪人工修遮罩【推論】；但像素化後 alpha 會二值化，邊緣精度需求其實不高。**建議先量 SAM2 夠不夠用，再決定要不要下載**。
- **風險**：不要用 **BRIA RMBG-2.0**（CC BY-NC 4.0，商用需另購【全文】）。rembg 預設模型也是 bria-rmbg，同樣需付費協議【全文】；rembg 本身 MIT，但模型權重各有自己的授權【全文】。
- **下載**：BiRefNet_lite 權重，約 0.2 GB（推算），**先回報**。

### 2.3 道具、貼紙、徽章：SDXL 像素 LoRA 路線（本機已有）
- **做什麼**：本機有 `pixel-art-xl`（nerijs，CreativeML OpenRAIL-M【全文】）加 Juggernaut XI Lightning／Animagine XL。頁面建議：不需觸發詞；輸出用最近鄰縮小 8 倍；用修正版 VAE；搭 LCM 時 8 步、guidance 1.5、LoRA 強度 1.2【全文】。
- **怎麼接進 v2**：道具 32×32、貼紙、徽章這類**沒有照片參考**的資產，目前靠 FLUX（SKILL 實測每張約 85 到 100 秒）；SDXL Lightning 步數少、8 GB 較寬裕，**預期明顯更快**【推論，未量；先跑 5 張 smoke 記秒數】。
- **注意**：SKILL §四第 5 點已證實 L 形曲尺、雙色紅磚、足跡、棋子這類固定元件用 PIL 直接畫比生成穩——**固定幾何仍程式畫，SDXL 只用在需要「造型」的道具**（香爐、籤筒、扇、燈籠）。
- **風險**：Juggernaut XI／Animagine XL 授權我沒查【未讀】。
- **下載**：零。

### 2.4 FLUX 像素 LoRA（風格版與無照片資產）
| LoRA | 授權 | 觸發詞 | 基底 | 備註 |
|---|---|---|---|---|
| **UmeAiRT／FLUX.1-dev-LoRA-Modern_Pixel_art**【全文】 | MIT（頁面標示；基底仍是 FLUX dev NC） | `umempart` | FLUX.1-dev | 搜尋摘要提到訓練 100 張、1024、rank 32【摘要】；頁面沒寫建議強度與檔案大小；其訓練資料集更新 2024-09-26 |
| **prithivMLmods／Retro-Pixel-Flux-LoRA**【全文】 | CreativeML OpenRAIL-M | `Retro Pixel` | FLUX.1-dev | 作者自述仍在訓練階段，可能有瑕疵；只用 16 張圖；建議 1024×1024；大小未列 |
| **Muapi／pixel-art-styles**【全文】 | openrail++ | `ArsMJStyle, Pixel Art` | FLUX.1-dev | 原作者頁面沒寫（指向 Civitai 629354 的某版本），來源不明 |
| **deAPI-ai／pixelartdotfluxlora**（原作者 ych8836121）【全文】 | FLUX.1 [dev] NC | 無列 | 未明寫 | 搬運版，授權最不乾淨 |
| **Pixelo-Flux** | — | — | — | **搜尋兩輪找不到這個名字**【未讀】，不採信也不補編 |
| FLUX.2-klein 系 LPC 精靈表 LoRA（Mystic07，trigger `gmsspritesheet`；limbicnation）【全文／摘要】 | 繼承 FLUX.2-klein | — | **FLUX.2-klein，不是 FLUX.1** | 基底不同，我們的 GGUF／ControlNet 堆疊不能用 |
- **怎麼接進 v2**：風格版（cyberpunk、道龐克、府城龐克）目前只靠提示詞。可在**風格版**單張 smoke 試 LoRA 強度 0.3 到 0.5，看會不會破壞深度 ControlNet 保住的結構【未測】；**忠實版不加**（會改材質質感）。
- **效益／風險**：效益偏小（像素感由縮圖步驟決定，見 §2.3 文件）；LoRA 太強會變成「通用像素 RPG 風」而不是臺南建築。優先序低。
- **下載**：大小頁面未列，**先回報，等楊老師同意**。

### 2.5 第二條 ControlNet：Canny 或 HED（本機已有，零下載）
- 目前只用深度（cn 0.65）。燕尾脊、斗拱、窗格這類**細線結構**，深度圖不一定保得住。本機已有 canny 與 hed 的 FLUX ControlNet。
- **怎麼接**：深度之後再串一個 ControlNet Apply，canny 強度 0.2 到 0.35 起手【未測】。
- **風險**：canny 會把**原照片上的字**一起當線稿帶進來（SKILL §四第 1 點同類問題），所以輸入必須是**去字之後**的照片；8 GB 疊兩條 ControlNet 的耗時與記憶體要先量。
- **授權**：XLabs 權重屬 FLUX dev NC，與現行相同。

### 2.6 小精靈與房間家具的動畫格（用 PIL 與 SpriteSheetPack 補）
- 已有結論（`PIXEL_STYLE_TECHNIQUES.md` §4.7）：次像素動畫是動畫工作，不是生圖工作。
- **建議作法【推論，未測】**：每個型態只生**一張**靜態圖（四型態＝四張），用 PIL 程式做 2 到 4 格 idle（上下 1 像素呼吸、擠壓拉伸、眨眼用遮罩換色），再用 SpriteSheetPack 的 Standardize Sheet 統一腳點、鎖共用色盤、輸出 JSON。一致性由程式保證，不押模型每幀都畫成同一隻。
- **為什麼不用 AI 生動畫**：我找到的資料（FLUX＋IP-Adapter＋ControlNet 走路循環教學，部落格【摘要，未驗證】；LPC 精靈表 LoRA，都是 FLUX.2-klein【全文】）都沒有證明 8 GB 的 FLUX.1-dev GGUF 能穩定產出同一角色的多幀。Wan 影片模型本機沒有，也沒查到 Wan 像素 LoRA 與授權【摘要】。
- **下載**：零。

### 2.7 歷史人物臉部相似（劉永福等）
| 方案 | 授權事實 | 8 GB 可行性 | 結論 |
|---|---|---|---|
| **PuLID-Flux ComfyUI**（balazik）【全文】 | 節點 Apache-2.0；需要 InsightFace **antelopev2**；InsightFace 官方 repo 說程式 MIT，但**預訓練模型僅限非商業研究**【全文】 | README 估 8-bit GGUF 約 **12 GB**、FP8 約 12 GB；作者自述 v0.1.0 alpha。**8 GB 要大量卸載，速度與穩定度【未測】** | 不建議 |
| PuLID 官方（ToTheBeginning）【全文】 | 程式 Apache-2.0；權重授權該頁沒寫 | 官方說最佳化到 16 GB 可跑；v0.9.0 對部分男性輸入 ID 保真度不足，v0.9.1 約改善 5 個百分點 | 不建議 |
| **XLabs flux-ip-adapter-v2**【全文】 | 頁面標 Apache-2.0，但**模型卡寫權重屬 FLUX.1 [dev] NC**；beta，需多次嘗試 | 本機 `xlabs/ipadapters` 空的，未測 | 低優先 |
| FLUX.1 Kontext dev GGUF | 授權在我搜尋結果中沒出現；搜尋結果只談 VRAM：FP8 約 12 GB、NF4 約 7 GB【摘要，部落格】 | 理論上可，**我沒查到臉部或表情一致性的實測** | 先不碰 |
- **歷史人物的真正問題**：劉永福是 19 世紀照片，單張、非正臉、低解析。人臉辨識模型對這種輸入本來就不穩【推論】，且授權限制讓它不適合放進公開教學流程。
- **建議**：沿用既有的「**臉部遮罩局部重繪／臉部像素化合成**」流程（memory 的 `feedback_walk_art_liu_yongfu_face`：S13 流程，審核器打相似度）。它不依賴人臉模型。投入重點放在「臉部遮罩更準」：用 SAM2＋Florence 片語「face」取遮罩（本機已有）。

### 2.8 調色盤資源（Lospec）
- Lospec 色盤庫**頁面沒有全站授權聲明**【全文】；Endesga 64 頁面上的使用者留言說站上色盤可免費用、署名隨意，**那是留言，不是官方條款**【摘要】。Resurrect 64 作者為 Kerrie Lake，AAP-64 作者為 Adigun A. Polack（Lospec 頁面標示）【摘要】。
- **建議**：只當「色相關係的參考」，**不直接套用某一組**；最終色盤仍由過關成品反推（SKILL §一第 5 步）。若沿用某一組，在 CREDITS 標作者與 Lospec 網址，並由楊老師決定要不要向作者確認。

---

## 3. 開放素材清單

原則：我們的美術是「真實照片衍生」，通用素材包風格差異大，**只當 UI 圖示、家具填空、參考**，不當主視覺。授權以頁面當下標示為準，使用前再點開確認一次。

| 來源與網址 | 授權 | 內容 | 讀取 | 適合補哪類 | 備註 |
|---|---|---|---|---|---|
| Kenney 全站授權說明 https://kenney.nl/support | 資產頁標 **CC0**，可商用，不需署名；不可使用 Kenney 標誌【全文】 | 官網未提 AI 訓練限制 | 全文 | — | 授權依據 |
| Kenney Tiny Town https://kenney.nl/assets/tiny-town | CC0 | 130 個檔、16×16 磚、俯視街道 | 摘要 | 家具、街景填空 | 風格是歐式小鎮 |
| Kenney Tiny City https://kenney.nl/assets/tiny-city | CC0 | 130 個檔、16×16 | 摘要 | 現代街景 | — |
| Kenney Tiny Dungeon https://kenney.nl/assets/tiny-dungeon | CC0 | 130 個檔、16×16，2022 年發布 | 摘要 | 道具、剪影參考 | — |
| Kenney 1-Bit Pack https://kenney.nl/assets/1-bit-pack | CC0 | 1,078 個檔、16×16，2021 發布 | 摘要 | 圖示、徽章、貼紙形狀參考 | 單色，要重新上色 |
| Kenney RPG Urban Pack https://kenney.nl/assets/rpg-urban-pack | CC0 | 480 個檔 | 摘要 | 房間家具、街景 | 磚尺寸未確認 |
| Kenney Pixel Pack https://kenney.nl/assets/pixel-pack | CC0 | 98 個檔 | 摘要 | 小圖示 | — |
| OpenGameArt 496 pixel art icons https://opengameart.org/node/39455 | 頁面標 CC0；**作者 7Soul1 後來說正確授權是 DeviantArt 上的 Public Domain**，編輯者還移除了衍生自版權遊戲的圖示【摘要】 | 1.5 MB zip，約 34×34 | 摘要 | **道具 32×32、貼紙**（中世紀奇幻題材，需挑選） | 授權標示衝突，需保存作者聲明 |
| OpenGameArt Minimalist Chinese Temple tileset https://opengameart.org/content/minimalist-chinese-temple-tileset | **授權未確認**（抓取回 403）；摘要只看到「credits 請附 opengameart.org 連結」【摘要】 | 中式廟宇磚 | 摘要 | 廟宇構圖參考 | 使用前自己開頁面看授權欄 |
| OpenGameArt Sunset Temple Tiles https://opengameart.org/content/sunset-temple-tiles | 頁面標 CC-BY 3.0 **和** CC0（有人留言說雙標籤令人困惑）【摘要】 | 神殿磚（是否東亞未確認） | 摘要 | 參考 | 要 CC0 就向作者確認 |
| itch Pixels（Not Jam）https://not-jam.itch.io/pixels | **CC0**（作者棄權聲明）【摘要】 | 通用像素集合 | 摘要 | 備用小圖示 | — |
| itch Toad's Creative Commons Art Pack https://toadheart.itch.io/toads-creative-commons-art-pack | **CC0**【摘要】 | 混合包 | 摘要 | 備用 | 須逐檔確認來源 |
| itch Top Down Buildings 64x64（Varible_37）https://varible-37.itch.io/top-down-buildings | 「任何用途但不可直接轉售」，非 CC0【摘要】 | 工廠、廟宇、魔法塔，奇幻風 | 摘要 | 參考 | — |
| itch Asia House Exteriors（genaticstudio）https://genaticstudio.itch.io/asia-exteriors | **授權未顯示**【摘要】 | 亞洲風建築 | 摘要 | 參考 | 未確認，不採用 |
| Universal LPC Spritesheet Character Generator https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator | 程式 **GPL-3.0**；美術逐檔 CC0／CC-BY／**CC-BY-SA**／OGA-BY／GPL 混合；**必須署名所有作者（CC0 除外）**且署名要在遊戲內容易找到；CC-BY-SA 衍生物須以 CC-BY-SA 4.0 以上散布；作者提醒 DRM 平台（Steam、App Store）可能不相容，建議只用 CC0／OGA-BY【全文】 | 可換裝的 RPG 精靈表 | 全文 | 角色走路精靈（理論上） | 西式奇幻風，與臺南人物不合，且 SA 條款會拖到整套素材；**不採用** |
| Yamanaka Takumi Taiwan Temples Photo Pack https://yamanakatakumi.itch.io/taipei-temples-photo-pack-no120-high-res-images | 付費（No.1 US$9.99；No.2 最低 US$80），**授權細節未讀**；是照片不是像素【摘要】 | 臺灣廟宇高解析照片 | 摘要 | 參考照來源 | 不是開放授權；你們已有 `_walk_refs/APPROVED.json` 核准流程，**不要繞過** |

**缺口（我找不到）**：英文搜尋兩輪，**沒有**找到臺灣街景、日治建築、夜市、廟會燈籠的開放授權像素素材【摘要】。這個題材在開放素材裡幾乎是空的，所以走讀的臺灣特徵必須繼續靠「照片衍生」製程；通用素材包幫不上主視覺。

---

## 4. 工具（D）與商用（E）

### 4.1 編輯與動畫工具
| 工具 | 授權 | 用途 | 讀取 |
|---|---|---|---|
| **Pixelorama** https://github.com/Orama-Interactive/Pixelorama | **MIT** | 圖層／影格時間軸、onion skin、**tilemap（矩形、等角、六邊形）**、調色盤匯入、**CLI 批次匯出（PNG、動態 PNG、精靈表、GIF、影片）**；頁面沒給最新版本日期 | 全文 |
| **LibreSprite** https://github.com/LibreSprite/LibreSprite | **GPL-2.0**（Aseprite 於 2016-08-26 轉專有授權前的分支） | 影格＋圖層、onion skin、內建調色盤；Windows／macOS／Linux／Android；頁面沒有版本日期 | 全文 |
| Aseprite | 付費；授權細節我沒查 | — | 未讀 |
- **建議**：楊老師若想**手修**單張成品（補一格眼睛、修一條斜線），Pixelorama 或 LibreSprite 都夠。不是製程必要項，優先序低。

### 4.2 像素清理與量化（已在 §2.1）
- unfake.js、proper-pixel-art、PixelArt-Detector、PixelPipeline。補充：`ComfyUI-PixelArt-Unfaker`（CalaKuad1，MIT）是 SpriteSheetPack README 自己列的上游來源（格線偏移搜尋與去背做法借自它）【本機讀，上游 repo 未開】。

### 4.3 商用／封閉方案（只列名字）
| 名稱 | 為何不用 |
|---|---|
| **Retro Diffusion** | itch 頁面標 US$65 以上買斷；聚合站另列 API 計次價約 US$0.03 到 0.18／張（**未對官網驗證**）【摘要】；商用條款沒查到；我們已有本機流程 |
| **PixelLab** | 第三方列表入門約 US$12／月【摘要，未驗證】；雲端付費，主視覺偏奇幻角色 |
| BRIA RMBG | CC BY-NC，商用需合約（見 §2.2） |

---

## 5. 不採用清單與理由

| 項目 | 理由 |
|---|---|
| BRIA RMBG-2.0、rembg 預設模型 | CC BY-NC 4.0，商用需付費協議【全文】 |
| InsightFace antelopev2 與 PuLID-Flux | 預訓練模型僅限非商業研究【全文】；8 GB 跑 PuLID＋FLUX 不可行或極不穩（README 估 12 GB）；歷史老照片對人臉模型也不友善 |
| XLabs IP-Adapter v2 | 權重 FLUX dev NC、beta、本機無權重【全文】；Redux 已覆蓋色彩參考用途 |
| FLUX.2-klein 系 LPC 精靈表 LoRA | 基底不同，本機堆疊不能用【全文】 |
| Pixelo-Flux | 找不到這個名字，不採信 |
| Pixel Art Dot（ych8836121／deAPI-ai 搬運） | FLUX dev NC，來源是搬運版 |
| Universal LPC 生成器 | CC-BY-SA／GPL 混合；署名義務多；DRM 平台警告；西式奇幻風；SA 條款會傳染到整套素材 |
| 等角（isometric）素材與工具 | 與 `PIXEL_STYLE_TECHNIQUES.md` §3.3 結論相同：現有製程做不到 |
| Wan／AnimateDiff 類影片模型出動畫 | 本機沒有、8 GB 可行性無資料、授權沒查到 |
| FLUX Kontext | 授權與臉部一致性都沒查到證據，本機也沒有權重 |
| 付費商用像素 AI | 見 4.3 |

---

## 6. 待楊老師決定

1. **FLUX.1 [dev] 非商業授權與公開教學／錄影的關係**（第 0 節）。要不要列 FLUX.1 schnell 為備案？代價是要重新驗證深度 ControlNet、Redux、Fill 是否相容【未測】。
2. **允許我下載的清單**（每項先回報、等同意）：
   - unfake.js（或新版）與 proper-pixel-art：pip／npm，MB 級（未量）。
   - BiRefNet_lite 權重：約 0.2 GB（44.4M 參數推算；官方頁沒給檔案大小），只在 SAM2 去背不夠好時才下載。
   - UmeAiRT Modern Pixel art LoRA（MIT，大小頁面未列）：僅風格版 smoke 用。
   - Kenney Tiny Town／Tiny City／1-Bit／RPG Urban（CC0，MB 級，未量）：僅當參考與 UI 圖示。
3. **本機既有的 LoRA 與 SDXL checkpoint**（chibi、flat-color、vector-flat-outline、Animeo、Juggernaut XI、Animagine XL）**授權我沒有查**。若要拿它們出貨在公開教學素材，請告知來源，或讓我查一輪。
4. **是否做一輪零下載小實驗**：在 1 張建築圖上跑「後處理 A/B」＋「canny 第二條 ControlNet」＋「Bayer 抖色」。需要啟動 ComfyUI 與 GPU 記憶體租約（照 SKILL 的租約與溫度規則），所以先問。
5. **Lospec 色盤要不要直接套**：授權模糊（站方無聲明，只有使用者留言），保守作法是只參考。

## 7. 我採用的假設
1. 走讀遊戲為教學用、會公開錄影，但不收費；第 0 節的授權判斷留給楊老師。
2. 「8 GB」指 RTX 3070 顯存，系統記憶體提交量沿用 SKILL 的描述。
3. 只在本機讀了 README、目錄、授權檔，沒有載入 ComfyUI 驗證任何節點；所有「能做什麼」都依 README 與節點名稱推出。
4. impact-pack 與 layerstyle 只讀到授權、目錄和 README 關鍵字，沒有逐節點讀。

---

## 8. 整合優先序

| 優先 | 項目 | 一句理由 |
|---|---|---|
| **高** | FLUX.1-dev 授權確認與 CREDITS 補一行（§0） | 影響整條製程的出貨合規，且零成本 |
| **高** | 像素化後處理 A/B：content-adaptive、jaggy cleanup、proper-pixel-art 對 dominant | 直接對治「細線斷、斜線不整齊」，pip 級體積，單張 smoke 就能判斷 |
| **高** | 本機 Bayer 抖色＋坡道色盤（PixelArt-Detector＋pixel_palette_art） | 零下載，補上風格版的色帶與重點色問題 |
| **高** | 本機 Florence-2→SAM2 去背，供 NPC／道具／貼紙 | 零下載，立刻解掉透明底需求 |
| **高** | SpriteSheetPack Standardize＋PIL idle 動畫（小精靈四型態、家具） | 零下載，一致性由程式保證，不押模型 |
| 中 | SDXL（Juggernaut／Animagine＋pixel-art-xl）出道具、貼紙、徽章 | 本機已有，可能比 FLUX 快很多，但授權與速度要先 smoke 量 |
| 中 | canny／HED 第二條 ControlNet | 本機已有；對細線結構有幫助，但輸入必須是去字後照片 |
| 中 | BiRefNet_lite 去背 | 只有 SAM2 不夠好時才下載（MIT，約 0.2 GB 推算） |
| 低 | FLUX 像素 LoRA（UmeAiRT、Retro-Pixel）用在風格版 | 像素感由縮圖決定，LoRA 風險是帶來通用 RPG 風，效益小 |
| 低 | Kenney CC0 包當 UI 圖示與參考 | 風格與題材不合；臺灣題材開放素材是空白 |
| 低 | Pixelorama／LibreSprite 手修 | 需要時才用，不屬製程 |
| 不做 | PuLID、IP-Adapter、Kontext、Wan、LPC 生成器、RMBG-2.0、付費像素 AI | 授權或 8 GB 可行性不成立（見第 5 節） |
