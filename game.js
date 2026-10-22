import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const mount=document.querySelector("#game"), menu=document.querySelector("#menu"), hud=document.querySelector("#hud");
const statusEl=document.querySelector("#status"), toastEl=document.querySelector("#toast");
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x030607); scene.fog=new THREE.FogExp2(0x050809,.055);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.1,100); camera.position.set(0,1.65,7);
const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; mount.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x87949b,0x101312,.32));
const lamp=new THREE.SpotLight(0xe0edff,45,19,Math.PI/6,.55,1.2); lamp.position.set(0,1.55,0); lamp.target.position.set(0,1.2,-2); camera.add(lamp);camera.add(lamp.target);scene.add(camera);
const ambient=new THREE.PointLight(0x5b1717,1.8,12);ambient.position.set(-5,2,-6);scene.add(ambient);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
const floorMat=mat(0x252a29), wallMat=mat(0x343a38), trimMat=mat(0x171b1a), metalMat=mat(0x4d5553), glowMat=new THREE.MeshStandardMaterial({color:0x9cf5cb,emissive:0x39d68d,emissiveIntensity:2});
function box(w,h,d,x,y,z,m,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o}
box(40,.3,40,0,-.18,0,floorMat,false);
for(let x=-10;x<=10;x+=5){box(.035,.01,40,x,-.015,0,trimMat,false)}
// A compact, walkable abandoned corridor and side rooms.
box(40,4,.4,0,2,-10,wallMat);box(40,4,.4,0,2,10,wallMat);
box(.4,4,20,-10,2,0,wallMat);box(.4,4,20,10,2,0,wallMat);
for(let z=-7;z<=7;z+=4){box(.25,4,.25,-3,2,z,wallMat);box(.25,4,.25,3,2,z,wallMat);box(6,.25,.25,0,3.65,z,trimMat)}
for(let i=0;i<7;i++){let z=-8+i*2.5;box(.12,2.2,.12,-8,.95,z,metalMat);box(.12,2.2,.12,8,.95,z,metalMat)}
// Broken furniture / environmental silhouettes.
for(const [x,z,s] of [[-5,-4,1],[5,-7,1.3],[-6,4,.9],[6,3,1.1],[0,-7,.8]]){
 box(1.1*s,.65*s,.7*s,x,.35*s,z,trimMat);box(1.1*s,.08,.7*s,x,.7*s,z,metalMat);
}
for(let z=-7;z<=7;z+=4){let light=new THREE.PointLight(0x9aa9a7,.8,6);light.position.set(0,3.2,z);scene.add(light);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),mat(0xa6b8b5));bulb.position.copy(light.position);scene.add(bulb)}
// Exit door
const door=box(2.2,3,.18,0,1.5,-9.72,mat(0x3b2422));box(.12,2.8,.1,-.8,1.5,-9.6,metalMat);
const evidencePositions=[[-6,0,-6],[5,0,1],[0,0,7]];
const evidenceMeshes=[];
evidencePositions.forEach((p,i)=>{const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.22,1),glowMat);orb.position.set(p[0],.65,p[2]);scene.add(orb);const pl=new THREE.PointLight(0x35eaa0,1.2,3);pl.position.copy(orb.position);scene.add(pl);evidenceMeshes.push(orb)});
const monsterMat=new THREE.MeshStandardMaterial({color:0x070909,roughness:.95});
const monster=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.9,4,8),monsterMat);body.position.y=1;monster.add(body);
for(const x of [-.14,.14]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),new THREE.MeshBasicMaterial({color:0xff2d22}));eye.position.set(x,1.35,-.33);monster.add(eye)}
monster.position.set(7,0,-7);scene.add(monster);
const otherPlayers=new Map();let ws=null, myId=null, roomCode="", playerName="Player", joined=false, yaw=0,pitch=0, lastSend=0, evidenceFound=new Set(), keys={}, moving=false, lookMode=false, lastToast=0;
const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||innerWidth<760;
function toast(text){toastEl.textContent=text;toastEl.style.display="block";lastToast=performance.now()}
function setStatus(t){statusEl.textContent=t}
function connect(action,code=""){
 if(ws&&ws.readyState===WebSocket.OPEN){ws.close()}
 const configured=window.NIGHT_SHIFT_WS_URL;
 const proto=location.protocol==="https:"?"wss":"ws";
 const socketUrl=(configured&&configured.trim())?configured.trim():`${proto}://${location.host}`;
 ws=new WebSocket(socketUrl);
 ws.onopen=()=>ws.send(JSON.stringify(action==="create"?{type:"create",name:playerName}:{type:"join",name:playerName,code}));
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}
  if(m.type==="joined"){joined=true;myId=m.id;roomCode=m.code;menu.classList.add("hidden");hud.classList.remove("hidden");document.querySelector("#hudCode").textContent=roomCode;document.querySelector("#mobileControls").classList.toggle("hidden",!isMobile);toast("Room ready. Share code "+roomCode)}
  if(m.type==="error")setStatus(m.message);
  if(m.type==="state"){document.querySelector("#players").textContent=`PLAYERS ${m.players.length}/4`;m.players.forEach(p=>{if(p.id!==myId)updateOther(p)});for(const [id,o] of otherPlayers){if(!m.players.some(p=>p.id===id)){scene.remove(o);otherPlayers.delete(id)}};evidenceFound=new Set([0,1,2].filter(i=>!m.items.includes(i)));updateEvidence()}
  if(m.type==="playerMoved"){if(m.id!==myId)updateOther(m)}
  if(m.type==="playerLeft"){const o=otherPlayers.get(m.id);if(o)scene.remove(o);otherPlayers.delete(m.id);toast((m.name||"Player")+" left")}
  if(m.type==="itemCollected"){evidenceFound.add(m.item);if(evidenceMeshes[m.item])evidenceMeshes[m.item].visible=false;updateEvidence();toast(`${m.by} found evidence (${evidenceFound.size}/3)`)}
 };
 ws.onclose=()=>{if(joined){joined=false;hud.classList.add("hidden");menu.classList.remove("hidden");setStatus("Disconnected from server. Create or join again.")}};
 ws.onerror=()=>setStatus("Could not connect. Check the server is running.");
}
function updateOther(p){let o=otherPlayers.get(p.id);if(!o){o=new THREE.Group();const b=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.7,3,6),mat(0x536a70));b.position.y=.9;o.add(b);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),mat(0x8c9a98));head.position.y=1.5;o.add(head);scene.add(o);otherPlayers.set(p.id,o)}o.position.set(p.x,0,p.z);o.rotation.y=p.rot}
function updateEvidence(){document.querySelector("#evidence").textContent=`Evidence found: ${evidenceFound.size} / 3`;evidenceMeshes.forEach((m,i)=>m.visible=!evidenceFound.has(i));if(evidenceFound.size===3){door.material=glowMat;document.querySelector("#hint").textContent="All evidence found — reach the exit!"}}
function start(action){playerName=document.querySelector("#playerName").value.trim()||"Player";connect(action,document.querySelector("#roomCode").value.trim())}
document.querySelector("#createBtn").onclick=()=>start("create");
document.querySelector("#joinBtn").onclick=()=>{const c=document.querySelector("#roomCode").value.trim();if(!c)return setStatus("Enter a room code first.");start("join",c)};
document.querySelector("#leaveBtn").onclick=()=>{if(ws)ws.close();joined=false;hud.classList.add("hidden");document.querySelector("#mobileControls").classList.add("hidden");menu.classList.remove("hidden");setStatus("You left the room.")};
function collect(){if(!joined||!ws||ws.readyState!==1)return;let best=-1,dist=2.1;for(let i=0;i<evidencePositions.length;i++){if(evidenceFound.has(i))continue;const p=evidencePositions[i],d=Math.hypot(camera.position.x-p[0],camera.position.z-p[2]);if(d<dist){dist=d;best=i}}if(best>=0)ws.send(JSON.stringify({type:"collect",item:best}));else toast("Move closer to glowing evidence.");}
document.querySelector("#collectBtn").onclick=collect;window.addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==="e")collect()});window.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
renderer.domElement.addEventListener("click",()=>{if(joined&&!isMobile)renderer.domElement.requestPointerLock?.()});
document.addEventListener("mousemove",e=>{if(document.pointerLockElement===renderer.domElement){yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=Math.max(-1.1,Math.min(1.1,pitch))}});
document.querySelector("#lookBtn").onclick=()=>{lookMode=!lookMode;document.querySelector("#lookBtn").textContent=lookMode?"LOOK: ON":"LOOK MODE";toast(lookMode?"Drag screen to look around":"Look mode off")};
let touchX=null,touchY=null;renderer.domElement.addEventListener("touchstart",e=>{if(!lookMode)return;touchX=e.touches[0].clientX;touchY=e.touches[0].clientY},{passive:true});renderer.domElement.addEventListener("touchmove",e=>{if(!lookMode||touchX===null)return;const t=e.touches[0];yaw-=(t.clientX-touchX)*.006;pitch-=(t.clientY-touchY)*.006;pitch=Math.max(-1,Math.min(1,pitch));touchX=t.clientX;touchY=t.clientY},{passive:true});renderer.domElement.addEventListener("touchend",()=>{touchX=touchY=null});
document.querySelectorAll("[data-move]").forEach(b=>{const k=b.dataset.move;const down=e=>{e.preventDefault();keys["mobile_"+k]=true},up=e=>{e.preventDefault();keys["mobile_"+k]=false};b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointerleave",up);b.addEventListener("pointercancel",up)});
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.04,(now-(animate.prev||now))/1000);animate.prev=now;
 camera.rotation.order="YXZ";camera.rotation.y=yaw;camera.rotation.x=pitch;
 const forward=Number(keys.w||keys.arrowup||keys["mobile_forward"])-Number(keys.s||keys.arrowdown||keys["mobile_back"]);
 const side=Number(keys.d||keys.arrowright||keys["mobile_right"])-Number(keys.a||keys.arrowleft||keys["mobile_left"]);
 const dir=new THREE.Vector3(side,0,-forward);if(dir.lengthSq()>0){dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);camera.position.addScaledVector(dir,dt*3.0);camera.position.x=Math.max(-9,Math.min(9,camera.position.x));camera.position.z=Math.max(-9,Math.min(9,camera.position.z))}
 camera.position.y=1.65;
 // Simple stalking behavior, intentionally non-lethal in this first prototype.
 if(joined){const target=new THREE.Vector3(camera.position.x,0,camera.position.z);const delta=target.clone().sub(monster.position);if(delta.length()>2.8){delta.normalize();monster.position.addScaledVector(delta,dt*.5)}monster.lookAt(camera.position.x,1,camera.position.z);if(monster.position.distanceTo(new THREE.Vector3(camera.position.x,0,camera.position.z))<1.4&&now-lastToast>3000)toast("You hear breathing close behind you…")}
 if(joined&&ws&&ws.readyState===1&&now-lastSend>80){ws.send(JSON.stringify({type:"move",x:camera.position.x,z:camera.position.z,rot:yaw}));lastSend=now}
 if(now-lastToast>2500)toastEl.style.display="none";
 renderer.render(scene,camera)}
requestAnimationFrame(animate);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
