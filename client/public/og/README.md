# Zaylist social link images

Six PNGs, 1200 x 630 each. These are the images that show up when a Zaylist
link gets shared: Facebook and Instagram link previews, iMessage and SMS
cards, Slack and Discord unfurls, Bluesky, LinkedIn, and anything else that
reads Open Graph tags.

They are cards, not posters. Each one says what the page is, drops the
Zaylist wink, and gets out.

## Files

| File | Use it on |
| --- | --- |
| zaylist-home-fallback-1200x630.png | Homepage, and the site-wide default for any page without its own image |
| zaylist-housing-1200x630.png | HAUSING, the housing board (/hausing) |
| zaylist-events-1200x630.png | Events (/events) and Schedule (/schedule) |
| zaylist-missed-connections-1200x630.png | Missed Connections! (/spotted) |
| zaylist-gig-board-1200x630.png | Gig Board (/pride-work) |
| zaylist-gifting-1200x630.png | Gifting (/gifting) |

The home file is the fallback. If a page has no image of its own, serve that
one rather than letting the platform pick something out of the page.

## How to use them

Per page, in the head:

    <meta property="og:image" content="https://www.zaylist.com/og/zaylist-housing-1200x630.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">

Notes:
- Use absolute URLs. Relative paths do not unfurl.
- Facebook and iMessage cache aggressively. Change the filename (or add a
  version query) when you replace an image, or the old one keeps showing.
- Every card is safe at thumbnail size: the board name, the Zaylist line and
  the JOIN NOW line all hold up small. Anything smaller than that was left off
  on purpose.

## What is on them

Each card carries the rainbow seam, the board's own accent colour, the board
name at full size, one line of what it is, and the footer line:
JOIN NOW  BECAUSE, FUCK META!

Housing also shows a sample room listing with roommates and a pet, so the
board reads as people rather than rentals.

## Source

Built from the Zaylist design system. The editable original is
"Zaylist Share Cards.dc.html" in this project: open it, change copy or swap a
photo, then re-export the card you touched at 1200 x 630.
