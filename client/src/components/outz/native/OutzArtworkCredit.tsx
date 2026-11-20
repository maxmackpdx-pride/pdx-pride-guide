import { useQuery } from '@tanstack/react-query';

export type OutzArtworkRecord = {src:string;landscapePosition?:string;author:string;sourceUrl:string;license:string;licenseUrl:string;changes:string;derivativeLicense?:string;qa:string;sha256:string};
export function useOutzArtwork() {
  return useQuery<Record<string,OutzArtworkRecord>>({
    queryKey: ['/outzide-native/batch1/credits.json'],
    queryFn: async () => {
      const response = await fetch('/outzide-native/batch1/credits.json');
      if (!response.ok) throw new Error('Outdoor artwork credits are unavailable.');
      return response.json();
    },
    staleTime: Infinity,
  }).data;
}

/** Source/derivative attribution travels with the artwork, never inferred from filename. */
export function OutzArtworkCredit({placeId}:{placeId:string}) {
  const credit=useOutzArtwork()?.[placeId];
  if(!credit) return null;
  return <span><a href={credit.sourceUrl}>Source photograph: {credit.author}</a>{' · '}<a href={credit.licenseUrl}>{credit.license}</a>. {credit.derivativeLicense&&<>Adapted artwork licensed <a href={credit.licenseUrl}>{credit.derivativeLicense}</a>. </>}{credit.changes}</span>;
}
