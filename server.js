const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  if (pathname === "/") pathname = "/public/index.html";
  else if (!pathname.startsWith("/public/")) pathname = "/public" + pathname;
  const file = path.join(ROOT, pathname);
  if (!file.startsWith(path.join(ROOT, "public"))) {
    res.writeHead(403); return res.end("Forbidden");
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    const ext = path.extname(file);
    const types = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json"};
    res.writeHead(200, {"Content-Type": types[ext] || "application/octet-stream"});
    res.end(data);
  });
});
const wss = new WebSocket.Server({server});
const rooms = new Map();
const names = new Map();
const code = () => Math.random().toString(36).slice(2,6).toUpperCase();

function send(ws, obj) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); }
function roomState(room) {
  return {type:"state", players:[...room.players.values()].map(p=>({id:p.id,name:p.name,x:p.x,z:p.z,rot:p.rot})), items:[...room.items]};
}
function broadcast(room, obj, except=null) {
  for (const p of room.players.values()) if (p.ws !== except) send(p.ws,obj);
}
wss.on("connection", ws => {
  let player = null;
  send(ws,{type:"hello",message:"Connected to Night Shift server"});
  ws.on("message", raw => {
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.type === "create" || msg.type === "join") {
      if (player) return;
      let roomCode = msg.type === "create" ? code() : String(msg.code || "").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);
      if (msg.type === "join" && !rooms.has(roomCode)) return send(ws,{type:"error",message:"Room not found. Check the code."});
      if (msg.type === "create") rooms.set(roomCode,{players:new Map(),items:[0,1,2]});
      const room = rooms.get(roomCode);
      if (room.players.size >= 4) return send(ws,{type:"error",message:"Room is full (4 players max)."});
      player = {id:Math.random().toString(36).slice(2,10),name:String(msg.name||"Player").slice(0,16),x:0,z:0,rot:0,ws,roomCode};
      room.players.set(player.id,player);
      send(ws,{type:"joined",code:roomCode,id:player.id});
      broadcast(room,roomState(room));
    } else if (msg.type === "move" && player) {
      const room = rooms.get(player.roomCode); if (!room) return;
      player.x = Math.max(-18,Math.min(18,Number(msg.x)||0));
      player.z = Math.max(-18,Math.min(18,Number(msg.z)||0));
      player.rot = Number(msg.rot)||0;
      broadcast(room,{type:"playerMoved",id:player.id,x:player.x,z:player.z,rot:player.rot},ws);
    } else if (msg.type === "collect" && player) {
      const room = rooms.get(player.roomCode); if (!room) return;
      const n = Number(msg.item);
      if (room.items.includes(n)) {
        room.items = room.items.filter(i=>i!==n);
        broadcast(room,{type:"itemCollected",item:n,by:player.name});
        broadcast(room,roomState(room));
      }
    } else if (msg.type === "ping") send(ws,{type:"pong"});
  });
  ws.on("close", () => {
    if (!player) return;
    const room = rooms.get(player.roomCode);
    if (room) {
      room.players.delete(player.id);
      broadcast(room,{type:"playerLeft",id:player.id,name:player.name});
      if (!room.players.size) rooms.delete(player.roomCode);
      else broadcast(room,roomState(room));
    }
  });
});
server.listen(PORT, () => console.log(`Night Shift running at http://localhost:${PORT}`));