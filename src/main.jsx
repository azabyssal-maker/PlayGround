import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Download, Smartphone, Monitor, Globe2, ChevronRight, Play, Gamepad2, Menu, X, CircleUser, Maximize2, Link2, Wifi, Unplug } from 'lucide-react';
import './styles.css';

const games = [
  { title:'CRIMSON CITY', tag:'OPEN WORLD', meta:'ACTION', rating:'9.4', accent:'#e9a12e', art:'gta', featured:true },
  { title:'NEON VELOCITY', tag:'NEW RELEASE', meta:'RACING', rating:'9.1', accent:'#a76cff', art:'race' },
  { title:'VOID EXODUS', tag:'TOP 10', meta:'SCI-FI RPG', rating:'9.3', accent:'#65b9ff', art:'void' },
  { title:'SHADOW PROTOCOL', tag:'NEW', meta:'STEALTH', rating:'8.9', accent:'#d9b95d', art:'shadow' },
  { title:'IRON FRONTIER', tag:'POPULAR', meta:'SURVIVAL', rating:'8.7', accent:'#f06a4f', art:'iron' },
  { title:'SKYLINE RUN', tag:'TRENDING', meta:'ARCADE', rating:'8.8', accent:'#52d8db', art:'sky' }
];

function Cover({game, big=false}) {
  return <div className={`cover ${game.art} ${big?'big':''}`}>
    <div className="cover-noise"/><div className="cover-glow"/>
    {game.art==='gta'&&<><div className="city sun"/><div className="hero-silhouette"/><div className="car-silhouette"/><div className="cover-title">CRIMSON<br/><b>CITY</b></div></>}
    {game.art==='race'&&<><div className="speed-lines"/><div className="race-car"/><div className="cover-title mini">NEON<br/><b>VELOCITY</b></div></>}
    {game.art==='void'&&<><div className="planet"/><div className="astronaut"/><div className="cover-title mini">VOID<br/><b>EXODUS</b></div></>}
    {game.art==='shadow'&&<><div className="moon"/><div className="shadow-agent"/><div className="cover-title mini">SHADOW<br/><b>PROTOCOL</b></div></>}
    {game.art==='iron'&&<><div className="desert"/><div className="mech"/><div className="cover-title mini">IRON<br/><b>FRONTIER</b></div></>}
    {game.art==='sky'&&<><div className="skyline"/><div className="glider"/><div className="cover-title mini">SKYLINE<br/><b>RUN</b></div></>}
  </div>
}

