(function(){"use strict";function x(e){return(a,c,...l)=>{const i=new Set(l),o=new Map,d=e.bindReceive(n=>{var f;if(typeof n!="string")return;const t=n.indexOf(";"),s=t&&n.substring(0,t);if(!s)return;i.has(s)&&e.send(n);const r=o.get(s);if(r!=null&&r.length){const E=(f=c[s])==null?void 0:f.deserialize(n.substring(t+1));r.forEach(w=>w(E))}});return{send(n,t,...s){const r=`${n};${a[n].serialize(t)}`;e.send(r,...s)},on(n,t){var s;o.has(n)||o.set(n,[]),(s=o.get(n))==null||s.push(t)},off(n,t){var r,f;const s=(r=o.get(n))==null?void 0:r.indexOf(t);s!=null&&s!=-1&&((f=o.get(n))==null||f.splice(s,1))},destroy:d||(()=>{})}}}function u(e){return(a,c)=>x({send:e.postMessage.bind(e),bindReceive(l){const i=o=>l(o.data);return e.addEventListener("message",i),()=>e.removeEventListener("message",i)}})(a,c)}function g(e){throw typeof e=="string"?new Error(e):e}const h={serialize:JSON.stringify,deserialize:JSON.parse},y=(()=>({serialize:e=>e,deserialize:e=>e}))(),C={canvasInfo:h,positionData:h},m={reportCollision:y};function v(e,a,c){const l=a(m,C),i=e.getContext("2d")??g("Could not get context of tracker canvas");let o=0;l.on("canvasInfo",n=>{e.height=n.height,e.width=n.width,i.scale(n.scaleFactor,n.scaleFactor),o=n.lineWidth});const d={};l.on("positionData",n=>{n.forEach(t=>{const s=d[t.id];d[t.id]={x:t.x,y:t.y};const r=s!=null&&!(s.x===t.x&&s.y===t.y)&&S(s,t);c&&(t.x<0||t.x>e.width||t.y<0||t.y>e.height||r&&i.getImageData(r.x,r.y,1,1).data[3]!==0)&&l.send("reportCollision",t.id),!(!t.fill||s==null)&&(i.beginPath(),i.lineCap="square",i.lineWidth=o,i.strokeStyle=t.fill,i.moveTo(s.x,s.y),i.lineTo(t.x,t.y),i.stroke(),i.closePath(),s.x=t.x,s.y=t.y)})})}const S=(e,a)=>{const c=Math.sqrt(Math.pow(e.x-a.x,2)+Math.pow(e.y-a.y,2));return{x:a.x+(a.x-e.x)/c*3,y:a.y+(a.y-e.y)/c*3}};self.addEventListener("message",function e(a){const c=a.data instanceof OffscreenCanvas?a.data:a.data==="SELF_HOST_CANVAS"?new OffscreenCanvas(0,0):g('Either transfer a OffScreenCanvas to worker or send string "SELF_HOSTED_CANVAS" as initial message to worker');self.removeEventListener("message",e),v(c,u(self),!0)})})();
//# sourceMappingURL=collisionCanvas-53b1828d.js.map
