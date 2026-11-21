import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Smartphone, Monitor, Globe2, ChevronRight, Play, Gamepad2, Menu, X, CircleUser, Maximize2, Link2, Wifi, Unplug, ExternalLink } from 'lucide-react';
import './styles.css';

const games = [
  { title:'GRAND THEFT AUTO V', tag:'官方云入口', meta:'动作冒险', rating:'云支持待核验', accent:'#e9a12e', art:'gtav', image:'/game-art/gtav-1.jpg', source:'Steam 官方商店画面 · Xbox 官方入口', sourceUrl:'https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/', featured:true },
  { title:'GARRY\'S MOD', tag:'官方商店', meta:'沙盒 / 创意', rating:'免费串流网关', accent:'#65b9ff', art:'garrysmod', image:'/game-art/garrysmod-1.jpg', source:'Steam 官方商店画面', sourceUrl:'https://store.steampowered.com/app/4000/Garrys_Mod/' },
  { title:'CYBERPUNK 2077', tag:'自有副本', meta:'角色扮演', rating:'需账号授权', accent:'#d9b95d', art:'cyberpunk', image:'/game-art/cyberpunk-1.jpg', source:'Steam 官方商店画面', sourceUrl:'https://store.steampowered.com/app/1091500/Cyberpunk_2077/' },
  { title:'ELDEN RING', tag:'自有副本', meta:'动作角色扮演', rating:'需账号授权', accent:'#f06a4f', art:'elden', image:'/game-art/elden-1.jpg', source:'Steam 官方商店画面', sourceUrl:'https://store.steampowered.com/app/1245620/ELDEN_RING/' },
  { title:'FORZA HORIZON 5', tag:'官方云入口', meta:'竞速', rating:'账号支持', accent:'#52d8db', art:'forza', image:'/game-art/forza-1.jpg', source:'Steam 官方商店画面 · Xbox 官方入口', sourceUrl:'https://store.steampowered.com/app/1551360/Forza_Horizon_5/' }
];

function Cover({game, big=false}) {
  return <div className={`cover real-art ${game.art} ${big?'big':''}`}>
    <img src={game.image} alt={`${game.title} 官方商店画面`}/>
    {big&&<a className="art-source" href={game.sourceUrl} target="_blank" rel="noreferrer">真实画面来源：{game.source}</a>}
  </div>
}

