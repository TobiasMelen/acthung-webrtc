var e=Object.defineProperty,t=Object.defineProperties,n=Object.getOwnPropertyDescriptors,r=Object.getOwnPropertySymbols,o=Object.prototype.hasOwnProperty,l=Object.prototype.propertyIsEnumerable,i=(t,n,r)=>n in t?e(t,n,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[n]=r,a=(e,t)=>{for(var n in t||(t={}))o.call(t,n)&&i(e,n,t[n]);if(r)for(var n of r(t))l.call(t,n)&&i(e,n,t[n]);return e},c=(e,r)=>t(e,n(r));import{d as s,l as u,y as d,R as m,s as h,A as f,z as b}from"./vendor.afcc7ec4.js";let p;const y={},w=function(e,t){if(!t)return e();if(void 0===p){const e=document.createElement("link").relList;p=e&&e.supports&&e.supports("modulepreload")?"modulepreload":"preload"}return Promise.all(t.map((e=>{if(e in y)return;y[e]=!0;const t=e.endsWith(".css"),n=t?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${e}"]${n}`))return;const r=document.createElement("link");return r.rel=t?"stylesheet":p,t||(r.as="script",r.crossOrigin=""),r.href=e,document.head.appendChild(r),t?new Promise(((e,t)=>{r.addEventListener("load",e),r.addEventListener("error",t)})):void 0}))).then((()=>e()))};function E(e,t){return s((()=>{const t=e.filter((e=>null!=e));return t.length<=1?t[0]:Object.assign({},...t)}),null!=t?t:e)}function g(e){const t=s((()=>Object.keys(e).map((e=>matchMedia(e)))),[e]),[n,r]=u(new Set(t.filter((e=>e.matches)).map((e=>e.media))));return d((()=>t.forEach((e=>e.addListener((e=>r((t=>((e.matches?t.add:t.delete).call(t,e.media),new Set(t))))))))),[e]),s((()=>{let t=[];return n.forEach((n=>{const r=e[n];null!=r&&t.push(r)})),t}),[n,e])}const v=e=>({width:"100vw",height:"100%",display:"flex",justifyContent:e?"center":"space-between",alignItems:"center",overflow:"hidden"}),O={"(orientation: landscape)":{flexDirection:"row",margin:"0 auto",overflow:"visible"},"(orientation: portrait)":{flexDirection:"column"}};function j(e){var t=e,{centered:n=!0}=t,i=((e,t)=>{var n={};for(var i in e)o.call(e,i)&&t.indexOf(i)<0&&(n[i]=e[i]);if(null!=e&&r)for(var i of r(e))t.indexOf(i)<0&&l.call(e,i)&&(n[i]=e[i]);return n})(t,["centered"]);const u=g(O),d=s((()=>v(n)),[n]);return m.createElement("main",c(a({},i),{style:E([d,...u,i.style],[v,u,i.style])}))}const P={textAlign:"center",margin:"0 auto"};function L({children:e,style:t,startingEm:n=20}){const r=h(null),[o,l]=u(),i=f((()=>{!async function e(t){if(null==r.current)return;r.current.style.fontSize=`${t}em`,r.current.clientHeight<=document.body.scrollHeight&&r.current.clientWidth<=document.body.clientWidth?l(t):e(t-1)}(n)}),[r.current]);return d((()=>{let e;return window.addEventListener("resize",(()=>{window.clearTimeout(e),e=window.setTimeout(i,500)})),i(),()=>window.clearTimeout(e)}),[i,n]),m.createElement(j,null,m.createElement("h1",{style:c(a(a({},t),P),{visibility:null!=o?"visible":"hidden"}),ref:r},e))}const _=()=>location.hash.startsWith("#")?location.hash.substring(1):location.hash;function x(){const[e,t]=u(_());d((()=>{const e=()=>t(_());return addEventListener("hashchange",e),()=>removeEventListener("hashchange",e)}),[]);const[n,r]=u(null);return d((()=>{(async()=>{if(!window.RTCPeerConnection)return m.createElement(L,null,m.createElement("span",{style:{color:"red"}},"Sorry!"),m.createElement("br",null),"Your browser must support"," ",m.createElement("a",{href:"https://caniuse.com/?search=webrtc"},"WebRTC"));if(e.startsWith("lobby/")){const t=e.substring("lobby/".length),{default:n}=await w((()=>import("./Lobby.31849210.js")),["/acthung-webrtc/assets/Lobby.31849210.js","/acthung-webrtc/assets/vendor.afcc7ec4.js","/acthung-webrtc/assets/useJsonWebsocket.7e6abb12.js","/acthung-webrtc/assets/valueConverters.45a54a63.js","/acthung-webrtc/assets/collisionCanvasMessaging.3e5d4ef6.js"]);return m.createElement(n,{lobbyName:t})}if(location.hash.length>0){const{default:t}=await w((()=>import("./Player.2ee863c2.js")),["/acthung-webrtc/assets/Player.2ee863c2.js","/acthung-webrtc/assets/vendor.afcc7ec4.js","/acthung-webrtc/assets/useJsonWebsocket.7e6abb12.js","/acthung-webrtc/assets/valueConverters.45a54a63.js"]);return m.createElement(t,{lobbyName:e})}return m.createElement(L,null,"New"," ",m.createElement("a",{href:`#lobby/${Math.random().toString(36).substring(8)}`},"Lobby"))})().then(r)}),[e]),n}b(m.createElement(x,null),document.getElementById("app-root"));export{L as B,j as P,E as a,g as u};
//# sourceMappingURL=index.1a6f42d2.js.map