/** Shared by marketplace create and edit; values are stored as integer cents. */
export function parseMarketplacePrice(value: unknown): number {
  const cents = Math.round(Number(value) * 100);
  if (!["string", "number"].includes(typeof value) || value == null || !Number.isFinite(cents) || cents < 100 || cents > 100_000_000) {
    throw new Error("Enter a price between $1 and $1,000,000.");
  }
  return cents;
}
