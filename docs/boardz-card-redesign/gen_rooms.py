import json, html, re
# Hoüz, Mizzed, Sellz and Gigz boards in the new card design. Reuses the card builders from gen_dirs2.py:
# posts with a photo get the Wheatpaste card, posts without get the Cutout specimen card.
SRC = open(__file__.replace('gen_rooms.py', 'gen_dirs2.py')).read()
exec(SRC.split("\nbody = ''")[0])
B = lambda i: '/_blob/' + i
NETA = [B('1a93af24feb1018d07912913d3e65299'), B('d4dc408c6733fe053c49d4420b3afb0e'), B('4b7808ce1c35716da2f36bd7589319a6')]
NETB = [B('908149a2a7881508173827249fb42461'), B('7579a17b3218836a3267bc68be1e457e'), B('2b6477e813e62610161df2541616a735')]
AV = [B('51d44a40e9e0af822e68eb540ae9ef84'), B('23dd5aa430ee8d6151af0dd8865cd537'), B('4b97153611b72eed1c67665c14f6622d'), B('140a00f61855a845708de95f2da515ed')]
HOUZ_WIRE = B('cd9f09513f3f5da022ac80708e48b671')
COLORS = {'houz-offering': '#FF00CC', 'houz-looking': '#FF6600', 'houz-forming': '#39FF14', 'houz-managed': '#FF5F6D',
          'mizzed': '#FF00CC', 'sellz': '#39FF14', 'gigz': '#6E3DFF'}
def post(**k):
    k.setdefault('photo', None); k.setdefault('value', ''); k.setdefault('count', ''); k.setdefault('pickup', '')
    return k
