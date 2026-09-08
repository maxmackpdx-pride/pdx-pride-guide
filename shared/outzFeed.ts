export type OutzFeedKind = "weather" | "post" | "checkin" | "carpool";
export type OutzFeedItem = {
  id: string;
  kind: OutzFeedKind;
  title: string;
  body: string;
  placeName: string;
  href: string;
  createdAt: string;
  tripDate?: string;
  author?: string;
  endsAt?: string;
};
export type OutzFeedPayload = {
  items: OutzFeedItem[];
  fetchedAt: string;
  weatherUnavailable: boolean;
  weatherUpdatedAt: string | null;
};
