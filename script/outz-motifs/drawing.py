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

def save(scenes):
 for id,(feature,url,image,paths) in scenes.items():
  r=next(x for x in rows if x['id']==id); trail=r['kind']=='trailhead'; color='#FF6600' if trail else '#39FF14'
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 264 264" color="{color}"><title>{escape(r["name"])}</title><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">{paths}{sign(r["name"]) if trail else ""}</g></svg>'
  (D/f'{id}.svg').write_text(svg)
  r.update(status='drawn-awaiting-visual-review',asset=f'/motifs/outz/places/{id}.svg',visualFeatures=[feature],references=[{'url':url,'image':image}])
 (D/'research.json').write_text(json.dumps(rows,indent=2)+'\n')
 p=ROOT/'client/src/pages/Outz.tsx';s=p.read_text();a=s.index('const customMotifs:');b=s.index('\n',a)
 s=s[:a]+'const customMotifs: Record<string,string> = '+json.dumps({r['id']:r['asset'] for r in rows if r['asset']})+';'+s[b:];p.write_text(s)
