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
    road:{ bpm:112, prog:[[60,'M'],[67,'M'],[69,'m'],[65,'M']], lead:[76,74,72,74,76,76,76,null,74,74,74,null,76,79,79,null], swing:0.12 },
    fight:{ bpm:138, prog:[[57,'m'],[53,'M'],[55,'M'],[52,'M']], lead:[69,null,72,69,71,null,67,null,69,72,76,74,72,null,71,null], swing:0 },
    calm:{ bpm:84, prog:[[65,'M'],[60,'M'],[62,'m'],[58,'M']], lead:[77,null,76,null,72,null,null,null,74,null,72,null,69,null,null,null], swing:0.1 },
    win:{ bpm:120, prog:[[60,'M'],[65,'M'],[67,'M'],[60,'M']], lead:[72,76,79,84,79,76,77,81,84,81,79,83,86,83,84,null], swing:0.08 },
  };
  function chord(root,q){ return q==='m'?[root,root+3,root+7]:[root,root+4,root+7]; }
  function sched(){
    var S=SONGS[mode]; if(!S||!ctx) return; var spb=60/S.bpm/2; // 8th notes
    while (nextT < ctx.currentTime + 0.25){
      var bar=Math.floor(step/8)%S.prog.length, b8=step%8, ch=chord(S.prog[bar][0],S.prog[bar][1]);
      var t=nextT + ((step%2)?S.swing*spb:0);
      // bass
      if (b8===0||b8===4) tone(N(ch[0]-24),t,spb*1.8,'triangle',0.32,musicBus);
      if (mode==='fight' && (b8===2||b8===6)) tone(N(ch[0]-12),t,spb*0.8,'square',0.07,musicBus);
      // arpeggio pluck
      var arp=[0,1,2,1,0,2,1,2][b8]; tone(N(ch[arp]+(mode==='calm'?0:12)),t,spb*1.6,'triangle',mode==='calm'?0.09:0.07,musicBus);
      // lead melody every other bar loop
      var ln=S.lead[(step)%16]; if (ln && (Math.floor(step/16)%2===1 || mode==='win')) tone(N(ln),t,spb*1.7,'sine',0.11,musicBus);
      // drums
      if (mode!=='calm'){ if (b8%4===0) tone(110,t,0.18,'sine',0.35,musicBus,40); if (b8===2||b8===6) noise(t,0.12,0.12,1800,musicBus,0.7); noise(t,0.04,0.05,8000,musicBus,1); }
      else if (b8===0) noise(t,0.3,0.03,5000,musicBus,0.5);
      step++; nextT += spb;
    }
  }
  function startLoop(){ if (!ctx) return; if (timer) clearInterval(timer); step=0; nextT=ctx.currentTime+0.08; timer=setInterval(sched,60); }
  function music(m){ if (m===mode) return; mode=m; if (ctx){ musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setValueAtTime(0,ctx.currentTime); musicBus.gain.linearRampToValueAtTime(0.32,ctx.currentTime+0.6); startLoop(); } }
  var FX = {
    tap:function(t){ tone(900,t,0.05,'square',0.05); },
    drive:function(t){ for (var i=0;i<6;i++) noise(t+i*0.09,0.12,0.12,180+i*25,sfxBus,2); tone(70,t,0.6,'sawtooth',0.06,sfxBus,120); tone(523,t+0.55,0.12,'square',0.06); tone(659,t+0.68,0.18,'square',0.06); },
    hit:function(t){ noise(t,0.12,0.4,900,sfxBus,0.8); tone(180,t,0.12,'square',0.12,sfxBus,60); },
    crit:function(t){ noise(t,0.2,0.5,1200,sfxBus,0.6); tone(880,t,0.15,'square',0.12,sfxBus,1760); tone(220,t,0.2,'square',0.15,sfxBus,55); },
    miss:function(t){ noise(t,0.18,0.15,4000,sfxBus,3); },
    hurt:function(t){ tone(300,t,0.25,'sawtooth',0.14,sfxBus,90); },
    bark:function(t){ tone(520,t,0.09,'sawtooth',0.18,sfxBus,260); noise(t,0.08,0.2,1500,sfxBus,2); tone(560,t+0.16,0.1,'sawtooth',0.18,sfxBus,280); noise(t+0.16,0.08,0.2,1500,sfxBus,2); },
    open:function(t){ noise(t,0.25,0.2,600,sfxBus,1); tone(330,t,0.1,'triangle',0.1); tone(440,t+0.08,0.12,'triangle',0.1); },
    r0:function(t){ tone(523,t,0.15,'triangle',0.12); },
    r1:function(t){ tone(523,t,0.12,'triangle',0.12); tone(659,t+0.08,0.18,'triangle',0.12); },
    r2:function(t){ [523,659,784].forEach(function(f,i){ tone(f,t+i*0.07,0.22,'triangle',0.13); }); },
    r3:function(t){ [523,659,784,1047,1319].forEach(function(f,i){ tone(f,t+i*0.07,0.4,'triangle',0.13); tone(f*2,t+i*0.07,0.3,'sine',0.05); }); },
    coin:function(t){ tone(988,t,0.08,'square',0.07); tone(1319,t+0.07,0.22,'square',0.07); },
    scrap:function(t){ noise(t,0.15,0.25,2500,sfxBus,4); tone(200,t,0.08,'square',0.05,sfxBus,100); },
    ko:function(t){ tone(440,t,0.12,'square',0.08); tone(330,t+0.1,0.12,'square',0.08); tone(220,t+0.2,0.3,'square',0.08,sfxBus,110); },
    win:function(t){ [60,64,67,72,67,72].forEach(function(n,i){ tone(N(n+12),t+i*0.1,0.3,'square',0.07); }); },
    lose:function(t){ [67,66,65,64].forEach(function(n,i){ tone(N(n),t+i*0.25,0.4,'triangle',0.12); }); },
    heal:function(t){ [72,76,79].forEach(function(n,i){ tone(N(n),t+i*0.06,0.3,'sine',0.1); }); },
    up:function(t){ [60,64,67,72,76].forEach(function(n,i){ tone(N(n),t+i*0.05,0.2,'square',0.06); }); tone(N(84),t+0.28,0.4,'triangle',0.1); },
    sv:function(t){ [79,83,86,91].forEach(function(n,i){ tone(N(n),t+i*0.09,0.5,'sine',0.1); tone(N(n-12),t+i*0.09,0.4,'triangle',0.05); }); },
    swing:function(t){ noise(t,0.1,0.15,2500,sfxBus,1.5); },
    howl:function(t){ tone(400,t,0.9,'sine',0.12,sfxBus,700); },
    fire:function(t){ noise(t,0.5,0.35,500,sfxBus,0.5); },
    hiss:function(t){ noise(t,0.5,0.12,6000,sfxBus,6); },
  };
  function sfx(n){ if (!ctx || muted) return; var f=FX[n]; if (f) f(ctx.currentTime+0.01); }
  function setMute(m){ muted=m; localStorage.setItem('lrt_mute',m?'1':'0'); if (master) master.gain.value = m?0:0.9; }
  return { init:init, music:music, sfx:sfx, setMute:setMute, get muted(){ return muted; } };
})();
