/* IdeaHire | P37 | 2026-10-14 | Pełny plik: src/App.jsx | Panorama projektu 3D */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { CommissionStory, HomeStepCard, IdeaHireLogo, MarketIcon, helpCenterHref } from "./MarketUI";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useSitePreferences } from "./Preferences";

/* IdeaHire P37 — lokalne studio 3D, WebGL, bez zewnętrznych modeli. */
const IH37_VERTEX = [
 "attribute vec3 aPosition,aNormal;",
 "attribute vec2 aUV;",
 "uniform mat4 uProjection,uModel;",
 "varying vec3 vPosition,vNormal;varying vec2 vUV;",
 "void main(){vec4 p=uModel*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=mat3(uModel)*aNormal;vUV=aUV;gl_Position=uProjection*p;}"
].join("\n");
const IH37_FRAGMENT = [
 "precision mediump float;",
 "uniform vec3 uColor,uEye,uAccent;",
 "uniform float uFinish,uRough,uDark,uPower,uTime;",
 "uniform sampler2D uTexture;",
 "varying vec3 vPosition,vNormal;varying vec2 vUV;",
 "void main(){",
 " vec3 n=normalize(vNormal),v=normalize(uEye-vPosition),r=reflect(-v,n);",
 " if(uFinish>4.5){float a=exp(-dot(vPosition.xz*vec2(.46,.72),vPosition.xz*vec2(.46,.72)))*.28;gl_FragColor=vec4(mix(vec3(.17,.21,.30),vec3(.0),uDark),a);return;}",
 " vec3 l=normalize(vec3(-2.2,4.2,3.7)),l2=normalize(vec3(3.0,1.8,-2.0));",
 " float d=max(dot(n,l),0.0),d2=max(dot(n,l2),0.0),f=pow(1.0-max(dot(n,v),0.0),4.0);",
 " float s=pow(max(dot(n,normalize(l+v)),0.0),mix(135.0,12.0,uRough));",
 " float s2=pow(max(dot(n,normalize(l2+v)),0.0),mix(80.0,9.0,uRough));",
 " vec3 env=vec3(.12)+vec3(.65)*smoothstep(.55,.94,r.y)+vec3(.55)*pow(max(0.0,1.0-abs(r.x+.25)),18.0);",
 " env+=uAccent*pow(max(0.0,1.0-abs(r.z+.75)),10.0)*.32;",
 " vec3 color=uColor*(.24+d*.56+d2*.22)+vec3(s)*1.2+uAccent*s2*.44;",
 " color=mix(color,color*.62+env*.48+vec3(f*.27),1.0-uRough);",
 " if(uFinish>2.5&&uFinish<3.5){vec4 t=texture2D(uTexture,vUV);if(t.a<.08)discard;color=t.rgb*(.68+d*.22);}",
 " if(uFinish>1.5&&uFinish<2.5){vec3 t=texture2D(uTexture,vUV).rgb;color=mix(vec3(.005,.009,.016),t,uPower);color+=vec3(s*.15)+uAccent*f*.06;gl_FragColor=vec4(color,1.0);return;}",
 " if(uFinish>3.5&&uFinish<4.5)color=uAccent*(.8+uPower*.55);",
 " color=color/(vec3(1.0)+color*.24);gl_FragColor=vec4(pow(max(color,0.0),vec3(.87)),1.0);",
 "}"
].join("\n");
const IH37_FIELD_VERTEX=[
 "attribute vec3 aPosition;uniform mat4 uProjection;uniform float uTime,uRatio;uniform vec2 uPointer;varying float vGlow,vDepth,vSide;",
 "void main(){vec3 p=aPosition;float d=length(p.xz-uPointer);",
 "p.y=-1.05+.30*sin(p.x*1.22+uTime*.28)+.18*sin(p.z*.95-uTime*.22)+.09*sin(p.x*2.6+p.z*2.1+uTime*.40);",
 "p.y+=.12*sin(d*2.8-uTime*.65)*exp(-d*.42);",
 "vec4 clip=uProjection*vec4(p,1.0);gl_Position=clip;vSide=clip.x/max(.1,clip.w);vDepth=exp(-max(0.0,-p.z)*.12);",
 "vGlow=.38+.62*smoothstep(-1.1,-.78,p.y);gl_PointSize=(1.1+vGlow*1.0)*uRatio;"
].join("\n")+"\n}";
const IH37_FIELD_FRAGMENT=[
 "precision mediump float;uniform vec3 uAccent;uniform float uDark,uDots;varying float vGlow,vDepth,vSide;",
 "void main(){float a=1.0;if(uDots>.5){float r=length(gl_PointCoord-vec2(.5));a=1.0-smoothstep(.22,.5,r);}",
 "float shade=smoothstep(-.9,.3,vSide);a*=mix(.10,.40,uDark)*vGlow*vDepth*mix(.18,1.0,shade);if(uDots<.5)a*=.40;",
 "gl_FragColor=vec4(uAccent*(.74+vGlow*.52),a);}"
].join("\n");
function ih37FieldGeometry(){
 const points=[],lines=[],nx=121,nz=76;
 for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)points.push(-9+x*18/(nx-1),0,-6+z*12/(nz-1));
 const xx=57,zz=36,point=(x,z)=>[-9+x*18/(xx-1),0,-6+z*12/(zz-1)];
 for(let z=0;z<zz;z++)for(let x=0;x<xx;x++){if(x<xx-1)lines.push(...point(x,z),...point(x+1,z));if(z<zz-1)lines.push(...point(x,z),...point(x,z+1));}
 return{points,lines};
}

const IH37 = {
 identity:()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),
 multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;},
 move(x,y,z){const m=this.identity();m[12]=x;m[13]=y;m[14]=z;return m;},
 rx(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);},
 ry(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);},
 rz(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);},
 unit(a){const l=Math.hypot(...a)||1;return a.map(x=>x/l);},
 cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];},
 look(eye,at){const z=this.unit(eye.map((v,i)=>v-at[i])),x=this.unit(this.cross([0,1,0],z)),y=this.cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]);},
 perspective(fov,aspect){const f=1/Math.tan(fov/2),near=.1,far=50;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);},
 ease(a,b,t){const p=Math.max(0,Math.min(1,(t-a)/(b-a)));return p*p*(3-2*p);},
 point(mesh,p,n,uv=[0,0]){mesh.push(...p,...n,...uv);},
 triangle(mesh,a,b,c,na,nb=na,nc=na,ua=[0,0],ub=[1,0],uc=[1,1]){this.point(mesh,a,na,ua);this.point(mesh,b,nb,ub);this.point(mesh,c,nc,uc);},
 quad(mesh,a,b,c,d,n,uv=[[0,0],[1,0],[1,1],[0,1]]){this.triangle(mesh,a,b,c,n,n,n,uv[0],uv[1],uv[2]);this.triangle(mesh,a,c,d,n,n,n,uv[0],uv[2],uv[3]);},
 prism(w,h,d,r,center=[0,0,0],steps=7){
  const mesh=[],ring=(inset,y)=>{const out=[],ww=w/2-inset,dd=d/2-inset,rr=Math.max(.002,r-inset);
   for(let c=0;c<4;c++){const angle=c*Math.PI/2,xx=Math.cos(angle+Math.PI/4)>0?ww-rr:-ww+rr,zz=Math.sin(angle+Math.PI/4)>0?dd-rr:-dd+rr;
    for(let j=0;j<=steps;j++){const a=angle+j*Math.PI/(2*steps);out.push([center[0]+xx+Math.cos(a)*rr,center[1]+y,center[2]+zz+Math.sin(a)*rr,Math.cos(a),Math.sin(a)]);}}
   return out;};
  const bevel=Math.min(h*.24,.025),layers=[ring(bevel,-h/2),ring(0,-h/2+bevel),ring(0,h/2-bevel),ring(bevel,h/2)];
  for(let k=0;k<3;k++)for(let i=0;i<layers[k].length;i++){const j=(i+1)%layers[k].length,a=layers[k][i],b=layers[k][j],c=layers[k+1][j],e=layers[k+1][i];
   const ny=k===0?-.6:k===2?.6:0,na=this.unit([a[3],ny,a[4]]),nb=this.unit([b[3],ny,b[4]]);
   this.triangle(mesh,a.slice(0,3),b.slice(0,3),c.slice(0,3),na,nb,nb);this.triangle(mesh,a.slice(0,3),c.slice(0,3),e.slice(0,3),na,nb,na);}
  for(const [k,ny] of [[0,-1],[3,1]]){const ring=layers[k],c=[center[0],center[1]+(k===0?-h/2:h/2),center[2]];
   for(let i=0;i<ring.length;i++)this.triangle(mesh,c,ring[i].slice(0,3),ring[(i+1)%ring.length].slice(0,3),[0,ny,0]);}
  return mesh;
 },
 plane(w,d,y,z=0,x=0,down=false,uv){const mesh=[];this.quad(mesh,[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],[0,down?-1:1,0],uv);return mesh;},
 sphere(rx,ry,rz,center=[0,0,0],steps=28,rows=14){
  const mesh=[],p=(u,v)=>{const a=u*Math.PI*2,b=v*Math.PI,s=Math.sin(b),n=[Math.cos(a)*s,Math.cos(b),Math.sin(a)*s];return{p:n.map((q,i)=>q*[rx,ry,rz][i]+center[i]),n:this.unit([n[0]/rx,n[1]/ry,n[2]/rz])};};
  for(let y=0;y<rows;y++)for(let x=0;x<steps;x++){const a=p(x/steps,y/rows),b=p((x+1)/steps,y/rows),c=p((x+1)/steps,(y+1)/rows),d=p(x/steps,(y+1)/rows);
   this.triangle(mesh,a.p,b.p,c.p,a.n,b.n,c.n);this.triangle(mesh,a.p,c.p,d.p,a.n,c.n,d.n);}
  return mesh;
 },
 cylinder(radius,length,center=[0,0,0],steps=24){
  const mesh=[],axis=(a,y)=>[center[0]+Math.cos(a)*radius,center[1]+y,center[2]+Math.sin(a)*radius];
  for(let i=0;i<steps;i++){const a=i/steps*Math.PI*2,b=(i+1)/steps*Math.PI*2,na=[Math.cos(a),0,Math.sin(a)],nb=[Math.cos(b),0,Math.sin(b)];
   this.triangle(mesh,axis(a,-length/2),axis(b,-length/2),axis(b,length/2),na,nb,nb);this.triangle(mesh,axis(a,-length/2),axis(b,length/2),axis(a,length/2),na,nb,na);
   for(const y of [-length/2,length/2])this.triangle(mesh,[center[0],center[1]+y,center[2]],axis(a,y),axis(b,y),[0,Math.sign(y),0]);}
  return mesh;
 }
};
function ih37BuildLaptop(){
 const mesh=(geometry,color,rough=.5,finish=0,group="base",texture="",transform=IH37.identity())=>({geometry,color,rough,finish,group,texture,transform});
 const all=[],metal=[.43,.48,.56],edge=[.63,.66,.71],black=[.012,.016,.023],keys=[],labels=[],speakers=[];
 all.push(mesh(IH37.plane(10,8,-.13),[0,0,0],1,5,"floor"));
 all.push(mesh(IH37.prism(3.64,.11,2.38,.12,[0,.015,0]),metal,.15));
 all.push(mesh(IH37.prism(3.58,.018,2.32,.1,[0,.078,0]),edge,.24));
 all.push(mesh(IH37.prism(2.99,.009,1.25,.07,[0,.092,-.40]),black,.8));
 const rows=[
  ["esc","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","⌫"],
  ["~","1","2","3","4","5","6","7","8","9","0","−","=","⌫"],
  ["tab","Q","W","E","R","T","Y","U","I","O","P","[","]","\\"],
  ["caps","A","S","D","F","G","H","J","K","L",";","'","enter"],
  ["shift","Z","X","C","V","B","N","M",",",".","/","↑","shift"],
  ["fn","ctrl","⌥","⌘","","space","","","⌘","⌥","←","↓","→"]
 ];
 for(let row=0;row<rows.length;row++)for(let col=0;col<rows[row].length;col++){
  if(row===5&&[4,6,7].includes(col))continue;
  const w=row===5&&col===5?.84:.185,x=(col-6.5)*.211+(row===5&&col===5?.105:0),z=-.90+row*.201;
  keys.push(...IH37.prism(w,.018,.159,.021,[x,.109,z],4));
  const u=col/16,v=1-(row+1)/6,uv=[[u,v],[u+1/16,v],[u+1/16,v+1/6],[u,v+1/6]];
  labels.push(...IH37.plane(Math.min(w,.17),.142,.120,z,x,false,uv));
 }
 all.push(mesh(keys,black,.67));all.push(mesh(labels,[1,1,1],.8,3,"base","keys"));
 for(const x of [-1.62,1.62])for(let row=0;row<30;row++)for(let col=0;col<3;col++)speakers.push(...IH37.plane(.006,.012,.09,-.96+row*.035,x+(col-1)*.019));
 all.push(mesh(speakers,[.024,.028,.035],1));
 all.push(mesh(IH37.prism(1.15,.006,.58,.044,[0,.087,.69]),[.25,.29,.36],.22));
 all.push(mesh(IH37.prism(1.13,.006,.557,.039,[0,.092,.69]),metal,.23));
 all.push(mesh(IH37.cylinder(.043,2.9),[.21,.24,.29],.12,0,"base","",IH37.multiply(IH37.move(0,.102,-1.1),IH37.rz(Math.PI/2))));
 for(const x of [-1.82,1.82])for(const z of [-.80,-.43,-.04])all.push(mesh(IH37.prism(.011,.027,.145,.008,[x,.016,z]),black,.72));
 all.push(mesh(IH37.prism(3.61,.080,2.20,.10,[0,0,1.10]),metal,.12,0,"lid"));
 all.push(mesh(IH37.prism(3.45,.009,2.02,.073,[0,-.046,1.12]),black,.65,0,"lid"));
 all.push(mesh(IH37.plane(3.24,1.79,-.053,1.13,0,true),[1,1,1],1,2,"lid","screen"));
 all.push(mesh(IH37.plane(1.15,.24,.044,1.05,0,false),[1,1,1],1,3,"lid","brand"));
 all.push(mesh(IH37.sphere(.014,.006,.014,[0,-.054,2.10],16,8),[.025,.05,.10],.08,0,"lid"));
 all.push(mesh(IH37.prism(.28,.006,.020,.006,[0,-.055,.112]),[.3,.33,.38],.6,0,"lid"));
 all.push(mesh(IH37.sphere(.246,.121,.385,[2.18,.04,.65],36,18),metal,.19));
 all.push(mesh(IH37.prism(.012,.006,.21,.005,[2.18,.161,.49]),black,.7));
 all.push(mesh(IH37.sphere(.031,.014,.057,[2.18,.170,.53],16,8),edge,.15));
 all.push(mesh(IH37.cylinder(.032,1.86),edge,.09,0,"pen","",IH37.multiply(IH37.move(-2.16,.18,.13),IH37.multiply(IH37.rx(Math.PI/2),IH37.rz(.27)))));
 all.push(mesh(IH37.cylinder(.033,.10),black,.7,0,"pen","",IH37.multiply(IH37.move(-2.42,.18,1.065),IH37.multiply(IH37.rx(Math.PI/2),IH37.rz(.27)))));
 return {all,rows};
}