ROOMS = [
  ('Houz', 'Hoüz', '144d1757fc19b26af058d8180efe277a', [
    post(id='offering', zc='houz-offering', type='JOIN OUR HOÜZ', value='$850/MO', title='Room open in a queer Hoüz off Alberta',
         desc='Big sunny room in a four person Hoüz. Plants, a dog, chore wheel that actually works. Looking for someone chill who cooks sometimes.',
         area='NE Portland', cat='2 of 4 rooms open', pickup='Move in Aug 1', count='Trans affirming', photo=B('607636d226d5fc0ba5c3138c452cd68d'),
         hero=B('af1fc292d03733566ff7279572b9b577'), faces=AV[:2], total=4, hcount=2, hlabel='OPEN', mk='MOVE IN', mon='AUG', day='1', wire=HOUZ_WIRE, net=NETA, seeking=True, action="I'M INTERESTED", num='1'),
    post(id='looking', zc='houz-looking', type='LOOKING TO RENT', value='$900/MO', title='Looking for a room by August',
         desc='Trans femme, 30, works from home, quiet but social. Good with cats. Want to be close in, on a bus line.',
         area='Close in', cat='1 person', pickup='By Aug 1', count='Has references',
         hero=B('4b32899a11e7d04257ad23b13ddef34b'), faces=AV[2:4], hlabel='LOOKING', mk='BY', mon='AUG', day='1', wire=HOUZ_WIRE, net=NETB, seeking=True, action='I HAVE A ROOM', num='2'),
    post(id='forming', zc='houz-forming', type='BUILDING A HOÜZ', value='$2,700 BUDGET', title='Building a three bedroom Hoüz in SE',
         desc='Two of us so far. Want one more to find a place together this fall. Into shared dinners and a garden.',
         area='SE Portland', cat='2 of 3 in', pickup='Move by Sep 15', count='Queer household', photo=B('a6934db59f134035d782bbda3e59d3ed'),
         hero=B('8faf273cadb132a7bd362505399c7a24'), faces=AV[3:4], total=4, hcount=1, hlabel='IN', mk='GOAL', mon='SEP', day='15', wire=HOUZ_WIRE, net=NETA, seeking=True, action='COUNT ME IN', num='3'),
    post(id='managed', zc='houz-managed', type='MANAGED RENTAL', value='$1,450/MO', title='One bedroom in a queer owned building',
         desc='Top floor one bedroom, in unit laundry, bike room. Queer owned and managed. Application through the office.',
         area='N Portland', cat='1 bedroom', pickup='Available Jul 13', count='Pets ok', photo=B('02846d13fe195a8dc56877ace4904104'),
         hero=B('27c6290cd0748ac01971eb8d7f38872a'), mk='AVAILABLE', mon='JUL', day='13', wire=HOUZ_WIRE, net=NETB, seeking=False, action='APPLY', num='4'),
  ]),
  ('Mizzed', 'Mizzed Connection', '77edd3da2a67a6a386665a5c45f985e8', [
    post(id='connection', zc='mizzed', type='MIZZED CONNECTION', title='You lent me your lighter at the Eagle Saturday',
         desc='Green jacket, great laugh. We talked about the Blazers for like ten minutes and then you vanished. Say hi.',
         area='Eagle Portland', cat='Saturday night', pickup='Around 11pm', count='Say hi',
         hero=B('b4f6ad47cb6baaa78bdb627488b31254'), wire=B('be7ac672639611fb270bb02bf1161462'), net=NETA, seeking=False, action='THAT WAS ME', num='12'),
    post(id='connection2', zc='mizzed', type='MIZZED CONNECTION', title='Dancing next to you at the block party',
         desc='You had the trans flag fan and the best moves on Stark. I was the one in the yellow hat. Coffee?',
         area='Stark St', cat='Sunday afternoon', pickup='Block party', count='Coffee?',
         hero=B('b4f6ad47cb6baaa78bdb627488b31254'), wire=B('be7ac672639611fb270bb02bf1161462'), net=NETB, seeking=False, action='THAT WAS ME', num='13'),
  ]),
  ('Sellz', 'Sellz', '6b14de2a41819c33799faa724e6a8eb6', [
    post(id='stools', zc='sellz', type='FOR SALE', value='$120', title='Pair of walnut bar stools',
         desc='Solid walnut, counter height, a few honest scratches. Moving and they will not fit. Cash or Venmo.',
         area='SE Portland', cat='Furniture', pickup='Porch pickup', count='Pair', photo=B('627e496609aecb5b4a8533bbc5466921'),
         hero=B('4eaf45a02f8f7ccdf25fcbaf02466a99'), wire=B('bc81ad618a16eb89f6fee70c1b04017d'), net=NETA, seeking=False, action='I WANT IT', num='1'),
    post(id='zines', zc='sellz', type='FOR SALE', value='$25', title='Queer zine bundle, twelve issues',
         desc='Local zines from the last few Pride weeks. Comics, poems, a recipe one. All twelve for one price.',
         area='N Portland', cat='Books and zines', pickup='Meet up', count='12 issues', photo=B('c624cec0245f0702870dba908a116afd'),
         hero=B('4eaf45a02f8f7ccdf25fcbaf02466a99'), wire=B('bc81ad618a16eb89f6fee70c1b04017d'), net=NETB, seeking=False, action='I WANT IT', num='2'),
  ]),
  ('Gigz', 'Gigz', 'f76ffb39070669324d3ea514531e88f6', [
    post(id='hiring', zc='gigz', type='HIRING', value='$300', title='Hiring a DJ for a Pride Saturday rooftop',
         desc='Four hour set, house and disco, about 150 people. Sound system is there. Send a mix.',
         area='Pearl District', cat='Music', pickup='Sat Jul 18', count='4 hours',
         hero=B('19ab2346d59c46c2e1fbb127899d1286'), wire=B('54ba751f91309cf9c86d1ec064317c02'), net=NETA, seeking=False, action='APPLY', num='14'),
    post(id='available', zc='gigz', type='AVAILABLE', value='$40/HR', title='Karaoke host free all Pride week',
         desc='Bring my own rig and songbook. Bars, house parties, birthdays. Will hype your shyest friend.',
         area='Anywhere in town', cat='Music', pickup='Jul 13 to 19', count='Own gear',
         hero=B('19ab2346d59c46c2e1fbb127899d1286'), wire=B('54ba751f91309cf9c86d1ec064317c02'), net=NETB, seeking=True, action='BOOK THEM', num='16'),
  ]),
]

