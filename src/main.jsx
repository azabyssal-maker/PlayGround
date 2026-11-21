import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Volume2, VolumeX, RotateCcw, Pause, Play } from 'lucide-react';
import './styles.css';

const W = 960, H = 600;

function App() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [phase, setPhase] = useState('menu');
  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState({score:0,energy:100,combo:1,speed:1});

  const start = () => {
    stateRef.current = createState();
    setPhase('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let last = performance.now();

    function loop(now) {
      const dt = Math.min((now-last)/1000, .032); last=now;
      const s=stateRef.current;
      if (s && phase==='playing') update(s,dt,setPhase,setHud);
      draw(ctx,s,phase);
      raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    const down=e=>{
      if(['ArrowLeft','a','A'].includes(e.key)) stateRef.current&&(stateRef.current.left=true);
      if(['ArrowRight','d','D'].includes(e.key)) stateRef.current&&(stateRef.current.right=true);
      if(e.code==='Space') { e.preventState?.(); }
      if(e.key==='Escape'&&phase==='playing') setPhase('paused');
    };
    const up=e=>{
      if(['ArrowLeft','a','A'].includes(e.key)&&stateRef.current) stateRef.current.left=false;
      if(['ArrowRight','d','D'].includes(e.key)&&stateRef.current) stateRef.current.right=false;
    };
    addEventListener('keydown',down); addEventListener('keyup',up);
    return ()=>{removeEventListener('keydown',down);removeEventListener('keyup',up)};
  },[phase]);

  const steer=(dir,on)=>{if(stateRef.current)stateRef.current[dir]=on};

  return <main>
    <canvas ref={canvasRef} width={W} height={H} />
    <header>
      <div className="brand"><div className="mark">S</div><div><b>SKYLINE</b><span>DRIFT</span></div></div>
    </header>
    <div className="top-actions"><button aria-label="Toggle sound" onClick={()=>setMuted(v=>!v)}>{muted?<VolumeX/>:<Volume2/>}</button></div>
    {phase!=='menu'&&<div className="hud">
      <div><span>DISTANCE</span><b>{hud.score.toString().padStart(5,'0')}<small> m</small></b></div>
      <div className="energy"><span>CORE ENERGY</span><div><i style={{width:`${hud.energy}%`}}/></div></div>
      <div><span>COMBO</span><b className="cyan">×{hud.combo}</b></div>
    </div>}
    {phase==='menu'&&<section className="overlay menu">
      <div className="eyebrow"><i/> NIGHT RUN // SECTOR 07</div>
      <h1>SKYLINE<br/><em>DRIFT</em></h1>
      <p>Outrun the storm. Own the skyline.</p>
      <button className="primary" onClick={start}>START RUN <span>→</span></button>
      <div className="controls"><b>A / D</b><span>or</span><b>← / →</b><span>to steer</span></div>
    </section>}
    {phase==='paused'&&<section className="overlay modal">
      <div className="modal-card"><div className="eyebrow">RUN SUSPENDED</div><h2>PAUSED</h2>
        <button className="primary" onClick={()=>setPhase('playing')}><Play/> RESUME</button>
        <button className="ghost" onClick={start}><RotateCcw/> RESTART</button>
      </div>
    </section>}
    {phase==='over'&&<section className="overlay modal">
      <div className="modal-card"><div className="eyebrow">SIGNAL LOST</div><h2>RUN ENDED</h2>
        <div className="result"><span>DISTANCE</span><b>{hud.score} m</b></div>
        <button className="primary" onClick={start}><RotateCcw/> RUN AGAIN</button>
      </div>
    </section>}
    {phase!=='menu'&&<div className="mobile-controls"><button onPointerDown={()=>steer('left',true)} onPointerUp={()=>steer('left',false)} onPointerLeave={()=>steer('left',false)}>←</button><button onPointerDown={()=>steer('right',true)} onPointerUp={()=>steer('right',false)} onPointerLeave={()=>steer('right',false)}>→</button></div>}
  </main>
}

function createState(){return{x:480, y:485, left:false,right:false,score:0,energy:100,combo:1,comboTime:0,speed:1,spawn:0,items:[],obstacles:[],stars:Array.from({length:90},()=>({x:Math.random()*W,y:Math.random()*H,s:Math.random()*1.5+.3,a:Math.random()})),shake:0}}