function ih37CanvasTexture(gl,width,height){
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
 const context=canvas.getContext("2d");if(!context)throw new Error("studio_texture_context");
 const texture=gl.createTexture();if(!texture)throw new Error("studio_texture");
 return{canvas,context,texture,update(){gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}};
}
function ih37Screen(texture,state){
 const c=texture.context,w=texture.canvas.width,h=texture.canvas.height,en=state.language==="en",classic=state.classic;
 const bg=state.dark?"#0d121b":"#f7f8fb",fg=state.dark?"#f1f4fa":"#182032",muted=state.dark?"#93a0b4":"#768298";
 const accent=classic?(state.dark?"#dddcd8":"#383a3a"):"#4169ed",soft=state.dark?"#1b2433":"#e8edf5";
 c.clearRect(0,0,w,h);c.fillStyle=bg;c.fillRect(0,0,w,h);
 const round=(x,y,ww,hh,r,fill)=>{c.fillStyle=fill;c.beginPath();c.roundRect?c.roundRect(x,y,ww,hh,r):c.rect(x,y,ww,hh);c.fill();};
 c.fillStyle=soft;c.fillRect(0,0,w,56);
 for(let i=0;i<3;i++){c.beginPath();c.arc(29+i*20,28,5,0,Math.PI*2);c.fillStyle=i===0?accent:muted;c.fill();}
 c.font="600 15px Arial,sans-serif";c.fillStyle=muted;c.fillText("ideahire / "+(en?"your project":"twój projekt"),125,33);
 c.fillStyle=fg;c.font="700 24px Arial,sans-serif";c.fillText("IdeaHire",48,113);
 c.font="14px Arial,sans-serif";c.fillStyle=muted;c.fillText(en?"IDEA / DESIGN / REALITY":"POMYSŁ / PROJEKT / REALIZACJA",48,149);
 const headlines=state.role===2?(en?["Create.","Make an impact."]:["Twórz.","Zostaw swój ślad."]):(en?["Every great project","starts with an idea."]:["Każdy wielki projekt","zaczyna się od pomysłu."]);
 c.font="700 49px Arial,sans-serif";c.fillStyle=fg;c.fillText(headlines[0],48,222);c.fillText(headlines[1],48,279);
 c.font="16px Arial,sans-serif";c.fillStyle=muted;c.fillText(en?"Connect with people who make things happen.":"Połącz się z ludźmi, którzy potrafią działać.",48,322);
 round(48,354,173,41,9,accent);c.fillStyle=classic&&state.dark?"#1a1a1a":"#fff";c.font="600 14px Arial,sans-serif";
 c.fillText(state.role===2?(en?"Explore projects":"Zobacz zlecenia"):(en?"Bring it to life":"Zacznij realizację"),63,380);
 round(48,438,384,207,15,soft);
 c.strokeStyle=muted;c.globalAlpha=.15;c.lineWidth=1;for(let x=67;x<425;x+=28){c.beginPath();c.moveTo(x,453);c.lineTo(x,631);c.stroke();}
 for(let y=460;y<645;y+=28){c.beginPath();c.moveTo(64,y);c.lineTo(415,y);c.stroke();}c.globalAlpha=1;
 c.fillStyle=accent;c.font="700 110px Arial,sans-serif";c.fillText("Aa",92,581);
 c.fillStyle=fg;c.font="600 14px Arial,sans-serif";c.fillText(en?"A new point of view":"Nowy punkt widzenia",73,617);
 round(449,438,193,96,15,fg);c.fillStyle=bg;c.font="700 22px Arial,sans-serif";c.fillText(en?"Your next":"Twój następny",466,477);c.fillText(en?"chapter.":"rozdział.",466,506);
 round(449,549,193,96,15,soft);c.strokeStyle=accent;c.lineWidth=3;c.beginPath();c.moveTo(470,623);c.lineTo(510,581);c.lineTo(548,613);c.lineTo(614,568);c.stroke();
 const gradient=c.createLinearGradient(673,153,1150,584);gradient.addColorStop(0,classic?"#93948d":"#6e86f0");gradient.addColorStop(1,classic?"#d9d8d1":"#b8c8f2");round(677,153,475,493,26,gradient);
 c.save();c.translate(916,382);c.rotate(-.20);
 c.fillStyle="rgba(255,255,255,.22)";c.beginPath();c.ellipse(0,0,170,74,-.25,0,Math.PI*2);c.fill();
 c.fillStyle=classic?"#444640":"#243981";c.font="700 176px Arial,sans-serif";c.textAlign="center";c.fillText("IH",0,65);c.restore();
 c.fillStyle=classic?"#34352f":"#273865";c.font="600 15px Arial,sans-serif";c.fillText(en?"THE FUTURE STARTS WITH YOU":"PRZYSZŁOŚĆ ZACZYNA SIĘ OD CIEBIE",712,607);
 c.fillStyle=muted;c.font="13px Arial,sans-serif";c.fillText(en?"From idea to collaboration.":"Od pomysłu do współpracy.",48,705);
 texture.update();
}
function ih37Start(canvas,state,onPhase,onComplete,onFailure,onFirstFrame){
 let gl,program,vertex,fragment,fieldProgram,fieldVertex,fieldFragment,frame=0,disposed=false,resizeObserver,observer,visible=true,last=0,dirtySize=true;
 const buffers=[],textures=[],listeners=[];
 const listen=(node,type,fn,opts)=>{node.addEventListener(type,fn,opts);listeners.push(()=>node.removeEventListener(type,fn,opts));};
 const destroy=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();observer?.disconnect();listeners.forEach(fn=>fn());
  if(gl&&!gl.isContextLost()){buffers.forEach(b=>gl.deleteBuffer(b));textures.forEach(t=>gl.deleteTexture(t.texture));if(program)gl.deleteProgram(program);if(vertex)gl.deleteShader(vertex);if(fragment)gl.deleteShader(fragment);if(fieldProgram)gl.deleteProgram(fieldProgram);if(fieldVertex)gl.deleteShader(fieldVertex);if(fieldFragment)gl.deleteShader(fieldFragment);}};
 try{
  gl=canvas.getContext("webgl",{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:true,powerPreference:"low-power"});
  if(!gl||gl.isContextLost())throw new Error("studio_context");
  const shader=(type,src)=>{const sh=gl.createShader(type);if(!sh)throw new Error("studio_shader");gl.shaderSource(sh,src);gl.compileShader(sh);
   if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);throw new Error("studio_shader");}return sh;};
  vertex=shader(gl.VERTEX_SHADER,IH37_VERTEX);fragment=shader(gl.FRAGMENT_SHADER,IH37_FRAGMENT);
  program=gl.createProgram();if(!program)throw new Error("studio_program");gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("studio_program");gl.useProgram(program);
  const uniforms=Object.fromEntries(["uProjection","uModel","uEye","uColor","uAccent","uFinish","uRough","uDark","uPower","uTime","uTexture"].map(n=>[n,gl.getUniformLocation(program,n)]));
  const attributes=[["aPosition",3,0],["aNormal",3,12],["aUV",2,24]].map(([n,size,offset])=>({location:gl.getAttribLocation(program,n),size,offset}));
  fieldVertex=shader(gl.VERTEX_SHADER,IH37_FIELD_VERTEX);fieldFragment=shader(gl.FRAGMENT_SHADER,IH37_FIELD_FRAGMENT);
  fieldProgram=gl.createProgram();if(!fieldProgram)throw new Error("studio_field_program");gl.attachShader(fieldProgram,fieldVertex);gl.attachShader(fieldProgram,fieldFragment);gl.linkProgram(fieldProgram);
  if(!gl.getProgramParameter(fieldProgram,gl.LINK_STATUS))throw new Error("studio_field_program");
  const fieldUniforms=Object.fromEntries(["uProjection","uTime","uRatio","uPointer","uAccent","uDark","uDots"].map(n=>[n,gl.getUniformLocation(fieldProgram,n)]));
  const fieldPosition=gl.getAttribLocation(fieldProgram,"aPosition"),fieldGeometry=ih37FieldGeometry();
  const fieldMeshes=[fieldGeometry.lines,fieldGeometry.points].map((geometry,i)=>{const b=gl.createBuffer();if(!b)throw new Error("studio_field_buffer");buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geometry),gl.STATIC_DRAW);return{buffer:b,count:geometry.length/3,dots:i};});
  const laptop=ih37BuildLaptop(),meshes=laptop.all.map(item=>{const b=gl.createBuffer();if(!b)throw new Error("studio_buffer");buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(item.geometry),gl.STATIC_DRAW);
   return{...item,buffer:b,count:item.geometry.length/8};});
  const texture=(w,h)=>{const value=ih37CanvasTexture(gl,w,h);textures.push(value);return value;};
  const screen=texture(1200,750),keys=texture(1024,384),brand=texture(512,128);
  keys.context.clearRect(0,0,1024,384);keys.context.textAlign="center";keys.context.textBaseline="middle";keys.context.fillStyle="#bec5cf";
  laptop.rows.forEach((row,y)=>row.forEach((label,x)=>{keys.context.font=(label.length>2?"12":"18")+"px Arial,sans-serif";keys.context.fillText(label,32+x*64,32+y*64);}));keys.update();
  brand.context.clearRect(0,0,512,128);brand.context.fillStyle="#ced3dc";brand.context.font="500 48px Arial,sans-serif";brand.context.textAlign="center";brand.context.fillText("ideahire",256,82);brand.update();
  const textureMap={screen,keys,brand};let screenKey="",phase=-1,completed=state.current.intro>=IH37_DURATION,painted=false,previousActive=false,renderScale=1,slowFrames=0;
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1i(uniforms.uTexture,0);
  const schedule=()=>{if(!disposed&&!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);};
  function draw(now){
   frame=0;if(disposed||!visible||document.hidden)return;
   const s=state.current,active=!s.paused&&!s.reduced,compact=canvas.closest(".ihfilm-hero").clientWidth<=760;
   const limit=1000/(compact?24:30);if(active&&!s.dirty&&last&&now-last<limit){schedule();return;}
   const elapsed=active&&previousActive&&last?Math.max(0,(now-last)/1000):0,dt=Math.min(.12,elapsed);last=now;previousActive=active;
   if(active&&elapsed>(compact?.068:.054))slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
   if(slowFrames>=6&&renderScale>.65){renderScale=Math.max(.65,renderScale*.85);slowFrames=0;dirtySize=true;}
   if(active){s.time+=dt;s.intro=Math.min(IH37_DURATION,s.intro+dt);s.lidValue+=((s.closed?0:1)-s.lidValue)*Math.min(1,dt*6);}
   if(s.reduced){s.intro=IH37_DURATION;s.lidValue=s.closed?0:1;}
   if(dirtySize){const r=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,compact?1.6:1.7);
    const w=Math.max(1,Math.round(Math.min(r.width*ratio,1400)*renderScale)),h=Math.max(1,Math.round(r.height*w/Math.max(1,r.width)));
    canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);dirtySize=false;}
   const p=s.intro/IH37_DURATION,e=IH37.ease(.05,.95,p),open=IH37.ease(.17,.82,p)*s.lidValue;
   if(!active)s.reveal=p>=1?1:0;else s.reveal+=((p>=1?1:0)-s.reveal)*Math.min(1,dt*5.3);
   const angle=-.38+e*.79,distance=compact?6.65:6.10,eye=[Math.sin(angle)*distance,2.7-e*.2,Math.cos(angle)*distance];
   const view=IH37.look(eye,[0,.17+e*.62,0]),sceneWidth=compact?canvas.width:Math.max(1,Math.round(canvas.width*(1-s.reveal*.36))),sceneLeft=canvas.width-sceneWidth;
   const projection=IH37.perspective(.68,sceneWidth/canvas.height);
   gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(fieldProgram);
   for(const a of attributes)if(a.location>=0)gl.disableVertexAttribArray(a.location);
   gl.enableVertexAttribArray(fieldPosition);gl.depthMask(false);
   const fieldView=IH37.multiply(IH37.perspective(.78,canvas.width/canvas.height),IH37.look([0,2.6,6.6],[0,-.5,-.8]));
   gl.uniformMatrix4fv(fieldUniforms.uProjection,false,fieldView);gl.uniform1f(fieldUniforms.uTime,s.time);gl.uniform1f(fieldUniforms.uRatio,Math.min(1.5,canvas.width/Math.max(1,canvas.clientWidth)));
   gl.uniform2fv(fieldUniforms.uPointer,s.pointer);gl.uniform1f(fieldUniforms.uDark,s.dark?1:0);
   gl.uniform3fv(fieldUniforms.uAccent,s.classic?(s.dark?[.57,.61,.55]:[.35,.40,.35]):[.21,.46,.95]);
   for(const mesh of fieldMeshes){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.vertexAttribPointer(fieldPosition,3,gl.FLOAT,false,12,0);gl.uniform1f(fieldUniforms.uDots,mesh.dots);gl.drawArrays(mesh.dots?gl.POINTS:gl.LINES,0,mesh.count);}
   gl.disableVertexAttribArray(fieldPosition);gl.depthMask(true);gl.useProgram(program);gl.viewport(sceneLeft,0,sceneWidth,canvas.height);
   gl.uniformMatrix4fv(uniforms.uProjection,false,IH37.multiply(projection,view));gl.uniform3fv(uniforms.uEye,eye);
   const accent=s.classic?(s.dark?[.84,.85,.83]:[.37,.40,.39]):[.17,.37,.95];
   gl.uniform3fv(uniforms.uAccent,accent);gl.uniform1f(uniforms.uDark,s.dark?1:0);gl.uniform1f(uniforms.uPower,IH37.ease(.40,.86,p));gl.uniform1f(uniforms.uTime,s.time);
   const nextKey=[s.dark,s.classic,s.language,s.role].join(":");if(nextKey!==screenKey){ih37Screen(screen,s);screenKey=nextKey;}
   const yaw=s.yaw+(s.reduced?0:Math.sin(s.time*.18)*.10);
   const root=IH37.multiply(IH37.move(0,.025+(s.reduced?0:Math.sin(s.time*.45)*.022),0),IH37.multiply(IH37.ry(yaw),IH37.rx(s.pitch)));
   const lid=IH37.multiply(root,IH37.multiply(IH37.move(0,.14,-1.1),IH37.rx(-1.83*open)));
   const pen=IH37.multiply(root,IH37.move(0,s.reduced?0:Math.sin(s.time*.35+1)*.045,0));
   for(const item of meshes){
    const group=item.group==="lid"?lid:item.group==="pen"?pen:item.group==="floor"?IH37.identity():root;
    gl.uniformMatrix4fv(uniforms.uModel,false,IH37.multiply(group,item.transform));
    gl.uniform3fv(uniforms.uColor,item.color);gl.uniform1f(uniforms.uFinish,item.finish);gl.uniform1f(uniforms.uRough,item.rough);
    gl.bindTexture(gl.TEXTURE_2D,textureMap[item.texture]?.texture||screen.texture);
    gl.bindBuffer(gl.ARRAY_BUFFER,item.buffer);
    for(const a of attributes){if(a.location>=0){gl.enableVertexAttribArray(a.location);gl.vertexAttribPointer(a.location,a.size,gl.FLOAT,false,32,a.offset);}}
    gl.depthMask(item.group!=="floor");gl.drawArrays(gl.TRIANGLES,0,item.count);
   }gl.depthMask(true);s.dirty=false;
   if(!painted){painted=true;onFirstFrame();}
   const nextPhase=p<.25?0:p<.65?1:p<1?2:3;if(phase!==nextPhase){phase=nextPhase;onPhase(phase);}
   if(p<1)completed=false;if(p>=1&&!completed){completed=true;onComplete();}
   if(active)schedule();
  }
  const resize=()=>{renderScale=1;slowFrames=0;dirtySize=true;state.current.dirty=true;schedule();};
  if(typeof ResizeObserver!=="undefined"){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);}else listen(window,"resize",resize);
  if(typeof IntersectionObserver!=="undefined"){observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;last=0;
   if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:"80px"});observer.observe(canvas);}
  listen(document,"visibilitychange",()=>{last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
  listen(canvas,"webglcontextlost",event=>{event.preventDefault();destroy();onFailure();});
  schedule();return{destroy,wake:()=>{state.current.dirty=true;schedule();}};
 }catch{destroy();onFailure();return{destroy,wake:()=>{}};}
}


