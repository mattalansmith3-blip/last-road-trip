// Encounters on the road: Standoff, Roadblock, Haggle, Close Call.
(function(L){
const C = L.core, U = L.ui, S = U.S, h = U.h, im = U.im, sp = U.sp, ico = U.ico, sfx = U.sfx, $ = (s, e) => (e || document).querySelector(s);
const screens = U.screens;
const roadSrc = G => 'assets/road/' + (C.R(G).id === 'mj' ? 'mojave' : C.R(G).id) + '.webp';
U.startEnc = (kind, then, opts) => {
  const G = S.G; opts = opts || {}; G.stats.enc++; S.encThen = then; S.encOpts = opts; S.encLog = ''; G.encCtx = { thenKind:opts.thenKind || 'scene', opts:{ crossing:opts.crossing, step:opts.step, of:opts.of, who:opts.who, voluntary:opts.voluntary, thenKind:opts.thenKind } };
  if (kind === 'standoff') G.enc = C.sfNew(G, opts.crossing); else if (kind === 'roadblock') G.enc = C.rbNew(G); else if (kind === 'haggle') G.enc = C.hgNew(G, opts.who); else G.enc = C.ccNew(G, opts.crossing ? C.R(G).cross.len : null, opts.crossing);
  U.go('enc');
};
U.encFail = (kind) => {
  const G = S.G; G.enc = null; const o = S.encOpts || {};
  if (o.crossing) { const r = C.crossFail(G); if (r.retry) { U.save(); return U.sheet('Not this time', h('div', null, h('p', null, 'Marigold limps to the shoulder. You rest for an hour, check the van over, and line up to try again.'), h('p', { class:'sm' }, 'The next attempt will be a little more forgiving. Wear +1.')), { sticky:true, actions:[U.btn('Try again', () => { U.closeSheet(); U.updateChrome && U.updateChrome(); U.crossStep(); }, { cls:'btn-r', a:'enc-ok' })] }); } }
  U.tow((o.crossing ? 'cross-' : 'enc-') + kind, S.encThen);
};
U.encDone = () => { const G = S.G; G.enc = null; const t = S.encThen; S.encThen = null; if (t) t(); };
screens.enc = () => {
  const G = S.G, st = G.enc; if (!st) { return h('div', { class:'scr' }, 'No encounter.'); }
  if (st.kind === 'standoff') return standoff(st); if (st.kind === 'roadblock') return roadblock(st); if (st.kind === 'haggle') return haggle(st); return closecall(st);
};
const stepTag = () => { const o = S.encOpts || {}; return o.crossing ? h('div', { class:'steptag' }, C.R(S.G).cross.n + ' · part ' + o.step + ' of ' + o.of) : null; };
// ---------- Standoff ----------
function ringSvg(calm) {
  const R = 46, circ = 2 * Math.PI * R; const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'ring');
  const mk = (cls, r) => { const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', 50); c.setAttribute('cy', 50); c.setAttribute('r', r); c.setAttribute('class', cls); return c; };
  const bg = mk('rbg', R), fg = mk('rfg', R); fg.setAttribute('stroke-dasharray', circ); fg.setAttribute('stroke-dashoffset', circ * (1 - Math.min(1, calm / 100))); fg.setAttribute('transform', 'rotate(-90 50 50)'); svg.append(bg, fg); return svg;
}
function standoff(st) {
  const G = S.G, c = L.CRITTERS[st.cid]; const pips = []; const patMax = Math.max(st.pat, c.pat + 1 + (G.gentle ? 1 : 0)); for (let i = 0; i < patMax; i++) pips.push(h('span', { class:'pawp' + (i < st.pat ? '' : ' gone') }));
  const art = h('div', { class:'art encart' }, h('div', { class:'art-in' }, im(roadSrc(G), 'scene-img', ''), h('div', { class:'critwrap' }, ringSvg(st.calm), h('div', { class:'gshadow' }), sp('wild', c.i, 'crit' + (st.calm >= 70 ? ' calm' : ''), c.n)), h('div', { class:'calmtxt' }, h('b', null, Math.min(100, Math.round(st.calm)) + '%'), ' calm'), h('div', { class:'pawps', title:'Patience' }, h('small', null, 'Patience: ' + st.pat + ' left'), pips)), stepTag());
  const acts = C.sfActions(G, st).map(a => U.btn(a.label, () => doStand(st, a.id), { dis:!!a.dis, sub:a.dis || a.sub, a:'sf-' + a.id, cls:a.id === 'honk' ? 'btn-c warnbtn' : a.id === 'back' ? 'btn-c' : 'btn-t' }));
  const hint = c.likes === 'food' ? 'It keeps looking at your supplies.' : 'Its ears keep turning toward every small sound.';
  const root = h('div', { class:'scr enc' }, U.hud(), h('div', { class:'artcol' }, art), h('div', { class:'panel' }, h('div', { class:'np' }, h('div', { class:'np-h' }, h('div', null, h('h3', null, 'A ' + c.n + ' in the road'), h('small', null, 'Standoff · fill the calm ring before patience runs out. Calm fades a little each turn.'))), h('p', { class:'desc' }, S.encLog || (c.intro[st.ix % c.intro.length] + ' ' + hint)), h('div', { class:'acts' }, acts))), U.nav('enc'));
  root.querySelector('.nav').classList.add('disabled'); return root;
}
function doStand(st, id) {
  const G = S.G; const r = C.sfAct(G, st, id); S.encLog = r.msg; sfx(id === 'honk' ? 'honk' : id === 'dog' ? 'bark' : 'calm');
  if (!r.done) return U.render();
  if (r.done === 'back') { const f = C.sfFinish(G); G.enc = null; if (f.retreat) { S.cross = null; G.cross = null; U.sheet('Backing off', h('p', null, 'You ease the van back from the line and wait an hour. The crossing starts over when you are ready.'), { sticky:true, actions:[U.btn('Back to the crossing', () => { U.closeSheet(); U.go('scene'); }, { cls:'btn-r', a:'enc-ok' })] }); return; } U.sheet('Backing away', h('p', null, r.msg), { sticky:true, actions:[U.btn('Back to the atlas', () => { U.closeSheet(); S.sel = null; U.go('atlas'); }, { cls:'btn-r', a:'enc-ok' })] }); return; }
  if (r.done === 'fail') { C.sfFinish(G); sfx('lose'); U.sheet('Out of patience', h('p', null, r.msg), { sticky:true, actions:[U.btn('Continue', () => { U.closeSheet(); U.encFail('standoff'); }, { cls:'btn-r', a:'enc-ok' })] }); return; }
  const f = C.sfFinish(G); sfx(r.done === 'win' ? 'win' : 'soft'); const c = L.CRITTERS[st.cid];
  U.sheet(r.done === 'win' ? 'It lets you pass' : 'It leaves', h('div', null, h('p', null, r.msg), f.lines.map(t => h('p', null, t)), U.gains(f.fx.filter(o => o.k !== 'full')), r.done === 'win' ? h('p', { class:'sm' }, 'A page goes in the Scrapbook: ' + c.n + '.') : null), { sticky:true, actions:[U.btn('Drive on', () => { U.closeSheet(); U.handleFull(f.fx, () => U.encDone()); }, { cls:'btn-r', a:'enc-ok' })] });
}
// ---------- Roadblock ----------
function roadblock(st) {
  const G = S.G, o = L.OBST[st.oid];
  const art = h('div', { class:'art encart rd' }, h('div', { class:'art-in tile' }, h('div', { class:'tilebg' }), sp('obstacles', o.i, 'obst', o.n), sp('van', 1, 'vtop', '')), stepTag());
  const groups = st.tags.map(tag => {
    const done = st.solved.indexOf(tag) >= 0; const tools = C.rbTools(G, tag);
    const btns = []; if (!done) {
      tools.forEach(t => { const it = U.itemInfo(t.kind, t.id); btns.push(U.btn('Use the ' + it.n, () => { S.encLog = C.rbUse(G, st, tag, t.id); sfx('wrench'); U.render(); }, { cls:'btn-t', sub:'1 hour · no cost', a:'rb-tool-' + t.id })); });
      btns.push(U.btn('Cut through with parts', () => { const r = C.rbCut(G, st, tag); if (!r) return U.toast('Not enough parts.'); S.encLog = r; sfx('wrench'); U.render(); }, { dis:G.parts < 2, sub:'2 parts · 1 hour', a:'rb-cut' }));
      btns.push(U.btn('Clear it by hand', () => { S.encLog = C.rbHand(G, st, tag); sfx('thud'); U.render(); }, { sub:'2 hours · +1 wear', a:'rb-hand' }));
    }
    return h('div', { class:'tagbox' + (done ? ' done' : '') }, h('div', { class:'tagh' }, h('span', { class:'tagchip' }, L.TAGNAME[tag]), done ? h('span', { class:'ok' }, 'Cleared') : h('small', null, 'Needs: ' + L.TAGSOLVE[tag].map(x => (L.GADGETS[x] || L.VPARTS[x]).n).join(' or '))), btns);
  });
  const fin = C.rbDone(st);
  const root = h('div', { class:'scr enc' }, U.hud(), h('div', { class:'artcol' }, art), h('div', { class:'panel' }, h('div', { class:'np' }, h('div', { class:'np-h' }, h('div', null, h('h3', null, o.n), h('small', null, 'Roadblock · the right tool makes it quick'))), h('p', { class:'desc' }, S.encLog || 'Something is across the lane. It will take a little work to get around.'), groups, fin ? h('div', { class:'pin-act' }, U.btn('Drive on', () => { const r = C.rbFinish(G); sfx('win'); const done = () => U.encDone(); if (r.fx.length) { U.sheet('You find something', h('div', null, h('p', null, 'There was something under it.'), U.gains(r.fx)), { sticky:true, actions:[U.btn('Drive on', () => { U.closeSheet(); done(); }, { cls:'btn-r', a:'enc-ok' })] }); } else done(); }, { cls:'btn-r', a:'rb-done' })) : null)), U.nav('enc'));
  root.querySelector('.nav').classList.add('disabled'); return root;
}
// ---------- Haggle ----------
function haggle(st) {
  const G = S.G, npc = L.NPC[st.who]; S.hgSel = S.hgSel || [];
  const sel = S.hgSel.filter(i => i < G.gifts.length); const ids = sel.map(i => G.gifts[i]); const pre = C.hgScore(G, st, ids);
  const art = h('div', { class:'art encart' }, h('div', { class:'art-in' }, im(roadSrc(G), 'scene-img', ''), h('div', { class:'critwrap npcw' }, h('div', { class:'gshadow' }), sp(npc.img[0], npc.img[1], 'crit npc', npc.n))), stepTag());
  const meter = h('div', { class:'mood' }, h('div', { class:'mt' }, h('i', { class:'mf', style:'width:' + Math.min(100, st.done ? st.mood : pre) + '%' }), h('b', { class:'mk', style:'left:25%' }), h('b', { class:'mk', style:'left:52%' }), h('b', { class:'mk', style:'left:80%' })), h('small', null, 'Mood: ' + (st.done ? st.mood : pre) + ' · rewards open at 25, 52 and 80'));
  const wants = h('div', { class:'wants' }, 'Wants: ', st.wants.map(w => h('span', { class:'tagchip' }, L.TAGN[w])));
  let body;
  if (!st.done) {
    const grid = h('div', { class:'grid' }, G.gifts.map((g, i) => { const it = U.itemInfo('gift', g), on = S.hgSel.indexOf(i) >= 0, match = L.GIFTS[g].tags.some(t => st.wants.indexOf(t) >= 0); return h('button', { class:'cellitem' + (on ? ' on' : ''), 'data-a':'gift-' + i, onclick:() => { const k = S.hgSel.indexOf(i); if (k >= 0) S.hgSel.splice(k, 1); else if (S.hgSel.length < 3) S.hgSel.push(i); sfx('tap'); U.render(); } }, im(it.src, 'sp48'), h('small', null, it.n), h('em', null, L.GIFTS[g].tags.map(t => t).join(' · '))); }));
    body = [h('p', { class:'desc' }, S.encLog || npc.n + ' has a few things worth trading. ' + (G.gifts.length ? 'Offer up to three gifts. A gift that fits what they want counts for a lot.' : 'You have no gifts to trade with.')), wants, meter, G.gifts.length ? grid : null, h('div', { class:'acts pin-act' }, !G.gifts.length ? U.btn('Talk for a while', () => { S.hgSel = []; C.hgTalk(G, st); sfx('soft'); S.encLog = 'You sit on the tailgate and talk about the road, and where you are headed. It costs an hour, and it lifts your spirits. ' + npc.n + ' warms to you, and offers a small trade.'; U.render(); }, { cls:'btn-r', sub:'1 hour · Spirit +1 · opens a small trade', a:'hg-talk' }) : null, U.btn(S.hgSel.length ? 'Offer ' + S.hgSel.length + ' gift' + (S.hgSel.length > 1 ? 's' : '') : 'Choose gifts to offer', () => { if (!S.hgSel.length) return; S.hgSel = []; C.hgOffer(G, st, ids); sfx(st.tier >= 2 ? 'win' : 'soft'); U.render(); }, { cls:'btn-r', dis:!S.hgSel.length, a:'hg-offer' }), U.btn('Walk away', () => { S.hgSel = []; G.enc = null; if ((S.encOpts || {}).crossing) { C.spendHours(G, 1); U.sheet('You wait it out', h('p', null, 'You step back from the table and wait in the line instead. It takes an hour, and then the way is open.'), { sticky:true, actions:[U.btn('Go on', () => { U.closeSheet(); U.encDone(); }, { cls:'btn-r', a:'enc-ok' })] }); } else U.encDone(); }, { a:'hg-leave' }))];
  } else {
    const rw = C.hgRewards(G, st); const words = ['They shrug and wish you luck.', 'A small trade, fairly done.', 'They like it. A decent trade.', 'They are delighted. Pick whatever you like.'][st.tier];
    body = [h('p', { class:'desc' }, words), meter, h('div', { class:'acts' }, rw.map((r, k) => U.btn(r.l, () => { const fx = C.applyFx(G, r.fx); if (st.tier >= 2) { C.addSpirit(G, 1); G.stats.hgWins++; } S.hgSel = []; sfx('coin'); U.sheet('Done', h('div', null, U.gains(fx.filter(o => o.k !== 'full'))), { sticky:true, actions:[U.btn('Continue', () => { U.closeSheet(); U.handleFull(fx, () => { G.enc = null; U.encDone(); }); }, { cls:'btn-r', a:'enc-ok' })] }); }, { cls:'btn-t', a:'hg-reward-' + k })))];
  }
  const root = h('div', { class:'scr enc' }, U.hud(), h('div', { class:'artcol' }, art), h('div', { class:'panel' }, h('div', { class:'np' }, h('div', { class:'np-h' }, h('div', null, h('h3', null, npc.n + ' wants to trade'), h('small', null, npc.role + ' · Haggle'))), body)), U.nav('enc'));
  root.querySelector('.nav').classList.add('disabled'); return root;
}
// ---------- Close Call ----------
function closecall(st) {
  const G = S.G; const cc = U.cc = { st, state:'ready', lane:1, t:0, hits:0, hitSet:{}, started:0, clean:0 };
  const road = h('div', { class:'ccroad' }, h('div', { class:'tilebg' }), h('div', { class:'lanes' }, [0, 1, 2].map(i => h('i', { class:'ln', 'data-l':i }))), h('div', { class:'ccobs' }), sp('van', 1, 'ccvan', 'van'));
  const bar = h('div', { class:'ccbar' }, h('div', { class:'cch' }, 'Hits: ', h('b', { class:'hitn' }, '0'), st.crossing ? ' of ' + st.tol + ' allowed' : ' · each hit adds wear'), h('div', { class:'ccsub' }, st.beat ? 'Keep to the beat.' : '', ' ', G.wx === 'rain' && st.slick ? 'Wet road: slippery.' : ''));
  const ready = h('div', { class:'ccready' }, stepTag(), h('h2', null, st.crossing ? C.R(G).cross.n : 'Close call'), h('p', null, 'Swipe, or tap the left or right side of the screen, to change lanes. Dodge what is in the road. A green glow marks the lane that is clear. ' + (st.crossing ? 'You can take ' + st.tol + ' hits. One more than that and the crossing beats you, but the next try is a little easier.' : 'One hit is free. Two or more cost wear, and a clean run pays something back.')), G.pass.indexOf('rabbit') >= 0 ? h('p', { class:'sm' }, 'The jackrabbit is on the dash. It will forgive one hit.') : null, U.btn('Go', () => startCC(cc, road, ready), { cls:'btn-r', a:'cc-go' }));
  const wrap = h('div', { class:'scr cc' }, bar, road, ready);
  wrap.__after = () => { const w = road.clientWidth; layoutCC(cc, road); };
  const lane = d => { if (cc.state !== 'run') return; const n = Math.max(0, Math.min(2, cc.lane + d)); if (n !== cc.lane) { cc.lane = n; sfx('swipe'); placeVan(cc, road); } };
  let sx = null; road.addEventListener('pointerdown', e => { sx = e.clientX; cc.sx = e.clientX; });
  road.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 28) lane(dx > 0 ? 1 : -1); else { const r = road.getBoundingClientRect(); lane(e.clientX < r.left + r.width / 2 ? -1 : 1); } });
  cc.lane_ = lane; cc.road = road;
  document.onkeydown = e => { if (e.key === 'ArrowLeft') lane(-1); if (e.key === 'ArrowRight') lane(1); };
  return wrap;
}
const LANEX = [.25, .5, .75];
U.ccRelayout = () => { const cc = U.cc; if (cc && cc.road && cc.state === 'run' && document.body.contains(cc.road)) layoutCC(cc, cc.road); };
function layoutCC(cc, road) { cc.W = road.clientWidth; cc.H = road.clientHeight; cc.vanY = cc.H * .8; cc.speed = cc.H * .62 * cc.st.speed; placeVan(cc, road); }
function placeVan(cc, road) { const v = road.querySelector('.ccvan'); v.style.left = LANEX[cc.lane] * 100 + '%'; road.querySelectorAll('.ln').forEach((e, i) => e.classList.toggle('me', i === cc.lane)); }
function startCC(cc, road, ready) {
  ready.remove(); layoutCC(cc, road); cc.state = 'run'; cc.started = performance.now(); const st = cc.st, obsHost = road.querySelector('.ccobs');
  cc.els = []; st.rows.forEach(row => { row.lanes.forEach((l, li) => { if (l) { const o = L.OBST[Object.keys(L.OBST)[row.sp[li]]]; const e = sp('obstacles', row.sp[li], 'ccob', ''); e.style.left = LANEX[li] * 100 + '%'; e.style.top = '-200px'; obsHost.append(e); cc.els.push({ e, row, li, done:false }); } }); });
  let last = performance.now();
  const tick = now => {
    if (cc.state !== 'run' || !document.body.contains(road)) return; const t = (now - cc.started) / 1000;
    road.querySelector('.tilebg').style.backgroundPositionY = (t * cc.speed) % (cc.W * 1.333) + 'px';
    cc.els.forEach(o => { const y = cc.vanY - (o.row.t - t) * cc.speed; o.e.style.transform = 'translate(-50%,' + y + 'px)'; if (!o.done && y > cc.vanY - cc.H * .075 && y < cc.vanY + cc.H * .075) { if (cc.lane === o.li) { o.done = true; o.hit = true; cc.hits++; sfx('thud'); o.e.classList.add('hit'); road.classList.add('shake'); setTimeout(() => road.classList.remove('shake'), 250); const hn = $('.hitn'); if (hn) hn.textContent = cc.hits; } } if (!o.done && y > cc.vanY + cc.H * .08) o.done = true; });
    let nxt = null; st.rows.forEach(r => { const dt = r.t - t; if (dt > -.2 && dt < 1.6 && (!nxt || dt < nxt.dt)) nxt = { dt, r }; }); const fl = nxt ? (nxt.r.free != null ? nxt.r.free : nxt.r.lanes.indexOf(0)) : -1; road.querySelectorAll('.ln').forEach((e, i) => e.classList.toggle('safe', i === fl && nxt && nxt.r.lanes.some(Boolean) && nxt.r.lanes[i] === 0));
    if (t > st.len) return endCC(cc); requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
U.stopLoops = () => { if (U.cc && U.cc.state === 'run') U.cc.state = 'stopped'; document.onkeydown = null; };
function endCC(cc) {
  cc.state = 'done'; const G = S.G, st = cc.st; const f = C.ccFinish(G, st, cc.hits, st.crossing); const fail = f.fail; sfx(fail ? 'lose' : 'win');
  const msg = cc.hits === 0 ? 'A clean run. Not a scratch on her.' : fail ? cc.hits + ' hits is more than the ' + st.tol + ' this crossing allows. Marigold limps to the shoulder.' : cc.hits + (cc.hits === 1 ? ' hit' : ' hits') + '. Marigold rattles, but she holds.';
  U.sheet(fail ? 'Not this time' : 'Through', h('div', null, h('p', null, msg), f.lines.map(t => h('p', null, t)), f.fx && f.fx.length ? U.gains(f.fx.filter(o => o.k !== 'full')) : null, h('p', { class:'sm' }, cc.hits > 0 ? (cc.hits === 1 ? 'A single scrape leaves no mark.' : 'Wear +2') + (cc.hits > 2 ? ', Spirit −1' : '') : '')), { sticky:true, actions:[U.btn('Continue', () => { U.closeSheet(); if (fail) U.encFail('closecall'); else if (G.wear >= 10) U.breakdown(() => U.encDone()); else U.encDone(); }, { cls:'btn-r', a:'enc-ok' })] });
}
// test hook: finish the close call as a player of the given skill
U.ccAuto = skill => { const cc = U.cc; if (!cc || cc.state === 'done') return; cc.state = 'done'; cc.hits = C.ccSim(S.G, cc.st, skill); endCC(cc); };
})(LRT);
