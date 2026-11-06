#!/bin/bash
# 人物批次：pipe_v2 出圖（TEXTSCAN=1 逐張文字偵測）→ post4.py char（128、平底、共用 96 色盤）。用法：bash run_v2_chars.sh 工單.json 日誌前綴
set -u
cd "$(dirname "$0")"
J=$1; L=$2; R=E:/Downloads/_walk_refs/_raw/_samples_1103d
export PYTHONUNBUFFERED=1 TEXTSCAN=1
python -X utf8 pipe_v2.py "$J" "${L}_gen.json" 2>&1 | grep -v "^INFO"
for n in $(python -X utf8 -c "import json,sys;print(' '.join(j['name'] for j in json.load(open(sys.argv[1],encoding='utf-8'))))" "$J"); do
  [ -f "$R/$n.png" ] && python -X utf8 post4.py char "$n" "$R/$n.png" 2>/dev/null | tail -1
done
echo CHARS_DONE
