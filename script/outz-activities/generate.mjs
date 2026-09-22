import fs from 'node:fs';
const root=new URL('../../',import.meta.url),base=new URL('client/public/outzide-map/',root);
const data=JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url)));
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const pine=(x,y,k=1)=>`<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0V-58M-18-12 0-45 18-12M-13-29 0-58 13-29"/></g>`;
function artwork(p){
 const seed=[...p.id].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,1);const n=seed%17,water=p.kind!=='atv';
 const mountain=`<path d="M15 116 55 ${49+n} 82 83 119 ${28+n} 173 91 199 ${56+n} 249 122M98 ${54+n}l21 ${-26} 22 32-16-5-9 9-9-5M34 117q31-10 61 2M176 118q29-13 60-2"/>`;
 const dunes=`<path d="M14 105Q68 ${30+n} 130 98T250 96M19 126Q82 75 141 117T251 120M41 104q25-21 62-17M163 112q37-18 66-12"/>`;
 const canyon=`<path d="M15 119V69l22-6 9-23 31 8 5 26 22 8v31M161 113V64l26-7 8-28 31 12 5 30 18 8v40M23 83l48-8M29 95l49-6M182 76l49 5M175 96l60 8"/>`;
 const trees=p.landscape==='dunes'||p.landscape==='desert'?'':pine(28,132,.7)+pine(52,129,.48)+pine(236,143,.7)+pine(212,130,.43);
 let scene=(p.landscape==='dunes'?dunes:p.landscape==='desert'?canyon:mountain)+trees;
 if(water){
 scene+=`<path d="M16 147Q66 ${130+n} 108 145T248 146M12 204q23-9 44 0t44 0M166 211q23-9 44 0t40 0M25 233q27-10 53 0t53 0 53 0 53 0"/>`;
 if(p.kind==='fishing')scene+=`<g transform="translate(${n/3-3} 0)"><path d="M66 173q43-44 102-5l29-20-2 44-28-17q-56 37-101-2ZM151 158q-9 15 0 30M108 151l15-16 15 18M113 192l14 13 10-19M82 169q17-11 35-8M38 135 83 52q35-28 74-5M157 47q14 20 10 46v29q0 17-11 17t-10-11l6 5M42 129l8 5"/><circle cx="163" cy="170" r="2"/><circle cx="56" cy="111" r="7"/></g>`;
 else if(seed%2)scene+=`<path d="M65 179h131l-18 25H85l-20-25ZM122 177V88M116 95l-44 72h44V95ZM129 118l43 50h-43v-50ZM86 211q24 8 49 0t50 0M121 88l22 8-22 5"/>`;
 else scene+=`<path d="M58 176q63 11 144-2l-26 30H82l-24-28ZM91 179v-28h51l24 24M105 151l10-20h32l20 43M119 137h23l15 18h-43M180 181v-17h13v14M86 211q24 8 49 0t50 0"/>`;
 }else{
 scene+=`<path d="M22 232q62-27 99-8t119-6M32 208l35-12M205 197l29 5M33 170l12-3M205 220l18 2"/><g transform="translate(${n/4-2} 0)"><ellipse cx="77" cy="185" rx="20" ry="26"/><ellipse cx="180" cy="180" rx="20" ry="26"/><ellipse cx="77" cy="185" rx="9" ry="14"/><ellipse cx="180" cy="180" rx="9" ry="14"/><path d="m64 162-9-11 23-20 40 4 17-13 42 14 15 19-8 4M87 158l20 22 50-6 13-23M101 169l10-16 39-4 14 12M83 136l8-17 28 3M124 134l9-22-10-13h-15M126 102l20-4M105 157l-3-15 26 2M145 136l23 6M78 167l6 4M60 179l5 1M61 195l5-2M80 207l-1-5M164 162l6 4M162 177l5 1M166 197l4-4M181 202l-1-5"/></g>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 264 264"><title>${esc(p.name)}</title><desc>Outzide ${p.kind} line illustration with ${p.landscape||'lake'} motifs. Decorative artwork, not a navigation map.</desc><g fill="none" stroke="${p.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${scene}</g></svg>\n`;
}
for(const p of data.places)fs.writeFileSync(new URL(p.art,base),artwork(p));
const path=new URL('places.json',base),catalog=JSON.parse(fs.readFileSync(path));
const ids=new Set(data.places.map(p=>p.id));catalog.places=catalog.places.filter(p=>!ids.has(p.id)).concat(data.places);
catalog.activityCatalog={checkedAt:data.checkedAt,selection:data.selection,countsPerState:{fishing:30,boating:15,atv:10}};
fs.writeFileSync(path,JSON.stringify(catalog,null,2)+'\n');
fs.writeFileSync(new URL('shared/outzMapCatalog.ts',root),'/** Public destinations in the Outzide field map. */\nexport default '+JSON.stringify(catalog.places.map(({id,name,kind})=>({id,name,kind})),null,2)+';\n');
console.log(`Generated ${data.places.length} SVG illustrations; catalog now has ${catalog.places.length} destinations.`);
