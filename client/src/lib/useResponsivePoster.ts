import { useEffect } from 'react';
import { queryClient } from './queryClient';
import { useQuery } from '@tanstack/react-query';
import { responsivePoster, type PosterVariants } from './responsivePoster';

let subscribers = 0;
let timer: ReturnType<typeof setInterval> | undefined;
/** One shared request for all visible poster components; never initiates processing. */
export function useResponsivePoster(src: string | null | undefined, sizes?: string) {
  const eligible = !!src && /^(https:\/\/www\.zaylist\.com)?\/(uploads|posters|event-posters)\//.test(src);
  useEffect(() => {
    if (!eligible) return;
    subscribers++;
    if (!timer) timer = setInterval(() => {
      if (document.visibilityState === 'visible') void queryClient.invalidateQueries({ queryKey: ['/api/poster-variants'], exact: true });
    }, 30_000);
    return () => { if (--subscribers === 0) { clearInterval(timer); timer = undefined; } };
  }, [eligible]);
  const { data, isPending, fetchStatus } = useQuery<Record<string, PosterVariants>>({
    queryKey: ['/api/poster-variants'],
    queryFn: async ({ signal }) => {
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      const timeout = setTimeout(abort, 2_000);
      try {
        const response = await fetch('/api/poster-variants', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Poster metadata unavailable');
        return await response.json();
      } finally { clearTimeout(timeout); signal.removeEventListener('abort', abort); }
    },
    enabled: eligible,
    staleTime: 30_000,
    retry: false,
  });
  // Wait briefly for shared metadata rather than downloading the large original first.
  if (eligible && isPending && fetchStatus === 'fetching') return { src: undefined };
  return responsivePoster(src ?? '', sizes, data);
}