const IH37_STYLES = [
 "#root#root#root .ihfilm-hero{--film-bg:#eef1f6;--film-fg:#142035;--film-muted:#58657a;--film-accent:#315fed;--film-soft:rgba(41,70,110,.13);--film-chip:rgba(248,250,253,.7);--film-button:#172844;--film-button-fg:#fff;position:relative!important;display:block!important;width:100%!important;max-width:none!important;height:clamp(580px,calc(100svh - 94px),760px)!important;min-height:580px!important;margin:0 0 58px!important;overflow:hidden!important;isolation:isolate;border:0!important;border-radius:0!important;background:var(--film-bg)!important;color:var(--film-fg)!important;box-shadow:none!important;}",
 "#root#root#root .ihfilm-hero[data-dark=\"true\"]{--film-bg:#070a10;--film-fg:#f1f4fa;--film-muted:#a5afbf;--film-accent:#88aaff;--film-soft:rgba(166,188,228,.17);--film-chip:rgba(14,20,31,.66);--film-button:#e4ecfb;--film-button-fg:#15223c;}",
 "#root#root#root .ihfilm-hero[data-classic=\"true\"]{--film-bg:#efede8;--film-fg:#242722;--film-muted:#64675f;--film-accent:#42483d;--film-soft:rgba(55,61,51,.16);--film-chip:rgba(251,250,246,.74);--film-button:#242722;--film-button-fg:#fff;}",
 "#root#root#root .ihfilm-hero[data-classic=\"true\"][data-dark=\"true\"]{--film-bg:#111310;--film-fg:#f1f0e9;--film-muted:#adb2a7;--film-accent:#d3d9ca;--film-soft:rgba(222,227,216,.16);--film-chip:rgba(20,24,19,.68);--film-button:#e9ede2;--film-button-fg:#20251b;}",
 "#root#root#root .ihfilm-hero *,#root#root#root .ihfilm-hero *::before,#root#root#root .ihfilm-hero *::after{box-sizing:border-box;}",
 "#root#root#root .ihfilm-atmosphere{position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 76% 38%,color-mix(in srgb,var(--film-accent) 10%,transparent),transparent 54%),linear-gradient(160deg,transparent 40%,color-mix(in srgb,var(--film-fg) 3%,transparent) 90%);}",
 "#root#root#root .ihfilm-beam{position:absolute;left:41%;top:-65%;width:24%;height:160%;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--film-accent) 8%,transparent),transparent);transform:rotate(35deg);filter:blur(36px);animation:ihfilm-beam 22s ease-in-out infinite alternate;opacity:.6;}",
 "#root#root#root .ihfilm-ghost{position:absolute!important;z-index:0!important;right:4%;top:10%;font-size:clamp(120px,19vw,320px)!important;font-weight:750!important;letter-spacing:-.075em!important;line-height:1!important;color:var(--film-fg)!important;opacity:.035!important;pointer-events:none!important;white-space:nowrap!important;}",
 "#root#root#root .ihfilm-stage{position:absolute;z-index:1;right:0;top:0;bottom:53px;width:100%;}",
 "#root#root#root .ihfilm-hero[data-ready=\"false\"] .ihfilm-stage{width:100%;}",
 "#root#root#root .ihfilm-canvas{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;cursor:grab;touch-action:pan-y;opacity:1;transition:opacity .45s ease;}",
 "#root#root#root .ihfilm-canvas:active{cursor:grabbing;}",
 "#root#root#root .ihfilm-canvas:focus-visible{outline:2px solid var(--film-accent);outline-offset:-5px;}",
 "#root#root#root .ihfilm-hero[data-gpu=\"false\"] .ihfilm-canvas{opacity:0;pointer-events:none;}",
 "#root#root#root .ihfilm-topline{position:absolute;z-index:5;top:29px;left:clamp(24px,6vw,106px);right:clamp(24px,4vw,80px);display:flex;align-items:center;justify-content:space-between;gap:16px;}",
 "#root#root#root .ihfilm-wordmark{display:flex;align-items:center;gap:11px;font-size:10px!important;font-weight:650!important;letter-spacing:.11em!important;color:var(--film-muted)!important;line-height:1.4!important;}",
 "#root#root#root .ihfilm-wordmark i{height:6px;width:6px;border-radius:50%;display:block;background:var(--film-accent);box-shadow:0 0 15px color-mix(in srgb,var(--film-accent) 30%,transparent);}",
 "#root#root#root .ihfilm-controls{display:flex;align-items:center;gap:7px;}",
 "#root#root#root .ihfilm-control{appearance:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-width:39px!important;width:auto!important;height:39px!important;margin:0!important;padding:0 10px!important;border:1px solid var(--film-soft)!important;border-radius:50px!important;background:var(--film-chip)!important;color:var(--film-fg)!important;font:inherit!important;font-size:11px!important;font-weight:550!important;line-height:1!important;box-shadow:none!important;transform:none!important;cursor:pointer;backdrop-filter:blur(12px);transition:border-color .2s ease!important;}",
 "#root#root#root .ihfilm-control svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.55;flex:none;}",
 "#root#root#root .ihfilm-control:hover{border-color:var(--film-accent)!important;}",
 "#root#root#root .ihfilm-control:disabled{opacity:.45;cursor:default;}",
 "#root#root#root .ihfilm-control:focus-visible,#root#root#root .ihfilm-cta:focus-visible,#root#root#root .ihfilm-live:focus-visible{outline:2px solid var(--film-accent)!important;outline-offset:4px!important;}",
 "#root#root#root .ihfilm-copy{position:absolute!important;z-index:4!important;left:clamp(24px,6vw,106px)!important;top:27%!important;width:42%!important;max-width:650px!important;opacity:0;transform:translateY(14px);pointer-events:none;transition:opacity .85s ease .12s,transform 1s cubic-bezier(.2,.7,.15,1) .12s;}",
 "#root#root#root .ihfilm-hero[data-ready=\"true\"] .ihfilm-copy{opacity:1;transform:none;pointer-events:auto;}",
 "#root#root#root .ihfilm-eyebrow{display:block!important;margin:0 0 19px!important;font-size:10px!important;font-weight:650!important;letter-spacing:.16em!important;color:var(--film-muted)!important;line-height:1.4!important;text-transform:uppercase!important;}",
 "#root#root#root .ihfilm-title{display:block!important;margin:0!important;padding:0!important;color:var(--film-fg)!important;font-family:inherit!important;font-size:clamp(54px,6.3vw,94px)!important;font-weight:650!important;line-height:1.02!important;letter-spacing:-.065em!important;max-width:100%!important;text-wrap:initial!important;word-break:normal!important;overflow-wrap:normal!important;}",
 "#root#root#root .ihfilm-title span{display:block!important;white-space:nowrap!important;color:var(--film-fg)!important;}",
 "#root#root#root .ihfilm-title span:last-child{color:var(--film-accent)!important;font-weight:450!important;}",
 "#root#root#root .ihfilm-description{margin:25px 0 0!important;font-size:15px!important;font-weight:400!important;line-height:1.65!important;color:var(--film-muted)!important;max-width:330px!important;}",
 "#root#root#root .ihfilm-actions{display:flex!important;align-items:stretch!important;gap:11px!important;margin:29px 0 0!important;}",
 "#root#root#root .ihfilm-cta{display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:19px!important;min-width:0!important;min-height:51px!important;padding:0 19px!important;border:1px solid var(--film-soft)!important;border-radius:6px!important;background:var(--film-chip)!important;color:var(--film-fg)!important;font-family:inherit!important;font-size:13px!important;font-weight:600!important;line-height:1.3!important;text-decoration:none!important;box-shadow:none!important;transform:none!important;transition:background .2s ease,border-color .2s ease!important;}",
 "#root#root#root .ihfilm-cta:first-child{color:var(--film-button-fg)!important;background:var(--film-button)!important;border-color:var(--film-button)!important;}",
 "#root#root#root .ihfilm-cta svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;flex:none;transition:transform .2s ease;}",
 "#root#root#root .ihfilm-cta:hover{border-color:var(--film-accent)!important;}",
 "#root#root#root .ihfilm-cta:hover svg{transform:translate(2px,-2px);}",
 "#root#root#root .ihfilm-foot{position:absolute;z-index:4;left:clamp(24px,6vw,106px);right:clamp(24px,4vw,80px);bottom:22px;border-top:1px solid var(--film-soft);padding-top:17px;display:flex;align-items:center;justify-content:space-between;gap:18px;color:var(--film-muted);}",
 "#root#root#root .ihfilm-caption{font-size:10px!important;letter-spacing:.04em!important;line-height:1.4!important;display:flex;gap:10px;align-items:center;pointer-events:none;}",
 "#root#root#root .ihfilm-caption svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.4;}",
 "#root#root#root .ihfilm-live{display:inline-flex;align-items:center;gap:10px;min-width:0;max-width:330px;color:var(--film-muted)!important;font-size:10px!important;text-decoration:none!important;line-height:1.4!important;}",
 "#root#root#root .ihfilm-live span{white-space:nowrap;}",
 "#root#root#root .ihfilm-live strong{font:inherit!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
 "#root#root#root .ihfilm-phase{position:absolute;z-index:4;left:clamp(24px,6vw,106px);bottom:82px;display:flex;align-items:center;gap:20px;color:var(--film-fg);transition:opacity .3s ease;}",
 "#root#root#root .ihfilm-phase span:first-child{font-size:11px!important;font-variant-numeric:tabular-nums;color:var(--film-muted);}",
 "#root#root#root .ihfilm-phase span:last-child{font-size:18px!important;font-weight:500!important;letter-spacing:-.015em;}",
 "#root#root#root .ihfilm-hero[data-ready=\"true\"] .ihfilm-phase{opacity:0;pointer-events:none;}",
 "#root#root#root .ihfilm-sr{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important;}",
 "#root#root#root .ihfilm-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;perspective:900px;}",
 "#root#root#root .ihfilm-fallback-laptop{position:relative;width:300px;height:195px;transform:rotateY(-17deg) rotateZ(-5deg);transform-style:preserve-3d;}",
 "#root#root#root .ihfilm-fallback-screen{position:absolute;inset:0;border:9px solid #647180;border-radius:11px;background:linear-gradient(130deg,#1b273a,#101b2b);color:#eff3fb;font-size:28px;font-weight:550;display:grid;place-items:center;box-shadow:10px 20px 35px rgba(0,0,0,.16);}",
 "#root#root#root .ihfilm-fallback-base{position:absolute;top:100%;left:-10px;right:-10px;height:105px;border-radius:4px 4px 17px 17px;background:repeating-linear-gradient(90deg,transparent 0 19px,rgba(20,31,47,.6) 20px 22px),linear-gradient(#6f7c8d,#b1bbc8);transform-origin:top;transform:rotateX(70deg);border:3px solid #818e9e;}",
 "#root#root#root .ihfilm-hero[data-gpu=\"true\"] .ihfilm-fallback{visibility:hidden;}",
 "@keyframes ihfilm-beam{from{transform:translateX(-25%) rotate(35deg);opacity:.35;}to{transform:translateX(120%) rotate(35deg);opacity:.7;}}",
 "#root#root#root .ihfilm-hero[data-paused=\"true\"] .ihfilm-beam{animation-play-state:paused;}",
 "@media(max-width:1080px) and (min-width:761px){",
 " #root#root#root .ihfilm-copy{left:34px!important;width:43%!important;}",
 " #root#root#root .ihfilm-stage{width:100%;}",
 " #root#root#root .ihfilm-title{font-size:clamp(50px,6vw,65px)!important;}",
 " #root#root#root .ihfilm-description{font-size:14px!important;max-width:285px!important;}",
 " #root#root#root .ihfilm-actions{gap:8px!important;}",
 " #root#root#root .ihfilm-cta{padding:0 13px!important;font-size:12px!important;gap:10px!important;}",
 "}",
 "@media(max-width:760px){",
 " #root#root#root .ihfilm-hero{height:720px!important;min-height:720px!important;margin-bottom:37px!important;}",
 " #root#root#root .ihfilm-stage,#root#root#root .ihfilm-hero[data-ready=\"false\"] .ihfilm-stage{top:47px;bottom:auto;width:100%;height:345px;transition:none;}",
 " #root#root#root .ihfilm-topline{top:18px;left:24px;right:24px;gap:10px;}",
 " #root#root#root .ihfilm-wordmark{font-size:9px!important;letter-spacing:.055em!important;}",
 " #root#root#root .ihfilm-control{height:35px!important;min-width:35px!important;padding:0 8px!important;font-size:10px!important;}",
 " #root#root#root .ihfilm-control svg{width:14px;height:14px;}",
 " #root#root#root .ihfilm-copy{top:auto!important;bottom:103px!important;left:24px!important;right:24px!important;width:auto!important;max-width:none!important;transform:translateY(12px)!important;}",
 " #root#root#root .ihfilm-hero[data-ready=\"true\"] .ihfilm-copy{transform:none!important;}",
 " #root#root#root .ihfilm-title{font-size:clamp(46px,10.4vw,60px)!important;letter-spacing:-.06em!important;}",
 " #root#root#root .ihfilm-description{font-size:14px!important;margin-top:18px!important;max-width:360px!important;line-height:1.6!important;}",
 " #root#root#root .ihfilm-eyebrow{font-size:9px!important;margin-bottom:12px!important;}",
 " #root#root#root .ihfilm-actions{margin-top:21px!important;gap:10px!important;}",
 " #root#root#root .ihfilm-cta{flex:1!important;padding:0 13px!important;font-size:12px!important;gap:8px!important;min-height:49px!important;}",
 " #root#root#root .ihfilm-cta svg{width:14px;height:14px;}",
 " #root#root#root .ihfilm-ghost{right:3%;top:9%;font-size:clamp(110px,27vw,210px)!important;}",
 " #root#root#root .ihfilm-foot{left:24px;right:24px;bottom:24px;gap:12px;flex-wrap:wrap;padding-top:15px;}",
 " #root#root#root .ihfilm-caption,#root#root#root .ihfilm-live{font-size:9px!important;}",
 " #root#root#root .ihfilm-live strong{display:none;}",
 " #root#root#root .ihfilm-phase{left:24px;bottom:127px;}",
 " #root#root#root .ihfilm-fallback-laptop{width:265px;height:172px;}",
 "}",
 "@media(max-width:360px){",
 " #root#root#root .ihfilm-hero{height:778px!important;min-height:778px!important;}",
 " #root#root#root .ihfilm-stage,#root#root#root .ihfilm-hero[data-ready=\"false\"] .ihfilm-stage{height:321px;}",
 " #root#root#root .ihfilm-topline{left:20px;right:20px;}",
 " #root#root#root .ihfilm-wordmark{letter-spacing:0!important;}",
 " #root#root#root .ihfilm-copy{left:20px!important;right:20px!important;bottom:100px!important;}",
 " #root#root#root .ihfilm-title{font-size:43px!important;}",
 " #root#root#root .ihfilm-actions{flex-direction:column!important;gap:8px!important;}",
 " #root#root#root .ihfilm-cta{font-size:13px!important;}",
 " #root#root#root .ihfilm-foot{left:20px;right:20px;}",
 "}",
 "@media(prefers-reduced-motion:reduce){#root#root#root .ihfilm-hero *,#root#root#root .ihfilm-hero *::before,#root#root#root .ihfilm-hero *::after{animation:none!important;transition:none!important;}}",
 "@media print{#root#root#root .ihfilm-canvas,#root#root#root .ihfilm-controls,#root#root#root .ihfilm-foot{display:none!important;}#root#root#root .ihfilm-copy{position:relative!important;top:auto!important;left:auto!important;width:auto!important;opacity:1!important;transform:none!important;padding:24px;}#root#root#root .ihfilm-hero{height:auto!important;min-height:0!important;}}"
].join("\n");


