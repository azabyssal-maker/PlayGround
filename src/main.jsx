import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Download, Smartphone, Monitor, Globe2, ChevronRight, Play, Gamepad2, Menu, X, CircleUser } from 'lucide-react';
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
 const [menu,setMenu]=useState(false); const [search,setSearch]=useState(false); const [notice,setNotice]=useState('');
 const play=(title)=>{setNotice(`正在启动 ${title}`);setTimeout(()=>setNotice(''),2600)};
 return <main>
  <header className="nav">
   <button className="menu-button" onClick={()=>setMenu(v=>!v)}>{menu?<X/>:<Menu/>}</button>
   <div className="logo"><div className="logo-mark"><Gamepad2/></div><div><b>PLAY</b><span>HORIZON</span></div></div>
   <nav className={menu?'open':''}><a className="active">发现</a><a>游戏库</a><a>动态</a></nav>
   <div className="nav-right"><button className="search" onClick={()=>setSearch(v=>!v)}><Search/><span>搜索游戏</span></button><button className="profile"><CircleUser/></button></div>
  </header>
  {search&&<div className="searchbar"><Search/><input autoFocus placeholder="搜索游戏、开发者或分类"/><button onClick={()=>setSearch(false)}><X/></button></div>}

  <section className="hero">
   <Cover game={games[0]} big/> 
   <div className="hero-shade"/>
   <div className="hero-copy">
    <div className="eyebrow"><i/> 编辑推荐 · 即刻畅玩</div>
    <h1>CRIMSON<br/><em>CITY</em></h1>
    <p>在罪恶与自由交织的都市中，书写属于你的传奇。</p>
    <div className="chips"><span>开放世界</span><span>动作冒险</span><span>单人</span></div>
    <div className="hero-actions"><button className="play" onClick={()=>play('Crimson City')}><Play fill="currentColor"/> 立即游玩</button><button className="details">查看详情 <ChevronRight/></button></div>
   </div>
   <div className="hero-info"><div><span>玩家评分</span><b>9.4</b></div><div className="bars"><i/><i/><i/><i/><i/></div></div>
  </section>

  <section className="shelf"><div className="section-head"><div><span>精选推荐</span><h2>热门游戏</h2></div><button>全部游戏 <ChevronRight/></button></div>
   <div className="game-grid">{games.slice(1).map((g,i)=><article className="game-card" key={g.title} onClick={()=>play(g.title)}>
    <div className="card-art"><Cover game={g}/><div className="tag">{g.tag}</div><button className="card-play"><Play fill="currentColor"/></button></div>
    <div className="card-info"><div><h3>{g.title}</h3><span>{g.meta}</span></div><b>{g.rating}</b></div>
   </article>)}</div>
  </section>

  <section className="devices"><div className="device-copy"><span>云端畅玩</span><h2>从你的设备，<br/><em>随时出发</em></h2><p>无需下载，无需等待。跨设备保存进度，一次订阅，处处可玩。</p></div><div className="device-icons"><div><Monitor/><b>电脑</b></div><div><Smartphone/><b>手机</b></div><div><Globe2/><b>浏览器</b></div></div></section>
  {notice&&<div className="toast"><div className="spinner"/><span>{notice}</span></div>}
 </main>
}

createRoot(document.getElementById('root')).render(<App/>);
