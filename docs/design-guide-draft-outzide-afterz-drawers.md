# Design-guide draft: Outzide and Afterz drawers

Status: product draft for the Foundation Library. Authority is Tucker's asks from 20 November 2026 (t342u and follow-ups). This is not a public quote of the library.

## Shared drawer top (already specified in DRAWER_TOP)

Every room drawer starts with the same untitled block: calendar or lead, countdown of the next three names over the lead flyer's full bleed, two-row Placez-style tag filters, dark gradient from the top, and a line before the next titled section. One shared filter config for every drawer and map.

## Outzide

- Above the countdown, instead of the calendar: a What's in view on the map rail of full-bleed mini cards (events and places currently on screen).
- The countdown may mix featured items with next up when someone is hosting a buddy event or offering a carpool.
- Ransom-note titles (white on black, exactly one whole word inverted) are for Outzide titles only.

## Afterz

- Wide, short cards with a `--yellow` bloom. Each card shows RSVP Yes / No, the host's name, and the type of Afterz.
- A wide Host an Afterz button sits above those cards.
- The Afterz window is 9 PM to 6 AM Pacific. During off hours the map blurs and the drawer is open with Host an Afterz in advance. Copy on the background underneath explains the times and how Afterz works: invite friends anytime; people in the area can request to join only once the window opens; it will not show on the map before then.

## Continuity

Mini cards use the same share (Apple-style ShareIcon, top right) and heart (interested, bottom right) placement as other small cards. Every swipe has a button alternative. Product code uses live APIs, not mocks. No attendee counts.
