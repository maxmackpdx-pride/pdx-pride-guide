/** The v1 public catalog and the shared feed cache require both flags explicitly. */
export function hasPublicEventFlags(row: { isPublic?: boolean | number | null; isPrivate?: boolean | number | null }): boolean {
  return (row.isPublic === true || row.isPublic === 1) && (row.isPrivate === false || row.isPrivate === 0);
}