const IH37_DURATION=5.0;
const IH37_SEEN=new Set();
const IH37_COPY={
 pl:{region:"Od pomysłu do projektu",eyebrow:"Twój pomysł zasługuje na ciąg dalszy.",title:"Masz pomysł.",subtitle:"Daj mu życie.",
  description:"Znajdź kogoś, kto go zrealizuje. Albo odkryj projekt dla siebie.",talent:"Znajdź wykonawcę",jobs:"Znajdź zlecenie",
  skip:"Pomiń wstęp",replay:"Odtwórz wstęp",pause:"Zatrzymaj animację",resume:"Wznów animację",off:"Animacja ograniczona",
  close:"Zamknij laptop",open:"Otwórz laptop",rotate:"Obróć model laptopa",drag:"Przeciągnij i obróć model",browse:"Odkryj aktualne zlecenia",
  live:"Nowe w IdeaHire",help:"Przeciągnij, aby obrócić laptop. Strzałki klawiatury także zmieniają widok. Home przywraca kadr.",
  phases:["Zaczyna się od pomysłu.","Dodaj talent.","Twórz coś własnego.","Od pomysłu do realizacji."]},
 en:{region:"From idea to project",eyebrow:"Your idea deserves a next chapter.",title:"Your idea.",subtitle:"Made real.",
  description:"Find someone who can bring it to life. Or discover a project of your own.",talent:"Find a freelancer",jobs:"Find a project",
  skip:"Skip intro",replay:"Replay intro",pause:"Pause animation",resume:"Resume animation",off:"Reduced animation",
  close:"Close laptop",open:"Open laptop",rotate:"Rotate the laptop model",drag:"Drag to rotate the model",browse:"Explore current projects",
  live:"New on IdeaHire",help:"Drag to rotate the laptop. Arrow keys also change the view. Home resets the framing.",
  phases:["It starts with an idea.","Add the right talent.","Create something of your own.","From idea to reality."]}
};
function ih37Reduced(){return typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}
function IH37Icon({kind}){
 const paths={arrow:"M5 19 19 5M6 5h13v13",pause:"M9 6v12M15 6v12",play:"m8 5 11 7-11 7z",
  replay:"M4 9a8 8 0 1 1 0 6M4 4v5h5",laptop:"M5 4h14v12H5zM3 20h18l-2-4H5z",move:"M4 12h16M12 4v16m-5-7-3 3 3 3m10-6 3 3-3 3"};
 return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]||paths.arrow}/></svg>;
}
export function IdeaHireCinematicHero({job,userKey="guest"}){
 const site=useSitePreferences(),[reduced,setReduced]=useState(ih37Reduced);
 const [ready,setReady]=useState(()=>IH37_SEEN.has(userKey)||ih37Reduced()),[phase,setPhase]=useState(0);
 const [paused,setPaused]=useState(false),[closed,setClosed]=useState(false),[gpu,setGpu]=useState(false);
 const canvasRef=useRef(null),engineRef=useRef(null),dragRef=useRef(null),userRef=useRef(userKey);
 const motion=useRef({intro:ready?IH37_DURATION:0,time:0,yaw:0,pitch:0,role:0,paused:false,closed:false,lidValue:1,reveal:ready?1:0,pointer:[2,0],
  reduced,dark:site.theme==="dark",classic:site.template==="classic",language:site.language,dirty:true});
 const text=IH37_COPY[site.language==="en"?"en":"pl"];
 const realJob=job?.id&&/^[0-9a-f-]{36}$/i.test(String(job.id))?job:null;
 const complete=()=>{IH37_SEEN.add(userRef.current);setReady(true);setPhase(3);};
 useLayoutEffect(()=>{userRef.current=userKey;},[userKey]);
 useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduced(media.matches);update();
  media.addEventListener?.("change",update);return()=>media.removeEventListener?.("change",update);},[]);
 useLayoutEffect(()=>{
  Object.assign(motion.current,{dark:site.theme==="dark",classic:site.template==="classic",language:site.language,reduced,paused,closed});
  if(reduced){motion.current.intro=IH37_DURATION;complete();}
  engineRef.current?.wake();
 },[site.theme,site.template,site.language,reduced,paused,closed]);
 useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return undefined;
  const engine=ih37Start(canvas,motion,setPhase,complete,()=>{setGpu(false);complete();},()=>setGpu(true));
  engineRef.current=engine;return()=>{engine.destroy();engineRef.current=null;};},[]);
 const wake=()=>engineRef.current?.wake();
 function skip(){Object.assign(motion.current,{intro:IH37_DURATION,lidValue:1,reveal:1});setClosed(false);complete();wake();}
 function replay(){
  if(reduced||!gpu){skip();return;}
  Object.assign(motion.current,{intro:0,time:0,yaw:0,pitch:0,closed:false,lidValue:1,reveal:0});setClosed(false);setPaused(false);setReady(false);setPhase(0);wake();
 }
 function toggleLid(){const value=!closed;if(paused||reduced)motion.current.lidValue=value?0:1;setClosed(value);wake();}
 function down(event){if(!ready||event.button!==0)return;dragRef.current={id:event.pointerId,x:event.clientX,y:event.clientY};
  try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* System może przejąć gest dotykowy. */}}
 function move(event){if(!paused&&!reduced){const r=event.currentTarget.getBoundingClientRect();motion.current.pointer=[((event.clientX-r.left)/Math.max(1,r.width)-.5)*12,((event.clientY-r.top)/Math.max(1,r.height)-.5)*8];}
  const d=dragRef.current;if(!d||d.id!==event.pointerId)return;
  motion.current.yaw+=(event.clientX-d.x)*.007;motion.current.pitch=Math.max(-.25,Math.min(.25,motion.current.pitch+(event.clientY-d.y)*.003));
  d.x=event.clientX;d.y=event.clientY;wake();}
 function up(event){if(dragRef.current?.id!==event.pointerId)return;dragRef.current=null;
  try{event.currentTarget.releasePointerCapture(event.pointerId);}catch{/* Gest mógł zostać anulowany. */}}
 function keys(event){if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home"].includes(event.key))return;event.preventDefault();
  if(event.key==="Home"){motion.current.yaw=0;motion.current.pitch=0;}
  else if(event.key==="ArrowLeft")motion.current.yaw-=.15;
  else if(event.key==="ArrowRight")motion.current.yaw+=.15;
  else motion.current.pitch=Math.max(-.25,Math.min(.25,motion.current.pitch+(event.key==="ArrowUp"?-.06:.06)));
  wake();
 }
 function role(value){motion.current.role=value;wake();}
 return <section className="ihfilm-hero" data-cinematic-version="P37-2026-10-14" data-no-translate="true"
  data-ready={ready} data-gpu={gpu} data-paused={paused||reduced} data-dark={site.theme==="dark"} data-classic={site.template==="classic"}
  data-closed={closed} aria-label={text.region}>
  <style>{IH37_STYLES}</style>
  <div className="ihfilm-atmosphere" aria-hidden="true"><div className="ihfilm-beam"/><span className="ihfilm-ghost">CREATE.</span></div>
  <div className="ihfilm-stage">
   <div className="ihfilm-fallback" aria-hidden="true"><div className="ihfilm-fallback-laptop">
    <div className="ihfilm-fallback-screen">IdeaHire</div><div className="ihfilm-fallback-base"/></div></div>
   <canvas ref={canvasRef} className="ihfilm-canvas" role="img" aria-label={text.rotate} aria-describedby="ihfilm-rotation-help"
    tabIndex={ready&&gpu?0:-1} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
    onLostPointerCapture={()=>{dragRef.current=null;}} onKeyDown={keys}/>
  </div>
  <p id="ihfilm-rotation-help" className="ihfilm-sr">{text.help}</p>
  <div className="ihfilm-topline"><span className="ihfilm-wordmark"><i aria-hidden="true"/>IDEAHIRE</span>
   <div className="ihfilm-controls">
    <button className="ihfilm-control" type="button" onClick={ready?replay:skip} title={ready?text.replay:text.skip} aria-label={ready?text.replay:text.skip}>
     <IH37Icon kind={ready?"replay":"arrow"}/>{!ready&&<span>{text.skip}</span>}</button>
    {ready&&<button className="ihfilm-control" type="button" onClick={toggleLid} title={closed?text.open:text.close} aria-label={closed?text.open:text.close} aria-pressed={closed} disabled={!gpu}>
     <IH37Icon kind="laptop"/></button>}
    <button className="ihfilm-control" type="button" onClick={()=>setPaused(value=>!value)}
     title={reduced?text.off:paused?text.resume:text.pause} aria-label={reduced?text.off:paused?text.resume:text.pause}
     aria-pressed={paused||reduced} disabled={reduced}><IH37Icon kind={paused&&!reduced?"play":"pause"}/></button>
   </div>
  </div>
  <div className="ihfilm-phase" aria-hidden="true"><span>0{Math.min(phase,2)+1}</span><span>{text.phases[phase]}</span></div>
  <div className="ihfilm-copy" inert={!ready?"":undefined} aria-hidden={!ready}>
   <span className="ihfilm-eyebrow">{text.eyebrow}</span>
   <h1 className="ihfilm-title"><span>{text.title}</span><span>{text.subtitle}</span></h1>
   <p className="ihfilm-description">{text.description}</p>
   <div className="ihfilm-actions">
    <Link className="ihfilm-cta" to="/find-talent" tabIndex={ready?0:-1} onPointerEnter={()=>role(1)} onPointerLeave={()=>role(0)} onFocus={()=>role(1)} onBlur={()=>role(0)}>
     {text.talent}<IH37Icon kind="arrow"/></Link>
    <Link className="ihfilm-cta" to="/jobs" tabIndex={ready?0:-1} onPointerEnter={()=>role(2)} onPointerLeave={()=>role(0)} onFocus={()=>role(2)} onBlur={()=>role(0)}>
     {text.jobs}<IH37Icon kind="arrow"/></Link>
   </div>
  </div>
  <div className="ihfilm-foot">
   <span className="ihfilm-caption"><IH37Icon kind="move"/>{ready?text.drag:text.phases[phase]}</span>
   <Link className="ihfilm-live" to="/jobs" aria-label={text.browse}><span>{realJob?text.live:text.browse}</span>
    {realJob&&<strong title={realJob.title}>{String(realJob.title||"").slice(0,140)}</strong>}<span aria-hidden="true">↗</span></Link>
  </div>
 </section>;
}



