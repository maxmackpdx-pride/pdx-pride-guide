import json, html
# Three new Boardz card directions: punk paper meets cyberspace. Real Giftz motifs, photos and Cut Type
# fonts from the canvas uploads. Tap a card: it grows into its open card through a glitch.
B = lambda i: '/_blob/' + i
FONTS = B('b01729d058b6fd91b72e73aef0883131')          # Cut Type + Boardz faces (embedded)
PAPER = B('65df8fba4750b14b8a6c70c4f05d6b9d')          # punk paper materials scan
LOGO = B('f657bd40cc57c22f623c88514d3064a2')           # Giftz logo
POSTS = {
  'iso': dict(type='IN SEARCH OF', value='IN SEARCH OF', title='ISO: a working mini fridge for a new place',
              desc='Just moved into a studio and could really use a small fridge. Can pick up anywhere in town, happy to trade baked goods.',
              area='N Portland', cat='Appliances', pickup='Can pick up', photo=B('0d581a31bacf25136db3885197106466'),
              hero=B('74608fe2001659ea77e9ede12648b865'), wire=B('65fdccbcf0f960eb186fa1cc9dce5848'),
              net=[B('1a93af24feb1018d07912913d3e65299'), B('d4dc408c6733fe053c49d4420b3afb0e'), B('4b7808ce1c35716da2f36bd7589319a6')],
              seeking=True, action='I HAVE THIS', count='0 hands up', num='12'),
  'give': dict(type='GIVING AWAY', value='NEW HOME?', title='Free moving boxes (about 20)',
               desc='Broken down and clean, all sizes. Great for a move. Porch pickup, first come first served.',
               area='SE Portland', cat='Household', pickup='Porch pickup', photo=B('0c8666627ccf0549a0709ea3a378843a'),
               hero=B('ff6dd0e7d3a893c557036316ca2b7007'), wire=B('a8dbc996958e9b9b37b74d57755a43d0'),
               net=[B('908149a2a7881508173827249fb42461'), B('7579a17b3218836a3267bc68be1e457e'), B('2b6477e813e62610161df2541616a735')],
               seeking=False, action="I'M INTERESTED", count='1 of 3 hands up', num='10'),
}
MIX = ['CutMixPaper', 'CutMixRough', 'CutMixReverse', 'CutMixMixed', 'CutMixLoose', 'CutMixRansom', 'CutMixWorn', 'CutMixTall']
e = html.escape
RIM = '<span class="zt-rim" aria-hidden="true"></span><div class="zt-face">'
PAPERCSS = B('d794eaf651e71acb38744eb7f753a379')

def ransom(text, seed):
    # Stable per-letter mix of the Cut Type styles, like RansomText (seeded, never rerolled).
    # Letters stay grouped by word so lines only break between words.
    out, word = [], []
    for i, ch in enumerate(text + ' '):
        if ch == ' ':
            if word: out.append('<span class="rz-w">%s</span>' % ''.join(word)); word = []
            continue
        k = (i * 7 + seed * 3) % len(MIX)
        rot = ((i * 37 + seed * 11) % 9) - 4
        word.append('<span class="rz-l rz-%d" style="font-family:%s;rotate:%ddeg">%s</span>' % (k % 4, MIX[k], rot, e(ch)))
    return '<span class="rz-gap"> </span>'.join(out)

def net(p, flip):
    f = ' zn-flip' if flip else ''
    return ('<span class="zn%s" aria-hidden="true"><img class="zn-back" src="%s" alt=""><img class="zn-mid" src="%s" alt=""><img class="zn-front" src="%s" alt=""></span>'
            % (f, p['net'][0], p['net'][1], p['net'][2]))

