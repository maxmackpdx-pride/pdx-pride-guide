import type {PlacePresentation} from './placezAdapter';
/** Exact saved artwork, never a regenerated stand-in. See public provenance. */
export const recoveredPresentation:Record<number,PlacePresentation>={
 15:{slug:'Tin-Shed',descriptor:'Cafe',descriptorSource:'Existing directory record 15, cafe category; recovered source-façade QA.',accent:'var(--cat-cafes)',heroUrl:'/placez-recovered-batch/Tin-Shed-building.png',imageFit:'cover',imagePosition:'50% 100%',glassUrl:size=>`/placez-recovered-batch/cafe${size==='square'?'':size==='wide-map'?'-wide':size==='expanded'?'-tall':'-'+size}-glass.svg`},
 9:{slug:'The-Sports-Bra',descriptor:'Women’s sports bar',descriptorSource:'Existing saved Sports Bra staging, directory record 9.',accent:'#FF7B00',heroUrl:'/placez-recovered-batch/The-Sports-Bra-rainbow-review.png',logoUrl:'/directory-logos/thesportsbra-white.svg',imageFit:'cover',imagePosition:'50% 100%',glassUrl:size=>`/placez-recovered-batch/restaurant${size==='square'?'':size==='wide-map'?'-wide':size==='expanded'?'-tall':'-'+size}-glass.svg`},
};
