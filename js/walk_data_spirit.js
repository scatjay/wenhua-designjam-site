/* 走讀：小精靈資料（16 隻）、點心、玩具、特別搭檔、共用設定。
   純資料（ES5、掛 window），由 test_tools/gen_walk_data.js 排版產生；數值來源見 BUILD_SPEC_ROOM_SPIRIT_1103.md 第 3 節。
   精靈圖＝16×16 字串矩陣 rows（'.' 透明）＋調色盤 pal（字元→色碼）；歷史錨點全部待文史把關。 */
(function () {
  'use strict';
  /* 三種蛋圖：普通／稀有／傳說，16 隻共用 */
  var EGGS = {
    "common": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        ".......ooo......",
        "......oaaao.....",
        ".....oaaaaao....",
        "....oaaaaaaao...",
        "....owwaaaaao...",
        "....owwaaabao...",
        "...oawwaaabaao..",
        "...oaabbaaaaao..",
        "..oaaabaaaaaaao.",
        "...oaaaaaaaaao..",
        "...oaaaaabbaao..",
        "....oaabaabao...",
        ".....oaaaaao....",
        "......ooooo....."
      ],
      "pal": {"o":"#1b1b2f","a":"#f3e6c8","w":"#ffffff","b":"#b58a52"}
    },
    "rare": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        ".......ooo......",
        "......oaaao..w..",
        "..w..oaaaaao....",
        "....oaaaaaaao...",
        "....owwabaaao...",
        "....owwbwbaao...",
        "...oawwabaaaao..",
        "...oaaaaaaaaao..",
        "..oaaaaaaaaaaao.",
        "...oaabaaaabao..",
        "...oabwbaabwbow.",
        "....oabaaaabo...",
        ".....oaaaaao....",
        "......ooooo....."
      ],
      "pal": {"o":"#1b1b2f","a":"#7fb5f0","w":"#ffffff","b":"#3f78c4"}
    },
    "legend": {
      "w": 16,
      "h": 16,
      "rows": [
        "................",
        "................",
        "..y....ooo......",
        ".ygy..oaaao..y..",
        "..y..oaaaaaoygy.",
        "....oaaaaaaaoy..",
        "....owwaaaaao...",
        "....owwayaaao...",
        "...oawwayaaaao..",
        "...oaayyyyyaao..",
        "..oaaaayyyaaaao.",
        "...oaaayayaaao..",
        "...oaaaaaaaaao..",
        "....oaaaaaaao...",
        ".....oaaaaao....",
        "......ooooo....."
      ],
      "pal": {"y":"#fff3b0","o":"#1b1b2f","g":"#f2c14e","a":"#f2c14e","w":"#ffffff"}
    }
  };
  /* 16 隻小精靈；效果一律 {key,value}，由 WalkStore.talents() 彙整給 walk.js 讀 */
  var SPIRITS = [
    {
      "id": "sp_tide",
      "no": 1,
      "name": "潮汐鯨魂",
      "nick": "潮",
      "era": "西拉雅與大員前史",
      "eraId": "pre",
      "anchor": "與台江內海地形變遷有關的海洋生物，待文史把關",
      "attr": "觀察",
      "rarity": "傳說",
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
          "sprite": EGGS.legend,
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
              ".........oo.....",
              "........occo....",
              "..o....oceeo....",
              ".obo...ooeeo....",
              ".obboooaaaaoo...",
              ".obbaaaaaakkao..",
              ".oaaaaaaaakkao..",
              "..oaaaaaaaaaao..",
              "...oaadccccddo..",
              "....oadbbdddo...",
              ".....ooooooo...."
            ],
            "pal": {"o":"#1b1b2f","c":"#9ad7ff","e":"#6fe0e8","b":"#2f4a9c","a":"#4b6fd6","k":"#1b1b2f","d":"#dff3ff"}
          },
          "line": "我是潮，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "..........o.....",
              "........oocoo...",
              ".......ocoeoco..",
              "o.......oceco...",
              "bo.......oeo....",
              "bbo...ooooeo....",
              "bbboooaaaaaaoo..",
              "bbaaaaaaaaaaaao.",
              "oaaaaaaaaaaakaao",
              "oaaaaaaaaaaaaaao",
              ".oaaaaaddddbbbao",
              "..oaadcccccccdao",
              "...oaddbbbddddo.",
              "....ooadbdddoo..",
              "......oooooo....",
              "................"
            ],
            "pal": {"o":"#1b1b2f","c":"#9ad7ff","e":"#6fe0e8","b":"#2f4a9c","a":"#4b6fd6","k":"#1b1b2f","d":"#dff3ff"}
          },
          "line": "海風今天很輕。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "g.........O.....",
              "..y.....OOcOO...",
              ".ygy...OcOeOcO..",
              "O.y.....OcecO...",
              "bO.......OeO....",
              "bbO...OOOOeO....",
              "bbbOOOaaaaaaOO..",
              "bbaaaaaaaaaaaaO.",
              "OaaaaaaaaaaakaaO",
              "OaaaaaaaaaaaaaaO",
              ".OaaaaaddddbbbaO",
              "..OaadcccccccdaO",
              "..yOaddbbbddddO.",
              ".ygyOOadbdddOO..",
              "..y...OOOOOO....",
              "................"
            ],
            "pal": {
              "g": "#f2c14e",
              "O": "#8a5a10",
              "y": "#fff3b0",
              "c": "#9ad7ff",
              "e": "#6fe0e8",
              "b": "#2f4a9c",
              "a": "#4b6fd6",
              "k": "#1b1b2f",
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
      "anchor": "與荷治時期鹿皮貿易有關的森林生物，待文史把關",
      "attr": "觀察",
      "rarity": "普通",
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
          "sprite": EGGS.common,
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
              ".........ooo....",
              "........occco...",
              "........occco...",
              "........okkko...",
              "........okkko...",
              "...oooooaaaao...",
              "..odaaaaaaao....",
              "..oaaaaaaaao....",
              "..oaaddddao.....",
              "..obbddddbo.....",
              "..okkookko......",
              "...oo..oo......."
            ],
            "pal": {"o":"#1b1b2f","c":"#e8c98a","k":"#1b1b2f","a":"#b9763a","d":"#f4e3c0","b":"#7a4a22"}
          },
          "line": "我是斑，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "..........ooo.o.",
              ".........occcoco",
              "..........oococo",
              ".........obbcco.",
              "..........ooaao.",
              "..........oakako",
              ".......o.oaaaado",
              "..o.oooaooaaaao.",
              ".odoaaadaaaaao..",
              ".odaadaaaaaaao..",
              ".oaaaadaadaaao..",
              "..oadddddddao...",
              "..obdddddddbo...",
              "..oboboaobobo...",
              "..okokoookoko...",
              "...o.o...o.o...."
            ],
            "pal": {"o":"#1b1b2f","c":"#e8c98a","b":"#7a4a22","a":"#b9763a","k":"#1b1b2f","d":"#f4e3c0"}
          },
          "line": "我躲在樹影後面看你。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "g.........OOO.Og",
              "..y......OcccOcO",
              ".ygy......OOcOcO",
              "..y......ObbccO.",
              "..........OOaaO.",
              "..........OakakO",
              ".......O.OaaaadO",
              "..O.OOOaOOaaaaO.",
              ".OdOaaadaaaaaO..",
              ".OdaadaaaaaaaO..",
              ".OaaaadaadaaaO..",
              "..OadddddddaO...",
              "..ObdddddddbO...",
              "..ObObOaObObO...",
              "..OkOkOOOkOkO...",
              "...O.O...O.O...."
            ],
            "pal": {
              "g": "#f2c14e",
              "O": "#8a5a10",
              "y": "#fff3b0",
              "c": "#e8c98a",
              "b": "#7a4a22",
              "a": "#b9763a",
              "k": "#1b1b2f",
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
      "anchor": "與大員港一帶海岸有關的機械鳥，待文史把關",
      "attr": "行動",
      "rarity": "普通",
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
          "sprite": EGGS.common,
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
              "...........o....",
              "..........oeo...",
              "........ooodo...",
              ".......obbddo...",
              "......obbbaaao..",
              "..ooooabbdaaco..",
              ".obbaabddbaao...",
              ".obbaadddaaao...",
              "..ooaaadaaao....",
              "....oocccco.....",
              ".....ococco.....",
              "......o.oo......"
            ],
            "pal": {"o":"#1b1b2f","e":"#e04a3a","d":"#6b7a8f","b":"#9fb0c4","a":"#eaf0f7","c":"#f0a030"}
          },
          "line": "我是鷗，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "............o...",
              "...........oeo..",
              "...........odo..",
              "........oo.odo..",
              ".......obboodo..",
              "......obbbdaeao.",
              ".....oobbdbaaaco",
              "ooo.oabbbdbaacco",
              "bbboaabbdbaaaao.",
              "bbbaabdddbaaao..",
              "bbbaaadadaaaao..",
              "ooooaadddaaao...",
              "....oacaacao....",
              ".....ocooco.....",
              "....occoocco....",
              ".....oo..oo....."
            ],
            "pal": {"o":"#1b1b2f","e":"#e04a3a","d":"#6b7a8f","b":"#9fb0c4","a":"#eaf0f7","c":"#f0a030"}
          },
          "line": "回報：天氣晴，視野良好。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "............O...",
              "..y........OeO..",
              ".ygy.......OdO..",
              "..y.....OO.OdO..",
              ".......ObbOOdO..",
              "......ObbbdaeaO.",
              ".....OObbdbaaacO",
              "OOO.OabbbdbaaccO",
              "bbbOaabbdbaaaaO.",
              "bbbaabdddbaaaO..",
              "bbbaaadadaaaaO..",
              "OOOOaadddaaaO...",
              "..y.OacaacaO.y..",
              ".ygy.OcOOcO.ygy.",
              "..y.OccOOccO.y..",
              ".....OO..OO....."
            ],
            "pal": {
              "O": "#8a5a10",
              "y": "#fff3b0",
              "e": "#e04a3a",
              "g": "#f2c14e",
              "d": "#6b7a8f",
              "b": "#9fb0c4",
              "a": "#eaf0f7",
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
      "anchor": "與海上航行和水師有關的船帆靈體，不涉及人物，待文史把關",
      "attr": "行動",
      "rarity": "稀有",
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
          "sprite": EGGS.rare,
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
              ".......ooo......",
              "......obeeo.....",
              "......obeeo.....",
              ".....oaaeo......",
              ".....oaacco.....",
              "....oaaacco.....",
              "....okkaccco....",
              "...okkkacccco...",
              "..oaaaabcccco...",
              "..obbbbbbbbbo...",
              "..obbbbbbbbbo...",
              "...ooooooooo...."
            ],
            "pal": {"o":"#1b1b2f","b":"#7a4a22","e":"#d95b43","a":"#f4ecd8","c":"#7fd0cf","k":"#1b1b2f"}
          },
          "line": "我是帆，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              ".......o........",
              "......oboooo....",
              "......obeeeeo...",
              ".....oabeeoo....",
              ".....oaboco.....",
              "....oaaboco.....",
              "....oaabocco....",
              "...oaaabocco....",
              "...oaaaboccco...",
              "..okakabocccco..",
              ".oaapaabocccco..",
              ".oaaaaaboccccco.",
              "obbbbbbbbbbbbbo.",
              ".obbbbbbbbbbbo..",
              ".odoooodoooodo..",
              "..o....o....o..."
            ],
            "pal": {
              "o": "#1b1b2f",
              "b": "#7a4a22",
              "e": "#d95b43",
              "a": "#f4ecd8",
              "c": "#7fd0cf",
              "k": "#1b1b2f",
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
              "g......O........",
              "..y...ObOOOO....",
              ".ygy..ObeeeeOy..",
              "..y..OabeeOOygy.",
              ".....OabOcO..y..",
              "....OaabOcO.....",
              "....OaabOccO....",
              "...OaaabOccO....",
              "...OaaabOcccO...",
              "..OkakabOccccO..",
              ".OaapaabOccccO..",
              ".OaaaaabOcccccO.",
              "ObbbbbbbbbbbbbO.",
              ".ObbbbbbbbbbbO..",
              ".OdOOOOdOOOOdO..",
              "..O....O....O..."
            ],
            "pal": {
              "g": "#f2c14e",
              "O": "#8a5a10",
              "y": "#fff3b0",
              "b": "#7a4a22",
              "e": "#d95b43",
              "a": "#f4ecd8",
              "c": "#7fd0cf",
              "k": "#1b1b2f",
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
      "anchor": "與府城教育和孔廟有關的書卷生物，待文史把關",
      "attr": "智識",
      "rarity": "稀有",
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
          "sprite": EGGS.rare,
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
              "...o...o........",
              "..obo.obo.......",
              "..obbobbo.......",
              "...obabo........",
              "...okkkaoooo....",
              "...okkkaaaaao...",
              "..odccaaaaaaao..",
              "..odccccccbcco..",
              "..odccccdcccco..",
              "..odccccdccedo..",
              "...oooooooooo..."
            ],
            "pal": {"o":"#1b1b2f","b":"#8d9bb0","a":"#c9d3df","k":"#1b1b2f","d":"#7a4a22","c":"#f6efd8","e":"#d95b43"}
          },
          "line": "我是蠹，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              ".o.....o........",
              "obo...obo.......",
              ".obo.obo........",
              ".obo.obo........",
              "..obobo.........",
              "..oaaaooo.......",
              ".oakakabaoooo.o.",
              ".oaaaaaaaabaaobo",
              ".ooapaabaaaaaao.",
              "odcccccaacbacabo",
              "odcbbcccdcbbccdo",
              "odcbccccdccbccdo",
              "odccccccdcccecdo",
              "odddddddddddeddo",
              ".oooooooooooooo."
            ],
            "pal": {
              "o": "#1b1b2f",
              "b": "#8d9bb0",
              "a": "#c9d3df",
              "k": "#1b1b2f",
              "p": "#e87fa8",
              "d": "#7a4a22",
              "c": "#f6efd8",
              "e": "#d95b43"
            }
          },
          "line": "這句話，出處在哪裡？"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "...y........y...",
              ".Oygy..O...ygy..",
              "ObOy..ObO...yy..",
              ".ObO.ObO....ygy.",
              ".ObO.ObO.....y..",
              "..ObObO.........",
              "..OaaaOOO.......",
              ".OakakabaOOOO.O.",
              ".OaaaaaaaabaaObO",
              ".OOapaabaaaaaaO.",
              "OdcccccaacbacabO",
              "OdcbbcccdcbbccdO",
              "OdcbccccdccbccdO",
              "OdccccccdcccecdO",
              "OdddddddddddeddO",
              ".OOOOOOOOOOOOOO."
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#8a5a10",
              "g": "#f2c14e",
              "b": "#8d9bb0",
              "a": "#c9d3df",
              "k": "#1b1b2f",
              "p": "#e87fa8",
              "d": "#7a4a22",
              "c": "#f6efd8",
              "e": "#d95b43"
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
      "anchor": "與三郊商貿和行郊有關的算盤生物，待文史把關",
      "attr": "智識",
      "rarity": "普通",
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
          "sprite": EGGS.common,
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
              "....oo....ooo...",
              "...obboooobbbo..",
              "..obbbbbbbbbbo..",
              "..obekkkkkkebo..",
              "..obekkkkkkeeo..",
              "..obeeceeceebo..",
              "..obeeeeeeeebo..",
              "..obeceacceebo..",
              "..obbbbbbbbbbo..",
              "...obbboobbbo...",
              "....ooo..ooo...."
            ],
            "pal": {"o":"#1b1b2f","b":"#6b3f1e","e":"#fff3d6","k":"#1b1b2f","c":"#f2c14e","a":"#d95b43"}
          },
          "line": "我是珠珠，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "...o........oo..",
              "..obo......obbo.",
              ".oobboooooobbbo.",
              "obbbbbbbbbbbbbbo",
              "obeeccceeccceebo",
              "obeeckckkckceebo",
              "obeeccceeccceebo",
              "obddddddddddddbo",
              "obeeeeeeeeeeeebo",
              "obecceaecceaecbo",
              "obecceaecceaecbo",
              "obbbbbbbbbbbbbbo",
              ".oobbboooobbboo.",
              "..obbbo..obbbo..",
              "...ooo....ooo..."
            ],
            "pal": {"o":"#1b1b2f","b":"#6b3f1e","e":"#fff3d6","c":"#f2c14e","k":"#1b1b2f","d":"#c98f63","a":"#d95b43"}
          },
          "line": "噼啪，今天花了多少？"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "g..............g",
              "...O........OO..",
              "..ObO......ObbO.",
              ".OObbOOOOOObbbO.",
              "ObbbbbbbbbbbbbbO",
              "ObeeccceeccceebO",
              "ObeeckckkckceebO",
              "ObeeccceeccceebO",
              "ObddddddddddddbO",
              "ObeeeeeeeeeeeebO",
              "ObecceaecceaecbO",
              "ObecceaecceaecbO",
              "ObbbbbbbbbbbbbbO",
              ".OObbbOOOObbbOO.",
              "..ObbbO..ObbbO..",
              "g..OOO....OOO..."
            ],
            "pal": {
              "g": "#f2c14e",
              "O": "#8a5a10",
              "b": "#6b3f1e",
              "e": "#fff3d6",
              "c": "#f2c14e",
              "k": "#1b1b2f",
              "d": "#c98f63",
              "a": "#d95b43"
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
      "anchor": "與府城城門和防禦有關的石獅守護獸，待文史把關",
      "attr": "守護",
      "rarity": "稀有",
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
          "sprite": EGGS.rare,
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
              ".....oooo.......",
              "....obbbboo.....",
              "...obbbbbobo....",
              "..obbbbbbbbbo...",
              "..obbbbbbbbbo...",
              "..obbkkakkbbo...",
              "..obbaaaaaabo...",
              "..obbakkaaabo...",
              "...obkkkkkbo....",
              "..oeekkkkkeo....",
              "..oeeceeceeeo...",
              "...ooooooooo...."
            ],
            "pal": {"o":"#1b1b2f","b":"#7d7a70","k":"#1b1b2f","a":"#b9b4aa","e":"#8d6a3a","c":"#d6d2c8"}
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
              "o": "#1b1b2f",
              "b": "#7d7a70",
              "a": "#b9b4aa",
              "k": "#1b1b2f",
              "d": "#5aa8a0",
              "w": "#ffffff",
              "e": "#8d6a3a",
              "c": "#d6d2c8"
            }
          },
          "line": "我守著，你放心走。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "g....OO..OO....g",
              "....ObbOObbO....",
              "...OObbbbbbOOO..",
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
              "g.OOOOOOOOOOOO.."
            ],
            "pal": {
              "g": "#f2c14e",
              "O": "#8a5a10",
              "b": "#7d7a70",
              "a": "#b9b4aa",
              "k": "#1b1b2f",
              "d": "#5aa8a0",
              "w": "#ffffff",
              "e": "#8d6a3a",
              "c": "#d6d2c8"
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
      "anchor": "與磚造公共建築有關的貓形生物，待文史把關",
      "attr": "觀察",
      "rarity": "普通",
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
          "sprite": EGGS.common,
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
              "....oo...o......",
              "...oaaoooao.....",
              "...ocaaaaao.....",
              "...oakakkao.....",
              "..oaakakkaao....",
              "..oaakakkaao....",
              "...oaaaaaaaao...",
              "..oaabaabaaao...",
              "..oaabbbbaaao...",
              "...oabbbbaaao...",
              "...oaaaaaooo....",
              "....ooooo......."
            ],
            "pal": {"o":"#1b1b2f","a":"#c4553b","c":"#f0b090","k":"#1b1b2f","b":"#8f3a28"}
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
              "o": "#1b1b2f",
              "a": "#c4553b",
              "c": "#f0b090",
              "e": "#f2c14e",
              "k": "#1b1b2f",
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
              "g....O.....O....",
              "..y.OaO...OaO...",
              ".ygyOcaOOOcaO...",
              "..y.OaaaaaaaO...",
              "....OaaaaaaaO...",
              "...OaekaakeaaO..",
              "...OaekaakeaaO..",
              "..OdOaaapaaadOO.",
              "...OOaaaaaaaOOaO",
              "...OaabaaabaaaO.",
              "...OabbbbbbbaaaO",
              "...OaaaabaaaaaaO",
              "..yOabbbbbbbaaaO",
              ".ygyOaaaaaaaOaO.",
              "..y.OaaaaaaO.O..",
              ".....OOOOOO....."
            ],
            "pal": {
              "g": "#f2c14e",
              "O": "#8a5a10",
              "y": "#fff3b0",
              "a": "#c4553b",
              "c": "#f0b090",
              "e": "#f2c14e",
              "k": "#1b1b2f",
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
      "anchor": "與近代時間制度和時鐘有關的懷錶昆蟲，待文史把關",
      "attr": "智識",
      "rarity": "普通",
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
          "sprite": EGGS.common,
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
              "....o..o..o.....",
              "...oeoobooeo....",
              "....odabado.....",
              "....oakkaao.....",
              "...oackkccao....",
              "...oackkccco....",
              "...okkckkkko....",
              "...oaccckkco....",
              "...oackkccao....",
              "....oakkaao.....",
              "...odoaaaodo....",
              "....o.ooo.o....."
            ],
            "pal": {"o":"#1b1b2f","e":"#d95b43","b":"#b8892a","d":"#7a8fa0","a":"#f2c14e","k":"#1b1b2f","c":"#fff6dc"}
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
              "o": "#1b1b2f",
              "e": "#d95b43",
              "b": "#b8892a",
              "d": "#7a8fa0",
              "a": "#f2c14e",
              "k": "#1b1b2f",
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
              "g..O...OO...O..g",
              "..OeO.ObbO.OeO..",
              "...OdOObbOOdOy..",
              "....OdaaaadOygy.",
              "....OaakcaaO.y..",
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
              "g": "#f2c14e",
              "O": "#8a5a10",
              "e": "#d95b43",
              "b": "#b8892a",
              "d": "#7a8fa0",
              "y": "#fff3b0",
              "a": "#f2c14e",
              "k": "#1b1b2f",
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
      "anchor": "與電信和郵政有關的電報鳥，待文史把關",
      "attr": "溝通",
      "rarity": "稀有",
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
          "sprite": EGGS.rare,
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
              ".........oo.....",
              "........oeeo....",
              "......oooeeoo...",
              ".....oaaaakaco..",
              "..oooaaaaaaaco..",
              ".obbbbbbaaaoo...",
              ".obbbabbdddo....",
              ".obbbaadddboo...",
              "..odkddkdddkko..",
              ".oddkdkkdkkkkdo.",
              "..oooooooooooo.."
            ],
            "pal": {"o":"#1b1b2f","e":"#d95b43","a":"#5aa0e0","k":"#1b1b2f","c":"#f2c14e","b":"#2f6aa8","d":"#e8f0f8"}
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
              "oooooocoocoooooo",
              "oddkdddkdddddkdo",
              "odddddkdddkddddo",
              ".oooooooooooooo."
            ],
            "pal": {"o":"#1b1b2f","e":"#d95b43","a":"#5aa0e0","k":"#1b1b2f","c":"#f2c14e","b":"#2f6aa8","d":"#e8f0f8"}
          },
          "line": "嘀嘀嗒，有消息要傳！"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "g...........y...",
              "..y.......Oygy..",
              ".ygy.....OeOy...",
              "..y......OeeO...",
              "......OOOOaaaO..",
              "....OOaaaaakacO.",
              "...OaaaaaaaaaccO",
              "OOOOabbbaaaaaOO.",
              "bbbabbbbbaaaO...",
              "bbbbabbbdddO....",
              "bbbbaadddddOOOOO",
              "bbbbbbaaabbbbbbb",
              "OOOOOOcOOcOOOOOO",
              "OddkdddkdddddkdO",
              "OdddddkdddkddddO",
              ".OOOOOOOOOOOOOO."
            ],
            "pal": {
              "g": "#f2c14e",
              "y": "#fff3b0",
              "O": "#8a5a10",
              "e": "#d95b43",
              "a": "#5aa0e0",
              "k": "#1b1b2f",
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
      "anchor": "與廣播和街頭聲音有關的老收音機精怪，待文史把關",
      "attr": "溝通",
      "rarity": "稀有",
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
          "sprite": EGGS.rare,
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
              ".....o....o.....",
              "....ocooooco....",
              "...oaaaaaaaao...",
              "..oaabweebbbao..",
              "..oaawwwbwwaao..",
              ".odaakkwbkkaado.",
              "..oaabwwbbwbao..",
              "..oaaaaaaaaaao..",
              "...oaaaaaaaao...",
              "...obboooobbo...",
              "....oo....oo...."
            ],
            "pal": {
              "o": "#1b1b2f",
              "c": "#c9ccd2",
              "a": "#8b5a2b",
              "b": "#5a3a1e",
              "w": "#ffffff",
              "e": "#f2c14e",
              "d": "#8fd3f4",
              "k": "#1b1b2f"
            }
          },
          "line": "我是沙沙，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "...o........o...",
              "..oeo......oeo..",
              "...oco....oco...",
              "..oocoooooocoo..",
              ".oaaaaaaaaaaaao.",
              ".oabbbeeeebbbao.",
              ".oabbwwbbbwwbao.",
              "odabwwwwbwwwwado",
              "doabwkwwbwkwwaod",
              "odabbwwbbbwwbado",
              ".oabacacacacbao.",
              ".oabacacacacbao.",
              ".oaaaaaaaaaaaao.",
              "..obboooooobbo..",
              "..obbo....obbo..",
              "...oo......oo..."
            ],
            "pal": {
              "o": "#1b1b2f",
              "e": "#f2c14e",
              "c": "#c9ccd2",
              "a": "#8b5a2b",
              "b": "#5a3a1e",
              "w": "#ffffff",
              "d": "#8fd3f4",
              "k": "#1b1b2f"
            }
          },
          "line": "沙沙…各位聽眾晚安。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "g..O........O..g",
              "..OeO......OeO..",
              "...OcO....OcO...",
              "..OOcOOOOOOcOO..",
              ".OaaaaaaaaaaaaO.",
              ".OabbbeeeebbbaO.",
              ".OabbwwbbbwwbaO.",
              "OdabwwwwbwwwwadO",
              "dOabwkwwbwkwwaOd",
              "OdabbwwbbbwwbadO",
              ".OabacacacacbaO.",
              ".OabacacacacbaO.",
              ".OaaaaaaaaaaaaO.",
              "..ObbOOOOOObbO..",
              "..ObbO....ObbO..",
              "g..OO......OO..."
            ],
            "pal": {
              "g": "#f2c14e",
              "O": "#8a5a10",
              "e": "#f2c14e",
              "c": "#c9ccd2",
              "a": "#8b5a2b",
              "b": "#5a3a1e",
              "w": "#ffffff",
              "d": "#8fd3f4",
              "k": "#1b1b2f"
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
      "anchor": "與夜間商街有關的霓虹蛾，待文史把關",
      "attr": "行動",
      "rarity": "普通",
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
          "sprite": EGGS.common,
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
              "......o...o.....",
              "..oo.oeo.oeooo..",
              ".oaaooeeoeeaaao.",
              ".oaaacdkkdcaaao.",
              ".oaacccddccccao.",
              "..oaccaadaccao..",
              "...oaaaadaaao...",
              "....ooaddooo....",
              ".....obbbo......",
              "....obbbbbo.....",
              ".....ooooo......"
            ],
            "pal": {"o":"#1b1b2f","e":"#fff27a","a":"#e048c8","c":"#58e8f0","d":"#ffe6fa","k":"#1b1b2f","b":"#7a2a9c"}
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
              "o..oooodboooo..o",
              "eo...obddo....oe",
              "oo..obbobbo...oo",
              "ocoobbboobbo.oco",
              ".o..ooo..oo...o.",
              "................"
            ],
            "pal": {"o":"#1b1b2f","e":"#fff27a","a":"#e048c8","d":"#ffe6fa","c":"#58e8f0","k":"#1b1b2f","b":"#7a2a9c"}
          },
          "line": "夜晚才是我的舞台。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "g....O.....O...g",
              ".O..OeO...OeO.O.",
              "OaO..OeOOOeOOOaO",
              "OaaOOOeddOeOaaaO",
              "OaaccOdkkdOccaaO",
              "OaceccddddccecaO",
              "OaccccaddaccccaO",
              "OaaccaaddaaccaaO",
              ".OaaaaabdaaaaaO.",
              "..OaaaaddaaaaO..",
              "O..OOOOdbOOOO..O",
              "eO...ObddO....Oe",
              "OO..ObbObbO...OO",
              "OcOObbbOObbO.OcO",
              ".O..OOO..OO...O.",
              "g..............."
            ],
            "pal": {
              "g": "#f2c14e",
              "O": "#8a5a10",
              "e": "#fff27a",
              "a": "#e048c8",
              "d": "#ffe6fa",
              "c": "#58e8f0",
              "k": "#1b1b2f",
              "b": "#7a2a9c"
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
      "anchor": "與在地文學和民間文學有關的墨汁精靈，待文史把關",
      "attr": "溝通",
      "rarity": "稀有",
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
          "sprite": EGGS.rare,
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
              ".......o........",
              "......obo.......",
              ".....oaaao......",
              "....ocaaaao.....",
              "...oaawaaaao....",
              "...oakkwkkao....",
              "...oakkwkkao....",
              "....oaaaaaao....",
              "....oaaaaeeo....",
              ".....oaaaeo.....",
              "......oooo......"
            ],
            "pal": {"o":"#1b1b2f","b":"#1e2748","a":"#33406e","c":"#8fa0e8","w":"#ffffff","k":"#1b1b2f","e":"#d95b43"}
          },
          "line": "我是墨，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "................",
              "........o....o..",
              "..o....obo..oco.",
              ".oco..obboo..oo.",
              "..o..oaaaaao.oco",
              "....occaaaaao.o.",
              "...oaccaaaaaao..",
              "...oawwwawwwao..",
              "..oaawkwawkwaao.",
              "...oawkwawkwao..",
              "...oaaaaaaaaao..",
              "....oaaacaaeeo..",
              ".....oaaaaaeeo..",
              "......oaaoooo...",
              ".......oo.......",
              "................"
            ],
            "pal": {"o":"#1b1b2f","b":"#1e2748","c":"#8fa0e8","a":"#33406e","w":"#ffffff","k":"#1b1b2f","e":"#d95b43"}
          },
          "line": "我在想一句開頭。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "g..y............",
              "..ygy...O....O..",
              "..Oy...ObO..OcO.",
              ".OcO..ObbOO..OO.",
              "..O..OaaaaaO.OcO",
              "....OccaaaaaO.O.",
              "...OaccaaaaaaO..",
              "...OawwwawwwaO..",
              "..OaawkwawkwaaO.",
              "...OawkwawkwaO..",
              "...OaaaaaaaaaO..",
              "....OaaacaaeeO..",
              "..y..OaaaaaeeO..",
              ".ygy..OaaOOOO...",
              "..y....OO.......",
              "................"
            ],
            "pal": {
              "g": "#f2c14e",
              "y": "#fff3b0",
              "O": "#8a5a10",
              "b": "#1e2748",
              "c": "#8fa0e8",
              "a": "#33406e",
              "w": "#ffffff",
              "k": "#1b1b2f",
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
      "anchor": "與古蹟修復有關的工匠蜜蜂，待文史把關",
      "attr": "守護",
      "rarity": "普通",
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
          "sprite": EGGS.common,
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
              "....ooeeeoo.....",
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
            "pal": {"o":"#1b1b2f","e":"#f08a24","c":"#cfeaf5","k":"#1b1b2f","a":"#f2c14e","d":"#9aa3ad","b":"#3b2f2f"}
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
              "o": "#1b1b2f",
              "w": "#ffffff",
              "e": "#f08a24",
              "c": "#cfeaf5",
              "a": "#f2c14e",
              "k": "#1b1b2f",
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
              "............y...",
              "..y.....O..ygy..",
              ".ygy.OOOwOOOy...",
              "..yOOeeeeeeeOO..",
              "..OcceeeeeeeccO.",
              ".OcceeeeeeeecccO",
              ".OcccaaaaaaacccO",
              ".OcccakaaakacccO",
              ".OcccaaapaaacccO",
              ".OcccaaaaaaacddO",
              "..OcabbbbbbaacdO",
              "...OaaaaaaaaaOdO",
              "..y.ObbbbbbaOOdO",
              ".ygyOaaaaaaaOOdO",
              "..y..OOabaOO..O.",
              ".......OOO......"
            ],
            "pal": {
              "y": "#fff3b0",
              "O": "#8a5a10",
              "g": "#f2c14e",
              "w": "#ffffff",
              "e": "#f08a24",
              "c": "#cfeaf5",
              "a": "#f2c14e",
              "k": "#1b1b2f",
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
      "anchor": "與數位典藏和三維掃描有關的拓印魚，待文史把關",
      "attr": "觀察",
      "rarity": "稀有",
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
          "sprite": EGGS.rare,
          "line": "蛋殼閃著淡淡的光。"
        },
        "baby": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "eee..........eee",
              "e..............e",
              "e..............e",
              "................",
              "................",
              ".........o......",
              "........obo.....",
              ".......obbbo....",
              "...ooooabbaoo...",
              "..obbaaaaaakko..",
              "..obbaaaaaakko..",
              "..obbdaaddadao..",
              "..obooaaaaaao...",
              "e..o..oaaaao...e",
              "e......obbbo...e",
              "eee.....ooo..eee"
            ],
            "pal": {"e":"#f2c14e","o":"#1b1b2f","b":"#2a8d7e","a":"#46c7b0","k":"#1b1b2f","d":"#ff6fb5"}
          },
          "line": "我是拓，請多指教。"
        },
        "adult": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "eee..........eee",
              "e........o.....e",
              "e.......obo....e",
              ".......obbo.....",
              ".....oobbbbo....",
              "oo..oaaaaaaao...",
              "bbooaacaaacwwo..",
              "bbbaacaaacawkao.",
              "bbbaaaaacabacao.",
              "bbddddddddbddao.",
              "bbooaacaaabaao..",
              "oo..oaaaaaaao...",
              ".....ooobbbo....",
              "e......obbo....e",
              "e.......oo.....e",
              "eee..........eee"
            ],
            "pal": {
              "e": "#f2c14e",
              "o": "#1b1b2f",
              "b": "#2a8d7e",
              "a": "#46c7b0",
              "c": "#9ef0dc",
              "w": "#ffffff",
              "k": "#1b1b2f",
              "d": "#ff6fb5"
            }
          },
          "line": "框好了嗎？再往左一點。"
        },
        "awake": {
          "sprite": {
            "w": 16,
            "h": 16,
            "rows": [
              "eee..........eee",
              "e.y......O.....e",
              "eygy....ObO..y.e",
              "..y....ObbO.ygy.",
              ".....OObbbbO.y..",
              "OO..OaaaaaaaO...",
              "bbOOaacaaacwwO..",
              "bbbaacaaacawkaO.",
              "bbbaaaaacabacaO.",
              "bbddddddddbddaO.",
              "bbOOaacaaabaaO..",
              "OO..OaaaaaaaO...",
              "..y..OOObbbO....",
              "eygy...ObbO....e",
              "e.y.....OO.....e",
              "eee..........eee"
            ],
            "pal": {
              "e": "#f2c14e",
              "y": "#fff3b0",
              "O": "#8a5a10",
              "g": "#f2c14e",
              "b": "#2a8d7e",
              "a": "#46c7b0",
              "c": "#9ef0dc",
              "w": "#ffffff",
              "k": "#1b1b2f",
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
          "sprite": EGGS.legend,
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
              "....oaaaaao.....",
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
            "pal": {"o":"#1b1b2f","a":"#b9a0f0","c":"#e8dcff","k":"#1b1b2f","y":"#fff3b0","d":"#8fe0ff","b":"#7a5af8"}
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
              "o": "#1b1b2f",
              "c": "#e8dcff",
              "a": "#b9a0f0",
              "w": "#ffffff",
              "y": "#fff3b0",
              "k": "#1b1b2f",
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
              "g..............g",
              "..y..OOOOOOO....",
              ".ygyOcaaaaaaO...",
              "..yOcaaaaaawaO..",
              "..OaaaacccaaaaO.",
              ".OaaaaccyccaaaaO",
              ".OaaaccyyyccaaaO",
              ".OaaakccycckaaaO",
              "..OaaaacpcaaaaO.",
              ".OaOaOaOaOaOaOaO",
              "..O.OddOOddOOdO.",
              "...ObOObbOObbO..",
              "....OddOOddOOdO.",
              "...ObOObbOObbO..",
              "....OddOOddOOdO.",
              ".....OO..OO..O.."
            ],
            "pal": {
              "g": "#f2c14e",
              "y": "#fff3b0",
              "O": "#8a5a10",
              "c": "#e8dcff",
              "a": "#b9a0f0",
              "w": "#ffffff",
              "k": "#1b1b2f",
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
