import json,textwrap
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[2]; D=ROOT/'client/public/motifs/outz/places'; rows=json.loads((D/'research.json').read_text())
def pine(x,y,s=1):
 return f'<g transform="translate({x} {y}) scale({s})"><path d="M0 0V-70M-21-15L0-50 21-15M-16-34L0-70 16-34"/></g>'
def sign(name):
 lines=textwrap.wrap(name.replace(' TH','').title(),18)
 text=''.join(f'<text x="126" y="{37+i*23}" text-anchor="middle">{escape(line)}</text>' for i,line in enumerate(lines))
 h=24+23*len(lines)
 return f'<g data-trail-sign="outz-v1"><path d="M16 12H232L248 {12+h/2} 232 {12+h}H16ZM45 {12+h}v25M54 {12+h}v25"/><g fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-size="22" font-weight="700">{text}</g></g>'
scenes={
'usfs-8156.004621':('Volcanic Broken Top approach with exposed ridges and sparse subalpine trees','https://www.hikeoregon.net/no-name-lake.html','https://www.hikeoregon.net/uploads/2/9/0/0/29006543/view-of-mt-bachelor-from-broken-top-trail_orig.jpg',
 '<path d="M17 167L49 142 78 153 118 103 132 117 149 99 193 152 218 135 247 169M99 127L118 136 132 117M149 99L161 133 177 143M74 247Q108 214 143 202T169 171M130 245Q167 218 171 201T179 174M23 208L37 201 48 211ZM201 225L216 213 228 225Z"/>'+pine(42,184,.6)+pine(229,191,.6)),
'usfs-8157.004621':('Farewell-connected forest singletrack and wooded valley contours','https://traveloregon.com/things-to-do/outdoor-recreation/hiking-backpacking/370-4601-junction-trailhead/','https://visitbend.com/wp-content/uploads/2023/09/rental-bike-farewell-402x700.jpg',
 '<path d="M64 248Q85 203 158 192T166 150M111 248Q117 220 179 212T186 150M66 127Q106 110 144 125T239 132M61 143Q109 128 148 142T238 148"/>'+pine(34,228,1.4)+pine(225,217,1.2)+pine(87,171,.65)),
'usfs-6795235010602':('Mt Hood forest singletrack network, with branching paths and bicycle','https://www.44trails.org/','https://www.44trails.org/',
 '<path d="M92 246Q93 205 143 178L113 149M133 246Q125 210 170 184L211 163M142 178L170 184M80 136L123 109 149 89 177 119 214 135M137 106L149 113 162 104"/><circle cx="59" cy="206" r="18"/><circle cx="117" cy="206" r="18"/><path d="M59 206L76 178 94 206H59M76 178H105L117 206M94 206L105 178 100 168H112M69 176H83"/>'+pine(27,173,.8)+pine(236,219,1.2)),
'usfs-5179010262':('Douglas-fir and pine campsite with a fallen log and creek','https://thedyrt.com/camping/oregon/oregon-abbott-creek-campground','https://photos.thedyrt.com/photo/1242358/media/oregon-abbott-creek-campground_e25605f4-bb08-4c05-89f4-8eeb66366168.jpg',
 pine(34,166,1.4)+pine(209,164,1.75)+pine(158,136,.8)+'<path d="M57 185L96 130 133 185ZM80 185L97 151 114 185M96 130L151 178 133 185M21 217Q70 194 134 212T244 205M19 232Q67 211 126 226T242 221M165 188L213 177 216 186 168 197Z"/>'),
'usfs-6961801010602':('Acker Divide forest and Cripple Camp shelter','https://cherylhill.net/blog/2023/09/08/acker-divide-trail/','https://live.staticflickr.com/65535/53117164349_9543375aff_b.jpg',
 pine(28,225,1.8)+pine(225,219,1.65)+'<path d="M57 173L131 131 198 172 181 177 131 149 75 180ZM76 180V222H183V177M88 175V213M175 175V213M91 217H171M90 186H110M152 187H175M16 243Q65 225 119 237T247 238"/>'),
'usfs-5030010262':('Siskiyou forest lake, shoreline irises and submerged log','https://campflare.com/campground/acorn-woman-lakes-973','https://cdn.campflare.com/8bbf10b1ea4835350f9f7106e890c0ba/medium.jpg',
 '<path d="M18 84Q51 47 86 78T161 71T244 86M18 139Q80 108 163 137T244 149M41 156Q91 143 156 154M62 173Q125 163 209 179M22 233Q89 190 148 209T243 212M119 190L167 173 181 177 137 198ZM40 221V170M39 184Q19 165 26 153Q41 155 40 173Q42 152 53 154Q60 173 42 187M47 219L57 196"/>'+pine(32,125,.6)+pine(212,137,.8)+pine(169,119,.55)),
'usfs-5719010274':('Tall conifers and a riverbank campsite along Adams Creek Fork','https://www.recreation.gov/camping/campgrounds/232857','https://maps.roadtrippers.com/us/randle-wa/camping-rv/adams-fork-campground',
 pine(44,179,1.85)+pine(208,166,1.6)+pine(153,126,.85)+'<path d="M20 197Q83 161 143 177T245 161M20 216Q87 179 146 196T245 182M43 239Q110 211 162 226T245 213M86 159L114 120 143 159ZM103 158L115 138 127 159M174 211L189 204 201 213M82 226L98 218"/>')
}
for id,(feature,url,image,paths) in scenes.items():
 r=next(x for x in rows if x['id']==id); trail=r['kind']=='trailhead'; color='#FF6600' if trail else '#39FF14'
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 264 264" color="{color}"><title>{escape(r["name"])}</title><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">{paths}{sign(r["name"]) if trail else ""}</g></svg>'
 (D/f'{id}.svg').write_text(svg)
 r.update(status='drawn-awaiting-visual-review',asset=f'/motifs/outz/places/{id}.svg',visualFeatures=[feature],references=[{'url':url,'image':image}])
 if id in ['usfs-8156.004621','usfs-8157.004621']: r['referenceScope']='Connected trail landscape, not a literal photograph of the numbered road junction.'
 if id in ['usfs-6795235010602','usfs-5719010274']:r['status']='drawn-needs-direct-image-reference'
(D/'research.json').write_text(json.dumps(rows,indent=2)+'\n')
# Regenerate the explicit asset map only for locations with completed drawings.
p=ROOT/'client/src/pages/Outz.tsx';s=p.read_text();a=s.index('const customMotifs:');b=s.index('\n',a)
s=s[:a]+'const customMotifs: Record<string,string> = '+json.dumps({r['id']:r['asset'] for r in rows if r['asset']})+';'+s[b:];p.write_text(s)