function App(){
 const [menu,setMenu]=useState(false), [search,setSearch]=useState(false), [notice,setNotice]=useState('');
 const [launcher,setLauncher]=useState(null), [gateway,setGateway]=useState(()=>localStorage.getItem('cloudGateway')||''), [session,setSession]=useState(null), [controller,setController]=useState(false);
 const [joystick,setJoystick]=useState({x:0,y:0}), [searchQuery,setSearchQuery]=useState(''), [navSection,setNavSection]=useState('发现'), [showAll,setShowAll]=useState(false);
 const filteredGames=games.filter(g=>`${g.title} ${g.meta} ${g.tag}`.toLowerCase().includes(searchQuery.trim().toLowerCase()));
 const pollRef=useRef(null), inputSocketRef=useRef(null), joystickRef=useRef(null);

 useEffect(()=>()=>{if(pollRef.current)clearInterval(pollRef.current);inputSocketRef.current?.close()},[]);

 const flash=(text)=>{setNotice(text);window.clearTimeout(window.__flash);window.__flash=setTimeout(()=>setNotice(''),3000)};
 const sendInput=(type,value={})=>{const socket=inputSocketRef.current;if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type,...value}))};
 const connectInput=(data)=>{inputSocketRef.current?.close();if(!data.inputUrl)return;try{const ws=new WebSocket(data.inputUrl);inputSocketRef.current=ws;ws.onopen=()=>sendInput('controller',{connected:true})}catch(e){flash('输入通道无法连接')}};
 const moveJoystick=(e)=>{const el=joystickRef.current;if(!el)return;const rect=el.getBoundingClientRect();const point=e.touches?.[0]||e;const dx=(point.clientX-(rect.left+rect.width/2))/(rect.width/2);const dy=(point.clientY-(rect.top+rect.height/2))/(rect.height/2);const x=Math.abs(dx)<.08?0:Math.max(-1,Math.min(1,dx));const y=Math.abs(dy)<.08?0:Math.max(-1,Math.min(1,dy));setJoystick({x,y});sendInput('axis',{axis:'left',x,y})};
 const stopJoystick=()=>{setJoystick({x:0,y:0});sendInput('axis',{axis:'left',x:0,y:0})};
 const sendButton=(button,pressed)=>sendInput('button',{button,pressed});
 const pressTrigger=(button,pressed)=>sendInput('trigger',{button,pressed,value:pressed?1:0});
 const selectNav=(name)=>{setNavSection(name);setMenu(false);if(name==='发现')window.scrollTo({top:0,behavior:'smooth'});if(name==='游戏库')document.querySelector('.shelf')?.scrollIntoView({behavior:'smooth'});if(name==='动态')document.querySelector('.devices')?.scrollIntoView({behavior:'smooth'})};
 const openLauncher=(title)=>setLauncher({title});
 const pollGateway=async(base,id)=>{
   try {
     const r=await fetch(`${base.replace(/\/$/,'')}/sessions/${id}`); if(!r.ok) throw new Error('状态接口不可用');
     const data=await r.json(); setSession(s=>({...s,status:data.status||'unknown',streamUrl:data.streamUrl||s.streamUrl,inputUrl:data.inputUrl||s.inputUrl,message:data.message||''}));
     if(data.inputUrl&&!inputSocketRef.current)connectInput(data);
     if(['connected','ready','running'].includes(String(data.status).toLowerCase())) flash('云会话已连接');
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
     localStorage.setItem('cloudGateway',base);
     setSession({id:data.id,status:'creating',streamUrl:data.streamUrl||null,inputUrl:data.inputUrl||null,message:'会话已创建，正在轮询状态'});
     connectInput(data);
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
   <nav className={menu?'open':''}>{['发现','游戏库','动态'].map(name=><a key={name} className={navSection===name?'active':''} onClick={()=>selectNav(name)}>{name}</a>) }</nav>
   <div className="nav-right"><button className="search" onClick={()=>setSearch(v=>!v)} aria-label="搜索游戏"><Search/><span>搜索游戏</span></button><button className="profile" onClick={()=>flash(gateway?'已保存 Moonlight 网关':'尚未配置授权网关')} aria-label="授权状态"><CircleUser/></button></div>
  </header>
  {search&&<div className="searchbar"><Search/><input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="搜索游戏、开发者或分类"/><button onClick={()=>{setSearch(false);setSearchQuery('')}} aria-label="关闭搜索"><X/></button></div>}

  {session&&<section className="stream-stage" id="stream-stage">
   {session.streamUrl?<iframe title="云游戏串流" src={session.streamUrl} allow="fullscreen; autoplay"/>:<div className="stream-placeholder"><Wifi/><b>{session.status==='connected'||session.status==='running'?'串流已连接':'正在连接云会话'}</b><span>会话 {session.id} · {session.status}</span></div>}
   <div className="session-bar"><div><i className={session.status==='connected'?'live':''}/><b>授权工作台</b><span>{session.status}</span></div><button onClick={fullscreen}><Maximize2/> 全屏</button><button onClick={disconnect}><Unplug/> 断开</button></div>
   {controller&&<div className="touch-controls">
    <div ref={joystickRef} className="joystick" onPointerDown={e=>{e.currentTarget.setPointerCapture?.(e.pointerId);moveJoystick(e)}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture?.(e.pointerId))moveJoystick(e)}} onPointerUp={stopJoystick} onPointerCancel={stopJoystick}><span style={{transform:`translate(${joystick.x*28}px,${joystick.y*28}px)`}}/></div>
    <div className="triggers"><button onPointerDown={()=>pressTrigger('LT',true)} onPointerUp={()=>pressTrigger('LT',false)} onPointerCancel={()=>pressTrigger('LT',false)}>LT</button><button onPointerDown={()=>pressTrigger('RT',true)} onPointerUp={()=>pressTrigger('RT',false)} onPointerCancel={()=>pressTrigger('RT',false)}>RT</button></div>
    <div className="face"><button className="y" onPointerDown={()=>sendInput('button',{button:'Y',pressed:true})} onPointerUp={()=>sendInput('button',{button:'Y',pressed:false})}>Y</button><button className="x" onPointerDown={()=>sendInput('button',{button:'X',pressed:true})} onPointerUp={()=>sendInput('button',{button:'X',pressed:false})}>X</button><button className="b" onPointerDown={()=>sendInput('button',{button:'B',pressed:true})} onPointerUp={()=>sendInput('button',{button:'B',pressed:false})}>B</button><button className="a" onPointerDown={()=>sendInput('button',{button:'A',pressed:true})} onPointerUp={()=>sendInput('button',{button:'A',pressed:false})}>A</button></div>
    <div className="menu-controls"><button onPointerDown={()=>sendButton('MENU',true)} onPointerUp={()=>sendButton('MENU',false)}>MENU</button><button onPointerDown={()=>sendButton('PLUS',true)} onPointerUp={()=>sendButton('PLUS',false)}>+</button></div>
   </div>}
  </section>}

  <section className="hero">
   <Cover game={games[0]} big/> 
   <div className="hero-shade"/>
   <div className="hero-copy">
    <div className="eyebrow"><i/> 编辑推荐 · 浏览器串流工作台</div>
    <h1>GRAND THEFT<br/><em>AUTO V</em></h1>
    <p>真实画面来自官方 Steam 商店；启动需通过 Xbox、已授权副本或已部署串流网关。</p>
    <div className="chips"><span>开放世界</span><span>动作冒险</span><span>单人</span></div>
    <div className="hero-actions"><button className="play" onClick={()=>openLauncher('GRAND THEFT AUTO V')}><Play fill="currentColor"/> 选择授权来源</button><button className="details" onClick={()=>window.open(games[0].sourceUrl,'_blank','noopener,noreferrer')}>查看官方画面 <ChevronRight/></button></div>
   </div>
   <div className="hero-info"><div><span>玩家评分</span><b>9.4</b></div><div className="bars"><i/><i/><i/><i/><i/></div></div>
  </section>

  <section className="shelf"><div className="section-head"><div><span>精选推荐</span><h2>热门游戏</h2></div><button onClick={()=>{setShowAll(v=>!v);setSearchQuery('')}}>{showAll?'收起':'全部游戏'} <ChevronRight/></button></div>
   <div className="game-grid">{(showAll?games.slice(0):searchQuery?filteredGames.slice(1):games.slice(1)).map((g,i)=><article className="game-card" key={g.title} onClick={()=>openLauncher(g.title)}>
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
