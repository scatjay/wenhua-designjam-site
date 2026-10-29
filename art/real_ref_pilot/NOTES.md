# 走讀真實照片改繪試作（FLUX Redux）——2026-10-29

## 狀態：未產出任何成品圖（被全機記憶體卡住，4 張一張都沒生成成功）

### 事實紀錄
- 10:5x 第一次嘗試（武德殿，Redux 強度 0.7，768x1344，24 步，seed 3101）：ComfyUI 啟動成功、`/prompt` 送出被接受（代表 CLIPVisionLoader、CLIPVisionEncode、StyleModelLoader、StyleModelApply、LoadImage 等節點與 sigclip_vision、flux1-redux-dev 都載得起來、圖結構驗證通過），但在載入文字編碼器階段，行程被全機記憶體看門狗砍掉。
- 看門狗帳（`~/.claude/lib/mem_watchdog.jsonl`）10:52:03：`kill pid 15808 python.exe 13.14 GB，紅燈：全機認可 91% ≥ 90%（它 13.1 GB，近 60 秒 +12.1 GB）`。當時全機認可（commit）104.1 / 114.0 GB。
- 試作腳本收到的是 `WinError 10061`（伺服器已消失），不是 ComfyUI 的錯誤；Redux 節點本身沒有報錯。
- 事後量全機認可（commit）：基準 90.5–92.1 GB / 113.3 GB（比例 0.80–0.81），持續 10 分鐘（每 10 秒量，`wait_mem.py 0.70 600`）最低 0.800，沒有降下來。看門狗紅燈線是 0.90（約 102 GB），ComfyUI 單行程約 20+ GB（comfy-gen 實測約 22 GB），基準至少要降到 ≤ 約 0.68（≈ 77 GB）才放得下；現在缺口約 13 GB。
- 本機只有 `flux1-dev-Q8_0.gguf`（12.7 GB）一個 FLUX 底模，沒有更小的量化版可換（未下載、未安裝任何東西）。
- 現在 ComfyUI 已關，8288 埠已釋放（`comfy_core status`：server_up=false、無行程）。

### 全機認可大戶（我量到、不是我的行程，沒有動）
claude.exe 合計約 25 GB、chrome.exe 約 16 GB（多顆 CDP 瀏覽器）、node.exe 約 10 GB、python.exe 約 9.6 GB（量法：各行程 private bytes 加總）。

### 要重跑需要的條件
全機認可降到 0.68 以下（例如關掉閒置的 CDP Chrome 或閒置的 Claude 視窗合計約 13 GB 以上），然後逐張執行：
`python -X utf8 run_pilot.py butokuden 0.7`（接著 hayashi_lift、abacus_nmth、liu_yongfu_1896），再 `python -X utf8 postproc.py <名稱> _raw/<原圖> scene|prop|portrait`。
`run_pilot.py` 內建自保：全機認可比例到 0.875 就自己關 ComfyUI（不讓全機走到 0.90 紅燈、擋住別線 Agent），可用環境變數 `PILOT_ABORT_RATIO` 調整。

## 已備妥的東西（不算成品）
- 參考圖前處理（`E:/Downloads/_walk_refs/_prep/`，不進 git；原圖皆在 APPROVED.json 清單內，只做裁切與遮蔽，沒有新下載）：
  - butokuden_sq.png：以建築為中心裁 705x705 正方形（Redux 的 SigLIP 為 384 中央裁切，所以先裁成方形；右側翼樓與左側門廊邊緣被裁掉一部分）
  - hayashi_lift_sq.png：裁 1280x1280；電梯旁告示牌的中文字用門的顏色塗掉（遊戲畫面不出現可辨識文字）
  - abacus_sq.png：只取算盤左端 170x170 放大到 680（原圖有館藏編號標籤與比例尺，已裁掉；代價是只剩算盤的左端約 8 排珠）
  - liu_bust_sq.png：只取照片內人像上半身 400x400（排除上方題詞與下方英文說明文字）
  上述四張也複製了一份到 `E:/ComfyUI_windows_portable_0529/ComfyUI/input/`（試作用，共約數百 KB，可刪）。
- `redux_workflow_api.json`：Redux 工作流程（API 格式，武德殿那一次送出的版本）。節點鏈：UnetLoaderGGUF（flux1-dev-Q8_0）→ DualCLIPLoader（clip_l + t5xxl_fp8）→ CLIPTextEncode → FluxGuidance（3.5）→ StyleModelApply（`strength_type=multiply`，強度 0.7）；參考圖走 LoadImage → CLIPVisionEncode（sigclip_vision_patch14_384，crop=center）→ StyleModelApply；KSampler（euler / simple、24 步、cfg 1.0、negative 與 positive 同源，與 comfy_core 一致）→ SaveLatent；第二段用全新伺服器行程只載 VAE 解碼（沿用 comfy_core 的兩段式，避免單行程超過 24 GB）。
- `run_pilot.py`（生圖，帶秒數、記憶體尖峰、seed、提示詞記帳到 `pilot_log.jsonl`）、`postproc.py`（後處理包裝，場景 180x320：BOX 縮小後貼到 320x320 米色畫布，呼叫 `test_tools/walk_pixelize.py` 的 `process()` 原封不動，再裁回 180 欄、放大 3 倍；已知副作用：該工具會把「與米色距離 < 60」的像素一律改成米色，淺色牆面可能被吃掉，要量 `bg_snapped_pct`）、`wait_mem.py`。
- 四張的提示詞、seed 預設在 `run_pilot.py` 的 JOBS（butokuden 3101、hayashi_lift 3102、abacus_nmth 3103、liu_yongfu_1896 3104；人物提示含 `Taiwanese`、`black hair`，不含 knight／noble／military uniform）。`pilot_log.jsonl` 只有一行失敗紀錄（武德殿）。

## 尚未做（因為沒有成品）
各張秒數、色偏程度、瑕疵、聯絡表 contact.png、共用調色盤對場景與道具的色偏紀錄——都還沒有資料，不推測。

## 2026-10-29 11:45 四張試作結果（FLUX.1-dev Q8 + Redux 0.7，租約下單行程峰值 14.5–20.3 GB）
- 成功 3 張：武德殿（576×1024，274 秒）、算盤（768×768，281 秒）、劉永福（768×768，257 秒）。
- 失敗 1 張：林百貨電梯（自己中止：全機認可量到 0.9）；之前三次失敗是看門狗砍行程。需另跑。
- 自評（要楊老師眼睛確認）：武德殿屋形與綠銅簷、白欄杆認得出，但偏寫實插畫、像素感不足；算盤是金屬框而非木框，形制不對（參考圖是木算盤），像素感好；劉永福臉型與帽服對得上，但是版畫／網點質感，不是 16 位元像素，背景未吸成米色。
- 結論：Redux 保住「結構與辨識特徵」，但不給「像素風」；像素感要靠後處理（更小的格數、更少色）或加像素 LoRA。
- 檔案：contact_sheet.png（每組：原照、FLUX 原圖、後處理）。
