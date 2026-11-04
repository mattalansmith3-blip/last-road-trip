// The Last Road Trip — UI layer (DOM). All art is generated images; code only lays out and writes text.
(function(){
var L = LRT, app = document.getElementById('app');
var s = null, ui = { ov:null, sel:null, tgt:null, items:false, fx:null, logSeen:0, revealed:{}, hint:'', anim:false };
var meta = loadMeta();
function A(n){ return 'assets/'+n+'.webp'; }
function esc(t){ return String(t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function land(){ return innerWidth > innerHeight; }
function loadMeta(){ try { return Object.assign({runs:0,wins:0,best:0,ach:{},mailed:null,postcards:[],talks:0,scrapped:0,velvet:null,bestTime:0}, JSON.parse(localStorage.getItem('lrt_meta')||'{}')); } catch(e){ return {runs:0,wins:0,best:0,ach:{},mailed:null,postcards:[],talks:0,scrapped:0}; } }
function saveMeta(){ localStorage.setItem('lrt_meta', JSON.stringify(meta)); }
function save(){ if (!s) return; if (s.screen==='end' || s.screen==='finale') localStorage.removeItem('lrt_save'); else localStorage.setItem('lrt_save', JSON.stringify(s)); }
function loadSave(){ try { var t=localStorage.getItem('lrt_save'); return t?JSON.parse(t):null; } catch(e){ return null; } }
window.__lrt = { get s(){ return s; }, L:L, get ui(){ return ui; }, render:function(){ render(); } };

// ---------- toasts / achievements ----------
var toastBox = document.getElementById('toasts');
function toast(t,k){ var lc=toastBox.lastChild; if (lc && lc.textContent===t) return; var d=document.createElement('div'); d.className='toast '+(k||''); d.textContent=t; toastBox.appendChild(d); while (toastBox.children.length>2) toastBox.removeChild(toastBox.firstChild); setTimeout(function(){ if (d.parentNode) d.parentNode.removeChild(d); }, 4200); }
function flushLog(){ if (!s) return; s.log.forEach(function(m){ if (m.id>ui.logSeen){ ui.logSeen=m.id; if (s.screen!=='fight' || m.k!=='info') toast(m.t,m.k); } }); }
function checkAch(){ if (!s) return; var F=s.flags, got=[];
  var cond = { fl_done:F.fl_done, gulf_done:F.gulf_done, tx_done:F.tx_done, mojave_done:F.mojave_done, sunspire:F.sunspire, legend:F.legend, dash5:F.dash5, combo:F.combo, goodboy:F.goodboy, scrapper:(meta.scrapped+s.stats.scrapped)>=25, pacifist:(meta.talks+s.stats.talks)>=3, first_trip: s.screen==='end'||s.screen==='finale' };
  L.ACH.forEach(function(a){ if (cond[a.id] && !meta.ach[a.id]){ meta.ach[a.id]=Date.now(); got.push(a); } });
  if (got.length){ saveMeta(); got.forEach(function(a){ toast('Achievement unlocked: '+a.n+' - '+a.d,'ach'); AU.sfx('sv'); }); }
}
function finishRun(){ if (!s || s.metaDone) return; s.metaDone=true; meta.runs++; meta.talks+=s.stats.talks; meta.scrapped+=s.stats.scrapped;
  var won = s.screen==='finale'; if (won) meta.wins++;
  meta.best = Math.max(meta.best, Math.round(L.progress(s)*100));
  if (s.mailed){ meta.mailed = s.mailed; }
  if (s.flags.velvet) meta.velvet = s.flags.velvet;
  meta.postcards.unshift({ d:new Date().toLocaleDateString(), won:won, reg:L.REGIONS[Math.min(s.region,L.REGIONS.length-1)].short, day:s.day, kills:s.stats.kills, dash:s.dash.slice(0), why:s.ended&&s.ended.why });
  meta.postcards = meta.postcards.slice(0,12); saveMeta(); checkAch(); }

// ---------- actions ----------
function act(fn){ return function(d){ var r = fn(d); after(); return r; }; }
function after(){ if (!s) { render(); return; } if ((s.screen==='end'||s.screen==='finale') && !s.metaDone) finishRun(); checkAch(); save(); render(); flushLog(); }
function newGame(daily){ ui.fin=0; var gift = meta.mailed ? meta.mailed : null; meta.mailed=null; saveMeta();
  var seed = daily ? (function(){ var d=new Date(); return (d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate())*7919; })() : 0;
  s = L.newRun({ seed:seed, daily:daily, gift:gift }); ui.logSeen = 0; ui.ov=null; ui.sel=null;
  if (gift) L.say(s,'The Mailman left a package on your seat: your own '+L.iname(gift)+' from your last trip. Past you is the best.','good');
  if (meta.velvet==='rival') L.say(s,'Somewhere, Chez Velvet is livestreaming about you. She remembers the limo.','story');
  after(); }
var H = {
  newgame: function(){ AU.sfx('tap'); if (loadSave() && !confirm('Start a new trip? Your current trip will be lost.')) return; newGame(false); },
  daily: function(){ newGame(true); },
  cont: function(){ s = loadSave(); if (!s) return; ui.logSeen = s.logId; after(); },
  home: function(){ save(); s=null; ui.ov=null; render(); },
  mute: function(){ AU.setMute(!AU.muted); render(); },
  ov: function(d){ AU.sfx('tap'); ui.ov = d.v || null; ui.pk=null; render(); },
  // map
  sel: function(d){ var id=+d.i; if (!L.nextNodes(s).some(function(o){ return o.node.id===id; })) return; AU.sfx('tap'); ui.sel = ui.sel===id?null:id; render(); },
  drive: function(){ if (ui.sel===null||ui.anim) return; var id=ui.sel; ui.anim=true; AU.sfx('drive');
    var tok = app.querySelector('.vantok'), nd = app.querySelector('.node[data-i="'+id+'"]');
    if (tok && nd){ tok.style.left = nd.style.left; tok.style.top = nd.style.top; }
    setTimeout(function(){ ui.anim=false; ui.sel=null; ui.revealed={}; ui.hint=''; L.travel(s,id); if (s.screen==='fight') enterFight(); after(); }, tok?950:10); },
  // stops
  choose: act(function(d){ AU.sfx('tap'); L.choose(s,+d.i); }),
  proceed: function(){ L.proceed(s); if (s.screen==='fight') enterFight(); after(); },
  again: function(){ L.loot.again(s); if (s.screen==='fight') enterFight(); ui.revealed={}; after(); },
  leavestop: act(function(){ L.toMap(s); }),
  // loot
  sniff: function(){ if (L.loot.sniff(s)){ AU.sfx('bark'); var c=L.loot.cur(s); var it=c.items[c.sniff-1]; ui.hint = 'Biscuit smells: '+(it.r>=3?'something AMAZING (legendary!)':it.r>=2?'something fancy (rare)':it.r>=1?'something decent':'mostly junk, honestly'); } after(); },
  open: function(d){ var ok=L.loot.open(s,d.how); if (!ok){ toast(d.how==='pick'?'No lockpicks!':'Not enough parts to force it.','warn'); return; } AU.sfx('open'); var c=L.loot.cur(s); ui.hint=''; var w=app.querySelector('.ctwrap'); if (w) w.classList.add('shake');
    c.items.forEach(function(it,i){ setTimeout(function(){ AU.sfx('r'+it.r); }, 450+i*330); }); setTimeout(after, 380); },
  take: function(d){ var c=L.loot.cur(s); var it=c.items[+d.i]; if (!L.loot.take(s,+d.i)){ toast('Your pack is full! Scrap or drop something first.','warn'); return; } AU.sfx(L.ITEMS[it.k].slot==='res'?'coin':'tap'); after(); },
  scrap: function(d){ if (L.loot.scrap(s,+d.i)) AU.sfx('scrap'); after(); },
  takeall: function(){ var c=L.loot.cur(s), before=c.taken.filter(Boolean).length; L.loot.takeAll(s); if (c.items.some(function(x,i){return !c.taken[i];})) toast('Pack is full - scrap the rest or make room.','warn'); AU.sfx('coin'); after(); },
  scrapjunk: function(){ L.loot.scrapJunk(s); AU.sfx('scrap'); after(); },
  nextc: function(){ ui.hint=''; L.loot.next(s); after(); },
  // pack
  pk: function(d){ ui.pk = (ui.pk===d.i)?null:d.i; render(); },
  equip: function(d){ if (L.pack.equip(s,+d.i)) AU.sfx('up'); ui.pk=null; after(); },
  use: function(d){ var it=s.pack[+d.i]; if (L.pack.use(s,+d.i)){ AU.sfx(L.ITEMS[it.k].toy?'bark':'heal'); } else toast('That would not do anything right now.','warn'); ui.pk=null; after(); },
  scrapp: function(d){ L.pack.scrap(s,+d.i); AU.sfx('scrap'); ui.pk=null; after(); },
  scrapjunkp: function(){ var n=L.pack.scrapJunk(s); toast(n?('Scrapped '+n+' junk items into parts.'):'Nothing junky to scrap.', n?'good':''); AU.sfx('scrap'); after(); },
  treat: function(){ if (L.pack.treat(s)) AU.sfx('bark'); else toast('No treats left!','warn'); after(); },
  // garage
  upg: function(d){ if (L.garage.upgrade(s,d.m)) AU.sfx('up'); else toast('Not enough parts or batteries.','warn'); after(); },
  repair: function(){ if (L.garage.repair(s)) AU.sfx('up'); else toast('Nothing to fix, or no parts.','warn'); after(); },
  // dash
  drop: function(d){ L.dash.drop(s,d.k); AU.sfx('scrap'); after(); },
  takeoffer: function(d){ if (!L.takeOffer(s,d.k)){ toast('Dashboard is full - toss a souvenir to make room.','warn'); ui.swap=true; render(); return; } AU.sfx(d.k?'sv':'tap'); ui.swap=false; after(); },
  // trader
  buy: function(d){ if (L.trade.buy(s,+d.i)) AU.sfx('coin'); else toast('Not enough batteries (or your pack is full).','warn'); after(); },
  svc: function(d){ if (L.trade.svc(s,+d.i)) AU.sfx('coin'); else toast('Not enough batteries.','warn'); after(); },
  buysv: function(){ if (L.trade.sv(s)) AU.sfx('sv'); else toast(s.dash.length>=L.dashCap(s)?'Dashboard is full.':'Not enough batteries.','warn'); after(); },
  sell: function(d){ L.trade.sell(s,+d.i); AU.sfx('coin'); after(); },
  selljunk: function(){ var r=L.trade.sellJunk(s); toast(r.n?('Sold '+r.n+' items for '+r.b+' batteries.'):'No junk to sell.', r.n?'good':''); AU.sfx('coin'); after(); },
  leavetrade: act(function(){ L.trade.leave(s); }),
  // fight
  tgt: function(d){ ui.tgt=+d.i; AU.sfx('tap'); render(); },
  fa: function(d){ fightDo(function(){ return L.heroAct(s, d.a, (d.a==='attack'||d.a==='power'||d.a==='shove'||d.a==='item')?ui.tgt:null, d.k); }, d.a); },
  fd: function(d){ fightDo(function(){ return L.dogAct(s, d.a, ui.tgt); }, 'dog'); },
  items: function(){ ui.items=!ui.items; render(); },
  loot: function(){ L.afterFight(s); ui.revealed={}; after(); },
  region: function(){ L.nextRegion(s); AU.music('road'); after(); },
};
function enterFight(){ ui.tgt=null; ui.items=false; var f=s.fight; if (f){ var a=L.alive(f); ui.tgt = a.length? a[0].id : null; } AU.music('fight'); }
function fightDo(fn, kind){
  var f=s.fight; if (!f || f.over) return;
  if ((kind==='attack'||kind==='power') && (ui.tgt===null || !L.canHit(s,f.foes[ui.tgt]))){ var c=L.alive(f).filter(function(e){ return L.canHit(s,e); })[0]; if (c) ui.tgt=c.id; }
  var ok = fn(); if (!ok){ toast(kind==='shove'?'Shove needs a target right next to you.':kind==='dog'?'Biscuit can\'t do that right now.':kind==='talk'?'Only works on humans, once per fight.':'Can\'t do that - pick a target in range.','warn'); return; }
  ui.items=false; ui.fx = (s.fight ? s.fight.fx.slice() : []); var sounds={};
  ui.fx.forEach(function(x){ sounds[x.t==='hit'?(x.src==='crit'?'crit':'hit'):x.t==='miss'?'miss':x.t==='dmghero'?'hurt':x.t==='ko'?'ko':x.t==='bark'?'bark':x.t==='howl'?'howl':x.t==='heal'?'heal':''] = 1; });
  if (kind==='dog' && s.fight && s.fight.fx.some(function(x){return x.t==='dogbite';})) sounds.bark=1;
  Object.keys(sounds).forEach(function(k,i){ if (k) setTimeout(function(){ AU.sfx(k); }, i*90); });
  if (s.fight && s.fight.over==='won'){ setTimeout(function(){ AU.sfx('win'); }, 300); }
  if (s.screen==='end'){ AU.sfx('lose'); }
  if (s.fight && L.alive(s.fight).length && (ui.tgt===null || s.fight.foes[ui.tgt].gone)) { var a=L.alive(s.fight); ui.tgt=a[0].id; }
  after();
}

// ---------- common pieces ----------
function hud(){
  var lo = function(c){ return c?' low':''; };
  return '<div class="hud">'+
    '<div class="hpbar"><div class="lb"><span>You</span><span>'+Math.max(0,s.hp)+'/'+L.hpMax(s)+'</span></div><div class="bar"><i style="width:'+Math.max(0,100*s.hp/L.hpMax(s))+'%"></i></div>'+
    '<div class="lb"><span>Marigold</span><span>'+s.van.hp+'/'+L.vanMax(s)+'</span></div><div class="bar van"><i style="width:'+Math.max(0,100*s.van.hp/L.vanMax(s))+'%"></i></div></div>'+
    '<div class="sp"></div>'+
    '<div class="st'+lo(s.res.fuel<3)+'"><img src="'+A('it_fuel')+'" alt="">'+s.res.fuel+'</div>'+
    '<div class="st'+lo(s.res.food<2)+'"><img src="'+A('it_beans')+'" alt="">'+s.res.food+'</div>'+
    '<div class="st"><img src="'+A('it_parts')+'" alt="">'+s.res.parts+'</div>'+
    '<div class="st"><img src="'+A('it_battery')+'" alt="">'+s.res.batteries+'</div>'+
    '<div class="st"><img src="'+A(s.dog.hurt>0?'dog_bow':'dog_sit')+'" alt="" style="'+(s.dog.hurt>0?'filter:grayscale(1)':'')+'">'+s.dog.bond+'</div>'+
  '</div>';
}
function foot(){
  var up = Object.keys(L.MODULES).some(function(m){ var c=L.garage.cost(s,m); return c && s.res.parts>=c.parts && s.res.batteries>=c.batteries; });
  var better = s.pack.some(function(it){ var b=L.ITEMS[it.k]; return L.SLOTS.indexOf(b.slot)>=0 && (!s.gear[b.slot] || L.gearScore(it)>L.gearScore(s.gear[b.slot])); });
  return '<div class="foot">'+
    '<button class="fb" data-a="ov" data-v="pack"><img src="'+A('it_denim')+'" alt="">Pack '+s.pack.length+'/'+L.packCap(s)+(better?'<span class="badge">new</span>':'')+'</button>'+
    '<button class="fb" data-a="ov" data-v="garage"><img src="'+A('van_side')+'" alt="">Garage'+(up?'<span class="badge">up</span>':'')+'</button>'+
    '<button class="fb" data-a="ov" data-v="dash"><img src="'+A('sv_hula')+'" alt="">Dashboard '+s.dash.length+'/'+L.dashCap(s)+'</button>'+
    '<button class="fb" data-a="ov" data-v="dog"><img src="'+A('dog_sit')+'" alt="">Biscuit</button>'+
    '<button class="fb" data-a="ov" data-v="menu"><img src="'+A('sv_sun')+'" alt="">Menu</button>'+
  '</div>';
}
function statLine(it){ var b=L.ITEMS[it.k], st=L.istat(it), p=[];
  if (b.slot==='weapon'){ p.push(st.dmg+' dmg'); p.push(Math.round(st.acc*100)+'% hit'); p.push(st.range>1?('range '+st.range):'melee'); if (st.stun) p.push(Math.round(st.stun*100)+'% stun'); if (st.crit) p.push('+'+Math.round(st.crit*100)+'% crit'); if (st.beast) p.push('+'+st.beast+' vs animals'); if (st.human) p.push('+'+st.human+' vs humans'); if (st.leech) p.push('heal on KO'); if (b.splash) p.push('splash'); if (b.loud) p.push('loud'); }
  else if (L.SLOTS.indexOf(b.slot)>=0){ if (st.armor) p.push('+'+st.armor+' armor'); if (st.hp) p.push('+'+st.hp+' max HP'); if (st.mdmg) p.push('+'+st.mdmg+' melee dmg'); if (st.flee) p.push('+'+Math.round(st.flee*100)+'% flee'); if (b.nocrit) p.push('no crits on you'); }
  else if (b.slot==='res'){ return '+'+(b.amt + ((it.k==='parts'||it.k==='battery')?s.region:0))+' '+b.res; }
  else return b.d||'';
  if (it.a>=0 && L.SLOTS.indexOf(b.slot)>=0 && b.slot!=='weapon') p.push(L.AFFIX[it.a].d);
  return p.join(' · ');
}
function isUp(it){ var b=L.ITEMS[it.k]; if (L.SLOTS.indexOf(b.slot)<0) return false; var cur=s.gear[b.slot]; return !cur || L.gearScore(it)>L.gearScore(cur); }
function rname(it){ var b=L.ITEMS[it.k]; if (b.slot==='res') return 'Supplies'; if (b.slot==='junk') return 'Junk'; if (b.slot==='use') return 'Consumable'; return L.RARITY[it.r].name+' '+b.slot; }
function itemCard(it, acts, extra){ var b=L.ITEMS[it.k]; var r = (b.slot==='res'||b.slot==='use'||b.slot==='junk')?(b.slot==='junk'?0:1):it.r;
  return '<div class="it r'+r+' '+(extra||'')+'">'+(isUp(it)?'<span class="up">UPGRADE</span>':'')+'<img class="pic" src="'+A(b.img)+'" alt=""><div style="min-width:0;flex:1"><div class="rr">'+rname(it)+'</div><div class="nm">'+esc(L.iname(it))+'</div><div class="sl">'+esc(statLine(it))+'</div>'+(acts?'<div class="acts">'+acts+'</div>':'')+'</div></div>'; }

// ---------- screens ----------
function render(){
  if (!s){ app.innerHTML = titleScreen(); AU.music('calm'); return; }
  var h='';
  switch(s.screen){
    case 'map': h=mapScreen(); AU.music(s.region===0?'road':'road'); break;
    case 'stop': h=stopScreen(); AU.music('calm'); break;
    case 'loot': h=lootScreen(); break;
    case 'fight': h=fightScreen(); AU.music('fight'); break;
    case 'trader': h=traderScreen(); AU.music('calm'); break;
    case 'region': h=regionScreen(); AU.music('win'); break;
    case 'finale': h=finaleScreen(); AU.music('win'); break;
    case 'end': h=endScreen(); AU.music('calm'); break;
  }
  if (ui.ov) h += overlay();
  if (s.offer) h += offerModal();
  app.innerHTML = h;
  var sk=s.screen+'|'+(ui.ov||''); if (ui.lastSk && ui.lastSk!==sk){ while (toastBox.firstChild) toastBox.removeChild(toastBox.firstChild); } ui.lastSk=sk;
  if (s.screen==='map') layoutMap();
  if (s.screen==='fight') playFx();
  if (s.screen==='finale') confetti();
}
function titleScreen(){
  var sv = loadSave(); var sub = meta.runs ? ('Trips: '+meta.runs+' · Made it to Sunspire: '+meta.wins+' · Best: '+meta.best+'% of the way') : 'Key West to Sunspire Park. One van. One very good dog.';
  return '<div class="scr title"><img class="bg" src="'+A('key_art')+'" alt=""><div class="logo"><span>The</span>Last Road Trip</div>'+
  '<div class="menu">'+(sv?'<button class="btn teal" data-a="cont">Continue trip<small>'+esc(L.REGIONS[sv.region].short)+' · Day '+sv.day+'</small></button>':'')+
  '<button class="btn" data-a="newgame">'+(meta.runs?'New trip':'Start the trip')+(meta.mailed?'<small>A package is waiting for you</small>':'')+'</button>'+
  '<button class="btn teal sm" data-a="daily">Daily Route<small>Same map for everyone today</small></button>'+
  '<div style="display:flex;gap:8px"><button class="btn sm teal" style="flex:1" data-a="ovt" data-v="how">How to play</button><button class="btn sm teal" style="flex:1" data-a="ovt" data-v="post">Postcards</button><button class="btn sm teal" style="flex:1" data-a="mute">'+(AU.muted?'Sound off':'Sound on')+'</button></div>'+
  '<div class="meta">'+esc(sub)+'</div></div>'+(ui.tov?titleOv():'')+'</div>';
}
function titleOv(){
  var body='';
  if (ui.tov==='how') body = howTo();
  else { body = '<div class="sec">Achievements</div>'+L.ACH.map(function(a){ return '<div class="combo'+(meta.ach[a.id]?'':' no')+'">'+(meta.ach[a.id]?'★ ':'☆ ')+esc(a.n)+' <span class="muted">- '+esc(a.d)+'</span></div>'; }).join('')+
    '<div class="sec">Postcards from past trips</div>'+(meta.postcards.length? meta.postcards.map(function(p){ return '<div class="pc" style="margin-bottom:8px"><b>'+(p.won?'Made it to Sunspire!':'Trip ended in '+esc(p.reg))+'</b><br><span class="muted">'+esc(p.d)+' · Day '+p.day+' · '+p.kills+' critters & creeps bested</span>'+(p.dash&&p.dash.length?'<div style="display:flex;gap:4px;margin-top:4px">'+p.dash.map(function(k){ return '<img src="'+A('sv_'+k)+'" style="height:28px">'; }).join('')+'</div>':'')+'</div>'; }).join('') : '<div class="muted">No postcards yet. Go make some memories.</div>'); }
  return '<div class="ov"><div class="ovin"><div class="ovhd"><div class="h">'+(ui.tov==='how'?'How to play':'Postcards')+'</div><button class="x" data-a="ovt" data-v="">Close</button></div><div class="ovbody">'+body+'</div></div></div>';
}
function howTo(){ return '<div class="txt">'+
  '<p><b>Drive west.</b> Tap a glowing stop on the map, then Drive. Every drive burns fuel and food.</p>'+
  '<p><b>Take your time - it costs you.</b> Every drive burns fuel and food, and Marigold wears out (more the further west you go). Extra searches, camping and waiting eat supplies. Enemies get tougher each region.</p>'+
  '<p><b>Loot.</b> Crates, coolers, lockboxes and safes. Let Biscuit sniff first - he can smell what\'s good. Take what you need and scrap the rest into parts.</p>'+
  '<p><b>Fights are turn-based.</b> Enemies show what they\'ll do next. A boar pawing the dirt will CHARGE. A rattling snake will bite. Read the tells - shove, brace, or let Biscuit bark them off.</p>'+
  '<p><b>Upgrade Marigold</b> in the Garage with parts and batteries. <b>Souvenirs</b> on the Dashboard give perks, and some pairs combo.</p>'+
  '<p><b>Biscuit</b> gets braver as your bond grows. At bond 8 he\'ll save your life once per fight. Treats help. So does being nice.</p>'+
  '<p>Reach the bridge at the end of each region, beat what\'s waiting, and keep going until you see the lights of Sunspire.</p></div>'; }
H.ovt = function(d){ ui.tov = d.v||null; render(); };

function nodePos(n){ if (land()) return { x: 7 + n.x*86, y: 14 + n.y*74 }; return { x: 12 + n.y*76, y: 92 - n.x*82 }; }
function mapScreen(){
  var R=L.REGIONS[s.region], live=L.nextNodes(s), liveIds=live.map(function(o){return o.node.id;});
  var h='<div class="scr">'+hud()+'<div class="mapwrap" id="mw"><img class="bg" src="'+A(R.map)+'" alt="">';
  h+='<div class="regtag">'+esc(R.short)+' · Day '+s.day+'<small>Stop '+s.col+' of '+(L.COLS-1)+' · region '+(s.region+1)+' of '+L.REGIONS.length+'</small></div>';
  s.map.edges.forEach(function(e,i){ var past = s.map.nodes[e.a].done && s.map.nodes[e.b].done; h+='<div class="road'+(e.a===s.node?' live':'')+(e.rough?' rough':'')+(past?' past':'')+'" data-e="'+i+'"><img src="'+A('ui_road')+'" alt=""></div>'; });
  
  s.map.nodes.forEach(function(n){ var p=nodePos(n), isLive=liveIds.indexOf(n.id)>=0, ic = (n.seen? L.NODE[n.type].icon : 'nd_mystery');
    var rough = isLive && live.filter(function(o){return o.node.id===n.id;})[0].rough;
    h+='<button class="node'+(n.done?' done':'')+(isLive?' live':'')+(!isLive&&!n.done?' far':'')+(ui.sel===n.id?' sel':'')+'" data-a="sel" data-i="'+n.id+'" style="left:'+p.x+'%;top:'+p.y+'%"><img src="'+A(ic)+'" alt="">'+(isLive?'<span class="nl">'+esc(n.seen?L.NODE[n.type].n:'???')+'</span>':'')+(rough?'<span class="rt">rough</span>':'')+'</button>'; });
  var cp=nodePos(s.map.nodes[s.node]); h+='<div class="vantok" style="left:'+cp.x+'%;top:'+cp.y+'%"><img src="'+A('van_34')+'" alt=""></div>';
  if (ui.sel!==null){ var n=s.map.nodes[ui.sel], o=live.filter(function(o){return o.node.id===ui.sel;})[0]; var fc=L.fuelCost(s)+(o.rough&&s.van.mods.tires<3?1:0); var eat=1+(s.hiker?1:0);
    var desc = { scavenge:'Search an empty house. Loot! Maybe critters.', gas:'Siphon fuel and raid the snack shop.', diner:'Rest, eat, maybe a jukebox.', trader:'Dot\'s traveling shop. Buy, sell, gossip.', danger:'Trouble ahead - a fight, but better loot.', mystery:'Who knows? Could be great. Could be a trap.', attraction:'A weird roadside attraction. Souvenirs!', camp:'Rest and heal. Costs a night of supplies.', mail:'The Mailman. He always delivers.', goal:'The way out of '+L.REGIONS[s.region].short+'. Something big guards it.' }[n.seen?n.type:'mystery'];
    var heatWarn='';
    h+='<div class="sheet paper"><img class="ico" src="'+A(n.seen?L.NODE[n.type].icon:'nd_mystery')+'" alt=""><div class="card-t">'+esc(n.seen?L.NODE[n.type].n:'Mystery stop')+'</div><div class="txt" style="font-size:14px">'+esc(desc)+'</div><div class="muted" style="clear:both;padding-top:4px">Costs '+fc+' fuel'+(o.rough?' (rough road)':'')+', '+eat+' food</div>'+heatWarn+
      '<div class="row"><button class="btn teal" data-a="sel" data-i="'+n.id+'">Not yet</button><button class="btn" data-a="drive">Drive!</button></div></div>'; }
  else if (s.col===0 && s.region===0 && s.day===1) h+='<div class="sheet paper" style="pointer-events:none"><div class="card-t">Key West, Day 1</div><div class="txt" style="font-size:14px">Tap a glowing stop to plan your drive. Sunspire is far west - get to the end of each map.</div></div>';
  return h+'</div>'+foot()+'</div>';
}
function layoutMap(){
  var mw=document.getElementById('mw'); if(!mw) return; var W=mw.clientWidth, Hh=mw.clientHeight;
  // object-fit cover for square map: fine. roads
  s.map.edges.forEach(function(e,i){ var a=nodePos(s.map.nodes[e.a]), b=nodePos(s.map.nodes[e.b]); var ax=a.x*W/100, ay=a.y*Hh/100, bx=b.x*W/100, by=b.y*Hh/100; var len=Math.hypot(bx-ax,by-ay), ang=Math.atan2(by-ay,bx-ax)*180/Math.PI; var el=mw.querySelector('[data-e="'+i+'"]'); if(el){ el.style.left=ax+'px'; el.style.top=(ay-7)+'px'; el.style.width=len+'px'; el.style.transform='rotate('+ang+'deg)'; } });
}
function stopScreen(){
  var st=s.stop, ev=L.EVENTS.filter(function(e){return e.id===st.ev;})[0]; var R=L.REGIONS[s.region];
  var bg = st.bg || (st.type==='scavenge'? (s.region===0?'stop_house':'stop_cottage') : (st.type==='mystery'||st.type==='event')? R.fight : st.type==='diner'?'stop_diner': st.type==='camp'?'stop_camp': st.type==='attraction'?'stop_attraction': R.stops[0]);
  var h='<div class="scr">'+hud()+'<div class="stage"><img class="bg" src="'+A(bg)+'" alt="">';
  if (ev && ev.who) h+='<img class="who" src="'+A(ev.who)+'" alt="">';
  else if (st.ev==='juniper') h+='<img class="who" src="'+A('npc_hiker')+'" alt="">';
  h+='<div class="dock"><div class="paper">';
  if (st.again){
    h+='<div class="card-t">'+esc(L.NODE[st.type]?L.NODE[st.type].n:'')+'</div><div class="txt">There might be more in here. Each search takes time (eats supplies) and gets riskier.</div><div class="choices"><button class="btn" data-a="again">Search another room<small>eats supplies · risky</small></button><button class="btn teal" data-a="leavestop">Back to the road</button></div>';
  } else if (!st.result){
    h+='<div class="card-t">'+esc((st.type==='event'||st.type==='mystery')?'Something on the road':(L.NODE[st.type]?L.NODE[st.type].n:''))+'</div><div class="txt">'+esc(st.text)+'</div><div class="choices">';
    ev.choices(s).forEach(function(c,i){ var ok=!c.req||c.req(s); h+='<button class="btn'+(i%2?' teal':'')+(ok?'':' off')+'" data-a="choose" data-i="'+i+'" '+(ok?'':'disabled')+'><span class="col" style="align-items:flex-start">'+esc(c.t)+(ok?'':'<span class="why">Can\'t right now</span>')+'</span></button>'; });
    h+='</div>';
  } else {
    var nx=st.next; h+='<div class="txt">'+esc(st.result)+'</div><div class="choices"><button class="btn" data-a="proceed">'+(nx&&nx.fight?'Fight!':nx&&nx.loot?'Open it up':nx&&nx.trader?'Let\'s trade':'Continue')+'</button></div>';
  }
  return h+'</div></div></div>'+foot()+'</div>';
}
function lootScreen(){
  var lt=s.loot, c=L.loot.cur(s); var R=L.REGIONS[s.region];
  var bg = (s.stop && s.stop.bg) || R.fight;
  var CTN = L.CT[c.type].n;
  var h='<div class="scr">'+hud()+'<div class="stage dim"><img class="bg" src="'+A(bg)+'" alt="" style="filter:brightness(.6) blur(2px)"><div class="loot"><div class="hd">'+esc(CTN)+(lt.cs.length>1?' · '+(lt.cur+1)+' of '+lt.cs.length:'')+'</div>';
  var maxR = Math.max.apply(null, c.items.map(function(it){ var b=L.ITEMS[it.k]; return L.SLOTS.indexOf(b.slot)>=0?it.r:0; }).concat([0]));
  h+='<div class="lcol" style="align-items:center;display:flex;flex-direction:column;'+(land()?'flex:0 0 auto;width:min(30vw,230px)':'width:100%')+'"><div class="ctwrap">'+(c.open?'<img class="burst r'+maxR+'" src="'+A('fx_burst')+'" alt="">':'')+'<img class="ct" src="'+A('ct_'+c.type+(c.open?'_open':''))+'" alt=""></div>';
  h+='<div class="hint">'+esc(ui.hint|| (c.lock&&!c.open ? (c.lock===2?'A heavy safe. Needs a lockpick or a LOT of prying.':'Locked. Pick it or pry it.') : ''))+'</div>';
  if (!c.open){
    var canSniff = s.dog.hurt===0 && c.sniff < (s.dog.bond>=3?2:1);
    h+='<div class="lootbar">'+(canSniff?'<button class="btn teal" data-a="sniff">Biscuit, sniff!<small>'+(s.dog.bond>=3?'2 sniffs':'1 sniff')+'</small></button>':'');
    if (c.lock){ h+='<button class="btn'+(L.countUse(s,'lockpick')?'':' off')+'" data-a="open" data-how="pick">Lockpick<small>have '+L.countUse(s,'lockpick')+'</small></button><button class="btn red" data-a="open" data-how="force">Pry it open<small>'+(c.lock===2?4:2)+' parts · might break something</small></button>'; }
    else h+='<button class="btn" data-a="open">Open it!</button>';
    h+='<button class="btn teal sm" data-a="nextc">Leave it</button></div></div>';
  } else {
    h+='</div><div class="lcol" style="width:100%;display:flex;flex-direction:column;min-height:0;flex:1"><div class="items">';
    var key = s.uid+'_'+lt.cur; var fresh = !ui.revealed[key]; ui.revealed[key]=1;
    c.items.forEach(function(it,i){ var tk=c.taken[i]; var b=L.ITEMS[it.k]; var acts = tk ? '' : ('<button class="btn xs" data-a="take" data-i="'+i+'">'+(b.slot==='res'?'Grab':'Take')+'</button>'+(b.slot!=='res'?'<button class="btn xs teal" data-a="scrap" data-i="'+i+'">Scrap +'+L.iscrap(it)+'</button>':''));
      var card = itemCard(it, acts, tk?'taken':''); if (tk) card = card.replace('</div></div>$','')+'';
      h+= fresh ? card.replace('class="it ', 'style="animation-delay:'+(0.25+i*0.33)+'s" class="it ') : card.replace('class="it ','style="animation:none" class="it '); });
    if (!c.items.length) h+='<div class="hint">Empty! Just a sad little cobweb.</div>';
    var left = c.items.some(function(x,i){ return !c.taken[i]; });
    h+='</div><div class="lootbar">'+(left?'<button class="btn" data-a="takeall">Take all</button><button class="btn teal" data-a="scrapjunk">Scrap junk</button>':'')+'<button class="btn '+(left?'red':'')+'" data-a="nextc">'+(lt.cur<lt.cs.length-1?'Next':'Done')+(left?'<small>leave the rest</small>':'')+'</button></div><div class="muted" style="color:#fff;text-align:center">Pack '+s.pack.length+'/'+L.packCap(s)+'</div></div>';
  }
  return h+'</div></div></div>';
}
var INT_CLASS = { charge:'bad', roll:'bad', bite:'bad', throw:'bad', steal:'bad', attack:'warn', sting:'warn', paw:'warn', jaws:'warn', rattle:'warn', light:'warn', howl:'warn', distract:'warn', stunned:'ok', dazzled:'ok', shoved:'ok', move:'', submerge:'' };
function intentText(e){ var I=e.intent||{t:'move'}; var t = I.t==='shoved'?'Knocked back!':L.INTENT[I.t]||I.t; if (I.dmg) t += ' ('+Math.max(1,I.dmg-L.armor(s))+')'; if (I.t==='move') t='Advancing'+(e.dist>1?' · '+e.dist+' away':''); return t; }
function foePos(e, n){ var x = [22,50,78][e.lane]; var t = (5-e.dist)/4; var y = land()? (40 + t*52) : (36 + t*46); var hgt = (land()?24:15) + t*(land()?24:16); var d=L.ENEMIES[e.k]; hgt *= (0.62 + d.h*0.75); return {x:x,y:y,h:hgt}; }
function fightScreen(){
  var f=s.fight, R=L.REGIONS[s.region], w=L.weapon(s);
  var h='<div class="scr fight">'+hud()+'<div class="main"><div class="arena" id="arena"><img class="bg" src="'+A(R.fight)+'" alt="">';
  h+='<div class="turn">'+(f.name?esc(f.name)+' · ':'')+'Turn '+f.turn+'</div>';
  f.foes.forEach(function(e){ if (e.gone && !(ui.fx||[]).some(function(x){return (x.t==='ko'||x.t==='leave')&&x.id===e.id;})) return; var p=foePos(e), d=L.ENEMIES[e.k]; var ko=e.gone; var can=L.canHit(s,e);
    h+='<button class="foe'+(ui.tgt===e.id&&!ko?' sel':'')+(ko?' ko':'')+(can?'':' cannot')+'" data-a="tgt" data-i="'+e.id+'" data-f="'+e.id+'" style="left:'+p.x+'%;top:'+p.y+'%;height:'+p.h+'%"><span class="ring"></span><img class="sp" src="'+A(d.img)+'" alt="" style="'+(e.intent&&e.intent.t==='submerge'?'opacity:.45;':'')+(e.boss?'transform:scale(1.25);transform-origin:50% 100%;':'')+'"><div class="inf">'+(ko?'':'<span class="intent '+(INT_CLASS[(e.intent||{}).t]||'')+'">'+esc(intentText(e))+'</span>')+'<span class="fn">'+esc((e.boss&&e.k==='gator'?'Big Al':e.boss&&e.k==='raider'?'Toll King':d.n))+(e.alpha?' (alpha)':'')+' '+Math.max(0,e.hp)+'/'+e.max+'</span><span class="hpb"><i style="width:'+Math.max(0,100*e.hp/e.max)+'%"></i></span></div></button>'; });
  h+='<div class="party" id="party"><img class="hero" src="'+A('hero_side')+'" alt=""><img class="dg'+(s.dog.hurt>0?' hurt':'')+'" src="'+A('dog_stand')+'" alt=""></div>';
  if (f.over==='won'){ h+='<div class="banner"><div class="paper"><div class="card-t">'+(f.paid?'Toll paid!':'You won!')+'</div><div class="txt">'+esc(f.result||'')+'</div><div class="choices"><button class="btn" data-a="loot">'+(f.lootList&&f.lootList.length?'Check the loot':'Back to the road')+'</button></div></div></div>'; }
  else if (f.turn===1 && f.intro && !ui.introSeen){ h+='<div class="banner" style="pointer-events:none"><div class="paper" style="padding:10px 12px"><div class="txt" style="font-size:14px">'+esc(f.intro)+'</div></div></div>'; }
  h+='</div><div class="acts">';
  if (!f.over){
    var t = ui.tgt!==null ? f.foes[ui.tgt] : null; var ht = t&&!t.gone? Math.round(L.hitChance(s,t,false)*100) : null, hp2 = t&&!t.gone? Math.round(L.hitChance(s,t,true)*100):null;
    var inR = t && !t.gone && L.canHit(s,t);
    var uses = {}; s.pack.forEach(function(it){ var b=L.ITEMS[it.k]; if (b.slot==='use' && (b.heal||b.fire||b.stunall||b.bug||b.scare||b.repair)) uses[it.k]=(uses[it.k]||0)+1; });
    var hum = L.alive(f).some(function(e){ return L.ENEMIES[e.k].kind==='human'; });
    if (ui.items){ h+='<div class="ilist">'+(Object.keys(uses).length? Object.keys(uses).map(function(k){ return '<button class="btn sm teal" data-a="fa" data-a2="item" data-k="'+k+'"><img src="'+A(L.ITEMS[k].img)+'" alt="">'+esc(L.ITEMS[k].n)+' ×'+uses[k]+'</button>'; }).join('') : '<div class="paper txt" style="font-size:13px;padding:8px">No usable items. Find First Aid Kits, Molotovs and Flashbangs in loot or at traders.</div>')+'</div>'; }
    h+='<div class="fbar">'+
      '<button class="btn'+(inR?'':' off')+'" data-a="fa" data-a2="attack"><span class="col">Attack<small>'+(inR? ht+'% · '+L.heroDmgBase(s,t,false)+' dmg' : (w.range>1?'out of range':'too far - melee'))+'</small></span></button>'+
      '<button class="btn red'+(inR?'':' off')+'" data-a="fa" data-a2="power"><span class="col">Power<small>'+(inR? hp2+'% · '+L.heroDmgBase(s,t,true)+' dmg':'-')+'</small></span></button>'+
      '<button class="btn teal'+(t&&!t.gone&&t.dist<=1?'':' off')+'" data-a="fa" data-a2="shove"><span class="col">Shove<small>push back, cancel</small></span></button>'+
      '<button class="btn teal" data-a="fa" data-a2="brace"><span class="col">Brace<small>+3 armor, counter</small></span></button>'+
      '<button class="btn teal" data-a="items"><span class="col">Items<small>'+Object.keys(uses).reduce(function(a,k){return a+uses[k];},0)+' usable</small></span></button>'+
      (f.toll? '<button class="btn'+(s.res.batteries>=f.toll?'':' off')+'" data-a="fa" data-a2="toll"><span class="col">Pay toll<small>'+f.toll+' batteries</small></span></button>' : '<button class="btn teal'+(hum&&!f.talkTried?'':' off')+'" data-a="fa" data-a2="talk"><span class="col">Talk<small>'+(hum?(f.talkTried?'tried':'humans only'):'animals don\'t listen')+'</small></span></button>')+
      (f.boss? '<button class="btn teal off" disabled><span class="col">Flee<small>no way out</small></span></button>' : '<button class="btn red" data-a="fa" data-a2="flee"><span class="col">Flee<small>-1 fuel, dents van</small></span></button>')+
      '<button class="btn teal" data-a="ov" data-v="help"><span class="col">Tells<small>what does it mean?</small></span></button>'+
    '</div>';
    var dogOk = s.dog.hurt===0 && s.dog.hp>0 && !f.dogUsed;
    var cd=function(k){ return f.dogCd[k]>0 && f.dogCd[k]<99 ? ' · wait '+f.dogCd[k] : f.dogCd[k]>=99?' · used':''; };
    h+='<div class="dbar"><img class="dimg" src="'+A(s.dog.hurt>0?'dog_bow':'dog_sit')+'" alt="" style="'+(s.dog.hurt>0?'filter:grayscale(1)':'')+'"><div class="note">'+(s.dog.hurt>0?'Biscuit is resting in the van':dogOk?'Biscuit: free action!':'Biscuit acted')+'<br>HP '+Math.max(0,s.dog.hp)+'/'+L.dogMax(s)+'</div>'+
      '<button class="btn sm'+(dogOk&&!f.dogCd.bark?'':' off')+'" data-a="fd" data-a2="bark"><span class="col">Bark<small>scare animals back'+cd('bark')+'</small></span></button>'+
      '<button class="btn sm'+(dogOk&&!f.dogCd.bite&&t&&!t.gone&&t.dist<=1?'':' off')+'" data-a="fd" data-a2="bite"><span class="col">Bite<small>'+(2+Math.floor(s.dog.bond/3))+' dmg, adjacent'+cd('bite')+'</small></span></button>'+
      '<button class="btn sm'+(dogOk&&!f.dogCd.fetch&&hum?'':' off')+'" data-a="fd" data-a2="fetch"><span class="col">Fetch<small>steal from humans'+cd('fetch')+'</small></span></button></div>';
  }
  h+='</div></div></div>';
  return h;
}
function playFx(){
  var fx = ui.fx; ui.fx=null; if (!fx || !fx.length) return; var ar=document.getElementById('arena'); if(!ar) return; ui.introSeen=true;
  var delay=0;
  fx.forEach(function(x){
    var el = x.id!==undefined ? ar.querySelector('[data-f="'+x.id+'"]') : null;
    var pos = function(target){ var r=ar.getBoundingClientRect(); if (target){ var b=target.getBoundingClientRect(); return {x:b.left+b.width/2-r.left, y:b.top+b.height*0.3-r.top}; } var p=document.getElementById('party').getBoundingClientRect(); return {x:p.left+p.width*0.3-r.left, y:p.top+p.height*0.2-r.top}; };
    var fl=function(txt,cls,target,dl){ setTimeout(function(){ var p=pos(target); var d=document.createElement('div'); d.className='float '+cls; d.textContent=txt; d.style.left=p.x+'px'; d.style.top=p.y+'px'; ar.appendChild(d); setTimeout(function(){ d.remove(); },1200); }, dl); };
    if (x.t==='hit'){ if (el){ el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); } fl((x.src==='crit'?'CRIT! ':'')+'-'+x.n, x.src==='crit'?'crit':x.src==='dog'?'dog':'', el, delay); }
    else if (x.t==='miss') fl('miss','miss',el,delay);
    else if (x.t==='ram') fl('RAM! -'+x.n,'crit',el,delay);
    else if (x.t==='stun') fl('stunned!','miss',el,delay+150);
    else if (x.t==='shove') fl('shoved!','miss',el,delay+100);
    else if (x.t==='dmghero'){ delay+=260; fl('-'+x.n,'me',null,delay); setTimeout(function(){ var p=document.getElementById('party'); if(p){ p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); } }, delay); }
    else if (x.t==='dmgdog'){ delay+=260; fl('Biscuit -'+x.n,'dog',null,delay); }
    else if (x.t==='heal') fl('+'+x.n,'heal',null,delay);
    else if (x.t==='bark') fl('WOOF!','dog',null,delay);
    else if (x.t==='goodboy'){ delay+=260; fl('GOOD BOY!','crit',null,delay); }
    else if (x.t==='poison'){ delay+=200; fl('-1 venom','me',null,delay); }
    else if (x.t==='fetch') fl('+'+x.n+' batteries','dog',el,delay);
    else if (x.t==='howl') fl('AWOOO','miss',el,delay);
    else if (x.t==='leave') fl('left!','miss',el,delay);
  });
}
function traderScreen(){
  var t=s.trader; var who = t.who==='velvet'?'npc_velvet':t.who==='club'?'npc_mailman':'npc_dot'; var nm = {dot:'Dot & Ziggy\'s Rolling Shop', velvet:'Chez Velvet\'s Merch Table', club:'The Shuffleboard Club Swap Meet'}[t.who]||'Trader';
  var greet = {dot:'"Hey hon! Ziggy, get the good stuff out. Batteries only, we don\'t take checks."', velvet:'"Limited drop! Everything is, like, super exclusive."', club:'"We\'ve got everything. Except patience."'}[t.who];
  var bg = s.region===0?'stop_gas':'stop_town';
  var h='<div class="scr trade">'+hud()+'<div class="stage"><img class="bg" src="'+A(bg)+'" alt=""><img class="who l" src="'+A(who)+'" alt=""><div class="dock"><div class="paper"><div class="card-t">'+esc(nm)+'</div><div class="txt" style="font-size:14px">'+esc(greet)+'</div>';
  h+='<div class="sec">For sale</div><div class="stock">'+t.stock.map(function(o,i){ return t.sold[i]? '' : itemCard(o.it, '<button class="btn xs'+(s.res.batteries>=o.price?'':' off')+'" data-a="buy" data-i="'+i+'">Buy · '+o.price+' batteries</button>'); }).join('')+'</div>';
  if (t.sv && !t.svSold){ var S=L.SOUVENIRS[t.sv]; h+='<div class="sec">Souvenir</div><div class="sv"><img src="'+A('sv_'+t.sv)+'" alt=""><div style="flex:1"><div class="nm">'+esc(S.n)+'</div><div class="muted">'+esc(S.d)+'</div></div><button class="btn sm'+(s.res.batteries>=t.svPrice?'':' off')+'" data-a="buysv">'+t.svPrice+' bat.</button></div>'; }
  h+='<div class="sec">Supplies</div><div class="svc">'+t.svc.map(function(o,i){ return '<button class="btn sm teal'+(s.res.batteries>=o.cost?'':' off')+'" data-a="svc" data-i="'+i+'"><span class="col">'+esc(o.n)+'<small>'+o.cost+' batteries</small></span></button>'; }).join('')+'</div>';
  h+='<div class="sec">Sell from your pack</div>'+(s.pack.length? '<div class="stock">'+s.pack.map(function(it,i){ return itemCard(it,'<button class="btn xs teal" data-a="sell" data-i="'+i+'">Sell +'+L.ival(it)+'</button>'); }).join('')+'</div><div class="choices"><button class="btn teal sm" data-a="selljunk">Sell all junk</button></div>' : '<div class="muted">Your pack is empty.</div>');
  h+='</div><div class="pinleave"><button class="btn" data-a="leavetrade">Back on the road</button></div></div></div>'+foot()+'</div>';
  return h;
}
function regionScreen(){
  var R0=L.REGIONS[s.regionCard.from], R1=L.REGIONS[s.regionCard.to];
  return '<div class="scr"><img class="bg" src="'+A(R1.map)+'" alt="" style="filter:brightness(.75)"><div class="center"><div class="big">'+esc(R0.short)+': done!</div><div class="paper" style="max-width:480px;width:100%"><div class="card-t">Next: '+esc(R1.n)+'</div><div class="txt">'+esc(R1.blurb)+'</div><div class="statrow" style="margin-top:8px"><span>Day '+s.day+'</span><span>'+s.stats.kills+' bested</span><span>Bond '+s.dog.bond+'/10</span><span>'+s.dash.length+' souvenirs</span></div><div class="muted">Your dashboard gets one more slot. You patch yourself up a little (+4 HP).</div><div class="choices"><button class="btn teal" data-a="ov" data-v="garage">Visit the garage first</button><button class="btn" data-a="region">Drive on!</button></div></div></div></div>';
}
function finaleScreen(){
  var mins = Math.round((Date.now()-s.stats.t0)/60000), st=ui.fin||0, F=s.flags;
  var friends=[{k:'npc_dot',n:'Dot & Ziggy',m:F.metDot,l:'"Told you the lights were real, hon!"'},{k:'npc_hiker',n:'Juniper',m:F.ev_juniper,l:'Plays the song about Biscuit. The whole crowd knows the words.'},{k:'npc_velvet',n:'Chez Velvet',m:F.ev_velvet,l:F.velvet==='rival'?'"You took my limo parts. ...Okay, you can be in my vlog."':'"BESTIE! We made it! Say hi to the fans!"'},{k:'npc_rosa',n:'Grandma Rosa',m:F.ev_rosa,l:'Lassos you into a hug from twenty feet away.'},{k:'npc_trucker',n:'Big Wendell',m:F.ev_trucker,l:'"Breaker breaker, welcome home, little green van."'},{k:'npc_mailman',n:'The Mailman',m:true,l:'"Special delivery." It\'s a churro.'}].filter(function(f){return f.m;});
  var h='<div class="scr fin st'+st+'"><div class="finwrap"><img class="bg" src="'+A(st===2?'postcard':'finale_palace')+'" alt=""></div><div class="center"><div class="paper">';
  if (st===0){
    h+='<div class="card-t">Sunspire Park</div><div class="txt">You roll up to the gates at sunset. Everything is dark. Then - <b class="pu p1">click.</b> <span class="pu p2">The carousel lights up.</span> <span class="pu p3">The Ferris wheel spins awake, bulb by bulb.</span> <span class="pu p4">The Seashell Palace glows like a birthday cake.</span> <span class="pu p5">Fireworks. Music. Someone is cheering. A lot of someones.</span></div><div class="choices"><button class="btn" data-a="finnext">Walk up to the palace</button></div>';
  } else if (st===1){
    h+='<div class="card-t">Friends waiting at the palace</div><div class="txt" style="font-size:14px">Sunny the Pelican (a very sweaty person in a costume) opens the gates. Biscuit runs straight for the churros.</div><div class="friends">'+friends.map(function(f){ return '<div class="fr"><img src="'+A(f.k)+'" alt=""><div><b>'+esc(f.n)+'</b><div class="muted">'+esc(f.l)+'</div></div></div>'; }).join('')+'</div><div class="choices"><button class="btn" data-a="finnext">Write a postcard home</button></div>';
  } else {
    h+='<div class="pc"><div class="pcmsg">Made it to Sunspire! Day '+s.day+'. Marigold is fine (mostly). Biscuit has eaten '+(3+s.dog.bond)+' churros. Wish you were here - actually, come here. The lights are on. Love, me &amp; B.</div></div><div class="statrow" style="margin-top:8px"><span>Day '+s.day+'</span><span>'+mins+' min</span><span>'+s.stats.kills+' bested</span><span>'+s.stats.talks+' talked down</span><span>Bond '+s.dog.bond+'/10</span></div><div style="display:flex;gap:4px;margin:6px 0">'+s.dash.map(function(k){ return '<img src="'+A('sv_'+k)+'" style="height:34px">'; }).join('')+'</div><div class="choices"><button class="btn" data-a="home">Back to the title</button></div>';
  }
  return h+'</div></div></div>';
}
H.finnext = function(){ ui.fin=(ui.fin||0)+1; AU.sfx('sv'); render(); };
function confetti(){ var keys=['sv_sun','sv_pelican','it_treat','sv_flamingo','sv_hula','sv_disco']; var box=app.querySelector('.fin'); if(!box) return; for (var i=0;i<18;i++){ var im=document.createElement('img'); im.src=A(keys[i%keys.length]); im.className='confetti'; im.style.left=(Math.random()*95)+'%'; im.style.width=(28+Math.random()*30)+'px'; im.style.animationDuration=(3+Math.random()*4)+'s'; im.style.animationDelay=(Math.random()*3)+'s'; box.appendChild(im); } }
function endScreen(){
  var why = s.ended&&s.ended.why; var R=L.REGIONS[s.region];
  var title = why==='van' ? 'Marigold gave out.' : 'You need a long nap.';
  var body = why==='van' ? 'With one last sad honk, Marigold rolls to a stop and won\'t start again. Biscuit licks your hand. You\'ll get back on the road, but not today.' : 'You wake up in the back of the van, Biscuit curled on your chest, keeping watch. The trip is over for now. He\'s fine, by the way. He always is.';
  var pct = Math.round(L.progress(s)*100);
  return '<div class="scr"><img class="bg" src="'+A(why==='van'?'breakdown':'stop_camp')+'" alt="" style="filter:brightness(.8)"><div class="center"><div class="big">'+esc(title)+'</div><div class="paper" style="max-width:480px;width:100%"><div class="txt">'+esc(body)+'</div><div class="statrow" style="margin-top:8px"><span>'+pct+'% of the way to Sunspire</span><span>Day '+s.day+'</span><span>'+esc(R.short)+'</span><span>'+s.stats.kills+' bested</span><span>Bond '+s.dog.bond+'/10</span></div>'+(s.mailed?'<div class="muted">The Mailman will deliver your '+esc(L.iname(s.mailed))+' on your next trip.</div>':'<div class="muted">Tip: find the Mailman to send gear to your next trip.</div>')+'<div class="choices"><button class="btn" data-a="newgame2">Try again</button><button class="btn teal" data-a="home">Title screen</button></div></div></div></div>';
}
H.newgame2 = function(){ newGame(false); };

// ---------- overlays ----------
function overlay(){
  var v=ui.ov, h='<div class="ov"><div class="ovin">', title='', body='';
  if (v==='pack'){ title='Pack';
    body+='<div class="slots">'+L.SLOTS.map(function(sl){ var it=s.gear[sl]; return '<div class="slot'+(it?' r'+it.r:'')+'">'+(it?'<img src="'+A(L.ITEMS[it.k].img)+'" alt="">':'')+sl+'</div>'; }).join('')+'</div>';
    body+='<div class="statrow"><span>HP '+s.hp+'/'+L.hpMax(s)+'</span><span>Armor '+L.armor(s)+'</span><span>Weapon: '+esc(s.gear.weapon?L.iname(s.gear.weapon):'fists')+'</span></div><div class="muted" style="margin-bottom:6px">'+esc(s.gear.weapon?statLine(s.gear.weapon):'')+'</div>';
    body+='<div class="sec">In your pack ('+s.pack.length+'/'+L.packCap(s)+')</div><div class="grid">'+s.pack.map(function(it,i){ var b=L.ITEMS[it.k]; var a=''; if (L.SLOTS.indexOf(b.slot)>=0) a+='<button class="btn xs" data-a="equip" data-i="'+i+'">Equip</button>'; if (b.slot==='use' && (b.heal||b.repair||b.toy||b.scout)) a+='<button class="btn xs" data-a="use" data-i="'+i+'">Use</button>'; a+='<button class="btn xs teal" data-a="scrapp" data-i="'+i+'">Scrap +'+L.iscrap(it)+'</button>'; return itemCard(it,a); }).join('')+'</div>'+(s.pack.length?'':'<div class="muted">Empty. Go find some stuff!</div>')+
      '<div class="choices"><button class="btn teal sm" data-a="scrapjunkp">Scrap all junk &amp; worse gear</button></div>';
  } else if (v==='garage'){ title='Marigold\'s Garage';
    body+='<div class="banner-img"><img class="bg" src="'+A('garage')+'" alt=""></div><div style="padding-top:8px"><div class="statrow"><span>Marigold '+s.van.hp+'/'+L.vanMax(s)+'</span><span>Parts '+s.res.parts+'</span><span>Batteries '+s.res.batteries+'</span></div>'+
    '<div class="choices" style="margin:0 0 8px"><button class="btn teal sm'+(s.van.hp<L.vanMax(s)&&s.res.parts?'':' off')+'" data-a="repair">Repair Marigold (1 part = 2 HP)</button></div><div class="mods">';
    Object.keys(L.MODULES).forEach(function(m){ var M=L.MODULES[m], lv=s.van.mods[m], c=L.garage.cost(s,m); var ok = c && s.res.parts>=c.parts && s.res.batteries>=c.batteries;
      body+='<div class="mod"><div class="mid"><div class="mn">'+esc(M.n)+'</div><div class="pips">'+[1,2,3].map(function(i){ return '<i class="'+(i<=lv?'on':'')+'"></i>'; }).join('')+'</div><div class="md">'+esc(M.d[lv])+(c?'<br><b>Next:</b> '+esc(M.d[lv+1]):'')+'</div></div>'+(c?'<button class="btn sm'+(ok?'':' off')+'" data-a="upg" data-m="'+m+'"><span class="col">Upgrade<small>'+c.parts+' parts · '+c.batteries+' bat.</small></span></button>':'<b>MAX</b>')+'</div>'; });
    body+='</div></div>';
  } else if (v==='dash'){ title='Dashboard';
    var spots=[[30,44],[48,42],[63,43],[76,46],[86,48],[40,46]];
    body+='<div class="dashv"><img class="bg" src="'+A('dashboard')+'" alt="">'+s.dash.map(function(k,i){ var p=spots[i%spots.length]; return '<img class="svp" src="'+A('sv_'+k)+'" style="left:'+p[0]+'%;top:'+p[1]+'%;animation-delay:'+(i*0.3)+'s" alt="">'; }).join('')+'</div>';
    body+='<div class="sec">Souvenirs ('+s.dash.length+'/'+L.dashCap(s)+')</div>'+(s.dash.length? s.dash.map(function(k){ var S=L.SOUVENIRS[k]; return '<div class="sv" style="margin-bottom:6px"><img src="'+A('sv_'+k)+'" alt=""><div style="flex:1"><div class="nm">'+esc(S.n)+'</div><div class="muted">'+esc(S.d)+'</div></div><button class="btn xs red" data-a="drop" data-k="'+k+'">Toss</button></div>'; }).join('') : '<div class="muted">Nothing yet. Bosses, attractions and traders have souvenirs.</div>');
    body+='<div class="sec">Combos</div>'+L.COMBOS.map(function(c){ var on=c.need.every(function(k){return L.has(s,k);}); return '<div class="combo'+(on?'':' no')+'">'+(on?'ACTIVE: ':'')+esc(c.n)+' <span class="muted">('+c.need.map(function(k){return L.SOUVENIRS[k].n;}).join(' + ')+')</span><br>'+esc(c.d)+'</div>'; }).join('');
  } else if (v==='dog'){ title='Biscuit';
    body+='<div style="display:flex;gap:10px;align-items:flex-end"><img src="'+A(s.dog.hurt>0?'dog_bow':'dog_stand')+'" style="height:130px" alt=""><div><div class="card-t">Bond '+s.dog.bond+'/10</div><div class="statrow"><span>HP '+Math.max(0,s.dog.hp)+'/'+L.dogMax(s)+'</span><span>Treats '+s.res.treats+'</span></div>'+(s.dog.hurt>0?'<div class="muted">Resting in the dog bed for '+s.dog.hurt+' more stop(s).</div>':'')+'</div></div>';
    body+='<div class="choices"><button class="btn'+(s.res.treats?'':' off')+'" data-a="treat">Give a treat<small>+1 bond, heals Biscuit</small></button></div>';
    body+='<div class="sec">What Biscuit can do</div>'+[[1,'Bark: scares animals back and cancels their big moves.'],[1,'Bite: hits an adjacent enemy. Hits harder as your bond grows.'],[1,'Fetch: snatches batteries off a human, once per fight.'],[1,'Sniff: smells what\'s inside a container before you open it.'],[3,'Bond 3: sniffs twice per container.'],[6,'Bond 6: barks more often.'],[8,'Bond 8: tackles you out of the way of a deadly hit, once per fight.'],[10,'Bond 10: best friends forever.']].map(function(r){ return '<div class="combo'+(s.dog.bond>=r[0]?'':' no')+'">'+esc(r[1])+'</div>'; }).join('');
  } else if (v==='help'){ title='Reading the tells';
    body+='<div class="txt" style="font-size:14px">Enemies show what they\'ll do next turn. Plan around it!<br><br>'+
      '<b>Boar - pawing the dirt:</b> it will CHARGE for double damage. Shove it, bark at it, or brace.<br><b>Rattlesnake - rattling:</b> venom bite next (extra damage + poison). Shove or bark.<br><b>Gator - jaws open:</b> DEATH ROLL next. Shove it away! Submerged gators can\'t be shot from range.<br><b>Wolves:</b> the alpha howls to buff the pack. Take the alpha out first.<br><b>Mosquito swarms:</b> sting from range. Melee is weak against them; bug spray or fire wipes them out.<br><b>Welder Raider - lighting a molotov:</b> big fire throw next. Bark cancels it.<br><b>Slick Rick - "look over there!":</b> he\'ll steal an item next turn. Hit him first.<br><b>Toll Bandits:</b> sometimes you can talk them down. Or just pay.<br><br>Biscuit\'s action is free - use it every turn!</div>';
  } else if (v==='menu'){ title='Menu';
    body+='<div class="choices"><button class="btn teal" data-a="mute">'+(AU.muted?'Sound: OFF (tap to turn on)':'Sound: ON (tap to mute)')+'</button><button class="btn teal" data-a="ov" data-v="howin">How to play</button><button class="btn teal" data-a="ov" data-v="help">Reading the tells</button><button class="btn red" data-a="quit">Save &amp; quit to title</button></div><div class="muted" style="margin-top:10px">Your trip saves automatically after every move.'+(s.daily?' This is today\'s Daily Route.':'')+' Seed '+(s.seed>>>0)+'</div>';
  } else if (v==='howin'){ title='How to play'; body=howTo(); }
  h+='<div class="ovhd"><div class="h">'+esc(title)+'</div><button class="x" data-a="ov" data-v="">Close</button></div><div class="ovbody">'+body+'</div></div></div>';
  return h;
}
H.quit = function(){ save(); s=null; ui.ov=null; render(); };
function offerModal(){
  var o=s.offer, full = s.dash.length>=L.dashCap(s);
  var h='<div class="offer"><div class="h">'+esc(o.why)+'</div><div class="cards">';
  o.keys.forEach(function(k,i){ var S=L.SOUVENIRS[k]; var cmb = L.COMBOS.filter(function(c){ return c.need.indexOf(k)>=0 && c.need.every(function(n){ return n===k || L.has(s,n); }); })[0];
    h+='<div class="oc" style="animation-delay:'+(i*0.15)+'s"><img class="bst" src="'+A('fx_burst')+'" alt=""><img src="'+A('sv_'+k)+'" alt=""><div class="nm">'+esc(S.n)+'</div><div class="d">'+esc(S.d)+'</div>'+(cmb?'<div class="cmb">Completes combo: '+esc(cmb.n)+'!</div>':'')+'<button class="btn sm" data-a="takeoffer" data-k="'+k+'">Take it</button></div>'; });
  h+='</div>';
  if (full) h+='<div class="paper" style="max-width:520px;width:100%"><div class="txt" style="font-size:14px">Dashboard is full ('+s.dash.length+'/'+L.dashCap(s)+'). Toss one to make room:</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">'+s.dash.map(function(k){ return '<button class="btn xs red" data-a="drop" data-k="'+k+'"><img src="'+A('sv_'+k)+'" style="height:22px" alt="">'+esc(L.SOUVENIRS[k].n)+'</button>'; }).join('')+'</div></div>';
  h+='<button class="btn teal sm" data-a="takeoffer" data-k="">No thanks</button></div>';
  return h;
}

// ---------- input ----------
app.addEventListener('click', function(ev){
  AU.init();
  var el = ev.target.closest('[data-a]'); if (!el || el.disabled) return;
  var a = el.dataset.a, d = Object.assign({}, el.dataset);
  if (d.a2) d.a = d.a2;
  if (a==='fa' || a==='fd'){ H[a](d); return; }
  if (H[a]) H[a](d);
});
var rt=null; addEventListener('resize', function(){ clearTimeout(rt); rt=setTimeout(render,120); });
document.addEventListener('visibilitychange', function(){ if (document.hidden) save(); });
render();
})();
