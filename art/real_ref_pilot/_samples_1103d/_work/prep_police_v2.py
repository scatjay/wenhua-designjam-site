# 警察署 v2 輸入：POL2 原照（CC BY 2.0）裁出建築，放到 9:16 畫布（上補天、下補地），只取結構（深度＋canny），色彩交給提示詞
import sys
from PIL import Image
src = Image.open('E:/Downloads/_walk_refs/_cand2/scene/POL2.jpg').convert('RGB')  # 1280x960
crop = src.crop((90, 60, 1190, 800))      # 建築＋樹，去掉底部機車騎士
W = 1100; H = int(W * 16 / 9)               # 1956
cv = Image.new('RGB', (W, H), (232, 238, 244))
top = int(H * 0.36)                          # 建築放在中下段，地平線落在下三分之一附近
cv.paste(crop, (0, top))
ground = Image.new('RGB', (W, H - top - crop.size[1]), (190, 186, 178))
cv.paste(ground, (0, top + crop.size[1]))
out = 'E:/ComfyUI_windows_portable_0529/ComfyUI/input/v2pol_canvas.png'
cv.resize((W // 2, H // 2), Image.LANCZOS).save(out)
print(out, cv.size, 'building y', top, '-', top + crop.size[1])
