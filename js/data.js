// The Last Road Trip v2 — game data. Pure data, runs in the browser and in Node (balance bot).
var LRT = (typeof LRT !== 'undefined') ? LRT : {};
(function(L){
const pad = n => (n < 10 ? '0' : '') + n;
L.img = (set, i) => 'assets/c/' + set + '_' + pad(i) + '.webp';
L.HUD = { fuel:0, food:1, batt:2, parts:3, film:4, treats:5, clock:6, spirit:7, wear:8, weight:9, map:10, paw:11 };
L.UI = { blueprint:0, lampOn:1, lampOff:2, look:3, photo:4, star:5, starOff:6, lock:7, feather:8, spark:9, ticket:10, trophy:11 };
L.WEATHER = [
  { id:'sun',  n:'Clear',    idx:0, d:'Easy driving.' },
  { id:'over', n:'Overcast', idx:1, d:'Flat light. Nothing unusual.' },
  { id:'rain', n:'Rain',     idx:2, d:'Slow roads. +1 hour per drive.' },
  { id:'wind', n:'Wind',     idx:3, d:'Headwind. +1 fuel per drive.' },
  { id:'dust', n:'Dust',     idx:4, d:'Grit in everything. Extra wear on long drives, and more roadblocks.' },
  { id:'fog',  n:'Fog',      idx:5, d:'More animals on the road.' },
];
L.WEATHER_BY_ID = {}; L.WEATHER.forEach(w => L.WEATHER_BY_ID[w.id] = w);

// ---------- things you carry ----------
// tags are what a tool can do at a Roadblock
L.GADGETS = {
  radio:   { n:'Crank Radio', i:0, d:'Soothes animals at a Standoff. Plays any Mixtape you find.', tags:['music'], sell:3 },
  binoc:   { n:'Binoculars', i:1, d:'Shows what kind of stop is next to you on the atlas.', sell:3 },
  compass: { n:'Compass', i:2, d:'Shows the hidden side road in every region.', sell:3 },
  tape:    { n:'Duct Tape', i:3, d:'Patch 2 wear off the van, once. Gets used up.', use:'wear', sell:2 },
  thermos: { n:'Thermos', i:4, d:'Every camp: +1 Spirit.', sell:3 },
  bag:     { n:'Sleeping Bag', i:5, d:'Sleeping rough, away from a camp or a stop, costs no extra Spirit.', sell:3 },
  whistle: { n:'Tin Whistle', i:6, d:'A steady note. Big calm at a Standoff, once per encounter.', tags:['music'], sell:3 },
  lens:    { n:'Camera Lens', i:7, d:'Better photos: restoring a Wonder gives +1 Spirit.', sell:4 },
  torch:   { n:'Flashlight', i:8, d:'One extra look at every stop.', sell:3 },
  rope:    { n:'Rope', i:9, d:'Clears a Tangled or Stuck Roadblock.', tags:['tangled','stuck'], sell:3 },
  hatchet: { n:'Hatchet', i:10, d:'Clears Wood. Opens a lockbox.', tags:['wood'], sell:3 },
  gloves:  { n:'Work Gloves', i:11, d:'Clears Debris.', tags:['debris'], sell:2 },
};
L.GIFTS = {
  honey:   { n:'Jar of Honey',     i:0,  tags:['sweet'], sell:2 },
  bread:   { n:'Loaf of Bread',    i:1,  tags:['savory','warm'], sell:1 },
  bananas: { n:'Bananas',          i:2,  tags:['sweet'], sell:1 },
  hot:     { n:'Hot Sauce',        i:3,  tags:['savory'], sell:2 },
  yarn:    { n:'Ball of Yarn',     i:4,  tags:['warm'], sell:2 },
  book:    { n:'Paperback',        i:5,  tags:['read'], sell:2 },
  tin:     { n:'Tobacco Tin',      i:6,  tags:['keepsake'], sell:2 },
  peaches: { n:'Canned Peaches',   i:7,  tags:['sweet'], sell:1 },
  coffee:  { n:'Coffee Tin',       i:8,  tags:['warm'], sell:2 },
  cheese:  { n:'Wheel of Cheese',  i:9,  tags:['savory'], sell:2 },
  flowers: { n:'Wildflowers',      i:10, tags:['bright'], sell:1 },
  soap:    { n:'Bar of Soap',      i:11, tags:['clean'], sell:1 },
};
L.TAGN = { sweet:'something sweet', savory:'something savory', warm:'something warm', read:'something to read', keepsake:'a keepsake', bright:'something bright', clean:'something clean', music:'music' };
// dashboard keepsakes: passive effects (max 4 on the dash)
L.SOUV = {
  conch:    { n:'Conch Shell', i:0, d:'Standoffs start with +10 calm.', fx:{ calm:10 } },
  postcard: { n:'Faded Postcard', i:1, d:'Vistas give +1 extra Spirit.', fx:{ vista:1 } },
  marble:   { n:'Glass Marble', i:2, d:'One extra look at every stop.', fx:{ look:1 } },
  key:      { n:'Brass Key', i:3, d:'Opens safes and lockboxes for free.', fx:{ key:1 } },
  globe:    { n:'Snow Globe', i:4, d:'Camp: +1 Spirit.', fx:{ camp:1 } },
  robot:    { n:'Tin Robot', i:5, d:'Repairs cost 1 fewer part (min 1).', fx:{ fix:1 } },
  boot:     { n:'Boot Charm', i:6, d:'Close Calls forgive one hit.', fx:{ cc:1 } },
  pressed:  { n:'Pressed Flower', i:7, d:'Haggles open 15 mood higher.', fx:{ haggle:15 } },
  necklace: { n:'Shell Necklace', i:8, d:'Gas pumps charge 1 less per unit (min 1).', fx:{ gas:1 } },
  plate:    { n:'Blank License Plate', i:9, d:'Tows are free once per trip.', fx:{ tow:1 } },
  starpin:  { n:'Star Pin', i:10, d:'Wonders restore for 1 fewer part.', fx:{ wonder:1 } },
  music:    { n:'Music Box', i:11, d:'Every second drive: +1 Spirit, even without a Mixtape.', fx:{ drive:1 } },
};
// Mixtapes: found across trips, kept forever. One plays at a time (needs the crank radio).
L.TAPES = [
  { id:'blue',  n:'Blue Highway',     i:0, d:'Every second drive: +1 Spirit.', fx:{ drive:1 }, from:'Start of the trip' },
  { id:'brass', n:'Sunday Brass',     i:1, d:'Standoffs start with +8 calm.',  fx:{ calm:8 }, from:'Odile, Gulf Coast' },
  { id:'slow',  n:'Slow Radio',       i:2, d:'Camp: +1 Spirit.',              fx:{ camp:1 }, from:'Walt, Gulf Coast' },
  { id:'wide',  n:'Wide Open',        i:3, d:'Haggles open 10 mood higher.',  fx:{ haggle:10 }, from:'Rosa, Texas' },
  { id:'neon',  n:'Neon Hum',         i:4, d:'Close Calls forgive one hit.',  fx:{ cc:1 }, from:'The Sign Boneyard' },
  { id:'last',  n:'Last Light',       i:5, d:'Every second drive: +1 Spirit. Camp: +1 Spirit.', fx:{ drive:1, camp:1 }, from:'Ines, at Sunspire' },
];
L.TAPE_BY_ID = {}; L.TAPES.forEach(t => L.TAPE_BY_ID[t.id] = t);

// ---------- companions ----------
L.PASS = {
  pelican: { n:'Pelican', i:0, d:'Spots the next fuel: gas stops charge 1 less.', fx:{ gas:1 }, home:'fl' },
  raccoon: { n:'Raccoon', i:1, d:'Opens any crate, cooler or lockbox, free.', fx:{ key:1 }, home:'gulf' },
  armadillo:{ n:'Armadillo', i:2, d:'Digs out one extra find at every stop.', fx:{ look:1 }, home:'tx' },
  crow:    { n:'Crow', i:3, d:'Shows where hidden side roads start.', fx:{ hint:1 }, home:'mj' },
  cat:     { n:'Barn Cat', i:4, d:'Camp: +1 Spirit.', fx:{ camp:1 }, home:'tx' },
  rabbit:  { n:'Jackrabbit', i:5, d:'Close Calls forgive one hit.', fx:{ cc:1 }, home:'mj' },
};
L.NPC = {
  mara:   { n:'Mara',   img:['npc_a',0], role:'Shrimper' },
  dot:    { n:'Dot',    img:['npc_a',1], role:'Diner owner' },
  juniper:{ n:'Juniper',img:['npc_a',2], role:'Hitchhiker' },
  wendell:{ n:'Wendell',img:['npc_a',3], role:'Trucker' },
  rosa:   { n:'Rosa',   img:['npc_a',4], role:'Rancher' },
  odile:  { n:'Odile',  img:['npc_b',0], role:'Band leader' },
  walt:   { n:'Walt',   img:['npc_b',1], role:'Mail carrier' },
  dee:    { n:'Dee',    img:['npc_b',2], role:'Sign painter' },
  ines:   { n:'Ines',   img:['npc_b',3], role:'Sunspire caretaker' },
  ray:    { n:'Ray Pruitt', img:['npc_b',4], role:'Map seller' },
};

// ---------- the van: six hardpoints, two parts each ----------
L.HARD = [
  { id:'roof',  n:'Roof',   a:'rack',    b:'solar' },
  { id:'front', n:'Front',  a:'bullbar', b:'winch' },
  { id:'wheels',n:'Wheels', a:'tires',   b:'spare' },
  { id:'rear',  n:'Rear',   a:'tank',    b:'toolbox' },
  { id:'side',  n:'Side',   a:'awning',  b:'stove' },
  { id:'cab',   n:'Cab',    a:'lantern', b:'cb' },
];
L.VPARTS = {
  rack:   { n:'Roof Rack',     i:0,  w:2, cost:3, d:'Carry 4 more things. Catches headwinds: +1 fuel in wind.', bp:'start' },
  solar:  { n:'Solar Panels',  i:3,  w:2, cost:4, d:'+1 battery at every camp.', bp:'The Starlite Drive-In' },
  bullbar:{ n:'Bull Bar',      i:1,  w:3, cost:4, d:'Honking is safer. Clears Debris and Heavy things. Close Calls: forgives a hit.', bp:'Gulf Coast' },
  winch:  { n:'Winch',         i:11, w:3, cost:5, d:'Clears Heavy and Stuck Roadblocks.', bp:'Texas' },
  tires:  { n:'Off-road Tires',i:2, w:2, cost:4, d:'Rain and dust cost nothing extra. Close Calls: forgives a hit.', bp:'Florida Wonder' },
  spare:  { n:'Spare Wheel',   i:6,  w:1, cost:2, d:'Absorbs your first breakdown: no tow.', bp:'start' },
  tank:   { n:'Water & Fuel Tank', i:4, w:3, cost:4, d:'Fuel capacity 10 → 15.', bp:'Mojave' },
  toolbox:{ n:'Toolbox',       i:8,  w:1, cost:3, d:'Each part repairs 1 more wear.', bp:'Florida' },
  awning: { n:'Awning',        i:5,  w:1, cost:3, d:'Camp: +1 Spirit.', bp:'Gulf Wonder' },
  stove:  { n:'Wood Stove',    i:9,  w:2, cost:4, d:'Camp meals stretch: eat 1 less food each night.', bp:'Texas Wonder' },
  lantern:{ n:'Lantern',       i:7,  w:1, cost:2, d:'Drive past dusk without penalty: +2 hours a day.', bp:'start' },
  cb:     { n:'CB Radio',      i:10, w:1, cost:3, d:'Forecasts 3 days. Shows stop types next to you.', bp:'Mojave Wonder' },
};
L.WEIGHT_LIGHT = 4; L.WEIGHT_HEAVY = 8; // 0-4 light, 5-7 normal, 8+ heavy (+1 fuel per drive)

// ---------- animals you meet on the road ----------
L.CRITTERS = {
  gator:  { n:'Gator',  i:0, calm:20, pat:5, decay:6, likes:'food', big:1, scrap:'a gator, sunning itself on warm asphalt',
            intro:['A gator is lying across the lane, sunning itself on warm asphalt.', 'A gator has come up out of the ditch and settled in the middle of the road, as if it paid for the lane.', 'There is a gator on the centerline, eyes half shut, and no sign it has noticed the van.'],
            win:['The gator slides back into the ditch without any hurry.', 'It opens one eye, thinks about it, and heads for the water.', 'The gator goes off the shoulder in one long, slow motion.'] },
  boar:   { n:'Wild Boar', i:1, calm:18, pat:5, decay:8, likes:'food', scrap:'a boar, deciding about you',
            intro:['A boar stands in the road and looks at you as if deciding about you.', 'A boar has stopped at the edge of the lane, head low, in no mood to be hurried.', 'A boar and two stripes of piglets are halfway across. The boar has turned to face you.'],
            win:['The boar turns and trots into the brush.', 'It huffs once and leads the others off the road.', 'The boar steps aside, offended, and lets you through.'] },
  bear:   { n:'Black Bear', i:2, calm:15, pat:5, decay:7, likes:'food', big:1, scrap:'a bear with somewhere better to be',
            intro:['A black bear is sitting at the side of the road with the look of someone with somewhere better to be.', 'A bear is walking down the middle of the road, unbothered, and has not left it.', 'There is a bear on the shoulder, going through a dropped bag of something.'],
            win:['The bear loses interest and ambles into the trees.', 'It shuffles off the road and does not look back.', 'The bear takes its time, then is gone.'] },
  cougar: { n:'Cougar', i:3, calm:14, pat:5, decay:7, likes:'sound', scrap:'a cougar on a fence post',
            intro:['A cougar is stretched along a fence post beside the road, watching the van.', 'A cougar crosses the road in three long strides, then stops on the far side and looks back.', 'There is a cougar on the culvert, tail down, perfectly still.'],
            win:['The cougar drops off the post and melts into the scrub.', 'It decides you are not worth the walk and goes.', 'The cougar leaves the way it came: without a sound.'] },
  coyote: { n:'Coyote', i:4, calm:22, pat:6, decay:5, likes:'sound', scrap:'a coyote who has seen your type',
            intro:['A coyote is trotting down the center line, and has seen your type before.', 'A coyote sits at the edge of the road, looking you over, in no hurry at all.', 'Two coyote eyes catch the headlights at the shoulder. It has not decided whether to cross.'],
            win:['The coyote wanders off the road and waits in the grass until you are past.', 'It tilts its head, then trots away along the fence.', 'The coyote slips under the wire and is gone.'] },
  steer:  { n:'Longhorn', i:5, calm:25, pat:6, decay:5, likes:'food', big:1, scrap:'a longhorn, in no hurry at all',
            intro:['A longhorn is standing in the road, in no hurry at all.', 'A longhorn has lain down across both lanes and will not be argued with.', 'One longhorn, wide as the van, is chewing and looking at the horizon in the middle of the road.'],
            win:['The longhorn heaves itself up and ambles away.', 'It steps off the road with great dignity.', 'The longhorn moves exactly as far as it has to.'] },
};
// Roadblock obstacles (top-down sprites): tags say what clears them
L.OBST = {
  log:     { n:'Fallen Log',      i:0, tags:['wood'],            reg:[0,1,2] },
  boulder: { n:'Boulder',         i:1, tags:['heavy'],           reg:[2,3] },
  barrel:  { n:'Rolled Barrels',  i:2, tags:['debris'],          reg:[0,1,2,3] },
  weed:    { n:'Tumbleweeds',     i:3, tags:['tangled'],         reg:[2,3] },
  pallet:  { n:'Pallet Pile',     i:4, tags:['wood','debris'],   reg:[0,1,2] },
  tire:    { n:'Truck Tire',      i:5, tags:['heavy'],           reg:[1,2,3] },
  tarp:    { n:'Tarp & Wire',     i:6, tags:['tangled','stuck'], reg:[0,1,3] },
  puddle:  { n:'Washed-out Dip',  i:7, tags:['stuck'],           reg:[0,1,2] },
};
L.TAGSOLVE = { wood:['hatchet'], heavy:['winch','bullbar'], debris:['gloves','bullbar'], tangled:['rope','hatchet'], stuck:['rope','winch'] };
L.TAGNAME = { wood:'Wood', heavy:'Heavy', debris:'Debris', tangled:'Tangled', stuck:'Stuck' };

// ---------- the four regions ----------
// template nodes (same shape every region): [type, sceneSlot, flip, hidden, x, y]
// atlas positions are per-region (fractions of the painting)
L.NODE_T = [
  { t:'town',   s:'town' },      // 0
  { t:'gas',    s:'gas' },       // 1
  { t:'stop',   s:'stop' },      // 2
  { t:'camp',   s:'camp' },      // 3
  { t:'vista',  s:'vista' },     // 4
  { t:'wonder', s:'wonderA', w:'A' }, // 5
  { t:'house',  s:'house' },     // 6
  { t:'wonder', s:'wonderB', w:'B' }, // 7
  { t:'wonder', s:'wonderC', w:'C', hidden:1 }, // 8
  { t:'trader', s:'town', flip:1 }, // 9
  { t:'camp',   s:'camp', flip:1 },  // 10
  { t:'gas',    s:'gas', flip:1 },   // 11
  { t:'stop',   s:'stop', flip:1 },  // 12
  { t:'cross',  s:'cross' },         // 13
];
L.EDGES = [[0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[3,6],[4,6],[5,7],[5,9],[6,9],[6,7],[7,8],[7,10],[8,10],[9,10],[9,11],[10,12],[11,12],[11,13],[12,13]];
L.GEN_POS = [[.20,.88],[.52,.85],[.20,.73],[.46,.70],[.14,.59],[.74,.60],[.36,.52],[.62,.44],[.86,.38],[.30,.37],[.55,.31],[.16,.23],[.42,.19],[.72,.10]];
L.POS_FN = {
  fl: p => { // follow the island chain
    const y = p[1], keys=[[.08,.84],[.2,.84],[.38,.78],[.55,.62],[.7,.40],[.88,.20]]; let cx=.5;
    for (let i=0;i<keys.length-1;i++){ const a=keys[i],b=keys[i+1]; if (y>=a[0]&&y<=b[0]){ cx=a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0]); } }
    return [Math.max(.1,Math.min(.9,cx+(p[0]-.4)*.5)), p[1]];
  },
};
L.REGIONS = [
  { id:'fl', pre:'fl', n:'The Florida Keys', short:'Florida', price:1, weather:{sun:.4,over:.12,rain:.3,wind:.18},
    blurb:'Salt air and empty resorts. The road runs out over open water.',
    wild:['gator','boar'], tint:'#6fb7ae',
    names:['Mara\'s Landing','Gas & Bait','Coral Cafe','Mangrove Camp','Old Pier Lookout','The Big Orange','Stilt House','The Starlite Drive-In','The Lighthouse at Shell Key','Harbor Market','Palm Camp','Tidewater Gas','Flamingo Motel','Seven Mile Bridge'],
    wonders:{ A:{id:'orange',n:'The Big Orange',cost:3,verb:'Wire the sign',txt:'A fruit stand with a forty-foot orange on the roof. The neon is dead but the glass tubes are all there.', done:'The orange comes on slowly, then all at once. It is the warmest thing for a hundred miles.'},
              B:{id:'starlite',n:'The Starlite Drive-In',cost:4,verb:'Start the projector',txt:'A white screen on a field of cracked gravel. The projection booth is padlocked but not locked.', done:'Light on the screen. Nothing is playing, and that turns out to be enough.'},
              C:{id:'lighthouse',n:'Shell Key Lighthouse',cost:4,verb:'Light the lamp',txt:'Red and white stripes, a lamp room with the glass still whole. Someone has been keeping the stairs clear.', done:'The beam sweeps once across the water and keeps going.'} },
    cross:{ n:'Seven Mile Bridge', seq:['roadblock','closecall'], txt:'The only way west is seven miles of bridge with the sea on both sides. Something has been left across the lane.', len:10 } },
  { id:'gulf', pre:'gulf', n:'The Gulf Coast', short:'Gulf Coast', price:1, weather:{sun:.22,over:.2,rain:.3,fog:.28},
    blurb:'Spanish moss, slow water, brass bands somewhere out of sight.',
    wild:['gator','boar','bear'], tint:'#8a9a6a',
    names:['Bayou Landing','Pump & Pantry','Dockside Diner','Cypress Camp','River Bend','Bayou Radio WBRT','Crawfish Shack','The Marguerite','Old Millhouse','Boat Dock Market','Mossy Camp','Parish Gas','Kitchen on the Water','The Toll Bridge'],
    wonders:{ A:{id:'radio',n:'Bayou Radio WBRT',cost:3,verb:'Bring it on air',txt:'A tin shack with a mast taller than any tree. The transmitter hums when you touch it.', done:'The mast starts to sing. Across the water, porch lights flicker on.'},
              B:{id:'marguerite',n:'The Marguerite',cost:4,verb:'Fire up the boiler',txt:'A riverboat tied to cypress roots. Its calliope is still on the top deck.', done:'The calliope sounds three notes. A heron lifts off, unbothered.'},
              C:{id:'mill',n:'The Old Millhouse',cost:3,verb:'Free the wheel',txt:'A mill on a creek, wheel jammed with branches. Someone has painted a door green.', done:'The wheel turns. The whole house settles, like it is exhaling.'} },
    cross:{ n:'The Toll Bridge', seq:['haggle','closecall'], txt:'The bridge has a toll booth, a lantern, and one person who would like to talk first.', len:12 } },
  { id:'tx', pre:'tx', n:'The Texas Plains', short:'Texas', price:2, weather:{sun:.36,over:.12,rain:.12,wind:.3,dust:.1},
    blurb:'Big sky, long fences, wind that does not stop and a lot of room to think.',
    wild:['boar','coyote','steer','cougar'], tint:'#d6a35a',
    names:['Prairie Junction','Last Chance Pumps','Windmill Cafe','Tank Camp','Storm Watch','Wind Pumps','Rosa\'s Barn Road','The Grain Elevator','The Star Gate','Feed Store Market','Mesa Camp','Highway 9 Gas','Tin Roof Cafe','The Cattle Guard'],
    wonders:{ A:{id:'windpumps',n:'The Wind Pumps',cost:4,verb:'Free the blades',txt:'A field of windmills, half of them locked in place by rust and bird nests.', done:'The blades catch, one after another, until the whole field is turning.'},
              B:{id:'elevator',n:'The Grain Elevator',cost:4,verb:'Ring the bell',txt:'Concrete silos, a rail car on a siding. The bell rope hangs just out of reach.', done:'One long note rolls out across the wheat and does not come back.'},
              C:{id:'stargate',n:'The Star Gate',cost:3,verb:'Wire the stars',txt:'A ranch gate with a steel star on top. Someone has strung lights along the fence.', done:'The star glows amber against the evening, a small thing and a good one.'} },
    cross:{ n:'The Cattle Guard', seq:['standoff','roadblock'], txt:'The road ahead is a cattle grid across open range. The herd has not heard about the road.', len:12 } },
  { id:'mj', pre:'mj', n:'Route 66 & the Mojave', short:'Mojave', price:2, weather:{sun:.5,over:.05,wind:.2,dust:.25},
    blurb:'Salt flats, blue-hour neon and the last long stretch to the coast.',
    wild:['coyote','cougar','steer'], tint:'#c98d5b',
    names:['Amboy Junction','Desert Pumps','Starlight Motel','Joshua Camp','Sunset Viewer','The Sign Boneyard','Adobe House','The Dish','The Sundial','Desert Market','Dune Camp','Salt Flat Gas','Pool Hall Motel','Amboy Road'],
    wonders:{ A:{id:'boneyard',n:'The Sign Boneyard',cost:4,verb:'Light a sign',txt:'Old motel and casino signs, hauled out here when the town stopped paying their power bills. A boot, a star, a martini glass. Dee has been standing them back up.', done:'One by one, the old signs go amber. The boot goes last.'},
              B:{id:'dish',n:'The Dish',cost:4,verb:'Turn it to the sky',txt:'A radio dish the size of a house, aimed at nothing in particular. The motor still works.', done:'It swings slowly to the east and holds. You can feel it listening.'},
              C:{id:'sundial',n:'The Sundial',cost:3,verb:'Clear the face',txt:'A bronze gnomon on a stone ring, buried to the hour marks in drifted sand.', done:'The shadow falls exactly where it should. It is later than you thought.'} },
    cross:{ n:'Amboy Road', seq:['standoff','closecall','roadblock'], txt:'The last pass before the coast. Salt, wind, and a long straight road with surprises on it.', len:14 } },
];
L.REG_NAMES = ['Florida','Gulf Coast','Texas','Mojave'];

// shop prices etc
L.PRICE = { fuel:[1,1,2,2], food:[1,1,1,2], part:[2,3,3,4] };
L.JOBPAY = [3, 3, 4, 4];
L.FUEL_CAP = 10; L.PACK = 8; L.HOURS = 8;
L.MAXTOW = 5;

// persisted cross-trip things; see core.freshMeta
L.WONDER_IDS = []; L.REGIONS.forEach(r => ['A','B','C'].forEach(k => L.WONDER_IDS.push(r.wonders[k].id)));
L.BP_START = ['rack','spare','lantern'];

if (typeof module !== 'undefined') module.exports = L;
})(LRT);
