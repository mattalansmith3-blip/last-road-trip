// The Last Road Trip v2 — interface. DOM only; the rules live in core.js.
(function(L){
const C = L.core, U = L.ui = {};
const S = U.S = { meta:null, G:null, screen:null, sel:null, ev:null, busy:false, coached:{} };
// ---------- helpers ----------
const $ = (sel, el) => (el || document).querySelector(sel);
const h = U.h = (tag, a, ...kids) => { const e = document.createElement(tag); if (a) for (const k in a) { const v = a[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v === true ? '' : v); } kids.forEach(k => add(e, k)); return e; };
function add(e, c) { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach(x => add(e, x)); else e.append(c.nodeType ? c : document.createTextNode(c)); }
const im = U.im = (src, cls, alt) => h('img', { src, class:cls, alt:alt || '', draggable:'false' });
const sp = U.sp = (set, i, cls, alt) => im(L.img(set, i), cls, alt);
const RES = U.RES = { fuel:{ n:'Fuel', i:0, d:'Every drive burns some. Buy more at gas stops, or find it.' }, food:{ n:'Food', i:1, d:'One meal each night. Short on food and Spirit sinks.' }, batt:{ n:'Batteries', i:2, d:'What the road uses for money. Also powers the radio.' }, parts:{ n:'Parts', i:3, d:'For repairs, upgrades and restoring Wonders.' }, treats:{ n:'Treats', i:5, d:'Biscuit\'s nose works best on a full stomach.' } };
const ico = U.ico = (k, cls) => sp('hud', L.HUD[k], cls || 'ico', k);
U.pct = (a, b) => Math.round(100 * a / b) + '%';
const plural = (n, w) => n + ' ' + w;
U.itemInfo = (kind, id) => {
  if (kind === 'gadget') { const g = L.GADGETS[id]; return { n:g.n, d:g.d, src:L.img('gadgets', g.i) }; }
  if (kind === 'gift') { const g = L.GIFTS[id]; return { n:g.n, d:'Good for ' + g.tags.map(t => L.TAGN[t]).join(' and ') + '. Trade it in a Haggle.', src:L.img('gifts', g.i) }; }
  if (kind === 'souv') { const g = L.SOUV[id]; return { n:g.n, d:g.d, src:L.img('souvenirs', g.i) }; }
  if (kind === 'part') { const g = L.VPARTS[id]; return { n:g.n, d:g.d, src:L.img('parts', g.i) }; }
  if (kind === 'pass') { const g = L.PASS[id]; return { n:g.n, d:g.d, src:L.img('friends', g.i) }; }
  if (kind === 'tape') { const g = L.TAPE_BY_ID[id]; return { n:g.n, d:g.d, src:L.img('tapes', g.i) }; }
  if (kind === 'bp') { const g = L.VPARTS[id]; return { n:'Blueprint: ' + g.n, d:g.d, src:L.img('parts', g.i) }; }
  return { n:id, d:'', src:'' };
};
const save = U.save = () => {
  try { localStorage.setItem('lrt2_meta', JSON.stringify(S.meta)); if (S.G && !S.G.ended && !S.G.won) localStorage.setItem('lrt2_run', JSON.stringify(S.G, (k, v) => k === 'meta' ? undefined : v)); else localStorage.removeItem('lrt2_run'); } catch (e) {}
};
U.loadMeta = () => { try { const m = JSON.parse(localStorage.getItem('lrt2_meta')); if (m && m.v === 2) { const f = C.freshMeta(); for (const k in f) if (!(k in m)) m[k] = f[k]; return m; } } catch (e) {} return C.freshMeta(); };
U.loadRun = () => { try { const g = JSON.parse(localStorage.getItem('lrt2_run')); if (g && g.v === 2) { g.meta = S.meta; return g; } } catch (e) {} return null; };
const sfx = U.sfx = n => { try { AU.sfx(n); } catch (e) {} };

// ---------- layout (art / map sizes are computed so spots and pins land where the painting says) ----------
U.layout = () => {
  const root = document.documentElement, W = innerWidth, H = innerHeight, land = W > H * 1.05;
  document.body.classList.toggle('land', land);
  const hud = $('.hud'), nav = $('.nav'); const hh = hud ? hud.offsetHeight : 90, nh = nav ? nav.offsetHeight : 56;
  let aw, ah, mw, mh;
  if (land) { ah = H; aw = Math.min(H, W * .46); mh = H; mw = mh * .75; }
  else { aw = Math.min(W, 560); ah = Math.min(aw * .88, Math.max(220, H - hh - nh - 250)); const avail = H - hh - nh - 150; mw = Math.min(aw, Math.max(220, avail) * .75); mh = mw / .75; }
  root.style.setProperty('--aw', Math.round(aw) + 'px'); root.style.setProperty('--ah', Math.round(ah) + 'px');
  root.style.setProperty('--mw', Math.round(mw) + 'px'); root.style.setProperty('--mh', Math.round(mh) + 'px');
  root.style.setProperty('--sq', Math.round(Math.max(aw, ah)) + 'px'); root.style.setProperty('--sqoff', Math.round(-(Math.max(aw, ah) - ah) * .6) + 'px');
  if (S.screen === 'atlas') U.drawFog();
};
addEventListener('resize', () => setTimeout(U.layout, 60)); addEventListener('orientationchange', () => setTimeout(U.layout, 200));

// ---------- toasts, sheets ----------
let toastT = null;
U.toast = (msg, ms) => { const t = $('#toasts'); t.innerHTML = ''; const e = h('div', { class:'toast' }, msg); t.append(e); clearTimeout(toastT); toastT = setTimeout(() => { e.classList.add('out'); setTimeout(() => e.remove(), 300); }, ms || 2300); };
U.clearToast = () => { $('#toasts').innerHTML = ''; };
const sheetEl = () => $('#sheet');
U.sheet = (title, body, opts) => {
  U.closeSheet(); opts = opts || {};
  const back = h('div', { id:'sheet', class:'sheet-back', onclick:e => { if (e.target === back && !opts.sticky) U.closeSheet(); } },
    h('div', { class:'sheet' + (opts.cls ? ' ' + opts.cls : '') }, title ? h('h2', null, title) : null, h('div', { class:'sheet-body' }, body), opts.actions ? h('div', { class:'sheet-actions' }, opts.actions) : null));
  document.body.append(back); return back;
};
U.closeSheet = () => { const s = sheetEl(); if (s) s.remove(); };
U.btn = (label, cb, o) => { o = o || {}; const b = h('button', { class:'btn ' + (o.cls || 'btn-c'), disabled:o.dis ? true : null, 'data-a':o.a, onclick:e => { if (b.disabled) return; sfx('tap'); cb(e); } }, h('span', { class:'bl' }, label), o.sub ? h('span', { class:'sub' }, o.sub) : null); return b; };
U.confirm = (title, text, yes, onYes, no) => U.sheet(title, h('p', null, text), { actions:[U.btn(yes, () => { U.closeSheet(); onYes(); }, { cls:'btn-r', a:'confirm' }), U.btn(no || 'Never mind', U.closeSheet, { a:'cancel' })] });

// ---------- HUD ----------
const chip = (k, v, mx) => h('button', { class:'chip', 'data-k':k, onclick:() => U.tip(k) }, ico(k), h('b', null, v, mx ? h('i', null, '/' + mx) : null), h('small', null, RES[k].n));
U.tip = k => { if (RES[k]) U.sheet(RES[k].n, h('p', null, RES[k].d)); else if (k === 'spirit') U.sheet('Spirit', h('p', null, 'Your morale. At 7 or more animals settle faster and traders like you. At 2 or less everything is harder. Wonders, views, music and good company bring it back. If it hits 0 you rest for a day.')); else if (k === 'wear') U.sheet('Van Wear', h('p', null, 'How tired Marigold is. Past 4 she pulls left; past 7 she runs rough. At 10 she stops and you need a tow. Spend parts to fix it.')); else if (k === 'time') U.sheet('Daylight', h('p', null, 'Eight hours of daylight a day. Driving takes 2 or 3 hours. Out of daylight, you camp. A Lantern buys you two more hours.')); };
U.hud = () => {
  const G = S.G; if (!G) return null; const wx = L.WEATHER_BY_ID[G.wx], left = C.hoursLeft(G), tot = C.dayLen(G);
  const pips = []; for (let i = 0; i < tot; i++) pips.push(h('span', { class:'pip' + (i < tot - left ? ' used' : '') }));
  const fc = G.fc.slice(0, C.forecastDays(G)).map(w => sp('weather', L.WEATHER_BY_ID[w].idx, 'wx-s', L.WEATHER_BY_ID[w].n));
  return h('div', { class:'hud' },
    h('div', { class:'hud-r1' }, chip('fuel', G.fuel, C.fuelCap(G)), chip('food', G.food), chip('batt', G.batt), chip('parts', G.parts), chip('treats', G.treats)),
    h('div', { class:'hud-r2' },
      h('button', { class:'cell time', onclick:() => U.tip('time') }, h('div', { class:'cl' }, 'Day ' + G.day, h('small', null, left + 'h of daylight')), h('div', { class:'pips' }, pips)),
      h('button', { class:'cell wx', onclick:() => U.sheet(wx.n + ' today', h('p', null, wx.d), fc.length ? h('p', { class:'fc' }, 'Forecast: ', fc) : null) }, sp('weather', wx.idx, 'wx', wx.n), h('div', { class:'cl' }, wx.n, h('small', null, fc.length ? 'next:' : 'today'), h('span', { class:'fcs' }, fc))),
      h('button', { class:'cell bar', onclick:() => U.tip('spirit') }, ico('spirit'), h('div', { class:'bw' }, h('div', { class:'bt' }, h('i', { class:'bf sp', style:'width:' + G.spirit * 10 + '%' })), h('small', null, 'Spirit ' + G.spirit))),
      h('button', { class:'cell bar', onclick:() => U.tip('wear') }, ico('wear'), h('div', { class:'bw' }, h('div', { class:'bt' }, h('i', { class:'bf wr' + (G.wear >= 7 ? ' hot' : ''), style:'width:' + G.wear * 10 + '%' })), h('small', null, 'Van wear ' + G.wear)))));
};
U.nav = cur => h('div', { class:'nav' },
  [['atlas', 'Atlas', 'map'], ['scene', 'Here', 'paw'], ['van', 'Van', 'wear'], ['pack', 'Pack', 'weight'], ['book', 'Scrapbook', 'film']].map(a => h('button', { class:'nv' + (cur === a[0] ? ' on' : ''), 'data-a':'nav-' + a[0], onclick:() => { sfx('soft'); U.go(a[0]); } }, ico(a[2]), h('span', null, a[1]))),
  h('button', { class:'nv', 'data-a':'nav-menu', onclick:() => U.go('menu') }, sp('uiicons', 9, 'ico', ''), h('span', null, 'Menu')));

// ---------- router ----------
const screens = U.screens = {};
const META = ['van', 'pack', 'book', 'menu', 'sunspire', 'howto'];
U.go = (name, arg) => { if (META.indexOf(name) >= 0 && META.indexOf(S.screen) < 0) S.prev = [S.screen, S.arg]; S.screen = name; S.arg = arg; U.render(); };
U.back = () => { const p = S.prev || [S.G ? 'scene' : 'title']; U.go(p[0], p[1]); };
U.render = () => {
  const app = $('#app'); app.innerHTML = ''; U.closeSheet(); if (U.stopLoops) U.stopLoops();
  const fn = screens[S.screen]; if (!fn) return; if (U.setMusic) U.setMusic(); const el = fn(S.arg); app.append(el); U.layout(); if (el.__after) el.__after(); save();
};
U.refresh = () => { const sc = S.screen; U.render(); };
// gains: chips describing what changed
U.gains = list => {
  const out = []; (list || []).forEach(o => {
    if (RES[o.k] && o.n) out.push(h('span', { class:'gain ' + (o.n > 0 ? 'up' : 'dn') }, ico(o.k), (o.n > 0 ? '+' : '') + o.n + ' ' + RES[o.k].n));
    else if (o.k === 'spirit') out.push(h('span', { class:'gain ' + (o.n > 0 ? 'up' : 'dn') }, ico('spirit'), (o.n > 0 ? '+' : '') + o.n + ' Spirit'));
    else if (o.k === 'wear') out.push(h('span', { class:'gain ' + (o.n > 0 ? 'dn' : 'up') }, ico('wear'), (o.n > 0 ? '+' : '') + o.n + ' Wear'));
    else if (o.k === 'hours') out.push(h('span', { class:'gain dn' }, ico('clock'), o.n + ' hour' + (o.n > 1 ? 's' : '')));
    else if (['gift', 'gadget', 'souv', 'tape', 'pass', 'bp'].indexOf(o.k) >= 0) { const it = U.itemInfo(o.k, o.id); out.push(h('span', { class:'gain item' }, im(it.src, 'gi'), (o.k === 'bp' ? '' : o.k === 'pass' ? 'Joined: ' : '') + it.n)); }
    else if (o.k === 'scrap') out.push(h('span', { class:'gain item' }, sp('uiicons', 4, 'gi'), 'Scrapbook page'));
    else if (o.k === 'note') out.push(h('span', { class:'gain note' }, o.t));
  });
  return h('div', { class:'gains' }, out);
};
// pack full / dash full
U.handleFull = (list, then) => {
  const fulls = (list || []).filter(o => o.k === 'full'); const next = () => { const f = fulls.shift(); if (!f) { then && then(); return; } U.fullSheet(f, next); };
  next();
};
U.fullSheet = (f, then) => {
  const G = S.G, it = U.itemInfo(f.kind, f.id);
  const items = f.kind === 'souv' ? G.souvs.map(id => ({ kind:'souv', id })) : G.gadgets.map(id => ({ kind:'gadget', id })).concat(G.gifts.map(id => ({ kind:'gift', id })));
  U.sheet(f.kind === 'souv' ? 'The dashboard is full' : 'Your pack is full', h('div', null, h('div', { class:'itemrow big' }, im(it.src, 'iti'), h('div', null, h('b', null, it.n), h('p', null, it.d))), h('p', null, f.kind === 'souv' ? 'Swap one out to keep it, or leave it behind.' : 'Drop something to make room, or leave it behind.'),
    h('div', { class:'grid' }, items.map(x => { const ii = U.itemInfo(x.kind, x.id); return h('button', { class:'cellitem', onclick:() => { if (x.kind === 'souv') G.souvs.splice(G.souvs.indexOf(x.id), 1); else if (x.kind === 'gadget') G.gadgets.splice(G.gadgets.indexOf(x.id), 1); else G.gifts.splice(G.gifts.indexOf(x.id), 1); C.giveItem(G, f.kind, f.id); U.closeSheet(); sfx('open'); U.toast('Dropped ' + ii.n + '. Took the ' + it.n + '.'); then && then(); } }, im(ii.src, 'sp48'), h('small', null, ii.n)); }))),
    { sticky:true, actions:[U.btn('Leave it', () => { U.closeSheet(); then && then(); })] });
};

// ---------- the atlas ----------
const paper = new Image(); paper.src = 'assets/big/paper.webp'; paper.onload = () => { if (S.screen === 'atlas') U.drawFog(); };
U.drawFog = () => {
  const cv = $('canvas.fog'); if (!cv || !S.G) return; const G = S.G, W = cv.clientWidth, Hh = cv.clientHeight; if (!W) return;
  const d = Math.min(2, devicePixelRatio || 1); cv.width = W * d; cv.height = Hh * d; const x = cv.getContext('2d'); x.scale(d, d);
  if (paper.complete && paper.naturalWidth) x.drawImage(paper, 0, 0, W, Hh); else { x.fillStyle = '#e4d3b2'; x.fillRect(0, 0, W, Hh); }
  x.fillStyle = 'rgba(110,80,50,.14)'; x.fillRect(0, 0, W, Hh);
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,.42)'; x.fillRect(0, 0, W, Hh);
  x.globalCompositeOperation = 'destination-out';
  const clear = (px, py, r, a) => { const g = x.createRadialGradient(px, py, r * .45, px, py, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); };
  G.nodes.forEach((n, i) => { if (n.seen < 1) return; if (L.NODE_T[i].hidden && !G.hid[G.reg]) return; const p = C.pos(G, i); if (n.seen >= 2) clear(p[0] * W, p[1] * Hh, W * .42, 1); else clear(p[0] * W, p[1] * Hh, W * .17, .85); });
  if (G.mapSeen[G.reg]) { x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, W, Hh); }
};
const wob = (a, b, k) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], s = ((k * 37) % 7 - 3) * .012; return [mx - dy * s * 3, my + dx * s * 3]; };
U.driveTo = b => {
  const G = S.G; const c = C.canGo(G, b); const issues = [];
  if (c.fuelShort > 0) issues.push('You need ' + c.cost.fuel + ' fuel and have ' + G.fuel + '. You would push the van the last stretch: +' + c.fuelShort * 2 + ' hours, +' + c.fuelShort + ' wear, Spirit −1.');
  if (c.dusk) issues.push('It will be dark before you get there. Driving on at night: Wear +1, Spirit −1. Or make camp here first.');
  if (G.wear >= 9) issues.push('Marigold is nearly done (wear ' + G.wear + '). One more bump and she stops.');
  const go = () => { U.closeSheet(); U.doDrive(b); };
  if (!issues.length) return go();
  U.sheet('Before you go', h('div', null, issues.map(t => h('p', { class:'warn' }, t))), { actions:[U.btn(c.fuelShort > 0 ? 'Push on anyway' : 'Drive on', go, { cls:'btn-r', a:'drive-anyway' }), c.dusk ? U.btn('Make camp here', () => { U.closeSheet(); U.doCamp(); }, { a:'camp-first' }) : null, U.btn('Stay', U.closeSheet, { a:'stay' })]});
};
U.doDrive = b => {
  const G = S.G; if (S.busy) return; S.busy = true; const from = G.node; sfx('drive');
  const van = $('.van'); const p = C.pos(G, b); const q = C.pos(G, from);
  if (van) { van.style.transform = 'translate(-50%,-72%) scaleX(' + (p[0] < q[0] ? -1 : 1) + ')'; van.classList.add('moving'); van.style.left = p[0] * 100 + '%'; van.style.top = p[1] * 100 + '%'; }
  const res = C.go(G, b); S.driveRes = res;
  setTimeout(() => { S.busy = false; U.afterDrive(res); }, van ? 950 : 50);
};
U.afterDrive = res => {
  const G = S.G; S.sel = null; U.clearToast();
  if (G.wear >= 10 && !res.enc) return U.breakdown(() => U.arrive(res));
  if (res.enc) return U.startEnc(res.enc, () => U.arrive(res));
  U.arrive(res);
};
U.arrive = res => {
  const G = S.G; if (G.ended) return U.tripOver();
  if (G.wear >= 10) return U.breakdown(() => U.arrive(res));
  S.ev = null; S.notes = (res && res.lines) || [];
  if (G.spirit <= 0) { return U.restDay(); }
  U.go('scene');
};
U.breakdown = then => {
  const G = S.G; const b = C.breakdown(G);
  if (b.saved) { sfx('wrench'); U.sheet('The spare wheel earns its place', h('p', null, 'Something gives with a bang. You are rolling on the spare before the dust settles. Marigold is shaky, but she goes. (Wear drops to 5. The spare is used up.)'), { sticky:true, actions:[U.btn('Keep going', () => { U.closeSheet(); then(); }, { cls:'btn-r' })] }); }
  else U.tow('breakdown', then);
};
U.tow = (why, then) => {
  const G = S.G; const r = C.tow(G, why); sfx('tow'); save();
  const msg = { breakdown:'Marigold stops with a long, tired sound. You sit on the bumper until the lights of a flatbed come over the rise.', 'enc-standoff':'The animal is not going anywhere, and neither is the van. You call it a day and wait for a tow.', 'enc-closecall':'The road wins this one.', 'cross-closecall':'The crossing wins this round. A tow truck finds you at the edge of the road.', 'cross-standoff':'The herd holds the road. You are towed back to try again in the morning.', 'cross-roadblock':'You are towed back to try again.' }[why] || 'A tow truck finds you before dark.';
  const over = r.over;
  U.go('tow', { r, msg, then, over });
};
screens.tow = a => {
  const G = S.G; const r = a.r;
  return h('div', { class:'scr full tow' }, h('div', { class:'fullart' }, sp('van', 2, 'towvan', ''), h('div', { class:'towbg' })),
    h('div', { class:'fullcard' }, h('h1', null, 'A Tow'), h('p', null, a.msg), h('p', null, 'You wake at ' + C.nodeName(G, r.to) + '. ' + (r.free ? 'The blank plate on your dash does the talking: the tow is free this once.' : r.paid ? 'The fee: ' + r.paid + ' batteries.' : 'The driver does not charge you, since you have nothing to give.')), h('p', { class:'sm' }, 'Tows this trip: ' + G.tows + (G.gentle ? '' : ' of ' + L.MAXTOW + ' you can afford')),
      U.btn(a.over ? 'Continue' : 'Back on the road', () => { if (a.over) U.tripOver(); else if (a.then) { /* after tow the node changed; arrive */ S.ev = null; S.notes = []; U.go('scene'); } }, { cls:'btn-r', a:'tow-ok' })));
};
U.tripOver = () => { const G = S.G, m = S.meta; m.trips++; const keep = Object.keys(m.bp).length; G.ended = G.ended || 'tows'; save(); localStorage.removeItem('lrt2_run'); U.go('over'); };
screens.over = () => { const G = S.G; return h('div', { class:'scr full' }, h('div', { class:'fullart' }, im('assets/big/title.webp', 'bgimg'), h('div', { class:'shade' })), h('div', { class:'fullcard' }, h('h1', null, 'The Trip Ends Here'), h('p', null, 'The van has been towed one time too many. Walt\'s flatbed takes you the rest of the way home, and nobody says very much.'), h('p', null, 'It is not wasted. Every blueprint, every lamp you lit at Sunspire, every Scrapbook page and every Mixtape stays with you. Next time you start with more.'), h('p', { class:'sm' }, 'You reached ' + C.R(G).n + ' on day ' + G.day + '.'), U.btn('Back to the title', () => { S.G = null; U.go('title'); }, { cls:'btn-r', a:'over-ok' }))); };
U.restDay = () => {
  const G = S.G; C.newDay(G); G.food = Math.max(0, G.food - 1); G.spirit = 3; save();
  U.sheet('A day of rest', h('p', null, 'You are too tired to drive safely. You park, put the dog in the shade and sleep through most of a day. It helps. (Spirit back to 3. A day and a meal gone.)'), { sticky:true, actions:[U.btn('Carry on', () => { U.closeSheet(); U.go('scene'); }, { cls:'btn-r' })] });
};
U.doCamp = () => {
  const G = S.G; const t = C.nodeT(G).t; const r = C.camp(G); sfx('soft'); S.ev = null;
  const wx = L.WEATHER_BY_ID[G.wx];
  const text = t === 'camp' ? 'A fire, a pot, the dog asleep against your leg. The day ends well.' : (t === 'stop' || t === 'town') ? 'You find a quiet corner behind the building and sleep in the van.' : C.has2(G, 'bag') ? 'You sleep rough, but the sleeping bag makes it fine.' : 'You sleep in the van on the shoulder of the road. Nobody sleeps well.';
  U.sheet('Day ' + (G.day) + ' begins', h('div', null, h('p', null, text), r.lines.map(t => h('p', { class:'warn' }, t)), U.gains([{ k:'spirit', n:r.spirit }].concat(r.solar ? [{ k:'batt', n:1 }] : [])), h('p', null, sp('weather', wx.idx, 'wx-s', ''), ' Today: ' + wx.n + '. ' + wx.d)), { sticky:true, actions:[U.btn('Get going', () => { U.closeSheet(); if (G.spirit <= 0) U.restDay(); else U.go(S.screen === 'scene' ? 'scene' : 'atlas'); }, { cls:'btn-r', a:'camp-ok' })] });
};

