// The Last Road Trip — all sound is synthesized live with WebAudio (no samples, nothing to license)
var AU = (function(){
  var ctx=null, master=null, musicBus=null, sfxBus=null, muted = localStorage.getItem('lrt_mute')==='1';
  var mode=null, timer=null, step=0, nextT=0;
  function init(){ if (ctx) { if (ctx.state==='suspended') ctx.resume(); return; }
    var C = window.AudioContext||window.webkitAudioContext; if(!C) return; ctx=new C();
    master=ctx.createGain(); master.gain.value = muted?0:0.9; master.connect(ctx.destination);
    var comp=ctx.createDynamicsCompressor(); comp.connect(master);
    musicBus=ctx.createGain(); musicBus.gain.value=0.32; musicBus.connect(comp);
    sfxBus=ctx.createGain(); sfxBus.gain.value=0.7; sfxBus.connect(comp);
    if (mode) startLoop();
  }
  function noiseBuf(){ var b=ctx.createBuffer(1,ctx.sampleRate*0.5,ctx.sampleRate), d=b.getChannelData(0); for (var i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; }
  var NB=null;
  function tone(f,t,dur,type,vol,bus,slide){ var o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||'triangle'; o.frequency.setValueAtTime(f,t); if (slide) o.frequency.exponentialRampToValueAtTime(slide,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||0.2,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(bus||sfxBus); o.start(t); o.stop(t+dur+0.05); }
  function noise(t,dur,vol,freq,bus,q){ if(!NB) NB=noiseBuf(); var s=ctx.createBufferSource(); s.buffer=NB; var f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq||3000; f.Q.value=q||1; var g=ctx.createGain(); g.gain.setValueAtTime(vol||0.2,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(bus||sfxBus); s.start(t); s.stop(t+dur+0.02); }
  var N = function(n){ return 440*Math.pow(2,(n-69)/12); };
  // songs: chords as midi roots + quality, bpm
  var SONGS = {
    title:{ bpm:78, prog:[[57,'m'],[53,'M'],[60,'M'],[55,'M']], lead:[76,null,74,null,72,null,69,null,72,null,74,null,76,null,null,null], swing:0.1, drums:0, arp:12, lw:'sine' },
    road:{ bpm:92, prog:[[60,'M'],[67,'M'],[69,'m'],[65,'M']], lead:[76,null,74,null,72,null,null,null,74,null,76,null,79,null,null,null], swing:0.12, drums:1, arp:12, lw:'sine' },
    camp:{ bpm:70, prog:[[65,'M'],[60,'M'],[62,'m'],[58,'M']], lead:[77,null,null,null,72,null,null,null,74,null,null,null,69,null,null,null], swing:0.1, drums:0, arp:0, lw:'sine' },
    tense:{ bpm:100, prog:[[57,'m'],[53,'M'],[55,'M'],[52,'m']], lead:[69,null,null,72,null,null,71,null,null,null,67,null,null,null,null,null], swing:0, drums:0, arp:0, lw:'triangle' },
    finale:{ bpm:84, prog:[[60,'M'],[65,'M'],[67,'M'],[60,'M']], lead:[72,76,79,null,79,76,77,null,81,79,76,null,74,null,72,null], swing:0.06, drums:0, arp:12, lw:'sine' },
    t_blue:{ bpm:96, prog:[[62,'m'],[67,'M'],[60,'M'],[65,'M']], lead:[74,null,77,null,76,null,74,null,72,null,74,null,69,null,null,null], swing:0.14, drums:1, arp:12, lw:'triangle' },
    t_brass:{ bpm:108, prog:[[58,'M'],[65,'M'],[63,'M'],[67,'m']], lead:[70,70,null,72,74,null,72,null,70,null,67,null,70,null,null,null], swing:0.18, drums:1, arp:0, lw:'square' },
    t_slow:{ bpm:66, prog:[[64,'m'],[60,'M'],[67,'M'],[62,'M']], lead:[79,null,null,76,null,null,74,null,null,72,null,null,71,null,null,null], swing:0.08, drums:0, arp:12, lw:'sine' },
    t_wide:{ bpm:88, prog:[[57,'M'],[62,'M'],[64,'m'],[57,'M']], lead:[73,null,76,null,81,null,80,null,76,null,73,null,76,null,null,null], swing:0.04, drums:1, arp:12, lw:'triangle' },
    t_neon:{ bpm:112, prog:[[57,'m'],[65,'M'],[60,'M'],[67,'M']], lead:[69,null,72,null,76,null,72,null,69,null,71,null,72,74,76,null], swing:0, drums:1, arp:12, lw:'square' },
    t_last:{ bpm:80, prog:[[60,'M'],[69,'m'],[65,'M'],[67,'M']], lead:[79,null,76,null,72,null,76,null,79,null,81,null,79,null,null,null], swing:0.05, drums:0, arp:12, lw:'sine' },
  };
  function chord(root,q){ return q==='m'?[root,root+3,root+7]:[root,root+4,root+7]; }
  function sched(){
    var S=SONGS[mode]; if(!S||!ctx) return; var spb=60/S.bpm/2; // 8th notes
    while (nextT < ctx.currentTime + 0.25){
      var bar=Math.floor(step/8)%S.prog.length, b8=step%8, ch=chord(S.prog[bar][0],S.prog[bar][1]);
      var t=nextT + ((step%2)?S.swing*spb:0);
      // bass
      if (b8===0||b8===4) tone(N(ch[0]-24),t,spb*1.8,'triangle',0.30,musicBus);
      // arpeggio pluck
      var arp=[0,1,2,1,0,2,1,2][b8]; tone(N(ch[arp]+(S.arp||0)),t,spb*1.6,'triangle',0.07,musicBus);
      // lead melody on alternate passes
      var ln=S.lead[(step)%16]; if (ln && (Math.floor(step/16)%2===1 || mode==='finale' || mode==='title')) tone(N(ln),t,spb*1.7,S.lw||'sine',S.lw==='square'?0.05:0.11,musicBus);
      if (S.drums){ if (b8%4===0) tone(110,t,0.18,'sine',0.28,musicBus,40); if (b8===2||b8===6) noise(t,0.1,0.07,1800,musicBus,0.7); }
      else if (b8===0) noise(t,0.3,0.025,5000,musicBus,0.5);
      step++; nextT += spb;
    }
  }
  function startLoop(){ if (!ctx) return; if (timer) clearInterval(timer); step=0; nextT=ctx.currentTime+0.08; timer=setInterval(sched,60); }
  function music(m){ if (m===mode) return; mode=m; if (ctx){ musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setValueAtTime(0,ctx.currentTime); musicBus.gain.linearRampToValueAtTime(0.32,ctx.currentTime+0.6); startLoop(); } }
  var FX = {
    tap:function(t){ tone(900,t,0.04,'triangle',0.07); },
    soft:function(t){ tone(620,t,0.06,'sine',0.07); },
    drive:function(t){ for (var i=0;i<7;i++) noise(t+i*0.11,0.14,0.10,170+i*22,sfxBus,2); tone(62,t,0.8,'sawtooth',0.05,sfxBus,110); tone(523,t+0.78,0.12,'triangle',0.08); },
    thud:function(t){ noise(t,0.12,0.4,500,sfxBus,0.8); tone(110,t,0.18,'sine',0.25,sfxBus,45); },
    honk:function(t){ tone(392,t,0.28,'square',0.09,sfxBus); tone(311,t,0.28,'square',0.09,sfxBus); },
    calm:function(t){ [72,76,79].forEach(function(n,i){ tone(N(n),t+i*0.09,0.5,'sine',0.09); }); },
    bark:function(t){ tone(520,t,0.09,'sawtooth',0.14,sfxBus,260); noise(t,0.08,0.18,1500,sfxBus,2); tone(560,t+0.16,0.1,'sawtooth',0.14,sfxBus,280); },
    sniff:function(t){ for (var i=0;i<4;i++) noise(t+i*0.08,0.06,0.12,3500,sfxBus,3); },
    open:function(t){ noise(t,0.25,0.2,600,sfxBus,1); tone(330,t,0.1,'triangle',0.1); tone(440,t+0.08,0.12,'triangle',0.1); },
    coin:function(t){ tone(988,t,0.07,'square',0.05); tone(1319,t+0.07,0.2,'square',0.05); },
    find:function(t){ [76,81,88].forEach(function(n,i){ tone(N(n),t+i*0.07,0.3,'triangle',0.1); }); },
    miss:function(t){ noise(t,0.1,0.06,3000,sfxBus,3); },
    win:function(t){ [60,64,67,72,76,79].forEach(function(n,i){ tone(N(n),t+i*0.09,0.5,'triangle',0.1); }); },
    lose:function(t){ [64,62,60,57].forEach(function(n,i){ tone(N(n),t+i*0.22,0.5,'triangle',0.1); }); },
    up:function(t){ [60,64,67,72,76].forEach(function(n,i){ tone(N(n),t+i*0.06,0.25,'triangle',0.08); }); tone(N(84),t+0.3,0.5,'sine',0.1); },
    lamp:function(t){ [67,74,79,86].forEach(function(n,i){ tone(N(n),t+i*0.14,0.9,'sine',0.1); tone(N(n-12),t+i*0.14,0.7,'triangle',0.05); }); },
    photo:function(t){ noise(t,0.05,0.2,6000,sfxBus,3); noise(t+0.08,0.2,0.1,1200,sfxBus,1); },
    tow:function(t){ tone(196,t,0.3,'sawtooth',0.07,sfxBus,150); tone(147,t+0.35,0.5,'sawtooth',0.07,sfxBus,120); },
    swipe:function(t){ noise(t,0.08,0.09,2200,sfxBus,1.5); },
    wrench:function(t){ tone(1300,t,0.05,'square',0.05); tone(900,t+0.1,0.05,'square',0.05); tone(1300,t+0.2,0.06,'square',0.05); },
    r3:function(t){ [523,659,784,1047,1319].forEach(function(f,i){ tone(f,t+i*0.07,0.4,'triangle',0.1); }); },
  };
  function sfx(n){ if (!ctx || muted) return; var f=FX[n]; if (f) f(ctx.currentTime+0.01); }
  function setMute(m){ muted=m; localStorage.setItem('lrt_mute',m?'1':'0'); if (master) master.gain.value = m?0:0.9; }
  return { init:init, music:music, sfx:sfx, setMute:setMute, get muted(){ return muted; } };
})();
