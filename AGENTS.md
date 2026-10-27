# Project rules
- Keep Brix Rush's original world, sprite painters, realtime rooms and standalone interface in `src/games/brix-rush`; isolate its styles and adapt only navigation and secure score reporting outside the engine so other modes remain unchanged.
- Apply Brix Rush's source landscape transform only to the active race surface; leave pre-game menus unrotated so they remain portrait within the native app's portrait lock without changing other modes.
- Keep a single Brix Rush lobby subscription for the screen lifetime and a separate room subscription per active race; cleanup both on exit to avoid discovery races and duplicate realtime channels.
- Resolve Brix Rush player identity exclusively from the shared local identity and recheck it before room entry; never use a separate stored Brix name or truncate the canonical name.
- Bundle Brix Rush sprites as source-controlled imports for native offline play; asset-serving URLs are not available in the local/native runtime.
- Use the distinct `brix_rush` score identity and the shared ranked/free mode lists; keep historical Orbit Dodge data untouched and excluded so different games never share records.

- Render the main-menu wordmark as a transparent image with constrained dimensions to preserve the supplied lettering style without changing navigation layout.
- Use a full-viewport app-content scroller with initially offset app-screens and shared dialog clearance tokens, so fixed controls start lower while scrolling content can reach the phone's top without native insets.
- Use the shared GameHUD for every active 3D mode so scores remain independently centered and sound/coin placement stays consistent.
- Keep the shop's paid-offer summaries separate from purchasing logic and open existing offer dialogs to preserve native purchase and restoration flows.- Keep all AdMob unit/app IDs in src/ads/adConfig.ts with an explicit test/production switch, so ad mode can be flipped in one place (Info.plist app ID must match).
