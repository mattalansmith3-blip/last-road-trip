// Title, the van, the pack, the Scrapbook, Sunspire, menu, finale, tutorial cards.
(function(L){
const C = L.core, U = L.ui, S = U.S, h = U.h, im = U.im, sp = U.sp, ico = U.ico, sfx = U.sfx, $ = (s, e) => (e || document).querySelector(s);
const screens = U.screens;
U.setMusic = () => { const G = S.G, sc = S.screen; let m = 'road';
  if (sc === 'title' || sc === 'over') m = 'title'; else if (sc === 'finale' || sc === 'postcard' || sc === 'sunspire') m = 'finale';
  else if (sc === 'enc' && G && G.enc && G.enc.kind !== 'closecall') m = 'tense'; else if (G) { const t = C.tapeObj(G); if (t) m = 't_' + t.id; else if (sc === 'scene' && C.nodeT(G).t === 'camp') m = 'camp'; }
  try { AU.music(m); } catch (e) {} };
U.coach = (key) => { const m = S.meta; m.coach = m.coach || {}; if (m.coach[key]) return; const T = {
  hud:['Reading the dashboard', 'Along the top: Fuel, Food, Batteries (the road\'s money), Parts and Treats. Below: the day and daylight left, today\'s weather, your Spirit, and the van\'s wear. Tap any of them to learn more.'],
  look:['Look closer', 'Tap anywhere in the picture to look closer. Things worth finding sparkle once you are near. Biscuit\'s nose points the way. Tap containers to open them. Tap Atlas at the top right to choose the next stop.'],
  upgrade:['Mara\'s parts', 'Open Van at the bottom. Tap the Roof slot to fit the Roof Rack with the parts you were given. Each slot takes one part, and heavy parts burn more fuel, so choose with care.'] }[key]; if (!T) return; m.coach[key] = 1; U.save(); U.sheet(T[0], h('p', null, T[1]), { sticky:true, actions:[U.btn('Got it', U.closeSheet, { cls:'btn-r', a:'coach-ok' })] }); };
// ---------- title ----------
screens.title = () => {
  const m = S.meta, run = U.loadRun(), lamps = C.lamps(m);
  const btns = [];
  if (run) btns.push(U.btn('Continue the trip', () => { run.enc = null; S.G = run; S.sel = null; S.ev = null; S.notes = []; U.go(run.enc ? 'scene' : 'scene'); AU.init(); }, { cls:'btn-r', a:'continue', sub:'Day ' + run.day + ' · ' + L.REGIONS[run.reg].short }));
  btns.push(U.btn(run ? 'Start a new trip' : 'Start the trip', () => { AU.init(); if (run) U.confirm('Start over?', 'Your trip in progress will be left behind. Blueprints, lamps, Scrapbook and Mixtapes are kept.', 'Start new trip', U.newTrip); else U.newTrip(); }, { cls:run ? 'btn-c' : 'btn-r', a:'newgame' }));
  btns.push(h('div', { class:'row2' }, U.btn('Sunspire · ' + lamps + '/12', () => { S.G = null; U.go('sunspire'); }, { cls:'btn-t', a:'t-sunspire' }), U.btn('Scrapbook', () => { U.go('book'); }, { cls:'btn-t', a:'t-book' })));
  btns.push(h('div', { class:'row2' }, U.btn(AU.muted ? 'Sound: off' : 'Sound: on', () => { AU.setMute(!AU.muted); U.render(); }, { a:'sound' }), U.btn(m.gentle ? 'Gentle mode: on' : 'Gentle mode: off', () => { m.gentle = !m.gentle; U.save(); U.render(); }, { a:'gentle' })));
  return h('div', { class:'scr title' }, im('assets/big/title.webp', 'bgimg', ''), h('div', { class:'shade top' }), h('div', { class:'logo' }, h('div', { class:'l1' }, 'The Last'), h('div', { class:'l2' }, 'Road Trip'), h('div', { class:'l3' }, 'A van, a dog, and a long way west.')), h('div', { class:'tbtns' }, btns, m.gentle ? h('p', { class:'gm' }, 'Gentle mode: calmer animals, slower roads, no limit on tows.') : null));
};
U.newTrip = () => {
  const G = S.G = C.newGame(S.meta, {}); C.arrive(G); S.sel = null; S.ev = null; S.notes = []; U.save();
  U.sheet('A postcard from Sunspire', h('div', null, h('div', { class:'postcard sm' }, h('div', { class:'pc-note' }, h('p', { class:'hand' }, 'The lamps are in good shape. We only need people to come and turn them on.'), h('p', { class:'hand r' }, '— Ines, Sunspire Park'))), h('p', null, 'It is the first mail in four years. You pack the van (her name is Marigold), whistle for Biscuit and point her west. Four stretches of road lie between you and the coast.'), h('p', { class:'sm' }, 'Along the way, restore Wonders: each one lights a lamp at Sunspire that stays lit on every future trip.')), { sticky:true, actions:[U.btn('Hit the road', () => { U.closeSheet(); U.go('scene'); }, { cls:'btn-r', a:'intro-ok' })] });
};
// ---------- the van ----------
const SLOTPOS = { roof:[50, 9], front:[93, 58], wheels:[69, 86], rear:[5, 52], side:[48, 50], cab:[78, 33] };
screens.van = () => {
  const G = S.G; if (!G) return h('div', { class:'scr' });
  const w = C.weight(G), wc = C.wclass(G);
  const marks = L.HARD.map(hp => { const part = G.van[hp.id], p = SLOTPOS[hp.id]; return h('button', { class:'hp' + (part ? ' on' : ''), style:'left:' + p[0] + '%;top:' + p[1] + '%', 'data-a':'hp-' + hp.id, onclick:() => U.slotSheet(hp) }, part ? sp('parts', L.VPARTS[part].i, 'hpi', '') : h('span', { class:'plus' }, '+'), h('small', null, hp.n)); });
  const q = C.quirks(G);
  const root = h('div', { class:'scr meta vanscr' }, U.hud(), h('div', { class:'artcol' }, h('div', { class:'vanbox' }, h('div', { class:'vanin' }, sp('van', 0, 'vanimg', 'Marigold'), marks))),
    h('div', { class:'panel' }, h('div', { class:'np' }, h('div', { class:'np-h' }, h('div', null, h('h3', null, 'Marigold'), h('small', null, 'Six hardpoints. One part each. Tap one.')), U.btn('Close', U.back, { cls:'btn-t', a:'van-close' })),
      h('div', { class:'wgt ' + wc }, ico('weight'), h('div', { class:'wbar' }, h('div', { class:'wt' }, h('i', { style:'width:' + Math.min(100, w / 10 * 100) + '%' }), h('b', { style:'left:40%' }), h('b', { style:'left:80%' }))), h('div', { class:'wl' }, h('b', null, 'Weight ' + w), h('small', null, wc === 'light' ? 'Light: no penalty.' : wc === 'normal' ? 'Normal.' : 'Heavy: +1 fuel on every drive.'))),
      h('div', { class:'stats' }, h('span', null, ico('fuel'), 'Tank ' + C.fuelCap(G)), h('span', null, ico('weight'), 'Pack ' + C.packUsed(G) + '/' + C.packCap(G)), h('span', null, ico('clock'), C.dayLen(G) + 'h days')),
      h('div', { class:'wearbox' }, h('b', null, 'Van wear ' + G.wear + '/10'), q.length ? q.map(x => h('p', { class:'quirk' }, h('b', null, x.n + ': '), x.d)) : h('p', { class:'hint' }, 'Marigold is running well.'), G.wear > 0 && G.parts > 0 ? U.btn('Repair (1 part, 1 hour)', () => { const w2 = C.repair(G, 1); C.spendHours(G, 1); sfx('wrench'); U.toast('Fixed ' + w2 + ' wear.'); U.render(); }, { a:'van-repair', sub:'−' + C.repairPerPart(G) + ' wear per part' }) : null))), U.nav('van'));
  root.__after = () => { if (G.parts >= 3 && !G.van.roof && S.meta.coach && S.meta.coach.hud) U.coach('upgrade'); };
  return root;
};
U.slotSheet = hp => {
  const G = S.G, cur = G.van[hp.id];
  const rows = [hp.a, hp.b].map(id => { const p = L.VPARTS[id], known = !!S.meta.bp[id], inst = cur === id, cost = C.installCost(G, id); const newW = C.weight(G) - (cur ? L.VPARTS[cur].w : 0) + p.w;
    return h('div', { class:'shoprow' + (inst ? ' inst' : '') }, sp('parts', p.i, 'sp48', p.n), h('div', { class:'sr-t' }, h('b', null, p.n), h('small', null, p.d), h('small', { class:'w' }, 'Weight ' + p.w + ' · ' + (inst ? 'installed' : known ? 'costs ' + cost + ' parts (you have ' + G.parts + ')' : 'blueprint needed') + (!inst && known && newW >= L.WEIGHT_HEAVY ? ' · makes the van Heavy' : ''))),
      inst ? U.btn('Remove', () => { C.removePart(G, hp.id); sfx('wrench'); U.closeSheet(); U.render(); }, { a:'rm-' + id }) : known ? U.btn('Install', () => { const e = C.install(G, hp.id, id); if (e) return U.toast(e); sfx('up'); U.closeSheet(); U.render(); U.toast(p.n + ' fitted.'); }, { cls:'btn-r', dis:G.parts < cost, a:'inst-' + id }) : U.btn('Locked', () => {}, { dis:true, sub:'Find the blueprint' })); });
  U.sheet(hp.n + ' hardpoint', h('div', { class:'shop' }, rows), { actions:[U.btn('Done', U.closeSheet, { a:'slot-done' })] });
};
// ---------- the pack ----------
screens.pack = () => {
  const G = S.G; if (!G) return h('div', { class:'scr' });
  const cell = (kind, id, extra) => { const it = U.itemInfo(kind, id); return h('button', { class:'cellitem', 'data-a':'pk-' + id, onclick:() => U.itemSheet(kind, id) }, im(it.src, 'sp48'), h('small', null, it.n), extra); };
  const dash = []; for (let i = 0; i < C.dashCap; i++) dash.push(G.souvs[i] ? cell('souv', G.souvs[i]) : h('div', { class:'cellitem empty' }, h('small', null, 'Empty')));
  const hasRadio = C.has2(G, 'radio');
  const tapes = L.TAPES.map(t => { const own = !!S.meta.tapes[t.id]; return h('button', { class:'tape' + (G.tape === t.id && own ? ' on' : '') + (own ? '' : ' lock'), 'data-a':'tape-' + t.id, onclick:() => { if (!own) return U.toast('Found: ' + t.from + '.'); G.tape = t.id; S.meta.tape = t.id; U.save(); U.render(); if (!hasRadio) U.toast('You need the Crank Radio to play it.'); } }, own ? sp('tapes', t.i, 'sp48', t.n) : sp('uiicons', 7, 'sp48', ''), h('div', { class:'tt' }, h('b', null, own ? t.n : '???'), h('small', null, own ? t.d : 'Found: ' + t.from))); });
  const root = h('div', { class:'scr meta pack fullm' }, U.hud(), h('div', { class:'panel full' }, h('div', { class:'np' }, h('div', { class:'np-h' }, h('div', null, h('h3', null, 'Pack'), h('small', null, 'Carrying ' + C.packUsed(G) + ' of ' + C.packCap(G))), U.btn('Close', U.back, { cls:'btn-t', a:'pack-close' })),
    h('h4', null, 'Tools'), h('div', { class:'grid' }, G.gadgets.length ? G.gadgets.map(id => cell('gadget', id)) : h('p', { class:'hint' }, 'Nothing yet. Tools turn up in lockboxes and with traders.')),
    h('h4', null, 'Gifts for trading'), h('div', { class:'grid' }, G.gifts.length ? G.gifts.map((id, i) => cell('gift', id)) : h('p', { class:'hint' }, 'No gifts. Coolers, mailboxes and kind people have them.')),
    h('h4', null, 'Dashboard (' + G.souvs.length + '/' + C.dashCap + ')'), h('div', { class:'grid' }, dash),
    h('h4', null, 'Mixtapes' + (hasRadio ? '' : ' · need the Crank Radio')), h('div', { class:'tapes' }, tapes),
    h('h4', null, 'Riding along'), h('div', { class:'grid' }, G.pass.length ? G.pass.map(id => cell('pass', id)) : h('p', { class:'hint' }, 'Nobody yet. Some animals will join you if you are kind.')),
    h('h4', null, 'Blueprints known'), h('div', { class:'grid' }, Object.keys(L.VPARTS).map(id => S.meta.bp[id] ? cell('part', id) : null))), ), U.nav('pack'));
  return root;
};
U.itemSheet = (kind, id) => {
  const G = S.G, it = U.itemInfo(kind, id), acts = [];
  if (kind === 'gadget' && L.GADGETS[id].use === 'wear') acts.push(U.btn('Use it (−2 wear)', () => { if (G.wear < 1) return U.toast('The van does not need it yet.'); G.gadgets.splice(G.gadgets.indexOf(id), 1); C.addWear(G, -2); sfx('wrench'); U.closeSheet(); U.render(); }, { cls:'btn-r', a:'use' }));
  if (kind === 'souv') acts.push(U.btn('Take it off the dash', () => U.confirm('Take it off?', 'It will be left behind.', 'Leave it', () => { G.souvs.splice(G.souvs.indexOf(id), 1); U.render(); }), { a:'drop' }));
  if (kind === 'gadget' || kind === 'gift') acts.push(U.btn('Drop it', () => U.confirm('Drop the ' + it.n + '?', 'It will be left at the side of the road.', 'Drop it', () => { const arr = kind === 'gadget' ? G.gadgets : G.gifts; arr.splice(arr.indexOf(id), 1); U.render(); }), { a:'drop' }));
  acts.push(U.btn('Close', U.closeSheet, { a:'item-close' }));
  U.sheet(it.n, h('div', { class:'itemrow big' }, im(it.src, 'iti'), h('p', null, it.d)), { actions:acts });
};
// ---------- scrapbook ----------
U.PAGES = () => {
  const P = []; L.REGIONS.forEach((r, ri) => { ['A', 'B', 'C'].forEach(k => { const w = r.wonders[k]; P.push({ id:'w_' + w.id, n:w.n, img:'assets/scene/' + r.pre + '_wonder' + k + '.webp', g:'Wonders' }); }); });
  L.REGIONS.forEach(r => { P.push({ id:'v_' + r.id, n:r.short + ' viewpoint', img:'assets/scene/' + r.pre + '_vista.webp', g:'Views' }); P.push({ id:'x_' + r.id, n:r.cross.n, img:'assets/scene/' + r.pre + '_cross.webp', g:'Views' }); });
  Object.keys(L.CRITTERS).forEach(k => P.push({ id:'c_' + k, n:L.CRITTERS[k].n, spr:['wild', L.CRITTERS[k].i], g:'Animals' }));
  Object.keys(L.PASS).forEach(k => P.push({ id:'p_' + k, n:L.PASS[k].n, spr:['friends', L.PASS[k].i], g:'Company' }));
  Object.keys(L.NPC).forEach(k => { if (k !== 'ines') P.push({ id:'n_' + k, n:L.NPC[k].n, spr:L.NPC[k].img, g:'People' }); });
  P.push({ id:'x_sunspire', n:'Sunspire Park', img:'assets/big/sunspire_lit.webp', g:'Views' }); return P; };
const polaroid = (p, got) => h('button', { class:'pol' + (got ? '' : ' empty'), 'data-a':'pol-' + p.id, onclick:() => got && U.polSheet(p) }, h('div', { class:'pimg' }, got ? (p.img ? im(p.img, 'pi') : sp(p.spr[0], p.spr[1], 'pi spr', p.n)) : h('span', { class:'q' }, '?')), h('span', { class:'cap' }, got ? p.n : 'Not yet'));
U.polSheet = p => U.sheet(p.n, h('div', { class:'polbig' }, polaroid(p, true)), { actions:[U.btn('Close', U.closeSheet)] });
screens.book = () => {
  const P = U.PAGES(), have = P.filter(p => S.meta.scrap[p.id]).length; const groups = {}; P.forEach(p => { (groups[p.g] = groups[p.g] || []).push(p); });
  const back = S.G ? U.back : () => U.go('title');
  return h('div', { class:'scr meta book fullm' }, S.G ? U.hud() : null, h('div', { class:'panel full' }, h('div', { class:'np' }, h('div', { class:'np-h' }, h('div', null, h('h3', null, 'Scrapbook'), h('small', null, have + ' of ' + P.length + ' pages')), U.btn('Close', back, { cls:'btn-t', a:'book-close' })), Object.keys(groups).map(g => [h('h4', null, g), h('div', { class:'pols' }, groups[g].map(p => polaroid(p, !!S.meta.scrap[p.id])))]))), S.G ? U.nav('book') : null);
};
// ---------- Sunspire (meta progression) ----------
function sunspireArt(lamps) {
  const GL = [[183, 626], [233, 620], [270, 624], [284, 646], [319, 598], [403, 592], [589, 598], [621, 636], [640, 616], [668, 628], [724, 630], [512, 190]];
  const art = h('div', { class:'sunart' }, im('assets/big/sunspire_dark.webp', 'sbase', ''), im('assets/big/sunspire_lit.webp', 'slit', '')); art.querySelector('.slit').style.opacity = Math.pow(lamps / 12, 1.3).toFixed(2);
  GL.forEach((g, i) => { if (i < lamps && lamps < 12) art.append(h('i', { class:'lampglow', style:'left:' + g[0] / 8 + '%;top:' + g[1] / 8 + '%' })); });
  return art;
}
screens.sunspire = () => {
  const m = S.meta, lamps = C.lamps(m);
  const rows = L.REGIONS.map(r => h('div', { class:'swr' }, h('b', null, r.short), ['A', 'B', 'C'].map(k => { const w = r.wonders[k], on = !!m.lamps[w.id]; return h('span', { class:'sw' + (on ? ' on' : '') }, sp('uiicons', on ? 1 : 2, 'sl', ''), on ? w.n : '???'); })));
  return h('div', { class:'scr meta sunspire' }, h('div', { class:'artcol' }, sunspireArt(lamps)), h('div', { class:'panel' }, h('div', { class:'np' }, h('div', { class:'np-h' }, h('div', null, h('h3', null, 'Sunspire Park'), h('small', null, lamps + ' of 12 lamps lit' + (lamps >= 12 ? ' · Every lamp is on' : ''))), U.btn('Close', () => S.G ? U.back() : U.go('title'), { cls:'btn-t', a:'ss-close' })), h('p', { class:'desc' }, lamps ? 'Every Wonder you restore on the road lights a lamp here, and the lamps stay lit on every trip you take. ' + (m.arrived ? 'You have arrived ' + m.arrived + (m.arrived > 1 ? ' times.' : ' time.') : 'You have not arrived yet.') : 'The park is dark. Every Wonder you restore on the road will light a lamp here, for good.'), rows)));
};
screens.finale = a => {
  const G = S.G, m = S.meta, lamps = a.lamps, all = lamps >= 12;
  const stars = []; for (let i = 0; i < 3; i++) stars.push(sp('uiicons', i < a.stars ? 5 : 6, 'star', ''));
  const lines = all ? 'Every lamp is lit. I did not think I would see that again.' : lamps ? 'There are ' + lamps + ' lamps lit tonight, and you did that. The rest are waiting for whoever comes next, which I hope is you.' : 'The lamps are still dark, but you are here, and that is the part I was worried about.';
  return h('div', { class:'scr full fin' }, h('div', { class:'fullart' }, sunspireArt(lamps)), h('div', { class:'fullcard low' }, h('h1', null, 'Sunspire Park'), h('div', { class:'stars' }, stars), h('p', null, 'Ines is waiting at the gate with a flashlight she does not need. She looks at the van, then at the dog, and says:'), h('p', { class:'quote' }, '"You made it. ' + lines + '"'), h('p', { class:'sm' }, 'Day ' + G.day + ' · ' + G.tows + (G.tows === 1 ? ' tow' : ' tows') + ' · ' + G.wondersThisTrip + ' Wonders restored this trip · ' + lamps + ' of 12 lamps lit overall'), U.gains(a.fx.filter(o => o.k !== 'full')), h('div', { class:'row2' }, U.btn('Scrapbook', () => U.go('book'), { cls:'btn-t', a:'fin-book' }), U.btn('Another trip', () => { S.G = null; U.go('title'); }, { cls:'btn-r', a:'fin-again' }))));
};
// ---------- menu ----------
screens.menu = () => {
  const G = S.G, m = S.meta;
  return h('div', { class:'scr meta menu fullm' }, G ? U.hud() : null, h('div', { class:'panel full' }, h('div', { class:'np' }, h('div', { class:'np-h' }, h('h3', null, 'Menu'), U.btn('Close', U.back, { cls:'btn-t', a:'menu-close' })),
    h('div', { class:'acts' }, U.btn(AU.muted ? 'Sound: off' : 'Sound: on', () => { AU.setMute(!AU.muted); U.render(); }, { a:'m-sound' }),
      U.btn(m.gentle ? 'Gentle mode: on' : 'Gentle mode: off', () => { m.gentle = !m.gentle; if (G) G.gentle = m.gentle; U.save(); U.render(); }, { a:'m-gentle', sub:'Calmer animals, slower roads, more forgiving crossings, unlimited tows.' }),
      U.btn('How to play', () => U.go('howto'), { a:'m-how' }), U.btn('Sunspire Park · ' + C.lamps(m) + '/12 lamps', () => U.go('sunspire'), { a:'m-sun' }),
      G ? U.btn('Save and go to the title', () => { U.save(); S.G && (S.G._saved = 1); U.go('title'); }, { a:'m-title' }) : null,
      G ? U.btn('Give up this trip', () => U.confirm('Give up this trip?', 'The van is left where it is. Blueprints, lamps, Scrapbook pages and Mixtapes are kept.', 'Give up', () => { S.G.ended = 'quit'; U.tripOver(); }), { a:'m-quit' }) : null))), G ? U.nav('menu') : null);
};
screens.howto = () => h('div', { class:'scr meta fullm' }, h('div', { class:'panel full' }, h('div', { class:'np' }, h('div', { class:'np-h' }, h('h3', null, 'How to play'), U.btn('Close', U.back, { cls:'btn-t', a:'how-close' })),
  [['The goal', 'Drive Marigold and Biscuit across four stretches of road to Sunspire Park. There is no combat and no game over: when things go wrong you get towed to the last lit stop and try again.'],
   ['The atlas', 'It starts in fog. Tap a stop to see what the drive costs, then drive. Roads and stops appear as you explore. Viewpoints, binoculars, maps and the CB radio show what is at each stop.'],
   ['Every stop', 'Tap the picture to look closer for fuel, food, batteries, parts and gifts. Biscuit\'s nose points toward what is left. Talk to people, trade, repair, and make camp when the daylight runs out.'],
   ['On the road', 'Four things can happen: a Standoff (calm an animal), a Roadblock (use the right tool), a Haggle (trade gifts) or a Close Call (swipe to dodge). Crossings at the end of each region combine them.'],
   ['The van', 'Six hardpoints take one part each. Blueprints are found, traded or earned, and kept for every trip. Heavy parts burn more fuel.'],
   ['Wonders and Sunspire', 'Restore a Wonder with parts and a lamp lights at Sunspire for good. Scrapbook pages and Mixtapes are kept, too.']].map(x => h('div', { class:'howp' }, h('h4', null, x[0]), h('p', null, x[1]))))));
})(LRT);
