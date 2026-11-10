// Arriving somewhere: the painted scene, looking around, people, services, wonders, crossings.
(function(L){
const C = L.core, U = L.ui, S = U.S, h = U.h, im = U.im, sp = U.sp, ico = U.ico, sfx = U.sfx, $ = (s, e) => (e || document).querySelector(s);
const KIND = { town:'A small town', gas:'Gas station', stop:'Roadside stop', camp:'Campsite', vista:'Viewpoint', wonder:'A Wonder', house:'Abandoned house', trader:'Trading post', cross:'The Crossing' };
const DESC = { town:'A few buildings, one of them with a light on.', gas:'Two pumps and a bench. The sign still says OPEN.', stop:'A place to sit down, with a door that works.', camp:'Flat ground, a fire ring, and room to hear yourself think.', vista:'The road runs out ahead of you, and you can see a long way.', house:'Somebody\'s home, left in order.', trader:'A tarp is up and the table is out.' };
const kindOf = (G, i) => KIND[L.NODE_T[i].t];
U.kindOf = kindOf;
const screens = U.screens;
function artView() {
  const G = S.G, n = G.nodes[G.node], t = C.nodeT(G), sc = C.sceneKey(G, G.node);
  const inner = h('div', { class:'art-in' + (n.restored ? ' restored' : '') }, im(sc.src, 'scene-img' + (sc.flip ? ' flip' : ''), C.nodeName(G)));
  if (n.restored) inner.append(h('div', { class:'glow' }));
  inner.__spots = h('div', { class:'spots' }); inner.append(inner.__spots);
  n.spots && n.spots.forEach((s, k) => { if (s.got && s.box) inner.__spots.append(spotBox(s, k)); });
  const art = h('div', { class:'art' }, inner);
  inner.addEventListener('click', e => { if (e.target.closest('.sbox')) return; U.lookAt(e, inner); });
  art.append(h('button', { class:'nose', 'data-a':'nose', onclick:e => { e.stopPropagation(); U.sniff(inner); } }, sp('dog', 2, 'noseimg', 'Biscuit'), h('span', null, n.sniffed ? (S.G.treats > 0 ? 'Nose · 1 treat' : 'Nose · no treats') : 'Biscuit\'s nose')));
  art.append(h('div', { class:'looks', 'data-a':'looks' }, sp('uiicons', 3, 'li', ''), h('b', null, n.spots ? n.looksLeft : 0), h('small', null, ' looks left')));
  return art;
}
function spotBox(s, k) {
  const sprIdx = { crate:0, cooler:1, lockbox:2, safe:3, mailbox:4 }[s.box] + (s.open ? 5 : 0);
  return h('button', { class:'sbox' + (s.open ? ' open' : ''), style:'left:' + s.x * 100 + '%;top:' + s.y * 100 + '%', 'data-a':'box-' + k, onclick:e => { e.stopPropagation(); U.openBox(s); } }, sp('containers', sprIdx, 'boximg', s.box));
}
U.lookAt = (e, inner) => {
  const G = S.G, n = G.nodes[G.node]; if (!n.spots) return; const r = inner.getBoundingClientRect(); const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
  U.ripple(inner, nx, ny);
  if (n.looksLeft <= 0) { U.toast('You have looked everywhere you can here.'); return; }
  const res = C.look(G, nx, ny);
  if (res.hit) { sfx(res.box ? 'open' : 'find'); if (res.box) { inner.__spots.append(spotBox(res.hit, n.spots.indexOf(res.hit))); U.toast('A ' + res.hit.box + '. Tap it to open.'); } else { U.found(res.fx); } }
  else { sfx('miss'); }
  U.updateChrome();
};
U.ripple = (inner, x, y) => { const d = h('div', { class:'ripple', style:'left:' + x * 100 + '%;top:' + y * 100 + '%' }); inner.append(d); setTimeout(() => d.remove(), 700); };
U.found = fx => { const G = S.G; const out = h('div', null, U.gains(fx.filter(o => o.k !== 'full')));  if (!fx.filter(o => o.k !== 'full').length) out.append(h('span', null, 'Nothing but rust and dust.')); U.toast(out, 2600); U.handleFull(fx, () => U.updateChrome()); };
U.updateChrome = () => {
  const G = S.G, hud = $('.hud'); if (hud) hud.replaceWith(U.hud()); const n = G.nodes[G.node]; const lk = $('.looks b'); if (lk) lk.textContent = n.looksLeft;
  const nose = $('.nose span'); if (nose) nose.textContent = n.sniffed ? (G.treats > 0 ? 'Nose · 1 treat' : 'Nose · no treats') : 'Biscuit\'s nose';
  const pnl = $('.panel'); if (pnl && S.screen === 'scene') { pnl.innerHTML = ''; pnl.append(U.scenePanel()); } U.save();
};
U.sniff = inner => {
  const G = S.G, n = G.nodes[G.node]; if (!n.spots) return; if (n.sniffed && G.treats < 1) { U.toast('Biscuit would like a treat first.'); return; }
  const marks = C.sniff(G); sfx('sniff'); const nose = $('.noseimg'); if (nose) { nose.classList.add('sn'); setTimeout(() => nose.classList.remove('sn'), 1800); }
  if (!marks.length) { U.toast('Biscuit has checked every corner. Nothing left.'); } else U.toast('Biscuit lifts his head toward ' + marks.length + (marks.length > 1 ? ' places.' : ' place.'));
  marks.forEach(m => { const d = h('div', { class:'sniffmark', style:'left:' + m.x * 100 + '%;top:' + m.y * 100 + '%' }, sp('uiicons', 9, 'sparkimg', '')); inner.append(d); setTimeout(() => d.remove(), 4200); });
  U.updateChrome();
};
U.openBox = s => {
  const G = S.G, how = C.canOpen(G, s); if (!how) return;
  const doOpen = () => { U.closeSheet(); const fx = C.open(G, s, how); sfx('open'); const b = $('.sbox.open'); U.found(fx); U.refresh(); };
  if (how.how === 'free') return doOpen();
  if (how.how === 'key') return doOpen();
  if (how.how === 'hatchet') return U.sheet('A locked ' + s.box, h('p', null, 'The hatchet will get it open.'), { actions:[U.btn('Pry it open', doOpen, { cls:'btn-r', a:'open-ok' }), U.btn('Leave it', U.closeSheet)] });
  U.sheet('A locked ' + s.box, h('p', null, 'It needs ' + how.cost + ' parts to cut open. You have ' + G.parts + '. A hatchet or a brass key would do it for free.'), { actions:[U.btn('Cut it open (' + how.cost + ' parts)', doOpen, { cls:'btn-r', dis:!how.ok, a:'open-ok' }), U.btn('Leave it', U.closeSheet)] });
};
screens.scene = () => {
  const G = S.G; if (!G.nodes[G.node].spots) C.arrive(G); const n = G.nodes[G.node];
  const root = h('div', { class:'scr scene' }, U.hud(), h('div', { class:'artcol' }, artView()), h('div', { class:'panel' }, U.scenePanel()), U.nav('scene'));
  root.__after = () => { U.coach('look'); };
  return root;
};
function evCard() {
  const G = S.G, n = G.nodes[G.node]; const id = C.eventFor(G, G.node); if (!id || n.evDone) return null; const ev = C.evById(id);
  const portrait = ev.who ? sp(L.NPC[ev.who].img[0], L.NPC[ev.who].img[1], 'evp', L.NPC[ev.who].n) : ev.img ? sp(ev.img[0], ev.img[1], 'evp', '') : null;
  return h('div', { class:'evc' }, h('div', { class:'evh' }, portrait, h('div', null, h('h3', null, ev.t), ev.who ? h('small', null, L.NPC[ev.who].n + ' · ' + L.NPC[ev.who].role) : null)), ev.p.map(t => h('p', null, t)),
    h('div', { class:'opts' }, ev.o.map((o, i) => { const why = C.evHas(G, o); return U.btn(o.t, () => U.pickOpt(ev, i), { dis:!!why, sub:why, a:'ev-' + i }); })));
}
U.pickOpt = (ev, i) => {
  const G = S.G; const res = C.evPick(G, ev, i); sfx('soft');
  if (res.special === 'haggle') return U.startEnc('haggle', () => U.go('scene'), { who:res.who, voluntary:true });
  if (res.special === 'shop') { S.ev = null; return U.shopSheet(); }
  S.ev = { ev, res, text:res.r }; sfx((res.fx || []).some(o => o.k === 'pass') ? 'win' : 'coin');
  U.save(); U.updateChrome(); U.handleFull(res.fx, () => U.updateChrome());
};
U.scenePanel = () => {
  const G = S.G, n = G.nodes[G.node], t = C.nodeT(G), r = C.R(G), w = wrapEl(), type = t.t;
  w.append(h('div', { class:'np-h' }, h('div', null, h('h3', null, C.nodeName(G)), h('small', null, kindOf(G, G.node) + ' · ' + r.short)), U.btn('Atlas', () => U.go('atlas'), { cls:'btn-t', a:'to-atlas' })));
  if (S.notes && S.notes.length) { S.notes.forEach(t => w.append(h('p', { class:'note' }, t))); }
  if (type === 'vista' && n.vistaDone && n.vistaGain) w.append(h('p', { class:'note' }, 'You stop and look for a while. The atlas fills in: every stop shows its true name now. (Spirit +' + n.vistaGain + ')'));
  const wd = type === 'wonder' ? C.lampWonder(G, G.node) : null;
  w.append(h('p', { class:'desc' }, type === 'wonder' ? wd.txt : type === 'cross' ? r.cross.txt : DESC[type]));
  if (S.ev && S.ev.ev && S.ev.res && S.ev.res.r) { w.append(h('div', { class:'evc res' }, h('p', null, S.ev.res.r), U.gains(S.ev.res.fx), U.btn('Continue', () => { S.ev = null; U.updateChrome(); if (S.G.parts >= 3 && !S.G.van.roof && !(S.meta.coach && S.meta.coach.upgrade)) U.coach('upgrade'); }, { cls:'btn-t', a:'ev-continue' }))); }
  else { const c = evCard(); if (c) w.append(c); }
  const blocked = S.ev && S.ev.res && S.ev.res.r;
  // actions
  const act = h('div', { class:'acts' });
  if (n.spots) { const found = n.spots.filter(s => s.got).length; act.append(h('p', { class:'hint' }, n.looksLeft > 0 ? 'Tap the picture to look closer. ' + found + ' of ' + n.spots.length + ' things found.' : 'You have found what there is to find here (' + found + ' of ' + n.spots.length + ').')); }
  if (type === 'wonder') {
    if (n.restored) act.append(h('p', { class:'ok' }, wd.done));
    else { const cost = C.wonderCost(G, G.node); act.append(U.btn(wd.verb, () => U.restore(), { cls:'btn-r', dis:G.parts < cost, sub:'Costs ' + cost + ' parts and an hour' + (G.parts < cost ? ' · you have ' + G.parts : ''), a:'restore' })); }
  }
  if (type === 'gas' || type === 'trader') {
    const pf = C.price(G, 'fuel'), room = C.fuelCap(G) - G.fuel;
    act.append(U.btn('Buy fuel', () => U.buyFuel(1), { cls:'btn-t', sub:pf + ' battery per fuel · tank ' + G.fuel + '/' + C.fuelCap(G), dis:room < 1 || G.batt < pf, a:'buy-fuel1' }));
    act.append(U.btn('Fill the tank', () => U.buyFuel(room), { cls:'btn-t', sub:room > 0 ? (room + ' fuel for ' + Math.min(room, Math.floor(G.batt / pf)) * pf + ' batteries' + (G.batt < room * pf ? ' (all you can afford)' : '')) : 'Already full', dis:room < 1 || G.batt < pf, a:'buy-fuelfill' }));
  }
  if (type === 'gas' && G.wear > 0) act.append(U.btn('Mechanic: fix 2 wear', () => { const r = C.mechanic(G); if (r.err) U.toast(r.err); else { sfx('wrench'); U.toast('Fixed ' + r.w + ' wear for ' + r.fee + ' battery. An hour goes by.'); } U.updateChrome(); }, { cls:'btn-t', sub:C.fixFee(G) + ' battery and an hour', dis:G.batt < C.fixFee(G), a:'mechanic' }));
  if (type === 'stop' || type === 'town' || type === 'trader') { const pf = C.price(G, 'food'); act.append(U.btn('Buy food', () => { const r = C.buy(G, 'food', 2); if (r.err) U.toast(r.err); else { sfx('coin'); U.toast('Two days of food.'); } U.updateChrome(); }, { cls:'btn-t', sub:'2 food for ' + pf * 2 + ' batteries', dis:G.batt < pf * 2, a:'buy-food' })); }
  if (type === 'trader') { act.append(U.btn('Look at the table', () => U.shopSheet(), { cls:'btn-t', sub:'Blueprints, maps, gear, and selling', a:'shop' })); if (!n.haggled) act.append(U.btn('Haggle with him', () => { n.haggled = true; U.startEnc('haggle', () => U.go('scene'), { who:'ray', voluntary:true }); }, { cls:'btn-c', sub:'Bring gifts', a:'haggle' })); }
  if (G.wear > 0 && G.parts > 0) { const per = C.repairPerPart(G); act.append(U.btn('Repair the van', () => { const w2 = C.repair(G, 1); C.spendHours(G, 1); sfx('wrench'); U.toast('Fixed ' + w2 + ' wear with one part. An hour goes by.'); U.updateChrome(); }, { cls:'btn-c', sub:'1 part = −' + per + ' wear · 1 hour · wear ' + G.wear, a:'repair' })); }
  if (type === 'cross') act.append(U.btn('Begin the crossing', () => U.runCrossing(), { cls:'btn-r', sub:r.cross.seq.length + ' challenges. If it goes badly, a tow takes you back to the last lit stop.', a:'cross' }));
  const left = C.hoursLeft(G);
  act.append(U.btn(type === 'camp' ? 'Make camp' : 'Sleep here', () => U.doCamp(), { cls:type === 'camp' ? 'btn-t' : 'btn-c', sub:(left > 0 ? left + ' hours of daylight left. ' : 'Night has fallen. ') + (type === 'camp' ? 'Rest, eat, wake to a new day.' : 'Rest here and start a new day.'), a:'camp' }));
  w.append(act); return w;
};
function wrapEl() { return h('div', { class:'np scenep' }); }
U.buyFuel = n => { const G = S.G, pf = C.price(G, 'fuel'); n = Math.min(n, Math.floor(G.batt / pf), C.fuelCap(G) - G.fuel); if (n < 1) return; C.buy(G, 'fuel', n); sfx('coin'); U.toast('+' + n + ' fuel for ' + n * pf + ' batteries.'); U.updateChrome(); };
U.restore = () => {
  const G = S.G, wd = C.lampWonder(G, G.node); const r = C.restore(G); if (r.err) return U.toast(r.err);
  sfx('lamp'); const root = $('.art-in'); if (root) { root.classList.add('restored'); root.append(h('div', { class:'glow' })); }
  const lamps = C.lamps(S.meta);
  U.sheet(wd.n, h('div', null, h('p', null, wd.done), U.gains(r.out.filter(o => o.k !== 'full')), h('div', { class:'polaroid-s' }, im(C.sceneKey(G, G.node).src, 'pol-img'), h('span', null, wd.n)), h('p', { class:'sm' }, r.first ? 'A new lamp comes on at Sunspire Park. (' + lamps + ' of 12 lit)' : 'This one was already lit at Sunspire from an earlier trip.')), { sticky:true, actions:[U.btn('Keep going', () => { U.closeSheet(); U.handleFull(r.out, () => U.refresh()); }, { cls:'btn-r', a:'restore-ok' })] });
  U.save();
};
// ----- trader -----
U.shopSheet = () => {
  const G = S.G; const rows = [];
  rows.push(h('h4', null, 'Offers'));
  C.shopFor(G).forEach((it, k) => {
    const lbl = it.bp ? 'Blueprint: ' + L.VPARTS[it.bp].n : it.gadget ? L.GADGETS[it.gadget].n : it.map ? 'A marked-up map of ' + C.R(G).short : 'A hint about the side road';
    const src = it.bp ? L.img('parts', L.VPARTS[it.bp].i) : it.gadget ? L.img('gadgets', L.GADGETS[it.gadget].i) : sprSrc('uiicons', it.map ? 0 : 3);
    rows.push(h('div', { class:'shoprow' }, im(src, 'sp48'), h('div', { class:'sr-t' }, h('b', null, lbl), h('small', null, it.bp ? L.VPARTS[it.bp].d : it.gadget ? L.GADGETS[it.gadget].d : it.map ? 'Every stop in this region shows its type.' : 'Shows a hidden road on the atlas.')), U.btn(it.price + ' batt', () => { if (G.batt < it.price) return U.toast('Not enough batteries.'); G.batt -= it.price; const fx = C.applyFx(G, it.bp ? { bp:it.bp } : it.gadget ? { gadget:it.gadget } : it.map ? { map:1 } : { hint:1 }); const sh = C.shopFor(G); sh.splice(sh.indexOf(it), 1); sfx('coin'); U.updateChrome(); U.handleFull(fx, () => U.shopSheet()); }, { cls:'btn-r', dis:G.batt < it.price, a:'offer-' + k })));
  });
  rows.push(h('h4', null, 'Parts'));
  const pp = C.price(G, 'part'); rows.push(h('div', { class:'shoprow' }, ico('parts', 'sp48'), h('div', { class:'sr-t' }, h('b', null, 'Spare parts'), h('small', null, 'You have ' + G.parts)), U.btn(pp + ' batt', () => { const r = C.buy(G, 'part', 1); if (r.err) U.toast(r.err); else sfx('coin'); U.updateChrome(); U.shopSheet(); }, { cls:'btn-t', dis:G.batt < pp, a:'buy-part' })));
  const sells = G.gadgets.map(id => ({ kind:'gadget', id })).concat(G.gifts.map(id => ({ kind:'gift', id })));
  rows.push(h('h4', null, 'Sell'));
  if (!sells.length) rows.push(h('p', { class:'hint' }, 'Nothing in the pack to sell.'));
  sells.forEach(x => { const it = U.itemInfo(x.kind, x.id), v = C.sellValue(G, x.kind, x.id); rows.push(h('div', { class:'shoprow' }, im(it.src, 'sp48'), h('div', { class:'sr-t' }, h('b', null, it.n), h('small', null, it.d)), U.btn('Sell ' + v, () => U.confirm('Sell the ' + it.n + '?', 'You will get ' + v + ' batteries. You cannot buy it back.', 'Sell it', () => { C.sell(G, x.kind, x.id); sfx('coin'); U.updateChrome(); U.shopSheet(); }), { a:'sell-' + x.id }))); });
  U.sheet('Ray Pruitt\'s table · ' + G.batt + ' batteries', h('div', { class:'shop' }, rows), { cls:'tall', actions:[U.btn('Done', U.closeSheet, { cls:'btn-r', a:'shop-done' })] });
};
const sprSrc = (set, i) => L.img(set, i);
// ----- crossings -----
U.runCrossing = () => {
  const G = S.G, seq = C.R(G).cross.seq; S.cross = { i:0 }; U.crossStep();
};
U.crossStep = () => {
  const G = S.G, seq = C.R(G).cross.seq, i = S.cross.i;
  if (i >= seq.length) return U.regionEnd();
  const kind = seq[i];
  U.startEnc(kind, () => { S.cross.i++; U.crossStep(); }, { crossing:true, step:i + 1, of:seq.length });
};
U.regionEnd = () => {
  const G = S.G; const doneReg = G.reg; const r = C.nextRegion(G); sfx('win'); U.save();
  if (r.win) { return U.finale(); }
  U.go('postcard', { reg:doneReg, fx:r.fx });
};
screens.postcard = a => {
  const G = S.G, rg = L.REGIONS[a.reg], next = L.REGIONS[a.reg + 1];
  const post = h('div', { class:'postcard' }, h('div', { class:'pc-photo' }, im('assets/scene/' + rg.pre + '_cross.webp', 'pc-img')), h('div', { class:'pc-note' }, h('p', { class:'hand' }, 'Day ' + G.day + '. ' + ({ fl:'Seven miles of bridge, and the sea went by on both sides. Biscuit watched every gull.', gulf:'We paid the toll in the end. The bridge keeper waved us off and told us to watch for fog.', tx:'The herd moved when it was ready. It took longer than I thought and was worth the wait.', mj:'Salt flats all the way to the horizon. It is very quiet out here, in a good way.' }[rg.id])), h('p', { class:'hand r' }, '— on to ' + next.n)));
  return h('div', { class:'scr full post' }, h('div', { class:'fullart' }, im('assets/atlas/' + (next.id === 'mj' ? 'mojave' : next.id) + '.webp', 'bgimg'), h('div', { class:'shade' })), h('div', { class:'fullcard' }, h('h1', null, rg.short + ' is done'), post, h('p', null, 'You rest at the border of ' + next.short + '. Someone has left a supply crate by the road.'), U.gains(a.fx), U.btn('Into ' + next.short, () => { S.sel = null; S.ev = null; S.notes = []; U.go('scene'); }, { cls:'btn-r', a:'region-next' })));
};
U.finale = () => {
  const G = S.G, m = S.meta; m.arrived++; m.trips++; const stars = C.stars(G); m.stars = Math.max(m.stars || 0, stars); m.best = Math.max(m.best, stars);
  const fx = C.applyFx(G, { tape:'last', scrap:'x_sunspire' }); const lamps = C.lamps(m); G.won = true; U.save(); localStorage.removeItem('lrt2_run');
  U.go('finale', { stars, lamps, fx });
};
})(LRT);
