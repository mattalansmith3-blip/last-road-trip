# The Last Road Trip — Progress

## Milestone 1 — MVP (2026-11-04 PT)
- Regions: Florida (boss Big Al) and Gulf Coast (Krewe boss).
- Systems: map with heat, stops/20 events, loot containers (sniff/pick/force), pack, dashboard souvenirs + combos, garage modules, traders, tactical fights with Biscuit actions, meta postcards/achievements, daily seed, mute.
- Art: 106 generated assets; text rendered in code. Audio: WebAudio synthesized.
- Tests: real-tap Playwright runs at 390x844 and 844x390; balance bot ~39% win.
- Next: Texas + Mojave regions, finale at Sunspire Park, balance to 20–40 min.

## Loops 1–3 (2026-11-04 PT)
- Fixed portrait fight arena collapse, toast spam, landscape loot cutoff. Live real-tap runs at both sizes: 0 errors, 0 offscreen issues.
- Gaps: Texas/Mojave + Sunspire finale regions not yet built; garage not hit by tap bot; fuel economy harsh.

## Milestone 2 — Full route + finale, Heat removed (2026-11-04 PT)
- New regions: Texas Big Empty (boss: Rodeo Clown Posse feat. Kevin the bear) and Route 66 & the Mojave (boss: the Sand Queen of Amboy).
- New enemies with tells: Cougar (stalk → pounce), Picnic Bear (rear → maul, or eats your food and leaves), Coyote (fast, scrams when hurt), Giant Scorpion (tail up → poison sting), Dusty Dee outlaw (aim → shot).
- 12 new events; new characters Grandma Rosa and Big Wendell the trucker; new art (2 maps, 2 fight backgrounds, motel stop, 5 enemies, 2 NPCs, finale palace, postcard).
- Finale: 3 beats — rides power up, friends you met waiting at the palace, a postcard home.
- Heat chase removed entirely (per Matthew). Pacing pressure is now resource tension: per-drive fuel/food, lingering eats supplies, Marigold wear rises by region, enemies scale by region.
- Fixes: toasts clear on screen change (no radio overlap), trader Leave pinned, garage covered by real-tap tests.

## Wrap-up (2026-11-04 PT)
- Live real-tap loops (GitHub Pages build): portrait and landscape both played Florida → Gulf → Texas → Mojave → finale (all 3 finale beats) with 0 JS errors; garage upgrades/repairs tapped and verified (state changed).
- Fixes: landscape garage banner shrunk so upgrade buttons are on screen; region-arrival heal 14; play.py medkit loop bug fixed.
- Balance bot (1500 runs): ~39% win, avg ~28 min est (4 s/action), ~19 drives, ~11 fights won.
- Gaps: no hand-timed human run; the bot's minutes figure is an estimate.

# v2 "Road Atlas" redesign (2026-11-10 PT)
The v1 combat game was replaced by a full rewrite. Because the rewrite touched every file, the first three milestones landed in one build; each is logged separately below.

## v2 Milestone 1 — Phase 0 fixes, combat removed, new encounters
- Combat, enemies, containers-as-loot-minigame and the Heat chase are gone (old assets deleted).
- Economy: fuel and food costs rebalanced so a normal trip cannot spiral; HUD cells are labelled (Fuel, Food, Batteries, Parts, Treats, Spirit, Van wear); a sheet warns before a drive you cannot afford; selling asks for confirmation; coach cards teach the HUD, looking around, and the first upgrade; Mara in Florida guarantees the first upgrade (4 parts, rack blueprint known).
- New systems: 8-hour daylight days (night driving costs wear and Spirit), weather with a forecast, Van Wear and Spirit meters, Tow instead of game over.
- Encounters: Standoff (Calm ring), Roadblock (tags solved by tools), Haggle (tags and gifts), Close Call (3-lane real-time dodge). Each region ends with a Crossing chaining two or three encounters.
- Fonts: Fredoka/Nunito replaced by Barlow, Barlow Condensed and Caveat (all OFL, bundled).

## v2 Milestone 2 — Exploration
- Fogged atlas that clears as you travel, hidden side roads unlocked by clues from characters, tap-to-search scenes with limited looks, Biscuit's nose (spends a treat to point at what is left), 12 restorable Wonders, a 42-page Scrapbook, 6 Mixtapes (synthesized in WebAudio), per-region postcards.

