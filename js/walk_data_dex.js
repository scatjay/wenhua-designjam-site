/* 走讀：圖鑑資料（六類收集、稀有度、里程碑、稱號）。
   純資料（ES5、掛 window.WALK_DEX），由 test_tools/gen_walk_data.js 排版產生；人物 20 與地點 17 用路線 id 對應 walk_route.js／walk_route_tw.js。
   稀有度一律形狀加文字（圓＝普通、菱形＝稀有、星＝傳說），不單靠顏色。 */
(function () {
  'use strict';
  window.WALK_DEX = {
    "version": 1,
    "note": "六類收集；人物與地點用路線 id 對應（route＝main｜campus｜campusW｜tw，stop＝該路線的站 id），名稱以路線資料為準。完成度＝六類已取得數合計 ÷ 總數合計，線索卡總數取 WALK_INTEL 筆數。",
    "rarity": {
      "普通": {"shape":"circle","glyph":"●","label":"普通"},
      "稀有": {"shape":"diamond","glyph":"◆","label":"稀有"},
      "傳說": {"shape":"star","glyph":"★","label":"傳說"}
    },
    "categories": [
      {
        "id": "people",
        "name": "人物",
        "icon": "🧑",
        "total": 20,
        "items": [
          {"id":"np_main_s1","route":"main","stop":"s1","name":"州知事的祕書","ava":"⌚","rarity":"普通"},
          {"id":"np_main_s2","route":"main","stop":"s2","name":"檔案室管理員","ava":"🗂️","rarity":"普通"},
          {"id":"np_main_s5","route":"main","stop":"s5","name":"三郊的老帳房","ava":"🧮","rarity":"稀有"},
          {"id":"np_main_s6","route":"main","stop":"s6","name":"搬廟那年的木匠學徒","ava":"📏","rarity":"稀有"},
          {"id":"np_campus_c1","route":"campus","stop":"c1","name":"校史館的志工學姊","ava":"🗝️","rarity":"普通"},
          {"id":"np_campus_c2","route":"campus","stop":"c2","name":"西淮館的夜班管理員","ava":"🔦","rarity":"稀有"},
          {"id":"np_campus_c3","route":"campus","stop":"c3","name":"銅像旁的老園丁","ava":"🌿","rarity":"普通"},
          {"id":"np_campus_x3","route":"campus","stop":"x3","name":"還書櫃旁的夜讀生","ava":"📚","rarity":"普通"},
          {"id":"np_campus_x4","route":"campus","stop":"x4","name":"夜跑的學長","ava":"🏃","rarity":"普通"},
          {"id":"np_campus_x5","route":"campus","stop":"x5","name":"水邊的看守者（虛構角色）","ava":"💧","rarity":"稀有"},
          {"id":"np_campus_x6","route":"campus","stop":"x6","name":"榕樹下的老先生","ava":"🌳","rarity":"普通"},
          {"id":"np_campus_c4","route":"campus","stop":"c4","name":"畢不了學姊","ava":"🎓","rarity":"傳說"},
          {"id":"np_campusW_w1","route":"campusW","stop":"w1","name":"守夜的警衛伯伯","ava":"🔦","rarity":"普通"},
          {"id":"np_campusW_w2","route":"campusW","stop":"w2","name":"涼亭裡的等車阿姨","ava":"🧣","rarity":"普通"},
          {"id":"np_tw_t2","route":"tw","stop":"t2","name":"圓環旁的路牌檢查員","ava":"🚏","rarity":"普通"},
          {"id":"np_tw_t4","route":"tw","stop":"t4","name":"看守校舍的老工友","ava":"🧹","rarity":"普通"},
          {"id":"np_tw_t5","route":"tw","stop":"t5","name":"電梯學徒（時安局編外）","ava":"🛗","rarity":"普通"},
          {"id":"np_tw_t8","route":"tw","stop":"t8","name":"夜間守門人","ava":"📣","rarity":"稀有"},
          {"id":"np_tw_t9","route":"tw","stop":"t9","name":"老圖書館員","ava":"📖","rarity":"普通"},
          {"id":"np_tw_tx","route":"tw","stop":"tx","name":"大廳裡的琴友","ava":"🎹","rarity":"稀有"}
        ]
      },
      {
        "id": "places",
        "name": "地點",
        "icon": "📍",
        "total": 17,
        "items": [
          {"id":"pl_tw_t1","route":"tw","stop":"t1","name":"台文館＋州會","rarity":"普通"},
          {"id":"pl_tw_t2","route":"tw","stop":"t2","name":"湯德章紀念公園（圓環）","rarity":"普通"},
          {"id":"pl_tw_t3","route":"tw","stop":"t3","name":"美術館 1 館（原警察署）","rarity":"普通"},
          {"id":"pl_tw_t4","route":"tw","stop":"t4","name":"武德殿","rarity":"普通"},
          {"id":"pl_tw_t5","route":"tw","stop":"t5","name":"林百貨與末廣町","rarity":"普通"},
          {"id":"pl_tw_t6","route":"tw","stop":"t6","name":"大天后宮","rarity":"普通"},
          {"id":"pl_tw_t7","route":"tw","stop":"t7","name":"赤崁樓＋靈祐宮（小上帝廟）","rarity":"普通"},
          {"id":"pl_tw_t8","route":"tw","stop":"t8","name":"公會堂（吳園藝文中心）","rarity":"稀有"},
          {"id":"pl_tw_t9","route":"tw","stop":"t9","name":"愛國婦人館","rarity":"稀有"},
          {"id":"pl_campus_c0","route":"campus","stop":"c0","name":"E 棟（修齊大樓）204","rarity":"普通"},
          {"id":"pl_campus_c1","route":"campus","stop":"c1","name":"校史館","rarity":"普通"},
          {"id":"pl_campus_c2","route":"campus","stop":"c2","name":"西淮館","rarity":"普通"},
          {"id":"pl_campus_c3","route":"campus","stop":"c3","name":"三連堂與吳三連銅像","rarity":"普通"},
          {"id":"pl_campus_x3","route":"campus","stop":"x3","name":"圖書館附近（修齊大樓一帶）","rarity":"普通"},
          {"id":"pl_campus_x4","route":"campus","stop":"x4","name":"優活館","rarity":"普通"},
          {"id":"pl_campus_x5","route":"campus","stop":"x5","name":"水力加工坊","rarity":"稀有"},
          {"id":"pl_campus_x6","route":"campus","stop":"x6","name":"天圓地方","rarity":"稀有"}
        ]
      },
      {
        "id": "clue",
        "name": "線索卡",
        "icon": "🗂️",
        "total": null,
        "source": "WALK_INTEL",
        "approxTotal": 225,
        "note": "總數＝情報卡筆數；每章 8～10 張，約 25 章"
      },
      {
        "id": "looks",
        "name": "造型",
        "icon": "🎭",
        "total": 8,
        "items": [
          {"id":"lk_sk_hat","skin":"sk_hat","emoji":"🕵️","name":"偵探帽","rarity":"普通"},
          {"id":"lk_sk_astro","skin":"sk_astro","emoji":"🧑‍🚀","name":"太空人","rarity":"普通"},
          {"id":"lk_sk_cat","skin":"sk_cat","emoji":"🐱","name":"貓咪","rarity":"普通"},
          {"id":"lk_sk_ghost","skin":"sk_ghost","emoji":"👻","name":"小幽靈","rarity":"普通"},
          {"id":"lk_sk_robot","skin":"sk_robot","emoji":"🤖","name":"機器人","rarity":"普通"},
          {"id":"lk_sk_ninja","skin":"sk_ninja","emoji":"🥷","name":"忍者","rarity":"普通"},
          {"id":"lk_sk_mage","skin":"sk_mage","emoji":"🧙","name":"魔法師","rarity":"稀有"},
          {"id":"lk_sk_dragon","skin":"sk_dragon","emoji":"🐲","name":"小龍","rarity":"稀有"}
        ]
      },
      {
        "id": "roles",
        "name": "職務",
        "icon": "🎖️",
        "total": 16,
        "items": [
          {"id":"ro_captain","role":"隊長","rarity":"稀有"},
          {"id":"ro_navigator","role":"領航員","rarity":"普通"},
          {"id":"ro_strategist","role":"軍師","rarity":"稀有"},
          {"id":"ro_scout","role":"偵查員","rarity":"普通"},
          {"id":"ro_archivist","role":"檔案官","rarity":"普通"},
          {"id":"ro_interviewer","role":"訪談員","rarity":"普通"},
          {"id":"ro_photographer","role":"蒐證員","rarity":"普通"},
          {"id":"ro_recorder","role":"記錄官","rarity":"普通"},
          {"id":"ro_designer","role":"文化設計員","rarity":"普通"},
          {"id":"ro_radio","role":"通訊官","rarity":"普通"},
          {"id":"ro_safety","role":"安全官","rarity":"普通"},
          {"id":"ro_supply","role":"補給官","rarity":"普通"},
          {"id":"ro_forensic","role":"鑑識員","rarity":"普通"},
          {"id":"ro_tech","role":"技術專家","rarity":"普通"},
          {"id":"ro_local","role":"在地嚮導","rarity":"普通"},
          {"id":"ro_actor","role":"扮演專員","rarity":"普通"}
        ]
      },
      {
        "id": "titles",
        "name": "稱號",
        "icon": "🏅",
        "total": 15,
        "items": [
          {
            "id": "ti_first",
            "name": "初出茅廬",
            "rarity": "普通",
            "desc": "完成第一個章節。",
            "cond": {"key":"chaptersDone","value":1}
          },
          {
            "id": "ti_walker",
            "name": "府城行者",
            "rarity": "普通",
            "desc": "走到 10 個不同的站點。",
            "cond": {"key":"stopsArrived","value":10}
          },
          {
            "id": "ti_owner",
            "name": "小精靈夥伴",
            "rarity": "普通",
            "desc": "孵出你的第一隻小精靈。",
            "cond": {"key":"spiritsHatched","value":1}
          },
          {
            "id": "ti_visitor",
            "name": "房間街常客",
            "rarity": "普通",
            "desc": "拜訪 10 間別人的房間。",
            "cond": {"key":"roomsVisited","value":10}
          },
          {
            "id": "ti_night",
            "name": "夜行者",
            "rarity": "普通",
            "desc": "在夜間走到一個站點。",
            "cond": {"key":"nightArrive","value":1}
          },
          {
            "id": "ti_collector",
            "name": "小小收藏家",
            "rarity": "普通",
            "desc": "擁有 5 件家具。",
            "cond": {"key":"furnitureOwned","value":5}
          },
          {
            "id": "ti_dex25",
            "name": "圖鑑學徒",
            "rarity": "普通",
            "desc": "圖鑑完成度達 25%。",
            "cond": {"key":"dexPct","value":25}
          },
          {
            "id": "ti_dex50",
            "name": "圖鑑達人",
            "rarity": "稀有",
            "desc": "圖鑑完成度達 50%。",
            "cond": {"key":"dexPct","value":50}
          },
          {
            "id": "ti_dex75",
            "name": "圖鑑名士",
            "rarity": "稀有",
            "desc": "圖鑑完成度達 75%。",
            "cond": {"key":"dexPct","value":75}
          },
          {
            "id": "ti_tripod",
            "name": "三足鼎立",
            "rarity": "稀有",
            "desc": "同時養 3 隻小精靈，牠們的時期、屬性、專長都不一樣。",
            "cond": {"key":"tripod","value":1,"fields":["eraId","attr","scoutKind0"]}
          },
          {
            "id": "ti_awake",
            "name": "喚醒者",
            "rarity": "稀有",
            "desc": "讓一隻小精靈覺醒。",
            "cond": {"key":"spiritsAwake","value":1}
          },
          {
            "id": "ti_scout",
            "name": "老練勘察家",
            "rarity": "稀有",
            "desc": "完成 10 次勘察。",
            "cond": {"key":"expeditions","value":10}
          },
          {
            "id": "ti_decor",
            "name": "房間設計師",
            "rarity": "稀有",
            "desc": "集滿一套主題套裝。",
            "cond": {"key":"setComplete","value":1}
          },
          {
            "id": "ti_intel",
            "name": "情報蒐集家",
            "rarity": "稀有",
            "desc": "取得 50 張情報卡。",
            "cond": {"key":"intelCards","value":50}
          },
          {
            "id": "ti_dex100",
            "name": "時安局圖鑑館長",
            "rarity": "傳說",
            "desc": "圖鑑完成度達 100%。",
            "cond": {"key":"dexPct","value":100}
          }
        ]
      }
    ],
    "spiritBook": {
      "total": 24,
      "forms": 72,
      "note": "小精靈另有自己的圖鑑冊（24 隻，每隻 3 種形態共 72 項），不算在六類完成度內；第 16 隻只在圖鑑 100% 出現。",
      "unlock": {"sp_marrow":100}
    },
    "milestones": [
      {"pct":25,"once":true,"reward":{"points":50,"title":"ti_dex25"}},
      {
        "pct": 50,
        "once": true,
        "reward": {"points":100,"title":"ti_dex50","look":"sk_cat","items":{"scanner_stand":1},"egg":"sp_lion"}
      },
      {
        "pct": 75,
        "once": true,
        "reward": {"points":150,"title":"ti_dex75","look":"sk_dragon","egg":"sp_rubbing"}
      },
      {
        "pct": 100,
        "once": true,
        "reward": {"points":300,"title":"ti_dex100","look":"sk_mage","items":{"whale_night":1},"egg":"sp_marrow"}
      }
    ],
    "tripod": {
      "titleId": "ti_tripod",
      "size": 3,
      "distinct": ["eraId","attr","scoutKind0"],
      "note": "三隻的歷史時期、屬性、勘察專長（第一類）各不相同；只給稱號，不加分。"
    }
  };
})();
