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

## v2 review fixes 2 — pinned bar, landscape fit, look wording (2026-11-10 PT)
- Pinned action bars no longer sit on top of content. Any panel with a pinned bar is split into a scrolling area and a bar below it (U.splitPanels), so nothing can be hidden under the bar. The scroll cue and the sticky header live in the scrolling area. Scroll position is kept when a scene panel refreshes.
- Landscape haggle now fits at 844x390 and 740x360 with the gift cards fully visible above the bar: compact header (title and role on one line), smaller gift cards, compact bar buttons, and a short-screen (max-height 380) tier with a lighter HUD (no chip captions, smaller pips).
- HUD: the daylight pips overflowed their cell and the weather "next:" icon was clipped at short heights. Fixed with smaller pips, a wider weather cell, and nowrap labels. The standoff patience pips sat past the edge of the art column in landscape; moved inside it.
- Landscape encounter buttons are shorter so more of a standoff's choices show before the scroll cue.
- Audit script (screens x 844x390, 740x360, 390x844): scene, scene at a crossing, trader, gas, house, haggle, standoff, crossing standoff, roadblock, close call, garage, pack, scrapbook, menu, atlas. Checks that every tappable element is reachable and not covered, that the bar never overlaps the scroll area, and that no HUD cell clips. All pass.
- Search wording: a find with no reward now says "Just rust and an empty can. It still counts as found, and you keep the look." A miss says how many looks are left. The scene hint reads "N of M hidden things found. A find gives the look back." and updates after every look.
- Real-tap runs: 390x844 with two rotations, 844x390 with two rotations, and 740x360, all finished Florida to the Sunspire finale with 0 tows and 0 JS errors. (The one `open-ok` tap timeout is the test bot tapping a disabled locked-box button.)

## v3 fixes 1 — economy, stranded way out, encounter variety, shuffled atlas (2026-11-10 PT)
Source: Zombie Bot 2's fun review v3 (ideas/ZB2_FUN_REVIEW_V3.md). Key finding: a careful first-timer could not reach Sunspire; odd jobs paid +2, the pump charged 2 per fuel, and each leg cost 2-3 fuel plus weather.
- Balance bot recalibrated (tools/human.js): models a first-timer who finds about 40% of hidden things, searches and haggles only sometimes, explores unseen stops, pushes on, drives at dusk and misses Close Call rows. Profiles: cautious, typical, hasty, expert. Run against the previous build, the cautious profile reached Sunspire 65% of the time with 40% of runs spending more than 6 days in a region (ZB2 spent 7 and 6 days in the Gulf and Texas).
- Economy: a day of odd work now pays 3-4 batteries (was 2-3); fuel costs 1-2 batteries by region (was 2); a leg costs at most 3 fuel; the van can be pushed for at most 2 missing fuel; a tow costs 2 batteries (was 3) and tops the tank up to 4; a rest day costs a day but no longer a meal; Wonders always hold parts and the first one on a trip is a part cheaper; a gift is always placed before each crossing; search finds weigh towards what you are short of.
- No stall without a way out: when fuel is low and there is no work at a stop, the atlas and the scene show "Wait for a passerby" (2 hours, enough fuel for the next stop, once per stop per day). The Drive button states how much fuel is missing when a leg is too far to push.
- Haggling without a gift: "Talk for a while" (1 hour, Spirit +1) opens a small trade, so no haggle is a dead end. Walking away from a crossing haggle costs 1 hour.
- Close Calls: a single hit is free; two or more cost 2 wear; a clean run pays back fuel, batteries or a part (a bag at a crossing).
- Variety: no encounter of the same kind on two drives in a row; no repeat of the same animal or obstacle; each animal has three opening lines and three ending lines; roadblocks are region-themed (no tumbleweed in the Keys).
- Shuffled atlas: each trip permutes which slot holds which stop (names, scenes and stories move together) and picks one of several road layouts per region, keeping the early route supplied and the late route fed. Region identity is unchanged.
- Tow card: "N of 5. A sixth tow ends the trip." / "Five tows. One more ends the trip." / "That's six. This is the end of the road." Tow art is now Florida causeway, Gulf bayou, or desert depending on the region (GenerateImage, same gouache style).
- Crossing ready card: the "part N of M" chip no longer overlaps the title.
- Bot numbers: see the v3 final entry.

## v3 fixes 2 — hints, later-trip stories, crossings, delights, landscape, art seams (2026-11-10 PT)
- Wonders: when you are short of parts the Wonder screen says where parts come from (houses, crates, under roadblocks; every Wonder hides a part or two). Repair is no longer in a stronger colour than the Wonder button on a Wonder screen.
- Later trips unlock stories (the `req` system): eight new beats keyed to what earlier trips left behind. People who remember you: Dot's honor stand (Florida), Juniper on the guardrail (Gulf), Rosa's open gate (Texas), Dee's new sign (Mojave), each needing a finished or ended earlier trip plus having met them. Lit lamps change the road: the Big Orange glow at the Overlook (also points to the hidden road), Request Line on the radio, the full stock tanks at the Wind Pumps, and the Boneyard boot at dusk. Wendell turns up again in the Mojave if you met him earlier. The title now carries a hook line (the next dark Wonder, or where the last trip ended).
- Kindness from strangers in every region: the Gulf porch cooler, the Texas feed store sack for the dog, the Mojave motel key. They are weighted to show up before the generic fillers.
- Companions act at the stop: a card with the companion shows when it matters (pelican at a pump naming the real price, raccoon on a found container, armadillo digging, barn cat at camp, crow when a hidden road is known, jackrabbit on the dash at a crossing and Close Call).
- Crossings are a beat: a card with the painting, how many parts, and your fuel, wear and Spirit before "Begin"; the postcard after shows the day, tows so far and Wonders lit in that region. The "part N of M" chip is now inside the ready card above the title.
- Six-tow ending gets its own handwritten postcard on the "Trip Ends Here" card. The player character (the unused hero art) now appears at rest days, camp, Wonder restores and region postcards.
- Landscape: event choices sit in the pinned bar so they are always above the fold (844x390 and 740x360), the scroll chevron is a real 44px button (it scrolls) instead of a decoration over the content, and the fade no longer sits over buttons. The atlas fills the art column with a blurred copy of the same painting instead of black bars.
- Art seams (GenerateImage, same gouache style): Florida gas repainted with Gulf water instead of desert buttes; the Sign Boneyard repainted with only object signs (cactus, moon, sun, boot, star, glass, mug), no letter shapes.
- Tools: the real-tap bot handles the crossing card and the van/pack screens; human.js has a --nohelp switch.
