// Stops and the people at them. Plain, specific, a little strange where the road is.
var LRT = (typeof LRT !== "undefined") ? LRT : require("./data.js"); if (typeof require !== "undefined" && !LRT.core) require("./core.js");
(function(L){
const C = L.core;
// opt: { t:label, cost:{res:n}, need:{gadget|gift|pass|souv|tag:...}, fx:{...}, r:result text, p:chance, fail:{fx, r} }
const E = [
 // ----- Florida -----
 { id:'mara', story:1, reg:0, node:0, who:'mara', t:'Mara\'s Landing',
   p:['Mara is hosing down the deck of a shrimp boat when you pull up. She looks at the van, then at the dog, then at the sky, and decides you are going to need things.',
      '"There is a coffee can in my shed with spare parts in it," she says. "Take it. The rack in the corner will fit your roof if you have the tools. Everything on this road wears out, honey. It helps to know how to fix it."'],
   o:[ { t:'Ask her about the road west', fx:{ parts:4, map:1, gift:'*', scrap:'n_mara' }, r:'She draws it on the back of a receipt: gas here, a cafe there, a drive-in worth the detour. You take the can of parts and she takes your dog\'s head in both hands.' },
       { t:'Take the can and a plate of shrimp', fx:{ parts:4, food:2, spirit:1, gift:'*', scrap:'n_mara' }, r:'The shrimp are peeled and still warm. You eat on the dock, then she walks you back to the van.' } ] },
 { id:'dot', story:1, reg:0, node:2, who:'dot', t:'Coral Cafe',
   p:['Dot runs the cafe alone and has opinions about all of it. A grey parrot named Ziggy sits on the pie case and says "Order up" at no one in particular.',
      '"Sit anywhere," she says. "I mean anywhere."'],
   o:[ { t:'Order the lunch plate', cost:{ batt:1 }, fx:{ food:2, spirit:1, scrap:'n_dot' }, r:'Fried fish, black beans, rice. It is the first sit-down meal in a long time. Dot refills your coffee without asking.' },
       { t:'Help her with the dish pile (1 hour)', fx:{ hours:1, gift:'hot', scrap:'n_dot' }, r:'An hour of hot water and chipped plates. She pays you in a bottle of her own hot sauce, and tells you about a lighthouse down a road that is not on any map.' },
       { t:'Ask about the lighthouse', fx:{ hint:1, scrap:'n_dot' }, r:'"Turn off at the shell pile after the drive-in," she says. "You will know it."' } ] },
 { id:'pelican', story:1, reg:0, node:3, who:null, img:['friends',0], t:'Mangrove Camp',
   p:['A pelican is standing on your picnic table. It is not leaving, and it is not asking, exactly. It is looking at the cooler.'],
   o:[ { t:'Share a can of sardines', cost:{ food:1 }, fx:{ pass:'pelican', spirit:1 }, r:'It eats three, thanks you with its whole body, and rides along on the roof until the next bridge. By evening it is pointing its beak at the cheaper pumps.' },
       { t:'Let it be', fx:{ spirit:1 }, r:'You sit with it for a bit. Eventually it leaves, and the evening feels a little bigger.' } ] },
 { id:'stilt', story:1, reg:0, node:6, who:null, img:['uiicons',8], t:'The Stilt House',
   p:['Someone left this house tidy. The windows are shut, the chairs are pushed in, and there is a letter weighted down with a conch shell on the table.',
      'It reads: "To whoever needs it. The toolbox is under the stairs. The mangoes are on the counter. Leave the door unlatched. - E."'],
   o:[ { t:'Take the toolbox', fx:{ bp:'toolbox', parts:2, scrap:'n_stilt' }, r:'It is a good toolbox, dented and organized. You take the sketches inside too, they show how it mounts on the back of the van.' },
       { t:'Take the mangoes and the shell', fx:{ food:2, souv:'conch', spirit:1 }, r:'You eat one on the porch. The shell goes on the dashboard.' } ] },
 { id:'ray0', story:1, reg:0, node:9, who:'ray', t:'Harbor Market',
   p:['A folding table under a tarp. Rolled charts, hand-copied atlases, a jar of loose tags that say things like "creek" and "probably fine."',
      '"Ray Pruitt," says the man behind it. "I sell what other people were too busy to notice."'],
   o:[ { t:'Haggle with him', haggle:'ray', r:'' }, { t:'Just look at what he has', shop:1, r:'' } ] },
 // ----- Gulf -----
 { id:'odile', story:1, reg:1, node:0, who:'odile', t:'Bayou Landing',
   p:['A brass band is rehearsing on a loading dock with the doors pulled up. Odile conducts with a wooden spoon.',
      '"Sit," she says. "We are in the middle of the second verse. You can help by being an audience."'],
   o:[ { t:'Sit in for a song (1 hour)', fx:{ hours:1, spirit:2, tape:'brass', scrap:'n_odile' }, r:'The tuba comes in last and the whole building shakes. When they finish, she hands you a cassette with SUNDAY BRASS written on it in marker.' },
       { t:'Offer them something sweet', need:{ tag:'sweet' }, fx:{ spirit:2, batt:3, tape:'brass', scrap:'n_odile' }, r:'They pass the jar down the line. Odile gives you the cassette and three batteries and a long look that means thank you.' } ] },
 { id:'juniper', story:1, reg:1, node:2, who:'juniper', t:'Dockside Diner',
   p:['Juniper is hitchhiking with a cardboard sign that just says WEST. She has a tent bag, a thermos and the manner of someone who has been waiting politely for a while.',
      '"I am headed to the Toll Bridge," she says. "I do not need much."'],
   o:[ { t:'Buy her a coffee', cost:{ batt:1 }, fx:{ hint:1, spirit:1, scrap:'n_juniper' }, r:'She talks about the old mill on the creek, where the road bends where it should not. You write it on the atlas.' },
       { t:'Give her a lift to the next stop (1 hour)', fx:{ hours:1, map:1, scrap:'n_juniper' }, r:'She sleeps for most of it. When she wakes, she hands you a map she drew herself, with every stop labeled.' } ] },
 { id:'raccoon', story:1, reg:1, node:3, who:null, img:['friends',1], t:'Cypress Camp',
   p:['Something is in the cooler. It has been in the cooler for a while. When you open the lid, a raccoon looks up at you with a cracker in each hand.'],
   o:[ { t:'Let it keep the crackers', cost:{ food:1 }, fx:{ pass:'raccoon', spirit:1 }, r:'It takes the crackers and stays. It spends the rest of the evening on the dash, testing latches.' },
       { t:'Close the lid gently', fx:{ spirit:1 }, r:'It watches you do it, a little hurt. You leave the lid open a crack.' } ] },
 { id:'walt', story:1, reg:1, node:6, who:'walt', t:'Crawfish Shack',
   p:['Walt has been delivering mail to places that have no one living in them for about ten years. "Someone might come back," he says. "And then there is a letter waiting."',
      'He has one for the keeper of the Toll Bridge, and a bad knee.'],
   o:[ { t:'Carry the parcel to the bridge', fx:{ batt:3, gift:'*', tape:'slow', scrap:'n_walt' }, r:'He pays you up front, and gives you a tape from the bottom of his bag. SLOW RADIO, it says. "For the long straight parts."' },
       { t:'Ask him about the roads', fx:{ map:1, spirit:1, scrap:'n_walt' }, r:'Walt knows every shortcut and every road that floods. You leave with a lot of his knowledge in your head.' } ] },
 { id:'wendell1', story:1, reg:1, node:1, who:'wendell', t:'Pump & Pantry',
   p:['A flatbed truck is pulled off with its hazards blinking. Wendell is looking at a flat tire the way you look at a bill.',
      '"I have the spare," he says. "I do not have the shoulders. Two hands would help."'],
   o:[ { t:'Help him change it (2 hours)', fx:{ hours:2, bp:'bullbar', scrap:'n_wendell' }, r:'It takes the two of you and a good jack. "Take this," he says, and gives you a drawing of the bar on the front of his truck. "Bolts on."' },
       { t:'Offer him a thermos of coffee', need:{ tag:'warm' }, fx:{ bp:'bullbar', spirit:1, scrap:'n_wendell' }, r:'He drinks it standing next to the truck, looks at the tire, and decides it can wait. He shows you the bull bar plans anyway.' } ] },
 // ----- Texas -----
 { id:'rosa', story:1, reg:2, node:0, who:'rosa', t:'Prairie Junction',
   p:['Rosa has a ranch outside town and a fence that keeps falling over in the same place. She is holding a post-hole digger when you arrive.',
      '"You look like you can hold a post," she says.'],
   o:[ { t:'Help her with the fence (1 hour)', fx:{ hours:1, tape:'wide', gift:'cheese', spirit:1, scrap:'n_rosa' }, r:'It takes an hour and a little arguing. She gives you a cassette called WIDE OPEN and a wheel of cheese for the road.' },
       { t:'Ask about the road ahead', fx:{ map:1, hint:1, scrap:'n_rosa' }, r:'"The wind is worst in the afternoon," she says. "Do your long drives in the morning. And if you pass the grain elevator, there is a gate with a star on it. Turn in." She marks both on your atlas.' } ] },
 { id:'wendell2', story:1, reg:2, node:2, who:'wendell', t:'Windmill Cafe',
   p:['Wendell is at the counter again, with a slice of pie the size of a hubcap. He nods at you as if he has been expecting you.',
      '"Got a winch in the cab I never use," he says. "It is yours if you will sit and hear about the truck for an hour."'],
   o:[ { t:'Listen for an hour', fx:{ hours:1, bp:'winch', spirit:1 }, r:'He talks about the truck. Then about the road. Then, a little, about his wife. By the end you have the plans for the winch and some of his pie.' },
       { t:'Pay for his pie', cost:{ batt:2 }, fx:{ bp:'winch', spirit:1 }, r:'"That is not necessary," he says, and finishes the pie. You leave with the winch plans.' } ] },
 { id:'armadillo', story:1, reg:2, node:3, who:null, img:['friends',2], t:'Tank Camp',
   p:['In the cold light before dawn, an armadillo is walking circles around your tires. It stops, looks at you, and keeps going.'],
   o:[ { t:'Share your breakfast', cost:{ food:1 }, fx:{ pass:'armadillo', spirit:1 }, r:'It eats most of a biscuit. It climbs onto the passenger seat and goes to sleep immediately.' },
       { t:'Watch it go', fx:{ spirit:1 }, r:'It trundles off into the grass. The morning is quiet.' } ] },
 { id:'barncat', story:1, reg:2, node:6, who:null, img:['friends',4], t:'Rosa\'s Barn Road',
   p:['A barn at the end of a long gravel drive. A grey cat is sitting on a hay bale, and watches you come up the drive.'],
   o:[ { t:'Leave a bowl of water and some food', cost:{ food:1 }, fx:{ pass:'cat', spirit:1 }, r:'The cat inspects the bowl and then the van. It chooses the passenger seat.' },
       { t:'Look around the barn', fx:{ gift:'*', spirit:0 }, r:'Hay, harness, a dented kettle. Nothing that is yours, but you find something someone wants you to have.' } ] },
 // ----- Mojave -----
 { id:'dee', story:1, reg:3, node:0, who:'dee', t:'Amboy Junction',
   p:['Dee paints signs for businesses that closed years ago. "Somebody has to," she says. She has a tall ladder and a very small brush.',
      '"I have never painted a van door," she says. "Is that something you would like?"'],
   o:[ { t:'Let her paint the door', fx:{ spirit:2, bp:'tank', gift:'flowers', scrap:'n_dee' }, r:'She paints the name of the van in careful cream letters. When she finishes, she wipes her hands and gives you a drawing of the big tank she has been meaning to build.' },
       { t:'Ask about the Sign Boneyard', fx:{ map:1, scrap:'n_dee' }, r:'"Walk through the old signs," she says. "Start with the boot. Everything else is lined up behind it."' } ] },
 { id:'crow', story:1, reg:3, node:2, who:null, img:['friends',3], t:'Starlight Motel',
   p:['The pool is dry and a crow is standing on the diving board. It has a bottle cap and looks like it wants to trade.'],
   o:[ { t:'Leave out some peanuts', cost:{ food:1 }, fx:{ pass:'crow', spirit:1 }, r:'It takes them, puts the bottle cap on your dash, and settles in the back window. Later it will show you where the roads go.' },
       { t:'Swim in the empty pool (1 hour)', fx:{ hours:1, spirit:2 }, r:'It is a dry and sunny pool. You lie on the bottom and look up. It is the quietest hour of the trip.' } ] },
 { id:'rabbit', story:1, reg:3, node:3, who:null, img:['friends',5], t:'Joshua Camp',
   p:['A jackrabbit is sitting twenty feet from the fire, absolutely still, ears up. It has decided you are safe enough to watch.'],
   o:[ { t:'Sit still and let it come closer (1 hour)', fx:{ hours:1, pass:'rabbit', spirit:1 }, r:'It takes a long time. When it finally hops over, it sits at your feet. In the morning it is in the back seat.' },
       { t:'Offer it lettuce', cost:{ food:1 }, fx:{ pass:'rabbit', spirit:1 }, r:'It eats, watches you a while longer, and climbs onto the dash.' } ] },
 { id:'adobe', story:1, reg:3, node:6, who:null, img:['uiicons',7], t:'Adobe House',
   p:['A small adobe house at the end of a track. A brass key is hanging on a nail by the door, next to a note that says "In case."'],
   o:[ { t:'Take the key', fx:{ souv:'key', spirit:1 }, r:'You do not know what it opens. It feels right to have it.' },
       { t:'Check the pantry', fx:{ food:3, batt:1 }, r:'Jars of beans, a bag of rice, a few batteries in a drawer.' } ] },
 // ----- fillers by place -----
 { id:'f_town1', reg:null, at:['town', 'trader'], who:null, img:['uiicons',10], t:'Notice Board',
   p:['A cork board by the door. Hand-lettered cards: a ride wanted, a ride offered, a lost cat who is probably fine, a barn dance that already happened.'],
   o:[ { t:'Answer a card for help (1 hour)', fx:{ hours:1, batt:1, gift:'*' }, r:'A woman three streets over needs a gate rehung. You hold it plumb while she works. She sends you off with something from her kitchen.' }, { t:'Read the notices', fx:{ spirit:1 }, r:'A card in small writing says "Thank you to whoever fixed the porch light." Nobody signed it.' } ] },
 { id:'f_stop1', reg:null, at:['stop'], who:null, img:['uiicons',4], t:'A Slow Hour',
   p:['No one is in a hurry. The radio is on low. The coffee is hot, and you have somewhere to be but not for a while yet.'],
   o:[ { t:'Sit a while (1 hour)', fx:{ hours:1, spirit:2 }, r:'You watch the road through the window. Biscuit sleeps under the table.' }, { t:'Buy a hot meal', cost:{ batt:1 }, fx:{ food:2, spirit:1 }, r:'Eggs, toast, potatoes. It tastes like a normal morning.' } ] },
 { id:'f_stop2', reg:null, at:['stop', 'gas'], who:null, img:['uiicons',9], t:'Left on the Counter',
   p:['There is a paper bag on the counter with your van\'s color written on it. Nobody is around. Inside: a sandwich, a battery, a note that says "For the next one through."'],
   o:[ { t:'Take it, and leave a note', fx:{ food:1, batt:1, spirit:1 }, r:'You write a note of your own and tuck it under the register.' } ] },
 { id:'f_camp1', reg:null, at:['camp'], who:null, img:['uiicons',1], t:'Quiet Fire',
   p:['A fire ring someone has kept in good order. A stack of dry wood under a tarp. A cookpot hanging from a tripod.'],
   o:[ { t:'Cook a proper dinner', cost:{ food:1 }, fx:{ spirit:2 }, r:'You cook it slowly. Biscuit gets the crust.' }, { t:'Stay quiet and look at the stars', fx:{ spirit:1, treats:1 }, r:'The sky is very large. Biscuit leans against your leg.' } ] },
 { id:'f_house1', reg:null, at:['house'], who:null, img:['uiicons',7], t:'Locked Garage',
   p:['The garage door has a padlock on it, an old one, rusted shut. There is a smell of oil and cold metal.'],
   o:[ { t:'Cut the padlock with the hatchet', need:{ gadget:'hatchet' }, fx:{ parts:3, fuel:2 }, r:'Inside: a workbench, a half-full jerry can, and a drawer of washers.' },
       { t:'Pry it with spare parts (2)', cost:{ parts:2 }, fx:{ parts:4, fuel:2 }, r:'It takes some effort. The shelves inside are mostly bare, but not entirely.' },
       { t:'Leave it', fx:{ spirit:0 }, r:'Not everything has to be opened.' } ] },
 { id:'f_house2', reg:null, at:['house'], who:null, img:['uiicons',4], t:'The Pantry',
   p:['The kitchen has been left in order. In the pantry: jars, tins, a bag of flour sealed in a coffee can. On the wall, a child\'s height chart goes up to about four feet.'],
   o:[ { t:'Take what you need', fx:{ food:2, gift:'*' }, r:'You leave a coin in the can on the way out.' } ] },
 { id:'f_gas1', reg:null, at:['gas'], who:null, img:['uiicons',3], t:'The Attendant',
   p:['An older man with a cap and a clipboard is writing numbers on the glass of the pump. He tells you which pump is the good one. He is correct.'],
   o:[ { t:'Ask him about the road', fx:{ map:1 }, r:'"Take the left at the church," he says, "and then it all sort of sorts itself out."' }, { t:'Nod and keep going', fx:{ spirit:0 }, r:'He tips his cap.' } ] },
];
L.EVENTS = E;
C.eventFor = (G, i) => {
  const n = G.nodes[i], t = C.nodeT(G, i).t, idn = C.ident(G, i);
  if (n.ev) return n.ev;
  let pool = E.filter(e => e.story && e.reg === G.reg && e.node === idn && !G.seenEv[e.id] && C.evReq(G, e));
  if (!pool.length && C.rnd(G) < .6) {
    pool = E.filter(e => !e.story && e.at.indexOf(t) >= 0 && (e.reg == null || e.reg === G.reg) && !G.seenEv[e.id]);
    if (pool.length) pool = [C.pick(G, pool)];
  }
  n.ev = pool.length ? pool[0].id : '';
  return n.ev;
};
// later trips open new stories: a beat can ask for a lit lamp, an earlier trip, a person met, or a keepsake page
C.evReq = (G, e) => { const q = e.req; if (!q) return true; const m = G.meta;
  if (q.trips && (m.trips || 0) + (m.arrived || 0) < q.trips) return false;
  if (q.lamps && C.lamps(m) < q.lamps) return false;
  if (q.lamp && !m.lamps[q.lamp]) return false;
  if (q.npc && !m.seenNpc[q.npc]) return false;
  if (q.scrap && !m.scrap[q.scrap]) return false;
  return true; };
C.evById = id => E.find(e => e.id === id);
C.evHas = (G, o) => { // can the player take this option? returns reason or null
  if (o.cost) for (const k in o.cost) if (G[k] < o.cost[k]) return 'Needs ' + o.cost[k] + ' ' + k;
  if (o.need) { if (o.need.gadget && !C.has2(G, o.need.gadget)) return 'Needs ' + L.GADGETS[o.need.gadget].n; if (o.need.tag && !G.gifts.some(g => L.GIFTS[g].tags.indexOf(o.need.tag) >= 0)) return 'Needs ' + L.TAGN[o.need.tag]; }
  return null;
};
C.evPick = (G, ev, oi) => { // run the chosen option; returns { fx:[...], r }
  const o = ev.o[oi]; G.seenEv[ev.id] = 1; G.nodes[G.node].evDone = true;
  if (o.haggle || o.shop) return { special:o.haggle ? 'haggle' : 'shop', who:o.haggle };
  if (o.cost) for (const k in o.cost) G[k] -= o.cost[k];
  if (o.need && o.need.tag) { const g = G.gifts.find(x => L.GIFTS[x].tags.indexOf(o.need.tag) >= 0); G.gifts.splice(G.gifts.indexOf(g), 1); }
  const fx = C.applyFx(G, o.fx); if (ev.who && !G.meta.seenNpc[ev.who]) { G.meta.seenNpc[ev.who] = 1; G.meta.scrap['n_' + ev.who] = G.meta.scrap['n_' + ev.who] || { r:G.reg, day:G.day }; }
  return { fx, r:o.r };
};
})(LRT);
