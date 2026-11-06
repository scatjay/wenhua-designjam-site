# 走讀遊戲美術接線說明（給楊老師自己改 walk.js 用，2026-11-06）

材料（都已在 repo，不用再找）：
- `art/ASSET_MANIFEST.json`：每個 stop id 對應場景檔、NPC 頭像檔、貼紙檔，附品檢狀態。
- `art/walk_assets.js`：同一份內容包成 `window.WALK_ASSETS`，直接 `<script>` 載入即可，不用自己 fetch JSON。
- 重新產生：`python -X utf8 art/real_ref_pilot/_samples_1103d/_work/build_manifest.py`（成品換版本時跑一次）。

status 怎麼讀：`pass` 品檢過（**只有這個可以上線**）；`human` 需您肉眼；`provisional` 補圖後未複檢；`reject` 品檢退回、待重生；`unqa` 沒品檢紀錄；`missing` 沒有可用成品（s2 警察署、tx 車站）。每份成品的完整「可上線／不可上線」清單由 `build_manifest.py` 產生到 `art/real_ref_pilot/_samples_1103d/SHIP_LIST.md`。程式端請用「`status === 'pass'` 且有檔就顯示、否則退回 emoji」，這樣之後重生的圖品檢過、manifest 換版本，您的程式不用動。

## 要改的四處（行號以 2026-11-06 的 master 為準）

### 1. 載入資料：`walk.html`
在 `js/walk_route.js` 之前加一行（記得帶 `?v=`，改 JS 後網頁的 `?v=` 要遞增，否則手機吃快取）：
```html
<script src="art/walk_assets.js?v=202611061"></script>
```

### 2. 探員頭像：`js/walk.js:1350`
```js
var AG_IMG_ON = false;   // 改成 true
```
路徑程式已經組好（`js/walk_agents.js:35` → `art/agents16/NN_<en>_128.png`），顯示在簡報室 72px、選角 36px。注意：這 16 張是 10-29 舊版，當初因「臺灣人長相」未驗而關閉；新版 16 職業只有 4 種過，8 天內補不齊，計畫〔暫定〕先用舊版。

### 3. NPC 頭像：三個顯示點
共同做法：取 `WALK_ASSETS.npcs_by_stop[s.id]`，有 `file` 就放 `<img>`，否則維持 emoji。

- 任務頁 `js/walk.js:1288`，現在是 `<span class="nava">` + `n.ava`（emoji）：
  ```js
  var np = (window.WALK_ASSETS && WALK_ASSETS.npcs_by_stop[s.id]) || null;
  var avaHtml = (np && np.file) ? '<img class="nava-img" src="' + np.file + '" alt="">' : n.ava;
  ```
  CSS（`walk.html:118` 附近 `.nava` 是 46×46 圓框）加：
  ```css
  .nava-img{width:46px;height:46px;border-radius:50%;image-rendering:pixelated;object-fit:cover}
  ```
- 貼紙本 `js/walk.js:`：`(s.npc && s.npc.ava) || '📍'` 同樣改成有檔用 `<img>`（貼紙框 `.stk-i` 是 64×64，加 `image-rendering:pixelated`）。
- 圖鑑 `js/walk_dex_ui.js:392`、`:439`：同上，退回 🧑。

### 4. 景點卡圖：任務頁 `js/walk.js:1117–1125`
在景點標題下面插一張：
```js
var sc = (window.WALK_ASSETS && WALK_ASSETS.scenes[s.id]) || null;
if (sc && sc.file) h += '<img class="scene" src="' + sc.file + '" alt="">';
```
CSS：
```css
.scene{display:block;width:min(100%,360px);margin:6px auto;image-rendering:pixelated;border-radius:8px}
```
180×320 放大成 360 寬時剛好 2 倍整數，不會糊；手機窄於 360 時會非整數縮放，可接受。

### 5.（選用）貼紙本用真貼紙
`WALK_ASSETS.stickers.ach.split / gather / roles` 三枚成就章（gather、roles 過，split 暫定）；案件貼紙可用 `case_default`，或沿用該站 NPC 頭像（視覺上更像「案件貼紙＝NPC」）。足跡 `footprint.like/wow/learn/pass`（wow 需人眼）。

### 6. 署名（CC BY 的參考照）
`art/CREDITS.md`「v2 製程成品對應」列了 6 張需署名的成品（tomscoffin、Emily Jiang、338km、Chainwit.）。在結算頁或 `walk_intro.html` 放一行「場景參考照片：…（CC BY），已修改」即可；兩位作者欄為「—」的我 11-09 回 Commons 補正式名稱。

## 改完怎麼驗（會印數字才算）
1. 開 `walk.html?route=main` 任務頁，`document.querySelectorAll('img.scene').length` 應為 5（s1、s3、s4、s5、s6；s0/s7 共用台文館也算就是 7）。
2. `document.querySelectorAll('img.nava-img').length` ≥ 4（s1、s2、s5、s6 四位 NPC）。
3. 手機（Pixel 6a 實機）開一次：確認沒有吃到舊快取（看 `?v=`），場景圖寬度沒超出卡片。
4. 關網路再開一次：沒有圖時要退回 emoji，不能空白。

## 我這邊接著做的（不碰 js/）
- 11-07 警察署雙 ControlNet 重做 → 過了就更新 manifest 的 s2，重跑 `build_manifest.py`。
- NPC 正式路線 4 位品檢；探員舊版 16 張品檢（臺灣人長相、性別比），不過的用新版替補並更新 manifest。
- 成品換版本只改 manifest，您的程式不用動。
