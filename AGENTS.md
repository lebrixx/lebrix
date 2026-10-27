# Project rules
- Keep Brix Rush's solo world and sprite painters in `src/games/brix-rush`; adapt shared HUD, boosts and game-over flows outside the engine so original gameplay stays isolated.
- Bundle Brix Rush sprites as source-controlled imports for native offline play; asset-serving URLs are not available in the local/native runtime.
- Use the distinct `brix_rush` score identity and the shared ranked/free mode lists; keep historical Orbit Dodge data untouched and excluded so different games never share records.

- Render the main-menu wordmark as a transparent image with constrained dimensions to preserve the supplied lettering style without changing navigation layout.
- Use a full-viewport app-content scroller with initially offset app-screens and shared dialog clearance tokens, so fixed controls start lower while scrolling content can reach the phone's top without native insets.
- Use the shared GameHUD for every active 3D mode so scores remain independently centered and sound/coin placement stays consistent.
- Keep the shop's paid-offer summaries separate from purchasing logic and open existing offer dialogs to preserve native purchase and restoration flows.- Keep all AdMob unit/app IDs in src/ads/adConfig.ts with an explicit test/production switch, so ad mode can be flipped in one place (Info.plist app ID must match).