function App(){
 const [menu,setMenu]=useState(false), [search,setSearch]=useState(false), [notice,setNotice]=useState('');
 const [launcher,setLauncher]=useState(null), [gateway,setGateway]=useState(''), [session,setSession]=useState(null), [controller,setController]=useState(false);
 const pollRef=useRef(null);

 useEffect(()=>()=>{if(pollRef.current)clearInterval(pollRef.current)},[]);

 const flash=(text)=>{setNotice(text);window.clearTimeout(window.__flash);window.__flash=setTimeout(()=>setNotice(''),3000)};
 const openLauncher=(title)=>setLauncher({title});
 const pollGateway=async(base,id)=>{
   try {
     const r=await fetch(`${base.replace(/\/$/,'')}/sessions/${id}`); if(!r.ok) throw new Error('状态接口不可用');
     const data=await r.json(); setSession(s=>({...s,status:data.status||'unknown',message:data.message||''}));
     if(['connected','ready','running'].includes(String(data.status).toLowerState?.()||String(data.status).toLowerCase())) flash('云会话已连接');
   } catch(e){setSession(s=>s?{...s,status:'unavailable',message:e.message}:s)}
 };
 const start=async(source)=>{
   if(source==='xbox'){window.open('https://www.xbox.com/en-us/play/games/grand-theft-auto-v/bxcdkg72gqc4','_blank','noopener,noreferrer');flash('已打开 Xbox 官方授权入口');setLauncher(null);return}
   if(source==='boosteroid'){window.open('https://boosteroid.com','_blank','noopener,noreferrer');flash('已打开 Boosteroid 授权云服务');setLauncher(null);return}
   const base=gateway.trim().replace(/\/$/,'');
   if(!base){flash('请输入 Moonlight 网关地址');return}
   try{
     const r=await fetch(`${base}/sessions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game:launcher.title})});
     if(!r.ok)throw new Error(`网关创建失败（${r.status}）`);
     const data=await r.json(); if(!data.id)throw new Error('网关未返回会话 ID');
     setSession({id:data.id,status:'creating',streamUrl:data.streamUrl||null,message:'会话已创建，正在轮询状态'});
     if(pollRef.current)clearInterval(pollRef.current);pollRef.current=setInterval(()=>pollGateway(base,data.id),1500);
     setLauncher(null);setController(true);
   }catch(e){flash(e.message)}
 };
 const disconnect=async()=>{
   if(pollRef.current)clearInterval(pollRef.current);
   if(session?.id&&gateway){try{await fetch(`${gateway.replace(/\/$/,'')}/sessions/${session.id}`,{method:'DELETE'})}catch{}}
   setSession(null);setController(false);flash('已断开云会话');
 };
 const fullscreen=async()=>{const el=document.getElementById('stream-stage');try{if(el.requestFullscreen)await el.requestFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch{flash('浏览器阻止了全屏请求')}};

 return <main>
  <header className="nav">
   <button className="menu-button" onClick={()=>setMenu(v=>!v)}>{menu?<X/>:<Menu/>}</button>
   <div className="logo"><div className="logo-mark"><Gamepad2/></div><div><b>PLAY</b><span>HORIZON</span></div></div>
   <nav className={menu?'open':''}><a className="active">发现</a><a>游戏库</a><a>动态</a></nav>
   <div className="nav-right"><button className="search" onClick={()=>setSearch(v=>!v)}><Search/><span>搜索游戏</span></button><button className="profile"><CircleUser/></button></div>
  </header>
  {search&&<div className="searchbar"><Search/><input autoFocus placeholder="搜索游戏、开发者或分类"/><button onClick={()=>setSearch(false)}><X/></button></div>}

  {session&&<section className="stream-stage" id="stream-stage">
   {session.streamUrl?<iframe title="云游戏串流" src={session.streamUrl} allow="fullscreen; autoplay"/>:<div className="stream-placeholder"><Wifi/><b>{session.status==='connected'||session.status==='running'?'串流已连接':'正在连接云会话'}</b><span>会话 {session.id} · {session.status}</span></div>}
   <div className="session-bar"><div><i className={session.status==='connected'?'live':''}/><b>授权工作台</b><span>{session.status}</span></div><button onClick={fullscreen}><Maximize2/> 全屏</button><button onClick={disconnect}><Unplug/> 断开</button></div>
   {controller&&<div className="touch-controls">
    <div className="joystick"><span/></div>
    <div className="triggers"><button>LT</button><button>RT</button></div>
    <div className="face"><button className="y">Y</button><button className="x">X</button><button className="b">B</button><button className="a">A</button></div>
    <div className="menu-controls"><button>MENU</button><button>+</button></div>
   </div>}
  </section>}

  <section className="hero">
   <Cover game={games[0]} big/> 
   <div className="hero-shade"/>
   <div className="hero-copy">
    <div className="eyebrow"><i/> 编辑推荐 · 浏览器串流工作台</div>
    <h1>CRIMSON<br/><em>CITY</em></h1>
    <p>在罪恶与自由交织的都市中，书写属于你的传奇。</p>
    <div className="chips"><span>开放世界</span><span>动作冒险</span><span>单人</span></div>
    <div className="hero-actions"><button className="play" onClick={()=>openLauncher('Crimson City')}><Play fill="currentColor"/> 选择授权来源</button><button className="details">查看详情 <ChevronRight/></button></div>
   </div>
   <div className="hero-info"><div><span>玩家评分</span><b>9.4</b></div><div className="bars"><i/><i/><i/><i/><i/></div></div>
  </section>

  <section className="shelf"><div className="section-head"><div><span>精选推荐</span><h2>热门游戏</h2></div><button>全部游戏 <ChevronRight/></button></div>
   <div className="game-grid">{games.slice(1).map((g,i)=><article className="game-card" key={g.title} onClick={()=>openLauncher(g.title)}>
    <div className="card-art"><Cover game={g}/><div className="tag">{g.tag}</div><button className="card-play"><Play fill="currentColor"/></button></div>
    <div className="card-info"><div><h3>{g.title}</h3><span>{g.meta}</span></div><b>{g.rating}</b></div>
   </article>)}</div>
  </section>

  <section className="devices"><div className="device-copy"><span>云端畅玩</span><h2>从你的设备，<br/><em>随时出发</em></h2><p>接入已授权账号或自建串流网关，在浏览器中建立真实会话。</p></div><div className="device-icons"><div><Monitor/><b>电脑</b></div><div><Smartphone/><b>手机</b></div><div><Globe2/><b>浏览器</b></div></div></section>

  {launcher&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setLauncher(null)}><div className="launcher"><button className="close-launcher" onClick={()=>setLauncher(null)}><X/></button><div className="launcher-mark"><Link2/></div><span>授权云入口</span><h2>{launcher.title}</h2><p>请选择已拥有账号或已部署的串流服务。平台不会伪造游戏启动状态。</p>
   <button className="source official" onClick={()=>start('xbox')}><b>Xbox 官方入口</b><span>需要 Xbox / Game Pass 授权账号</span><ChevronRight/></button>
   <button className="source" onClick={()=>start('boosteroid')}><b>Boosteroid</b><span>可使用 Steam、Epic、Rockstar 或 Microsoft 副本</span><ChevronRight/></button>
   <label className="gateway-label">自建 / Moonlight 浏览器网关<b>网关地址</b><input value={gateway} onChange={e=>setGateway(e.target.value)} placeholder="https://stream.example.com"/><button onClick={()=>start('gateway')}><Wifi/> 创建真实会话</button></label>
  </div></div>}
  {notice&&<div className="toast"><div className="spinner"/><span>{notice}</span></div>}
 </main>
}

createRoot(document.getElementById('root')).render(<App/>);
