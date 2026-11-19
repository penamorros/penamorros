# ink drawing (raster) -> SVG of centre-line pen strokes, each with its own width and a draw-order delay (left to right)
import sys, json
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize, remove_small_objects
from scipy.ndimage import distance_transform_edt, label

src, out = sys.argv[1], sys.argv[2]
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0   # output units per source pixel
minlen = float(sys.argv[4]) if len(sys.argv) > 4 else 6
nocrop = len(sys.argv) > 5 and sys.argv[5] == 'full'
im = np.asarray(Image.open(src).convert('L')).astype(np.float32)
ink = im < 150
ink = remove_small_objects(ink, 12)
ys, xs = np.where(ink)
pad = 4
y0, y1, x0, x1 = (0, ink.shape[0], 0, ink.shape[1]) if nocrop else (max(0, ys.min() - pad), ys.max() + pad, max(0, xs.min() - pad), xs.max() + pad)
ink = ink[y0:y1, x0:x1]
H, W = ink.shape
dist = distance_transform_edt(ink)
sk = skeletonize(ink)
# neighbours
P = np.pad(sk, 1)
nb = sum(np.roll(np.roll(P, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)[1:-1, 1:-1] * sk
pts = set(zip(*np.where(sk)))
deg = {p: int(nb[p]) for p in pts}
N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
def nbrs(p):
    y, x = p
    return [(y + dy, x + dx) for dy, dx in N8 if (y + dy, x + dx) in pts]
visited = set()  # visited edges as frozenset pairs
def ekey(a, b): return (a, b) if a < b else (b, a)
paths = []
nodes = [p for p in pts if deg[p] != 2]
for n in nodes:
    for m in nbrs(n):
        if ekey(n, m) in visited: continue
        path = [n, m]; visited.add(ekey(n, m)); prev, cur = n, m
        while deg[cur] == 2:
            nxt = [q for q in nbrs(cur) if q != prev and ekey(cur, q) not in visited]
            if not nxt: break
            q = nxt[0]; visited.add(ekey(cur, q)); path.append(q); prev, cur = cur, q
        paths.append(path)
# cycles (all degree 2)
for p in pts:
    if deg[p] == 2:
        for m in nbrs(p):
            if ekey(p, m) in visited: continue
            path = [p, m]; visited.add(ekey(p, m)); prev, cur = p, m
            while True:
                nxt = [q for q in nbrs(cur) if q != prev and ekey(cur, q) not in visited]
                if not nxt: break
                q = nxt[0]; visited.add(ekey(cur, q)); path.append(q); prev, cur = cur, q
            paths.append(path)
def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float)
    arr = np.array(pts, float); d = b - a; L = np.hypot(*d)
    if L == 0: dd = np.hypot(*(arr - a).T)
    else: dd = np.abs(d[0] * (arr[:, 1] - a[1]) - d[1] * (arr[:, 0] - a[0])) / L
    i = int(dd.argmax())
    if dd[i] > eps: return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]
def smooth(arr, it=2):
    arr = np.array(arr, float)
    for _ in range(it):
        if len(arr) < 3: break
        arr[1:-1] = arr[1:-1] * 0.5 + (arr[:-2] + arr[2:]) * 0.25
    return arr
out_paths = []
for path in paths:
    L = sum(np.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]) for i in range(1, len(path)))
    if L < minlen: continue
    w = float(np.median([dist[p] for p in path])) * 2
    sm = smooth(path)
    simp = rdp([tuple(p) for p in sm], 0.6)
    xy = [(x * scale, y * scale) for y, x in simp]
    cx = float(np.mean([p[0] for p in xy]))
    out_paths.append((cx, max(0.6, w * scale), xy, L))
out_paths.sort(key=lambda t: t[0])
Wo, Ho = W * scale, H * scale
def fmt(v): return ('%.1f' % v).rstrip('0').rstrip('.')
parts = []
for cx, w, xy, L in out_paths:
    d = 'M' + ' '.join(fmt(x) + ',' + fmt(y) for x, y in xy[:1]) + 'L' + ' '.join(fmt(x) + ',' + fmt(y) for x, y in xy[1:])
    parts.append(f'<path d="{d}" stroke-width="{fmt(round(w * 2) / 2)}" style="--t:{cx / Wo:.3f}"/>')
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(Wo)} {fmt(Ho)}" preserveAspectRatio="xMidYMax meet"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' + ''.join(parts) + '</g></svg>'
open(out, 'w').write(svg)
print(out, 'paths', len(out_paths), 'size', len(svg) // 1024, 'KB', 'viewBox', fmt(Wo), fmt(Ho))
