export type OutzPhotoQuiet={cx:number;cy:number;rx:number;ry:number};
/** Mirror of the iframe's photoQuietStyle contract; only bounded finite geometry becomes CSS. */
export function photoQuietStyle(quiet:unknown):Record<string,string>|undefined{
 if(!quiet||typeof quiet!=='object')return undefined;
 const {cx,cy,rx,ry}=quiet as OutzPhotoQuiet;
 if(![cx,cy,rx,ry].every(v=>typeof v==='number'&&Number.isFinite(v))||rx<=0||ry<=0||cx-rx<0||cx+rx>1||cy-ry<0||cy+ry>1)return undefined;
 const clearArea=Math.PI*rx*ry*.94**2;
 if(clearArea<.30||clearArea>.45)return undefined;
 return Object.fromEntries([['x',cx],['y',cy],['rx',rx],['ry',ry]].map(([key,value])=>['--quiet-'+key,((value as number)*100).toFixed(4)+'%']));
}
