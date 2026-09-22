export function outzSharePath(id: string) { return '/outzide/share/' + encodeURIComponent(id); }
export function outzShareId(pathname: string): string | null {
  const match = /^\/outzide\/share\/([^/]+)\/?$/.exec(pathname.split('?')[0]);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}
