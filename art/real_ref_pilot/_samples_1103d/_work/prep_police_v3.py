# 警察署 v3 輸入：POL2 原照只取中央弧形凸出區（放大，建築約佔畫面 55-60%），塗掉旗桿與國旗、天線、騎士，上補天（約 28%）、下補地（約 13%）；只取結構（深度＋canny），顏色交給提示詞
import numpy as np, cv2
from PIL import Image
src = cv2.cvtColor(np.array(Image.open('E:/Downloads/_walk_refs/_cand2/scene/POL2.jpg').convert('RGB')), cv2.COLOR_RGB2BGR)   # 1280x960
mask = np.zeros(src.shape[:2], np.uint8)
mask[50:160, 650:690] = 255      # 國旗
mask[150:575, 672:688] = 255     # 旗桿（穿過建築立面，只約 10 px 寬，遮罩要窄才不會抹糊立面）
mask[283:333, 622:676] = 255     # 警徽（鳥形）
mask[85:330, 770:850] = 255      # 屋頂天線
mask[835:960, 660:860] = 255     # 前景騎士與機車（下緣）
src = cv2.inpaint(src, mask, 5, cv2.INPAINT_TELEA)
src[600:638, 566:796] = (205, 224, 235)   # 橫額上的中文字：整塊塗成奶油色平面（BGR），避免 canny 把字形當結構帶進來
img = Image.fromarray(cv2.cvtColor(src, cv2.COLOR_BGR2RGB))
crop = img.crop((290, 200, 990, 900))                  # 700x700：弧形凸出、陽台、門廊
W = 1100
s = W / crop.size[0]
ch = int(crop.size[1] * s)                             # 1100
H = int(W * 16 / 9)                                    # 1956
top = int(H * 0.28)
cv = Image.new('RGB', (W, H), (232, 238, 244))
cv.paste(crop.resize((W, ch), Image.LANCZOS), (0, top))
ground = Image.new('RGB', (W, H - top - ch), (190, 186, 178))
cv.paste(ground, (0, top + ch))
out = 'E:/ComfyUI_windows_portable_0529/ComfyUI/input/v2pol3_canvas.png'
cv.resize((W // 2, H // 2), Image.LANCZOS).save(out)
cv.resize((W // 4, H // 4), Image.LANCZOS).save('v2pol3_canvas_preview.png')
print(out, cv.size, 'building y', top, '-', top + ch, 'share %.2f' % (ch / H), 'sky %.2f ground %.2f' % (top / H, (H - top - ch) / H))