// atlas screen
screens.atlas = () => {
  const G = S.G, r = C.R(G), cur = G.node, sel = S.sel;
  const pins = [], routes = [];
  G.nodes.forEach((n, i) => {
    if (n.seen < 1) return; if (L.NODE_T[i].hidden && !G.hid[G.reg]) return; const p = C.pos(G, i);
    const known = C.typeKnown(G, i) || n.seen >= 2; const t = L.NODE_T[i];
    pins.push(h('button', { class:'pin' + (i === cur ? ' cur' : '') + (i === sel ? ' sel' : '') + (n.seen >= 2 ? ' vis' : '') + (n.restored ? ' lit' : '') + (t.hidden ? ' hid' : ''), style:'left:' + p[0] * 100 + '%;top:' + p[1] * 100 + '%', 'data-n':i, 'data-a':'pin-' + i, onclick:() => U.pickNode(i) }, sp('pins', known ? C.pinIdx(G, i) : 8, 'pimg', ''), n.seen >= 2 ? h('span', { class:'plab' }, r.names[i]) : null));
  });
  L.EDGES.forEach((e, k) => { const a = G.nodes[e[0]], b = G.nodes[e[1]]; if (a.seen < 1 || b.seen < 1) return; if ((L.NODE_T[e[0]].hidden || L.NODE_T[e[1]].hidden) && !G.hid[G.reg]) return; if (a.seen < 2 && b.seen < 2) return; const p = C.pos(G, e[0]), q = C.pos(G, e[1]), w = wob(p, q, k + 1); const both = a.seen >= 2 && b.seen >= 2; const d = 'M' + p[0] * 300 + ' ' + p[1] * 400 + ' Q' + w[0] * 300 + ' ' + w[1] * 400 + ' ' + q[0] * 300 + ' ' + q[1] * 400; routes.push(h('path', { d, class:'rt' + (both ? ' vis' : '') + (e[0] === cur && e[1] === sel || e[1] === cur && e[0] === sel ? ' sel' : '') })); });
  const cp = C.pos(G, cur);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 300 400'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'routes'); routes.forEach(p => { const e = document.createElementNS('http://www.w3.org/2000/svg', 'path'); for (const a of p.getAttributeNames()) e.setAttribute(a, p.getAttribute(a)); svg.append(e); });
  const map = h('div', { class:'map' }, im('assets/atlas/' + (r.id === 'mj' ? 'mojave' : r.id) + '.webp', 'atlas-img', r.n), h('canvas', { class:'fog' }), svg, pins, sp('van', 0, 'van', 'Marigold'));
  const van = map.querySelector('.van'); van.style.left = cp[0] * 100 + '%'; van.style.top = cp[1] * 100 + '%';
  const root = h('div', { class:'scr atlas' }, U.hud(), h('div', { class:'artcol' }, map, h('div', { class:'mapcap' }, r.short, h('small', null, ' · ' + C.nodeName(G, cur)))), h('div', { class:'panel' }, U.nodePanel()), U.nav('atlas'));
  root.__after = () => { U.drawFog(); U.coach('hud'); };
  return root;
};
U.pickNode = i => { sfx('soft'); S.sel = (S.sel === i) ? null : i; if (S.screen === 'atlas') { const keep = $('.panel'); U.render(); } };
U.nodePanel = () => {
  const G = S.G, r = C.R(G), cur = G.node, sel = S.sel, wrap = h('div', { class:'np' });
  if (sel == null) {
    const t = C.nodeT(G), here = C.nodeName(G, cur);
    wrap.append(h('div', { class:'np-h' }, h('div', null, h('h3', null, here), h('small', null, 'You are here. ' + r.n)), U.btn('Look around', () => { U.go('scene'); }, { cls:'btn-t', a:'look-here' })),
      h('p', { class:'hint' }, 'Tap a stop on the atlas to see what the drive will cost. Unknown stops are marked with a question mark; a viewpoint, binoculars or a map reveals them.'));
    const nb = C.nbrs(G, cur); if (!nb.length) wrap.append(h('p', null, 'No roads from here.'));
    return wrap;
  }
  const n = G.nodes[sel], known = C.typeKnown(G, sel) || n.seen >= 2, t = L.NODE_T[sel]; const adj = C.nbrs(G, cur).indexOf(sel) >= 0; const c = C.edgeCost(G, cur, sel);
  const kind = known ? ({ town:'A small town', gas:'Gas station', stop:'Roadside stop', camp:'Campsite', vista:'Viewpoint', wonder:'A Wonder', house:'Abandoned house', trader:'Trading post', cross:'The Crossing' }[t.t]) : 'Unknown stop';
  wrap.append(h('div', { class:'np-h' }, h('div', null, h('h3', null, n.seen >= 2 || known ? r.names[sel] : 'Somewhere ahead'), h('small', null, kind + (n.seen >= 2 ? ' · visited' : ''))),
    adj ? U.btn('Drive', () => U.driveTo(sel), { cls:'btn-r', a:'drive' }) : U.btn('Too far', () => {}, { dis:true })),
    adj ? h('div', { class:'costs' }, h('span', null, ico('clock'), c.hours + ' hours'), h('span', { class:G.fuel < c.fuel ? 'bad' : '' }, ico('fuel'), c.fuel + ' fuel (you have ' + G.fuel + ')'), c.hours > C.hoursLeft(G) ? h('span', { class:'bad' }, 'After dark') : null) : h('p', { class:'hint' }, 'Not connected to where you are. Drive to a neighbour first.'),
    G.wx !== 'sun' && adj ? h('p', { class:'hint' }, L.WEATHER_BY_ID[G.wx].n + ': ' + L.WEATHER_BY_ID[G.wx].d) : h('span'));
  return wrap;
};
U.screens = screens;
})(LRT);