const categories = [
  { value: "Programowanie", label: "Strony, aplikacje i IT" },
  { value: "Grafika i design", label: "Grafika, UX i 3D" },
  { value: "Marketing", label: "Marketing i sprzedaż" },
  { value: "Copywriting", label: "Teksty i tłumaczenia" },
  { value: "Video", label: "Wideo, animacja i audio" },
  { value: "Fotografia", label: "Fotografia i obróbka zdjęć" },
  { value: "AI i automatyzacje", label: "AI i automatyzacje" },
  { value: "Dane, analizy i research", label: "Dane, analizy i research" },
  { value: "Biznes i e-commerce", label: "Biznes i e-commerce" },
  { value: "Architektura, wnętrza i CAD", label: "Architektura, wnętrza i CAD" },
];

const categoryLabels = Object.fromEntries(
  categories.map((category) => [category.value, category.label])
);

function getCategoryLabel(category) {
  return categoryLabels[category] || category || "Inna kategoria";
}

const fallbackJobs = [
  {
    id: "fallback-1",
    title: "Nowoczesna strona internetowa",
    description:
      "Szukam osoby, która stworzy prostą i szybką stronę dla nowej marki.",
    category: "Programowanie",
    budget: 3000,
  },
  {
    id: "fallback-2",
    title: "Identyfikacja wizualna marki",
    description:
      "Potrzebuję spójnego logo oraz podstawowych materiałów graficznych.",
    category: "Grafika i design",
    budget: 1800,
  },
  {
    id: "fallback-3",
    title: "Teksty na stronę firmową",
    description:
      "Zlecę przygotowanie przejrzystych tekstów do sześciu podstron.",
    category: "Copywriting",
    budget: 900,
  },
];

