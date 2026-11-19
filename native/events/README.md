# Zaylist Events for iOS and Android

This Expo prototype renders native poster rows, event details, account forms, buttons and sharing controls. It uses the same public event records, cookie-backed sign-in, private event saves and attendance routes as the website. The mobile package and lockfile are independent of the website.

## Run

From `native/events`, run `npm ci` and `npm start`. Scan the local Metro QR code in an Expo Go client compatible with SDK 58. To build a development app locally, use `npm run ios` with CocoaPods, Xcode and an installed simulator or development device, or `npm run android` with a configured Android SDK, Java toolchain and emulator or USB device. The project config generates native projects on demand. For a controlled nonproduction API, set `EXPO_PUBLIC_ZAYLIST_ORIGIN` to its reachable HTTPS origin before starting Metro.

## Event journey

1. Browse the upcoming poster list. Enter an event, venue or date to filter it. Open a poster, return to browsing and check that the selected filter and list position persist.
2. Share the event from detail. Its public URL carries the event ID and exact Pacific occurrence date, including multi-day listings. Paste that link into **Open shared event** in the app. Opening a missing occurrence shows an unavailable message. An ended event can be read from its link.
3. A custom link opens the installed development app directly. For example, substitute a current ID and date into `zaylistevents://events/123?date=2026-11-22`. In Expo Go use its project URL plus `/--/events/123?date=2026-11-22`. Web URLs remain ordinary public Zaylist links until store-owned universal-link and Android App Links associations exist.
4. Sign in with an existing username or email and password. Cancel returns to the same event. **Save privately** updates the personal schedule. **Mark Going publicly** writes a public attendance record. Each is reversible. Existing Going records retain their own visibility until withdrawn. Save and Going belong to the event ID through the website’s current contracts. Opening or sharing a date does not create a separate daily RSVP. Sign out and use a second account to verify the first member’s private save is absent.

## Verification

- `npm test` checks public links, installed-app links, exact occurrence dates and Pacific midnight conversion. `npm run bundle` exports Hermes bundles for both platforms. `npx expo prebuild --no-install` generates the Xcode and Gradle projects from the checked-in config. Native project generation and bundle export were verified on macOS.
- From the repository root, run `node --import tsx --test --test-force-exit server/nativeEventJourney.test.ts server/eventPlanning.test.ts`. These use temporary SQLite databases and loopback HTTP. They exercise the real signed-in session, exact-date detail, cross-account privacy, reversible save/Going, organizer metrics and event-linked gigs, plus scoped carpool permissions and seat capacity.
- This machine has Xcode and no installed iOS simulator devices. CocoaPods and the Android SDK were unavailable. Signed IPA/APK packaging, physical-device cookie behavior, share sheet, Android system Back and cross-app HTTPS dispatch require a device or configured emulator. The native app has not been distributed to either store.
