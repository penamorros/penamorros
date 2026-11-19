# Pinyon Script, with the capitals C and V taken from Italianno (Pinyon's are looped forms that read badly), each scaled to Pinyon's own
# capital height, set on the same baseline, and the letters after it moved over so the spacing stays natural.
import json, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
def load(p):
    tt = TTFont(p); return dict(tt=tt, font=hb.Font(hb.Face(hb.Blob.from_file_path(p))), gs=tt.getGlyphSet(), order=tt.getGlyphOrder(), upem=tt['head'].unitsPerEm, cmap=tt.getBestCmap())
def bounds(gs, name, T=(1, 0, 0, 1, 0, 0)):
    bp = BoundsPen(gs); gs[name].draw(TransformPen(bp, T)); return bp.bounds
def word(base, text, alt=None, caps='', size=1.0, gap=0.0):
    S = 100 / base['upem']
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties(); hb.shape(base['font'], buf, {'kern': True, 'liga': True, 'calt': True})
    x = 0.0; shift = 0.0; glyphs = []; box = [1e9, 1e9, -1e9, -1e9]
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        ch = text[info.cluster]; bname = base['order'][info.codepoint]
        ox = (x + pos.x_offset) * S + shift
        if alt and ch in caps:
            ob = bounds(base['gs'], bname, (S, 0, 0, -S, ox, 0))          # where the base capital stood
            an = alt['cmap'][ord(ch)]; ab = bounds(alt['gs'], an)
            k = (ob[3] - ob[1]) / ((ab[3] - ab[1]) or 1) * size          # same height as the base capital
            # baseline-aligned: the borrowed letter's bottom sits where the base letter's bottom was
            T = (k, 0, 0, -k, ob[0] - ab[0] * k, ob[3] + ab[1] * k - (ab[3] - ab[1]) * k + (ab[3] - ab[1]) * k)
            T = (k, 0, 0, -k, ob[0] - ab[0] * k, 0 + 0)
            # vertical: put its baseline at 0 like the rest (fonts share a baseline)
            gs, name = alt['gs'], an
            nb = bounds(gs, name, T)
            shift += (nb[2] - ob[2]) + gap
        else:
            T = (S, 0, 0, -S, ox, -pos.y_offset * S); gs, name = base['gs'], bname
        pen = SVGPathPen(gs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
        gs[name].draw(TransformPen(pen, T)); b = bounds(gs, name, T)
        if pen.getCommands() and b:
            box = [min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3])]; glyphs.append(pen.getCommands())
        x += pos.x_advance
    pad = 4
    return {'x': round(box[0] - pad, 1), 'y': round(box[1] - pad, 1), 'w': round(box[2] - box[0] + 2 * pad, 1), 'h': round(box[3] - box[1] + 2 * pad, 1), 'g': glyphs}