const HOME_CATEGORY_COPY = {
  Programowanie: { summary: "Strony, sklepy i aplikacje — od pierwszego projektu po integracje i naprawy.", descriptions: [
    "Pojedyncza strona prezentująca ofertę i prowadząca do kontaktu lub zakupu.",
    "Witryna z ofertą firmy, najważniejszymi informacjami i formularzem kontaktowym.",
    "Sklep z katalogiem produktów, koszykiem i obsługą zamówień.",
    "Aplikacja działająca w przeglądarce, dopasowana do potrzeb Twoich użytkowników.",
    "Aplikacja na telefon z funkcjami określonymi w Twoim projekcie.",
    "Budowa lub rozbudowa strony z wykorzystaniem gotowego systemu i narzędzi no-code.",
    "Połączenie usług i systemów, które mają wymieniać dane lub wykonywać wspólne zadania.",
    "Diagnoza i poprawa konkretnych problemów w istniejącej stronie lub aplikacji.",
    "Sprawdzenie wydajności lub bezpieczeństwa oraz lista zaleceń do wdrożenia.",
    "Przeniesienie strony, danych lub usług do nowego środowiska.",
  ] },
  "Grafika i design": { summary: "Wygląd marki, interfejsy i materiały graficzne dopasowane do Twojego projektu.", descriptions: [
    "Znak marki przygotowany do użycia w internecie i materiałach drukowanych.",
    "Spójny zestaw kolorów, typografii i materiałów budujących wygląd marki.",
    "Projekt ekranów i sposobu korzystania ze strony lub aplikacji.",
    "Banery i kreacje dopasowane do kampanii oraz formatów reklamowych.",
    "Zestaw grafik do publikacji na wybranych kanałach społecznościowych.",
    "Ulotki, plakaty lub inne projekty przygotowane do przekazania drukarni.",
    "Projekt wyglądu opakowania lub etykiety z uwzględnieniem wymaganych wymiarów.",
    "Czytelne slajdy z uporządkowaną treścią i spójnym układem.",
    "Autorska ilustracja do publikacji, produktu lub komunikacji marki.",
    "Edytowalne projekty, które możesz później samodzielnie uzupełniać w Canvie.",
    "Model obiektu w trzech wymiarach do dalszej pracy lub prezentacji.",
    "Obraz produktu pokazujący jego wygląd, materiały i detale.",
  ] },
  Marketing: { summary: "Kampanie, treści i analityka pomagające docierać do właściwych odbiorców.", descriptions: [
    "Plan komunikacji, kanałów i działań dopasowany do celów marki.",
    "Analiza widoczności strony w wyszukiwarce i lista konkretnych usprawnień.",
    "Poprawa treści lub elementów wybranych podstron pod określone cele.",
    "Przygotowanie ustawień i struktury kampanii w Google Ads.",
    "Przygotowanie kampanii i ustawień reklam w ekosystemie Meta.",
    "Konfiguracja kampanii reklamowej na TikToku.",
    "Zestaw publikacji z treścią dopasowaną do marki i jej odbiorców.",
    "Przygotowanie wiadomości i struktury kampanii do wybranej grupy odbiorców.",
    "Ustawienie pomiaru zdarzeń i raportów potrzebnych do oceny działań.",
    "Uporządkowana baza potencjalnych kontaktów według wskazanych kryteriów.",
    "Treści i materiały ułatwiające prezentację oferty klientom.",
    "Pomysł i plan współpracy z twórcami w ramach wybranej kampanii.",
  ] },
  Copywriting: { summary: "Teksty, redakcja i tłumaczenia — czytelna komunikacja dopasowana do odbiorców.", descriptions: [
    "Treści na podstrony prezentujące ofertę i pomagające użytkownikowi podjąć decyzję.",
    "Artykuły o ustalonej tematyce, długości i stylu.",
    "Opisy przedstawiające cechy, zastosowanie i najważniejsze informacje o produktach.",
    "Treści odpowiadające na potrzeby odbiorców i wskazane tematy wyszukiwania.",
    "Krótkie komunikaty do reklam, banerów lub kampanii.",
    "Zestaw tekstów do publikacji na wybranych profilach społecznościowych.",
    "Wiadomość do subskrybentów z uporządkowaną treścią i jasnym celem.",
    "Tekst prowadzący nagranie, reklamę lub inną formę opowieści.",
    "Poprawa języka, błędów i struktury istniejącego tekstu.",
    "Redakcja treści AI, sprawdzenie spójności i dopasowanie języka do odbiorców.",
    "Przekład treści między wskazanymi językami z zachowaniem sensu i stylu.",
    "Dostosowanie komunikatów i treści produktu do nowego języka oraz odbiorców.",
    "Przepisanie nagrania do czytelnego tekstu.",
    "Przygotowanie tekstu i synchronizacji napisów do nagrania.",
  ] },
  Video: { summary: "Montaż, animacja i dźwięk — materiały do publikacji, reklamy i prezentacji.", descriptions: [
    "Uporządkowanie ujęć i montaż nagrania według ustalonego celu i długości.",
    "Zestaw krótkich filmów dopasowanych do formatów mediów społecznościowych.",
    "Przygotowanie materiału do publikacji na YouTube.",
    "Film promujący markę, produkt lub usługę.",
    "Wideo prezentujące wygląd, działanie lub zastosowanie produktu.",
    "Animowany materiał objaśniający pomysł lub budujący opowieść.",
    "Animacja typografii i elementów graficznych do filmu lub kampanii.",
    "Materiał wideo przygotowany z wykorzystaniem narzędzi generatywnych.",
    "Dodanie napisów lub przygotowanie wersji filmu w innym języku.",
    "Montaż odcinka, usunięcie przerw i przygotowanie nagrania do publikacji.",
    "Czyszczenie, wyrównanie i poprawa jakości dostarczonego dźwięku.",
    "Nagranie głosu do filmu, prezentacji lub innego materiału.",
    "Krótki motyw muzyczny lub muzyka do wskazanego zastosowania.",
    "Dobór i przygotowanie efektów dźwiękowych budujących charakter materiału.",
  ] },
  Fotografia: { summary: "Zdjęcia i obróbka materiałów — od sesji produktowej po retusz istniejących ujęć.", descriptions: [
    "Zdjęcia produktów do katalogu, sklepu lub materiałów promocyjnych.",
    "Sesja przedstawiająca osoby, zespół lub charakter marki.",
    "Reportaż fotograficzny z wydarzenia według ustalonego zakresu.",
    "Zdjęcia lokalu lub budynku do oferty i prezentacji.",
    "Sesja pojazdu pokazująca jego wygląd i detale.",
    "Sesja portretowa dopasowana do wybranego stylu i przeznaczenia.",
    "Zdjęcia produktów przygotowane do spójnego katalogu internetowego.",
    "Zdjęcia pozwalające oglądać obiekt lub przestrzeń z różnych stron.",
    "Poprawa szczegółów zdjęcia z zachowaniem uzgodnionego wyglądu.",
    "Wycięcie obiektu ze zdjęcia i przygotowanie pliku z wybranym tłem.",
    "Naprawa uszkodzeń i poprawa czytelności starych fotografii.",
  ] },
  "AI i automatyzacje": { summary: "Narzędzia AI i integracje, które upraszczają konkretne zadania w Twojej firmie.", descriptions: [
    "Bot odpowiadający na pytania lub wspierający wybrany proces firmy.",
    "Asystent wykonujący ustalone zadania z wykorzystaniem modeli AI i narzędzi.",
    "Połączenie aplikacji w automatyczny przepływ danych i działań.",
    "Dodanie funkcji AI do istniejącej witryny, aplikacji lub systemu.",
    "Wyszukiwanie i odpowiedzi oparte na wskazanej bazie dokumentów.",
    "Asystent obsługujący wybrane zadania za pomocą rozmowy głosowej.",
    "Automatyczne przetwarzanie dokumentów według ustalonego schematu.",
    "Usprawnienie powtarzalnych pytań i zadań związanych z obsługą klientów.",
    "Analiza procesów i wskazanie miejsc, w których można zastosować AI.",
    "Uporządkowanie i przygotowanie danych do wskazanego zastosowania AI.",
    "Zestaw instrukcji i szablonów pracy z AI dopasowany do zespołu.",
  ] },
  "Dane, analizy i research": { summary: "Porządkowanie informacji, badania i raporty ułatwiające pracę z danymi.", descriptions: [
    "Usunięcie błędów, duplikatów i niespójności w dostarczonych danych.",
    "Uporządkowanie struktury, formatów i obliczeń w arkuszu.",
    "Przeniesienie danych z dokumentu PDF do arkusza nadającego się do dalszej pracy.",
    "Uzupełnienie danych w uzgodnionym systemie lub pliku.",
    "Pozyskanie wskazanych danych ze stron zgodnie z ustalonym zakresem.",
    "Panel raportowy pokazujący wybrane wskaźniki i zestawienia.",
    "Analiza zbioru danych i przedstawienie wniosków dotyczących zadanych pytań.",
    "Czytelne wykresy i zestawienia pokazujące zależności w danych.",
    "Research rynku, odbiorców lub konkurencji w określonym obszarze.",
    "Opracowanie odpowiedzi i podsumowanie wyników badania ankietowego.",
    "Uporządkowanie danych lub przeniesienie ich do nowej bazy.",
    "Oznaczenie przykładów w danych według ustalonej instrukcji.",
  ] },
  "Biznes i e-commerce": { summary: "Wsparcie sklepu i organizacji pracy — katalogi, procedury i materiały biznesowe.", descriptions: [
    "Wprowadzenie produktów, zdjęć i parametrów do katalogu sklepu.",
    "Opracowanie informacji potrzebnych do publikacji produktów.",
    "Przygotowanie konta sprzedawcy na wskazanej platformie.",
    "Ujednolicenie kategorii, parametrów i informacji w katalogu.",
    "Ustawienie lub uporządkowanie danych i procesów w systemie CRM.",
    "Przygotowanie i uporządkowanie kontaktów według wybranych kryteriów.",
    "Zestawienie informacji o ofertach i działaniach wskazanych konkurentów.",
    "Slajdy przedstawiające ofertę, plan lub wyniki działalności.",
    "Opis zasad, procesów i instrukcji potrzebnych w codziennej pracy.",
    "Uporządkowanie etapów, zadań i terminów wybranego projektu.",
    "Przygotowanie ogłoszeń, formularzy lub innych materiałów rekrutacyjnych.",
    "Wykonanie ustalonego zestawu zadań administracyjnych.",
    "Przegląd sklepu i lista usprawnień dotyczących wybranego obszaru.",
  ] },
  "Architektura, wnętrza i CAD": { summary: "Projekty przestrzeni, rysunki i modele do prezentacji lub dalszej pracy.", descriptions: [
    "Projekt aranżacji wnętrza zgodny z potrzebami i zakresem zlecenia.",
    "Plan rozmieszczenia stref i wyposażenia w pomieszczeniu.",
    "Obrazy pokazujące planowany wygląd obiektu lub przestrzeni.",
    "Rysunek techniczny lub projektowy w dwóch wymiarach.",
    "Model obiektu przygotowany w uzgodnionym narzędziu CAD.",
    "Projekt mebla z określeniem wymiarów i uzgodnionych detali.",
    "Model przygotowany do wskazanego procesu druku 3D.",
    "Rysunki i informacje techniczne potrzebne do produkcji.",
    "Koncepcja układu i wyglądu przestrzeni lokalu.",
    "Wizualne przedstawienie budynku, lokalu lub planowanej inwestycji.",
  ] },
};

