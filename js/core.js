// The Last Road Trip v2 — rules. No DOM in here: runs in the browser and in Node (balance bot).
var LRT = (typeof LRT !== 'undefined') ? LRT : (typeof require !== 'undefined' ? require('./data.js') : {});
(function(L){
const C = {};
L.core = C;
// ---------- rng ----------
C.rnd = G => { let t = (G.rs = (G.rs + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
C.ri = (G, a, b) => a + Math.floor(C.rnd(G) * (b - a + 1));
C.pick = (G, arr) => arr[Math.floor(C.rnd(G) * arr.length)];
C.wpick = (G, table) => { let tot = 0; for (const k in table) tot += table[k]; let r = C.rnd(G) * tot; for (const k in table) { r -= table[k]; if (r <= 0) return k; } return Object.keys(table)[0]; };
C.shuffle = (G, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(C.rnd(G) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- meta (survives across trips) ----------
C.freshMeta = () => ({ v:2, lamps:{}, bp:{ rack:1, spare:1, lantern:1 }, scrap:{}, tapes:{ blue:1 }, trips:0, arrived:0, best:0, gentle:false, tut:0, tape:'blue', seenNpc:{}, stars:0 });

// ---------- new trip ----------
C.newGame = (meta, opts) => {
  opts = opts || {};
  const G = { v:2, rs:(opts.seed || Date.now()) >>> 0, meta, gentle:!!meta.gentle, reg:0, node:0, day:1, hour:0,
    fuel:8, food:5, batt:5, parts:0, treats:2, spirit:6, wear:1, gadgets:[], gifts:['honey'], souvs:[], pass:[], tape:meta.tape || 'blue',
    van:{ roof:null, front:null, wheels:null, rear:null, side:null, cab:null }, spareUsed:false, towFree:false,
    tows:0, lastLit:0, driveN:0, nodes:null, hid:{}, wx:'sun', fc:[], log:[], seenEv:{}, enc:null, ended:null, won:false,
    wondersThisTrip:0, hits:0, sightings:0, gbag:null, sbag:null, camps:0, mapSeen:{}, stats:{ drives:0, enc:0, ccHits:0, sfWins:0, hgWins:0, rbDone:0 } };
  G.gbag = C.shuffle(G, Object.keys(L.GADGETS));
  G.sbag = C.shuffle(G, Object.keys(L.SOUV));
  C.enterRegion(G, 0);
  G.wx = 'sun'; G.fc = [C.rollWx(G), C.rollWx(G), C.rollWx(G)];
  return G;
};
C.enterRegion = (G, r) => {
  G.reg = r; G.node = 0; G.hour = 0;
  G.nodes = L.NODE_T.map((t, i) => ({ seen:i === 0 ? 2 : 0, spots:null, ev:null, evDone:false, sniffed:false, looks:0, restored:false, shop:null, talked:false }));
  G.nodes[0].seen = 2;
  G.lastLit = 0;
  C.markSeen(G);
};
C.R = G => L.REGIONS[G.reg];
C.pos = (G, i, r) => { r = (r == null ? G.reg : r); const fn = L.POS_FN[L.REGIONS[r].id]; const p = L.GEN_POS[i]; return fn ? fn(p) : p; };

// ---------- weather & time ----------
C.rollWx = G => C.wpick(G, C.R(G).weather);
C.dayLen = G => L.HOURS + (C.has(G, 'lantern') ? 2 : 0);
C.hoursLeft = G => Math.max(0, C.dayLen(G) - G.hour);
C.forecastDays = G => C.has(G, 'cb') ? 3 : 1;

// ---------- the van ----------
C.has = (G, part) => { for (const k in G.van) if (G.van[k] === part) return true; return false; };
C.weight = G => { let w = 0; for (const k in G.van) if (G.van[k]) w += L.VPARTS[G.van[k]].w; return w; };
C.wclass = G => { const w = C.weight(G); return w <= L.WEIGHT_LIGHT ? 'light' : w >= L.WEIGHT_HEAVY ? 'heavy' : 'normal'; };
C.fuelCap = G => C.has(G, 'tank') ? 15 : L.FUEL_CAP;
C.packCap = G => L.PACK + (C.has(G, 'rack') ? 4 : 0);
C.packUsed = G => G.gadgets.length + G.gifts.length;
C.dashCap = 4;
C.tapeObj = G => (G.meta.tapes[G.tape] && (C.has2(G, 'radio') || G.tape === 'blue')) ? L.TAPE_BY_ID[G.tape] : null;
C.has2 = (G, g) => G.gadgets.indexOf(g) >= 0;
// sum of a passive effect from souvenirs, passengers, tape
C.fx = (G, key) => { let s = 0; G.souvs.forEach(id => { s += (L.SOUV[id].fx[key] || 0); }); G.pass.forEach(id => { s += (L.PASS[id].fx[key] || 0); }); const t = C.tapeObj(G); if (t) s += (t.fx[key] || 0); return s; };
C.quirks = G => { const q = []; if (G.wear >= 4) q.push({ n:'Pulls to the left', d:'Close Calls have one more obstacle.' }); if (G.wear >= 7) q.push({ n:'Runs rough', d:G.gentle ? 'Nothing to worry about in Gentle Mode.' : '+1 fuel on every drive.' }); if (G.wear >= 9) q.push({ n:'Smoke from the hood', d:'One more bump and it stops.' }); return q; };
C.install = (G, slot, part) => { // returns error string or null
  const h = L.HARD.find(x => x.id === slot); if (!h || (h.a !== part && h.b !== part)) return 'That does not fit there.';
  if (!G.meta.bp[part]) return 'You do not have the blueprint yet.';
  if (G.van[slot] === part) return 'Already installed.';
  const cost = L.VPARTS[part].cost - (C.fx(G, 'fix') ? 1 : 0); const c = Math.max(1, cost);
  if (G.parts < c) return 'Needs ' + c + ' parts.';
  G.parts -= c; G.van[slot] = part; if (G.wear > 0) G.wear = Math.max(0, G.wear - 0); return null;
};
C.installCost = (G, part) => Math.max(1, L.VPARTS[part].cost - (C.fx(G, 'fix') ? 1 : 0));
C.removePart = (G, slot) => { G.van[slot] = null; };
C.repairPerPart = G => 2 + (C.has(G, 'toolbox') ? 1 : 0);
C.repair = (G, parts) => { const n = Math.min(parts, G.parts); if (n <= 0 || G.wear <= 0) return 0; const use = Math.min(n, Math.ceil(G.wear / C.repairPerPart(G))); G.parts -= use; const w = Math.min(G.wear, use * C.repairPerPart(G)); G.wear -= w; return w; };

// ---------- map ----------
C.nbrs = (G, i) => { const out = []; L.EDGES.forEach(e => { let o = -1; if (e[0] === i) o = e[1]; else if (e[1] === i) o = e[0]; if (o < 0) return; if (L.NODE_T[o].hidden && !G.hid[G.reg]) return; if (L.NODE_T[i].hidden && !G.hid[G.reg]) return; out.push(o); }); return out; };
C.markSeen = G => { C.nbrs(G, G.node).forEach(o => { if (G.nodes[o].seen < 1) G.nodes[o].seen = 1; }); };
C.typeKnown = (G, i) => { const n = G.nodes[i]; return n.seen >= 2 || n.typeKnown || (C.has2(G, 'binoc') || C.has(G, 'cb')) && C.nbrs(G, G.node).indexOf(i) >= 0; };
C.revealTypes = G => { G.nodes.forEach(n => { if (n.seen >= 1) n.typeKnown = true; }); G.mapSeen[G.reg] = 1; };
C.edgeCost = (G, a, b) => {
  const p = C.pos(G, a), q = C.pos(G, b); const d = Math.hypot((q[0] - p[0]) * .75, q[1] - p[1]);
  let hours = 1 + Math.round(d * 8), fuel = 1 + Math.round(d * 4);
  const wx = G.wx; if (wx === 'rain' && !C.has(G, 'tires')) hours += 1;
  if (!G.gentle) { if (wx === 'wind') fuel += 1; if (C.wclass(G) === 'heavy') fuel += 1; if (G.wear >= 7) fuel += 1; }
  else fuel = Math.max(1, Math.ceil(fuel * .5));
  return { hours:hours, fuel:Math.min(4, fuel), dist:d };
};
C.canGo = (G, b) => { const c = C.edgeCost(G, G.node, b); const out = { cost:c, ok:true, fuelShort:Math.max(0, c.fuel - G.fuel), dusk:c.hours >= C.hoursLeft(G) }; return out; };

// ---------- applying effects ----------
C.msg = (G, t) => { G.log.push(t); if (G.log.length > 40) G.log.shift(); };
C.addFuel = (G, n) => { const cap = C.fuelCap(G); const a = Math.max(0, Math.min(n, cap - G.fuel)); G.fuel += a; return a; };
C.addSpirit = (G, n) => { const b = G.spirit; G.spirit = Math.max(0, Math.min(10, G.spirit + n)); return G.spirit - b; };
C.addWear = (G, n) => { G.wear = Math.max(0, Math.min(10, G.wear + n)); };
C.addGadget = G => { // returns id or null
  const left = G.gbag.filter(id => G.gadgets.indexOf(id) < 0); const id = left.length ? left[0] : null; return id; };
C.giveItem = (G, kind, id) => { // false when the pack is full
  if (kind === 'gadget') { if (G.gadgets.indexOf(id) >= 0) return true; if (C.packUsed(G) >= C.packCap(G)) return false; G.gadgets.push(id); G.gbag = G.gbag.filter(x => x !== id); return true; }
  if (kind === 'gift') { if (C.packUsed(G) >= C.packCap(G)) return false; G.gifts.push(id); return true; }
  if (kind === 'souv') { if (G.souvs.length >= C.dashCap) return false; if (G.souvs.indexOf(id) < 0) G.souvs.push(id); G.sbag = G.sbag.filter(x => x !== id); return true; }
  return false;
};
// fx: { fuel, food, batt, parts, treats, spirit, wear, hours, gift:id|'*', gadget:id|'*', souv:id|'*', tape:id, pass:id, bp:id, map:1, hint:1, scrap:[id,text], film }
C.applyFx = (G, fx) => {
  const out = []; if (!fx) return out;
  const add = (k, n, label) => { if (!n) return; if (k === 'fuel') { const a = C.addFuel(G, n); out.push({ k, n: n > 0 ? a : n, label }); if (n > 0 && a < n) out.push({ k:'note', t:'Tank is full.' }); } else { G[k] = Math.max(0, G[k] + n); out.push({ k, n }); } };
  ['fuel', 'food', 'batt', 'parts', 'treats'].forEach(k => add(k, fx[k]));
  if (fx.film) { G.film = (G.film || 0) + fx.film; }
  if (fx.spirit) { const d = C.addSpirit(G, fx.spirit); if (d) out.push({ k:'spirit', n:d }); }
  if (fx.wear) { C.addWear(G, fx.wear); out.push({ k:'wear', n:fx.wear }); }
  if (fx.hours) { C.spendHours(G, fx.hours); out.push({ k:'hours', n:fx.hours }); }
  if (fx.gift) { const id = fx.gift === '*' ? C.pick(G, Object.keys(L.GIFTS)) : fx.gift; if (C.giveItem(G, 'gift', id)) out.push({ k:'gift', id }); else out.push({ k:'full', kind:'gift', id }); }
  if (fx.gadget) { let id = fx.gadget === '*' ? C.addGadget(G) : fx.gadget; if (id === 'compass' && !G.hid[G.reg]) { G.hid[G.reg] = 1; C.markSeen(G); out.push({ k:'note', t:'The needle swings toward a side road. It is on the atlas now.' }); } if (id) { if (C.giveItem(G, 'gadget', id)) out.push({ k:'gadget', id }); else out.push({ k:'full', kind:'gadget', id }); } else add('batt', 3); }
  if (fx.souv) { let id = fx.souv === '*' ? (G.sbag.filter(x => G.souvs.indexOf(x) < 0)[0] || G.sbag[0]) : fx.souv; if (id) { if (C.giveItem(G, 'souv', id)) out.push({ k:'souv', id }); else out.push({ k:'full', kind:'souv', id }); } }
  if (fx.tape) { if (!G.meta.tapes[fx.tape]) { G.meta.tapes[fx.tape] = 1; out.push({ k:'tape', id:fx.tape }); } }
  if (fx.pass) { if (G.pass.indexOf(fx.pass) < 0) { G.pass.push(fx.pass); G.meta.scrap['p_' + fx.pass] = G.meta.scrap['p_' + fx.pass] || { r:G.reg }; out.push({ k:'pass', id:fx.pass }); } }
  if (fx.bp) { if (!G.meta.bp[fx.bp]) { G.meta.bp[fx.bp] = 1; out.push({ k:'bp', id:fx.bp }); } else { G.parts += 2; out.push({ k:'parts', n:2 }); } }
  if (fx.map) { C.revealTypes(G); out.push({ k:'note', t:'The atlas fills in: you can see what is at each stop.' }); }
  if (fx.hint) { if (!G.hid[G.reg]) { G.hid[G.reg] = 1; C.markSeen(G); out.push({ k:'note', t:'A side road appears on the atlas.' }); } }
  if (fx.scrap) { const id = fx.scrap; if (!G.meta.scrap[id]) { G.meta.scrap[id] = { r:G.reg, day:G.day }; out.push({ k:'scrap', id }); } }
  if (fx.hours === undefined) {}
  return out;
};
C.spendHours = (G, h) => { G.hour += h; if (G.hour > C.dayLen(G)) G.hour = C.dayLen(G); };

// ---------- places ----------
C.nodeT = (G, i) => L.NODE_T[i == null ? G.node : i];
C.nodeName = (G, i) => L.REGIONS[G.reg].names[i == null ? G.node : i];
C.sceneKey = (G, i) => { const t = L.NODE_T[i]; return { src:'assets/scene/' + C.R(G).pre + '_' + t.s + '.webp', flip:!!t.flip }; };
C.pinIdx = (G, i) => { const t = L.NODE_T[i].t; if (t === 'stop') return (G.reg === 3 || i === 12) ? 4 : 1; return { town:5, trader:5, gas:0, camp:2, vista:6, wonder:7, house:3, cross:9 }[t]; };
C.lampWonder = (G, i) => { const t = L.NODE_T[i]; return t.w ? C.R(G).wonders[t.w] : null; };
C.wonderCost = (G, i) => Math.max(1, C.lampWonder(G, i).cost - (C.fx(G, 'wonder') ? 1 : 0));

// hidden finds at a stop. Created on arrival.
const SPOTN = { town:4, gas:4, stop:4, camp:4, vista:3, wonder:3, house:5, trader:3, cross:0 };
C.makeSpots = (G, i) => {
  const t = L.NODE_T[i].t, n = SPOTN[t], spots = [], rm = L.REGIONS[G.reg].price;
  for (let k = 0; k < n; k++) {
    let x, y, tries = 0; do { x = .12 + C.rnd(G) * .76; y = .5 + C.rnd(G) * .3; tries++; } while (tries < 300 && spots.some(s => Math.hypot(s.x - x, (s.y - y) * 1.1) < .2));
    const box = (t === 'house' ? C.rnd(G) < .55 : t === 'gas' || t === 'stop' ? C.rnd(G) < .35 : t === 'camp' ? C.rnd(G) < .3 : C.rnd(G) < .22);
    const s = { x, y, got:false, open:false };
    if (box) { const kinds = G.reg < 1 ? { crate:5, cooler:4, lockbox:2, mailbox:2, safe:0 } : { crate:4, cooler:3, lockbox:3, mailbox:2, safe:2 }; s.box = C.wpick(G, kinds); }
    s.fx = C.lootFor(G, s.box);
    spots.push(s);
  }
  return spots;
};
C.lootFor = (G, box) => {
  const m = G.reg >= 2 ? 1.3 : 1; const amt = (a, b) => Math.max(1, Math.round(C.ri(G, a, b) * m));
  if (!box) { const k = C.wpick(G, { fuel:24, food:9, batt:13, parts:15, treats:5, gift:8, nothing:26 }); if (k === 'fuel') return { fuel:amt(1, 2) }; if (k === 'food') return { food:1 }; if (k === 'batt') return { batt:amt(1, 2) }; if (k === 'parts') return { parts:amt(1, 2) }; if (k === 'treats') return { treats:1 }; if (k === 'gift') return { gift:'*' }; return { spirit:0, junk:1 }; }
  if (box === 'crate') return C.rnd(G) < .5 ? { parts:amt(1, 3) } : { fuel:amt(1, 3), batt:1 };
  if (box === 'cooler') return { food:amt(1, 2), gift:'*' };
  if (box === 'mailbox') return { batt:amt(1, 2), gift:'*', spirit:1 };
  if (box === 'lockbox') { const r = C.rnd(G); return r < .35 ? { gadget:'*', parts:1 } : r < .6 ? { souv:'*', batt:1 } : { parts:amt(3, 4), batt:1 }; }
  return C.rnd(G) < .4 ? { souv:'*', batt:3 } : C.rnd(G) < .5 ? { gadget:'*', batt:3 } : { parts:4, batt:4 }; // safe
};
C.looksAllowed = G => 3 + 0 + (C.fx(G, 'look')) + (C.has2(G, 'torch') ? 1 : 0);
C.arrive = G => {
  const n = G.nodes[G.node], t = L.NODE_T[G.node];
  n.seen = 2; n.typeKnown = true;
  if (!n.spots) { n.spots = C.makeSpots(G, G.node); n.looksLeft = n.spots.length + 1 + C.fx(G, 'look') + (C.has2(G, 'torch') ? 1 : 0); }
  if (['town', 'gas', 'stop', 'camp', 'trader'].indexOf(t.t) >= 0) G.lastLit = G.node;
  C.markSeen(G);
  if (t.t === 'vista' && !n.vistaDone) { n.vistaDone = true; C.revealTypes(G); const d = 1 + C.fx(G, 'vista'); C.addSpirit(G, d); G.meta.scrap['v_' + C.R(G).id] = G.meta.scrap['v_' + C.R(G).id] || { r:G.reg, day:G.day }; n.vistaGain = d; }
  if (C.has(G, 'cb') && G.reg >= 0) {}
  if ((C.fx(G, 'hint') || C.has2(G, 'compass')) && !G.hid[G.reg]) { G.hid[G.reg] = 1; C.markSeen(G); }
};
// a tap on the picture. returns { hit:spot|null, fx, left }
C.look = (G, nx, ny) => {
  const n = G.nodes[G.node]; if (!n.spots || n.looksLeft <= 0) return { hit:null, none:true };
  let best = null, bd = 9; n.spots.forEach(s => { if (s.got) return; const d = Math.hypot(s.x - nx, (s.y - ny) * 1.1); if (d < bd) { bd = d; best = s; } });
  n.looksLeft--;
  if (best && bd < .15) { best.got = true; n.looksLeft = Math.min(n.looksLeft + 1, 9); /* a find gives the look back */ if (!best.box) { return { hit:best, left:n.looksLeft, fx:C.applyFx(G, best.fx) }; } return { hit:best, left:n.looksLeft, box:true }; }
  return { hit:null, left:n.looksLeft };
};
C.canOpen = (G, s) => { // how can this container be opened?
  if (!s.box || s.open) return null; const b = s.box; const free = (b === 'crate' || b === 'cooler' || b === 'mailbox');
  if (free) return { how:'free' };
  if (C.fx(G, 'key')) return { how:'key' };
  if (b === 'lockbox' && C.has2(G, 'hatchet')) return { how:'hatchet' };
  const cost = b === 'safe' ? 3 : 2; return { how:'parts', cost, ok:G.parts >= cost };
};
C.open = (G, s, how) => {
  if (how && how.how === 'parts') { if (G.parts < how.cost) return null; G.parts -= how.cost; }
  s.open = true; return C.applyFx(G, s.fx);
};
C.sniff = G => { const n = G.nodes[G.node]; if (n.sniffed) { if (G.treats < 1) return null; G.treats--; } n.sniffed = true; return n.spots.filter(s => !s.got).map(s => ({ x:s.x, y:s.y })); };

// ---------- travelling ----------
C.hunger = G => { // evening meal. returns text lines
  const out = []; const need = (C.has(G, 'stove') ? 0 : 1) + (G.gentle ? 0 : 0);
  if (need > 0) { if (G.food >= need) { G.food -= need; } else { const d = C.addSpirit(G, -2); out.push('Not enough food for supper. You go to bed hungry. (Spirit ' + d + ')'); G.food = 0; } }
  else if (G.driveN % 2 === 0 && G.food > 0) G.food -= 0;
  if (G.treats > 0 && C.rnd(G) < .25) G.treats--; // Biscuit eats well
  return out;
};
C.newDay = G => { G.day++; G.hour = 0; G.wx = G.fc.shift() || C.rollWx(G); G.fc.push(C.rollWx(G)); };
C.camp = (G) => {
  const t = L.NODE_T[G.node].t; const lines = []; G.camps++;
  lines.push.apply(lines, C.hunger(G));
  let sp = 0; const n = G.nodes[G.node];
  if (t === 'camp') sp += 1; else if (t === 'stop' || t === 'town') sp += 1; else if (C.has2(G, 'bag')) sp += 0; else sp -= 1; sp -= 1; /* the miles wear on you */
  sp += C.fx(G, 'camp') + (C.has(G, 'awning') ? 1 : 0) + (C.has2(G, 'thermos') ? 1 : 0);
  if (G.food > 0 || G.spirit > 0) {}
  if (C.has(G, 'solar')) G.batt++;
  const d = C.addSpirit(G, sp); C.newDay(G);
  if (G.wear > 0 && t !== 'cross') { }
  return { lines, spirit:d, sp, solar:C.has(G, 'solar') };
};
C.encounterChance = G => { let p = G.gentle ? .45 : .62; if (G.wx === 'fog') p += .12; if (G.wx === 'rain') p += .05; return p; };
C.rollEncounter = (G, from, to) => {
  const t = L.NODE_T[to].t; if (G.nodes[to].seen >= 2 && C.rnd(G) < .45) return null; // known roads are quieter
  if (C.rnd(G) > C.encounterChance(G)) return null;
  const w = { standoff:3, roadblock:3, haggle:G.gifts.length ? 2 : 0, closecall:3 };
  if (G.wx === 'rain') w.closecall += 3; if (G.wx === 'fog') w.standoff += 2; if (G.wx === 'dust') w.roadblock += 2;
  if ((t === 'trader' || t === 'town') && G.gifts.length) w.haggle += 3;
  if (G.reg === 0 && G.driveN < 2) { return G.gifts.length ? 'haggle' : null; } // a gentle first drive: someone to trade with, never a wall
  return C.wpick(G, w);
};
C.drive = G => {}; // see C.go
// go to node b. returns { cost, push, night, wearUp, enc, lines }
C.go = (G, b) => {
  const c = C.edgeCost(G, G.node, b), res = { cost:c, lines:[], from:G.node, to:b };
  let fuel = c.fuel; const short = Math.max(0, fuel - G.fuel);
  G.fuel -= (fuel - short);
  if (short > 0) { res.push = short; G.hour += short * 2; C.addWear(G, short); const d = C.addSpirit(G, -1); res.lines.push('You push the van the last ' + short * 2 + ' miles. It takes a while. (Spirit ' + d + ')'); }
  const left = C.hoursLeft(G);
  const night = c.hours > left; res.night = night;
  G.hour += c.hours; if (G.hour > C.dayLen(G)) G.hour = C.dayLen(G);
  G.driveN++; G.stats.drives++;
  // wear
  let w = C.rnd(G) < .5 ? 1 : 0; if (c.dist > .24 && C.rnd(G) < .3) w++; if (G.wx === 'dust' && !C.has(G, 'tires') && c.dist > .2) w++; if (night) w++; if (C.wclass(G) === 'heavy' && C.rnd(G) < .3) w++;
  C.addWear(G, w); res.wearUp = w;
  if (night) C.addSpirit(G, -1);
  if (C.rnd(G) < .4) { const d0 = C.addSpirit(G, -1); if (d0) res.drain = true; }
  // music
  const dr = C.fx(G, 'drive'); if (dr && G.driveN % 2 === 0) { const d = C.addSpirit(G, 1); if (d) res.lines.push('Music on the radio. (Spirit +1)'); }
  G.prevNode = res.from; G.node = b; C.arrive(G);
  res.enc = (G.node === 13) ? null : C.rollEncounter(G, res.from, b);
  if (G.wear >= 10) res.breakdown = true;
  return res;
};
C.breakdown = G => { // wear 10: spare wheel absorbs the first one
  if (C.has(G, 'spare') && !G.spareUsed) { G.spareUsed = true; G.wear = 5; return { saved:true }; }
  return { saved:false };
};
// a failed crossing step: the first miss at a crossing is a retry (an hour and a little wear), the second is a tow
C.crossFail = G => { if ((G.crossFails || 0) < 1) { G.crossFails = 1; G.enc = null; C.spendHours(G, 1); C.addWear(G, 1); return { retry:true }; } return { retry:false }; };
C.tow = (G, why) => {
  G.tows++; G.enc = null; if (why && why.indexOf('cross') === 0) G.crossFails = (G.crossFails || 0) + 1;
  const free = C.fx(G, 'tow') && !G.towFree; let fee = G.gentle ? 0 : 3; if (free) { G.towFree = true; fee = 0; }
  const paid = Math.min(G.batt, fee); G.batt -= paid;
  const to = G.lastLit; G.node = to; G.wear = Math.min(G.wear, 3); const fuelBefore = G.fuel; G.fuel = Math.max(G.fuel, G.gentle ? 5 : 3); const topUp = G.fuel - fuelBefore;
  C.addSpirit(G, -1); C.newDay(G); G.food = Math.max(0, G.food - 0);
  C.markSeen(G);
  const over = !G.gentle && G.tows > L.MAXTOW; if (over) G.ended = 'tows';
  return { to, paid, fee, free, over, why, topUp };
};

// ---------- gas station mechanic ----------
C.fixFee = G => (G.reg >= 2 ? 2 : 1);
C.mechanic = (G) => { if (G.wear <= 0) return { err:'Nothing to fix.' }; const fee = C.fixFee(G); if (G.batt < fee) return { err:'Not enough batteries.' }; G.batt -= fee; const w = Math.min(G.wear, 2); G.wear -= w; C.spendHours(G, 1); return { ok:true, w, fee }; };
// ---------- odd jobs: a standing way to earn batteries at any stop with people in it ----------
C.JOBT = ['town', 'gas', 'stop', 'trader'];
C.jobPay = G => (G.reg >= 2 ? 3 : 2) + (G.gentle ? 1 : 0);
C.canJob = G => { const n = G.nodes[G.node]; return C.JOBT.indexOf(L.NODE_T[G.node].t) >= 0 && n.jobDay !== G.day && C.hoursLeft(G) >= 1; };
C.job = G => { if (!C.canJob(G)) return 0; const pay = C.jobPay(G); G.nodes[G.node].jobDay = G.day; C.spendHours(G, 1); G.batt += pay; return pay; };
// ---------- trading ----------
C.price = (G, k) => { let p = L.PRICE[k][G.reg]; if (k === 'fuel' && C.fx(G, 'gas')) p = Math.max(1, p - 1); return p; };
C.buy = (G, k, n) => { // k: fuel, food, part
  const unit = C.price(G, k), cost = unit * n; if (G.batt < cost) return { err:'Not enough batteries.' };
  if (k === 'fuel') { if (G.fuel + n > C.fuelCap(G)) return { err:'The tank will not hold that much.' }; G.fuel += n; }
  else if (k === 'food') G.food += n; else G.parts += n; G.batt -= cost; return { ok:true, cost };
};
C.sellValue = (G, kind, id) => (kind === 'gadget' ? L.GADGETS[id].sell : L.GIFTS[id].sell);
C.sell = (G, kind, id) => { const arr = kind === 'gadget' ? G.gadgets : G.gifts; const i = arr.indexOf(id); if (i < 0) return 0; arr.splice(i, 1); const v = C.sellValue(G, kind, id); G.batt += v; return v; };
C.shopFor = G => {
  const n = G.nodes[G.node]; if (n.shop) return n.shop;
  const unk = Object.keys(L.VPARTS).filter(p => !G.meta.bp[p]);
  const items = []; if (unk.length) items.push({ bp:unk[C.ri(G, 0, unk.length - 1)], price:8 });
  const gad = G.gbag.filter(id => G.gadgets.indexOf(id) < 0); if (gad.length) items.push({ gadget:gad[0], price:6 });
  if (!G.mapSeen[G.reg]) items.push({ map:1, price:3 });
  if (!G.hid[G.reg]) items.push({ hint:1, price:4 });
  n.shop = items; return items;
};

// ---------- encounter: Standoff ----------
C.sfNew = (G, crossing) => {
  const r = C.R(G), cid = C.pick(G, r.wild), c = L.CRITTERS[cid];
  const st = { kind:'standoff', cid, crossing:!!crossing, calm:c.calm + C.fx(G, 'calm') + (G.spirit >= 7 ? 6 : 0) - (G.spirit <= 2 ? 8 : 0) + (G.gentle ? 12 : 0) + (crossing ? 8 * (G.crossFails || 0) : 0), pat:c.pat + 1 + (G.gentle ? 1 : 0), used:{}, log:[], turn:0, done:null };
  return st;
};
C.sfActions = (G, st) => {
  const c = L.CRITTERS[st.cid], A = [];
  A.push({ id:'wait', label:'Hold still and wait', sub:'Costs nothing. Calm +' + (10 + (G.spirit >= 6 ? 3 : 0)) });
  A.push({ id:'talk', label:'Speak low and slow', sub:'Calm +' + (14 + Math.floor(G.spirit / 2)) });
  A.push({ id:'food', label:'Set out some food', sub:'1 food. Calm +' + (c.likes === 'food' ? 52 : 32), dis:G.food < 1 ? 'No food' : null });
  A.push({ id:'dog', label:'Have Biscuit sit', sub:'Calm +' + (st.cid === 'coyote' ? 6 : 18) });
  if (C.has2(G, 'whistle') && !st.used.whistle) A.push({ id:'whistle', label:'Play the tin whistle', sub:'Calm +' + (c.likes === 'sound' ? 50 : 30) + ', once' });
  if (C.has2(G, 'radio') && !st.used.radio) A.push({ id:'radio', label:'Turn the radio down low', sub:'1 battery. Calm +' + (c.likes === 'sound' ? 40 : 24), dis:G.batt < 1 ? 'No batteries' : null });
  A.push({ id:'honk', label:'Honk', sub:Math.round(C.honkP(G, st) * 100) + '% it leaves at once. Otherwise it gets nervous.' });
  A.push(st.crossing ? { id:'back', label:'Back off and try again', sub:'Costs 1 hour. The crossing starts over.' } : { id:'back', label:'Back away', sub:'Return to ' + C.nodeName(G, G.prevNode) + '. Costs 1 hour.' });
  return A;
};
C.sfDecay = (G, c) => Math.max(1, Math.round(c.decay * .6) - (G.gentle ? 2 : 0));
C.honkP = (G, st) => (C.has(G, 'bullbar') ? .75 : .45) - (L.CRITTERS[st.cid].big ? .15 : 0);
C.sfAct = (G, st, id) => {
  const c = L.CRITTERS[st.cid]; let msg = '', gain = 0; st.turn++;
  if (id === 'wait') { gain = 10 + (G.spirit >= 6 ? 3 : 0); msg = 'You hold still. The ' + c.n.toLowerCase() + ' watches you, then watches the road.'; }
  else if (id === 'talk') { gain = 14 + Math.floor(G.spirit / 2); msg = 'You tell it, quietly, that you are only passing through.'; }
  else if (id === 'food') { G.food--; gain = c.likes === 'food' ? 52 : 32; msg = 'You set a ration at the edge of the shoulder and step back.'; }
  else if (id === 'dog') { gain = st.cid === 'coyote' ? 6 : 18; msg = st.cid === 'coyote' ? 'Biscuit sits, but the coyote and Biscuit have opinions about each other.' : 'Biscuit sits and keeps very still, which seems to help.'; }
  else if (id === 'whistle') { st.used.whistle = 1; gain = c.likes === 'sound' ? 50 : 30; msg = 'One long, level note. The ' + c.n.toLowerCase() + ' tips its head.'; }
  else if (id === 'radio') { st.used.radio = 1; G.batt--; gain = c.likes === 'sound' ? 40 : 24; msg = 'Something low and slow comes out of the radio.'; }
  else if (id === 'honk') {
    if (C.rnd(G) < C.honkP(G, st)) { st.done = 'fled'; msg = 'It startles, and is gone into the brush. That works, but nobody feels good about it.'; return { msg, done:'fled' }; }
    gain = -22; msg = 'The horn goes off and the ' + c.n.toLowerCase() + ' flattens its ears. It is not leaving.';
  }
  else if (id === 'back') { st.done = 'back'; return { msg:'You ease the van backwards until the road bends. It is not worth it.', done:'back' }; }
  st.calm += gain; st.pat--;
  if (st.calm >= 100) { st.done = 'win'; return { msg, done:'win' }; }
  st.calm = Math.max(0, st.calm - C.sfDecay(G, c));
  if (st.pat <= 0 && st.calm >= 70 && !st.mercy) { st.mercy = 1; st.pat = 1; return { msg:msg + ' It is nearly there. It waits one more moment.', done:null, mercy:true }; }
  if (st.pat <= 0) { st.done = 'fail'; return { msg:msg + ' The ' + c.n.toLowerCase() + ' has lost patience. The van takes a hit and you retreat.', done:'fail' }; }
  return { msg, done:null };
};
C.sfFinish = G => {
  const st = G.enc, out = { fx:[], lines:[] };
  C.spendHours(G, 1);
  if (st.done === 'win') { const c = L.CRITTERS[st.cid]; G.stats.sfWins++; out.fx = C.applyFx(G, { spirit:1, scrap:'c_' + st.cid }); if (C.rnd(G) < .4) out.fx = out.fx.concat(C.applyFx(G, { gift:'*' })); out.lines.push('The ' + c.n.toLowerCase() + ' wanders off the road. You wait until it is out of sight.'); }
  else if (st.done === 'fail') { C.addWear(G, 2); out.tow = true; }
  else if (st.done === 'back') { if (st.crossing) out.retreat = true; else { G.node = G.prevNode; out.back = true; } }
  return out;
};

// ---------- encounter: Roadblock ----------
C.rbNew = G => {
  const ids = Object.keys(L.OBST); const oid = C.pick(G, ids), o = L.OBST[oid];
  return { kind:'roadblock', oid, tags:o.tags.slice(0, G.reg < 1 ? 1 : (C.rnd(G) < .4 ? 2 : 1)).slice(), solved:[], log:[], done:null, hours:0 };
};
C.rbTools = (G, tag) => { const out = []; L.TAGSOLVE[tag].forEach(t => { if (L.GADGETS[t] && C.has2(G, t)) out.push({ id:t, kind:'gadget' }); else if (L.VPARTS[t] && C.has(G, t)) out.push({ id:t, kind:'part' }); }); return out; };
C.rbHand = (G, st, tag) => { st.solved.push(tag); C.spendHours(G, 2); C.addWear(G, 1); st.hours += 2; return 'You clear it by hand. It takes two hours and the van does not like the dust.'; };
C.rbUse = (G, st, tag, toolId) => { st.solved.push(tag); C.spendHours(G, 1); st.hours += 1; return L.GADGETS[toolId] ? 'The ' + L.GADGETS[toolId].n.toLowerCase() + ' does the job.' : 'The ' + L.VPARTS[toolId].n.toLowerCase() + ' does the job.'; };
C.rbCut = (G, st, tag) => { if (G.parts < 2) return null; G.parts -= 2; st.solved.push(tag); C.spendHours(G, 1); return 'You cut through with spare parts. Two parts, one hour.'; };
C.rbDone = (st) => st.tags.every(t => st.solved.indexOf(t) >= 0);
C.rbFinish = G => { G.stats.rbDone++; const fx = C.rnd(G) < .55 ? C.applyFx(G, C.rnd(G) < .5 ? { parts:1 } : { batt:2 }) : []; return { fx }; };

// ---------- encounter: Haggle ----------
const WANTS = ['sweet', 'savory', 'warm', 'read', 'keepsake', 'bright', 'clean'];
C.hgNew = (G, who) => {
  const w = C.shuffle(G, WANTS).slice(0, 2); who = who || C.pick(G, ['ray', 'ray', 'wendell', 'juniper', 'dot', 'walt']);
  return { kind:'haggle', who, wants:w, mood:20 + C.fx(G, 'haggle') + (G.spirit >= 7 ? 5 : 0) + (G.gentle ? 10 : 0), offered:[], done:null, tier:0 };
};
C.hgScore = (G, st, ids) => { let m = st.mood; const got = {}; ids.forEach(id => { const tags = L.GIFTS[id].tags; const hit = tags.find(t => st.wants.indexOf(t) >= 0 && !got[t]); if (hit) { got[hit] = 1; m += 40; } else m += 8; }); return m; };
C.hgOffer = (G, st, ids) => { // ids: gift ids from pack (may repeat)
  const m = C.hgScore(G, st, ids); st.offered = ids.slice(); ids.forEach(id => { const i = G.gifts.indexOf(id); if (i >= 0) G.gifts.splice(i, 1); });
  st.mood = m; st.tier = m >= 80 ? 3 : m >= 52 ? 2 : m >= 25 ? 1 : 0; st.done = 'ok'; return st.tier;
};
C.hgRewards = (G, st) => {
  const t = st.tier; const o = [];
  if (t >= 3) { o.push({ l:'4 parts', fx:{ parts:4 } }); o.push({ l:'6 fuel', fx:{ fuel:6 } }); const unk = Object.keys(L.VPARTS).filter(p => !G.meta.bp[p]); if (unk.length) o.push({ l:'A blueprint: ' + L.VPARTS[unk[0]].n, fx:{ bp:unk[0] } }); else o.push({ l:'A gadget', fx:{ gadget:'*' } }); }
  else if (t === 2) { o.push({ l:'2 parts', fx:{ parts:2 } }); o.push({ l:'3 fuel', fx:{ fuel:3 } }); o.push({ l:'3 batteries', fx:{ batt:3 } }); }
  else if (t === 1) { o.push({ l:'2 batteries', fx:{ batt:2 } }); o.push({ l:'1 food, 1 fuel', fx:{ food:1, fuel:1 } }); }
  else o.push({ l:'Walk away', fx:{ spirit:0 } });
  return o;
};

// ---------- encounter: Close Call ----------
C.ccNew = (G, len, crossing) => {
  len = len || (G.reg >= 2 ? 11 : 9);
  const beat = !!C.tapeObj(G), gap = beat ? 1.35 : (G.gentle ? 1.75 : 1.5), rows = []; let t = 1.8, last = 1;
  const extra = G.wear >= 4 ? 1 : 0; const slick = (G.wx === 'rain' && !C.has(G, 'tires')) ? 1 : 0;
  const n = Math.round(len / gap) + extra;
  for (let k = 0; k < n; k++) {
    const lanes = [0, 0, 0]; const free = C.ri(G, Math.max(0, last - 1), Math.min(2, last + 1)); // the free lane is always next to the last one
    const two = C.rnd(G) < (G.gentle ? .15 : .4); const others = [0, 1, 2].filter(x => x !== free);
    lanes[others[C.ri(G, 0, 1)]] = 1; if (two) others.forEach(l => { lanes[l] = 1; });
    last = free;
    rows.push({ t:+t.toFixed(2), lanes, free, sp:lanes.map(l => l ? C.ri(G, 0, 7) : -1) });
    t += gap;
  }
  return { kind:'closecall', rows, len:t + 1, beat, slick, speed:G.gentle ? .85 : 1, tol:C.ccTol(G) + (crossing ? (G.reg >= 2 ? -1 : 0) + (G.crossFails || 0) : 0), hits:0, done:null, crossing:!!crossing };
};
C.ccTol = G => 3 + C.fx(G, 'cc') + (C.has(G, 'bullbar') ? 1 : 0) + (C.has(G, 'tires') ? 1 : 0) + (G.gentle ? 2 : 0);
C.ccFinish = (G, st, hits, crossing) => {
  G.stats.ccHits += hits; const out = { hits, lines:[], fail:false };
  C.addWear(G, Math.min(hits, 2)); if (hits > 2) C.addSpirit(G, -1);
  if (hits === 0) { const d = C.addSpirit(G, st.beat ? 2 : 1); out.lines.push('Clean run. (Spirit +' + d + ')'); }
  if (crossing && hits > st.tol) out.fail = true;
  return out;
};
// the bot / auto-tester samples a Close Call with a skill (probability of dodging each row)
C.ccSim = (G, st, skill) => { let h = 0; st.rows.forEach(() => { if (C.rnd(G) > skill) h++; }); return h; };

// ---------- wonders ----------
C.restore = G => {
  const w = C.lampWonder(G, G.node), n = G.nodes[G.node]; const cost = C.wonderCost(G, G.node);
  if (n.restored) return { err:'Already restored.' }; if (G.parts < cost) return { err:'Needs ' + cost + ' parts.' };
  G.parts -= cost; n.restored = true; C.spendHours(G, 1); G.wondersThisTrip++;
  const first = !G.meta.lamps[w.id]; G.meta.lamps[w.id] = 1;
  const BP = { orange:'tires', starlite:'solar', marguerite:'awning', elevator:'stove', dish:'cb' }, TP = { boneyard:'neon' };
  const fx = { spirit:2 + (C.has2(G, 'lens') ? 1 : 0), scrap:'w_' + w.id }; if (BP[w.id]) fx.bp = BP[w.id]; if (TP[w.id]) fx.tape = TP[w.id];
  const out = C.applyFx(G, fx); const extra = C.applyFx(G, { gift:'*', batt:2 });
  return { out:out.concat(extra), first, w };
};
C.lamps = meta => Object.keys(meta.lamps).length;

// ---------- end of region ----------
C.nextRegion = G => {
  const done = G.reg; G.meta.scrap['x_' + L.REGIONS[done].id] = G.meta.scrap['x_' + L.REGIONS[done].id] || { r:done, day:G.day };
  if (done >= 3) { G.won = true; return { win:true }; }
  G.crossFails = 0; C.enterRegion(G, done + 1); C.newDay(G);
  const fx = C.applyFx(G, { fuel:5, food:3, spirit:2, batt:3 }); return { fx };
};
C.stars = G => 2 + ((G.tows <= 2 || G.wondersThisTrip >= 5) ? 1 : 0);

// ---------- misc ----------
C.score = G => ({ day:G.day, tows:G.tows, wonders:G.wondersThisTrip, stars:C.stars(G) });
C.ensureTapes = G => { if (G.meta.tapes[G.tape]) return; G.tape = 'blue'; };
if (typeof module !== 'undefined') module.exports = C;
})(LRT);
