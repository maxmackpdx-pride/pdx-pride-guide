# Composer forms in the new card design. Fields, order, labels and placeholders follow the live composers
# (HousingComposer, MizzedComposer in SpottedCardGrid, GiftComposer in Gifting, Sellz, GigComposer in PrideWork).
import html
e = html.escape
MONTHS = ['JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN']

def field(label, inner, hint='', req=False):
    return ('<label class="zf-field"><span class="zf-label">%s%s</span>%s%s</label>'
            % (e(label), ' <i>REQUIRED</i>' if req else '', inner, '<span class="zf-hint">%s</span>' % e(hint) if hint else ''))
def text(ph, val=''): return '<input class="zf-in" type="text" placeholder="%s" value="%s">' % (e(ph), e(val))
def area(ph, val=''): return '<textarea class="zf-in zf-area" placeholder="%s">%s</textarea>' % (e(ph), e(val))
def select(opts, sel=0): return '<span class="zf-sel"><select class="zf-in">%s</select></span>' % ''.join('<option%s>%s</option>' % (' selected' if i == sel else '', e(o)) for i, o in enumerate(opts))
def section(t): return '<h4 class="zf-sec"><span>%s</span></h4>' % e(t)
def photos(label, hint, n=1, req=False):
    tiles = '<span class="zf-ph zf-ph--add"><b>+</b>ADD PHOTO</span>' + '<span class="zf-ph"></span>' * (n - 1)
    return field(label, '<span class="zf-phs">%s</span>' % tiles, hint, req)
def mapz(): return field('On Mapz (optional)', '<span class="zf-map"><span class="zf-pin"></span><button type="button" class="zf-ghost">PLACE A PIN</button></span>')
def toggle(label, on=False): return '<label class="zf-tog"><input type="checkbox"%s><span class="zf-sw"></span>%s</label>' % (' checked' if on else '', e(label))
def rules(t): return '<label class="zf-rules"><input type="checkbox"><span class="zf-box"></span>%s</label>' % e(t)
def months(label, sel='AUG'):
    chips = ''.join('<label class="zf-mo"><input type="radio" name="m-%s"%s><span>%s</span></label>' % (e(label), ' checked' if m == sel else '', m) for m in MONTHS)
    return field(label, '<span class="zf-mos">%s</span>' % chips, 'Shows as the month stamp on your card. Hoüz can be sorted by it.')
def chips(items): return '<span class="zf-chips">%s</span>' % ''.join('<span class="zf-chip">%s <b>×</b></span>' % e(i) for i in items)

def form(zc, kicker, title, intro, body, submit, logo, seeking=False):
    return ('<div class="zf-slot"><div class="ztag">%s form</div>'
            '<form class="zf zt %s%s" onsubmit="return false">'
            '<span class="zt-rim" aria-hidden="true"></span><div class="zt-face">'
            '<header class="zf-head"><img class="zf-logo" src="%s" alt=""><span class="zf-kick">&gt; %s</span><h3 class="zf-title"><span class="zl">%s</span></h3>'
            '<p class="zf-intro">%s</p></header>%s'
            '<div class="zf-actions"><button type="button" class="zbtn">BACK</button><button type="submit" class="zbtn zbtn--fill">%s</button></div>'
            '</div></form></div>') % (e(kicker), zc, ' z-seek' if seeking else '', logo, e(kicker.upper()), e(title.upper()), e(intro), body, e(submit.upper()))