function update(s,dt,setPhase,setHud){
  s.speed=Math.min(2.25,1+s.score/900); s.score+=dt*70*s.speed;
  s.energy=Math.max(0,s.energy-dt*1.7);
  s.x+=(s.right?1:0-s.left?1:0)*260*dt;
  s.x=Math.max(230,Math.min(730,s.x));
  s.spawn-=dt;
  if(s.spawn<=0){
    s.spawn=Math.max(.38,1.05-s.score/1800);
    const lane=250+Math.random()*460;
    if(Math.random()<.62) s.obstacles.push({x:lane,y:-70,w:42,h:42,rot:Math.random()*6});
    else s.items.push({x:lane,y:-60,r:13,pulse:0});
  }
  s.comboTime-=dt;if(s.comboTime<=0)s.combo=1;
  s.obstacles.forEach(o=>{o.y+=210*s.speed*dt;o.rot+=dt*2});
  s.items.forEach(i=>{i.y+=210*s.speed*dt;i.pulse+=dt*5});
  s.obstacles=s.obstacles.filter(o=>o.y<H+70); s.items=s.items.filter(i=>i.y<H+60);
  for(const o of s.obstacles){if(Math.abs(o.x-s.x)<48&&Math.abs(o.y-s.y)<48){setPhase('over');return}}
  s.items=s.items.filter(i=>{const hit=Math.hypot(i.x-s.x,i.y-s.y)<38;if(hit){s.energy=Math.min(100,s.energy+15);s.combo=Math.min(9,s.combo+1);s.comboTime=2;s.score+=25*s.combo}return !hit});
  setHud({score:Math.floor(s.score),energy:s.energy,combo:s.combo,speed:s.speed});
}

function draw(ctx,s,phase){
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#07111d');sky.addColorStop(.55,'#102438');sky.addColorStop(1,'#1a4a62');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  if(s){s.stars.forEach(st=>{ctx.globalAlpha=.25+st.a*.65;ctx.fillStyle='#a8dfff';ctx.fillRect(st.x,st.y,st.s,st.s)});ctx.globalAlpha=1}
  ctx.fillStyle='rgba(6,14,25,.55)';
  for(let i=0;i<7;i++){const y=80+i*55;ctx.fillRect(0,y,210-i*18,42);ctx.fillRect(750+i*10,y,210-i*12,42)}
  ctx.save();ctx.beginPath();ctx.moveTo(185,H);ctx.lineTo(775,H);ctx.lineTo(625,0);ctx.lineTo(335,0);ctx.closePath();ctx.clip();
  const grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#122f43');grd.addColorStop(1,'#07131e');ctx.fillStyle=grd;ctx.fillRect(180,0,600,H);
  ctx.strokeStyle='rgba(99,217,255,.18)';ctx.lineWidth=1;
  for(let i=-5;i<12;i++){ctx.beginPath();ctx.moveTo(480+i*60,0);ctx.lineTo(480+i*150,H);ctx.stroke()}
  ctx.strokeStyle='rgba(99,217,255,.28)';
  for(let y=-((Date.now()/30)%70);y<H;y+=70){ctx.beginPath();ctx.moveTo(230+(y/H)*250,y);ctx.lineTo(730-(y/H)*250,y);ctx.stroke()}
  ctx.restore();
  ctx.strokeStyle='rgba(107,223,255,.75)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(335,0);ctx.lineTo(185,H);ctx.stroke();ctx.beginPath();ctx.moveTo(625,0);ctx.lineTo(775,H);ctx.stroke();
  ctx.fillStyle='rgba(76,204,255,.09)';ctx.fillRect(470,0,20,H);
  if(s&&phase!=='menu'){
    s.obstacles.forEach(o=>{ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rot);ctx.fillStyle='#0b1723';ctx.strokeStyle='#ff5967';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(24,20);ctx.lineTo(-24,20);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()});
    s.items.forEach(i=>{ctx.save();ctx.translate(i.x,i.y);ctx.rotate(i.pulse*.25);ctx.shadowBlur=20;ctx.shadowColor='#4edcff';ctx.fillStyle='#68dcff';ctx.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3-Math.PI/2,r=k%2?8:13;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.restore()});
    ctx.save();ctx.translate(s.x,s.y);ctx.shadowBlur=28;ctx.shadowColor='#55d9ff';ctx.fillStyle='#061421';ctx.strokeStyle='#83e8ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-32);ctx.lineTo(27,25);ctx.lineTo(10,18);ctx.lineTo(0,27);ctx.lineTo(-10,18);ctx.lineTo(-27,25);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#baf3ff';ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(9,9);ctx.lineTo(-9,9);ctx.closePath();ctx.fill();ctx.restore();
  }
}

createRoot(document.getElementById('root')).render(<App/>);
