import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const source=fs.readFileSync(new URL('../client/src/pages/MapzMapDemo.tsx',import.meta.url),'utf8'),shared=fs.readFileSync(new URL('../shared/directoryLogos.ts',import.meta.url),'utf8');
const normalizeSource=shared.slice(shared.indexOf('export function normalizeDirectoryName'),shared.indexOf('const WAYPOINT_ART_BY_STEM')).replace('export ','');
const functions=source.slice(source.indexOf('const ADULT_VENUES'),source.indexOf('function firstImage'));
const context={directoryTypeColor:type=>`color:${type}`,resolveDirectoryLogo:(name,image)=>image||`logo:${name}`,serviceWaypointLogo:(place,fallback)=>place.imageUrl||fallback};
vm.runInNewContext(ts.transpileModule(normalizeSource+functions+'\nglobalThis.api={normalizeDirectoryName,mapzVenueLookup,mapzEventColor,eventBrandLogos,phraseWords,normalizedPhraseIncludes};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
const api=context.api,plain=value=>JSON.parse(JSON.stringify(value));
const oldWords=value=>value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const oldIncludes=(haystack,needle)=>{const phrase=oldWords(needle);return phrase.length>=3&&` ${oldWords(haystack)} `.includes(` ${phrase} `)};
const places=[{id:1,name:'Café & Bar',type:'group',imageUrl:'host-cafe'},{id:2,name:'Cafe and Bar',type:'venue',imageUrl:'first-venue'},{id:3,name:'Café & Bar',type:'bar',imageUrl:'duplicate-venue'},{id:4,name:'Queer Joy',type:'group',imageUrl:'short-host'},{id:5,name:'Queer Joy PDX',type:'group',imageUrl:'long-host'},{id:6,name:'DJ',type:'group',imageUrl:'too-short'},{id:7,name:'Hawks PDX',type:'adult',imageUrl:'adult'}];
function oldBrands(event,places){const host=places.filter(place=>place.type==='group'&&oldIncludes(`${event.title} ${event.description||''}`,place.name)).sort((a,b)=>b.name.length-a.name.length)[0];const hostLogo=host?context.serviceWaypointLogo(host,context.resolveDirectoryLogo(host.name,host.imageUrl)):null;const key=api.normalizeDirectoryName(event.venueName||'');const venue=places.find(place=>place.type!=='group'&&api.normalizeDirectoryName(place.name)===key);const venueLogo=venue?context.serviceWaypointLogo(venue,context.resolveDirectoryLogo(venue.name,venue.imageUrl)):context.resolveDirectoryLogo(event.venueName||'');if(hostLogo&&venueLogo&&hostLogo!==venueLogo)return {primary:venueLogo,alternate:hostLogo,directoryId:venue?.id,alternateDirectoryId:host?.id,hostName:host?.name};return {primary:venueLogo||hostLogo||undefined,directoryId:venue?.id||host?.id,hostName:host?.name};}
test('normalized phrase matching preserves accent, punctuation, whole-word and short-name behavior',()=>{
 for(const [text,needle] of [['CAFÉ—SOIR presents','cafe soir'],['Queer Joyful PDX','Queer Joy'],['Queer Joy PDX!','Queer Joy'],['DJ set tonight','DJ'],['A & B party','A & B'],['Hawk’s party',"Hawk's"],['Élan: live','elan'],['','']])assert.equal(api.normalizedPhraseIncludes(api.phraseWords(text),needle),oldIncludes(text,needle));
});
test('venue lookup preserves first non-group match and remains scoped to each snapshot',()=>{
 const index=api.mapzVenueLookup(places);assert.equal(index.get(api.normalizeDirectoryName('Café & Bar')).id,2);const revised=api.mapzVenueLookup([places[2],...places]);assert.equal(revised.get(api.normalizeDirectoryName('Café & Bar')).id,3);assert.equal(index.get(api.normalizeDirectoryName('Café & Bar')).id,2);
});
test('brand selection retains longest group precedence, accents and duplicate venue identity',()=>{
 const index=api.mapzVenueLookup(places);
 for(const event of [{title:'QUÉER JOY PDX presents!',venueName:'Café & Bar'},{title:'Queer Joyful',venueName:'Cafe and Bar'},{title:'DJ presents',venueName:'Unknown'},{title:'Café & Bar',description:'Queer Joy PDX',venueName:'Café & Bar'}])assert.deepEqual(plain(api.eventBrandLogos(event,places,index)),plain(oldBrands(event,places)));
 const chosen=api.eventBrandLogos({title:'Queer Joy PDX',venueName:'Café & Bar'},places,index);assert.equal(chosen.directoryId,2);assert.equal(chosen.alternateDirectoryId,5);
});
test('venue colors preserve adult rules and ordinary first-match/default behavior',()=>{
 const index=api.mapzVenueLookup(places);assert.equal(api.mapzEventColor({venueName:'Café & Bar'},index),'color:venue');assert.equal(api.mapzEventColor({venueName:'Missing',eventTypes:'invalid'},index),'color:venue');
 for(const event of [{venueName:'HÁWKS-PDX'},{venueName:'Café & Bar',isSexPositive:true},{venueName:'Café & Bar',nudityOk:true},...['SEX_POSITIVE','NUDITY_OK','KINK'].map(tag=>({eventTypes:JSON.stringify([tag])}))])assert.equal(api.mapzEventColor(event,index),'#FF0000');
});
