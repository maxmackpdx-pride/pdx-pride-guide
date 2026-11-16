# Qualified OutZide artwork batch 1

Four assets only: Beacon Rock, Forest Park/Wildwood, Tumalo Falls, Federation Forest. No Nolte or Peace Arch candidate is qualified in this batch.

Additive staging commit only. Current release must finish before wiring/merging.

Integration steps:
1. Resolve approvedOutzArtwork by exact place.id in entryFor, prefer its src over legacy catalog image. Do not change category, counts, dimensions or other destination data.
2. In artwork credits, render OutzArtworkCredit with exact place.id. Credits JSON retains author/source/license/change disclosure. Forest Park derivative CC BY-SA3; Federation derivative CC BY-SA2. USGS public-domain Beacon and attributed Oregon State Archives Tumalo.
3. Scope an SVG alpha transfer filter to these four new artwork images only: feComponentTransfer > feFuncA type=linear slope=1.1 intercept=0. No RGB channel change. This saturates unintended nearopaque interior alpha without filling actual transparent torn fringe. Existing NativeOutzideFace CSS has filter:none!important; a sufficiently specific scoped selector must override this for the new assets, not globally.
4. Independent isolated rendering already passed black/white/magenta backdrops with that alpha filter. Recheck actual small/square/wide/tall and fullscreen expanded composition plus credit links after integration. Existing CSS may crop portraits differently; uniform card size rules remain locked.

Originals/provenance retained in Library checkpoints, not only this checkout. Candidate provenance URLs inspected for first three and source-agent verified Federation. Independent reviewer photo_conversion_b passed geometry/style and rendered alpha on each. These are illustrative historical source-based artworks, not current-condition photographs.

No production release has been made from this additive staging commit.