function HomeCategoryBrowser({ groups }) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(groups[0]?.value || "");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const triggerRef = useRef(null);
  const group = groups.find((item) => item.value === selectedCategory) || groups[0];
  const subcategories = group?.subcategories || [];
  const copy = HOME_CATEGORY_COPY[group?.value];
  const subIndex = subcategories.indexOf(selectedSubcategory);
  const description = subIndex >= 0
    ? copy?.descriptions[subIndex] || copy?.summary
    : copy?.summary;
  const count = groups.reduce((total, item) => total + (item.subcategories?.length || 0), 0);
  const query = new URLSearchParams({ category: group?.value || "" });
  if (selectedSubcategory) query.set("subcategory", selectedSubcategory);

  function closeBrowser() {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  function selectCategory(value) {
    if (value !== selectedCategory) {
      setSelectedCategory(value);
      setSelectedSubcategory("");
    }
  }

  function onMousePreview(event, action) {
    if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) action();
  }

  return (
    <div className={`ih-category-browser${open ? " is-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) { event.preventDefault(); closeBrowser(); }
      }}>
      <button ref={triggerRef} type="button" className="ih-category-trigger"
        aria-expanded={open} aria-controls="ih-category-panel"
        onClick={() => setOpen((current) => !current)}>
        <span className="ih-category-trigger-top"><span>{String(groups.length).padStart(2, "0")} kategorii</span><span className="ih-category-toggle" aria-hidden="true">{open ? "−" : "+"}</span></span>
        <span className="ih-category-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="ih-category-trigger-title">Nasze<br />kategorie</span>
        <span className="ih-category-trigger-bottom"><span>{open ? "Zwiń katalog" : "Odkryj specjalizacje"}</span><span aria-hidden="true">↗</span></span>
      </button>

      <section id="ih-category-panel" className="ih-category-panel" hidden={!open} aria-labelledby="ih-category-panel-title">
        <div className="ih-category-panel-heading">
          <div><span className="ih-category-kicker">Znajdź swój kierunek</span><h3 id="ih-category-panel-title">Kategorie i specjalizacje</h3><p>{groups.length} kategorii{count > 0 ? ` · ${count} specjalizacji` : ""}. Wybierz to, czego potrzebujesz.</p></div>
          <button type="button" className="ih-category-close" onClick={closeBrowser} aria-label="Zamknij kategorie">×</button>
        </div>
        <div className="ih-category-layout">
          <div className="ih-category-list" role="group" aria-label="Wybierz kategorię">
            {groups.map((item, index) => (
              <button type="button" key={item.value} className="ih-category-option" aria-pressed={item.value === group?.value}
                onClick={() => selectCategory(item.value)} onFocus={() => selectCategory(item.value)}
                onPointerEnter={(event) => onMousePreview(event, () => selectCategory(item.value))}>
                <span className="ih-category-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span>{item.label}</span><span className="ih-category-option-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <div className="ih-category-content">
            <div className="ih-category-content-heading"><span className="ih-category-kicker">Specjalizacje</span><h4>{group?.label}</h4></div>
            <div className="ih-subcategory-grid" role="group" aria-label={`Specjalizacje: ${group?.label}`}>
              {subcategories.map((item) => (
                <button type="button" className="ih-subcategory-option" key={item} aria-pressed={item === selectedSubcategory} aria-describedby="ih-category-description"
                  onClick={() => setSelectedSubcategory(item)} onFocus={() => setSelectedSubcategory(item)}
                  onPointerEnter={(event) => onMousePreview(event, () => setSelectedSubcategory(item))}>
                  <span>{item}</span><span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div className="ih-category-detail" id="ih-category-description">
              <span className="ih-category-kicker">{selectedSubcategory ? "O tej specjalizacji" : "O tej kategorii"}</span>
              <strong>{selectedSubcategory || group?.label}</strong><p>{description || "Przejrzyj zlecenia w tej kategorii i znajdź projekt dla siebie."}</p>
            </div>
            <div className="ih-category-links">
              <Link className="ih-category-jobs-link" to={`/jobs?${query.toString()}`}>Pokaż zlecenia <span aria-hidden="true">↗</span></Link>
              {selectedSubcategory && <Link className="ih-category-all-link" to={`/jobs?${new URLSearchParams({ category: group?.value }).toString()}`}>Cała kategoria</Link>}
              <Link className="ih-category-all-link" to="/jobs">Wszystkie zlecenia</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


function HomeNavItem({ children, order, to, href, notification = false }) {
  const Item = to ? Link : "a";
  return (
    <Item
      {...(to ? { to } : { href })}
      className={`ih-nav-item${to === "/notifications" ? " home-notifications-link" : ""}`}
      style={{ "--ih-nav-order": order }}
    >
      <span className="ih-nav-pixels" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span className="ih-nav-label">{children}</span>
      {notification && <span className="home-notifications-dot" aria-label="Nowe powiadomienia" />}
    </Item>
  );
}

function HomeAccountMenu({ name, avatarUrl, initial, onOpen }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const viewport = window.visualViewport;
    let frame = 0;
    function placeMenu() {
      frame = 0;
      const menu = menuRef.current;
      const trigger = triggerRef.current;
      if (!menu || !trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const offsetLeft = viewport?.offsetLeft || 0;
      const offsetTop = viewport?.offsetTop || 0;
      const menuWidth = Math.max(0, Math.min(300, width - 24));
      const top = Math.max(offsetTop + 12, Math.min(rect.bottom + 8, offsetTop + height - 160));
      const left = Math.max(offsetLeft + 12, Math.min(rect.right - menuWidth, offsetLeft + width - menuWidth - 12));
      menu.style.setProperty("top", `${top}px`);
      menu.style.setProperty("left", `${left}px`);
      menu.style.setProperty("width", `${menuWidth}px`);
      menu.style.setProperty("max-height", `${Math.max(0, offsetTop + height - top - 12)}px`);
    }
    function schedule() { if (!frame) frame = window.requestAnimationFrame(placeMenu); }
    placeMenu();
    const focusFrame = window.requestAnimationFrame(() => menuRef.current?.querySelector("a")?.focus({ preventScroll: true }));
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    viewport?.addEventListener("resize", schedule, { passive: true });
    viewport?.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function closeOutside(event) {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    }
    function closeWithKeyboard(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithKeyboard);
    };
  }, [open]);

  function navigateMenu(event) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const links = Array.from(menuRef.current?.querySelectorAll("a") || []);
    if (!links.length) return;
    event.preventDefault();
    const index = links.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
    links[next].focus({ preventScroll: true });
  }

  return <>
    <button ref={triggerRef} className="home-account-avatar-link ih27-home-account-trigger" type="button"
      aria-label={open ? "Zamknij menu konta" : "Otwórz menu konta"} aria-expanded={open} aria-controls="ih27-home-account-menu"
      onClick={() => { if (!open) onOpen?.(); setOpen(value => !value); }}
      onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); if (open) menuRef.current?.querySelector("a")?.focus({ preventScroll: true }); else { onOpen?.(); setOpen(true); } } }}>
      <span className="account-mini-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initial}</span>
    </button>
    {open && createPortal(<nav ref={menuRef} id="ih27-home-account-menu" className="account-menu-dropdown ih18-account-dropdown ih27-home-account-menu"
      aria-label="Funkcje konta" onKeyDown={navigateMenu}
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && !triggerRef.current?.contains(event.relatedTarget)) setOpen(false); }}>
      <div className="account-menu-identity"><strong>{name}</strong><span>Konto IdeaHire</span></div>
      <Link to="/account" onClick={() => setOpen(false)}>Moje konto</Link>
      <a href={helpCenterHref()} onClick={() => setOpen(false)} referrerPolicy="no-referrer" aria-label="Pomoc — Centrum pomocy">
        <MarketIcon kind="help" /><span>Pomoc</span>
      </a>
    </nav>, document.body)}
  </>;
}

function HomeGreeting({ name }) {
  return (
    <span className="auth-user home-auth-user ih-welcome" title={`Cześć, ${name}`}>
      <span className="ih-welcome-readable">Cześć, {name}</span>
      <span className="ih-welcome-spark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="ih-welcome-copy" aria-hidden="true">
        <span className="ih-welcome-prefix">Cześć,</span>{" "}
        <strong className="ih-welcome-name">
          {Array.from(name).map((letter, index) => (
            <span key={index} style={{ "--ih-letter-order": Math.min(index, 12) }}>{letter}</span>
          ))}
        </strong>
      </span>
    </span>
  );
}

// Fictional content for the requested visual test. Keep the demo label visible.
const HOME_DEMO_REVIEWS = [
  { initial: "A", name: "Aleksandra", role: "zleceniodawczyni", text: "Mam pomysł i od razu wiem, gdzie szukać osoby, która pomoże mi go zrealizować." },
  { initial: "M", name: "Michał", role: "freelancer", text: "Przejrzyste kategorie i zlecenia w jednym miejscu. Tak lubię szukać nowych projektów." },
  { initial: "K", name: "Karolina", role: "zleceniodawczyni", text: "Najbardziej podoba mi się prosty układ. Mogę skupić się na swoim projekcie." },
  { initial: "P", name: "Piotr", role: "freelancer", text: "Od małego zadania po większy projekt — łatwo znaleźć swój kierunek." },
];

function HomeDemoReviews() {
  return (
    <section className="ih-demo-reviews" aria-labelledby="ih-demo-reviews-title">
      <div className="ih-demo-reviews-heading">
        <div>
          <span className="ih-demo-review-caption">Pomysły spotykają ludzi</span>
          <h2 id="ih-demo-reviews-title">Opinie przykładowe — test wyglądu</h2>
        </div>
      </div>
      <div className="ih-demo-reviews-viewport" tabIndex={0} aria-label="Przykładowe, fikcyjne opinie do testu wyglądu. Najedź kursorem lub ustaw fokus, aby zatrzymać przewijanie.">
        <div className="ih-demo-reviews-track" id="ih-demo-reviews-track">
          {[0, 1].map((copy) => (
            <div className="ih-demo-reviews-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
              {HOME_DEMO_REVIEWS.map((review) => (
                <article className="ih-demo-review" key={review.name}>
                  <span className="ih-demo-review-tag">Opinia testowa</span>
                  <blockquote>{review.text}</blockquote>
                  <div className="ih-demo-review-person">
                    <span className="ih-demo-review-avatar" aria-hidden="true">{review.initial}</span>
                    <div><strong>{review.name}</strong><span>{review.role}</span></div>
                    <span className="ih-demo-review-quote" aria-hidden="true">“</span>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function App({ session, loading, categoryGroups = [] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    navigationRef.current?.querySelector("a")?.focus({ preventScroll: true });
    function closeOutside(event) {
      if (!headerRef.current?.contains(event.target)) setMobileMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [mobileMenuOpen]);

  const [hasNotifications, setHasNotifications] = useState(false);
  const [recentJobs, setRecentJobs] = useState(fallbackJobs);
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    checkNotifications(session);

    function handleNotificationsRead(
      event
    ) {
      if (
        !event?.detail?.userId ||
        event.detail.userId ===
          session?.user?.id
      ) {
        setHasNotifications(false);
      }
    }

    function handleStorage(event) {
      if (
        event.key ===
        `ideahire_read_notifications_${session?.user?.id}`
      ) {
        checkNotifications(session);
      }
    }

    window.addEventListener(
      "ideahire:notifications-read",
      handleNotificationsRead
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    const interval = setInterval(() => {
      if (mounted) {
        checkNotifications(session);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);

      window.removeEventListener(
        "ideahire:notifications-read",
        handleNotificationsRead
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    async function loadRecentJobs() {
      try {
        const { data, error } =
          await supabase
            .from("jobs")
            .select(
              "id, title, description, category, budget, created_at"
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(8);

        if (error) {
          console.error(
            "HOME RECENT JOBS ERROR:",
            error
          );
          return;
        }

        if (
          mounted &&
          Array.isArray(data) &&
          data.length > 0
        ) {
          setRecentJobs(data);
          setActiveJobIndex(0);
        }
      } catch (error) {
        console.error(
          "HOME RECENT JOBS ERROR:",
          error
        );
      }
    }

    loadRecentJobs();

    const channel = supabase
      .channel("home-recent-jobs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "jobs",
        },
        () => {
          loadRecentJobs();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (recentJobs.length <= 1) return undefined;

    const interval = window.setInterval(
      () => {
        setActiveJobIndex(
          (current) =>
            (current + 1) % recentJobs.length
        );
      },
      4500
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [recentJobs.length]);

  useLayoutEffect(() => {
    const root = document.querySelector(".app");

    if (!root) return undefined;

    const revealElements = Array.from(
      root.querySelectorAll(".home-reveal")
    );

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    root.classList.add("home-motion-ready");

    revealElements.forEach((element) => {
      const group = element.parentElement;
      const groupedElements = group
        ? Array.from(group.children).filter((child) =>
            child.classList.contains("home-reveal")
          )
        : [];
      const position = Math.max(
        0,
        groupedElements.indexOf(element)
      );

      element.style.setProperty(
        "--home-reveal-delay",
        `${Math.min(position, 5) * 75}ms`
      );
    });

    if (
      prefersReducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });

      return () => {
        root.classList.remove("home-motion-ready");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target;

          if (entry.isIntersecting) {
            element.classList.add("is-visible");
            element.classList.remove(
              "is-above",
              "is-below"
            );
            return;
          }

          element.classList.remove("is-visible");

          const viewportTop =
            entry.rootBounds?.top || 0;
          const viewportBottom =
            entry.rootBounds?.bottom ||
            window.innerHeight;

          if (
            entry.boundingClientRect.bottom <=
            viewportTop
          ) {
            element.classList.add("is-above");
            element.classList.remove("is-below");
          } else if (
            entry.boundingClientRect.top >=
            viewportBottom
          ) {
            element.classList.add("is-below");
            element.classList.remove("is-above");
          }
        });
      },
      {
        threshold: [0, 0.08, 0.18],
        rootMargin: "-5% 0px -5% 0px",
      }
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      root.classList.remove("home-motion-ready");
    };
  }, []);

  async function checkNotifications(currentSession) {
    const userId = currentSession?.user?.id;

    if (!userId) {
      setHasNotifications(false);
      return;
    }

    try {
      const { data: myJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("user_id", userId);

      if (jobsError) {
        console.error("HOME NOTIFICATION JOBS ERROR:", jobsError);
        return;
      }

      const jobIds = (myJobs || []).map((job) => job.id);

      let applications = [];

      if (jobIds.length > 0) {
        const {
          data,
          error: applicationsError,
        } = await supabase
          .from("job_applications")
          .select("id, job_id, applicant_id, created_at")
          .in("job_id", jobIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (applicationsError) {
          console.error(
            "HOME NOTIFICATION APPLICATIONS ERROR:",
            applicationsError
          );
          return;
        }

        applications = data || [];
      }

      const readKey = `ideahire_read_notifications_${userId}`;

      let readIds = [];

      try {
        const storedReadIds = JSON.parse(
          localStorage.getItem(readKey) || "[]"
        );

        readIds = Array.isArray(storedReadIds)
          ? storedReadIds
          : [];
      } catch {
        readIds = [];
      }

      const [
        rejectedResult,
        acceptedResult,
        blockedResult,
      ] = await Promise.all([
        supabase
          .from("job_applications")
          .select("id")
          .eq("applicant_id", userId)
          .eq("status", "rejected"),

        supabase
          .from("job_applications")
          .select("id")
          .eq("applicant_id", userId)
          .eq("status", "accepted"),

        supabase
          .from("user_blocks")
          .select("id")
          .eq("blocked_id", userId),
      ]);

      if (rejectedResult.error) {
        console.error(
          "HOME REJECTED NOTIFICATIONS ERROR:",
          rejectedResult.error
        );
      }

      if (acceptedResult.error) {
        console.error(
          "HOME ACCEPTED NOTIFICATIONS ERROR:",
          acceptedResult.error
        );
      }

      if (blockedResult.error) {
        console.error(
          "HOME BLOCK NOTIFICATIONS ERROR:",
          blockedResult.error
        );
      }

      const hasUnreadIncoming =
        (applications || []).some(
          (application) =>
            !readIds.includes(
              `incoming:${application.id}`
            )
        );

      const hasUnreadRejected =
        (rejectedResult.data || []).some(
          (application) =>
            !readIds.includes(
              `rejected:${application.id}`
            )
        );

      const hasUnreadAccepted =
        (acceptedResult.data || []).some(
          (application) =>
            !readIds.includes(
              `accepted:${application.id}`
            )
        );

      const hasUnreadBlock =
        (blockedResult.data || []).some(
          (block) =>
            !readIds.includes(
              `blocked:${block.id}`
            )
        );

      setHasNotifications(
        hasUnreadIncoming ||
          hasUnreadRejected ||
          hasUnreadAccepted ||
          hasUnreadBlock
      );
    } catch (error) {
      console.error("HOME NOTIFICATION CHECK ERROR:", error);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`Nie udało się wylogować: ${error.message}`);
      return;
    }

    navigate("/");
  }

  const userName =
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    session?.user?.user_metadata
      ?.avatar_url || "";

  const userInitial = userName
    .charAt(0)
    .toUpperCase();

  const activeJob =
    recentJobs[
      activeJobIndex % recentJobs.length
    ] || fallbackJobs[0];

  const nextJob =
    recentJobs[
      (activeJobIndex + 1) %
        recentJobs.length
    ] || fallbackJobs[1];

  const followingJob =
    recentJobs[
      (activeJobIndex + 2) %
        recentJobs.length
    ] || fallbackJobs[2];

  function formatBudget(value) {
    return `${Number(
      value || 0
    ).toLocaleString("pl-PL")} zł`;
  }

  return (
    <div className="app ih-home-refresh ih-home-v3 ih-home-v4 ih-home-v6 ih-home-v7">
      <header ref={headerRef} className="navbar home-navbar ih-home-header" data-auth={session ? "member" : "guest"}
        data-mobile-menu-open={mobileMenuOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape" && mobileMenuOpen) {
            event.preventDefault();
            setMobileMenuOpen(false);
            mobileMenuButtonRef.current?.focus({ preventScroll: true });
          }
        }}>
        <IdeaHireLogo className="logo logo-clean" />

        <nav ref={navigationRef} id="ih-home-navigation" className="nav-links home-nav-links" aria-label="Nawigacja strony głównej"
          onClick={(event) => { if (event.target?.closest?.("a")) setMobileMenuOpen(false); }}>
          <HomeNavItem href="#how-it-works" order={0}>Jak to działa</HomeNavItem>
          <HomeNavItem href="#categories" order={1}>Kategorie</HomeNavItem>
          <HomeNavItem href="#for-users" order={2}>Dla Ciebie</HomeNavItem>

          {session && (
            <>
              <HomeNavItem to="/notifications" order={3} notification={hasNotifications}>Powiadomienia</HomeNavItem>
              <HomeNavItem to="/account" order={4}>Moje konto</HomeNavItem>
            </>
          )}
          {!session && <Link className="ih-mobile-login" to="/login">Zaloguj się</Link>}
        </nav>

        <div className="nav-actions">
          {loading ? (
            <span>Ładowanie...</span>
          ) : session ? (
            <>
              <HomeGreeting name={userName} />

              <HomeAccountMenu name={userName} avatarUrl={avatarUrl} initial={userInitial} onOpen={() => setMobileMenuOpen(false)} />

              <button
                className="btn btn-dark ih-logout-btn"
                type="button"
                onClick={handleLogout}
                aria-label="Wyloguj się"
              >
                <span className="ih-logout-label">Wyloguj się</span>
                <svg className="ih-logout-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 5H5v14h5M13 8l4 4-4 4M8 12h12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link
                className="btn btn-ghost"
                to="/login"
              >
                Zaloguj się
              </Link>

              <Link
                className="btn btn-dark"
                to="/register"
              >
                Zacznij teraz
              </Link>
            </>
          )}
        </div>

        <button ref={mobileMenuButtonRef} className="ih-mobile-nav-toggle" type="button"
          aria-label={mobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={mobileMenuOpen} aria-controls="ih-home-navigation"
          onClick={() => setMobileMenuOpen((current) => !current)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={mobileMenuOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>
      </header>

      <main>
        <IdeaHireCinematicHero job={activeJob} userKey={session?.user?.id || "guest"} />

        <HomeDemoReviews />

        <section
          className="categories section"
          id="categories"
        >
          <div className="section-heading home-reveal ih-category-intro">
            <div>
              <span className="section-label">Kategorie</span>

              <h2>
                Znajdź dokładnie to, czego potrzebujesz.
              </h2>
            </div>

            <p>
              Od małych zadań po większe projekty.
              Wybierz kategorię i zacznij szukać.
            </p>
          </div>

          <div className="ih5-category-showcase">
            <HomeCategoryBrowser groups={categoryGroups.length ? categoryGroups : categories} />
            <CommissionStory />
          </div>
        </section>

        <section
          className="how section"
          id="how-it-works"
        >
          <div className="section-heading centered home-reveal">
            <span className="section-label">
              Jak to działa
            </span>

            <h2>Prościej się nie da.</h2>

            <p>
              Trzy kroki. Jeden konkretny cel.
            </p>
          </div>

          <div className="steps">
            <HomeStepCard number="01" title="Opisz potrzebę">Powiedz nam, czego potrzebujesz i określ podstawowe szczegóły projektu.</HomeStepCard>
            <HomeStepCard number="02" title="Wybierz osobę">Przejrzyj zgłoszenia i wybierz wykonawcę, który najlepiej pasuje do Twojego projektu.</HomeStepCard>
            <HomeStepCard number="03" title="Zrealizuj projekt">Ustal szczegóły, rozpocznij współpracę i doprowadź projekt do końca.</HomeStepCard>
          </div>
        </section>

        <section
          className="split-section section home-reveal"
          id="for-users"
        >
          <div className="split-card">
            <span className="section-label">
              Dla zlecających
            </span>

            <h2>Masz coś do zrobienia?</h2>

            <p>
              Znajdź osobę, która ma odpowiednie umiejętności
              i może zająć się Twoim projektem.
            </p>

            <Link
              className="btn btn-light"
              to="/find-talent"
            >
              Dodaj zlecenie 
            </Link>
          </div>

          <div className="split-card light">
            <span className="section-label">
              Dla wykonawców
            </span>

            <h2>Masz coś do zaoferowania?</h2>

            <p>
              Pokaż swoje umiejętności, znajdź interesujące
              projekty i rozwijaj swoje portfolio.
            </p>

            <Link
              className="btn btn-outline"
              to="/jobs"
            >
              Znajdź zlecenia 
            </Link>
          </div>
        </section>

        <section className="final-cta home-reveal">
          <span className="section-label">IdeaHire</span>

          <h2 className="final-cta-title">
            <span>Twój następny projekt</span>
            <span>zaczyna się tutaj.</span>
          </h2>

          <Link
            className="btn btn-light btn-large"
            to={session ? "/account" : "/register"}
          >
            {session
              ? "Przejdź do konta "
              : "Zacznij teraz "}
          </Link>
        </section>
      </main>

      <footer className="footer home-reveal">
        <div>
          <Link className="logo logo-clean" to="/">
            Idea<span>Hire</span>
          </Link>

          <p>Prosto. Szybko. Skutecznie.</p>
        </div>

        <div className="footer-links">
          <a href={helpCenterHref()} onClick={event => { event.currentTarget.href = helpCenterHref(); }} referrerPolicy="no-referrer" aria-label="Pomoc — Centrum pomocy">Pomoc</a>
          <a href="#how-it-works">Jak to działa</a>
          <a href="#categories">Kategorie</a>
          <a href="#for-users">Dla Ciebie</a>
          <Link to="/regulamin">Regulamin</Link>
          <Link to="/polityka-prywatnosci">Polityka prywatności</Link>
          <Link to="/polityka-cookies">Polityka cookies</Link>
          <a href="mailto:ideahireprywatnosc@gmail.com?subject=Zg%C5%82oszenie%20nielegalnej%20tre%C5%9Bci%20w%20IdeaHire">
            Zgłoś nielegalną treść
          </a>
        </div>

        <span>© 2026 IdeaHire</span>
      </footer>
    </div>
  );
}

export default App;