def mat(hexc, w):
    r, g, b = (int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return '  '.join('%.3f %.3f %.3f 0 0' % tuple(c * x for x in w) for c in (r, g, b)) + '  0 0 0 1 0'
def frame(hexc):
    r, g, b = (int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return '  '.join('%.3f %.3f %.3f 0 0' % (1 - c, c / 2, c / 2) for c in (r, g, b)) + '  0 0 0 1 0'
FILT, ACC = '', ''
for zc, col in COLORS.items():
    FILT += ('<filter id="zf-frame-%s" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="1.6" intercept="-.12"/><feFuncG type="linear" slope="1.6" intercept="-.12"/><feFuncB type="linear" slope="1.6" intercept="-.12"/></feComponentTransfer><feColorMatrix values="%s"/></filter>'
             '<filter id="zf-hero-%s" color-interpolation-filters="sRGB"><feColorMatrix values="%s"/></filter>'
             '<filter id="zf-strip-%s" color-interpolation-filters="sRGB"><feColorMatrix values="%s"/></filter>') % (zc, frame(col), zc, mat(col, (.2126, .7152, .0722)), zc, mat(col, (.32, 1.07, .11)))
    ACC += '.zc-%s{--c:%s;--zf-frame:url(#zf-frame-%s);--zf-hero:url(#zf-hero-%s);--zf-strip:url(#zf-strip-%s)}\n' % (zc, col, zc, zc, zc)
ACC += '.zc-gigz :is(.wp-tape,.cs-tag--type,.ztag--solid,.zbtn--fill){color:#fff}\n'
# Hoüz keeps its original palette: cyan frame, cyan-inked hero and heart, the type color as the secondary
# (network, wire companion, tape, price, title offsets, tags), on the teal-black Hoüz ink with a secondary glow.
CYAN = '#19e3ff'  # calmer Hoüz cyan: pure #00FFFF reads white-hot on ink
FILT += ('<filter id="zf-frame-houz" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="1.6" intercept="-.12"/><feFuncG type="linear" slope="1.6" intercept="-.12"/><feFuncB type="linear" slope="1.6" intercept="-.12"/></feComponentTransfer><feColorMatrix values="%s"/></filter>'
         '<filter id="zf-hero-houz" color-interpolation-filters="sRGB"><feColorMatrix values="%s"/></filter>') % (frame(CYAN), mat(CYAN, (.2126, .7152, .0722)))
for zc, col in COLORS.items():
    if not zc.startswith('houz'): continue
    ACC += ('.zc-%s{--c:#19e3ff;--c2:%s;--zf-frame:url(#zf-frame-houz);--zf-hero:url(#zf-hero-houz);--zf-strip:url(#zf-strip-%s)}\n'
            '.zc-%s :is(.wp-wire,.cs-wire,.zs-wire){filter:url(#zf-hero-%s) drop-shadow(0 0 3px color-mix(in srgb,%s 45%%,transparent))!important}\n') % (zc, col, zc, zc, zc, col)
ACC += ('[class*="zc-houz"] .zt-face{background:radial-gradient(ellipse at 100% 50%,color-mix(in srgb,var(--c2) 16%,transparent),transparent 70%),#031012!important}\n'
        '[class*="zc-houz"] :is(.wp-tape,.cs-tag--type)::before{background:var(--c2)}\n'
        '[class*="zc-houz"] :is(.ztag--solid,.zbtn--fill){background:var(--c2);border-color:var(--c2)}\n'
        '[class*="zc-houz"] .wp-value{color:var(--c2)}\n'
        '[class*="zc-houz"].wp-card .wp-value{left:auto;right:70px;bottom:20px}\n'
        '[class*="zc-houz"] .zt{filter:drop-shadow(0 0 18px color-mix(in srgb,var(--c2) 8%,transparent))}\n')
CSS = open(__file__.replace('gen_rooms.py', 'dirs2.css')).read()
CSS = CSS.replace('url(#zt-lime-strip)', 'var(--zf-strip)').replace('url(#zt-lime)', 'var(--zf-hero)').replace('url(#zt-frame)', 'var(--zf-frame)')
CSS += decay_keyframes() + ACC + open(__file__.replace('gen_rooms.py', 'inline-assets.css')).read()

def houz_frame(dashed):
    # The live Hoüz small-card frame (HouzFrame in PunkBoardCard.jsx): 32 hairline rounded rects stepping from
    # cyan out to the type color, with the left side dashed on posts looking for something.
    w, h, R, layers = 136, 150, 16, 32
    step = 1.8 / 31
    length = h - 2 * R
    count = length // 8 + 1
    dash = length / (2 * count - 1)
    out = ''
    for i in range(layers):
        d = .15 + i * step
        p1 = round(100 * (1 - .8 * max(0, (i / (layers - 1) - .5) / .5) ** 2))
        st = 'color-mix(in srgb,#19e3ff %d%%,var(--c2))' % p1
        if dashed:
            p2 = round(100 * (1 - .9 * max(0, (i / (layers - 1) - .35) / .65) ** 1.5))
            out += ('<g stroke="%s" stroke-width=".1" fill="none"><path d="M%.2f %d Q%.2f %.2f %d %.2f H%.2f Q%.2f %.2f %.2f %d V%d Q%.2f %.2f %.2f %.2f H%d Q%.2f %.2f %.2f %d"/>'
                    '<path d="M%.2f %d V%d" stroke-dasharray="%.3f %.3f" stroke="color-mix(in srgb,#19e3ff %d%%,var(--c2))"/></g>') % (
                st, d, R, d, d, R, d, w - R, w - d, d, w - d, R, h - R, w - d, h - d, w - R, h - d, R, d, h - d, d, h - R, d, R, h - R, dash, dash, p2)
        else:
            out += '<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" rx="%.2f" stroke="%s" stroke-width=".1" fill="none"/>' % (d, d, w - 2 * d, h - 2 * d, R - d, st)
    return '<svg class="hz-frame" viewBox="0 0 %d %d" preserveAspectRatio="none" aria-hidden="true">%s</svg>' % (w, h, out)

def lit_windows(html_, p):
    # Game-designer signature move: the wire companion house's left window has four panes, one per spot in the
    # household. Members light a pane in the type color, open spots stay dark and dashed, one open pane breathes.
    # Drawn as an SVG in the wire image's own coordinates (1374 x 1145) and given the wire's classes, so it lands
    # exactly on the house wherever the hero rules put it.
    total = p.get('total') or 4
    lit = len(p['faces'])
    q = [(366, 630), (540, 666), (496, 880), (300, 840)]  # left window: TL, TR, BR, BL in image px
    def at(u, v):
        top = (q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u)
        bot = (q[3][0] + (q[2][0] - q[3][0]) * u, q[3][1] + (q[2][1] - q[3][1]) * u)
        return (top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v)
    g = .06
    panes = ''
    for i in range(4):
        u0, v0 = (i % 2) * .5, (i // 2) * .5
        pts = [at(u0 + g, v0 + g), at(u0 + .5 - g, v0 + g), at(u0 + .5 - g, v0 + .5 - g), at(u0 + g, v0 + .5 - g)]
        if i >= total: continue
        cls = 'lw-lit' if i < lit else ('lw-open lw-breathe' if i == lit else 'lw-open')
        panes += '<polygon class="%s" points="%s"/>' % (cls, ' '.join('%.0f,%.0f' % pt for pt in pts))
    def add(m):
        return m.group(0) + ('<svg class="%s lw" viewBox="0 0 1374 1145" style="--lw-dly:-%.1fs" aria-hidden="true">%s</svg>'
                             % (m.group(1), int(p['num']) * 0.7, panes))
    return re.sub(r'<img class="([^"]*(?:wp-wire|cs-wire|zs-wire)[^"]*)" src="%s" alt="" aria-hidden="true">' % re.escape(HOUZ_WIRE), add, html_)

def month_html(p, mode):
    # Hoüz month stamp: the date from the form (move in, by, goal, available) as a tear-off calendar chip.
    if not p.get('mon'): return ''
    return ('<span class="hm hm--%s" aria-label="%s %s %s"><b class="hm-k">%s</b><b class="hm-m">%s</b><b class="hm-d">%s</b></span>'
            % (mode, p['mk'].lower(), p['mon'].title(), p['day'], p['mk'], p['mon'], p['day']))

def faces_html(p, mode):
    # Hoüz face stack and household counter, done like the Giftz parts: color photos on torn black paper with
    # the secondary offset, open spots as dashed slots, the count in Cut Type ransom letters.
    if not p.get('faces'): return ''
    total = p.get('total') or len(p['faces'])
    faces = list(p['faces'])
    slots = ''
    for i in range(total if p.get('total') else len(faces)):
        r = ((i * 37 + int(p['num']) * 11) % 9) - 4
        if i < len(faces):
            slots += '<span class="hf-face" style="--r:%ddeg"><img src="%s" alt=""></span>' % (r, faces[i])
        else:
            slots += '<span class="hf-face hf-open" style="--r:%ddeg" aria-hidden="true"></span>' % r
    if p.get('total'):
        label = '%d %s out of %d' % (p['hcount'], p['hlabel'].lower(), total)
        count = ('<span class="hf-count"><b class="hf-n">%s</b><span class="hf-of">/%d</span><span class="hf-l">%s</span></span>'
                 % (p['hcount'], total, p['hlabel']))
    else:
        label = '%d people looking' % len(faces)
        count = '<span class="hf-count"><b class="hf-n">%d</b><span class="hf-l">%s</span></span>' % (len(faces), p['hlabel'])
    return '<div class="hf hf--%s" role="img" aria-label="%s"><span class="hf-faces">%s</span>%s</div>' % (mode, label, slots, count)

out = {}
COMBINED_BODY, COMBINED_KEYS = '', []
for slug, name, logo, posts in ROOMS:
    LOGO = B(logo)
    body, keys = '', []
    for i, p in enumerate(posts):
        d, closed, opened, small = ('wp', wp_closed, wp_open, wp_small) if p['photo'] else ('cs', cs_closed, cs_open, cs_small)
        slots = ''
        for v in ('a', 'b'):
            key = '%s_%s_%s' % (d, p['id'], v)
            keys.append(key)
            flip = (i % 2 == 1) != (v == 'b')
            tag = '%s · %s · version %s%s' % (p['type'], 'photo' if p['photo'] else 'no photo', v.upper(), ' · this post draws it' if seeded_version(p['num']) == v else '')
            def prep(html_, suffix):
                html_ = html_.replace('<article class="', '<article class="zc-%s zv-%s ' % (p['zc'], v), 1)
                html_ = html_.replace('alt="Giftz"', 'alt="%s"' % e(name))
                return html_.replace('<article ', '<article style="%s" ' % decay_vars(key + suffix), 1)
            o, c, sm = prep(opened(p['id'], p, flip, key), 'o'), prep(closed(p['id'], p, flip, key), ''), prep(small(p['id'], p, flip, key), 's')
            o, c, sm = line_strips(o), line_strips(c), line_strips(sm)
            if p.get('faces') and p['zc'].startswith('houz'):  # lit windows on the wire house: one pane per spot
                o, c, sm = lit_windows(o, p), lit_windows(c, p), lit_windows(sm, p)
            o = o.replace(' zglitch', ' zglitch zo-%s' % 'abcd'[sum(ord(ch) * (i + 7) for i, ch in enumerate(key)) % 4], 1)  # which way it opens
            c = c.replace('<button class="zopen-hit"', faces_html(p, 'large') + '<button class="zopen-hit"', 1)
            SHORT = {'JOIN OUR HOÜZ': 'JOIN', 'LOOKING TO RENT': 'LOOKING', 'BUILDING A HOÜZ': 'BUILDING', 'MANAGED RENTAL': 'MANAGED', 'MIZZED CONNECTION': 'MIZZED'}
            if p['type'] == 'MIZZED CONNECTION':  # the open card's kicker must clear the location chip
                o = o.replace('cs-tag--type">MIZZED CONNECTION<', 'cs-tag--type">MIZZED<', 1)
            if p['type'] in SHORT:  # the small tape has about 78px beside the heart
                sm = sm.replace('zs-tape">%s<' % p['type'], 'zs-tape">%s<' % SHORT[p['type']], 1)
            # Hoüz small cards use the same torn paper rim as every other card (no solid wire frame).
            if p.get('mon'):
                c = c.replace('<button class="zopen-hit"', month_html(p, 'large') + '<button class="zopen-hit"', 1)
                sm = sm.replace('<button class="zopen-hit"', month_html(p, 'small') + '<button class="zopen-hit"', 1)
                o = o.replace('<button class="zclose"', month_html(p, 'open') + '<button class="zclose"', 1)
            sm = sm.replace('<button class="zopen-hit"', faces_html(p, 'small').replace('<span class="hf-faces">', '<span class="hf-faces" hidden>', 1) + '<button class="zopen-hit"', 1)  # small: counter only, no faces
            o = o.replace('<ul class="ztags"', faces_html(p, 'open') + '<ul class="ztags"', 1)
            c = '<div class="zpair">' + c + '<div class="zsmall"><span class="zsize">SMALL</span>' + sm + '</div></div>'
            slots += ('<div class="zslot"><div class="ztag">%s</div>'
                      '<sc-if value="{{ s.%s_open }}" hint-placeholder-val="{{ false }}">%s</sc-if>'
                      '<sc-if value="{{ s.%s_closed }}" hint-placeholder-val="{{ true }}">%s</sc-if></div>' % (e(tag), key, o, key, c))
        body += '<div class="zslots">%s</div>\n' % slots
    W = 1600
    H = 340 + len(posts) * 900
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
    svg = re.search(r'<svg width="0" height="0".*?</svg>', SRC, re.S).group(0).replace('</svg>', FILT + '</svg>')
    doc = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>%s cards</title>\n<script src="./support.js"></script>\n'
           '<link rel="stylesheet" href="%s">\n<link rel="stylesheet" href="%s">\n</head>\n<body>\n<x-dc>\n<helmet>\n'
           '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
           '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&amp;family=Barlow:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500;700&amp;display=swap" rel="stylesheet">\n'
           '<style>\n%s\n.zroot{--zf-frame:url(#zt-frame);--zf-hero:url(#zt-lime);--zf-strip:url(#zt-lime-strip)}\n.zroom-logo{height:120px;width:auto;display:block;margin-bottom:12px}\n</style>\n</helmet>\n%s\n'
           '<div class="zroot" style="width:%dpx">\n<header class="zhead"><img class="zroom-logo" src="%s" alt="%s"><div class="zkick">Boardz · %s · new cards</div><h1>%s cards</h1>'
           '<p>The new card design for %s. Posts with a photo use the Wheatpaste card, posts without use the Cutout specimen card. Each shows its large and small card in versions A and B. Tap a card to open it. Tap the X to close. The heart saves.</p></header>\n%s</div>\n</x-dc>\n'
           '<script type="text/x-dc" data-dc-script data-props=\'{"$preview":{"width":%d,"height":%d}}\'>\n%s\n</script>\n</body>\n</html>\n') % (
        e(name), FONTS, PAPERCSS, CSS, svg, W, LOGO, e(name), e(name), e(name), e(name), body, W, H, logic)
    COMBINED_BODY += ('<section class="zdir zroom" aria-label="%s"><header class="zdir-head"><img class="zroom-logo" src="%s" alt="%s"><h2>%s</h2></header>%s</section>\n' % (e(name), LOGO, e(name), e(name), body))
    COMBINED_KEYS += keys
    fn = 'Cards-%s.dc.html' % slug
    open('/tmp/claude-0/-home-user-pdx-pride-guide/4b1ae876-0793-5aa1-a5d3-e65182ac68ab/scratchpad/canvas2/project/' + fn, 'w').write(doc)
    out[fn] = (W, H)
print(out)

# One board with everything: the Giftz board's sections plus every room, so every card opens from the same board.
D = '/tmp/claude-0/-home-user-pdx-pride-guide/4b1ae876-0793-5aa1-a5d3-e65182ac68ab/scratchpad/canvas2/project/Directions.dc.html'
src = open(D).read()
gk = json.loads(re.search(r'const keys = (\[.*?\]);', src).group(1))
gbody = src[src.index('<section class="zdir"'):src.rindex('</div>\n</x-dc>')]
allkeys = gk + COMBINED_KEYS
hdr = src[src.index('<header class="zhead">'):src.index('</header>', src.index('<header class="zhead">')) + 9]
H2 = 6700 + sum(len(p) for _, _, _, p in ROOMS) * 900 + len(ROOMS) * 260
doc2 = src[:src.index('<style>') + 7] + '\n' + CSS + '\n.zroot{--zf-frame:url(#zt-frame);--zf-hero:url(#zt-lime);--zf-strip:url(#zt-lime-strip)}\n.zroom-logo{height:110px;width:auto;display:block;margin-bottom:10px}\n.zroom{margin-top:80px}\n' + src[src.index('</style>'):]
doc2 = re.sub(r'<svg width="0" height="0".*?</svg>', lambda m: svg, doc2, count=1, flags=re.S)
doc2 = doc2.replace(gbody, gbody + COMBINED_BODY, 1)
doc2 = re.sub(r'const keys = \[.*?\];', lambda m: 'const keys = %s;' % json.dumps(allkeys), doc2, count=1)
doc2 = re.sub(r'"\$preview":\{"width":1600,"height":\d+\}', '"$preview":{"width":1600,"height":%d}' % H2, doc2, count=1)
doc2 = doc2.replace('<title>Boardz card directions</title>', '<title>Boardz new cards</title>', 1)
open(D, 'w').write(doc2)  # the Directions board is the one that opens on the canvas
out['Directions.dc.html'] = (1600, H2)
print(out)
