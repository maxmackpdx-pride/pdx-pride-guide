import type {PlacePresentation} from './placezAdapter';
const assetUrl=(url:string)=>(globalThis as {__PLACEZ_ASSETS__?:Record<string,string>}).__PLACEZ_ASSETS__?.[url]??url;
/** Review-only addition. Source dates/credits in public/placez-next/ATTRIBUTION.md. */
export const nextPresentationFor=(base='/placez-next'):Record<number,PlacePresentation>=>Object.fromEntries(([
  [9, "sports-bra", "Women\u2019s sports bar", "The first sports bar dedicated exclusively to women's sports, founded by Jenny Nguyen. A national phenomenon rooted in Portland."],
  [8, "kann", "Wood-fired Haitian restaurant", "James Beard Award\u2013winning wood-fired Haitian restaurant by Chef Gregory Gourdet. One of Portland's most celebrated dining destinations."]
] satisfies Array<[number,string,string,string]>).map(([id,slug,descriptor,descriptorSource])=>[id,{
 slug,descriptor,descriptorSource,accent:'#FF7B00',imageFit:'contain',imagePosition:'50% 0%',
 heroUrl:assetUrl(`${base}/${slug}-hero-720.webp`),logoUrl:assetUrl(`${base}/${slug}-logo.svg`),
 cutoutMaskUrl:assetUrl(`${base}/${slug}-header-cutout.svg`),wideCutoutMaskUrl:assetUrl(`${base}/${slug}-wide-header-cutout.svg`),
 glassUrl:(size:string)=>assetUrl(`${base}/restaurant-${size==='wide-map'?'wide':size==='expanded'?'tall':size}-glass.svg`)
}]));
