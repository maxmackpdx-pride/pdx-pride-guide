/** Founder-approved display cutoffs, not organizer-confirmed event end times. */
type FounderEndEstimate = {
  venueName: string;
  address: string;
  dateStart: string;
  dateEnd: string;
};

const APPROVED_END_ESTIMATES: Record<string, FounderEndEstimate> = {
  // Tucker's 2026-09-25 instruction for the ONYX bar night at Eagle Portland.
  // The formal ONYX meet-and-greet is 7-9 p.m.; this covers the broader bar night.
  "onyx-pnw-come-together-bar-night-2026-10-22": {
    venueName: "Eagle Portland",
    address: "835 N Lombard St, Portland, OR 97217",
    dateStart: "2026-10-22T19:00:00-07:00",
    dateEnd: "2026-10-23T01:30:00-07:00",
  },
};

export function isFounderApprovedEndEstimate(candidateKey: string, values: Record<string, unknown>): boolean {
  const approved = APPROVED_END_ESTIMATES[candidateKey];
  return Boolean(approved) && Object.entries(approved).every(([field, value]) => values[field] === value);
}