def heart(key):
    return ('<button class="zheart" type="button" aria-label="Save" aria-pressed="{{ s.%s_saved }}" onClick="{{ h.%s }}">'
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="{{ s.%s_fill }}" stroke="currentColor" stroke-width="2"/></svg></button>') % (key, key, key)

def opener(key, label):
    return '<button class="zopen-hit" type="button" aria-label="Open %s" onClick="{{ t.%s }}"></button>' % (e(label), key)

def closer(key):
    return ('<button class="zclose" type="button" aria-label="Close" onClick="{{ t.%s }}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg></button>') % key

def details(p):
    # Design-system tags: Material 3 chip shape, one solid accent per group (the post type).
    tags = [p['type'], p['cat'].upper(), p['pickup'].upper(), p['area'].upper(), p['count'].upper()]
    return '<ul class="ztags" aria-label="Details">' + ''.join('<li class="ztag%s">%s</li>' % (' ztag--solid' if i == 0 else '', e(t)) for i, t in enumerate(tags)) + '</ul>'

def strips(text, cls):
    # Barlow Condensed title on torn black strips, one strip per word.
    return '<h3 class="%s">%s</h3>' % (cls, ''.join('<span>%s</span>' % e(w) for w in text.upper().split(' ')))


def _rng(seed):
    h = 0
    for ch in seed:
        h = (h * 131 + ord(ch)) & 0xffffffff
    def rnd():
        nonlocal h
        h = (h * 1103515245 + 12345) & 0x7fffffff
        return h / 0x7fffffff
    return rnd

# Decay keyframes: the card's own layers lose random chunks for a beat (the photo or paper drops out to the
# wire network underneath, the torn rim loses a bite, the hero sticker loses a band and shows its wire
# companion). Several seeded sets so no two layers share a pattern.
def _hole(x1, y1, x2, y2):
    return ('polygon(evenodd,-10%% -10%%,110%% -10%%,110%% 110%%,-10%% 110%%,-10%% -10%%,'
            '%.0f%% %.0f%%,%.0f%% %.0f%%,%.0f%% %.0f%%,%.0f%% %.0f%%,%.0f%% %.0f%%)' % (x1, y1, x2, y1, x2, y2, x1, y2, x1, y1))
NONE = _hole(0, 0, 0, 0)
def decay_keyframes(n_sets=8):
    css = ''
    for k in range(n_sets):
        r = _rng('decay%d' % k)
        frames = {0: NONE}
        t = 6 + r() * 20
        while t < 92:
            edge = int(r() * 4)
            lo, ln = r() * 70, 14 + r() * 26
            dp = 10 + r() * 22
            if edge == 0: box = (100 - dp, lo, 112, lo + ln)
            elif edge == 1: box = (lo, 100 - dp, lo + ln, 112)
            elif edge == 2: box = (-12, lo, dp, lo + ln)
            else: box = (lo, 30 + r() * 40, lo + ln, 30 + r() * 40 + 8 + r() * 10)  # a band across the middle
            w = 1 + r() * 2.5
            frames[t] = _hole(*box)
            if r() < .5:  # second stutter frame, the chunk shifts
                frames[t + w * .45] = _hole(box[0] + 3, box[1] - 2, box[2] + 3, box[3] + 2)
            frames[t + w] = NONE
            t += w + 14 + r() * 26
        frames[100] = NONE
        css += '@keyframes zd-%d{%s}\n' % (k, ''.join('%.2f%%{clip-path:%s}' % (q, v) for q, v in sorted(frames.items())))
    return css

def decay_vars(key):
    # Each layer of each card gets its own pattern, length and phase, so nothing on the board fires in sync.
    r = _rng('v' + key)
    out = []
    for layer in ('rim', 'skin', 'hero', 'jit'):
        out.append('--zd-%s-n:zd-%d;--zd-%s-d:%.2fs;--zd-%s-o:%.2fs' % (layer, int(r() * 8), layer, 7 + r() * 9, layer, -r() * 16))
    return ';'.join(out)

SEAM = '<span class="zseam" aria-hidden="true"></span>'

# ---------- 1. Wheatpaste ----------
def wp_closed(k, p, flip, key):
    return ('<article class="wp wp-card zt%s">' % (' z-seek' if p['seeking'] else '') + RIM +
            '<span class="wp-photo"><img src="%s" alt=""></span><span class="wp-dots" aria-hidden="true"></span>' % p['photo'] + net(p, flip) +
            '<span class="wp-paper" aria-hidden="true"></span><img class="wp-hero wp-wire" src="%s" alt="" aria-hidden="true"><img class="wp-hero" src="%s" alt="" aria-hidden="true">' % (p['wire'], p['hero']) +
            '<span class="wp-tape">%s</span><span class="wp-area">%s</span>' % (p['type'], e(p['area'].upper())) +
            '<h3 class="wp-title">%s</h3>' % ''.join('<span>%s</span>' % e(w) for w in p['title'].upper().split(' ')) +
            ('' if p['seeking'] else '<span class="wp-value">%s</span>' % ransom(p['value'], 2)) + '<img class="wp-logo" src="%s" alt="Giftz">' % LOGO +
            opener(key, p['title']) + heart(key) + '</div></article>')

def wp_open(k, p, flip, key):
    return ('<article class="wp wp-open zt zglitch%s">' % (' z-seek' if p['seeking'] else '') + RIM + closer(key) +
            '<div class="wp-ohead"><span class="wp-photo"><img src="%s" alt=""></span><span class="wp-dots" aria-hidden="true"></span>' % p['photo'] + net(p, flip) +
            '<img class="wp-hero wp-wire" src="%s" alt="" aria-hidden="true"><img class="wp-hero" src="%s" alt="" aria-hidden="true"><span class="wp-tape">%s</span><span class="wp-area">%s</span>' % (p['wire'], p['hero'], p['type'], e(p['area'].upper())) +
            '<h3 class="wp-title wp-title--open">%s</h3></div>' % ''.join('<span>%s</span>' % e(w) for w in p['title'].upper().split(' ')) + SEAM +
            '<div class="wp-strips"><p class="wp-strip">%s</p>%s<div class="wp-actions"><button class="zbtn zbtn--fill" type="button">%s</button><button class="zbtn" type="button">SHARE</button>%s</div></div>'
            % (e(p['desc']), details(p), e(p['action']), heart(key)) + '</div></article>')

# ---------- 2. Terminal zine ----------
def tz_closed(k, p, flip, key):
    return ('<article class="tz tz-card%s">' % (' z-seek' if p['seeking'] else '') +
            '<div class="tz-paper"><span class="tz-stamp">%s</span><img class="tz-hero" src="%s" alt="" aria-hidden="true">' % (p['type'], p['hero']) +
            '<h3 class="tz-title">%s</h3></div>' % ransom(p['title'].upper()[:28] + ('…' if len(p['title']) > 28 else ''), int(p['num'])) +
            '<div class="tz-term">' + net(p, flip) + '<img class="tz-wire" src="%s" alt="" aria-hidden="true">' % p['wire'] +
            '<p class="tz-line"><b>&gt; TYPE</b> %s</p><p class="tz-line"><b>&gt; AREA</b> %s</p><p class="tz-line"><b>&gt; PICK</b> %s<i class="tz-cursor"></i></p>' % (p['type'], e(p['area'].upper()), e(p['pickup'].upper())) +
            '<img class="tz-logo" src="%s" alt="Giftz"></div>' % LOGO + opener(key, p['title']) + heart(key) + '</article>')

def tz_open(k, p, flip, key):
    return ('<article class="tz tz-open zglitch%s">' % (' z-seek' if p['seeking'] else '') + closer(key) +
            '<div class="tz-paper tz-paper--open"><span class="tz-stamp">%s</span><img class="tz-hero" src="%s" alt="" aria-hidden="true">' % (p['type'], p['hero']) +
            '<h3 class="tz-title tz-title--open">%s</h3></div>' % ransom(p['title'].upper(), int(p['num'])) +
            '<div class="tz-term tz-term--open">' + net(p, flip) + '<img class="tz-wire" src="%s" alt="" aria-hidden="true">' % p['wire'] +
            '<img class="tz-photo" src="%s" alt="Photo for %s">' % (p['photo'], e(p['title'])) +
            '<p class="tz-line"><b>&gt; TYPE</b> %s</p><p class="tz-line"><b>&gt; AREA</b> %s</p><p class="tz-line"><b>&gt; CATEGORY</b> %s</p><p class="tz-line"><b>&gt; PICKUP</b> %s</p><p class="tz-line"><b>&gt; HANDS</b> %s</p>'
            % (p['type'], e(p['area'].upper()), e(p['cat'].upper()), e(p['pickup'].upper()), e(p['count'].upper())) +
            '<p class="tz-desc">%s<i class="tz-cursor"></i></p>' % e(p['desc']) +
            '<div class="tz-actions"><button class="zbtn zbtn--fill" type="button">[ %s ]</button><button class="zbtn" type="button">[ SHARE ]</button>%s</div></div>' % (e(p['action']), heart(key)) + '</article>')

# ---------- 3. Cutout specimen ----------
def cs_closed(k, p, flip, key):
    return ('<article class="cs cs-card zt%s">' % (' z-seek' if p['seeking'] else '') + RIM +
            '<div class="cs-clip">' + net(p, flip) + '<img class="cs-hero cs-wire" src="%s" alt="" aria-hidden="true"><img class="cs-hero" src="%s" alt="" aria-hidden="true"></div>' % (p['wire'], p['hero']) +
            '<span class="cs-tag cs-tag--type">%s</span><span class="cs-tag cs-tag--area">%s</span>' % (p['type'], e(p['area'].upper())) +
            strips(p['title'], 'cs-title') +
            '<img class="cs-logo" src="%s" alt="Giftz">' % LOGO + opener(key, p['title']) + heart(key) + '</div></article>')

def cs_open(k, p, flip, key):
    return ('<article class="cs cs-open zt zglitch%s">' % (' z-seek' if p['seeking'] else '') + RIM + closer(key) +
            '<div class="cs-case">' + net(p, flip) + '<img class="cs-hero cs-hero--open cs-wire" src="%s" alt="" aria-hidden="true"><img class="cs-hero cs-hero--open" src="%s" alt="" aria-hidden="true">' % (p['wire'], p['hero']) +
            '<span class="cs-tag cs-tag--type">%s</span><span class="cs-tag cs-tag--area">%s</span><span class="cs-no">SPECIMEN NO. %s · %s</span></div>' % (p['type'], e(p['area'].upper()), p['num'], e(p['cat'].upper())) + SEAM +
            '<div class="cs-sheet">%s<p class="cs-desc">%s</p>%s'
            % (strips(p['title'], 'cs-title cs-title--open'), e(p['desc']), details(p)) +
            '<div class="cs-actions"><button class="zbtn zbtn--fill" type="button">%s</button><button class="zbtn" type="button">SHARE</button>%s</div></div></div></article>' % (e(p['action']), heart(key)))

def small_title(text, cls):
    # Small card: three lines max, wrapped here by estimated strip width (Barlow Condensed 900 at 12.5px)
    # with explicit breaks so the browser can't rewrap. Longer titles end on an ellipsis, like live.
    wpx = lambda w: len(w) * 9.4 + 8
    lines, cur, full = [[]], 0, True
    toks = []
    for w in text.upper().split(' '):  # keep a parenthetical together, e.g. (ABOUT 20)
        if toks and toks[-1].startswith('(') and not toks[-1].endswith(')'): toks[-1] += '\u00a0' + w
        else: toks.append(w)
    for w in toks:
        need = wpx(w) + (3 if cur else 0)
        if cur + need > (116 if len(lines) < 3 else 72):  # line three stops short of the heart
            if len(lines) == 3:
                full = False; break
            lines.append([]); cur = 0; need = wpx(w)
        lines[-1].append(w); cur += need
    if not full:
        last = lines[-1]
        while len(last) > 1 and (last[-1].startswith('(') or last[-1] in ('A', 'AN', 'THE', 'FOR', 'OF', 'TO', 'AND') or cur + 9 > 72):
            cur -= wpx(last.pop()) + 3
        last[-1] += '\u2026'
    return '<h3 class="%s">%s</h3>' % (cls, '<i class="zs-br"></i>'.join(''.join('<span>%s</span>' % e(w) for w in l) for l in lines))

def wp_small(k, p, flip, key):
    # Small card, live size (136 x 150). Photo, tape, two-line headline, hero corner, heart. Opens the same open card.
    return ('<article class="wp zs zt%s">' % (' z-seek' if p['seeking'] else '') + RIM +
            '<span class="wp-photo"><img src="%s" alt=""></span><span class="wp-dots" aria-hidden="true"></span>' % p['photo'] + net(p, flip) +
            '<img class="zs-hero zs-wire" src="%s" alt="" aria-hidden="true"><img class="zs-hero" src="%s" alt="" aria-hidden="true">' % (p['wire'], p['hero']) +
            '<span class="wp-tape zs-tape">%s</span>' % p['type'] + small_title(p['title'], 'wp-title zs-title') +
            opener(key, p['title']) + heart(key) + '</div></article>')

def cs_small(k, p, flip, key):
    return ('<article class="cs zs zt%s">' % (' z-seek' if p['seeking'] else '') + RIM +
            '<div class="cs-clip">' + net(p, flip) + '<img class="zs-hero zs-wire" src="%s" alt="" aria-hidden="true"><img class="zs-hero" src="%s" alt="" aria-hidden="true"></div>' % (p['wire'], p['hero']) +
            '<span class="cs-tag cs-tag--type zs-tape">%s</span>' % p['type'] + small_title(p['title'], 'cs-title zs-title') +
            opener(key, p['title']) + heart(key) + '</div></article>')

DIRS = [
  ('wp', '1 · Wheatpaste · posts with a photo', 'A street poster pasted over other posters. The user photo runs full bleed in color under a halftone, the Barlow headline sits on torn strips, the post type on neon tape. Opening peels it into a full-height poster with the details on a pasted paper strip.', wp_closed, wp_open, wp_small),
  ('cs', '2 · Cutout specimen · posts without a photo', 'The object is the hero. The hero sticker and its 3D wire companion sit in the case like a pinned specimen, with the post type and area on tags. No photo on this card. Opening expands the case into a full specimen sheet.', cs_closed, cs_open, cs_small),
]

def seeded_version(post_id):
    # Each post gets version A or B from a stable hash of its id, so the board varies but a card never rerolls.
    h = 0
    for ch in str(post_id):
        h = (h * 31 + ord(ch)) & 0xffffffff
    return 'b' if h % 2 else 'a'

body = ''
keys = []
for d, title, blurb, closed, opened, small in DIRS:
    slots = ''
    for i, (k, p) in enumerate(POSTS.items()):
        for v in ('a', 'b'):
            key = '%s_%s_%s' % (d, k, v)
            keys.append(key)
            flip = (i % 2 == 1) != (v == 'b')  # neighbouring cards alternate network orientation
            tag = '%s · version %s%s' % ('Seeking · dashes on the left edge' if p['seeking'] else 'Offering · continuous edge', v.upper(),
                                        ' · this post draws it' if seeded_version(p['num']) == v else '')
            o = opened(k, p, flip, key).replace('<article class="', '<article class="zv-%s ' % v, 1)
            c = closed(k, p, flip, key).replace('<article class="', '<article class="zv-%s ' % v, 1)
            sm = small(k, p, flip, key).replace('<article class="', '<article class="zv-%s ' % v, 1)
            RIMS = '<span class="zt-rim" aria-hidden="true"></span>'
            o = o.replace('<article ', '<article style="%s" ' % decay_vars(key + 'o'), 1)
            c = c.replace('<article ', '<article style="%s" ' % decay_vars(key), 1)
            sm = sm.replace('<article ', '<article style="%s" ' % decay_vars(key + 's'), 1)
            c = '<div class="zpair">' + c + '<div class="zsmall"><span class="zsize">SMALL</span>' + sm + '</div></div>'
            slots += ('<div class="zslot"><div class="ztag">%s</div>'
                      '<sc-if value="{{ s.%s_open }}" hint-placeholder-val="{{ false }}">%s</sc-if>'
                      '<sc-if value="{{ s.%s_closed }}" hint-placeholder-val="{{ true }}">%s</sc-if></div>' % (e(tag), key, o, key, c))
    body += ('<section class="zdir" aria-label="%s"><header class="zdir-head"><h2>%s</h2><p>%s</p></header><div class="zslots">%s</div></section>\n' % (e(title), e(title), e(blurb), slots))

CSS = open(__file__.replace('gen_dirs2.py', 'dirs2.css')).read() + decay_keyframes() + open(__file__.replace('gen_dirs2.py', 'inline-assets.css')).read()
W, H = 1600, 4300
logic = '''class Component extends DCLogic {
  state = { open: {}, saved: {} };
  renderVals() {
    const keys = %s;
    const s = {}, t = {}, h = {};
    for (const k of keys) {
      const o = !!this.state.open[k], v = !!this.state.saved[k];
      s[k + '_open'] = o; s[k + '_closed'] = !o; s[k + '_saved'] = v ? 'true' : 'false'; s[k + '_fill'] = v ? 'currentColor' : 'none';
      t[k] = () => this.setState({ open: { ...this.state.open, [k]: !o } });
      h[k] = () => this.setState({ saved: { ...this.state.saved, [k]: !v } });
    }
    return { s, t, h };
  }
}''' % json.dumps(keys)
doc = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Boardz card directions</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="%s">
<link rel="stylesheet" href="%s">
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&amp;family=Barlow:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500;700&amp;display=swap" rel="stylesheet">
<style>
%s
</style>
</helmet>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="zt-rough"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter><filter id="zt-frame" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="1.6" intercept="-.12"/><feFuncG type="linear" slope="1.6" intercept="-.12"/><feFuncB type="linear" slope="1.6" intercept="-.12"/></feComponentTransfer><feColorMatrix values="0.2 0.4 0.4 0 0  0 0.5 0.5 0 0  1 0 0 0 0  0 0 0 1 0"/></filter><filter id="zt-ink" color-interpolation-filters="sRGB"><feColorMatrix values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0"/></filter><filter id="zt-black" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 0.02  0 0 0 0 0.02  0 0 0 0 0.024  0 0 0 1 0"/></filter><filter id="zt-lime-strip" color-interpolation-filters="sRGB"><feColorMatrix values="0.26 0.86 0.09 0 0  0.32 1.07 0.11 0 0  0 0 0 0 0  0 0 0 1 0"/></filter><filter id="zt-lime" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.17 0.57 0.06 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 0 0  0 0 0 1 0"/></filter></svg>
<div class="zroot" style="width:%dpx">
<header class="zhead"><div class="zkick">Boardz · new card directions · punk meets cyberspace</div><h1>Two new Boardz cards</h1>
<p>Same parts, new layouts. Photos stay in full color. Type is Barlow, with the design system's neon tape, tags, mono kicker, rainbow seam and 8%% bloom. Every card keeps the post type up front, the seeking dashes on posts looking for something, the network with its wire companion, the cropped hero sticker, the Giftz logo and the heart. Each card has two versions with the hero placed a little differently; a post draws A or B from its id. Tap a card to open it: it grows into the open card through a glitch. Tap the X to close. The heart saves.</p></header>
%s</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":%d,"height":%d}}'>
%s
</script>
</body>
</html>
''' % (FONTS, PAPERCSS, CSS, W, body, W, H, logic)
open('/tmp/claude-0/-home-user-pdx-pride-guide/4b1ae876-0793-5aa1-a5d3-e65182ac68ab/scratchpad/canvas2/project/Directions.dc.html', 'w').write(doc)
print(len(doc))
