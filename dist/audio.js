const notes=[0,2,4,7,9,12,14,16];
const patterns=[[0,4,2,5,4,2,1,2],[3,5,4,6,5,4,2,3],[2,4,6,5,4,2,1,0],[1,3,5,4,3,1,0,2]];
const frequency=(root,step)=>root*2**(step/12);

export class Sound {
  constructor(options){
    this.options=options;
    this.cooldowns=new Map();
    this.beat=0;
  }
  async awake(){
    if(!this.options.sound) return;
    try {
      const BrowserAudio=window.AudioContext||window.webkitAudioContext;
      if(!BrowserAudio) return;
      if(!this.ctx){
        this.ctx=new BrowserAudio();
        this.musicBus=this.ctx.createGain();
        this.fxBus=this.ctx.createGain();
        this.volume=this.ctx.createGain();
        this.musicBus.gain.value=.22;
        this.fxBus.gain.value=.63;
        this.volume.gain.value=.35;
        this.musicBus.connect(this.volume);
        this.fxBus.connect(this.volume);
        this.volume.connect(this.ctx.destination);
        this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*.26,this.ctx.sampleRate);
        const samples=this.noise.getChannelData(0);
        for(let i=0;i<samples.length;i++) samples[i]=(Math.random()*2-1)*(1-i/samples.length);
      }
      if(this.ctx.state==='suspended') await this.ctx.resume();
    } catch {
      return;
    }
  }
  sync(){
    if(!this.ctx) return;
    const t=this.ctx.currentTime;
    this.volume.gain.setTargetAtTime(this.options.sound ? .35 : 0,t,.035);
    this.musicBus.gain.setTargetAtTime(this.options.music ? .22 : 0,t,.07);
  }
  tone(freq,end,duration,strength,type='sine',when=this.ctx.currentTime,bus=this.fxBus){
    const oscillator=this.ctx.createOscillator();
    const envelope=this.ctx.createGain();
    oscillator.frequency.setValueAtTime(freq,when);
    oscillator.frequency.exponentialRampToValueAtTime(end,when+duration);
    oscillator.type=type;
    envelope.gain.setValueAtTime(.0001,when);
    envelope.gain.exponentialRampToValueAtTime(strength,when+.012);
    envelope.gain.exponentialRampToValueAtTime(.0001,when+duration);
    oscillator.connect(envelope);
    envelope.connect(bus);
    oscillator.start(when);
    oscillator.stop(when+duration+.015);
  }
  burst(freq,duration,strength,style='lowpass'){
    const when=this.ctx.currentTime;
    const source=this.ctx.createBufferSource();
    const filter=this.ctx.createBiquadFilter();
    const envelope=this.ctx.createGain();
    source.buffer=this.noise;
    filter.type=style;
    filter.frequency.setValueAtTime(freq,when);
    filter.Q.value=style==='bandpass'?1.1:.6;
    envelope.gain.setValueAtTime(strength,when);
    envelope.gain.exponentialRampToValueAtTime(.0001,when+duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.fxBus);
    source.start(when);
    source.stop(when+duration);
  }
  play(event){
    if(!this.options.sound||this.ctx?.state!=='running') return;
    let {type}=event;
    if(type==='attack-start'){
      if(!['tail','sweep','claw','dive','pounce'].includes(event.attack.kind)) return;
      type='windup';
    }
    if(type==='impact') type=event.attack.kind;
    const when=this.ctx.currentTime;
    const interval={pop:.036,stomp:.11,tail:.10,deflect:.15,roar:.16,breath:.13,windup:.12}[type]||.06;
    if(when-(this.cooldowns.get(type)??-1)<interval) return;
    this.cooldowns.set(type,when);
    const pitch=.79+Math.random()*.49;
    if(type==='pop'){
      const big=event.enemy.def.airship;
      this.tone((big?232:630)*pitch,(big?58:195)*pitch,big ? .19 : .072,big ? .35 : .16,'sine');
      this.burst(big?510:1900,big ? .21 : .038,big ? .35 : .10);
    }
    if(type==='deflect'){
      this.tone(1750*pitch,1480*pitch,.145,.11,'triangle');
      this.tone(2630*pitch,2620*pitch,.11,.045);
    }
    if(type==='stomp'||type==='tail'||type==='pounce'||type==='dive'){
      const heavy=type==='stomp'||type==='tail';
      this.tone((heavy?139:228)*pitch,heavy?43:89,heavy?.19:.086,heavy?.24:.11,'triangle');
      this.burst(heavy?380:930,heavy?.18:.07,heavy?.32:.12);
    }
    if(type==='bite'){
      this.tone(390*pitch,220*pitch,.058,.085,'triangle');
      this.burst(1460,.047,.13,'bandpass');
    }
    if(type==='sweep'||type==='claw') this.burst(1700*pitch,.08,.14,'bandpass');
    if(type==='roar'){
      this.tone(178*pitch,96*pitch,.20,.105,'sawtooth');
      this.burst(605,.18,.16,'bandpass');
    }
    if(type==='spit'||type==='breath'){
      const frozen=event.stats.style==='frost';
      this.burst((frozen?3030:1090)*pitch,.14,.12,'bandpass');
    }
    if(type==='windup') this.burst(930*pitch,.05,.085,'bandpass');
    if(['build','upgrade','complete','ability','item'].includes(type)){
      const rise=type==='upgrade'?1.25:1;
      this.tone(446*rise,439*rise,.12,.16,'triangle');
      this.tone(650*rise,649*rise,.16,.10,'sine',when+.075);
    }
    if(type==='clear') this.burst(700,.15,.24);
    if(type==='leak') this.tone(220,78,.24,.22,'triangle');
    if(type==='wave') this.tone(310,195,.21,.16,'triangle');
    if(type==='end'){
      const phrase=event.won?[392,494,587,784]:[415,349,261];
      phrase.forEach((note,i)=>this.tone(note,note*.997,.55,.14,'triangle',when+i*.115));
    }
  }
  update(game){
    if(!this.options.sound||!this.options.music||this.ctx?.state!=='running') return;
    const now=this.ctx.currentTime;
    if(!this.nextBeat||now>this.nextBeat+.45) this.nextBeat=now+.045;
    const active=game.phase==='battle';
    const spacing=active?Math.max(.20,.29-game.wave*.0035):.43;
    while(this.nextBeat<now+.11){
      const index=this.beat%8;
      const pattern=patterns[Math.floor(this.beat/8)%patterns.length];
      const note=frequency(261.63,notes[pattern[index]]);
      if(active||index%3!==2) this.tone(note,note*.994,spacing*1.8,active ? .08 : .056,'sine',this.nextBeat,this.musicBus);
      if(index%4===0){
        const bass=frequency(130.81,notes[pattern[0]]);
        this.tone(bass,bass*.997,spacing*3.5,.15,'triangle',this.nextBeat,this.musicBus);
      }
      if(active&&index%4===2) this.tone(131,54,.085,.085,'sine',this.nextBeat,this.musicBus);
      this.nextBeat+=spacing;
      this.beat++;
    }
  }
}
