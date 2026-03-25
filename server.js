const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 9080;
const wss = new WebSocketServer({ port: PORT });

const rooms = {};

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);

    if (msg.type === 'join') {
      ws.roomId = msg.room;
      ws.playerId = msg.id;
      if (!rooms[msg.room]) rooms[msg.room] = new Set();

      rooms[msg.room].forEach(client => {
        if (client !== ws) {
          client.send(JSON.stringify({ type: 'peer_joined', id: msg,id }));

          ws.send(JSON.stringify({ type: 'peer_joined', id: client.playerId }));
        }
      });
      rooms[msg.room].add(ws);
    }

    if (['offer', 'answer', 'candidate'].includes(msg.type)) {
      rooms[ws.roomId]?.forEach(client => {
        if (client !== ws && client.playerId === msg.target) {
          client.send(JSON.stringify({ ...msg, from: ws.playerId }));
        }
      });
    }
  });

  ws.on('close', () => {
    rooms[ws.roomId]?.delete(ws);
    rooms[ws.roomId]?.forEach(client => {
      client.send(JSON.stringify({ type: 'peer_left', id: ws.playerId }));
    });
  });
});

console.log('Signaling server läuft auf Port 9080');
