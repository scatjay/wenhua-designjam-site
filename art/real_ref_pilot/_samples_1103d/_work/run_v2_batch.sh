#!/bin/bash
# v2 批次接力：生圖 → 去字閘門兩輪 → 像素化（忠實 median 48）。用法：bash run_v2_batch.sh 工單.json 日誌前綴
set -u
cd "$(dirname "$0")"
J=$1; L=$2; R=E:/Downloads/_walk_refs/_raw/_samples_1103d
export WAIT_GB=${WAIT_GB:-78} EST_GB=${EST_GB:-30} PYTHONUNBUFFERED=1
python -X utf8 pipe_v2.py "$J" "${L}_gen.json" 2>&1 | grep -v "^INFO"
NAMES=$(python -X utf8 -c "import json,sys;print(' '.join(j['name'] for j in json.load(open(sys.argv[1],encoding='utf-8'))))" "$J")
P1=""; for n in $NAMES; do [ -f "$R/$n.png" ] && P1="$P1 $R/$n.png"; done
PROTECT="${PROTECT_LIST:-stone lion. lion statue. dragon pillar}" python -X utf8 detext_v2.py $P1 2>&1 | grep -v "^INFO"; cp "$R/detext_v2_log.json" "${L}_dt1.json"
P2=""; for n in $NAMES; do [ -f "$R/${n}_dt.png" ] && P2="$P2 $R/${n}_dt.png"; done
PROTECT="${PROTECT_LIST:-stone lion. lion statue. dragon pillar}" python -X utf8 detext_v2.py $P2 2>&1 | grep -v "^INFO"; cp "$R/detext_v2_log.json" "${L}_dt2.json"
for n in $NAMES; do
  [ -f "$R/${n}_dt_dt.png" ] && python -X utf8 pixelize_v2.py scene "$n" "$R/${n}_dt_dt.png" auto 48 2>/dev/null | tail -1
done
echo BATCH_DONE
