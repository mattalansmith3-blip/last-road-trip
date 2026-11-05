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
