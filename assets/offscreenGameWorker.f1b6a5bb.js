var n=Object.assign;import{c as a}from"./canvasWorkerMessaging.09b47d9d.js";import{c as s}from"./snakeGameContext.982ae7a2.js";const e=o=>t=>{if(t.data instanceof OffscreenCanvas){const r=a(o),i=s(t.data),d=new Map;r.on("turn",(n=>{var a;return null==(a=d.get(n.id))?void 0:a(n.turn)})),r.on("inputSnakeData",(a=>d.set(a.id,i.inputSnakeData(n(n({},a),{onCollision:()=>r.send("snakeCollision",a.id)}))))),r.on("run",i.run),r.on("stop",i.stop),r.on("destroy",(()=>{i.destroy(),onmessage=e(o)})),r.send("canvasCreated",void 0)}};onmessage=e(self);