import { Suspense, lazy, useEffect, useRef, useState } from "react";
const ArenaLobby3D = lazy(() => import("./ArenaLobby3D"));
import { ArrowLeft, Heart, Bomb, Play, RotateCcw, ShieldPlus, Swords, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroUrl from "@/assets/brix-arena/hero-run.png";
import meleeUrl from "@/assets/brix-arena/melee-run.png";
import tankUrl from "@/assets/brix-arena/tank-run.png";
import shooterUrl from "@/assets/brix-arena/shooter-run.png";
import healthKitUrl from "./assets/health-kit.png";
import { MELEE_CELL, SHOOTER_CELL, meleeFrame, shooterFrame } from "./enemy-art";
import { ArenaWorld, WIDTH, HEIGHT, type Upgrade } from "./world";

export function ArenaGame({ onBack, onStart, onFinish }: { onBack?: () => void; onStart?: () => void; onFinish?: (score: number, duration: number) => void }) {
  const callbacks=useRef({onStart,onFinish});callbacks.current={onStart,onFinish};
  const finished=useRef(false);
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLElement>(null);
  const world = useRef<ArenaWorld | null>(null);
  const input = useRef({x:0,y:0}), keys = useRef(new Set<string>());
  const [hud,setHud]=useState({phase:"ready",hp:5,maxHp:5,score:0,elapsed:0,kills:0,dash:0,bombs:2,menuOpen:false});
  const [best,setBest]=useState(0), bestRef=useRef(0);
  const publish=()=>{ const g=world.current; if(!g)return; if(g.phase==="over"&&!finished.current){finished.current=true;callbacks.current.onFinish?.(g.score,g.elapsed);} setHud({phase:g.phase,hp:g.hp,maxHp:g.maxHp,score:g.score,elapsed:g.elapsed,kills:g.kills,dash:g.dashCooldown,bombs:g.bombs,menuOpen:g.menuOpen}); if(g.score>bestRef.current){ bestRef.current=g.score; setBest(g.score); try{localStorage.setItem("brix-arena-survival-best",String(g.score));}catch{/* optional storage */} } };
  const start=()=>{finished.current=false;callbacks.current.onStart?.();world.current?.dispose(); const g=new ArenaWorld();world.current=g;g.start();keys.current.clear();input.current={x:0,y:0};publish();};
  const pause=()=>{ const g=world.current;if(!g)return;if(g.menuOpen)g.resumeMenu();else g.openMenu();keys.current.clear();input.current={x:0,y:0};stickPointer.current=null;publish(); };
  const choose=(u:Upgrade)=>{keys.current.clear();input.current={x:0,y:0};stickPointer.current=null;world.current?.upgrade(u);publish();};
  const actions=useRef({pause,publish});actions.current={pause,publish};
  useEffect(()=>{
    try{const n=Number(localStorage.getItem("brix-arena-survival-best"));if(Number.isFinite(n)&&n>0){bestRef.current=n;setBest(n);}}catch{/* optional storage */}
    const g=world.current ?? new ArenaWorld();world.current=g;
    const c=canvas.current,s=stage.current;if(!c||!s)return;
    const ctx=c.getContext("2d");if(!ctx)return;
    const art=new Image();art.src=heroUrl;
    const meleeArt=new Image();meleeArt.src=meleeUrl;
    const tankArt=new Image();tankArt.src=tankUrl;
    const shooterArt=new Image();shooterArt.src=shooterUrl;
    const kitArt=new Image();kitArt.src=healthKitUrl;
    const css=getComputedStyle(s), col=(n:string)=>css.getPropertyValue(n).trim();
    const color={floor:col("--arena-floor"),tile:col("--arena-tile"),wall:col("--arena-wall"),side:col("--arena-side"),ink:col("--game-road"),red:col("--destructive"),gold:col("--primary"),cyan:col("--accent"),text:col("--foreground"),shadow:col("--arena-shadow")};
    let scale=1, ox=0,oy=0,dpr=1;
    const resize=()=>{dpr=Math.min(devicePixelRatio||1,2);c.width=s.clientWidth*dpr;c.height=s.clientHeight*dpr;scale=Math.min(s.clientWidth/WIDTH,s.clientHeight/HEIGHT);ox=(s.clientWidth-WIDTH*scale)/2;oy=(s.clientHeight-HEIGHT*scale)/2;};resize();const ro=new ResizeObserver(resize);ro.observe(s);
    const down=(e:KeyboardEvent)=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyA","KeyS","KeyD","KeyZ","KeyQ","Space"].includes(e.code)){e.preventDefault();keys.current.add(e.code);if(e.code==="Space"&&!e.repeat)world.current?.dash();}if(e.code==="Escape")actions.current.pause();};
    const up=(e:KeyboardEvent)=>keys.current.delete(e.code);
    const blur=()=>{keys.current.clear();input.current={x:0,y:0};if(world.current?.phase==="playing")actions.current.pause();};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    let raf=0,prev=0,acc=0,lastHud=0;
    const frame=(now:number)=>{
      const w=world.current;if(!w)return;acc+=prev?Math.min((now-prev)/1000,0.05):0;prev=now;
      const k=keys.current,has=(...names:string[])=>names.some(n=>k.has(n));
      const move={x:input.current.x+(has("ArrowRight","KeyD")?1:0)-(has("ArrowLeft","KeyA","KeyQ")?1:0),y:input.current.y+(has("ArrowDown","KeyS")?1:0)-(has("ArrowUp","KeyW","KeyZ")?1:0)};
      while(acc>=1/60){w.step(1/60,move);acc-=1/60;}
      if(now-lastHud>100){actions.current.publish();lastHud=now;}
      c.dataset["x"]=String(w.hero.position.x);c.dataset["y"]=String(w.hero.position.y);c.dataset["kills"]=String(w.kills);
      c.dataset["sceneReady"]=String(meleeArt.complete&&meleeArt.naturalWidth>0&&tankArt.complete&&tankArt.naturalWidth>0&&shooterArt.complete&&shooterArt.naturalWidth>0);
      c.dataset["meleeFrame"]=String(Math.floor(w.elapsed*10)%8);
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=color.ink;ctx.fillRect(0,0,s.clientWidth,s.clientHeight);
      ctx.translate(ox,oy);ctx.scale(scale,scale);
      // Subtle 2.5D tilt: canvas-only, simulation coordinates untouched.
      ctx.translate(WIDTH/2,HEIGHT/2);ctx.transform(1,0,-0.14,0.82,0,0);ctx.translate(-WIDTH/2,-HEIGHT/2+HEIGHT*0.06);
      ctx.fillStyle=color.shadow;ctx.fillRect(14,HEIGHT,WIDTH,26);ctx.fillStyle=color.side;ctx.fillRect(0,HEIGHT,WIDTH,18);
      ctx.fillStyle=color.floor;ctx.fillRect(0,0,WIDTH,HEIGHT);
      // War-torn ground: deterministic mud stains and shell craters.
      const hash=(a:number,b:number)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
      for(let gx=0;gx<WIDTH;gx+=50)for(let gy=0;gy<HEIGHT;gy+=50){
        const h1=hash(gx,gy);
        if(h1<0.4){ctx.globalAlpha=0.55;ctx.fillStyle=color.tile;ctx.beginPath();ctx.ellipse(gx+8+h1*70,gy+8+hash(gy,gx)*34,12+h1*26,8+h1*14,h1*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
        if(h1>0.85){ctx.globalAlpha=0.8;ctx.strokeStyle=color.side;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(gx+25,gy+25,16,11,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=0.4;ctx.fillStyle=color.side;ctx.beginPath();ctx.ellipse(gx+25,gy+25,10,6.5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
      }
      ctx.strokeStyle=color.gold;ctx.lineWidth=5;ctx.strokeRect(8,8,WIDTH-16,HEIGHT-16);
      ctx.fillStyle=color.tile;ctx.font="400 70px 'Russo One'";ctx.textAlign="center";ctx.fillText("BRIX ARENA",WIDTH/2,HEIGHT/2+24);
      // Sandbag walls: stacked rounded bags along each barrier.
      for(const wall of w.walls.slice(4)){const b=wall.bounds,x=b.min.x,y=b.min.y,ww=b.max.x-x,hh=b.max.y-y;ctx.fillStyle=color.shadow;ctx.fillRect(x+6,y+6,ww,hh);ctx.fillStyle=color.side;ctx.fillRect(x,y,ww,hh);ctx.fillStyle=color.wall;const horiz=ww>=hh,len=horiz?ww:hh;for(let s=3;s<len-8;s+=20){ctx.beginPath();if(horiz)ctx.roundRect(x+s,y-9,17,hh+9,7);else ctx.roundRect(x-9,y+s,ww+9,17,7);ctx.fill();}}
      for(const p of w.pickups){
        if(p.kind==="health"&&kitArt.complete&&kitArt.naturalWidth>0){
          const pulse=1+Math.sin(w.elapsed*4)*0.08, size=40*pulse;
          ctx.fillStyle=color.shadow;ctx.beginPath();ctx.ellipse(p.x+4,p.y+16,16,7,0,0,Math.PI*2);ctx.fill();
          ctx.drawImage(kitArt,p.x-size/2,p.y-size/2-6,size,size);
        }else if(p.kind==="health"){
          ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillStyle=color.red;ctx.fillRect(-9,-9,18,18);ctx.restore();
          ctx.fillStyle=color.text;ctx.fillRect(p.x-6,p.y-1.5,12,3);ctx.fillRect(p.x-1.5,p.y-6,3,12);
        }else{
          ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillStyle=color.cyan;ctx.fillRect(-6,-6,12,12);ctx.restore();
        }
      }
      const shadow=(x:number,y:number,r:number)=>{ctx.fillStyle=color.shadow;ctx.beginPath();ctx.ellipse(x+4,y+9,r,r*0.5,0,0,Math.PI*2);ctx.fill();};
      for(const e of [...w.enemies].sort((a,b)=>a.body.position.y-b.body.position.y)){
        const {x,y}=e.body.position,r=e.kind===1?22:16;shadow(x,y,r);
        if(e.kind!==2){
          const img=e.kind===1?tankArt:meleeArt;
          if(img.complete&&img.naturalWidth){
            const v=e.body.velocity;
            const direction=Math.hypot(v.x,v.y)>0.08?v:{x:w.hero.position.x-x,y:w.hero.position.y-y};
            const pose=meleeFrame(w.elapsed,e.body.id,direction.x,direction.y);
            const size=e.kind===1?118:86;
            ctx.drawImage(img,pose.sx,pose.sy,MELEE_CELL,MELEE_CELL,x-size/2,y-size*0.84,size,size);
          }
          continue;
        }
        // Ranged drone from the supplied GLB, blades spinning, facing the hero.
        if(shooterArt.complete&&shooterArt.naturalWidth){
          const pose=shooterFrame(w.elapsed,e.body.id,w.hero.position.x-x,w.hero.position.y-y);
          const size=92,hover=Math.sin(w.elapsed*3+e.body.id)*3;
          ctx.drawImage(shooterArt,pose.sx,pose.sy,SHOOTER_CELL,SHOOTER_CELL,x-size/2,y-size*0.72+hover,size,size);
        }
      }
      for(const b of w.shots){ctx.strokeStyle=b.hostile?color.red:color.cyan;ctx.lineWidth=b.hostile?7:5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(b.body.position.x-b.vx*1.8,b.body.position.y-b.vy*1.8);ctx.lineTo(b.body.position.x,b.body.position.y);ctx.stroke();}
      const h=w.hero.position;shadow(h.x,h.y,20);
      if(w.dashTime>0){ctx.strokeStyle=color.cyan;ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(h.x-w.facing.x*55,h.y-w.facing.y*55);ctx.lineTo(h.x,h.y);ctx.stroke();}
      ctx.globalAlpha=w.invincible>0&&Math.floor(now/90)%2?0.45:1;
      if(art.complete&&art.naturalWidth){const moving=Math.hypot(move.x,move.y)>0;const dir=moving?move:w.facing;const pose=meleeFrame(w.elapsed,0,dir.x,dir.y);ctx.drawImage(art,pose.sx,pose.sy,MELEE_CELL,MELEE_CELL,h.x-34,h.y-56,68,68);}else{ctx.fillStyle=color.gold;ctx.fillRect(h.x-15,h.y-20,30,35);}
      ctx.globalAlpha=1;ctx.save();ctx.translate(h.x,h.y-4);ctx.rotate(Math.atan2(w.aim.y,w.aim.x));ctx.fillStyle=color.side;ctx.fillRect(7,-6,26,12);ctx.fillStyle=color.cyan;ctx.fillRect(23,-4,13,8);ctx.restore();
      if(w.bombFlash>0){ctx.globalAlpha=w.bombFlash;ctx.fillStyle=color.gold;ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.globalAlpha=1;}
      raf=requestAnimationFrame(frame);
    };raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);world.current?.dispose();};
  },[]);
  const stickPointer=useRef<number|null>(null), stickPad=useRef<HTMLDivElement>(null);
  const [stick,setStick]=useState({active:false,bx:0,by:0,kx:0,ky:0});
  const STICK_R=52;
  const stickDown=(e:React.PointerEvent)=>{if(stickPointer.current!==null)return;stickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);input.current={x:0,y:0};const r=stickPad.current?.getBoundingClientRect();setStick({active:true,bx:r?r.left+r.width/2:e.clientX,by:r?r.top+r.height/2:e.clientY,kx:0,ky:0});stickMove(e);};
  const stickMove=(e:React.PointerEvent)=>{if(stickPointer.current!==e.pointerId)return;setStick(s=>{if(!s.active)return s;const sx=e.clientX-s.bx,sy=e.clientY-s.by;let dx=sx,dy=sy;if(stage.current&&getComputedStyle(stage.current).transform!=="none"){dx=sy;dy=-sx;}const len=Math.hypot(dx,dy),cl=len>STICK_R?STICK_R/len:1;input.current={x:dx/Math.max(STICK_R,len),y:dy/Math.max(STICK_R,len)};return {...s,kx:sx*cl,ky:sy*cl};});};
  const stickUp=(e:React.PointerEvent)=>{if(stickPointer.current!==e.pointerId)return;stickPointer.current=null;input.current={x:0,y:0};setStick(s=>({...s,active:false}));};
  return <main ref={stage} className="brix-arena-original game-screen arena-screen touch-none select-none">
    <canvas ref={canvas} className="arena-canvas" aria-label="Arène de survie" />
    <header className="arena-hud"><Button variant="secondary" onClick={pause} aria-label="Menu"><ArrowLeft/>Menu</Button></header>
    <div className="arena-stats"><div><Trophy size={15}/><span>{hud.score}<small>Record {best}</small></span></div><div className="arena-health"><Heart size={15}/>{hud.hp}/{hud.maxHp}</div></div>
    {hud.phase==="playing"&&<><div className="arena-stick-zone" role="application" aria-label="Déplacer le joueur" onPointerDown={stickDown} onPointerMove={stickMove} onPointerUp={stickUp} onPointerCancel={stickUp}/><div ref={stickPad} className="arena-stick-base"><div className="arena-stick-knob" style={{transform:`translate(calc(-50% + ${stick.kx}px),calc(-50% + ${stick.ky}px))`}}/></div><Button className="arena-dash" aria-label="Esquiver" disabled={hud.dash>0} onPointerDown={e=>{e.preventDefault();world.current?.dash();publish();}} onClick={e=>{if(e.detail===0){world.current?.dash();publish();}}}><Zap/>{hud.dash>0?`${hud.dash.toFixed(1)}s`:"Esquive"}</Button></>}
    {hud.phase==="playing"&&!hud.menuOpen&&<Button className="arena-bomb" aria-label={`Bombe, ${hud.bombs} restantes`} disabled={hud.bombs<=0} onPointerDown={e=>{e.preventDefault();world.current?.bomb();publish();}} onClick={e=>{if(e.detail===0){world.current?.bomb();publish();}}}><Bomb/><span>Bombe ×{hud.bombs}</span></Button>}
    {hud.menuOpen&&<div className="arena-overlay arena-menu-overlay"><div className="arena-dialog" role="dialog" aria-label="Menu de la partie"><h2>MENU</h2>{hud.phase!=="ready"&&hud.phase!=="over"&&<Button className="arena-start" onClick={pause}><Play/>Reprendre la partie</Button>}<Button variant="secondary" onClick={onBack}><ArrowLeft/>Retour au menu</Button></div></div>}
    {hud.phase==="ready"&&!hud.menuOpen&&<div className="arena-lobby">
      <Suspense fallback={null}><ArenaLobby3D/></Suspense>
      <div className="arena-lobby-vignette"/>
      <div className="arena-lobby-left">
        <p className="arena-kicker">SURVIE · SOLO</p>
        <h2 className="arena-logo">BRIX <span>ARENA</span></h2>
        <div className="arena-lobby-best"><Trophy size={16}/>Record <b>{best}</b></div>
        <ul className="arena-lobby-foes">
          <li><i data-c="melee"/>Robots rapides</li>
          <li><i data-c="tank"/>Monstres blindés</li>
          <li><i data-c="drone"/>Drones tireurs</li>
        </ul>
      </div>
      <div className="arena-lobby-right">
        <div className="arena-lobby-kit"><img src={healthKitUrl} alt="Kit de soin"/><div><b>KIT DE SOIN</b><span>Ramasse-le : <em>+1 vie</em></span></div></div>
        <Button className="arena-lobby-play" onClick={start}><Play/>JOUER</Button>
        <small className="arena-lobby-hint">Améliore-toi tous les 10 points</small>
      </div>
    </div>}
    {hud.phase!=="playing"&&hud.phase!=="ready"&&!hud.menuOpen&&<div className="arena-overlay"><div className="arena-dialog">
      <p className="text-accent text-xs">{hud.phase==="upgrade"?`${hud.score} POINTS` :"SURVIE · SOLO"}</p>
      <h2>{hud.phase==="ready"?"BRIX ARENA":hud.phase==="over"?"FIN DE PARTIE":hud.phase==="upgrade"?"TON AMÉLIORATION":"EN PAUSE"}</h2>
      {hud.phase==="over"&&<p className="arena-result">{hud.score} points · {Math.floor(hud.elapsed)}s de survie</p>}
      {hud.phase==="upgrade"?<div className="arena-upgrades"><Button variant="secondary" onClick={()=>choose("power")}><Swords/>Puissance<small>+1 dégât</small></Button><Button variant="secondary" onClick={()=>choose("speed")}><Zap/>Cadence<small>Tirs plus rapides</small></Button><Button variant="secondary" onClick={()=>choose("health")}><ShieldPlus/>Vitalité<small>Soins + vie max</small></Button></div>:<Button className="arena-start" onClick={hud.phase==="paused"?pause:start}>{hud.phase==="over"?<RotateCcw/>:<Play/>}{hud.phase==="ready"?"Entrer dans l’arène":hud.phase==="over"?"Rejouer":"Reprendre"}</Button>}
    </div></div>}
  </main>;
}