def forms(B):
    out = []
    hz = ''.join([
        section('What kind of post'),
        '<span class="zf-tiles">%s</span>' % ''.join('<label class="zf-tile%s"><input type="radio" name="hz"%s><b>%s</b><small>%s</small></label>'
            % (' is-on' if i == 0 else '', ' checked' if i == 0 else '', a, b) for i, (a, b) in enumerate([
            ('JOIN OUR HOÜZ', 'Offering a room'), ('LOOKING TO RENT', 'Looking for housing'), ('BUILDING A HOÜZ', 'Find housemates'), ('MANAGED RENTAL', 'Managed property')])),
        section('The place'),
        field('House name', '<span class="zf-suffix">' + text('The Overlook') + '<b>HOÜZ</b></span>', 'A word or two. We add the suffix.'),
        field('Headline', text('Room in a three bedroom on N Failing'), 'Up to 60 characters.', True),
        field('In your own words', area('Who you are, how you live, what you are after.')),
        '<div class="zf-pair">%s%s</div>' % (field('Rent', text('$900 a month')), field('Available', text('Aug 1'))),
        months('Move in month', 'AUG'),
        field('Neighborhoods (up to 3)', select(['Choose a neighborhood…', 'Alberta Arts', 'Boise', 'Kerns']) + chips(['NE Portland'])),
        mapz(),
        section('Who lives here'),
        field('Housemates and pets', '<span class="zf-faces"><span class="zf-face"><img src="%s" alt=""></span><span class="zf-face"><img src="%s" alt=""></span><span class="zf-face zf-face--add">+</span></span>' % (B('51d44a40e9e0af822e68eb540ae9ef84'), B('23dd5aa430ee8d6151af0dd8865cd537')), 'These make the face stack and the 2/4 counter.'),
        photos('Cover photo', 'Required for offering and looking posts.', 3, True),
        field('Tags', chips(['Trans affirming', 'Plants', 'Dog in the house'])),
        '<p class="zf-note">Keep it to the place and your life.</p>'])
    out.append(form('zc-houz-offering', 'Hoüz · Post to My Hoüz', 'Room open in a queer Hoüz', 'Headline and a cover photo are required. Everything else helps people find you.', hz, 'Post to the board', B('144d1757fc19b26af058d8180efe277a'), True))
    mz = ''.join([
        field('Where did you see them', select(['Events', 'Placez', 'OutZide', 'That one spot by the…', 'Around town'], 1)),
        field('Which Placez card', select(['Eagle Portland', 'CC Slaughters', 'Badlands']), '', True),
        mapz(),
        field('Title', text('e.g. Mesh top, killer moves…'), 'Optional.'),
        field('Your message', area('What you saw, what you would say.'), '500 left', True),
        rules('I agree: kind, specific, PG-13. No names, no full descriptions of strangers.')])
    out.append(form('zc-mizzed', 'Mizzed · New connection', 'Post a connection', 'Anonymous posts. Private replies.', mz, 'Post it', B('77edd3da2a67a6a386665a5c45f985e8')))
    gz = ''.join([
        field('Post type', select(['Gift', 'In search of'])),
        field('Category', select(['Party Closet', 'Household', 'Appliances', 'Books'])),
        field('Title', text('e.g. Rack of drag looks, sizes S to L'), '', True),
        field('Description', area('What is it, what condition, anything to know.'), '', True),
        '<div class="zf-pair">%s%s</div>' % (field('Pickup area', text('e.g. Inner SE')), field('Pickup preference', select(['Porch pickup', 'Public meetup', 'Event handoff', 'Flexible pickup', 'Message to coordinate']))),
        photos('Photos (at least 1, up to 2)', 'Show the item you are giving away.', 2, True),
        mapz(),
        rules('I agree: keep it free, keep it kind, keep it moving.')])
    out.append(form('', 'Giftz · Post a gift', 'Post a gift', 'No selling, no trading. Free stuff for each other.', gz, 'Post it', B('f657bd40cc57c22f623c88514d3064a2')))
    sz = ''.join([
        field('Title', text('What are you selling?'), '', True),
        field('Description', area('Useful details, dimensions, flaws.')),
        '<div class="zf-pair">%s%s</div>' % (field('Price', text('$'), '', True), field('Condition', select(['New', 'Like new', 'Good', 'Fair', 'For parts'], 2))),
        '<div class="zf-pair">%s%s</div>' % (field('Category', select(['Furniture', 'Books and zines', 'Clothing', 'Art'])), field('Handoff', select(['Public meetup', 'Porch pickup', 'Event handoff', 'Delivery available', 'Message to coordinate']))),
        field('Neighborhood', text('e.g. SE Portland')),
        photos('Photos (at least 1, up to 6)', 'Listings need a real photo of the item.', 3, True),
        toggle('Open to offers', True),
        rules('I own this item and it is what I say it is.')])
    out.append(form('zc-sellz', 'Sellz · New listing', 'Sell something', 'Real items, real photos, fair prices.', sz, 'Post listing', B('6b14de2a41819c33799faa724e6a8eb6')))
    gg = ''.join([
        field('Post type', select(["I'm posting a gig", "I'm looking for work"])),
        '<div class="zf-pair">%s%s</div>' % (field('Your name', text('Name or handle'), '', True), field('Contact email', '<input class="zf-in" type="email" placeholder="you@example.com">', '', True)),
        field('Gig title', text('Hiring a DJ for a rooftop'), '', True),
        field('Description', area('What, where, how long, what you need.'), 'At least 20 characters.', True),
        '<div class="zf-pair">%s%s</div>' % (field('Compensation', text('$300')), field('Location', text('Pearl District'))),
        '<div class="zf-pair">%s%s</div>' % (field('Gig date', '<input class="zf-in" type="date" value="2026-07-18">'), field('Start time', '<input class="zf-in" type="time" value="20:00">')),
        photos('Photo (optional)', 'An event flyer or the venue logo.', 1),
        toggle('Remote / hybrid friendly'),
        rules('I agree to the Gigz rules: pay what you post, no unpaid exposure gigs.')])
    out.append(form('zc-gigz', 'Gigz · Post a gig', 'Post a gig', 'Paid work for each other, Pride week and beyond.', gg, 'Post it', B('f76ffb39070669324d3ea514531e88f6')))
    return ('<section class="zdir zroom" aria-label="Composer forms"><header class="zdir-head"><h2>Composer forms</h2>'
            '<p>The forms that make the cards, in the new design. Fields and order follow the live composers. Hoüz adds a move in month that drives the month stamp.</p></header>'
            '<div class="zf-row">%s</div></section>\n') % ''.join(out)
