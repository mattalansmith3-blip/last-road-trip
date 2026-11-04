// The Last Road Trip — core rules (no DOM). Runs in browser and in Node for the balance bot.
(function(L){
'use strict';
var COLS = 7;
function rng(s){ s.seed = (s.seed + 0x6D2B79F5) >>> 0; var t = s.seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
function ri(s,a,b){ return a + Math.floor(rng(s)*(b-a+1)); }
function pick(s,arr){ return arr[Math.floor(rng(s)*arr.length)]; }
function wpick(s, pairs){ var t=0,i; for(i=0;i<pairs.length;i++) t+=pairs[i][1]; var r=rng(s)*t; for(i=0;i<pairs.length;i++){ r-=pairs[i][1]; if(r<=0) return pairs[i][0]; } return pairs[pairs.length-1][0]; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
L.COLS = COLS; L.HEAT0 = -1.4;
L.util = { rng:rng, ri:ri, pick:pick, clamp:clamp };

// ---------- derived stats ----------
function has(s,k){ return s.dash.indexOf(k)>=0; }
function combos(s){ return L.COMBOS.filter(function(c){ return c.need.every(function(k){ return has(s,k); }); }); }
function hasCombo(s,id){ return combos(s).some(function(c){ return c.id===id; }); }
L.has = has; L.combos = combos; L.hasCombo = hasCombo;
function istat(it){ // item instance -> stats
  var b = L.ITEMS[it.k], R = L.RARITY[it.r||0], a = it.a>=0 ? L.AFFIX[it.a] : null, o = {};
  if (b.dmg) o.dmg = Math.max(1, Math.round(b.dmg * R.mult));
  if (b.acc) o.acc = b.acc + (a&&a.acc||0);
  if (b.range) o.range = b.range;
  if (b.armor) o.armor = Math.max(it.r===0?0:1, Math.round(b.armor * R.mult + (it.r>=2?0.4:0)));
  if (b.hp) o.hp = Math.round(b.hp * R.mult + (it.r>=2?1:0));
  if (b.mdmg) o.mdmg = Math.max(1, Math.round(b.mdmg * R.mult + (it.r>=2?0.5:0)));
  if (b.flee) o.flee = b.flee;
  o.stun = (b.stun||0) + (a&&a.stun||0); o.crit = (a&&a.crit||0); o.beast=(a&&a.beast||0); o.human=(a&&a.human||0); o.leech=(a&&a.leech||0);
  o.nocrit = b.nocrit; o.splash = b.splash; o.loud = b.loud;
  return o;
}
L.istat = istat;
function iname(it){ var b=L.ITEMS[it.k]; if (b.slot==='use'||b.slot==='res'||b.slot==='junk') return b.n; var adj = L.ADJ[it.r][it.n % L.ADJ[it.r].length]; return adj+' '+b.n+(it.a>=0?' '+L.AFFIX[it.a].name:''); }
L.iname = iname;
function ival(it){ var b=L.ITEMS[it.k]; if (b.val) return b.val; return L.RARITY[it.r].sell + (it.a>=0?1:0); }
function iscrap(it){ var b=L.ITEMS[it.k]; if (b.slot==='junk') return 2; if (b.slot==='use') return 1; return L.RARITY[it.r].scrap; }
L.ival = ival; L.iscrap = iscrap;
function gearSum(s,f){ var t=0; L.SLOTS.forEach(function(sl){ var it=s.gear[sl]; if(it){ var st=istat(it); t+=st[f]||0; } }); return t; }
function hpMax(s){ return 20 + gearSum(s,'hp'); }
function armor(s){ return gearSum(s,'armor'); }
function vanMax(s){ return 12 + 4*s.van.mods.armor + (has(s,'minivan')?6:0) + (hasCombo(s,'roadroyalty')?6:0); }
function packCap(s){ return 8 + 2*s.van.mods.rack; }
function dogMax(s){ return 10 + 2*s.van.mods.dogbed; }
function dashCap(s){ return 4 + Math.min(2, s.region); }
function weapon(s){ return s.gear.weapon ? istat(s.gear.weapon) : {dmg:1,acc:0.92,range:1,stun:0,crit:0,beast:0,human:0,leech:0}; }
L.hpMax=hpMax; L.armor=armor; L.vanMax=vanMax; L.packCap=packCap; L.dogMax=dogMax; L.dashCap=dashCap; L.weapon=weapon;
function heatRate(s){ return (0.95 + 0.05*s.region) * (has(s,'globe')?0.75:1); }
function fuelCost(s){ var e=s.van.mods.engine; return e>=2?1:2; }
L.fuelCost = fuelCost;

function say(s,t,kind){ s.log.push({t:t,k:kind||'info',id:++s.logId}); if (s.log.length>40) s.log.shift(); }
L.say = say;

// ---------- items ----------
var uid = 0;
function mkItem(s,k,r,a){ return { k:k, r:r||0, a:(a===undefined?-1:a), n:ri(s,0,99), id:(++s.uid) }; }
L.mkItem = mkItem;
function rollRarity(s, tier, bonus){
  var leg = (tier===0 && bonus<1) ? 0 : (2 + 2*tier + 3*bonus) * (hasCombo(s,'luckystreak')?2:1);
  return wpick(s, [[0, Math.max(10, 46 - 9*tier - 8*bonus)], [1, 36], [2, 11 + 5*tier + 6*bonus], [3, leg]]);
}
function rollItem(s, tier, bonus, cat){
  cat = cat || wpick(s, [['res',40],['use',22],['gear',26],['junk',12]]);
  var keys = Object.keys(L.ITEMS).filter(function(k){ var b=L.ITEMS[k];
    if (cat==='gear') return L.SLOTS.indexOf(b.slot)>=0 && (b.tier||0) <= tier+ (bonus>0?1:0);
    return b.slot===cat; });
  var k = wpick(s, keys.map(function(k){ return [k, L.ITEMS[k].w]; }));
  var b = L.ITEMS[k], r = 0, a = -1;
  if (L.SLOTS.indexOf(b.slot)>=0){ r = rollRarity(s,tier,bonus); if (r>=2) a = ri(s,0,L.AFFIX.length-1); if (b.slot!=='weapon' && a>=0 && L.AFFIX[a].id!=='crit' && L.AFFIX[a].id!=='snack') a=-1; }
  return mkItem(s,k,r,a);
}
L.rollItem = rollItem;
var CT = { crate:{n:'Supply Crate',items:[2,3],bonus:0}, cooler:{n:'Cooler',items:[2,2],bonus:0,food:1}, lockbox:{n:'Lockbox',items:[3,3],bonus:1,lock:1}, safe:{n:'Safe',items:[4,4],bonus:2,lock:2} };
L.CT = CT;
function mkContainer(s,type,tier){
  var c = CT[type], n = ri(s,c.items[0],c.items[1]) + (has(s,'horseshoe')?1:0), items=[];
  for (var i=0;i<n;i++){ var cat = c.food && i===0 ? 'res' : undefined; var it = rollItem(s,tier,c.bonus,cat); if (c.food && i===0) it = mkItem(s, pick(s,['beans','water','beans']),0); items.push(it); }
  if (c.bonus>=1){ items.sort(function(a,b){ return (b.r||0)-(a.r||0); }); var it2 = items[items.length-1]; }
  return { type:type, items:items, open:false, lock:c.lock||0, sniff:0, taken:[] };
}
L.mkContainer = mkContainer;

// ---------- run setup ----------
function newRun(opt){
  opt = opt||{};
  var s = { v:3, seed:(opt.seed>>>0)||((Date.now()*2654435761)>>>0), daily:!!opt.daily, uid:0, logId:0, log:[],
    region:0, col:0, node:null, map:null, day:1, heat:L.HEAT0,
    res:{ fuel:8, food:7, parts:2, treats:2, batteries:4 },
    hp:20, gear:{ weapon:null, jacket:null, helmet:null, gloves:null, boots:null }, pack:[], dash:[],
    van:{ hp:12, mods:{ engine:0, tires:0, armor:0, rack:0, kitchen:0, dogbed:0, solar:0 } },
    dog:{ hp:10, bond:1, hurt:0 }, hiker:null, flags:{}, screen:'map', stop:null, fight:null, trader:null, loot:null,
    stats:{ kills:0, scrapped:0, talks:0, fights:0, stops:0, legend:0, items:0, t0:Date.now(), drives:0 }, mailed:null, ended:null };
  s.gear.weapon = mkItem(s,'slingshot',1); s.gear.jacket = mkItem(s,'denim',1);
  s.pack.push(mkItem(s,'medkit')); s.pack.push(mkItem(s,'bat',0));
  if (opt.gift){ s.pack.push(opt.gift); s.flags.gift = 1; }
  genMap(s);
  say(s,'Day 1. Key West. The radio crackles: "Sunspire Park... lights are on... come west." Biscuit wags. Marigold coughs. Let\'s go.','story');
  return s;
}
L.newRun = newRun;

function genMap(s){
  var nodes=[], edges=[], R=L.REGIONS[s.region], id=0;
  var cols=[];
  for (var c=0;c<COLS;c++){
    var n = (c===0||c===COLS-1) ? 1 : (c===1||c===COLS-2 ? ri(s,2,3) : ri(s,2,3));
    var col=[];
    for (var j=0;j<n;j++){ var y = n===1?0.5:(0.18 + 0.64*j/(n-1)) + (rng(s)-0.5)*0.08; col.push({ id:id++, col:c, y:y, x:c/(COLS-1), type:'scavenge', done:false, seen:true }); }
    cols.push(col);
  }
  // types
  var pool = [['scavenge',24],['danger',15],['mystery',16],['gas',12],['diner',8],['attraction',10],['camp',6],['trader',6]];
  for (c=1;c<COLS-1;c++) cols[c].forEach(function(nd){ nd.type = wpick(s,pool); });
  function force(t, c0, c1){ var ok=false; for (var c=c0;c<=c1;c++) cols[c].forEach(function(n){ if(n.type===t) ok=true; }); if(!ok){ var c=ri(s,c0,c1); pick(s,cols[c]).type=t; } }
  force('trader',2,4); force('camp',3,5); force('attraction',1,4); force('gas',1,3);
  if (s.region===0 || rng(s)<0.7) force('mail',2,4);
  // no two identical types in the same column if avoidable
  cols[0][0].type='start'; cols[COLS-1][0].type='goal';
  // edges
  for (c=0;c<COLS-1;c++){
    var A=cols[c], B=cols[c+1];
    A.forEach(function(a,i){ var j = Math.round(i*(B.length-1)/Math.max(1,A.length-1)); edges.push([a.id,B[j].id]); if (rng(s)<0.55){ var j2 = clamp(j+(rng(s)<0.5?-1:1),0,B.length-1); if(j2!==j) edges.push([a.id,B[j2].id]); } });
    B.forEach(function(b){ if (!edges.some(function(e){return e[1]===b.id;})){ var a = A[Math.round(B.indexOf(b)*(A.length-1)/Math.max(1,B.length-1))]; edges.push([a.id,b.id]); } });
  }
  // mystery hidden
  nodes = [].concat.apply([], cols);
  nodes.forEach(function(n){ if (n.type==='mystery') n.seen=false; n.rough = false; });
  edges = edges.map(function(e){ return { a:e[0], b:e[1], rough: rng(s)<0.18 }; });
  s.map = { nodes:nodes, edges:edges };
  s.node = cols[0][0].id; s.col = 0; cols[0][0].done = true;
}
L.genMap = genMap;
function nodeById(s,id){ return s.map.nodes[id]; }
L.nodeById = nodeById;
function nextNodes(s){ return s.map.edges.filter(function(e){ return e.a===s.node; }).map(function(e){ return { node:nodeById(s,e.b), rough:e.rough }; }); }
L.nextNodes = nextNodes;

// ---------- travel ----------
function travel(s, nid){
  if (s.screen!=='map') return false;
  var opt = nextNodes(s).filter(function(o){ return o.node.id===nid; })[0]; if (!opt) return false;
  var fc = fuelCost(s);
  if (s.van.mods.engine===1 && rng(s)<0.5) fc = 1;
  if (opt.rough && s.van.mods.tires<3) fc += 1;
  var msg = [];
  if (s.res.fuel >= fc) s.res.fuel -= fc; else { var miss = fc - s.res.fuel; s.res.fuel = 0; s.hp -= 3*miss; s.heat += 0.4; msg.push('Out of gas! You push Marigold the rest of the way (-'+(3*miss)+' HP).'); }
  var eat = 1 + (s.hiker?1:0);
  if (s.res.food >= eat) s.res.food -= eat; else { s.res.food = 0; s.hp -= 2; s.dog.bond = Math.max(0, s.dog.bond-1); msg.push('No snacks. Everyone is hangry (-2 HP, Biscuit sulks).'); }
  s.heat += heatRate(s);
  if (s.van.mods.solar) { s.res.batteries += (s.van.mods.solar>=3?2:1); }
  if (s.van.mods.solar>=2 && (s.stats.drives%3)===2) s.res.fuel += 1;
  if (has(s,'sun')) s.res.batteries += 1;
  s.stats.drives++;
  // road events
  var r = rng(s);
  var flat = [0.16,0.08,0,0][s.van.mods.tires];
  if (r < flat){ if (s.res.parts>=1){ s.res.parts--; msg.push('Flat tire! Patched it with 1 part.'); } else { s.van.hp -= 2; msg.push('Flat tire! You drive on the rim (-2 Marigold).'); } }
  else if (r < flat+0.07){ s.van.hp -= 2; msg.push('Pothole the size of a hot tub (-2 Marigold).'); }
  else if (r < flat+0.12){ s.res.food += 1; msg.push('Biscuit spots a roadside mango tree. +1 food.'); }
  else if (r < flat+0.16){ s.res.batteries += 2; msg.push('An abandoned car still has batteries in the flashlight. +2 batteries.'); }
  s.node = nid; s.col = opt.node.col; s.day++; s.stats.stops++;
  var nd = opt.node; nd.done = true; nd.seen = true;
  if (has(s,'minivan') && s.van.hp < vanMax(s)) s.van.hp++;
  if (s.dog.hurt>0){ s.dog.hurt--; if (s.dog.hurt===0){ s.dog.hp = Math.max(4, Math.round(dogMax(s)*0.6)); msg.push('Biscuit hops out of the dog bed, tail going. He\'s back!'); } }
  if (s.heat >= s.col){ s.hp -= 2; s.res.food = Math.max(0, s.res.food-1); msg.push('The Heat caught up! Sweltering (-2 HP, -1 food). Keep moving!'); }
  if (s.van.hp <= 0){ if (s.res.parts>=3){ s.res.parts-=3; s.van.hp=3; msg.push('Marigold died... you rebuild her carburetor with 3 parts. She lives!'); } else if (takeUse(s,'tape')){ s.van.hp=4; msg.push('Marigold sputtered out. Duct tape saves the day (+4).'); } else { msg.forEach(function(m){ say(s,m,'warn'); }); return endRun(s,'van'); } }
  msg.forEach(function(m){ say(s,m,'warn'); });
  if (s.hp <= 0) return endRun(s,'hp');
  arrive(s, nd);
  return true;
}
L.travel = travel;
function takeUse(s,k){ for (var i=0;i<s.pack.length;i++) if (s.pack[i].k===k){ s.pack.splice(i,1); return true; } return false; }
function countUse(s,k){ return s.pack.filter(function(i){ return i.k===k; }).length; }
L.countUse = countUse;

function tier(s){ return s.region; }
function arrive(s, nd){
  var t = nd.type, T = tier(s);
  s.stop = { type:t, node:nd.id, ev:null, result:null, next:null, searches:0, bg:null };
  if (t==='mystery'){ if (rng(s)<0.3){ startFight(s, rollFoes(s), {reward:'lockbox', node:'mystery', intro:'It was a trap! Something was waiting in the bushes.'}); return; } t = 'event'; }
  if (t==='danger'){ startFight(s, rollFoes(s,true), {reward:'lockbox', node:'danger'}); return; }
  if (t==='goal'){ startBoss(s); return; }
  if (t==='trader'){ openTrader(s); return; }
  var evs = L.EVENTS.filter(function(e){ return e.at.indexOf(t)>=0 && (!e.region || e.region.indexOf(s.region)>=0) && (!e.cond || e.cond(s)) && !s.flags['ev_'+e.id]; });
  var ev = pick(s, evs.length?evs:L.EVENTS.filter(function(e){return e.at.indexOf('event')>=0;}));
  if (ev.once) s.flags['ev_'+ev.id]=1;
  s.stop.ev = ev.id; s.stop.bg = ev.bg ? (typeof ev.bg==='function'? ev.bg(s): ev.bg) : null;
  s.stop.text = typeof ev.text==='function' ? ev.text(s) : ev.text;
  s.screen = 'stop';
}
function rollFoes(s, hard){
  var R=L.REGIONS[s.region]; var f = pick(s,R.foes).slice();
  if (hard && f.length<3 && rng(s)<0.55) f.push(pick(s,pick(s,R.foes)));
  if (s.col<=1 && s.region===0) f = f.slice(0,1);
  return f;
}
L.rollFoes = rollFoes;

// ---------- events / choices ----------
function choose(s, i){
  if (s.screen!=='stop' || s.stop.result) return false;
  var ev = L.EVENTS.filter(function(e){ return e.id===s.stop.ev; })[0];
  var ch = ev.choices(s)[i]; if (!ch || (ch.req && !ch.req(s))) return false;
  var r = ch.go(s) || {}; s.stop.result = r.text || '...'; s.stop.next = r.next || null; s.stop.choice = i;
  if (s.hp<=0) { endRun(s,'hp'); }
  return true;
}
L.choose = choose;
function proceed(s){ // after an event result
  if (s.screen!=='stop') return;
  var nx = s.stop.next; s.stop.next=null;
  if (!nx){ toMap(s); return; }
  if (nx.fight){ startFight(s, nx.fight, nx); return; }
  if (nx.loot){ openLoot(s, nx.loot, nx); return; }
  if (nx.trader){ openTrader(s, nx.trader); return; }
  toMap(s);
}
L.proceed = proceed;
function toMap(s){ s.screen='map'; s.loot=null; s.fight=null; s.trader=null; s.stop=null; if (s.col===COLS-1) regionDone(s); }
L.toMap = toMap;

function give(s,k,n){ s.res[k] = Math.max(0,(s.res[k]||0)+n); }
L.give = give;
function heal(s,n){ s.hp = Math.min(hpMax(s), s.hp+n); }
L.heal = heal;
function bond(s,n){ var b0=s.dog.bond; s.dog.bond = clamp(s.dog.bond + n*(n>0&&has(s,'lava')?2:1), 0, 10); return s.dog.bond-b0; }
L.bond = bond;

// ---------- loot ----------
function openLoot(s, list, opt){
  opt = opt||{};
  var T = opt.tier!==undefined?opt.tier:tier(s);
  s.loot = { cs: list.map(function(t){ return mkContainer(s,t,T); }), cur:0, search: !!opt.search, title: opt.title||null };
  s.screen = 'loot';
}
L.openLoot = openLoot;
function lootC(s){ return s.loot.cs[s.loot.cur]; }
function sniff(s){ var c=lootC(s); if (!c || c.open || s.dog.hurt>0) return false; var max = s.dog.bond>=3?2:1; if (c.sniff>=max) return false; c.sniff++; say(s,'Biscuit sniffs the '+CT[c.type].n.toLowerCase()+'... '+(c.items[c.sniff-1].r>=2?'his tail goes wild!':'he seems mildly interested.'),'dog'); return true; }
function openC(s, how){
  var c = lootC(s); if (!c || c.open) return false;
  if (c.lock){
    if (how==='pick'){ if (!takeUse(s,'lockpick')) return false; }
    else if (how==='force'){ var cost = c.lock===2?4:2; if (s.res.parts<cost) return false; s.res.parts-=cost; if (rng(s)<0.25){ c.items.pop(); say(s,'You pry it open... something inside crunched.','warn'); } }
    else return false;
  }
  c.open = true; c.items.forEach(function(it){ if (it.r===3 && L.SLOTS.indexOf(L.ITEMS[it.k].slot)>=0) { s.stats.legend++; s.flags.legend=1; } });
  return true;
}
function applyRes(s,it){ var b=L.ITEMS[it.k]; var amt = b.amt + (it.k==='parts'? tier(s):0) + (it.k==='battery'? tier(s):0); give(s,b.res,amt); return amt; }
function takeItem(s, idx){
  var c = lootC(s); if (!c||!c.open) return false; var it = c.items[idx]; if (!it || c.taken[idx]) return false;
  var b = L.ITEMS[it.k];
  if (b.slot==='res'){ var a=applyRes(s,it); c.taken[idx]='res'; s.stats.items++; return true; }
  if (s.pack.length >= packCap(s)) return false;
  s.pack.push(it); c.taken[idx]='take'; s.stats.items++; return true;
}
function scrapLoot(s, idx){ var c=lootC(s); if(!c||!c.open) return false; var it=c.items[idx]; if(!it||c.taken[idx]) return false; var b=L.ITEMS[it.k]; if (b.slot==='res'){ return takeItem(s,idx); } s.res.parts += iscrap(it); s.stats.scrapped++; c.taken[idx]='scrap'; return true; }
function takeAll(s){ var c=lootC(s); if(!c||!c.open) return; c.items.forEach(function(it,i){ if(!c.taken[i]) takeItem(s,i); }); }
function scrapJunkLoot(s){ var c=lootC(s); if(!c||!c.open) return; c.items.forEach(function(it,i){ if(!c.taken[i] && isJunkish(s,it)) scrapLoot(s,i); }); }
function isJunkish(s,it){ var b=L.ITEMS[it.k]; if (b.slot==='junk') return true; if (L.SLOTS.indexOf(b.slot)>=0){ var cur=s.gear[b.slot]; if (cur && gearScore(it)<=gearScore(cur)) return true; } return false; }
L.isJunkish = isJunkish;
function gearScore(it){ var st=istat(it), b=L.ITEMS[it.k]; if (b.slot==='weapon') return st.dmg*(st.acc||0.8)*(st.range>1?1.15:1)*(1+st.stun+st.crit) + st.beast*0.3+st.human*0.3+st.leech*0.5; return (st.armor||0)*3 + (st.hp||0) + (st.mdmg||0)*2 + (st.flee||0)*5 + (st.nocrit?0.5:0); }
L.gearScore = gearScore;
function nextC(s){ if (s.loot.cur < s.loot.cs.length-1){ s.loot.cur++; return true; } leaveLoot(s); return false; }
function leaveLoot(s){ var st = s.stop; s.loot=null; if (st && st.type==='scavenge' && st.searchable){ s.screen='stop'; st.result=null; st.again=true; return; } toMap(s); }
function searchAgain(s){ var st=s.stop; if (!st||!st.again) return false; st.searches++; s.heat += 0.35; st.again=false;
  if (rng(s) < 0.22 + 0.1*st.searches){ startFight(s, [pick(s,['snake','boar','swarm'])], {reward:null, intro:'Something did NOT want to be disturbed.'}); return true; }
  if (rng(s) < 0.75 - 0.2*st.searches){ st.searchable = st.searches<2; openLoot(s,[pick(s,['crate','crate','cooler'])],{}); say(s,'You find a closet nobody checked.','good'); return true; }
  say(s,'Nothing but dust bunnies and a cookbook. This place is picked clean.','info'); st.searchable=false; toMap(s); return true; }
L.loot = { sniff:sniff, open:openC, take:takeItem, scrap:scrapLoot, takeAll:takeAll, scrapJunk:scrapJunkLoot, next:nextC, leave:leaveLoot, again:searchAgain, cur:lootC };

// ---------- pack ----------
function equip(s, idx){ var it=s.pack[idx]; if(!it) return false; var b=L.ITEMS[it.k]; if (L.SLOTS.indexOf(b.slot)<0) return false; var old=s.gear[b.slot]; s.gear[b.slot]=it; s.pack.splice(idx,1); if (old) s.pack.push(old); s.hp=Math.min(s.hp,hpMax(s)); return true; }
function scrapPack(s, idx){ var it=s.pack[idx]; if(!it) return false; s.res.parts += iscrap(it); s.pack.splice(idx,1); s.stats.scrapped++; return true; }
function scrapAllJunk(s){ var n=0; for (var i=s.pack.length-1;i>=0;i--) if (isJunkish(s,s.pack[i])){ scrapPack(s,i); n++; } return n; }
function usePack(s, idx){ var it=s.pack[idx]; if(!it) return false; var b=L.ITEMS[it.k];
  if (b.heal){ if (s.hp>=hpMax(s)) return false; heal(s,b.heal); }
  else if (b.repair){ if (s.van.hp>=vanMax(s)) return false; s.van.hp=Math.min(vanMax(s),s.van.hp+b.repair); }
  else if (b.toy){ bond(s,2); say(s,'SQUEAK. Biscuit loses his mind with joy. +bond','dog'); }
  else if (b.scout){ s.map.nodes.forEach(function(n){ n.seen=true; }); say(s,'You scan the horizon. Every mystery stop is revealed.','good'); }
  else return false;
  s.pack.splice(idx,1); return true; }
function treatDog(s){ if (s.res.treats<1) return false; s.res.treats--; var g=bond(s,1); if (s.dog.hurt>0){ s.dog.hurt=Math.max(1,s.dog.hurt-1); } else s.dog.hp=Math.min(dogMax(s), s.dog.hp+3); say(s, s.dog.bond>=10?'Biscuit looks at you like you invented the sun. Max bond!':'Biscuit devours the treat. Bond '+s.dog.bond+'/10','dog'); if (s.dog.bond>=10) s.flags.goodboy=1; return true; }
L.pack = { equip:equip, scrap:scrapPack, scrapJunk:scrapAllJunk, use:usePack, treat:treatDog };

// ---------- dashboard ----------
function addSouvenir(s,k){ if (has(s,k)) return false; if (s.dash.length>=dashCap(s)) return false; var before=combos(s).length; s.dash.push(k); if (k==='minivan'){ s.van.hp+=6; } if (combos(s).length>before){ s.flags.combo=1; say(s,'COMBO! '+combos(s)[combos(s).length-1].n+': '+combos(s)[combos(s).length-1].d,'good'); if (combos(s).some(function(c){return c.id==='roadroyalty';})) s.van.hp=Math.min(vanMax(s),s.van.hp+6); } if (s.dash.length>=5) s.flags.dash5=1; return true; }
function dropSouvenir(s,k){ var i=s.dash.indexOf(k); if(i<0) return false; s.dash.splice(i,1); s.van.hp=Math.min(s.van.hp,vanMax(s)); return true; }
function randomSouvenirs(s,n){ var pool=Object.keys(L.SOUVENIRS).filter(function(k){ return !has(s,k); }); var out=[]; while(out.length<n && pool.length){ var i=Math.floor(rng(s)*pool.length); out.push(pool.splice(i,1)[0]); } return out; }
L.dash = { add:addSouvenir, drop:dropSouvenir, random:randomSouvenirs };
function offerSouvenir(s, keys, why){ s.offer = { keys:keys, why:why||'Pick a souvenir for the dashboard' }; }
function takeOffer(s, k){ if (!s.offer) return false; if (k && s.offer.keys.indexOf(k)>=0){ if (!addSouvenir(s,k)) return false; say(s,L.SOUVENIRS[k].n+' is now riding on the dashboard.','good'); } s.offer=null; return true; }
L.offerSouvenir = offerSouvenir; L.takeOffer = takeOffer;

// ---------- garage ----------
function upCost(s,m){ var lv=s.van.mods[m]; var c=L.MODULES[m].cost[lv]; return c?{parts:c[0],batteries:c[1]}:null; }
function upgrade(s,m){ var c=upCost(s,m); if(!c) return false; if (s.res.parts<c.parts||s.res.batteries<c.batteries) return false; s.res.parts-=c.parts; s.res.batteries-=c.batteries; s.van.mods[m]++; if (m==='armor') s.van.hp+=4; if (m==='dogbed'){ s.dog.hp+=2; if (s.dog.hurt>0) s.dog.hurt=Math.max(1,s.dog.hurt-1); } say(s,L.MODULES[m].n+' upgraded! '+L.MODULES[m].d[s.van.mods[m]],'good'); return true; }
function repairVan(s){ var need=vanMax(s)-s.van.hp; if (need<=0||s.res.parts<1) return false; var n=Math.min(need, s.res.parts*2); s.res.parts -= Math.ceil(n/2); s.van.hp+=n; return true; }
L.garage = { cost:upCost, upgrade:upgrade, repair:repairVan };

// ---------- trader ----------
function openTrader(s, who){
  var T=tier(s); who = who || (s.flags.metDot && rng(s)<0.4 ? pick(s,['dot','dot','velvet']) : 'dot'); s.flags.metDot=1;
  var stock=[]; for (var i=0;i<4;i++){ var it=rollItem(s,T, i===0?1:0, i<2?'gear':'use'); stock.push({it:it, price: ival(it)*2 + 1 + T}); }
  var sv = randomSouvenirs(s,1)[0];
  s.trader = { who:who, stock:stock, sv:sv, svPrice: 7+2*T, sold:[], svSold:false,
    svc:[ {k:'fuel',n:'3 Fuel',give:{fuel:3},cost:3}, {k:'food',n:'3 Food',give:{food:3},cost:3}, {k:'parts',n:'3 Parts',give:{parts:3},cost:4}, {k:'treats',n:'2 Treats',give:{treats:2},cost:2} ] };
  if (hasCombo(s,'sunshineband')) { s.res.batteries+=2; say(s,'Sunshine Band! The trader tips you 2 batteries for the tune.','good'); }
  s.screen='trader';
}
L.openTrader = openTrader;
function buy(s,i){ var t=s.trader, o=t.stock[i]; if(!o||t.sold[i]) return false; if (s.res.batteries<o.price||s.pack.length>=packCap(s)) return false; s.res.batteries-=o.price; s.pack.push(o.it); t.sold[i]=1; return true; }
function buySvc(s,i){ var o=s.trader.svc[i]; if(!o||s.res.batteries<o.cost) return false; s.res.batteries-=o.cost; for (var k in o.give) give(s,k,o.give[k]); o.cost+=1; return true; }
function buySv(s){ var t=s.trader; if(!t.sv||t.svSold||s.res.batteries<t.svPrice) return false; if(!addSouvenir(s,t.sv)) return false; s.res.batteries-=t.svPrice; t.svSold=true; return true; }
function sell(s,idx){ var it=s.pack[idx]; if(!it) return false; s.res.batteries += ival(it); s.pack.splice(idx,1); return true; }
function sellJunk(s){ var n=0,b=0; for (var i=s.pack.length-1;i>=0;i--) if (isJunkish(s,s.pack[i])){ b+=ival(s.pack[i]); sell(s,i); n++; } return {n:n,b:b}; }
function leaveTrader(s){ s.trader=null; toMap(s); }
L.trade = { buy:buy, svc:buySvc, sv:buySv, sell:sell, sellJunk:sellJunk, leave:leaveTrader };

// ---------- combat ----------
function startFight(s, foes, opt){
  opt = opt||{}; var T=tier(s);
  var f = { foes:[], turn:1, first:true, dazzle: has(s,'disco') ? (hasCombo(s,'nightfever')?2:1) : 0, dogCd:{bark:0,bite:0,fetch:0}, brace:false,
    reward: opt.reward===undefined?'crate':opt.reward, boss:!!opt.boss, toll:opt.toll||0, intro:opt.intro||null, saved:false, fx:[], talkTried:false, angry:0, node:opt.node||null, name:opt.name||null, svOffer: opt.svOffer||0 };
  var lanes=[1,0,2];
  foes.forEach(function(k,i){ var d=L.ENEMIES[k]; var hp=Math.round(d.hp*(1+0.22*T)) + (opt.bossHp&&opt.bossHp[i]?opt.bossHp[i]:0);
    f.foes.push({ k:k, hp:hp, max:hp, dist: Math.min(5, d.dist + (i>0&&rng(s)<0.5?1:0)), lane:lanes[i%3], dmg: d.dmg + Math.floor(T*0.7) + (opt.bossHp&&opt.bossHp[i]?1:0), stun:0, st:{}, alpha: k==='wolf' && !f.foes.some(function(e){return e.k==='wolf';}), boss: !!(opt.bossHp&&opt.bossHp[i]), intent:null, id:i, gone:false }); });
  s.fight = f; s.screen='fight'; s.stats.fights++;
  if (s.van.mods.armor>=2){ var t0=f.foes[0], ram = s.van.mods.armor>=3?5:3; t0.hp-=ram; f.fx.push({t:'ram',id:t0.id,n:ram}); say(s,'Marigold rams the '+L.ENEMIES[t0.k].n.toLowerCase()+' on the way in! ('+ram+')','good'); if (t0.hp<=0) killFoe(s,t0); }
  f.foes.forEach(function(e){ setIntent(s,e); });
  return f;
}
L.startFight = startFight;
function startBoss(s){
  var R=L.REGIONS[s.region], B=R.boss;
  startFight(s, B.foes, { boss:true, reward:'safe', bossHp:B.bossHp, toll:B.toll||0, intro:B.intro, name:B.n, svOffer:3 });
}
function alive(f){ return f.foes.filter(function(e){ return !e.gone; }); }
L.alive = alive;
function setIntent(s,e){
  var f=s.fight, d=L.ENEMIES[e.k], I;
  if (e.stun>0){ e.intent={t:'stunned'}; return; }
  if (f.dazzle>0){ e.intent={t:'dazzled'}; return; }
  var dmg = e.dmg + (e.st.howl||0) + f.angry;
  switch(d.tell){
    case 'wolf':
      if (e.alpha && (f.turn%3)===2 && !e.st.howled){ I={t:'howl'}; break; }
      I = e.dist>1 ? {t:'move',n:d.spd} : {t:'attack',dmg:dmg}; break;
    case 'boar':
      if (e.st.pawed){ I={t:'charge',dmg:dmg*2}; break; }
      if (e.dist>=2 && rng(s)<0.55){ I={t:'paw'}; break; }
      I = e.dist>1 ? {t:'move',n:1} : {t:'attack',dmg:dmg}; break;
    case 'snake':
      if (e.dist>1){ I={t:'move',n:1}; break; }
      I = e.st.rattled ? {t:'bite',dmg:dmg+2} : {t:'rattle'}; break;
    case 'gator':
      if (e.dist>1){ I = (e.st.subNext ? {t:'submerge',n:1} : {t:'move',n:1}); e.st.subNext=!e.st.subNext; break; }
      I = e.st.jaws ? {t:'roll',dmg:dmg*2+1} : {t:'jaws'}; break;
    case 'swarm':
      I = e.dist<=2 ? {t:'sting',dmg:dmg+(e.boss?1:0)} : {t:'move',n:1}; break;
    case 'raider':
      if (e.st.lit){ I={t:'throw',dmg:dmg+2}; break; }
      if (e.dist>=2 && !e.st.threw && rng(s)<0.6){ I={t:'light'}; break; }
      I = e.dist>1 ? {t:'move',n:1} : {t:'attack',dmg:dmg}; break;
    case 'conman':
      if (e.st.dist){ I={t:'steal'}; break; }
      if (e.dist<=3 && !e.st.did){ I={t:'distract'}; break; }
      I = e.dist>1 ? {t:'move',n:1} : {t:'attack',dmg:dmg}; break;
    default:
      I = e.dist>1 ? {t:'move',n:d.spd} : {t:'attack',dmg:dmg};
  }
  e.intent = I;
}
L.INTENT = { move:'Advancing', attack:'Attack', howl:'Howling! Pack gets +1 dmg', paw:'Pawing the dirt... CHARGE next turn', charge:'CHARGE!', rattle:'Rattling... bite next turn', bite:'Venom bite', submerge:'Submerging (can\'t be shot)', jaws:'Jaws open... death roll next', roll:'DEATH ROLL', sting:'Stinging from range', light:'Lighting a molotov...', throw:'Throwing fire!', distract:'"Hey, look over there!"', steal:'Grabbing your stuff!', stunned:'Stunned', dazzled:'Dazzled by the disco ball', };
function heroDmgBase(s, e, power){
  var w=weapon(s), d=L.ENEMIES[e.k], dmg=w.dmg;
  if (w.range<=1) dmg += gearSum(s,'mdmg');
  if (d.kind==='beast'){ dmg += w.beast + (has(s,'gator')?2:0); } else dmg += w.human;
  if (hasCombo(s,'floridaman')) dmg += 2;
  if (s.fight.first && has(s,'hula')) dmg += 3;
  if (s.hiker && s.hiker.k==='juniper') dmg += 1;
  if (power) dmg = Math.round(dmg*1.7);
  return dmg;
}
function hitChance(s,e,power){ var w=weapon(s); var a = w.acc - 0.04*Math.max(0,e.dist-1) - (power?0.15:0); if (e.k==='swarm' && w.range<=1) a-=0.1; return clamp(a,0.05,0.98); }
function canHit(s,e){ var w=weapon(s); if (e.gone) return false; if (e.dist>w.range) return false; if (e.intent && e.intent.t==='submerge' && w.range>1 && e.dist>1) return false; return true; }
L.hitChance = hitChance; L.canHit = canHit; L.heroDmgBase = heroDmgBase;
function dmgFoe(s,e,n,src){ var f=s.fight; e.hp-=n; f.fx.push({t:'hit',id:e.id,n:n,src:src||'hero'}); if (e.hp<=0) killFoe(s,e); }
function killFoe(s,e){ var f=s.fight; if (e.gone) return; e.gone=true; e.hp=0; s.stats.kills++; f.fx.push({t:'ko',id:e.id}); var w=weapon(s); if (w.leech) heal(s,w.leech); }
function heroAct(s, act, tid, extra){
  var f=s.fight; if (!f || s.screen!=='fight' || f.over) return false;
  var e = tid!==undefined && tid!==null ? f.foes[tid] : null, w=weapon(s);
  f.fx=[]; f.brace=false;
  if (act==='attack'||act==='power'){
    if (!e || !canHit(s,e)) return false;
    var p = hitChance(s,e,act==='power');
    if (rng(s) < p){
      var dmg = heroDmgBase(s,e,act==='power'), crit = rng(s) < 0.08 + w.crit + (has(s,'dice')?0.1:0);
      if (crit) dmg*=2;
      if (e.k==='swarm' && w.range<=1) dmg = Math.max(1, Math.ceil(dmg/2));
      dmgFoe(s,e,dmg, crit?'crit':'hero');
      if (!e.gone && rng(s) < w.stun){ e.stun=1; f.fx.push({t:'stun',id:e.id}); }
      if (!e.gone && e.k==='conman') { e.st.dist=false; e.st.did=true; }
      if (w.splash){ f.foes.forEach(function(o){ if(!o.gone && o!==e && Math.abs(o.lane-e.lane)===1 && o.dist<=w.range) dmgFoe(s,o,Math.ceil(dmg/3)); }); }
    } else f.fx.push({t:'miss',id:e.id});
    if (w.loud) s.heat += 0.15;
    f.first=false;
  } else if (act==='shove'){
    if (!e || e.gone || e.dist>1) return false;
    e.dist=Math.min(5,e.dist+1); e.st.pawed=false; e.st.jaws=false; e.st.rattled=false; e.st.lit=false; e.st.dist=false; e.intent={t:'shoved'}; e.skip=1; dmgFoe(s,e,1); f.fx.push({t:'shove',id:e.id});
  } else if (act==='brace'){ f.brace=true; f.fx.push({t:'brace'}); }
  else if (act==='item'){
    var idx = s.pack.findIndex(function(it){ return it.k===extra; }); if (idx<0) return false; var b=L.ITEMS[extra];
    if (b.heal){ heal(s,b.heal); f.fx.push({t:'heal',n:b.heal}); }
    else if (b.fire){ if(!e||e.gone) return false; alive(f).forEach(function(o){ var n = o.k==='swarm'?99:(o===e?b.fire:3); if (o===e||Math.abs(o.lane-e.lane)===1) dmgFoe(s,o,n===99?o.hp:n,'fire'); }); }
    else if (b.stunall){ alive(f).forEach(function(o){ o.stun=1; o.st.pawed=false; o.st.lit=false; o.st.dist=false; o.st.jaws=false; f.fx.push({t:'stun',id:o.id}); }); }
    else if (b.bug){ alive(f).forEach(function(o){ if (o.k==='swarm') dmgFoe(s,o,o.hp,'bug'); else if (L.ENEMIES[o.k].kind==='beast' && o.dist<=2) dmgFoe(s,o,2,'bug'); }); }
    else if (b.scare){ alive(f).forEach(function(o){ o.dist=Math.min(5,o.dist+2); o.st.pawed=false; o.st.jaws=false; o.st.rattled=false; dmgFoe(s,o,2,'fire'); }); }
    else if (b.repair){ s.van.hp=Math.min(vanMax(s),s.van.hp+b.repair); }
    else return false;
    s.pack.splice(idx,1);
  } else if (act==='talk'){
    var hum = alive(f).filter(function(o){ return L.ENEMIES[o.k].kind==='human'; }); if (!hum.length || f.talkTried) return false; f.talkTried=true;
    var ch = 0.38 + (has(s,'trumpet')?0.25:0) + (s.hiker?0.1:0) + (hum.some(function(o){return o.k==='conman';})?0.2:0) - (f.boss?0.2:0);
    if (rng(s)<ch){ hum.forEach(function(o){ o.gone=true; f.fx.push({t:'leave',id:o.id}); }); s.stats.talks++; say(s, pick(s,['"...You know what, you remind me of my cousin. Go on."','They laugh at your joke about Florida drivers and wave you through.','"A dog THAT cute? Fine. Fine!"']), 'good'); }
    else { f.angry+=1; say(s,'They did not like your tone. (+1 enemy damage)','warn'); }
  } else if (act==='toll'){
    if (!f.toll || s.res.batteries<f.toll) return false; s.res.batteries-=f.toll; alive(f).forEach(function(o){ o.gone=true; }); say(s,'You pay the toll. The Krewe throws you beads. Honestly? Worth it.','good'); f.paid=true; return endFight(s,true);
  } else if (act==='flee'){
    if (f.boss) return false;
    var fc = 0.68 + gearSum(s,'flee') + (s.van.mods.tires>=1?0.05:0) + (s.van.mods.engine>=3?1:0);
    if (rng(s)<fc){ s.res.fuel=Math.max(0,s.res.fuel-1); if(!has(s,'dino')) s.van.hp-=2; say(s,'You floor it! Marigold rattles away to safety.'+(has(s,'dino')?'':' (-2 Marigold, -1 fuel)'),'warn'); f.over='fled'; s.fight=null; if (s.van.hp<=0){ s.van.hp=1; } toMap(s); return true; }
    say(s,'Marigold won\'t start! Biscuit barks encouragingly.','warn');
  } else return false;
  if (alive(f).length===0) return endFight(s,true);
  enemyTurn(s);
  return true;
}
L.heroAct = heroAct;
function dogAct(s, cmd, tid){
  var f=s.fight; if (!f||f.over||s.dog.hurt>0||s.dog.hp<=0) return false; if (f.dogUsed) return false; if (f.dogCd[cmd]>0) return false;
  f.fx=[];
  var e = tid!==undefined&&tid!==null ? f.foes[tid] : null;
  if (cmd==='bark'){ alive(f).forEach(function(o){ if (L.ENEMIES[o.k].kind==='beast'){ o.dist=Math.min(5,o.dist+1); o.st.pawed=false; o.st.jaws=false; o.st.rattled=false; if (o.intent && ['howl','paw','charge','jaws','roll','rattle','bite'].indexOf(o.intent.t)>=0){ o.intent={t:'shoved'}; o.skip=1; } } else { if (o.st.lit){ o.st.lit=false; o.intent={t:'shoved'}; o.skip=1; } } }); f.dogCd.bark = s.dog.bond>=6?2:3; f.fx.push({t:'bark'}); }
  else if (cmd==='bite'){ if (!e||e.gone||e.dist>1) return false; dmgFoe(s,e, 2+Math.floor(s.dog.bond/3), 'dog'); f.dogCd.bite=2; f.fx.push({t:'dogbite',id:e.id}); }
  else if (cmd==='fetch'){ var h = alive(f).filter(function(o){ return L.ENEMIES[o.k].kind==='human'; })[0]; if(!h) return false; var n=ri(s,2,4); s.res.batteries+=n; f.dogCd.fetch=99; f.fx.push({t:'fetch',id:h.id,n:n}); say(s,'Biscuit snatches a pouch off the '+L.ENEMIES[h.k].n.toLowerCase()+'! +'+n+' batteries.','dog'); }
  else return false;
  f.dogUsed=true;
  if (alive(f).length===0) return endFight(s,true);
  return true;
}
L.dogAct = dogAct;
function hitHero(s, e, n, what){
  var f=s.fight;
  var tgtDog = s.dog.hurt===0 && s.dog.hp>0 && rng(s)<0.22 && what!=='throw';
  if (tgtDog){ var dn=Math.max(1,n - (f.brace?2:0)); s.dog.hp-=dn; f.fx.push({t:'dmgdog',n:dn,id:e.id}); if (s.dog.hp<=0){ s.dog.hp=0; s.dog.hurt = Math.max(1, 3 - s.van.mods.dogbed); if (s.van.mods.dogbed>=3) s.dog.hurt=1; say(s,'Biscuit yelps and limps back to the van. He\'ll be okay, but he needs rest ('+s.dog.hurt+' stops).','warn'); f.fx.push({t:'doghurt'}); } return; }
  var a = armor(s) + (f.brace?3:0); var dmg = Math.max(1, n - a);
  if (f.brace && L.ENEMIES[e.k].kind && e.dist<=1 && what==='melee'){ dmgFoe(s,e,2,'counter'); }
  if (s.hp - dmg <= 0 && s.dog.bond>=8 && !f.saved && s.dog.hurt===0){ f.saved=true; s.hp=1; f.fx.push({t:'goodboy'}); say(s,'Biscuit tackles you out of the way! GOOD BOY!','dog'); return; }
  s.hp -= dmg; f.fx.push({t:'dmghero',n:dmg,id:e.id});
}
function enemyTurn(s){
  var f=s.fight;
  alive(f).forEach(function(e){
    var I=e.intent||{t:'move',n:1}, d=L.ENEMIES[e.k];
    if (e.skip){ e.skip=0; return; }
    if (I.t==='stunned'){ e.stun=0; return; }
    if (I.t==='dazzled') return;
    switch(I.t){
      case 'move': case 'submerge': e.dist=Math.max(1, e.dist-(I.n||1)); break;
      case 'attack': hitHero(s,e,I.dmg,'melee'); break;
      case 'howl': e.st.howled=true; alive(f).forEach(function(o){ if (o.k==='wolf') o.st.howl=(o.st.howl||0)+1; }); f.fx.push({t:'howl',id:e.id}); break;
      case 'paw': e.st.pawed=true; break;
      case 'charge': e.st.pawed=false; e.dist=1; hitHero(s,e,I.dmg,'melee'); break;
      case 'rattle': e.st.rattled=true; break;
      case 'bite': e.st.rattled=false; hitHero(s,e,I.dmg,'melee'); s.fight.poison=2; break;
      case 'jaws': e.st.jaws=true; break;
      case 'roll': e.st.jaws=false; hitHero(s,e,I.dmg,'melee'); break;
      case 'sting': hitHero(s,e,I.dmg,'sting'); if (e.dist>1) e.dist--; break;
      case 'light': e.st.lit=true; break;
      case 'throw': e.st.lit=false; e.st.threw=true; hitHero(s,e,I.dmg,'throw'); break;
      case 'distract': e.st.dist=true; e.st.did=true; break;
      case 'steal': e.st.dist=false; var loot = s.pack.length ? s.pack.splice(Math.floor(rng(s)*s.pack.length),1)[0] : null; if (loot){ say(s,'Slick Rick swiped your '+iname(loot)+' and vanished! Rude.','warn'); } else { var b=Math.min(3,s.res.batteries); s.res.batteries-=b; say(s,'Slick Rick swiped '+b+' batteries and vanished!','warn'); } e.gone=true; f.fx.push({t:'leave',id:e.id}); break;
    }
  });
  if (f.poison>0 && s.hp>0){ s.hp-=1; f.poison--; f.fx.push({t:'poison'}); }
  if (s.hp<=0){ f.over='dead'; return endRun(s,'hp'); }
  if (f.dazzle>0) f.dazzle--;
  f.turn++; f.dogUsed=false; for (var k in f.dogCd) if (f.dogCd[k]>0 && f.dogCd[k]<99) f.dogCd[k]--;
  if (alive(f).length===0){ endFight(s,true); return; }
  alive(f).forEach(function(e){ setIntent(s,e); });
}
function endFight(s, won){
  var f=s.fight; f.over='won';
  var n = f.foes.length; var bat = ri(s, n, n*2) + (f.boss?4:0);
  s.res.batteries += bat;
  var msg='Victory! +'+bat+' batteries.';
  if (has(s,'flamingo')){ heal(s,3); msg+=' The flamingo approves (+3 HP).'; }
  if (s.dog.hurt===0 && s.dog.hp>0) bond(s, f.boss?1:(rng(s)<0.35?1:0));
  s.fight.result = msg;
  f.lootList = f.reward ? [f.reward] : [];
  if (has(s,'pelican') && s.dog.hurt===0) f.lootList.push('crate');
  if (f.svOffer) offerSouvenir(s, randomSouvenirs(s,f.svOffer), 'Spoils of '+(f.name||'battle')+': pick a souvenir');
  else if (f.node==='danger' && rng(s)<0.25) offerSouvenir(s, randomSouvenirs(s,2), 'Something shiny was in their stash...');
  return true;
}
function afterFight(s){ var f=s.fight; if (!f||f.over!=='won') return; var list=f.lootList, boss=f.boss; s.fight=null;
  if (list.length){ openLoot(s, list, { tier: tier(s) }); } else toMap(s); }
L.afterFight = afterFight;

// ---------- region / end ----------
function regionDone(s){
  if (s.flags['rdone'+s.region]) return; s.flags['rdone'+s.region]=1;
  if (s.region===0) s.flags.fl_done=1; if (s.region===1) s.flags.gulf_done=1;
  if (s.hiker){ say(s, s.hiker.n+' hops out at the state line. "Best ride ever." They leave you '+s.hiker.gift+'.','good'); if (s.hiker.giftK) { var g=mkItem(s,s.hiker.giftK,2, s.hiker.giftK==='bat'?0:-1); if (s.pack.length<packCap(s)) s.pack.push(g); } s.hiker=null; }
  if (s.region >= L.REGIONS.length-1){ s.screen='finale'; s.ended={why:'win', t:Date.now()}; s.flags.sunspire=1; return; }
  s.screen='region'; s.regionCard = { from:s.region, to:s.region+1 };
}
function nextRegion(s){ s.region++; s.heat=L.HEAT0; genMap(s); s.screen='map'; s.regionCard=null; s.hp=Math.min(hpMax(s), s.hp+4); say(s,'Welcome to '+L.REGIONS[s.region].n+'. '+L.REGIONS[s.region].blurb,'story'); }
L.nextRegion = nextRegion;
function endRun(s, why){ s.screen='end'; s.ended = { why:why, t:Date.now() }; return true; }
L.endRun = endRun;
function progress(s){ return (s.region*(COLS-1) + s.col) / (L.REGIONS.length*(COLS-1)); }
L.progress = progress;
})(typeof LRT!=='undefined'?LRT:(module.exports));
if (typeof module !== 'undefined' && typeof LRT !== 'undefined') module.exports = LRT;