## v2 Milestone 3 — Upgrades and meta
- Six hardpoints (roof, front, wheels, rear, side, cab), two parts each, with weight and a fuel penalty when heavy; blueprints persist between trips; 6 passengers with perks; Sunspire Park lights one lamp per restored Wonder permanently; Gentle Mode (calmer animals, slower roads, extra Close Call tolerance, unlimited tows).

## v2 Milestone 4/5 — Art and copy
- All illustrations, icons and textures were generated in a single gouache style and cut/converted to webp (assets/ ~4 MB). Layout, route strokes, the fog mask, Calm ring, bars and all text are code.
- Copy rewritten in a plain, sincere voice. Landscape: Pack, Scrapbook and Menu now use the full width.

## v2 test results
- Balance bot (500 runs each): reach Sunspire 100% at reflex skill .8, 91.8% at .65, 77% at .6, 34% at .5; median run 28-31 min. Gentle Mode at skill .7: 100%, median 26.8 min.
- Real-tap Playwright (390x844 and 844x390): 0 JS errors. The tap bot occasionally stalls in landscape on a scene with a locked box or an unreached spot; this has not been reproduced as a game bug.

## v2 follow-up 1 — stall investigation and soft-lock guards (2026-11-10 PT)
- Cause of the "stuck scene" stalls: search spots could be placed close enough that a closed box sprite sat on top of a still-hidden spot, so taps landed on the box and the spot could not be reached; two boxes could also overlap. Fixes: spots keep at least .2 apart (300 placement tries), box sprites are narrower (16%), and tapping a box near an unfound spot now counts as a look instead of opening the box.
- Cause of the "stuck atlas" stalls: not a game soft-lock. The test bot kept tapping during the 1 s drive animation. Real players are now guarded as well: pins and Drive are ignored while the van is driving.
- Landscape: Pack, Scrapbook and Menu use the full width; the finale/postcard painting now sits in the left 44% so the lighthouse is no longer hidden behind the card. Coach "upgrade" card now shows right after the first part pickup; Continue resumes without a half-finished encounter.
- Verification: real-tap runs at 390x844 and 844x390 both played Florida to the Sunspire finale (won) in ~305 steps each, 0 JS errors, 0 layout issues. Bot (200 runs, skill .65): 93% reach Sunspire, median 30 min.

## v2 review fixes 1 — economy, encounters, landscape, copy, rewards, art (2026-11-10 PT)
Source: Zombie Bot 2's full review (ideas/ZB2_FULL_REVIEW_V2.md). Done in ZB2's priority order.
- Economy: fuel use per leg is lower (1 + 4 x distance, wind/heavy/wear surcharges capped), Gentle is half fuel with no surcharges, free tows with no limit. Odd jobs (1 hour, +2/+3 batteries) at town, gas, stop and trader nodes give guaranteed battery income and are flagged "Running low? Start here." when fuel or batteries are low. Tows top the tank up. Region-border gift is bigger. New human-like bot (tools/human.js).
- Landscape: a nav rail on the right, compact HUD, sticky panel header, pinned primary action buttons, and a scroll cue (fade plus chevron) when there is more below. Layout re-runs on resize, orientationchange, visualViewport and matchMedia, with retries, so rotating mid-run is correct at once (checked in real-tap runs).
- Close Calls: sparser rows, a clear lane always adjacent to the last, lane guide strips with a green glow, honest "Hits n of N allowed" labels, wear capped at 2 per run.
- Standoffs: patience is shown, a mercy turn when the ring looks full, backing out of a crossing restarts it (1 hour) instead of skipping it. A first crossing miss is a retry (1 hour, +1 wear); the second is a tow.
- First haggle needs a gift, and the player starts with one. Finish is always at least 2 stars.
- Copy: How to Play, fill-the-tank, weather, gadgets, Last Light, tow limit (a sixth tow ends a regular trip) all match the rules.
- Dead rewards hooked up: Neon Hum from the Sign Boneyard, Blue Highway plays without the radio, Compass shows the side road, Rosa gives a Texas hint, region blueprints come from the Wonder restored.
- Art (GenerateImage, same gouache style): Sign Boneyard repainted with signs instead of letters; the ten NPC portraits repainted with distinct, weathered faces and warm low-sun lighting; a new flatbed tow scene replaces the floating van. Layout, text, bars, the Calm ring and route strokes remain code.
- Bot (300 runs): human-like skill .7 reaches Sunspire 99%, median 31 min, 1.2 tows; Gentle 100%, 26 min, 0.2 tows; skill .4 60% (loses at the last crossing; Gentle is the answer); power bot 100%, 27 min.
