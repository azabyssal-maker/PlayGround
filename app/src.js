import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x02040d,.018);
const camera = new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,500);
const renderer = new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.toneMapping=THREE.ACESFilmicToneMapping; document.body.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x90ffff,0x09031c,1.5));
const sun=new THREE.DirectionalLight(0xffd3ff,2);sun.position.set(3,8,4);scene.add(sun);
camera.position.set(0,4,11); camera.lookAt(0,0,-10);

const tunnel=new THREE.Group();scene.add(tunnel);
for(let i=0;i<34;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(5+i*.01,5.08+i*.01,6),new THREE.MeshBasicMaterial({color:i%2?0x28124c:0x104b55,transparent:true,opacity:.28,side:THREE.DoubleSide,wireframe:true}));ring.position.z=-i*5;ring.rotation.z=i*.08;tunnel.add(ring)}
const starsGeo=new THREE.BufferGeometry(), pos=[];
for(let i=0;i<1000;i++)pos.push((Math.random()-.5)*150,(Math.random()-.5)*80,-Math.random()*220);
starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xa9eaff,size:.09,sizeAttenuation:true})));

const ship=new THREE.Group();
const body=new THREE.Mesh(new THREE.ConeGeometry(.75,2.4,4),new THREE.MeshStandardMaterial({color:0xcbefff,metalness:.75,roughness:.18,emissive:0x0a3340,emissiveIntensity:.8}));body.rotation.x=Math.PI/2;body.rotation.z=Math.PI/4;ship.add(body);
const wingGeo=new THREE.BufferGeometry();wingGeo.setAttribute('position',new THREE.Float32BufferAttribute([-1.8,0,.2, -.35,0,.8, -.4,0,-.9, 1.8,0,.2, .35,0,.8, .4,0,-.9],3));wingGeo.setIndex([0,1,2,3,4,5]);
const wings=new THREE.Mesh(wingGeo,new THREE.MeshStandardMaterial({color:0x6479ad,metalness:.8,roughness:.25,side:THREE.DoubleSide}));ship.add(wings);
const engine=new THREE.Mesh(new THREE.SphereGeometry(.32,16,12),new THREE.MeshBasicMaterial({color:0x72ffff}));engine.position.z=.9;ship.add(engine);scene.add(ship);

let objects=[],running=false,over=false,time=0,distance=0,x=0,targetX=0,phase=0,energy=100,speed=.55;
const keys={};
function addObject(){const r=Math.random(),type=r<.25?'core':r<.62?'bad':'block';const o=new THREE.Group();let m;
 if(type==='bad'){m=new THREE.Mesh(new THREE.OctahedronGeometry(.72,0),new THREE.MeshStandardMaterial({color:0xff315c,emissive:0xaa0730,emissiveIntensity:2,metalness:.35,roughness:.25,wireframe:true}));o.add(m)}
 else if(type==='core'){m=new THREE.Mesh(new THREE.IcosahedronGeometry(.48,1),new THREE.MeshStandardMaterial({color:0x78fff0,emissive:0x22ccba,emissiveIntensity:2,metalness:.5,roughness:.15}));o.add(m);const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.018,8,32),new THREE.MeshBasicMaterial({color:0xaaffef,transparent:true,opacity:.8}));ring.rotation.x=Math.PI/2;o.add(ring)}
 else{m=new THREE.Mesh(new THREE.BoxGeometry(1.25,1.25,1.25),new THREE.MeshStandardMaterial({color:0x6c5d9d,emissive:0x1d153c,emissiveIntensity:.7,metalness:.65,roughness:.28,wireframe:true}));o.add(m)}
 o.userData={type};o.position.set((Math.floor(Math.random()*5)-2)*1.7,0,-100);o.scale.setScalar(type==='block'?1.25:1);objects.push(o);scene.add(o)}

function flip(){if(!running||over)return;phase=phase?0:1;energy-=18;if(energy<0)energy=0;document.getElementById('phaseNum').textContent=phase?'B':'A';scene.fog.color.setHex(phase?0x090314:0x02040d);camera.position.x+=phase?-.05:.05}
function reset(){objects.forEach(o=>scene.remove(o));objects=[];distance=0;x=0;targetX=0;phase=0;energy=100;speed=.55;over=false;ship.visible=true;document.getElementById('panel').classList.add('hide');document.getElementById('phaseNum').textContent='A';running=true}
function end(){running=false;over=true;ship.visible=false;const p=document.getElementById('panel');document.getElementById('title').textContent='跃迁终止';document.getElementById('desc').innerHTML=`飞行距离 <b>${Math.floor(distance)}</b><br>再次校准相位，突破裂隙。`;document.getElementById('start').textContent='重新启动';p.classList.remove('hide')}

document.getElementById('start').onclick=reset;
addEventListener('keydown',e=>{keys[e.key.toLower]=true;if(e.code==='Space'){e.preventDefault();flip()}});addEventListener('keyup',e=>keys[e.key.toLower]=false);
addEventListener('pointerdown',e=>{if(e.target.tagName==='BUTTON')return;if(!running)reset();else if(e.pointerType!=='mouse'||e.clientX>innerWidth*.75||e.clientX<innerWidth*.25){}else{}flip()});
const touch=document.querySelectorAll('.zone');touch[0].ontouchstart=e=>{e.prevent();targetX-=1.7};touch[1].ontouchstart=e=>{e.prevent();targetX+=1.7};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

let spawn=0,last=performance.now();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/16.67,2);last=now;time+=dt*.016;
 if(running){distance+=speed*dt;speed=Math.min(.95,.55+distance*.00008);spawn-=dt;if(spawn<0){addObject();spawn=Math.max(18,58-distance*.018)*(Math.random()*0.55+.75)}
  energy=Math.min(100,energy+.035*dt);document.getElementById('energy').style.width=energy+'%';document.getElementById('score').textContent=Math.floor(distance).toString().padStart(4,'0');
  if(keys.arrowleft||keys.a)targetX-=.15*dt;if(keys.arrowright||keys.d)targetX+=.15*dt;targetX=Math.max(-5.1,Math.min(5.1,targetX));x+=(targetX-x)*.12*dt;ship.position.x=x;
 }
 ship.position.y=Math.sin(time*3)*.14;ship.rotation.z=-((targetX-x)*.08);ship.rotation.y=Math.sin(time*2)*.05;
 tunnel.children.forEach((r,i)=>{r.position.z+=speed*dt*.7;if(r.position.z>10)r.position.z-=170;r.rotation.z+=dt*.0008});
 for(let i=objects.length-1;i>=0;i--){const o=objects[i];o.position.z+=speed*dt*1.35;o.rotation.x+=.015*dt;o.rotation.y+=.025*dt;if(running&&o.position.z>-1.2&&o.position.z<1.5){const dx=Math.abs(o.position.x-x),dz=Math.abs(o.position.z);if(dx<1.05){if(o.userData.type==='core'){energy=Math.min(100,energy+28);scene.remove(o);objects.splice(i,1)}else{if(o.userData.type==='bad'||o.userData.type==='block')end()}}}
  if(o.position.z>12){scene.remove(o);objects.splice(i,1)}}
 camera.position.x+=(x*.12-camera.position.x)*.035;camera.position.y=4+Math.sin(time*.7)*.18;
 renderer.render(scene,camera)}requestAnimationFrame(animate);
</script>
