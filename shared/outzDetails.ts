export type OutzForecastDay = { date: string; highF: number | null; lowF: number | null; summary: string; wind: string; rainChance: number | null };
export type OutzSpotFact = { label: string; value: string; source: string; href: string; asOf?: string };
export type OutzDetails = {
  placeId: string; fetchedAt: string; forecastUpdatedAt: string | null;
  forecast: OutzForecastDay[]; forecastUnavailable: boolean;
  facts: OutzSpotFact[]; factsUnavailable: boolean;
  rating: { average: number | null; count: number };
};
