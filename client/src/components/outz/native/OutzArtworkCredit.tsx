import credits from '../../../../public/outzide-native/batch1/credits.json';

export type OutzArtworkRecord = {src:string;author:string;sourceUrl:string;license:string;licenseUrl:string;changes:string;qa:string;sha256:string};
export const approvedOutzArtwork = credits as Record<string,OutzArtworkRecord>;

/** Source/derivative attribution travels with the artwork, never inferred from filename. */
export function OutzArtworkCredit({placeId}:{placeId:string}) {
  const credit=approvedOutzArtwork[placeId];
  if(!credit) return null;
  return <span><a href={credit.sourceUrl}>Source photograph: {credit.author}</a>{' · '}<a href={credit.licenseUrl}>{credit.license}</a>. {credit.changes}</span>;
}
