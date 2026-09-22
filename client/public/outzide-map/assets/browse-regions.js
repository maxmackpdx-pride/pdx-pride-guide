// Browse regions are practical discovery areas, not administrative boundaries.
export const browseRegions = [
  {id:'portland-gorge',name:'Portland & the Gorge',note:'Portland, Mt. Hood, Sandy & the Columbia Gorge'},
  {id:'oregon-coast',name:'Oregon Coast',note:'Astoria to Brookings'},
  {id:'central-east-or',name:'Valley, Central & Eastern Oregon',note:'Salem, Eugene, Bend, the high desert & the Wallowas'},
  {id:'south-or',name:'Southern Oregon',note:'Umpqua, Crater Lake, Rogue Valley & Ashland'},
  {id:'olympic-coast',name:'Olympic & Washington Coast',note:'Olympic Peninsula, Long Beach & southwest Washington'},
  {id:'puget-north',name:'Puget Sound & Northwest Washington',note:'Seattle, the islands, Bellingham & foothills'},
  {id:'cascades-east-wa',name:'Washington Cascades & East',note:'Mountain passes, central Washington & the northeast'},
  {id:'southern-extension',name:'Northern California & Black Rock',note:'Redwoods, Shasta & the Black Rock Desert'},
];
export function browseRegionFor(p) {
  if(p.state==='CA'||p.state==='NV')return 'southern-extension';
  if(p.state==='WA'){
    if(p.lng < -123 || (p.lat < 46.7 && p.lng < -122.7))return 'olympic-coast';
    return p.lng < -121.8 ? 'puget-north':'cascades-east-wa';
  }
  if(p.state==='OR'){
    if(p.lng < -123.55)return 'oregon-coast';
    if(p.lat >= 45 && p.lng < -120.9)return 'portland-gorge';
    if(p.lat < 43.6)return 'south-or';
    return 'central-east-or';
  }
  return null;
}
export function matchesBrowse(p,region,activities=[]) {
  return (!region||browseRegionFor(p)===region)&&(!activities.length||activities.includes(p.kind));
}
