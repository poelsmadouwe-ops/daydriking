import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const server = http.createServer((req, res) => {
  // Serve the static web simulator directly from the backend
  if (req.url === '/' || req.url === '/index.html' || req.url === '/web_simulator/index.html') {
    const filePath = path.join(__dirname, '../../web_simulator/index.html');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading index.html from backend\n');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Daydrinking Royale Server is running. Visit / to play!\n');
  }
});

const wss = new WebSocketServer({ server });

interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  jokers: number;
  score: { sipsTaken: number; sipsGiven: number; gamesWon: number };
  isFingerDown: boolean;
  releaseTime?: number;
}

interface Room {
  id: string;
  players: Map<string, Player>;
  paused: boolean;
  state: 'LOBBY' | 'GAME_FINGER_ROULETTE' | 'FINISHED';
  countdownStart?: number;
  triggerReleaseTime?: number;
}

const rooms = new Map<string, Room>();

wss.on('connection', (ws) => {
  let playerRoomId: string | null = null;
  let playerId: string | null = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.action === 'CREATE_ROOM') {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room: Room = {
          id: roomId,
          players: new Map(),
          paused: false,
          state: 'LOBBY'
        };
        rooms.set(roomId, room);
        ws.send(JSON.stringify({ type: 'ROOM_CREATED', roomId }));
      }
      
      else if (data.action === 'JOIN_ROOM') {
        const { roomId, name, id } = data;
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
          return;
        }
        playerRoomId = roomId;
        playerId = id;
        
        const newPlayer: Player = {
          id,
          name,
          ws,
          jokers: 1,
          score: { sipsTaken: 0, sipsGiven: 0, gamesWon: 0 },
          isFingerDown: false
        };
        room.players.set(id, newPlayer);
        broadcastState(room);
      }
      
      else if (data.action === 'START_FINGER_ROULETTE') {
        if (!playerRoomId) return;
        const room = rooms.get(playerRoomId);
        if (!room) return;

        const now = Date.now();
        room.state = 'GAME_FINGER_ROULETTE';
        room.countdownStart = now + 3000;
        room.triggerReleaseTime = now + 8000; // Randomize in production

        broadcastState(room);
      }

      else if (data.action === 'FINGER_DOWN') {
        if (!playerRoomId || !playerId) return;
        const room = rooms.get(playerRoomId);
        const player = room?.players.get(playerId);
        if (player) {
          player.isFingerDown = true;
          broadcastState(room!);
        }
      }

      else if (data.action === 'FINGER_UP') {
        if (!playerRoomId || !playerId) return;
        const room = rooms.get(playerRoomId);
        const player = room?.players.get(playerId);
        if (player) {
          player.isFingerDown = false;
          player.releaseTime = data.timestamp;
          
          // Check if game is finished or evaluate release speed
          evaluateRoulette(room!);
        }
      }
      
      else if (data.action === 'EMERGENCY_STOP') {
        if (!playerRoomId) return;
        const room = rooms.get(playerRoomId);
        if (room) {
          room.paused = !room.paused;
          broadcastState(room);
        }
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid payload' }));
    }
  });

  ws.on('close', () => {
    if (playerRoomId && playerId) {
      const room = rooms.get(playerRoomId);
      if (room) {
        room.players.delete(playerId);
        if (room.players.size === 0) {
          rooms.delete(playerRoomId);
        } else {
          broadcastState(room);
        }
      }
    }
  });
});

function broadcastState(room: Room) {
  const playersList: any = {};
  room.players.forEach((p, id) => {
    playersList[id] = {
      name: p.name,
      jokers: p.jokers,
      score: p.score,
      isFingerDown: p.isFingerDown
    };
  });

  const statePayload = {
    type: 'GAME_STATE',
    state: {
      roomId: room.id,
      status: room.state,
      paused: room.paused,
      players: playersList,
      activeContent: room.state === 'GAME_FINGER_ROULETTE' ? {
        type: 'DYNAMIC_MINIGAME',
        minigameData: {
          gameId: 'finger_roulette',
          countdownStartTimestamp: room.countdownStart,
          triggerReleaseTimestamp: room.triggerReleaseTime
        }
      } : null
    }
  };

  room.players.forEach((p) => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify(statePayload));
    }
  });
}

function evaluateRoulette(room: Room) {
  // Evalueer de reactiesnelheid van alle spelers ten opzichte van de triggerReleaseTime
  const target = room.triggerReleaseTime || 0;
  let slowestPlayer: Player | null = null;
  let maxDifference = -Infinity;

  room.players.forEach((p) => {
    if (p.releaseTime) {
      const diff = p.releaseTime - target;
      if (diff > maxDifference) {
        maxDifference = diff;
        slowestPlayer = p;
      }
    }
  });

  // Als iedereen heeft losgelaten, beëindig ronde en deel straffen uit
  const allReleased = Array.from(room.players.values()).every(p => !p.isFingerDown);
  if (allReleased && slowestPlayer) {
    (slowestPlayer as Player).score.sipsTaken += 5;
    room.state = 'LOBBY';
    broadcastState(room);
  }
}

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
