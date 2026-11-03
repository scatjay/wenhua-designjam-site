/* 走讀：小精靈資料（24 隻）、點心、玩具、特別搭檔、共用設定。
   純資料（ES5、掛 window），由 test_tools/gen_walk_data.js 排版產生；數值來源見 BUILD_SPEC_ROOM_SPIRIT_1103.md 第 3 節。
   精靈圖＝16×16 字串矩陣 rows（'.' 透明）＋調色盤 pal（字元→色碼）；歷史錨點全部待文史把關。 */
(function () {
  'use strict';
  /* 蛋圖：每隻小精靈各有自己的蛋（輪廓、花紋、配色獨有），以小精靈 id 為鍵 */
  var EGGS = {
    "sp_tide": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "......oooo......",
        ".....oaaaao.....",
        "....odaaaaao....",
        "...oadacacaao...",
        "..oacacacacaao..",
        "..oaaaaaaaaaao..",
        "..oaaaaaaaaaao..",
        "..oaabababaaao..",
        "..oababababaao..",
        "...oaaaaaaaao...",
        "....oaaaaaao....",
        ".....oaaaao.....",
        "......oooo......",
        "................"
      ],
      "pal": {"o":"#14235a","a":"#4b6fd6","d":"#dff3ff","c":"#9ad7ff","b":"#2f4a9c"}
    },
    "sp_deer": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "........o.......",
        ".......obo......",
        ".....ooobooo....",
        "....obbbbbbbo...",
        "...obcbcbcbcbo..",
        "...obbbbbbbbbo..",
        "....oobbbbboo...",
        "....oaaaaaaao...",
        "....oaadaaaao...",
        "....oaaaaaaao...",
        "....oaaaadaao...",
        ".....oadaaao....",
        "......oaaao.....",
        ".......obo......",
        "........o......."
      ],
      "pal": {"o":"#3d2209","b":"#7a4a22","c":"#e8c98a","a":"#b9763a","d":"#f4e3c0"}
    },
    "sp_gull": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "................",
        "................",
        "...oooooooooo...",
        "..oaacaabaacaoo.",
        ".oaaacaabaacaaao",
        "oawaacdabaacaaaa",
        "oaaaacaabadcaaaa",
        "oaaaacaabaacaeaa",
        ".oaaacaabaacaaao",
        "..ooooooooooooo.",
        "................",
        "................",
        "................",
        "................"
      ],
      "pal": {"o":"#38485c","a":"#eaf0f7","c":"#f0a030","b":"#9fb0c4","w":"#ffffff","d":"#6b7a8f","e":"#e04a3a"}
    },
    "sp_sail": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "........oo......",
        ".......obeo.....",
        "......oaboeo....",
        "......oabao.....",
        ".....oaabao.....",
        ".....oaabaao....",
        "....oaaabaao....",
        "....oacabaaao...",
        "...oaaaabacao...",
        "...oaaaabaaaao..",
        "..oaaaaabaaaaao.",
        "...oaaaabaaaao..",
        "....odddddddo...",
        ".....ooooooo....",
        "................"
      ],
      "pal": {"o":"#2a3a5a","b":"#7a4a22","e":"#d95b43","a":"#d8ecf4","c":"#f0a860","d":"#4b6fd6"}
    },
    "sp_bookworm": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "................",
        "........o.......",
        "..oo.oooeooo.oo.",
        ".oddocccecccoddo",
        ".oddcbbceccccddo",
        "oddddcccebccdddd",
        "oddddcccecccdddd",
        "oddddcbbecbcdddd",
        ".oddcccceccccddo",
        ".oddocccecccoddo",
        "..oo.oooeooo.oo.",
        "........o.......",
        "................",
        "................"
      ],
      "pal": {"o":"#284a2c","e":"#d95b43","d":"#7a4a22","c":"#f6efd8","b":"#6f9468"}
    },
    "sp_abacus": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "...oooooooooo...",
        "..obbbbbbbbbbo..",
        "..obeeeeeeeebo..",
        "..obecedecedbo..",
        "..obeeeeeeeebo..",
        "..obaaaaaaaabo..",
        "..obeeeeeeeebo..",
        "..obedecedecbo..",
        "..obedecedecbo..",
        "..obbbbbbbbbbo..",
        "...obboooobbo...",
        "...obbo..obbo...",
        "....oo....oo....",
        "................"
      ],
      "pal": {"o":"#4a2a08","b":"#7a4a14","e":"#fff3d6","c":"#4b6fd6","d":"#c4553b","a":"#e8d8a8"}
    },
    "sp_lion": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "........o.......",
        "......ooaoo.....",
        ".....oaaaaao....",
        "....oaacaaaao...",
        "...oaacaaaaaao..",
        "...oaaaaaaaaao..",
        "...oaaddaaaaao..",
        "...oaaaaaabaao..",
        "....oaaaabaao...",
        "....ooaaaaao....",
        "...oeeeeeeeeo...",
        "...oedeeedeeo...",
        "...oeeeedeeeo...",
        "....oooooooo....",
        "................"
      ],
      "pal": {"o":"#40281a","a":"#c8b8a0","c":"#e0d4c0","d":"#5aa8a0","b":"#8a7660","e":"#8d6a3a"}
    },
    "sp_brick": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "................",
        "................",
        "..oooooooooooo..",
        ".oaaaaaaaaaaaao.",
        ".oaccaaaabaaaao.",
        ".oaabaaaabaaaao.",
        ".obbbbbbbbbbbbo.",
        ".oaaaabaaaabaao.",
        ".oaaaabaaaabeao.",
        ".oaaaabaaaabaao.",
        "..oooooooooooo..",
        "................",
        "................",
        "................"
      ],
      "pal": {"o":"#4a1a10","a":"#c4553b","c":"#f0b090","b":"#8f3a28","e":"#f2c14e"}
    },
    "sp_watch": {
      "w": 16,
      "h": 16,
      "rows": [
        "........o.......",
        ".......obo......",
        "......obobo.....",
        "......obbbo.....",
        ".....oaabaao....",
        "....oaaakaaao...",
        "...oaacckccaao..",
        "..oaaccckcccaao.",
        "..oaaccckcccaao.",
        "..oacccceccccao.",
        "..oaacccckkcaao.",
        "..oaacccccccaao.",
        "...oaacccccaao..",
        "....oaaakaaao...",
        ".....oaaaaao....",
        "......ooooo....."
      ],
      "pal": {"o":"#3a2a08","b":"#8a6a1c","a":"#c8a040","k":"#1d1504","c":"#fff6dc","e":"#d95b43"}
    },
    "sp_telegraph": {
      "w": 16,
      "h": 16,
      "rows": [
        "........o.......",
        "......ooaoo.....",
        ".....oaacaao....",
        ".....oadaaao....",
        "....oaadaaaao...",
        ".....oaaaaao....",
        ".....oaaaaao....",
        ".....ooaaoo.....",
        "....oaaaaaao....",
        "....oaaaaaaao...",
        "....obbbbbbbo...",
        "..ooaacaaacaao..",
        ".obbbbbbbbbbbbo.",
        ".obbbbbbbbbbbbo.",
        "..oooooooooooo..",
        "................"
      ],
      "pal": {"o":"#12305a","a":"#5aa0e0","c":"#f2c14e","d":"#e8f0f8","b":"#2f6aa8"}
    },
    "sp_radio": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "...o.........o..",
        "..oco.......oco.",
        "..oocoooooooco..",
        ".oaaacaaaaacaao.",
        ".oabbbbbbbbbbao.",
        ".oabaaaabbebbao.",
        ".oabacacbccccao.",
        ".oabacacbceccao.",
        ".oabacacbccccao.",
        ".oabacacbbbbbao.",
        ".oabbbbbbbbbbao.",
        ".oaaaaaaaaaaaao.",
        "..oooooooooooo..",
        "................",
        "................"
      ],
      "pal": {"o":"#2a1608","c":"#c9ccd2","a":"#8b5a2b","b":"#5a3a1e","e":"#f2c14e"}
    },
    "sp_neon": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "........o.......",
        ".....ooodooo....",
        "....oaaaaaaao...",
        "...oaaaaaaadao..",
        "..oaeaacccaaaao.",
        "..oaaacooocaaao.",
        "..oaaco...ocaao.",
        ".oaaaco...ocaaao",
        "..oaaco...ocaao.",
        "..oaaacooocaaao.",
        "..oaadacccaeaao.",
        "...oaaaaaaaaao..",
        "....oaaaaaaao...",
        ".....oooaooo....",
        "........o......."
      ],
      "pal": {"o":"#3a0f52","d":"#ffe6fa","a":"#e048c8","e":"#fff27a","c":"#58e8f0"}
    },
    "sp_ink": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "........o.......",
        ".......oao......",
        "......oaaao.....",
        "......oaaao.....",
        ".....oaaaaao....",
        ".....oaaaaao....",
        "....oaacaaaao...",
        "...oaacaaaaao...",
        "...oaacaaaaao...",
        "...oaaaaaaaaao..",
        "...oaaaaadaao...",
        "....oaaaaabao...",
        ".....oaaaaao....",
        "......ooooo.....",
        "................"
      ],
      "pal": {"o":"#0c1230","a":"#33406e","c":"#8fa0e8","d":"#d9d2c0","b":"#1e2748"}
    },
    "sp_bee": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        ".....oooooo.....",
        "....oaaaaaao....",
        "....oaaaaaaao...",
        "...oaaccccaaao..",
        "...oaaccbccaao..",
        "..oaacccccccaao.",
        ".oaacbbbbbbbaao.",
        "..oaacecccccaao.",
        "...oaaccbccaao..",
        "...oaaaaaaaaao..",
        "....oaaaaaaao...",
        ".....ooooooo....",
        "................",
        "................"
      ],
      "pal": {"o":"#3b2f10","a":"#ffd23a","c":"#cfeaf5","b":"#3b2f2f","e":"#f08a24"}
    },
    "sp_rubbing": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "....oooooooo....",
        "...oeeaaaaaao...",
        "...oeeacacaao...",
        "...oaacacacao...",
        "...oacacacaao...",
        "...oaabbbbcao...",
        "...oacbdbbaao...",
        "...oaabbdbcao...",
        "...oacbbbbaao...",
        "...oaacacacao...",
        "...oacacacaao...",
        "...oaacacaeeo...",
        "...oaaaaaaeeo...",
        "....oooooooo....",
        "................"
      ],
      "pal": {"o":"#0f4a42","e":"#f2c14e","a":"#46c7b0","c":"#9ef0dc","b":"#2a8d7e","d":"#ff6fb5"}
    },
    "sp_marrow": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "......ooooo.....",
        ".....oaaaaao....",
        "....oaacccaao...",
        "...oawwcccccao..",
        "..oaawccccccaao.",
        "..oacccyyycccao.",
        "..oacccyyycccao.",
        "..oacccyyycccao.",
        "..oaaccccccdaao.",
        "...oacccccdcao..",
        "....oaacccaao...",
        ".....oaaaaao....",
        "......ooooo.....",
        "................"
      ],
      "pal": {"o":"#2a1a6a","a":"#b9a0f0","c":"#e8dcff","w":"#ffffff","y":"#fff3b0","d":"#8fe0ff"}
    },
    "sp_snailcrab": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        ".......ooo......",
        "......oaaao.....",
        "......oaaao.....",
        ".....obbbbbo....",
        "....oaaaaaaao...",
        "....oaaaaaaao...",
        "...obbbbbbbbbo..",
        "...oaaaaaaaaao..",
        "..obbbbbbbbbbbo.",
        "..oaaaaaaaaaaao.",
        "..oaacaaaaacaao.",
        "...oaaaaaaaaao..",
        "....oooaaaooo...",
        ".......ooo......"
      ],
      "pal": {"o":"#5a2a3a","a":"#f4b8c8","b":"#c87890","c":"#fff0f4"}
    },
    "sp_leopard": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "................",
        ".......ooo......",
        "....oooaaaooo...",
        "...oaaaaaaaaao..",
        "..oabbabbaaabbo.",
        ".oaadaadaabbdaao",
        ".oacaaaaaadaaaao",
        ".oaaabbabbabbaao",
        "..oaadaadaadaao.",
        "...oaaaaaaaaao..",
        "....oooaaaooo...",
        ".......ooo......",
        "................",
        "................"
      ],
      "pal": {"o":"#2a2214","a":"#d8c890","b":"#5a4a30","d":"#8a8a78","c":"#f4ecd0"}
    },
    "sp_seahorse": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        ".......ooo......",
        ".....ooaaeoo....",
        "....oaaaaaaao...",
        "....oaaaaaoo....",
        "...oaaaaao......",
        "...oadaaao......",
        "..oaaaaao.......",
        "..oaaaaaco......",
        "..oaabaaco......",
        "...oaaaaao......",
        "...oaabaao......",
        "....oaaaaaoo....",
        "....oaaaaaaao...",
        ".....ooaaaoo....",
        ".......ooo......"
      ],
      "pal": {"o":"#0a3a38","a":"#3fb8b0","e":"#d95b43","d":"#f0c040","c":"#f4ecd8","b":"#1f7a78"}
    },
    "sp_ironcrab": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "................",
        "................",
        "..oooooooooooo..",
        ".obbbbbbbbbbbbo.",
        ".oaaabbbbbbaaao.",
        ".oaaabddddbaaao.",
        ".oawabdeedbawao.",
        ".oaaabbbbbbaaao.",
        ".oaaaaaaaaaaaao.",
        ".obbbbbbbbbbbbo.",
        "..obboooooobbo..",
        "..obbo....obbo..",
        "...oo......oo...",
        "................"
      ],
      "pal": {"o":"#1a2230","b":"#4a5868","a":"#8a98a8","d":"#e04a3a","w":"#ffffff","e":"#58e8f0"}
    },
    "sp_kitedragon": {
      "w": 16,
      "h": 16,
      "rows": [
        "........o.......",
        ".......obo......",
        "......oabo......",
        ".....oaabao.....",
        "....oacabaco....",
        "...oaaaabaaaoo..",
        "..obbbbbbbbbbbo.",
        "...oaaaabaaaao..",
        "....ocaabaaco...",
        "....oaaabeaao...",
        ".....oaebaao....",
        "......oabao.....",
        "......oadao.....",
        ".......obo......",
        ".......obo......",
        "........o......."
      ],
      "pal": {"o":"#4a0f20","b":"#a02a48","a":"#e8506a","c":"#ffd86a","e":"#ffffff","d":"#58c8e8"}
    },
    "sp_sugartrain": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "......oooo......",
        "....ooccccoo....",
        "..ooccccccccoo..",
        ".occccccdccccco.",
        ".oaaccccccccbbo.",
        ".oaaaaccccbbbbo.",
        ".oaaeaaabbbbbbo.",
        ".oaaaaaabbbbbbo.",
        ".oaaadaabbbbbbo.",
        ".oaaaaaabbbdbbo.",
        "..ooaaaabbbboo..",
        "....ooaabboo....",
        "......oooo......",
        "................"
      ],
      "pal": {"o":"#5a1a38","c":"#fff0a8","d":"#6fcfae","a":"#f6a0c0","b":"#b8587c","e":"#f2c14e"}
    },
    "sp_parrot": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "........o.......",
        ".....oookooo....",
        "....okkkbkkko...",
        "...okekkbkkbko..",
        "..okekbkkkbkbko.",
        "..okkbkkakkbkko.",
        "..okkkkaaakkkko.",
        ".okbbkaadaakbbko",
        "..okkkkaaakkkko.",
        "..okkbkkakkbkko.",
        "..okbkbkkkbkbko.",
        "...okbkkbkkbko..",
        "....okkkbkkko...",
        ".....oookooo....",
        "........o......."
      ],
      "pal": {"o":"#0f3a18","k":"#081d0c","b":"#207a30","e":"#f2c14e","a":"#4fc05a","d":"#d02a3a"}
    },
    "sp_ufo": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "................",
        "........o.......",
        "......oocoo.....",
        ".....occwcco....",
        "....occdcccco...",
        "..ooacccccccaoo.",
        ".oaaaacccccaaaao",
        "oaaeaaeacaeaaeaa",
        ".oaaaaaabaaaaaao",
        "..oobbbbbbbbboo.",
        "....ooooboooo...",
        "........o.......",
        "................",
        "................"
      ],
      "pal": {"o":"#1a2040","c":"#58e8f0","w":"#ffffff","d":"#a0f0ff","a":"#9aa8c0","e":"#ff6fb5","b":"#5a6888"}
    }
  };
  /* 24 隻小精靈；效果一律 {key,value}，由 WalkStore.talents() 彙整給 walk.js 讀 */
  var SPIRITS = [
    {
      "id": "sp_tide",
      "no": 1,
      "name": "潮汐鯨魂",
      "nick": "潮",
      "era": "西拉雅與大員前史",
      "eraId": "pre",
      "genre": "fantasy",
      "anchor": "與台江內海地形變遷有關的海洋生物，待文史把關",
      "attr": "觀察",
      "rarity": "傳說",
      "eggChapter": "c4",
      "starter": true,
      "assist": {"name":"指路","desc":"標出下一站方向","cd":3,"key":"showNextDir","value":1},
      "talent": {"name":"寬步","desc":"到站判定範圍 +3 公尺","key":"arriveRange","value":3},
      "scout": {"kind":["方位"],"era":"西拉雅與大員前史"},
      "awaken": {
        "name": "潮聲",
        "desc": "30 秒內顯示 200 公尺內全部隱藏關卡",
        "key": "revealHidden",
        "value": 200,
        "seconds": 30,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":100,"desc":"羈絆 30 且圖鑑完成 100%"}
      },
      "hatchHours": 2,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_tide,
          "line": "蛋殼裡傳出低低的歌聲。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "........o.......",
              ".......oeo......",
              ".....oooaooo....",
              "....oaaaaaaao...",
              "...oaaaaaaaaaoo.",
              "...oawkaaawkaobo",
              "..oaakkaaakkaabo",
              "..oopaddbddapobo",
              ".obbadddddddaoo.",
              "..ooodddddddo...",
              ".....oooaooo....",
              "........o.......",
              "................"
            ],
            "pal": {
              "o": "#14235a",
              "e": "#6fe0e8",
              "a": "#4b6fd6",
              "w": "#ffffff",
              "k": "#0a122d",
              "b": "#2f4a9c",
              "p": "#e87fa8",
              "d": "#dff3ff"
            }
          },
          "line": "我是潮，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "..........o.....",
              ".........oco....",
              "........oceco...",
              "ooo..oooaaeoo...",
              "bbbooaaaaaaaao..",
              "bbaaaaaaaaaakao.",
              "oaaaaaaaaaaaaaao",
              ".oaaaadddddbbbao",
              "..ooadcccccccdo.",
              "....oadbbbdddo..",
              ".....oooaaooo...",
              "........oo......",
              "................"
            ],
            "pal": {"o":"#14235a","c":"#9ad7ff","e":"#6fe0e8","a":"#4b6fd6","b":"#2f4a9c","k":"#0a122d","d":"#dff3ff"}
          },
          "line": "海風今天很輕。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              ".y........O.....",
              "ygy......OcO....",
              ".y......OcecO...",
              "OOO..OOOaaeOO...",
              "bbbOOaaaaaaaaO..",
              "bbaaaaaaaaaakaO.",
              "OaaaaaaaaaaaaaaO",
              ".OaaaadddddbbbaO",
              "..OOadcccccccdO.",
              ".y..OadbbbdddOy.",
              "ygy..OOOaaOOOygy",
              ".y......OO....y.",
              "................"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#6d6255",
              "g": "#f2c14e",
              "c": "#9ad7ff",
              "e": "#6fe0e8",
              "a": "#4b6fd6",
              "b": "#2f4a9c",
              "k": "#0a122d",
              "d": "#dff3ff"
            }
          },
          "line": "潮聲，替你開路。"
        }
      },
      "favFood": "方位",
      "lines": {
        "idle": ["海風今天很輕。","我在聽遠方的潮聲。","慢慢走，潮也是慢慢來。","你的腳步，和浪一樣穩。"],
        "pet": ["呼——像海水拍過來。","再摸一下，水珠會跳。","好暖，像曬過的沙。"],
        "feed": ["謝謝，味道像鹹鹹的海。","我記住這一口了。","吃飽了，能游更遠。"],
        "awake": ["潮聲，替你開路。","我看見很遠很遠的方向。","一起去看看海的另一邊。"]
      }
    },
    {
      "id": "sp_deer",
      "no": 2,
      "name": "鹿影",
      "nick": "斑",
      "era": "荷治",
      "eraId": "dutch",
      "genre": "fantasy",
      "anchor": "與荷治時期鹿皮貿易有關的森林生物，待文史把關",
      "attr": "觀察",
      "rarity": "普通",
      "eggChapter": "t7,s6",
      "starter": true,
      "assist": {"name":"整理筆記","desc":"把本章線索排成清單","cd":0,"key":"listClues","value":1},
      "talent": {"name":"先機","desc":"每章第一則提示免費","key":"freeFirstHint","value":1},
      "scout": {"kind":["史料"],"era":"荷治"},
      "awaken": {
        "name": "鹿徑",
        "desc": "下一站的「走路分鐘」與路況一次顯示",
        "key": "nextWalkInfo",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_deer,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "......o...o.....",
              ".....oco.oco....",
              "...oooco.ocooo..",
              "..obbooooooobbo.",
              "..obboaadaaobbo.",
              "..obbaadadaabbo.",
              "..obawkaawkaabo.",
              "...oakkaakkaao..",
              "...oaaaaaaaaao..",
              "...oaaadkdaaao..",
              "...odaaaaaaao...",
              "....oaaaaaao....",
              "....oaaaaaao....",
              "....oboooobo....",
              ".....o....o....."
            ],
            "pal": {"o":"#3d2209","c":"#e8c98a","b":"#7a4a22","a":"#b9763a","d":"#f4e3c0","w":"#ffffff","k":"#1f1105"}
          },
          "line": "我是斑，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".........oo.oo..",
              "........occocco.",
              ".......ococaabo.",
              "........oobkaao.",
              ".........oaaadko",
              "........oaaaaoo.",
              "....oooooaaao...",
              "..ooaaaaaaaao...",
              ".odadadaaaao....",
              ".odaaaaadaao....",
              "..oaddddddao....",
              "..obaddddabo....",
              "..oboboobobo....",
              "..okokookoko....",
              "...o.o..o.o.....",
              "................"
            ],
            "pal": {"o":"#3d2209","c":"#e8c98a","a":"#b9763a","b":"#7a4a22","k":"#1f1105","d":"#f4e3c0"}
          },
          "line": "我躲在樹影後面看你。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "..y..y...OO.OO..",
              ".ygyygy.OccOccO.",
              "..y..y.OcOcaabO.",
              "........OObkaaO.",
              ".........OaaadkO",
              "........OaaaaOO.",
              "....OOOOOaaaO...",
              "..OOaaaaaaaaO...",
              ".OdadadaaaaO....",
              ".OdaaaaadaaO....",
              "..OaddddddaO....",
              "..ObaddddabO....",
              "..ObObOObObO..y.",
              "..OkOkOOkOkO.ygy",
              "...O.O..O.O...y.",
              "................"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#856225",
              "g": "#f2c14e",
              "c": "#e8c98a",
              "a": "#b9763a",
              "b": "#7a4a22",
              "k": "#1f1105",
              "d": "#f4e3c0"
            }
          },
          "line": "鹿徑亮了，跟我來。"
        }
      },
      "favFood": "史料",
      "lines": {
        "idle": ["我躲在樹影後面看你。","這裡的草，聞起來不一樣。","你走快一點，我跟得上。","我在數你的腳印。"],
        "pet": ["咦…可以再摸耳朵嗎？","癢癢的，但很舒服。","我的斑點在發熱。"],
        "feed": ["好好吃，我小口小口吃。","謝謝你，我不挑食。","這個，留一點給你。"],
        "awake": ["鹿徑亮了，跟我來。","我不再躲了，換我帶路。","腳印串成一條路了。"]
      }
    },
    {
      "id": "sp_gull",
      "no": 3,
      "name": "機械海鷗",
      "nick": "鷗",
      "era": "荷治",
      "eraId": "dutch",
      "genre": "scifi",
      "anchor": "與大員港一帶海岸有關的機械鳥，待文史把關",
      "attr": "行動",
      "rarity": "普通",
      "eggChapter": "wt",
      "assist": {"name":"遠望","desc":"預告 300 公尺內的站點","cd":5,"key":"previewStops","value":300},
      "talent": {"name":"加速齒輪","desc":"計時賽速度分上限 +2","key":"timedSpeedCap","value":2},
      "scout": {"kind":["路況"],"era":"荷治"},
      "awaken": {
        "name": "俯衝",
        "desc": "計時賽中跳過一次到站判定等待",
        "key": "skipArriveWait",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_gull,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "............o...",
              "........o..oeo..",
              ".......obo.odo..",
              "......oboboodo..",
              ".....oooaooodo..",
              "....oaaaaaaao...",
              "...oawkaawkaao..",
              "..obbkkaakkabbo.",
              "..obbbaaaaabbbo.",
              "..obbbacccabdbo.",
              "..obbaaaaaaabbo.",
              "...ooaaaaaaaoo..",
              "....occoaocco...",
              ".....oo.o.oo....",
              "................"
            ],
            "pal": {
              "o": "#38485c",
              "e": "#e04a3a",
              "b": "#9fb0c4",
              "d": "#6b7a8f",
              "a": "#eaf0f7",
              "w": "#ffffff",
              "k": "#1c242e",
              "c": "#f0a030"
            }
          },
          "line": "我是鷗，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "............o...",
              "...........odo..",
              "ooo.....oooodoo.",
              "bdbo.ooobbdaeaao",
              "obddoaabbdbaaaco",
              "oobbdabbdbaaacco",
              "bbbaabdddbaaaoo.",
              "bbbaaadadaaaao..",
              "ooooaadddaaao...",
              "....oacaacao....",
              "....occoocco....",
              ".....oo..oo.....",
              "................"
            ],
            "pal": {"o":"#38485c","d":"#6b7a8f","b":"#9fb0c4","a":"#eaf0f7","e":"#e04a3a","c":"#f0a030"}
          },
          "line": "回報：天氣晴，視野良好。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "...y........O...",
              "..ygy......OdO..",
              "OOOy....OOOOdOO.",
              "bdbO.OOObbdaeaaO",
              "ObddOaabbdbaaacO",
              "OObbdabbdbaaaccO",
              "bbbaabdddbaaaOO.",
              "bbbaaadadaaaaO..",
              "OOOOaadddaaaO...",
              ".y..OacaacaO..y.",
              "ygy.OccOOccO.ygy",
              ".y...OO..OO...y.",
              "................"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#827856",
              "g": "#f2c14e",
              "d": "#6b7a8f",
              "b": "#9fb0c4",
              "a": "#eaf0f7",
              "e": "#e04a3a",
              "c": "#f0a030"
            }
          },
          "line": "俯衝模式，啟動！"
        }
      },
      "favFood": "路況",
      "lines": {
        "idle": ["回報：天氣晴，視野良好。","正在掃描前方。","零件狀態：很有精神。","我的齒輪在哼歌。"],
        "pet": ["摸到天線了，嗶。","感應到溫度，舒適。","再摸一次，我就轉圈。"],
        "feed": ["能量補充中，嗶嗶。","味道分析：很讚。","電量上升，起飛準備。"],
        "awake": ["俯衝模式，啟動！","視野全開，看得到更遠。","翅膀換新，出發吧。"]
      }
    },
    {
      "id": "sp_sail",
      "no": 4,
      "name": "帆影",
      "nick": "帆",
      "era": "明鄭",
      "eraId": "zheng",
      "genre": "relic",
      "anchor": "與海上航行和水師有關的船帆靈體，不涉及人物，待文史把關",
      "attr": "行動",
      "rarity": "稀有",
      "eggChapter": "t6,s5",
      "assist": {"name":"集合信號","desc":"全隊目標列指向你","cd":10,"key":"rallySignal","value":1},
      "talent": {"name":"順風隊形","desc":"全隊到站速度 +5%","key":"teamArriveSpeed","value":0.05},
      "scout": {"kind":["方位"],"era":"明鄭"},
      "awaken": {
        "name": "順風",
        "desc": "10 分鐘內到站判定 +10 公尺",
        "key": "arriveRange",
        "value": 10,
        "minutes": 10,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_sail,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              ".......o........",
              "......oboo......",
              "......obeeo.....",
              ".....oaboo......",
              ".....oaboo......",
              "....oaaboco.....",
              "...ooaaboco.....",
              "..owkaabocco....",
              "..okkaabowko....",
              "..oapaabokkco...",
              "...oooooooooo...",
              "...obdbbdbbbbo..",
              "....obbbbbbbo...",
              ".....ooooooo....",
              "................"
            ],
            "pal": {
              "o": "#2a3a5a",
              "b": "#7a4a22",
              "e": "#d95b43",
              "a": "#d8ecf4",
              "c": "#f0a860",
              "w": "#ffffff",
              "k": "#151d2d",
              "p": "#e87fa8",
              "d": "#4b6fd6"
            }
          },
          "line": "我是帆，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".......o........",
              "......obooo.....",
              "......obeeeo....",
              "......obeoo.....",
              ".....oaboo......",
              ".....oaboco.....",
              ".....oaboco.....",
              "....oaabocoo....",
              "....oaabokcko...",
              "...okakbocco....",
              "...oapabocco....",
              "...oaaaboccco...",
              "..obbbbbbbbbo...",
              "...obbbbbbbo....",
              "...odoodoodo....",
              "....o..o..o....."
            ],
            "pal": {
              "o": "#2a3a5a",
              "b": "#7a4a22",
              "e": "#d95b43",
              "a": "#d8ecf4",
              "c": "#f0a860",
              "k": "#151d2d",
              "p": "#e87fa8",
              "d": "#4b6fd6"
            }
          },
          "line": "全員注意，風向正好！"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "...y...O........",
              "..ygy.ObOOO.....",
              "...yy.ObeeeO....",
              "...ygyObeOOy....",
              "....yOabOOygy...",
              ".....OabOcOy....",
              ".....OabOcO.....",
              "....OaabOcOO....",
              "....OaabOkckO...",
              "...OkakbOccO....",
              "...OapabOccO....",
              "...OaaabOcccO...",
              "..ObbbbbbbbbO...",
              "...ObbbbbbbO....",
              "...OdOOdOOdO....",
              "....O..O..O....."
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#7a7055",
              "g": "#f2c14e",
              "b": "#7a4a22",
              "e": "#d95b43",
              "a": "#d8ecf4",
              "c": "#f0a860",
              "k": "#151d2d",
              "p": "#e87fa8",
              "d": "#4b6fd6"
            }
          },
          "line": "順風來了，全速前進！"
        }
      },
      "favFood": "方位",
      "lines": {
        "idle": ["全員注意，風向正好！","出發出發，別落隊！","我的帆鼓得滿滿的。","今天也是好航向。"],
        "pet": ["哈哈，別拍我的帆啦！","摸得好，士氣上升！","再來，我不怕癢！"],
        "feed": ["好料！補給完畢！","吃飽才有力氣揚帆。","謝啦，下次請你。"],
        "awake": ["順風來了，全速前進！","號令一響，大家都跟上。","揚帆，目標就在前方。"]
      }
    },
    {
      "id": "sp_bookworm",
      "no": 5,
      "name": "書卷蠹魚",
      "nick": "蠹",
      "era": "明鄭",
      "eraId": "zheng",
      "genre": "cute",
      "anchor": "與府城教育和孔廟有關的書卷生物，待文史把關",
      "attr": "智識",
      "rarity": "稀有",
      "eggChapter": "c1,y1",
      "starter": true,
      "assist": {"name":"查證","desc":"顯示這題的出處與可信度","cd":0,"perChapter":2,"key":"showSource","value":1},
      "talent": {"name":"出處標記","desc":"選擇題顯示「有出處」標記","key":"showSourceBadge","value":1},
      "scout": {"kind":["史料"],"era":"明鄭"},
      "awaken": {
        "name": "蛀書",
        "desc": "把已有線索自動串成時間線",
        "key": "autoTimeline",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_bookworm,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "....o.......o...",
              "...oeo.....oeo..",
              "...obo.....obo..",
              "...obooooooobo..",
              "....oaababaao...",
              "...oaaaaaaaaao..",
              "...oawkaawkaao..",
              "...oakkaakkaao..",
              "...oaaaaaaaaao..",
              "...oaaaapaaaaao.",
              "..oooaaaaaaaaaao",
              ".odccccccccdaabo",
              ".oddddddddddoao.",
              "..oooooooooo.o..",
              "................"
            ],
            "pal": {
              "o": "#284a2c",
              "e": "#d95b43",
              "b": "#6f9468",
              "a": "#a8c8a0",
              "w": "#ffffff",
              "k": "#142516",
              "p": "#e87fa8",
              "d": "#7a4a22",
              "c": "#f6efd8"
            }
          },
          "line": "我是蠹，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "..o...o.........",
              ".oeo.oeo........",
              ".obooobo........",
              "..obabooo.......",
              ".oaaaaabaoooo...",
              ".oakakaaababaoo.",
              ".oaapaaaaaaaaabo",
              ".oooboabaabaaaao",
              "ocbbcbccdcbcbbbo",
              "occbcbccdccbcbco",
              "oddddddddddddddo",
              ".oooooooooooooo.",
              "................"
            ],
            "pal": {
              "o": "#284a2c",
              "e": "#d95b43",
              "b": "#6f9468",
              "a": "#a8c8a0",
              "k": "#142516",
              "p": "#e87fa8",
              "c": "#f6efd8",
              "d": "#7a4a22"
            }
          },
          "line": "這句話，出處在哪裡？"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "..O...O....y..y.",
              ".OeO.OeO..ygyygy",
              ".ObOOObO...y.yy.",
              "..ObabOOO...ygy.",
              ".OaaaaabaOOOOy..",
              ".OakakaaababaOO.",
              ".OaapaaaaaaaaabO",
              ".OOObOabaabaaaaO",
              "OcbbcbccdcbcbbbO",
              "OccbcbccdccbcbcO",
              "OddddddddddddddO",
              ".OOOOOOOOOOOOOO.",
              "................"
            ],
            "pal": {
              "O": "#797a3a",
              "y": "#fff3b0",
              "e": "#d95b43",
              "g": "#f2c14e",
              "b": "#6f9468",
              "a": "#a8c8a0",
              "k": "#142516",
              "p": "#e87fa8",
              "c": "#f6efd8",
              "d": "#7a4a22"
            }
          },
          "line": "我把線索串成一條線了。"
        }
      },
      "favFood": "史料",
      "lines": {
        "idle": ["這句話，出處在哪裡？","我正在啃一頁小字。","慢著，先查證再說。","書頁的味道最香了。"],
        "pet": ["小心，別弄皺書角。","嗯…摸頭也算閱讀嗎？","癢，像字跳來跳去。"],
        "feed": ["紙香點心，我最愛了。","這口，我要做筆記。","謝謝，下次我幫你找資料。"],
        "awake": ["我把線索串成一條線了。","蛀書成冊，時間有序。","來，看看完整的時間線。"]
      }
    },
    {
      "id": "sp_abacus",
      "no": 6,
      "name": "算盤獸",
      "nick": "珠珠",
      "era": "清領",
      "eraId": "qing",
      "genre": "relic",
      "anchor": "與三郊商貿和行郊有關的算盤生物，待文史把關",
      "attr": "智識",
      "rarity": "普通",
      "eggChapter": "c3,ws",
      "assist": {"name":"結算","desc":"顯示可用點數與最划算的採購","cd":0,"key":"showBudget","value":1},
      "talent": {"name":"九五折","desc":"簡報室採購打 95 折（與補給官不疊加，取較大者）","key":"shopDiscount","value":0.05,"stack":"max"},
      "scout": {"kind":["路況"],"extra":"點數情報","era":"清領"},
      "awaken": {
        "name": "精打細算",
        "desc": "每章回饋 10 點",
        "key": "chapterRebate",
        "value": 10,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_abacus,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "........o.......",
              ".......odo......",
              ".......obo......",
              ".....o.obooo....",
              "....oboobobbo...",
              "...obbbbbbbbo...",
              "...obeeeeeebo...",
              "...obwkeewkbo...",
              "..odbkkeekkbco..",
              "...obepeeepbo...",
              "...obaaaaaabo...",
              "...obbbbbbbbo...",
              "....obboobbo....",
              "....obboobbo....",
              ".....oo..oo.....",
              "................"
            ],
            "pal": {
              "o": "#4a2a08",
              "d": "#c4553b",
              "b": "#7a4a14",
              "e": "#fff3d6",
              "w": "#ffffff",
              "k": "#251504",
              "c": "#4b6fd6",
              "p": "#e87fa8",
              "a": "#e8d8a8"
            }
          },
          "line": "我是珠珠，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "........o.......",
              ".....o.odo.o....",
              "....obooboobo...",
              "...oobbobobbo...",
              "..obbbbbbbbbbo..",
              "..obeeeeeeeebo..",
              "..obeckceckcbo..",
              "..obecckkcccbo..",
              "..obaaaaaaaabo..",
              ".obbccddccddbbo.",
              "oaobccddccddboao",
              "oaobbbbbbbbbboao",
              ".o.oobboobboodo.",
              "....obboobbo.oco",
              "...oaaaooaaaoodo",
              "....ooo..ooo..o."
            ],
            "pal": {"o":"#4a2a08","d":"#c4553b","b":"#7a4a14","e":"#fff3d6","c":"#4b6fd6","k":"#251504","a":"#e8d8a8"}
          },
          "line": "噼啪，今天花了多少？"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".y......O.....y.",
              "ygy..O.OdO.O.ygy",
              ".y..ObOObOObO.y.",
              "...OObbObObbO...",
              "..ObbbbbbbbbbO..",
              "..ObeeeeeeeebO..",
              "..ObeckceckcbO..",
              "..ObecckkcccbO..",
              "..ObaaaaaaaabO..",
              ".ObbccddccddbbO.",
              "OaObccddccddbOaO",
              "OaObbbbbbbbbbOaO",
              ".O.OObbOObbOOdO.",
              ".y..ObbOObbO.OcO",
              "ygyOaaaOOaaaOOdO",
              ".y..OOO..OOO..O."
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#8d6624",
              "g": "#f2c14e",
              "d": "#c4553b",
              "b": "#7a4a14",
              "e": "#fff3d6",
              "c": "#4b6fd6",
              "k": "#251504",
              "a": "#e8d8a8"
            }
          },
          "line": "精打細算，一分不浪費。"
        }
      },
      "favFood": "路況",
      "lines": {
        "idle": ["噼啪，今天花了多少？","我在算哪裡最划算。","錢要花在刀口上。","算盤珠子今天很順。"],
        "pet": ["噼啪噼啪，好舒服！","別摸太久，要收費喔。","珠子轉起來啦。"],
        "feed": ["這點心，值這個價。","吃了有力氣算帳。","謝謝，我給你打個折。"],
        "awake": ["精打細算，一分不浪費。","每章回饋，算我的。","總帳算出來了，賺到。"]
      }
    },
    {
      "id": "sp_lion",
      "no": 7,
      "name": "城門石獅靈",
      "nick": "獅",
      "era": "清領",
      "eraId": "qing",
      "genre": "relic",
      "anchor": "與府城城門和防禦有關的石獅守護獸，待文史把關",
      "attr": "守護",
      "rarity": "稀有",
      "eggChapter": "t4,s3",
      "assist": {"name":"警戒","desc":"標出隊友位置與離隊距離","cd":5,"key":"showMates","value":1},
      "talent": {"name":"穩住","desc":"提示扣分 −1","key":"hintPenaltyDelta","value":-1},
      "scout": {"kind":["路況"],"note":"安全","era":"清領"},
      "awaken": {
        "name": "鎮守",
        "desc": "走散警示放寬並提醒集合點",
        "key": "straySafetyRelax",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_lion,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              ".....oo..oo.....",
              "....obboobbo....",
              "....obboobbo....",
              ".....obbbbbo....",
              "....obbbbbbbo...",
              "...obbbaaabbbo..",
              "..obbwkaawkbbbo.",
              "..obbkkaakkabbo.",
              "..obbaaaaaaabbo.",
              "...obaaakaaabo..",
              "....obakakabo...",
              "....oobaaabo....",
              "...oeeeeeeeeo...",
              "...oeeeeeeeeo...",
              "....oooooooo...."
            ],
            "pal": {"o":"#40281a","b":"#8a7660","a":"#c8b8a0","w":"#ffffff","k":"#20140d","e":"#8d6a3a"}
          },
          "line": "我是獅，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".....oo..oo.....",
              "....obboobbo....",
              "...oobbbbbbooo..",
              "..obbooobooobbo.",
              ".obbbbbbbbbbbbbo",
              "..obbbbbbbbbbbo.",
              "..obbbaaaaabbbo.",
              ".obbbkkaaakkbbbo",
              ".obbaddaaaddabbo",
              ".obbaaaaaaaaabbo",
              "..obaaakkaaaabo.",
              "..obbaawawaabbo.",
              "..ooobkkkkkboo..",
              ".oeecccebccceeo.",
              ".oeeeeeeeeeeeeo.",
              "..oooooooooooo.."
            ],
            "pal": {
              "o": "#40281a",
              "b": "#8a7660",
              "a": "#c8b8a0",
              "k": "#20140d",
              "d": "#5aa8a0",
              "w": "#ffffff",
              "e": "#8d6a3a",
              "c": "#e0d4c0"
            }
          },
          "line": "我守著，你放心走。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "..y..OO..OO...y.",
              ".ygyObbOObbO.ygy",
              "..yOObbbbbbOOOy.",
              "..ObbOOObOOObbO.",
              ".ObbbbbbbbbbbbbO",
              "..ObbbbbbbbbbbO.",
              "..ObbbaaaaabbbO.",
              ".ObbbkkaaakkbbbO",
              ".ObbaddaaaddabbO",
              ".ObbaaaaaaaaabbO",
              "..ObaaakkaaaabO.",
              "..ObbaawawaabbO.",
              "..OOObkkkkkbOO..",
              ".OeecccebccceeO.",
              ".OeeeeeeeeeeeeO.",
              "..OOOOOOOOOOOO.."
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#87652f",
              "g": "#f2c14e",
              "b": "#8a7660",
              "a": "#c8b8a0",
              "k": "#20140d",
              "d": "#5aa8a0",
              "w": "#ffffff",
              "e": "#8d6a3a",
              "c": "#e0d4c0"
            }
          },
          "line": "鎮守此處，大家別走散。"
        }
      },
      "favFood": "路況",
      "lines": {
        "idle": ["我守著，你放心走。","人到齊了嗎？數一數。","注意腳下，別趕。","我不會離開你的視線。"],
        "pet": ["…哼，才不是在撒嬌。","摸一下就好，我在站崗。","鬃毛別亂揉，嗚。"],
        "feed": ["嗯，勉強說好吃。","吃飽了，才有力氣守護。","謝謝…別告訴別人。"],
        "awake": ["鎮守此處，大家別走散。","我的吼聲，會替你們壯膽。","集合點在這，我等你們。"]
      }
    },
    {
      "id": "sp_brick",
      "no": 8,
      "name": "紅磚貓",
      "nick": "磚",
      "era": "日治",
      "eraId": "japan",
      "genre": "cute",
      "anchor": "與磚造公共建築有關的貓形生物，待文史把關",
      "attr": "觀察",
      "rarity": "普通",
      "eggChapter": "t1,s1",
      "assist": {"name":"細看","desc":"給本站「形狀、材質、新舊」三個觀察提示","cd":0,"perChapter":3,"key":"observeHints","value":3},
      "talent": {"name":"利眼","desc":"觀察題字數門檻 −1","key":"observeMinChars","value":-1},
      "scout": {"kind":["觀察"],"era":"日治"},
      "awaken": {
        "name": "磚縫",
        "desc": "每章多一個觀察細節（不是答案）",
        "key": "extraObserveDetail",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_brick,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "....oo.....oo...",
              "...oaao...oaao..",
              "...ocaaoooacao..",
              "...oaaabaabaao..",
              "....obbbbbbao...",
              "...oaaaaaaaaao..",
              "...oaekaakeaao..",
              "...oaekaakeaao..",
              "..odaaaapaaaado.",
              "...ooaaaaaaaoao.",
              ".....oaaaaaoao..",
              "....oaaaaaaao...",
              ".....oaaaaao....",
              "......ooooo....."
            ],
            "pal": {
              "o": "#4a1a10",
              "a": "#c4553b",
              "c": "#f0b090",
              "b": "#8f3a28",
              "e": "#f2c14e",
              "k": "#250d08",
              "d": "#e8d0b0",
              "p": "#e87fa8"
            }
          },
          "line": "我是磚，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".....o.....o....",
              "....oao...oao...",
              "....ocaooocao...",
              "....oaaaaaaao...",
              "....oaaaaaaao...",
              "...oaekaakeaao..",
              "...oaekaakeaao..",
              "..odoaaapaaadoo.",
              "...ooaaaaaaaooao",
              "...oaabaaabaaao.",
              "...oabbbbbbbaaao",
              "...oaaaabaaaaaao",
              "...oabbbbbbbaaao",
              "....oaaaaaaaoao.",
              "....oaaaaaao.o..",
              ".....oooooo....."
            ],
            "pal": {
              "o": "#4a1a10",
              "a": "#c4553b",
              "c": "#f0b090",
              "e": "#f2c14e",
              "k": "#250d08",
              "d": "#e8d0b0",
              "p": "#e87fa8",
              "b": "#8f3a28"
            }
          },
          "line": "喵，這面牆有點意思。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".....O.....O..y.",
              "....OaO...OaOygy",
              "....OcaOOOcaO.y.",
              "....OaaaaaaaO.y.",
              "....OaaaaaaaOygy",
              "...OaekaakeaaOy.",
              "...OaekaakeaaO..",
              "..OdOaaapaaadOO.",
              "...OOaaaaaaaOOaO",
              "...OaabaaabaaaO.",
              "...OabbbbbbbaaaO",
              "...OaaaabaaaaaaO",
              "...OabbbbbbbaaaO",
              "....OaaaaaaaOaO.",
              "....OaaaaaaO.O..",
              ".....OOOOOO....."
            ],
            "pal": {
              "O": "#8d5d29",
              "y": "#fff3b0",
              "a": "#c4553b",
              "g": "#f2c14e",
              "c": "#f0b090",
              "e": "#f2c14e",
              "k": "#250d08",
              "d": "#e8d0b0",
              "p": "#e87fa8",
              "b": "#8f3a28"
            }
          },
          "line": "磚縫裡，又多一個細節。"
        }
      },
      "favFood": "觀察",
      "lines": {
        "idle": ["喵，這面牆有點意思。","我在曬太陽，順便觀察。","形狀、材質、新舊…喵。","磚縫裡藏著小驚喜。"],
        "pet": ["呼嚕呼嚕…","再摸摸下巴，喵。","我的磚紋在發熱。"],
        "feed": ["喵！這個我愛。","嗯，吃完再觀察。","謝謝，賞你看一個細節。"],
        "awake": ["磚縫裡，又多一個細節。","喵，我看得更仔細了。","來，我指給你看。"]
      }
    },
    {
      "id": "sp_watch",
      "no": 9,
      "name": "懷錶蟲",
      "nick": "滴答",
      "era": "日治",
      "eraId": "japan",
      "genre": "relic",
      "anchor": "與近代時間制度和時鐘有關的懷錶昆蟲，待文史把關",
      "attr": "智識",
      "rarity": "普通",
      "eggChapter": "t2",
      "assist": {"name":"倒數","desc":"顯示計時賽剩餘與建議節奏","cd":0,"key":"timerPace","value":1},
      "talent": {"name":"快一拍","desc":"提示等待時間縮短","key":"hintWaitCut","value":0.2},
      "scout": {"kind":["路況"],"era":"日治"},
      "awaken": {
        "name": "回撥",
        "desc": "計時賽中取消一次扣分（每趟 1 次）",
        "key": "cancelTimedPenalty",
        "value": 1,
        "perTrip": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_watch,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              ".......oo.......",
              "...o..obbo..o...",
              "..odo.obbooodo..",
              "...odoaaaaaodo..",
              "....oaackcaao...",
              "...oaccckcccao..",
              "...oaccckcccao..",
              "..oacccceccccao.",
              "..oaccccckkccao.",
              "...oapcccccpao..",
              "...oacccccccao..",
              "....oaacccaao...",
              ".....odaaado....",
              "....odooooodo...",
              ".....o.....o...."
            ],
            "pal": {
              "o": "#3a2a08",
              "b": "#8a6a1c",
              "d": "#7a8fa0",
              "a": "#c8a040",
              "c": "#fff6dc",
              "k": "#1d1504",
              "e": "#d95b43",
              "p": "#e87fa8"
            }
          },
          "line": "我是滴答，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "...o...oo...o...",
              "..oeo.obbo.oeo..",
              "...odoobboodo...",
              "....odaaaado....",
              "....oaakcaao....",
              "...oacckcccao...",
              "..oaccckccccao..",
              "..oaccckccccao..",
              "..oakccekcckao..",
              "..oaccccckkcao..",
              "..oaccecccccao..",
              "...oacccpccao...",
              "....oaakcaao....",
              "...odoaaaaodo...",
              "..odoodoodoodo..",
              "...o..o..o..o..."
            ],
            "pal": {
              "o": "#3a2a08",
              "e": "#d95b43",
              "b": "#8a6a1c",
              "d": "#7a8fa0",
              "a": "#c8a040",
              "k": "#1d1504",
              "c": "#fff6dc",
              "p": "#e87fa8"
            }
          },
          "line": "滴答，時間不等人。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "...O...OO...O...",
              "..OeOgObbOgOeO..",
              "...OdOObbOOdO...",
              "....OdaaaadO....",
              "....OaakcaaO....",
              "...OacckcccaO...",
              "..OaccckccccaO..",
              "..OaccckccccaO..",
              "..OakccekcckaO..",
              "..OaccccckkcaO..",
              "..OaccecccccaO..",
              "...OacccpccaO...",
              "....OaakcaaO....",
              "...OdOaaaaOdO...",
              "..OdOOdOOdOOdO..",
              "...O..O..O..O..."
            ],
            "pal": {
              "O": "#846624",
              "e": "#d95b43",
              "g": "#f2c14e",
              "b": "#8a6a1c",
              "d": "#7a8fa0",
              "a": "#c8a040",
              "k": "#1d1504",
              "c": "#fff6dc",
              "p": "#e87fa8"
            }
          },
          "line": "回撥一下，重來一次。"
        }
      },
      "favFood": "路況",
      "lines": {
        "idle": ["滴答，時間不等人。","快點快點，別遲到！","倒數三、二、一…","我的指針今天很準。"],
        "pet": ["別摸到發條，嚇我一跳。","滴答滴答，開心的節奏。","再摸一下，慢兩秒。"],
        "feed": ["滴答，剛好整點開飯。","好吃，我多走一格。","謝謝，節奏更穩了。"],
        "awake": ["回撥一下，重來一次。","時間，聽我的。","這一步，我替你撥回。"]
      }
    },
    {
      "id": "sp_telegraph",
      "no": 10,
      "name": "電報鳥",
      "nick": "嘀",
      "era": "日治",
      "eraId": "japan",
      "genre": "scifi",
      "anchor": "與電信和郵政有關的電報鳥，待文史把關",
      "attr": "溝通",
      "rarity": "稀有",
      "eggChapter": "t3,s2",
      "assist": {"name":"傳話","desc":"把一句話貼到隊內與全場","cd":3,"key":"broadcastMsg","value":1},
      "talent": {"name":"快回","desc":"求援回應變快","key":"helpReplyCut","value":0.2},
      "scout": {"kind":["人物"],"era":"日治"},
      "awaken": {
        "name": "電文",
        "desc": "自動把本章成果報給全場",
        "key": "autoReportChapter",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_telegraph,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "........o.......",
              ".......oeo......",
              "......oeoeo.....",
              ".....ooaaaoo....",
              "....oaaaaaaao...",
              "...oaaaawkwkao..",
              "...oabaakkkkao..",
              "...obbbaaaaacco.",
              "...obbbaaaaaco..",
              "...obbbaaaaao...",
              ".oooobaaaaaoooo.",
              "obbbbbcbbbcbbbbo",
              ".oooooooooooooo.",
              "................"
            ],
            "pal": {"o":"#12305a","e":"#d95b43","a":"#5aa0e0","w":"#ffffff","k":"#09182d","b":"#2f6aa8","c":"#f2c14e"}
          },
          "line": "我是嘀，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "..........o.....",
              ".........oeo....",
              ".........oeeo...",
              "......ooooaaao..",
              "....ooaaaaakaco.",
              "...oaaaaaaaaacco",
              "ooooabbbaaaaaoo.",
              "bbbabbbbbaaao...",
              "bbbbabbbdddo....",
              "bbbbaadddddooooo",
              "bbbbbbaaabbbbbbb",
              "ooodoocdocodoooo",
              "...odooodo.odo..",
              "....o...o...o...",
              "................"
            ],
            "pal": {"o":"#12305a","e":"#d95b43","a":"#5aa0e0","k":"#09182d","c":"#f2c14e","b":"#2f6aa8","d":"#e8f0f8"}
          },
          "line": "嘀嘀嗒，有消息要傳！"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              ".y..y.....O...y.",
              "ygyygy...OeO.ygy",
              ".y..y....OeeO.y.",
              "......OOOOaaaO..",
              "....OOaaaaakacO.",
              "...OaaaaaaaaaccO",
              "OOOOabbbaaaaaOO.",
              "bbbabbbbbaaaO...",
              "bbbbabbbdddO....",
              "bbbbaadddddOOOOO",
              "bbbbbbaaabbbbbbb",
              "OOOdOOcdOcOdOOOO",
              "...OdOOOdO.OdO..",
              "....O...O...O...",
              "................"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#6c6a55",
              "g": "#f2c14e",
              "e": "#d95b43",
              "a": "#5aa0e0",
              "k": "#09182d",
              "c": "#f2c14e",
              "b": "#2f6aa8",
              "d": "#e8f0f8"
            }
          },
          "line": "電文發出，大家都收到。"
        }
      },
      "favFood": "人物",
      "lines": {
        "idle": ["嘀嘀嗒，有消息要傳！","你要我傳什麼話？","線路暢通，隨時待命。","嘀，我聽見遠方的聲音。"],
        "pet": ["嘀嘀，好癢！","摸到羽毛啦，嗒。","再摸，我會一直嘀。"],
        "feed": ["嘀，收到點心一份。","好吃，訊號變強了。","嗒嗒，謝謝你。"],
        "awake": ["電文發出，大家都收到。","全頻道，一起播報！","嘀——成果傳出去了。"]
      }
    },
    {
      "id": "sp_radio",
      "no": 11,
      "name": "老收音機妖",
      "nick": "沙沙",
      "era": "戰後",
      "eraId": "postwar",
      "genre": "relic",
      "anchor": "與廣播和街頭聲音有關的老收音機精怪，待文史把關",
      "attr": "溝通",
      "rarity": "稀有",
      "eggChapter": "t8",
      "assist": {"name":"說書","desc":"用說書人口吻講這一站","cd":0,"perChapter":1,"key":"storyteller","value":1},
      "talent": {"name":"氛圍","desc":"NPC 回話多一句氛圍","key":"npcExtraLine","value":1},
      "scout": {"kind":["人物","彩蛋"],"era":"戰後"},
      "awaken": {
        "name": "轉台",
        "desc": "切換 NPC 對話的口吻（正經或戲劇）",
        "key": "npcToneSwitch",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_radio,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "....o.......o...",
              "...oeo.....oeo..",
              "...oco.....oco..",
              "....oco...oco...",
              "...oocoooooco...",
              "..oaaaaaaaaaao..",
              "..oabbbeebbbao..",
              "..oabwwwbwwwao..",
              "..oabwkwbwkwao..",
              "..oabwkwbwkwao..",
              "..oabbbbbbbbao..",
              "..oaaaccccaaao..",
              "...obboooobbo...",
              "...obbo..obbo...",
              "....oo....oo....",
              "................"
            ],
            "pal": {"o":"#2a1608","e":"#f2c14e","c":"#c9ccd2","a":"#8b5a2b","b":"#5a3a1e","w":"#ffffff","k":"#150b04"}
          },
          "line": "我是沙沙，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "..oo.........oo.",
              ".oeeo.......oeeo",
              "..ooco.....ocoo.",
              "....ocooooooco..",
              "...oaaaaaaaaaoo.",
              "...oabeeeeebaodo",
              "...oabwwbbwwaood",
              "...oawwwwwwwwodo",
              "...ocwkwwwkwcoo.",
              "..ocabwwbbwwaco.",
              ".ocoaacacacaaoco",
              "oeeoaaaaaaaaaoee",
              ".oo.obbooobbo.oo",
              "....obbo.obbo...",
              "...oaaaooaaao...",
              "....ooo..ooo...."
            ],
            "pal": {
              "o": "#2a1608",
              "e": "#f2c14e",
              "c": "#c9ccd2",
              "a": "#8b5a2b",
              "b": "#5a3a1e",
              "d": "#8fd3f4",
              "w": "#ffffff",
              "k": "#150b04"
            }
          },
          "line": "沙沙…各位聽眾晚安。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "..OO.........OO.",
              ".OeeO.......OeeO",
              ".yOOcO.....OcOO.",
              "ygy.OcOOOOOOcO..",
              ".y.OaaaaaaaaaOO.",
              "...OabeeeeebaOdO",
              "...OabwwbbwwaOOd",
              "...OawwwwwwwwOdO",
              "...OcwkwwwkwcOO.",
              "..OcabwwbbwwacO.",
              ".OcOaacacacaaOcO",
              "OeeOaaaaaaaaaOee",
              ".OO.ObbOOObbO.OO",
              ".y..ObbO.ObbO.y.",
              "ygyOaaaOOaaaOygy",
              ".y..OOO..OOO..y."
            ],
            "pal": {
              "O": "#7a5a24",
              "e": "#f2c14e",
              "y": "#fff3b0",
              "c": "#c9ccd2",
              "g": "#f2c14e",
              "a": "#8b5a2b",
              "b": "#5a3a1e",
              "d": "#8fd3f4",
              "w": "#ffffff",
              "k": "#150b04"
            }
          },
          "line": "轉台！換個說法講給你聽。"
        }
      },
      "favFood": "人物",
      "lines": {
        "idle": ["沙沙…各位聽眾晚安。","轉到哪一台好呢？","來，聽我說個故事。","雜訊也是一種聲音。"],
        "pet": ["沙沙…好舒服的震動。","別轉到旋鈕呀，癢！","再摸，我會唱歌喔。"],
        "feed": ["沙…這個味道清晰。","吃飽了，講更久的故事。","謝謝，音量調大了。"],
        "awake": ["轉台！換個說法講給你聽。","沙沙，正經還是戲劇？","這一台，只為你播。"]
      }
    },
    {
      "id": "sp_neon",
      "no": 12,
      "name": "霓虹蛾",
      "nick": "霓",
      "era": "戰後",
      "eraId": "postwar",
      "genre": "fantasy",
      "anchor": "與夜間商街有關的霓虹蛾，待文史把關",
      "attr": "行動",
      "rarity": "普通",
      "eggChapter": "t5,s4",
      "assist": {"name":"夜行","desc":"夜間顯示最亮的路線","cd":5,"key":"nightRoute","value":1},
      "talent": {"name":"夜眼","desc":"夜間定位判定 +3 公尺","key":"nightArriveRange","value":3},
      "scout": {"kind":["路況","彩蛋"],"era":"戰後"},
      "awaken": {
        "name": "趨光",
        "desc": "夜間隱藏關卡顯示範圍加倍",
        "key": "nightRevealScale",
        "value": 2,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_neon,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              ".....o.....o....",
              "....oeo...oeo...",
              "...oooeo.oeooo..",
              "..oaaoooooooaao.",
              ".oaaaadddddaaaao",
              ".oacadddddddcaao",
              "oaaacwkddwkdaaaa",
              ".oaaakkddkkdaaao",
              ".oaaadddddddaaao",
              "..oaadddpdddaao.",
              "...ooodddddooo..",
              "....oboddobo....",
              ".....o.oo.o.....",
              "................"
            ],
            "pal": {
              "o": "#3a0f52",
              "e": "#fff27a",
              "a": "#e048c8",
              "d": "#ffe6fa",
              "c": "#58e8f0",
              "w": "#ffffff",
              "k": "#1d0829",
              "p": "#e87fa8",
              "b": "#7a2a9c"
            }
          },
          "line": "我是霓，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".....o.....o....",
              ".o..oeo...oeo.o.",
              "oao..oeoooeoooao",
              "oaaoooeddoeoaaao",
              "oaaccodkkdoccaao",
              "oaceccddddccecao",
              "oaccccaddaccccao",
              "oaaccaaddaaccaao",
              ".oaaaaabdaaaaao.",
              "..oaaaaddaaaao..",
              "...oooodboooo...",
              ".....obddo......",
              "....obbobbo.....",
              "...obbboobbo....",
              "....ooo..oo.....",
              "................"
            ],
            "pal": {"o":"#3a0f52","e":"#fff27a","a":"#e048c8","d":"#ffe6fa","c":"#58e8f0","k":"#1d0829","b":"#7a2a9c"}
          },
          "line": "夜晚才是我的舞台。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".....O.....O....",
              ".O..OeO...OeO.O.",
              "OaO..OeOOOeOOOaO",
              "OaaOOOeddOeOaaaO",
              "OaaccOdkkdOccaaO",
              "OaceccddddccecaO",
              "OaccccaddaccccaO",
              "OaaccaaddaaccaaO",
              ".OaaaaabdaaaaaO.",
              ".yOaaaaddaaaaO..",
              "ygyOOOOdbOOOO...",
              ".y...ObddO......",
              ".y..ObbObbO...y.",
              "ygyObbbOObbO.ygy",
              ".y..OOO..OO...y.",
              "................"
            ],
            "pal": {
              "O": "#845650",
              "e": "#fff27a",
              "a": "#e048c8",
              "d": "#ffe6fa",
              "c": "#58e8f0",
              "k": "#1d0829",
              "b": "#7a2a9c",
              "y": "#fff3b0",
              "g": "#f2c14e"
            }
          },
          "line": "趨光而行，夜更亮了。"
        }
      },
      "favFood": "路況",
      "lines": {
        "idle": ["夜晚才是我的舞台。","哪裡有光，我就飛過去。","今晚的路，我來照亮。","翅膀閃閃，心情也閃閃。"],
        "pet": ["啊，粉粉掉下來了。","輕輕的，我會發光。","再摸，我臉紅了。"],
        "feed": ["甜甜的，像霓虹糖。","謝謝，翅膀更亮了。","吃飽了，就去夜遊。"],
        "awake": ["趨光而行，夜更亮了。","今晚，整條路都是我的。","看，隱藏的光都現身了。"]
      }
    },
    {
      "id": "sp_ink",
      "no": 13,
      "name": "墨靈",
      "nick": "墨",
      "era": "戰後與文學",
      "eraId": "postwar",
      "genre": "fantasy",
      "anchor": "與在地文學和民間文學有關的墨汁精靈，待文史把關",
      "attr": "溝通",
      "rarity": "稀有",
      "eggChapter": "c2,y2",
      "assist": {"name":"起筆","desc":"給書寫題三種開頭句型","cd":0,"perQuestion":1,"key":"writeStarters","value":3},
      "talent": {"name":"語氣","desc":"書寫題多一句語氣建議","key":"writeToneHint","value":1},
      "scout": {"kind":["彩蛋"],"era":"戰後與文學"},
      "awaken": {
        "name": "落款",
        "desc": "最後一句話完成時額外 +10 分",
        "key": "finalLineBonus",
        "value": 10,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_ink,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "......oooo......",
              ".....ocwwwo.....",
              ".....occaao.....",
              "....oakkkkao....",
              "...ooakkkkaoo...",
              "..oaaoaaaaeaao..",
              "..ocooaaaaebbo..",
              "...o.oaaaaaoo...",
              "......ooooo....."
            ],
            "pal": {"o":"#0c1230","c":"#8fa0e8","w":"#ffffff","a":"#33406e","k":"#060918","e":"#d95b43","b":"#1e2748"}
          },
          "line": "我是墨，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".......o........",
              "......oco.......",
              ".......oo.......",
              "......obbo......",
              ".....oaaaao.....",
              "....occaaaao....",
              "....occaaaao....",
              "...oawwwawwao...",
              "...oawkwakwao...",
              "..oaoaaaaaaoao..",
              ".oaooaacaaaeeao.",
              "ocao.oaaaaoeebco",
              ".oo..oaoaaooboo.",
              ".....oaooaaao...",
              "......o..ooo....",
              "................"
            ],
            "pal": {"o":"#0c1230","c":"#8fa0e8","b":"#1e2748","a":"#33406e","w":"#ffffff","k":"#060918","e":"#d95b43"}
          },
          "line": "我在想一句開頭。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".y..y..O......y.",
              "ygyygyOcO....ygy",
              ".y..y..OO.....y.",
              "......ObbO......",
              ".....OaaaaO.....",
              "....OccaaaaO....",
              "....OccaaaaO....",
              "...OawwwawwaO...",
              "...OawkwakwaO...",
              "..OaOaaaaaaOaO..",
              ".OaOOaacaaaeeaO.",
              "OcaO.OaaaaOeebcO",
              ".OO..OaOaaOObOO.",
              ".....OaOOaaaO...",
              "......O..OOO....",
              "................"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#68583c",
              "g": "#f2c14e",
              "c": "#8fa0e8",
              "b": "#1e2748",
              "a": "#33406e",
              "w": "#ffffff",
              "k": "#060918",
              "e": "#d95b43"
            }
          },
          "line": "落款，這一句收好了。"
        }
      },
      "favFood": "彩蛋",
      "lines": {
        "idle": ["我在想一句開頭。","留白，也是一種寫法。","墨乾了，再潤一潤。","今天的句子，有點長。"],
        "pet": ["小心，會暈開來的。","摸頭…像被筆尖輕點。","再摸一下，句子就來了。"],
        "feed": ["滋潤，字更有精神。","這口，我想寫成詩。","謝謝，落筆更穩了。"],
        "awake": ["落款，這一句收好了。","最後一行，我陪你寫。","筆鋒一轉，完成。"]
      }
    },
    {
      "id": "sp_bee",
      "no": 14,
      "name": "修復匠蜂",
      "nick": "蜜",
      "era": "當代文資",
      "eraId": "heritage",
      "genre": "cute",
      "anchor": "與古蹟修復有關的工匠蜜蜂，待文史把關",
      "attr": "守護",
      "rarity": "普通",
      "eggChapter": "t9",
      "assist": {"name":"補漏","desc":"列出本章還沒完成的任務","cd":0,"key":"listTodo","value":1},
      "talent": {"name":"減半","desc":"提示扣分只扣一半（每章 1 次）","key":"hintPenaltyHalf","value":0.5,"perChapter":1},
      "scout": {"kind":["觀察"],"era":"當代文資"},
      "awaken": {
        "name": "修復",
        "desc": "重做一個任務不扣分（每趟 1 次）",
        "key": "redoFree",
        "value": 1,
        "perTrip": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_bee,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "................",
              "......ooo.......",
              "....oowwwoo.....",
              "...oceeeeeco....",
              "..occeeeeecco...",
              "..occkkakkcco...",
              "..occkkakkcco...",
              "..occaaaaacdo...",
              "...oaabbbaado...",
              "....obbbbaodo...",
              ".....oaaao.o....",
              "......ooo......."
            ],
            "pal": {
              "o": "#3b2f10",
              "w": "#ffffff",
              "c": "#cfeaf5",
              "e": "#f08a24",
              "k": "#1e1808",
              "a": "#ffd23a",
              "d": "#9aa3ad",
              "b": "#3b2f2f"
            }
          },
          "line": "我是蜜，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "........o.......",
              ".....ooowooo....",
              "...ooeeeeeeeoo..",
              "..occeeeeeeecco.",
              ".occeeeeeeeeccco",
              ".occcaaaaaaaccco",
              ".occcakaaakaccco",
              ".occcaaapaaaccco",
              ".occcaaaaaaacddo",
              "..ocabbbbbbaacdo",
              "...oaaaaaaaaaodo",
              "....obbbbbbaoodo",
              "....oaaaaaaaoodo",
              ".....ooabaoo..o.",
              ".......ooo......"
            ],
            "pal": {
              "o": "#3b2f10",
              "w": "#ffffff",
              "e": "#f08a24",
              "c": "#cfeaf5",
              "a": "#ffd23a",
              "k": "#1e1808",
              "p": "#e87fa8",
              "d": "#9aa3ad",
              "b": "#3b2f2f"
            }
          },
          "line": "這裡有裂縫，補一補。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "..y.....O.....y.",
              ".ygy.OOOwOOO.ygy",
              "..yOOeeeeeeeOOy.",
              "..OcceeeeeeeccO.",
              ".OcceeeeeeeecccO",
              ".OcccaaaaaaacccO",
              ".OcccakaaakacccO",
              ".OcccaaapaaacccO",
              ".OcccaaaaaaacddO",
              "..OcabbbbbbaacdO",
              "...OaaaaaaaaaOdO",
              "....ObbbbbbaOOdO",
              "..y.OaaaaaaaOOdO",
              ".ygy.OOabaOO..O.",
              "..y....OOO......"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#846929",
              "g": "#f2c14e",
              "w": "#ffffff",
              "e": "#f08a24",
              "c": "#cfeaf5",
              "a": "#ffd23a",
              "k": "#1e1808",
              "p": "#e87fa8",
              "d": "#9aa3ad",
              "b": "#3b2f2f"
            }
          },
          "line": "修復完成，重來一次。"
        }
      },
      "favFood": "觀察",
      "lines": {
        "idle": ["這裡有裂縫，補一補。","嗡嗡，慢工出細活。","我的小抹刀呢？","先清灰，再修復。"],
        "pet": ["嗡，手別太用力。","摸摸安全帽也行。","嗡嗡嗡，好舒服。"],
        "feed": ["蜜糖點心，補充體力。","謝謝，繼續修復。","吃完這口，就上工。"],
        "awake": ["修復完成，重來一次。","這一步不算數，再試。","嗡——補得剛剛好。"]
      }
    },
    {
      "id": "sp_rubbing",
      "no": 15,
      "name": "數位拓印魚",
      "nick": "拓",
      "era": "當代文資",
      "eraId": "heritage",
      "genre": "scifi",
      "anchor": "與數位典藏和三維掃描有關的拓印魚，待文史把關",
      "attr": "觀察",
      "rarity": "稀有",
      "eggChapter": "x3",
      "assist": {"name":"構圖","desc":"拍照任務給取景建議","cd":0,"perQuestion":1,"key":"photoComposition","value":1},
      "talent": {"name":"好取景","desc":"拍照任務加分 +2","key":"photoBonus","value":2},
      "scout": {"kind":["觀察","方位"],"era":"當代文資"},
      "awaken": {
        "name": "拓印",
        "desc": "把本章照片整理成圖鑑相片卡",
        "key": "photoToDexCard",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_rubbing,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "........ooo.....",
              "......oowwwo....",
              "...oooaabbaao...",
              "..obbaaaaaakko..",
              "..obbbaaddakko..",
              "..oboaaaaaaaao..",
              "...o.oaaaaaao...",
              "......oooooo...."
            ],
            "pal": {"o":"#0f4a42","w":"#ffffff","a":"#46c7b0","b":"#2a8d7e","k":"#082521","d":"#ff6fb5"}
          },
          "line": "我是拓，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "........oo......",
              ".......obbo.....",
              "....ooobbbboo...",
              "oo.oaaaaaaaaao..",
              "bboaacaaacawwao.",
              "bbbaaaaacaawkao.",
              "bbbdddddddbdddo.",
              "bboaaacaaabaaao.",
              "oo.oaaaaaaaaao..",
              "....oooobbooo...",
              "........oo......",
              "................",
              "................"
            ],
            "pal": {"o":"#0f4a42","b":"#2a8d7e","a":"#46c7b0","c":"#9ef0dc","w":"#ffffff","k":"#082521","d":"#ff6fb5"}
          },
          "line": "框好了嗎？再往左一點。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              ".y......OO...y..",
              "ygy....ObbO.ygy.",
              ".y..OOObbbbOOy..",
              "OO.OaaaaaaaaaO..",
              "bbOaacaaacawwaO.",
              "bbbaaaaacaawkaO.",
              "bbbdddddddbdddO.",
              "bbOaaacaaabaaaO.",
              "OOyOaaaaaaaaaO..",
              ".ygyOOOObbOOO...",
              "..y.....OO......",
              "................",
              "................"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#6a7a47",
              "g": "#f2c14e",
              "b": "#2a8d7e",
              "a": "#46c7b0",
              "c": "#9ef0dc",
              "w": "#ffffff",
              "k": "#082521",
              "d": "#ff6fb5"
            }
          },
          "line": "拓印完成，整理成卡片。"
        }
      },
      "favFood": "觀察",
      "lines": {
        "idle": ["框好了嗎？再往左一點。","我在掃描這塊紋路。","安靜，正在存檔。","像素今天很整齊。"],
        "pet": ["啵，癢到畫面抖動。","別動，這樣構圖剛好。","再摸一下，存成相簿。"],
        "feed": ["解析度上升，謝謝。","味道已拓印，永久保存。","好吃，我拍一張。"],
        "awake": ["拓印完成，整理成卡片。","這一章的照片，我收好了。","每張相片，都有故事。"]
      }
    },
    {
      "id": "sp_marrow",
      "no": 16,
      "name": "時之髓水母",
      "nick": "髓",
      "era": "時安局核心",
      "eraId": "core",
      "genre": "fantasy",
      "anchor": "虛構的時安局核心生物，藍鯨與時之髓設定尚為候選，待文史把關",
      "attr": "全",
      "rarity": "傳說",
      "hidden": "dex100",
      "assist": {"name":"時間回溯","desc":"撤回最近一次提示扣分","cd":0,"perChapter":1,"key":"undoHintPenalty","value":1},
      "talent": {"name":"全屬性","desc":"全屬性 +1","key":"allAttr","value":1},
      "scout": {"kind":["史料","路況","人物","觀察","彩蛋","方位"],"era":"全部時期"},
      "awaken": {
        "name": "髓動",
        "desc": "覺醒後所有助理技冷卻 −30%",
        "key": "allCooldownCut",
        "value": 0.3,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":100,"desc":"羈絆 30 且圖鑑完成 100%"}
      },
      "hatchHours": 2,
      "needDexPct": 100,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_marrow,
          "line": "蛋殼裡傳出低低的歌聲。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "................",
              ".....ooooo......",
              "....oawwwao.....",
              "...oaaaaaaao....",
              "..oaaacccaaao...",
              "..oaakcyckaao...",
              "..oaakccckaao...",
              "...ooaaodaaao...",
              "....oddddddo....",
              "....oddbdbdo....",
              "....odbbdbbo....",
              ".....oooooo....."
            ],
            "pal": {
              "o": "#2a1a6a",
              "a": "#b9a0f0",
              "w": "#ffffff",
              "c": "#e8dcff",
              "k": "#150d35",
              "y": "#fff3b0",
              "d": "#8fe0ff",
              "b": "#7a5af8"
            }
          },
          "line": "我是髓，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              ".....ooooooo....",
              "....ocaaaaaao...",
              "...ocaaaaaawao..",
              "..oaaaacccaaaao.",
              ".oaaaaccyccaaaao",
              ".oaaaccyyyccaaao",
              ".oaaakccycckaaao",
              "..oaaaacpcaaaao.",
              ".oaoaoaoaoaoaoao",
              "..o.oddooddoodo.",
              "...oboobboobbo..",
              "....oddooddoodo.",
              "...oboobboobbo..",
              "....oddooddoodo.",
              ".....oo..oo..o.."
            ],
            "pal": {
              "o": "#2a1a6a",
              "c": "#e8dcff",
              "a": "#b9a0f0",
              "w": "#ffffff",
              "y": "#fff3b0",
              "k": "#150d35",
              "p": "#e87fa8",
              "d": "#8fe0ff",
              "b": "#7a5af8"
            }
          },
          "line": "我在時間裡漂著。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "..y..OOOOOOO..y.",
              ".ygyOcaaaaaaOygy",
              "..yOcaaaaaawaOy.",
              "..OaaaacccaaaaO.",
              ".OaaaaccyccaaaaO",
              ".OaaaccyyyccaaaO",
              ".OaaakccycckaaaO",
              "..OaaaacpcaaaaO.",
              ".OaOaOaOaOaOaOaO",
              "..O.OddOOddOOdO.",
              "...ObOObbOObbO..",
              "....OddOOddOOdO.",
              "..yObOObbOObbO..",
              ".ygyOddOOddOOdO.",
              "..y..OO..OO..O.."
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#7a5d5f",
              "g": "#f2c14e",
              "c": "#e8dcff",
              "a": "#b9a0f0",
              "w": "#ffffff",
              "k": "#150d35",
              "p": "#e87fa8",
              "d": "#8fe0ff",
              "b": "#7a5af8"
            }
          },
          "line": "髓動，時間為你加速。"
        }
      },
      "favFood": "全",
      "lines": {
        "idle": ["我在時間裡漂著。","很輕…很遠…","你聽，髓在發光。","所有時代，都在我身上。"],
        "pet": ["好輕的觸碰，像水波。","再摸一下，時間就慢了。","光在你手心打轉。"],
        "feed": ["溫暖，像回到起點。","謝謝，髓更亮了。","我記下這一刻。"],
        "awake": ["髓動，時間為你加速。","所有技能，都醒著。","我們一起穿過時代。"]
      }
    },
    {
      "id": "sp_snailcrab",
      "no": 17,
      "name": "螺殼蟹",
      "nick": "殼殼",
      "era": "西拉雅與大員前史",
      "eraId": "pre",
      "genre": "cute",
      "anchor": "與海岸潮間帶的貝類和寄居生物有關的小蟹，待文史把關",
      "attr": "守護",
      "rarity": "普通",
      "eggChapter": "x5",
      "assist": {"name":"背殼清單","desc":"列出已取得的碎片與剩餘提示數","cd":0,"perChapter":3,"key":"listFragments","value":1},
      "talent": {"name":"窩心","desc":"小精靈羈絆增加 +10%","key":"bondGain","value":0.1},
      "scout": {"kind":["彩蛋"],"era":"西拉雅與大員前史"},
      "awaken": {
        "name": "殼中屋",
        "desc": "每章多一次背殼清單",
        "key": "extraUse",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_snailcrab,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "....ooo.........",
              "...owwwo........",
              "..oaaaaaooo.....",
              "..oabbbakkko....",
              "..oaabbaaddeo...",
              "..oaaaaaddddo...",
              "...oaaadkkkdo...",
              "....oddddddo....",
              "...ododdddo.....",
              "....o.oooo......"
            ],
            "pal": {"o":"#5a2a3a","w":"#ffffff","a":"#f4b8c8","b":"#c87890","k":"#2d151d","d":"#f08050","e":"#d95b43"}
          },
          "line": "我是殼殼，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "....oo..........",
              "...oaaoo........",
              "..oaaaaao.o.o...",
              "..obabbaaokoko..",
              ".oaabaabaadodo..",
              ".oaabbbbaadodeo.",
              ".oaaabaaaadoddeo",
              "..oaaabaaddddddo",
              "...oaaaaddkdkdo.",
              "....oddddddpddo.",
              "...odoodddddoo..",
              "..odoodooodoodo.",
              "...o..o...o..o.."
            ],
            "pal": {"o":"#5a2a3a","a":"#f4b8c8","b":"#c87890","k":"#2d151d","d":"#f08050","e":"#d95b43","p":"#e87fa8"}
          },
          "line": "我把家背在身上喔。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "....OO.....y..y.",
              "...OaaOO..ygyygy",
              "..OaaaaaO.OyO.y.",
              "..ObabbaaOkOkO..",
              ".OaabaabaadOdO..",
              ".OaabbbbaadOdeO.",
              ".OaaabaaaadOddeO",
              "..OaaabaaddddddO",
              "..yOaaaaddkdkdO.",
              ".ygyOddddddpddO.",
              "..yOdOOdddddOO..",
              "..OdOOdOOOdOOdO.",
              "...O..O...O..O.."
            ],
            "pal": {
              "O": "#976642",
              "y": "#fff3b0",
              "a": "#f4b8c8",
              "g": "#f2c14e",
              "b": "#c87890",
              "k": "#2d151d",
              "d": "#f08050",
              "e": "#d95b43",
              "p": "#e87fa8"
            }
          },
          "line": "新殼亮亮的，來看！"
        }
      },
      "favFood": "彩蛋",
      "lines": {
        "idle": ["我把家背在身上喔。","殼裡很安靜，進來嗎？","橫著走，也能到終點。","潮來了，我縮一縮。"],
        "pet": ["別戳殼，我會躲進去。","摸摸蟹鉗就好。","殼殼溫溫的，舒服。"],
        "feed": ["喀滋喀滋，好脆。","謝謝，殼裡也留一點。","吃飽了，換新殼也不怕。"],
        "awake": ["新殼亮亮的，來看！","殼中小屋，開門囉。","清單背好了，隨時查。"]
      }
    },
    {
      "id": "sp_leopard",
      "no": 18,
      "name": "雲豹幼靈",
      "nick": "雲雲",
      "era": "西拉雅與大員前史",
      "eraId": "pre",
      "genre": "fantasy",
      "anchor": "與台灣山林動物意象有關的幼獸靈體，只畫動物，待文史把關",
      "attr": "行動",
      "rarity": "稀有",
      "eggChapter": "x6",
      "assist": {"name":"循跡","desc":"顯示下一站的走路分鐘與路況","cd":5,"key":"walkInfo","value":1},
      "talent": {"name":"輕步","desc":"到站判定範圍 +2 公尺","key":"arriveRange","value":2},
      "scout": {"kind":["路況"],"era":"西拉雅與大員前史"},
      "awaken": {
        "name": "雲影",
        "desc": "30 秒內標出 100 公尺內的小路與捷徑",
        "key": "trailReveal",
        "value": 100,
        "seconds": 30,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_leopard,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "....o..oooooo...",
              "...oboowwwaaao..",
              "..obboooookkko..",
              "..oaobbabakkko..",
              "..oaaabbbbaaco..",
              "...oaaabcdaoo...",
              "....oaadddao....",
              "....oaaoodao....",
              ".....oo..oo....."
            ],
            "pal": {"o":"#2a2214","b":"#5a4a30","w":"#ffffff","a":"#d8c890","k":"#15110a","c":"#f4ecd0","d":"#8a8a78"}
          },
          "line": "我是雲雲，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "..........oo..o.",
              "..oo.....oaboobo",
              ".obbo.....oaaaao",
              "oaoobooooookakao",
              "oaooobaabaaaaako",
              "oaoabdbbdbbaacco",
              ".oaaaabaabdbaoo.",
              "..oaabdbcccaao..",
              "...oaadccdaao...",
              "...oaadoodaao...",
              "...occo..occo...",
              "....oo....oo....",
              "................"
            ],
            "pal": {"o":"#2a2214","a":"#d8c890","b":"#5a4a30","k":"#15110a","d":"#8a8a78","c":"#f4ecd0"}
          },
          "line": "我用尾巴量一量路。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              ".....y....OO..O.",
              "..OOygy..OabOObO",
              ".ObbOy....OaaaaO",
              "OaOObOOOOOOkakaO",
              "OaOOObaabaaaaakO",
              "OaOabdbbdbbaaccO",
              ".OaaaabaabdbaOO.",
              "..OaabdbcccaaO..",
              "...OaadccdaaO...",
              ".y.OaadOOdaaO.y.",
              "ygyOccO..OccOygy",
              ".y..OO....OO..y.",
              "................"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#7a622b",
              "g": "#f2c14e",
              "a": "#d8c890",
              "b": "#5a4a30",
              "k": "#15110a",
              "d": "#8a8a78",
              "c": "#f4ecd0"
            }
          },
          "line": "雲影一晃，路都看清了。"
        }
      },
      "favFood": "路況",
      "lines": {
        "idle": ["我用尾巴量一量路。","腳步輕輕，不吵醒樹。","前面有岔路，我先去。","雲在山上，我在這裡。"],
        "pet": ["嗚…尾巴不要抓。","摸頭可以，慢一點。","我的斑紋在發癢。"],
        "feed": ["好吃，我叼回窩慢慢吃。","謝謝，肚子暖暖的。","嗯，這個味道很山林。"],
        "awake": ["雲影一晃，路都看清了。","我跑得比雲還輕。","跟我來，抄近路。"]
      }
    },
    {
      "id": "sp_seahorse",
      "no": 19,
      "name": "風帆海馬",
      "nick": "帆馬",
      "era": "荷治",
      "eraId": "dutch",
      "genre": "fantasy",
      "anchor": "與大航海時代海上航行有關的小海馬，待文史把關",
      "attr": "觀察",
      "rarity": "普通",
      "eggChapter": "w2",
      "assist": {"name":"順風指引","desc":"標出下一站的方向與距離","cd":3,"key":"showNextDist","value":1},
      "talent": {"name":"穩舵","desc":"集合圈範圍 +10 公尺","key":"rallyRange","value":10},
      "scout": {"kind":["觀察"],"era":"荷治"},
      "awaken": {
        "name": "揚帆",
        "desc": "10 分鐘內全隊到站速度 +10%",
        "key": "teamArriveSpeed",
        "value": 0.1,
        "minutes": 10,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_seahorse,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              ".......ooo......",
              "......owwwo.....",
              "......oakaao....",
              "......oakaao....",
              ".....obaaao.....",
              "....obbaeao.....",
              "....obbaaco.....",
              "....obbaacao....",
              ".....obaaao.....",
              "....oaaaao......",
              "....oaaao.......",
              ".....ooo........"
            ],
            "pal": {"o":"#0a3a38","w":"#ffffff","a":"#3fb8b0","k":"#051d1c","b":"#1f7a78","e":"#d95b43","c":"#f4ecd8"}
          },
          "line": "我是帆馬，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".........oo.....",
              "........oddo....",
              ".......odaaaoo..",
              "......odaakaaao.",
              ".......oaaaaabo.",
              "......oboaaapo..",
              ".....obboeeao...",
              "....obcbaaaco...",
              "....obbbaaaco...",
              "....obbbaaacao..",
              ".....oobaaacao..",
              ".....oabaaacao..",
              "....oaoaaaaao...",
              "....oaaaaaoo....",
              ".....oaabo......",
              "......ooo......."
            ],
            "pal": {
              "o": "#0a3a38",
              "d": "#f0c040",
              "a": "#3fb8b0",
              "k": "#051d1c",
              "b": "#1f7a78",
              "p": "#e87fa8",
              "e": "#d95b43",
              "c": "#f4ecd8"
            }
          },
          "line": "我站得直直的看風。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".....y...OO.....",
              "....ygy.OddO....",
              ".....y.OdaaaOO..",
              ".....yOdaakaaaO.",
              "....ygyOaaaaabO.",
              ".....yObOaaapO..",
              ".....ObbOeeaO...",
              "....ObcbaaacO...",
              "....ObbbaaacO...",
              "....ObbbaaacaO..",
              ".....OObaaacaO..",
              ".....OabaaacaO..",
              "....OaOaaaaaO...",
              "....OaaaaaOO.y..",
              ".....OaabO..ygy.",
              "......OOO....y.."
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#677041",
              "g": "#f2c14e",
              "d": "#f0c040",
              "a": "#3fb8b0",
              "k": "#051d1c",
              "b": "#1f7a78",
              "p": "#e87fa8",
              "e": "#d95b43",
              "c": "#f4ecd8"
            }
          },
          "line": "風來了，揚帆！"
        }
      },
      "favFood": "觀察",
      "lines": {
        "idle": ["我站得直直的看風。","小帆今天鼓鼓的。","尾巴捲住東西，就不會飄走。","你看，浪在排隊。"],
        "pet": ["別碰帆，會歪掉。","癢！尾巴捲起來了。","再摸一下，我轉個圈。"],
        "feed": ["好吃，吃了更有力氣。","謝謝，小帆更鼓了。","一口小蝦，航行無憂。"],
        "awake": ["風來了，揚帆！","大帆一展，全隊跟上。","我看見很遠的海面了。"]
      }
    },
    {
      "id": "sp_ironcrab",
      "no": 20,
      "name": "鐵蟹機甲",
      "nick": "鐵鉗",
      "era": "明鄭",
      "eraId": "zheng",
      "genre": "scifi",
      "anchor": "與海防和鐵甲意象有關的小型機甲蟹，待文史把關",
      "attr": "守護",
      "rarity": "稀有",
      "eggChapter": "w1",
      "assist": {"name":"護甲提示","desc":"顯示目前路段的注意事項","cd":5,"key":"riskNotice","value":1},
      "talent": {"name":"鐵殼","desc":"夜間與雨天自動提醒注意路面","key":"safetyBadge","value":1},
      "scout": {"kind":["觀察"],"era":"明鄭"},
      "awaken": {
        "name": "重裝",
        "desc": "隊友位置更新加快為 15 秒一次",
        "key": "matesRefresh",
        "value": 15,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_ironcrab,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "......oooo......",
              "...ooodwwwooo...",
              "..ocbaaaaaabco..",
              "..occaabaaacco..",
              "...ocbbbbbaao...",
              "...obbbaaabbo...",
              "..obbboooobbbo..",
              "...ooo....ooo..."
            ],
            "pal": {"o":"#1a2230","d":"#e04a3a","w":"#ffffff","c":"#c8d4e0","b":"#4a5868","a":"#8a98a8"}
          },
          "line": "我是鐵鉗，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              ".....o....o.....",
              "..o.odo..odo.o..",
              ".oboobooooboobo.",
              "occaoaabaaaoacco",
              "obccawabaawaccbo",
              ".ocabaebaeabaco.",
              "..obbbbbbbbbao..",
              "..oobbaaaabboo..",
              ".obbboooooobbbo.",
              "obobbo....obbobo",
              ".o.oo......oo.o.",
              "................",
              "................"
            ],
            "pal": {"o":"#1a2230","d":"#e04a3a","b":"#4a5868","c":"#c8d4e0","a":"#8a98a8","w":"#ffffff","e":"#58e8f0"}
          },
          "line": "系統正常，鉗子上油中。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              ".....O....O.....",
              ".gO.OdO..OdO.Og.",
              ".ObOObOOOObOObO.",
              "OccaOaabaaaOaccO",
              "ObccawabaawaccbO",
              ".OcabaebaeabacO.",
              "..ObbbbbbbbbaO..",
              "..OObbaaaabbOO..",
              ".ObbbOOOOOObbbO.",
              "ObObbO....ObbObO",
              ".O.OO......OO.O.",
              "................",
              "................"
            ],
            "pal": {
              "O": "#70623c",
              "g": "#f2c14e",
              "d": "#e04a3a",
              "b": "#4a5868",
              "c": "#c8d4e0",
              "a": "#8a98a8",
              "w": "#ffffff",
              "e": "#58e8f0"
            }
          },
          "line": "重裝啟動，全員安心。"
        }
      },
      "favFood": "觀察",
      "lines": {
        "idle": ["系統正常，鉗子上油中。","偵測前方：安全。","裝甲很重，但我很穩。","齒輪聲是我的呼吸。"],
        "pet": ["接觸感應，嗶。","輕一點，漆會掉。","再摸一次，我就舉鉗。"],
        "feed": ["燃料補充完畢。","味道資料已存檔。","電量上升，鉗力加倍。"],
        "awake": ["重裝啟動，全員安心。","雷達全開，位置更新！","鐵殼之下，我守著你。"]
      }
    },
    {
      "id": "sp_kitedragon",
      "no": 21,
      "name": "風箏小龍",
      "nick": "紙鳶",
      "era": "清領",
      "eraId": "qing",
      "genre": "fantasy",
      "anchor": "與民間風箏和紙藝有關的玩具龍，不是廟宇神獸，待文史把關",
      "attr": "溝通",
      "rarity": "普通",
      "eggChapter": "wc",
      "assist": {"name":"高飛","desc":"預告 500 公尺內的地標方向","cd":5,"key":"previewLandmarks","value":500},
      "talent": {"name":"順風線","desc":"計時賽速度分上限 +1","key":"timedSpeedCap","value":1},
      "scout": {"kind":["人物"],"era":"清領"},
      "awaken": {
        "name": "御風",
        "desc": "10 分鐘內預告範圍加倍",
        "key": "previewScale",
        "value": 2,
        "minutes": 10,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_kitedragon,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              ".......ooo......",
              "......owwwo.....",
              "......obbo......",
              ".....obaabo.....",
              "....obbbbbbo....",
              "....okkbkkbo....",
              ".....obkkbo.....",
              "......okko......",
              "......obbo......",
              ".....ocdoeo.....",
              ".....ocddo......",
              "......ooo......."
            ],
            "pal": {
              "o": "#4a0f20",
              "w": "#ffffff",
              "b": "#a02a48",
              "a": "#e8506a",
              "k": "#250810",
              "c": "#ffd86a",
              "d": "#58c8e8",
              "e": "#ffffff"
            }
          },
          "line": "我是紙鳶，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "......o.o.o.....",
              ".....ocoboco....",
              "......ocbco.....",
              ".....obababo....",
              ".....ocabaco....",
              "....obaaeaabo...",
              "...obbbbbbbbbo..",
              "....okkabkkbo...",
              "....odbapabdo...",
              ".....obkbkbo....",
              "......obbbo.....",
              "......ooboo.....",
              ".....ocodoeo....",
              "....ocodooco....",
              ".....oeoddo.....",
              "......o.oo......"
            ],
            "pal": {
              "o": "#4a0f20",
              "c": "#ffd86a",
              "b": "#a02a48",
              "a": "#e8506a",
              "e": "#ffffff",
              "k": "#250810",
              "d": "#58c8e8",
              "p": "#e87fa8"
            }
          },
          "line": "線在你手上，別放喔。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "......O.O.O.....",
              "....yOcObOcOy...",
              "...ygyOcbcOygy..",
              "....yObababOy...",
              ".....OcabacO....",
              "....ObaaeaabO...",
              "...ObbbbbbbbbO..",
              "....OkkabkkbO...",
              "....OdbapabdO...",
              ".....ObkbkbO....",
              "......ObbbO.....",
              "......OObOO.....",
              ".....OcOdOeO....",
              "....OcOdOOcOy...",
              ".....OeOddOygy..",
              "......O.OO..y..."
            ],
            "pal": {
              "O": "#8d5632",
              "y": "#fff3b0",
              "c": "#ffd86a",
              "b": "#a02a48",
              "g": "#f2c14e",
              "a": "#e8506a",
              "e": "#ffffff",
              "k": "#250810",
              "d": "#58c8e8",
              "p": "#e87fa8"
            }
          },
          "line": "御風而上，看得更遠！"
        }
      },
      "favFood": "人物",
      "lines": {
        "idle": ["線在你手上，別放喔。","我是紙做的，怕雨。","風大一點，我飛更高。","尾巴的緞帶在跳舞。"],
        "pet": ["別拉線，會歪啦！","紙翅膀沙沙響。","摸摸頭，我飄起來了。"],
        "feed": ["好吃，肚子鼓鼓的。","謝謝，我又輕了一點。","吃飽就能飛更遠。"],
        "awake": ["御風而上，看得更遠！","線越長，我飛越高。","地標都在我腳下。"]
      }
    },
    {
      "id": "sp_sugartrain",
      "no": 22,
      "name": "糖鐵小汽笛",
      "nick": "嗚嗚",
      "era": "日治",
      "eraId": "japan",
      "genre": "cute",
      "anchor": "與糖業鐵道和蒸汽小火車有關的玩具火車，待文史把關",
      "attr": "行動",
      "rarity": "普通",
      "eggChapter": "x4",
      "assist": {"name":"鳴笛","desc":"全隊收到集合提醒音","cd":10,"key":"rallyWhistle","value":1},
      "talent": {"name":"長程","desc":"全隊到站判定範圍 +1 公尺","key":"teamArriveRange","value":1},
      "scout": {"kind":["史料"],"era":"日治"},
      "awaken": {
        "name": "加煤",
        "desc": "30 分鐘內隨行時活力不下降",
        "key": "vigorHold",
        "value": 1,
        "minutes": 30,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_sugartrain,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "...oooooooooo...",
              "..oddddwwwdddo..",
              "..odddddooobbo..",
              "..obbcbbaakkko..",
              "..obbbbbeakkko..",
              "...ookkokkokko..",
              "....okkokkokko..",
              ".....oo.oo.oo..."
            ],
            "pal": {
              "o": "#5a1a38",
              "d": "#6fcfae",
              "w": "#ffffff",
              "b": "#b8587c",
              "c": "#fff0a8",
              "a": "#f6a0c0",
              "k": "#2d0d1c",
              "e": "#f2c14e"
            }
          },
          "line": "我是嗚嗚，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "..........oooo..",
              "ooooooo..oddddo.",
              "dddddddo..obbo..",
              "obbbbbooooobbo..",
              "obccbbaaaaaaaao.",
              "obccbbaeeaakako.",
              "obbbbbaaaaaapao.",
              ".ookkookkkookko.",
              "..okcookckookco.",
              "..okko.oko.okko.",
              "...oo...o...oo..",
              "................",
              "................"
            ],
            "pal": {
              "o": "#5a1a38",
              "d": "#6fcfae",
              "b": "#b8587c",
              "c": "#fff0a8",
              "a": "#f6a0c0",
              "e": "#f2c14e",
              "k": "#2d0d1c",
              "p": "#e87fa8"
            }
          },
          "line": "嗚嗚，進站囉。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "..........OOOO..",
              "OOOOOOO..OddddO.",
              "dddddddO..ObbO..",
              "ObbbbbOOOOObbO..",
              "ObccbbaaaaaaaaO.",
              "ObccbbaeeaakakO.",
              "ObbbbbaaaaaapaO.",
              ".OOkkOOkkkOOkkO.",
              ".gOkcOOkckOOkcO.",
              ".gOkkO.OkO.OkkO.",
              "...OO...O...OO..",
              "................",
              "................"
            ],
            "pal": {
              "O": "#975d41",
              "d": "#6fcfae",
              "b": "#b8587c",
              "c": "#fff0a8",
              "a": "#f6a0c0",
              "e": "#f2c14e",
              "k": "#2d0d1c",
              "p": "#e87fa8",
              "g": "#f2c14e"
            }
          },
          "line": "加滿煤，全速前進！"
        }
      },
      "favFood": "史料",
      "lines": {
        "idle": ["嗚嗚，進站囉。","鐵軌的聲音，咔噠咔噠。","甘蔗甜甜，煙囪也甜甜。","我跑得慢，但不誤點。"],
        "pet": ["嗚！按到汽笛啦。","摸摸煙囪，暖暖的。","再摸，我冒小煙圈。"],
        "feed": ["加煤加糖，開車！","好甜，鍋爐也開心。","謝謝，今天跑更遠。"],
        "awake": ["加滿煤，全速前進！","汽笛一響，大家集合。","這條線，我跑了好久。"]
      }
    },
    {
      "id": "sp_parrot",
      "no": 23,
      "name": "唱盤鸚鵡",
      "nick": "唱唱",
      "era": "戰後",
      "eraId": "postwar",
      "genre": "scifi",
      "anchor": "與老式唱片機和街頭流行聲音有關的鸚鵡，待文史把關",
      "attr": "溝通",
      "rarity": "普通",
      "eggChapter": "tx",
      "assist": {"name":"複誦","desc":"把剛才 NPC 說的話重播一次","cd":0,"perChapter":2,"key":"npcReplay","value":1},
      "talent": {"name":"好耳","desc":"附近有隱藏關卡時播放提示音","key":"sfxHint","value":1},
      "scout": {"kind":["方位"],"era":"戰後"},
      "awaken": {
        "name": "換片",
        "desc": "切換旁白音色（說書或廣播）",
        "key": "narrationVoice",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":15,"desc":"羈絆 30 且圖鑑完成 15%"}
      },
      "hatchHours": 0.5,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_parrot,
          "line": "蛋殼裡有輕輕的動靜。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "...o.oooo.......",
              "..oeowwwdo......",
              "..oeeooadao.....",
              "..oeeoaakkao....",
              "..oeooaaaaco....",
              "...ooaaaaaaoo...",
              "....obbbeeoowo..",
              "....obbbeeowwo..",
              "....okbbkkkko...",
              "...okkkkkkkkko..",
              "..okkkkkkkkkko..",
              "...oooooooooo..."
            ],
            "pal": {
              "o": "#0f3a18",
              "e": "#f2c14e",
              "w": "#ffffff",
              "d": "#d02a3a",
              "a": "#4fc05a",
              "k": "#081d0c",
              "c": "#f08a24",
              "b": "#207a30"
            }
          },
          "line": "我是唱唱，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "........o.......",
              ".oo....odo......",
              "oeeoo.odddo.....",
              "oeceeoaaaaao....",
              "oeeeooaaakaoo...",
              "oeeo.oaaaaacco..",
              ".oo.oaaaaaaco...",
              "...oabbaaaao..o.",
              "...obbbeeeao.owo",
              "...obbbeeeeoowo.",
              "...obbbeeeeoowo.",
              "...oobbeeeoowo..",
              "..okdbaaakkkwko.",
              ".okdbkkdddkkkkko",
              ".odkbkkkkkkkkko.",
              "..oooooooooooo.."
            ],
            "pal": {
              "o": "#0f3a18",
              "d": "#d02a3a",
              "e": "#f2c14e",
              "c": "#f08a24",
              "a": "#4fc05a",
              "k": "#081d0c",
              "b": "#207a30",
              "w": "#ffffff"
            }
          },
          "line": "嘎，這首我會唱！"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "........O..y..y.",
              ".OO....OdOygyygy",
              "OeeOO.OdddOy.yy.",
              "OeceeOaaaaaOygy.",
              "OeeeOOaaakaOOy..",
              "OeeO.OaaaaaccO..",
              ".OO.OaaaaaacO...",
              "...OabbaaaaO..O.",
              "...ObbbeeeaO.OwO",
              "...ObbbeeeeOOwO.",
              "...ObbbeeeeOOwO.",
              "...OObbeeeOOwO..",
              "..OkdbaaakkkwkO.",
              ".OkdbkkdddkkkkkO",
              ".OdkbkkkkkkkkkO.",
              "..OOOOOOOOOOOO.."
            ],
            "pal": {
              "O": "#6a702e",
              "y": "#fff3b0",
              "d": "#d02a3a",
              "g": "#f2c14e",
              "e": "#f2c14e",
              "c": "#f08a24",
              "a": "#4fc05a",
              "k": "#081d0c",
              "b": "#207a30",
              "w": "#ffffff"
            }
          },
          "line": "換一張，新的旁白！"
        }
      },
      "favFood": "方位",
      "lines": {
        "idle": ["嘎，這首我會唱！","唱針一放，我就跟著轉。","再說一次？我最會學舌。","沙沙的聲音也是歌。"],
        "pet": ["嘎！羽毛別亂摸。","摸一下，我唱一句。","轉轉轉，頭暈了。"],
        "feed": ["嘎，好吃，再來一首。","謝謝，嗓子更亮了。","吃飽才有力氣開唱。"],
        "awake": ["換一張，新的旁白！","這一片，只唱給你聽。","聽，我學得一模一樣。"]
      }
    },
    {
      "id": "sp_ufo",
      "no": 24,
      "name": "點雲幽浮",
      "nick": "點點",
      "era": "當代文資",
      "eraId": "heritage",
      "genre": "scifi",
      "anchor": "與三維掃描和點雲建模有關的小飛碟，待文史把關",
      "attr": "觀察",
      "rarity": "稀有",
      "eggChapter": "c0,y0",
      "assist": {"name":"掃描","desc":"標出 80 公尺內適合拍照的地點","cd":5,"key":"scanPhotoSpots","value":80},
      "talent": {"name":"精準","desc":"顯示與目標的精確距離","key":"distanceExact","value":1},
      "scout": {"kind":["史料"],"era":"當代文資"},
      "awaken": {
        "name": "點雲成像",
        "desc": "把本章走過的路線畫成立體點雲圖",
        "key": "routePointCloud",
        "value": 1,
        "cond": {"key":"bondAndDex","bond":30,"dexPct":30,"desc":"羈絆 30 且圖鑑完成 30%"}
      },
      "hatchHours": 1,
      "stages": {
        "egg": {
          "sprite": EGGS.sp_ufo,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              "................",
              ".......ooo......",
              "......owwwo.....",
              "....ooddadooo...",
              "...oaaaaaaaaao..",
              "..oaaabbbbbaao..",
              "..odobbbbbbodo..",
              "...o.oooooo.o..."
            ],
            "pal": {"o":"#1a2040","w":"#ffffff","d":"#a0f0ff","a":"#9aa8c0","b":"#5a6888"}
          },
          "line": "我是點點，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              ".......ooo......",
              "......odddo.....",
              ".....oddeddo....",
              "..ooooaaaaaoooo.",
              ".oaeaaaaaaaaaeao",
              ".oaaaaebbbeaaaao",
              "odoobbbbbbbbbodo",
              ".oeoowwwwwwwooeo",
              "..o..ooooooo..o.",
              "................",
              "................",
              "................",
              "................"
            ],
            "pal": {"o":"#1a2040","d":"#a0f0ff","e":"#ff6fb5","a":"#9aa8c0","b":"#5a6888","w":"#ffffff"}
          },
          "line": "掃描中，請勿移動。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "................",
              "................",
              ".y..y..OOO....y.",
              "ygyygyOdddO..ygy",
              ".y..yOddeddO..y.",
              "..OOOOaaaaaOOOO.",
              ".OaeaaaaaaaaaeaO",
              ".OaaaaebbbeaaaaO",
              "OdOObbbbbbbbbOdO",
              ".OeOOwwwwwwwOOeO",
              "..O..OOOOOOO..O.",
              "................",
              "................",
              "................",
              "................"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#706046",
              "g": "#f2c14e",
              "d": "#a0f0ff",
              "e": "#ff6fb5",
              "a": "#9aa8c0",
              "b": "#5a6888",
              "w": "#ffffff"
            }
          },
          "line": "點雲成像，立體重現。"
        }
      },
      "favFood": "史料",
      "lines": {
        "idle": ["掃描中，請勿移動。","一顆一顆點，拼成一座樓。","光束掃過，細節都在。","嗡——資料存好了。"],
        "pet": ["嗡，感應到溫度。","別擋光束，會糊掉。","再摸一下，旋轉一圈。"],
        "feed": ["能量補充，點數增加。","好吃，解析度上升。","謝謝，點雲更密了。"],
        "awake": ["點雲成像，立體重現。","全域掃描，沒有死角。","看，這是你走過的路。"]
      }
    }
  ];
  /* 點心：snack 依 cat 對應勘察專長；吃到 favFood（＝專長類別）羈絆再加 favBond。plain 不分類 */
  var FOODS = [
    {
      "id": "food_hist",
      "name": "書卷酥",
      "cat": "史料",
      "kind": "snack",
      "price": 12,
      "vigor": 15,
      "bond": 1,
      "favBond": 1,
      "desc": "一口一頁的小點心，史料類最愛。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "................",
          "................",
          "......ooooo.....",
          "....oowaaaaoo...",
          "...obwaaaaaabo..",
          "..obaawwwwwaabo.",
          "..obaaaaaaaaabo.",
          "..obaawwwwwaabo.",
          "..obaaaaaaaaabo.",
          "..obbawwwwaabbo.",
          "...obbaaaaabbo..",
          "....oobbbbboo...",
          "......ooooo.....",
          "................"
        ],
        "pal": {"o":"#1b1b2f","w":"#ffffff","a":"#d9a878","b":"#a8743f"}
      }
    },
    {
      "id": "food_road",
      "name": "路標糖",
      "cat": "路況",
      "kind": "snack",
      "price": 10,
      "vigor": 15,
      "bond": 1,
      "favBond": 1,
      "desc": "甜甜的小路標，路況類最愛。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "................",
          "................",
          "......ooooo.....",
          "....oowaaaaoo...",
          "...obwaaaaaabo..",
          "..obaaaawaaaabo.",
          "..obaaaaawaaabo.",
          "..obawwwwwwaabo.",
          "..obaaaaawaaabo.",
          "..obbaaawaaabbo.",
          "...obbaaaaabbo..",
          "....oobbbbboo...",
          "......ooooo.....",
          "................"
        ],
        "pal": {"o":"#1b1b2f","w":"#ffffff","a":"#7fc8a0","b":"#3f8d66"}
      }
    },
    {
      "id": "food_person",
      "name": "說書糕",
      "cat": "人物",
      "kind": "snack",
      "price": 12,
      "vigor": 15,
      "bond": 1,
      "favBond": 1,
      "desc": "軟軟的米糕，人物類最愛。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "................",
          "................",
          "......ooooo.....",
          "....oowaaaaoo...",
          "...obwaaaaaabo..",
          "..obaaaaaaaaabo.",
          "..obaawaaawaabo.",
          "..obaaaaaaaaabo.",
          "..obaaaaaaaaabo.",
          "..obbawaaawabbo.",
          "...obbawwwabbo..",
          "....oobbbbboo...",
          "......ooooo.....",
          "................"
        ],
        "pal": {"o":"#1b1b2f","w":"#ffffff","a":"#f0a8b8","b":"#c4647c"}
      }
    },
    {
      "id": "food_observe",
      "name": "放大鏡餅",
      "cat": "觀察",
      "kind": "snack",
      "price": 10,
      "vigor": 15,
      "bond": 1,
      "favBond": 1,
      "desc": "圓圓的薄餅，觀察類最愛。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "................",
          "................",
          "......ooooo.....",
          "....oowaaaaoo...",
          "...obwaaaaaabo..",
          "..obaawwwwaaabo.",
          "..obaawaawaaabo.",
          "..obaawaawaaabo.",
          "..obaawwwwaaabo.",
          "..obbaaaaawabbo.",
          "...obbaaaaawbo..",
          "....oobbbbboo...",
          "......ooooo.....",
          "................"
        ],
        "pal": {"o":"#1b1b2f","w":"#ffffff","a":"#9ac0f0","b":"#4b6fd6"}
      }
    },
    {
      "id": "food_easter",
      "name": "驚喜糰",
      "cat": "彩蛋",
      "kind": "snack",
      "price": 15,
      "vigor": 15,
      "bond": 1,
      "favBond": 1,
      "desc": "咬開才知道內餡，彩蛋類最愛。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "................",
          "................",
          "......ooooo.....",
          "....oowaaaaoo...",
          "...obwaawaaabo..",
          "..obaawawaaaabo.",
          "..obaaaawaaaabo.",
          "..obaawwwwwaabo.",
          "..obaaaawaaaabo.",
          "..obbaaawawabbo.",
          "...obbaaaaabbo..",
          "....oobbbbboo...",
          "......ooooo.....",
          "................"
        ],
        "pal": {"o":"#1b1b2f","w":"#ffffff","a":"#c8a0f0","b":"#7a5af8"}
      }
    },
    {
      "id": "food_dir",
      "name": "羅盤脆片",
      "cat": "方位",
      "kind": "snack",
      "price": 12,
      "vigor": 15,
      "bond": 1,
      "favBond": 1,
      "desc": "四個方向各一口，方位類最愛。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "................",
          "................",
          "......ooooo.....",
          "....oowaeaaoo...",
          "...obwaawaaabo..",
          "..obaaaawaaaabo.",
          "..obaaaawaaaabo.",
          "..obawwwwwwwabo.",
          "..obaaaawaaaabo.",
          "..obbaaawaaabbo.",
          "...obbaawaabbo..",
          "....oobbbbboo...",
          "......ooooo.....",
          "................"
        ],
        "pal": {"o":"#1b1b2f","w":"#ffffff","a":"#f0b070","e":"#f2c14e","b":"#c4783a"}
      }
    },
    {
      "id": "food_plain",
      "name": "清水糰子",
      "cat": "",
      "kind": "plain",
      "price": 5,
      "vigor": 10,
      "bond": 0,
      "favBond": 0,
      "desc": "最普通的白糰子，補給站隨時有。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "................",
          "........o.......",
          ".......oao......",
          "......oaaao.....",
          "......oawao.....",
          ".....oawaaao....",
          ".....oaaaaao....",
          "....oaaaaaaao...",
          "...oaakkkkaaao..",
          "..oaaakkkkaaaao.",
          "...oaakkkkaaao..",
          "....oaaaaaaao...",
          ".....ooooooo....",
          "................"
        ],
        "pal": {"o":"#1b1b2f","a":"#fdf6e3","w":"#ffffff","k":"#1b1b2f"}
      }
    }
  ];
  /* 玩具：玩耍時活力額外加 playBonus */
  var TOYS = [
    {
      "id": "toy_light",
      "name": "光點球",
      "price": 30,
      "play": "追光點",
      "playBonus": 2,
      "desc": "追著光點跑的小球。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          ".y..............",
          "........o.....y.",
          ".....ooobooo....",
          "....obbbbbbbo...",
          "...obbbaaabbbo..",
          "...obbaaaaabbo..",
          "...obaawwwaabo..",
          "..obbaawwwaabbo.",
          "...obaawwwaabo..",
          "...obbaaaaabbo..",
          "...obbbaaabbbo..",
          "....obbbbbbbo...",
          ".....ooobooo....",
          "..y.....o.....y.",
          "................"
        ],
        "pal": {"y":"#fff3b0","o":"#1b1b2f","b":"#f2c14e","a":"#fff27a","w":"#ffffff"}
      }
    },
    {
      "id": "toy_ball",
      "name": "彈力球",
      "price": 45,
      "play": "接球",
      "playBonus": 3,
      "desc": "丟出去會彈回來的球。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "......ooooo.....",
          ".....oaaaaao....",
          "....owwwwwwwo...",
          "...oaawaaaaaao..",
          "..oaaawaaaaaaao.",
          "..oaaaaaaaaaaao.",
          "..owwwwwwwwwwwo.",
          "..oaaaaaaaaaaao.",
          "..oaaaaaaaaaaao.",
          "...oaaaaaaaaao..",
          "....owwwwwwwo...",
          ".....oaaaaao....",
          "......ooooo.....",
          "................"
        ],
        "pal": {"o":"#1b1b2f","a":"#d95b43","w":"#ffffff"}
      }
    },
    {
      "id": "toy_cards",
      "name": "小卡牌",
      "price": 60,
      "play": "拋小卡",
      "playBonus": 4,
      "desc": "拋一拋、接一接的小卡。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "......oooooo....",
          ".....oaaaaaao...",
          "....obbaaaaaao..",
          "..oobbbaaaaaao..",
          ".obbbbbaeeeaao..",
          "..obbbbaeeeaao..",
          "..obbbbaeeeaao..",
          "...obbbaaaaaao..",
          "...obbbaaaaaao..",
          "....obbaaaaaao..",
          "....obbaaaaaao..",
          ".....oooooooo...",
          "................",
          "................"
        ],
        "pal": {"o":"#1b1b2f","a":"#f4ecd8","b":"#7fb0e8","e":"#d95b43"}
      }
    },
    {
      "id": "toy_yarn",
      "name": "毛線球",
      "price": 80,
      "play": "撲抓",
      "playBonus": 5,
      "desc": "滾來滾去的毛線團。",
      "sprite": {
        "w": 16,
        "h": 16,
        "rows": [
          "................",
          "................",
          "......ooooo.....",
          ".....oaaaaao....",
          "....oaaaaaaao...",
          "...oaaaaaaabao..",
          "..oabaaaabbaaao.",
          "..oaabbbbaaabao.",
          "..oaabbbbabbaao.",
          "..oabaaaabbaaao.",
          "..oaaaaabaabbao.",
          "...oaabbaaaaao..",
          "....obaaaaaao...",
          ".....oaaaaboo...",
          "......ooooobboo.",
          "...........oobbo"
        ],
        "pal": {"o":"#1b1b2f","a":"#e87fa8","b":"#b8476f"}
      }
    }
  ];
  /* 職務×小精靈特別搭檔（SPIRIT_SKILLS 第 2 節） */
  var PAIRS = [
    {
      "role": "隊長",
      "spirit": "sp_sail",
      "name": "揚帆",
      "desc": "號召集合時冷卻減半",
      "effect": {"key":"rallyCooldownScale","value":0.5}
    },
    {
      "role": "領航員",
      "spirit": "sp_tide",
      "name": "潮聲探路",
      "desc": "路線畫線更長",
      "effect": {"key":"routeLineLonger","value":1}
    },
    {
      "role": "軍師",
      "spirit": "sp_bookworm",
      "name": "引經據典",
      "desc": "免費提示附出處",
      "effect": {"key":"freeHintWithSource","value":1}
    },
    {
      "role": "偵查員",
      "spirit": "sp_deer",
      "name": "循跡",
      "desc": "隱藏關卡方位卡更精準",
      "effect": {"key":"hiddenIntelPrecise","value":1}
    },
    {
      "role": "檔案官",
      "spirit": "sp_abacus",
      "name": "對帳",
      "desc": "答對選擇題多加分一次",
      "effect": {"key":"choiceBonusExtra","value":1}
    },
    {
      "role": "訪談員",
      "spirit": "sp_radio",
      "name": "調頻",
      "desc": "NPC 好感提示更清楚",
      "effect": {"key":"npcFavorHintClear","value":1}
    },
    {
      "role": "蒐證員",
      "spirit": "sp_rubbing",
      "name": "定格",
      "desc": "拍照任務品質提示",
      "effect": {"key":"photoQualityHint","value":1}
    },
    {
      "role": "記錄官",
      "spirit": "sp_ink",
      "name": "文思",
      "desc": "書寫起手式多一種",
      "effect": {"key":"writeStarterExtra","value":1}
    },
    {
      "role": "文化設計員",
      "spirit": "sp_brick",
      "name": "構件",
      "desc": "規則卡多抽一張",
      "effect": {"key":"ruleCardExtraDraw","value":1}
    },
    {
      "role": "通訊官",
      "spirit": "sp_telegraph",
      "name": "同頻",
      "desc": "廣播多一種範本",
      "effect": {"key":"broadcastTemplateExtra","value":1}
    },
    {
      "role": "安全官",
      "spirit": "sp_lion",
      "name": "雙盾",
      "desc": "警戒範圍加大",
      "effect": {"key":"guardRangeUp","value":1}
    },
    {
      "role": "補給官",
      "spirit": "sp_abacus",
      "name": "精算",
      "desc": "折扣疊加上限放寬",
      "effect": {"key":"discountCapUp","value":1}
    },
    {
      "role": "鑑識員",
      "spirit": "sp_brick",
      "name": "放大",
      "desc": "觀察提示多一個細節",
      "effect": {"key":"observeExtraDetail","value":1}
    },
    {
      "role": "技術專家",
      "spirit": "sp_neon",
      "name": "微光",
      "desc": "夜間定位更準",
      "effect": {"key":"nightLocPrecise","value":1}
    },
    {
      "role": "在地嚮導",
      "spirit": "sp_deer",
      "name": "老路",
      "desc": "路況卡更詳細",
      "effect": {"key":"roadIntelDetail","value":1}
    },
    {
      "role": "扮演專員",
      "spirit": "sp_radio",
      "name": "入戲",
      "desc": "NPC 回話更長",
      "effect": {"key":"npcReplyLonger","value":1}
    }
  ];
  /* 共用設定：屬性、稀有度形狀、時期、階段門檻、活力公式、每日上限 */
  var META = {
    "version": 1,
    "note": "數字來自 SPIRIT_SKILLS_EXPEDITION_1029 與 ROOM_SPIRIT_DESIGN_1029；標「假設」者為建置時補的預設值，等楊老師或模擬後調整。",
    "scoutKinds": ["史料","路況","人物","觀察","彩蛋","方位"],
    "attrs": [
      {"id":"觀察","glyph":"◎"},
      {"id":"溝通","glyph":"✦"},
      {"id":"智識","glyph":"▣"},
      {"id":"行動","glyph":"➤"},
      {"id":"守護","glyph":"⬢"},
      {"id":"全","glyph":"✪"}
    ],
    "rarity": {
      "普通": {"shape":"circle","glyph":"●"},
      "稀有": {"shape":"diamond","glyph":"◆"},
      "傳說": {"shape":"star","glyph":"★"}
    },
    "eras": [
      {"id":"pre","name":"西拉雅與大員前史"},
      {"id":"dutch","name":"荷治"},
      {"id":"zheng","name":"明鄭"},
      {"id":"qing","name":"清領"},
      {"id":"japan","name":"日治"},
      {"id":"postwar","name":"戰後"},
      {"id":"heritage","name":"當代文資"},
      {"id":"core","name":"時安局核心"}
    ],
    "stages": [
      {"id":"egg","name":"蛋"},
      {"id":"baby","name":"幼體","bond":0},
      {"id":"adult","name":"成體","bond":10},
      {"id":"awake","name":"覺醒","bond":30,"note":"假設：羈絆 30，加上圖鑑完成度（見各隻 awaken.cond）"}
    ],
    "slots": {"follow":1,"scout":2},
    "maxOwned": 3,
    "count": 24,
    "forms": 72,
    "vigor": {"min":20,"max":100,"dailyDrop":10,"eMin":0.5,"eSlope":0.7,"lowWarn":40},
    "daily": {"feed":3,"play":3,"pet":5,"tidy":1,"chat":20},
    "roomGain": {"feed":15,"play":10,"pet":3,"tidy":5},
    "hatch": {"普通":30,"稀有":60,"傳說":120,"note":"假設：孵化所需分鐘；加速用點數（蛋鋪）"},
    "thresholdTalk": "提醒：數值在此一處，改這裡即可，不需動程式。"
  };
  window.WALK_SPIRIT_EGGS = EGGS;
  window.WALK_SPIRITS = SPIRITS;
  window.WALK_FOODS = FOODS;
  window.WALK_TOYS = TOYS;
  window.WALK_SPIRIT_PAIRS = PAIRS;
  window.WALK_SPIRIT_META = META;
})();
