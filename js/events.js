(function(L){
var U=L.util;
function r(s){ return U.rng(s); }
function fightNext(foes, extra){ var o={fight:foes, reward:'crate'}; for (var k in extra) o[k]=extra[k]; return o; }
L.EVENTS = [
 { id:'house', at:['scavenge'], bg:function(s){ return s.region===0?'stop_house':'stop_cottage'; },
   text:function(s){ return s.region===0 ? U.pick(s,['A pastel beach house, door wide open. A wind chime plays to nobody.','A stilt house with a hammock still swinging. The fridge door is ajar.','A retirement condo. The welcome mat says something about grandkids.']) : U.pick(s,['A creole cottage with a porch swing and a very judgmental cat.','A fishing shack on stilts. Smells like adventure (and fish).','A tidy shotgun house. Someone left the radio playing static.']); },
   choices:function(s){ return [
     { t:'Search the place', go:function(s){ s.stop.searchable=true; return {text:'You step inside. Dusty, quiet, promising.', next:{loot:['crate']}}; } },
     { t:'Check the garage too (riskier, better)', go:function(s){ s.stop.searchable=true; if (r(s)<0.4) return {text:'The garage door rolls up and something rolls OUT.', next:fightNext([U.pick(s,['boar','snake','swarm'])],{reward:'lockbox'})}; return {text:'A locked toolbox in the garage! And a crate.', next:{loot:['crate','lockbox']}}; } },
   ]; } },
 { id:'gas', at:['gas'], bg:'stop_gas',
   text:function(s){ return U.pick(s,['An old filling station wrapped in bougainvillea. The pumps are dry but the underground tanks might not be.','A two-pump station with a vending machine that still hums. Spooky. Delicious.']); },
   choices:function(s){ return [
     { t:'Siphon the tanks (+fuel)', go:function(s){ var n=U.ri(s,2,4); L.give(s,'fuel',n); return {text:'Gurgle, gurgle. +'+n+' fuel. Marigold purrs.'}; } },
     { t:'Raid the snack shop', go:function(s){ return {text:'Chips, jerky, a cooler that has seen things.', next:{loot:['cooler']}}; } },
     { t:'Do both (takes longer, Heat +0.4)', go:function(s){ var n=U.ri(s,2,3); L.give(s,'fuel',n); s.heat+=0.4; if (r(s)<0.32) return {text:'+'+n+' fuel... and then company shows up.', next:fightNext([U.pick(s, s.region===0?['conman','snake']:['krewe','conman'])],{reward:'cooler'})}; return {text:'+'+n+' fuel and a cooler. Efficient!', next:{loot:['cooler']}}; } },
   ]; } },
 { id:'diner', at:['diner'], bg:'stop_diner',
   text:'A chrome diner with every booth empty. The coffee machine somehow still works. The pie case is... let\'s not.',
   choices:function(s){ return [
     { t:'Bottomless coffee (+5 HP)', go:function(s){ L.heal(s,5); return {text:'You sit in a booth and drink three cups. Biscuit naps on the seat across. Bliss.'}; } },
     { t:'Raid the kitchen', go:function(s){ L.give(s,'food',1); return {text:'+1 food from the pantry, and a walk-in cooler!', next:{loot:['cooler']}}; } },
     { t:'Play the jukebox and dance with Biscuit', go:function(s){ var g=L.bond(s,1); L.heal(s,2); return {text:'Biscuit does a little spin. You do a bigger one. +bond, +2 HP.'}; } },
   ]; } },
 { id:'camp', at:['camp'], bg:'stop_camp',
   text:function(s){ return 'A perfect spot to camp. The fire crackles. Biscuit curls up by your boots.'+(s.hiker?' '+s.hiker.n+' tunes the guitar.':''); },
   choices:function(s){ var k=s.van.mods.kitchen; var h=[4,7,10,13][k]; return [
     { t:'Make camp (+'+h+' HP, Biscuit heals, -1 food, Heat +0.6)', go:function(s){ var full = L.hasCombo(s,'beachbum'); L.heal(s, full?99:h + (s.hiker?3:0)); s.dog.hp=L.dogMax(s); if (s.dog.hurt>0) s.dog.hurt=Math.max(0,s.dog.hurt-1); if (s.dog.hurt===0 && s.dog.hp<=0) s.dog.hp=L.dogMax(s); s.res.food=Math.max(0,s.res.food-1); s.heat+=0.6; L.bond(s,1); if (k>=3) L.heal(s,2); return {text:'You sleep under a sky full of stars. No alarm clock. No commute. Just crickets.'+(full?' (Beach Bum: fully healed!)':'')}; } },
     { t:'Pet Biscuit, fix Marigold a bit, push on', go:function(s){ L.bond(s,1); s.van.hp=Math.min(L.vanMax(s),s.van.hp+2); return {text:'A quick belly rub and a tightened bolt. +bond, +2 Marigold.'}; } },
   ]; } },
 { id:'mail', at:['mail'], bg:'stop_camp', who:'npc_mailman',
   text:function(s){ return '"Neither heat nor gators nor the end of the world," says the Mailman, tipping his cap. "Got something for you, actually."' + (s.flags.gift?'':' He hands you a postcard with a palm tree on it.'); },
   choices:function(s){ var best = s.pack.filter(function(it){ return L.SLOTS.indexOf(L.ITEMS[it.k].slot)>=0; }).sort(function(a,b){ return L.gearScore(b)-L.gearScore(a); })[0];
     return [
     { t:'Take the care package (+2 treats, +2 food)', go:function(s){ L.give(s,'treats',2); L.give(s,'food',2); return {text:'"From a friend down the road." It smells like peanut butter. Biscuit approves.'}; } },
     { t: best ? 'Mail your '+L.iname(best)+' to your next trip' : 'Mail something to your next trip (pack has no gear)', req:function(s){ return !!best; }, go:function(s){ var i=s.pack.indexOf(best); s.pack.splice(i,1); s.mailed=best; L.give(s,'treats',1); return {text:'"Your future self says thanks." He licks a stamp with great ceremony. (+1 treat)'}; } },
   ]; } },
 { id:'juicy', at:['attraction'], region:[0], bg:'stop_attraction', once:1,
   text:'BIG JUICY, the World\'s Happiest Juice Can, grins at the highway. Flamingo lawn ornaments stand guard. The gift shop is open. There is no one in the gift shop.',
   choices:function(s){ return [
     { t:'Browse the gift shop (4 batteries)', req:function(s){ return s.res.batteries>=4; }, go:function(s){ s.res.batteries-=4; L.offerSouvenir(s, L.dash.random(s,3), 'Big Juicy Gift Shop'); return {text:'You leave 4 batteries on the counter, because you are a good person.'}; } },
     { t:'Climb Big Juicy for the view', go:function(s){ s.map.nodes.forEach(function(n){ n.seen=true; }); s.heat+=0.3; return {text:'From the top you can see for miles. Every mystery stop is revealed.'}; } },
     { t:'Lick Big Juicy', go:function(s){ if (r(s)<0.5){ L.heal(s,4); return {text:'It tastes like orange creamsicle. How?? +4 HP.'}; } s.hp-=2; return {text:'It tastes like fiberglass. Of course it does. -2 HP. Biscuit is embarrassed for you.'}; } },
   ]; } },
 { id:'golf', at:['attraction','event'], region:[0], bg:'stop_attraction', once:1,
   text:'Gator Golf! A mini-golf course with a fiberglass gator on hole 9. One of the "statues" just blinked.',
   choices:function(s){ return [
     { t:'Play hole 9 anyway', go:function(s){ if (r(s)<0.5){ L.offerSouvenir(s,L.dash.random(s,2),'Hole in one! Prize counter'); return {text:'HOLE IN ONE. The prize counter is unguarded.'}; } return {text:'Your ball rolls into its mouth. It is not a statue.', next:fightNext(['gator'],{reward:'lockbox'})}; } },
     { t:'Raid the clubhouse', go:function(s){ return {text:'Free visors, sunscreen, and a crate.', next:{loot:['crate']}}; } },
   ]; } },
 { id:'casino', at:['attraction','event'], region:[1], bg:'stop_town', once:1,
   text:'The Lucky Lady riverboat casino is still docked. The slot machines are dark, but a dealer bot made of a mannequin and a car battery still deals blackjack.',
   choices:function(s){ var p = 0.45 + (L.has(s,'dice')?0.15:0); return [
     { t:'Bet 3 batteries ('+Math.round(p*100)+'% to win 8)', req:function(s){ return s.res.batteries>=3; }, go:function(s){ s.res.batteries-=3; if (r(s)<p){ s.res.batteries+=8; return {text:'BLACKJACK! The mannequin\'s face does not change. +8 batteries.'}; } return {text:'Bust. The mannequin seems smug somehow.'}; } },
     { t:'Crack the casino vault', go:function(s){ return {text:'The vault guards were "on break" since the apocalypse. Mostly.', next:fightNext(['krewe','conman'],{reward:'safe'})}; } },
     { t:'Leave while you\'re ahead', go:function(s){ return {text:'Smart. Biscuit nods.'}; } },
   ]; } },
 { id:'moth', at:['attraction','event'], region:[1], bg:'stop_town', once:1,
   text:'MADAME MOTH, PSYCHIC, reads your palm before you even sit down. "You travel west. With a dog. In a green van." She is very good.',
   choices:function(s){ return [
     { t:'Pay 2 batteries for a reading', req:function(s){ return s.res.batteries>=2; }, go:function(s){ s.res.batteries-=2; s.map.nodes.forEach(function(n){ n.seen=true; }); L.bond(s,1); return {text:'"I see... a bridge. Beads. A tuba." She also reveals every mystery on your map and tells Biscuit he\'s a good boy.'}; } },
     { t:'Ask about Sunspire', go:function(s){ L.heal(s,2); return {text:'"The lights are real, child. Someone is waiting. Bring snacks." (+2 HP, from hope)'}; } },
   ]; } },
 { id:'velvet', at:['event','attraction'], once:1, who:'npc_velvet',
   text:function(s){ return '"OMG, a DOG? Hi besties, it\'s Chez Velvet, live from the end of the world!" A gold limo idles behind her. She\'s also racing to Sunspire. Of course she is.'; },
   choices:function(s){ return [
     { t:'Do a collab with her', go:function(s){ var it=L.mkItem(s, U.pick(s,['leather','helmet','boots','crossbow']), 2, -1); if (s.pack.length<L.packCap(s)) s.pack.push(it); s.flags.velvet='collab'; return {text:'You film a "day in my life." Biscuit gets 0 views because there is no internet. She tips you a '+L.iname(it)+'.'}; } },
     { t:'Steal parts off her limo', go:function(s){ L.give(s,'parts',4); s.flags.velvet='rival'; return {text:'+4 parts. She\'ll notice. She\'ll post about it. To nobody.'}; } },
     { t:'Wave and drive on', go:function(s){ return {text:'"Like and subscribe!" she yells after you.'}; } },
   ]; } },
 { id:'juniper', at:['event','diner','gas'], once:1, cond:function(s){ return !s.hiker; }, who:'npc_hiker',
   text:'A kid with a guitar sticks out a thumb. "I\'m Juniper. Going west? I play a mean song and eat only a little."',
   choices:function(s){ return [
     { t:'Give Juniper a ride (+1 dmg, camps heal more, eats 1 more food)', go:function(s){ s.hiker={k:'juniper',n:'Juniper',gift:'a rare piece of gear',giftK:U.pick(s,['boots','leather','gloves','bat'])}; return {text:'Juniper climbs in and immediately plays a song about Biscuit. It slaps.'}; } },
     { t:'Share a snack and wish them luck', go:function(s){ s.res.food=Math.max(0,s.res.food-1); L.bond(s,1); return {text:'"You\'re good people." Biscuit gets an ear scratch. +bond'}; } },
   ]; } },
 { id:'lostdog', at:['event','scavenge'], once:1, bg:function(s){ return s.region===0?'stop_house':'stop_cottage'; },
   text:'A faded poster: LOST - PANCAKE - FLUFFY - ANSWERS TO "PANCAKE." Biscuit is sniffing the ground very seriously.',
   choices:function(s){ return [
     { t:'Let Biscuit follow the scent', req:function(s){ return s.dog.hurt===0; }, go:function(s){ L.give(s,'treats',3); L.bond(s,2); return {text:'Ten minutes later: a fluffy poodle and an old man on a porch, crying happy tears. He gives you 3 treats. Biscuit is a hero.'}; } },
     { t:'Search the house the poster is on', go:function(s){ return {text:'No Pancake, but there\'s a crate.', next:{loot:['crate']}}; } },
   ]; } },
 { id:'shuffle', at:['event','camp'], region:[0], once:1,
   text:'The Sunset Palms Shuffleboard Club is still in session. The retirees are tan, armed with cue sticks, and VERY competitive.',
   choices:function(s){ return [
     { t:'Challenge them (2 batteries stake)', req:function(s){ return s.res.batteries>=2; }, go:function(s){ if (r(s)<0.5){ s.res.batteries+=5; return {text:'You win! Gladys pays up, grumbling. +5 batteries.'}; } s.res.batteries-=2; return {text:'Destroyed by an 84-year-old named Gladys. -2 batteries.'}; } },
     { t:'Trade with them', go:function(s){ return {text:'"Let\'s see what you\'ve got, sweetie."', next:{trader:'club'}}; } },
   ]; } },
 { id:'flamingos', at:['event'], region:[0],
   text:'Flamingo traffic jam. Two hundred pink birds are standing on the highway, being fabulous.',
   choices:function(s){ return [
     { t:'Wait it out (Heat +0.4, +2 HP)', go:function(s){ s.heat+=0.4; L.heal(s,2); return {text:'You put your feet on the dash and enjoy the show.'}; } },
     { t:'Let Biscuit herd them', go:function(s){ if (s.dog.bond>=3){ L.bond(s,1); return {text:'Biscuit gently moves them aside like a pink-feathered professional. +bond'}; } s.res.food=Math.max(0,s.res.food-1); return {text:'Biscuit gets chased by the flamingos. They also eat your sandwich. -1 food.'}; } },
     { t:'Honk', go:function(s){ if (r(s)<0.4) return {text:'They scatter... revealing a very annoyed gator.', next:fightNext(['gator'],{})}; return {text:'They scatter in a pink explosion. Gorgeous.'}; } },
   ]; } },
 { id:'marsh', at:['event'],
   text:'The road dips through a marsh. You hear it before you see it: a buzzing cloud the size of a house.',
   choices:function(s){ return [
     { t:'Floor it through (-2 Marigold)', go:function(s){ s.van.hp-=2; if (s.van.hp<1) s.van.hp=1; return {text:'Windows up! SPLAT SPLAT SPLAT. Gross but effective.'}; } },
     { t:'Use bug spray', req:function(s){ return L.countUse(s,'bugspray')>0; }, go:function(s){ var i=s.pack.findIndex(function(it){return it.k==='bugspray';}); s.pack.splice(i,1); return {text:'PSSSHHT. The swarm drops like a bad habit. Behind it: a crate on a dock!', next:{loot:['crate']}}; } },
     { t:'Fight it for the dock crates', go:function(s){ return {text:'Swatting time.', next:fightNext(['swarm','swarm'],{reward:'crate'})}; } },
   ]; } },
 { id:'crawfish', at:['event','camp'], region:[1], once:1,
   text:'A big man in rubber boots is stirring a giant pot of crawfish. "Y\'all hungry? Bring something to the pot, cher."',
   choices:function(s){ return [
     { t:'Share 2 food with him', req:function(s){ return s.res.food>=2; }, go:function(s){ s.res.food-=2; L.heal(s,6); var it=L.rollItem(s,1,1,'gear'); if (s.pack.length<L.packCap(s)) s.pack.push(it); return {text:'Best meal since the end of the world. +6 HP. He insists you take his old '+L.iname(it)+'.'}; } },
     { t:'Just eat and run (+3 HP)', go:function(s){ L.heal(s,3); L.give(s,'food',1); return {text:'Spicy. Delicious. +1 food for the road.'}; } },
   ]; } },
 { id:'shellgame', at:['event'], who:'en_conman',
   text:'"Step right up!" A man in a purple suit shuffles three bottle... no, three hubcaps. "Find the battery, win the pot!"',
   choices:function(s){ return [
     { t:'Play (3 batteries)', req:function(s){ return s.res.batteries>=3; }, go:function(s){ s.res.batteries-=3; if (r(s)<0.4 + (s.dog.hurt===0?0.15:0)){ s.res.batteries+=8; return {text:'Biscuit sniffs the right one. +8 batteries. Slick Rick looks betrayed.'}; } return {text:'Empty. All three were empty. Of course they were.'}; } },
     { t:'Call his bluff', go:function(s){ return {text:'"Rude!" He pulls out a cane sword. Seriously?', next:fightNext(['conman'],{reward:'lockbox'})}; } },
     { t:'Keep walking', go:function(s){ return {text:'"Your loss!" It is not.'}; } },
   ]; } },
 { id:'bus', at:['event','scavenge'],
   text:'A tour bus on its side, covered in ivy. "SUNSPIRE OR BUST" is painted on the windows. Someone else had the same idea.',
   choices:function(s){ return [
     { t:'Search the luggage', go:function(s){ if (r(s)<0.25) return {text:'Something buzzes in the luggage hold...', next:fightNext(['swarm'],{reward:'crate'})}; return {text:'Suitcases, coolers, souvenirs!', next:{loot:['crate','cooler']}}; } },
     { t:'Leave a note on the windshield', go:function(s){ L.heal(s,1); return {text:'"Made it this far. You can too." You feel lighter. +1 HP'}; } },
   ]; } },
 { id:'roadgator', at:['event'], region:[0],
   text:'A gator is sunbathing across BOTH lanes. It is not in a hurry. It has never been in a hurry.',
   choices:function(s){ return [
     { t:'Wait (Heat +0.5)', go:function(s){ s.heat+=0.5; return {text:'Forty minutes later, it waddles off. You learned patience.'}; } },
     { t:'Biscuit, bark!', req:function(s){ return s.dog.hurt===0; }, go:function(s){ if (s.dog.bond>=2 || r(s)<0.5){ L.bond(s,1); return {text:'WOOF. The gator sighs and slides into the canal. Good boy!'}; } return {text:'The gator does not respect Biscuit. It charges!', next:fightNext(['gator'],{})}; } },
     { t:'Honk aggressively', go:function(s){ return {text:'It wakes up angry.', next:fightNext(['gator'],{reward:'crate'})}; } },
   ]; } },
 { id:'shelter', at:['event','scavenge'],
   text:'A hurricane shelter, door bolted from outside. Spray-painted: "STASH. TAKE WHAT U NEED. LEAVE SOME FOR THE NEXT ONE."',
   choices:function(s){ return [
     { t:'Open it up', go:function(s){ return {text:'Inside: a lockbox and a stack of comic books.', next:{loot:['lockbox']}}; } },
     { t:'Leave supplies for the next one (-1 food, +2 HP)', req:function(s){ return s.res.food>=1; }, go:function(s){ s.res.food--; L.heal(s,2); L.bond(s,1); return {text:'You leave a can of beans and a drawing of Biscuit. Good karma +1.'}; } },
   ]; } },
];
})(typeof LRT!=='undefined'?LRT:require('./data.js'));
