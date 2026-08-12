const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { RoomManager } = require('./rooms');
const { MIN_PLAYERS, MAX_PLAYERS, ROUND_OPTIONS } = require('./game');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const INDEX_PATH = path.join(PUBLIC_DIR, 'index.html');

// Render/Fly/Railway terminate TLS in front of us, so without this req.protocol
// always reports "http" and the share links would advertise the wrong scheme.
app.set('trust proxy', true);

// The Open Graph / Twitter tags in index.html need absolute URLs, but this app
// has no fixed domain — it's self-hosted wherever you put it, including a LAN
// IP. So the base URL is resolved per request instead of being baked into the
// file. Falls back to relative URLs if the Host header isn't a plain hostname.
function baseUrlFor(req) {
  const host = String(req.get('host') || '');
  const isPlainHost = /^[a-z0-9.-]+(:\d+)?$/i.test(host);
  const isIpv6Host = /^\[[0-9a-f:]+\](:\d+)?$/i.test(host);
  if (!isPlainHost && !isIpv6Host) return '';
  return `${req.protocol}://${host}`;
}

function serveIndex(req, res, next) {
  fs.readFile(INDEX_PATH, 'utf8', (err, html) => {
    if (err) return next(err);
    res.type('html').send(html.replace(/__BASE_URL__/g, baseUrlFor(req)));
  });
}

app.get('/', serveIndex);
app.get('/index.html', serveIndex);
app.use(express.static(PUBLIC_DIR, { index: false }));
app.get('/health', (req, res) => res.json({ ok: true }));

const manager = new RoomManager();

function broadcastRoom(room) {
  room.players.forEach((player) => {
    if (player.socketId) {
      io.to(player.socketId).emit('state', room.viewFor(player.id));
    }
  });
}

function playerSocket(room, playerId) {
  const player = room.getPlayer(playerId);
  return player ? player.socketId : null;
}

io.on('connection', (socket) => {
  socket.data.roomCode = null;
  socket.data.playerId = null;

  socket.on('create_room', ({ name, icon, totalRounds } = {}, ack) => {
    try {
      const rounds = ROUND_OPTIONS.includes(Number(totalRounds)) ? Number(totalRounds) : undefined;
      const room = manager.create(rounds);
      const player = room.addPlayer({ name, icon });
      player.socketId = socket.id;
      socket.data.roomCode = room.code;
      socket.data.playerId = player.id;
      socket.join(room.code);
      ack && ack({ ok: true, roomCode: room.code, playerId: player.id, view: room.viewFor(player.id) });
      broadcastRoom(room);
    } catch (err) {
      ack && ack({ ok: false, error: err.message });
    }
  });

  socket.on('join_room', ({ code, name, icon } = {}, ack) => {
    try {
      const room = manager.get(code);
      if (!room) throw new Error('Room not found. Check the code and try again.');
      if (room.status !== 'lobby') throw new Error('This game has already started.');
      if (room.players.length >= MAX_PLAYERS) throw new Error(`Rooms are limited to ${MAX_PLAYERS} players.`);
      const player = room.addPlayer({ name, icon });
      player.socketId = socket.id;
      socket.data.roomCode = room.code;
      socket.data.playerId = player.id;
      socket.join(room.code);
      ack && ack({ ok: true, roomCode: room.code, playerId: player.id, view: room.viewFor(player.id) });
      broadcastRoom(room);
    } catch (err) {
      ack && ack({ ok: false, error: err.message });
    }
  });

  socket.on('rejoin', ({ code, playerId } = {}, ack) => {
    try {
      const room = manager.get(code);
      if (!room) throw new Error('That room no longer exists.');
      const player = room.getPlayer(playerId);
      if (!player) throw new Error('You are not part of that room anymore.');
      player.connected = true;
      player.socketId = socket.id;
      socket.data.roomCode = room.code;
      socket.data.playerId = player.id;
      socket.join(room.code);
      room.touch();
      ack && ack({ ok: true, roomCode: room.code, playerId: player.id, view: room.viewFor(player.id) });
      broadcastRoom(room);
    } catch (err) {
      ack && ack({ ok: false, error: err.message });
    }
  });

  socket.on('start_game', (_payload, ack) => {
    withRoom(socket, ack, (room, playerId) => {
      if (room.hostId !== playerId) throw new Error('Only the host can start the game.');
      if (!room.canStart()) throw new Error(`Need at least ${MIN_PLAYERS} players to start.`);
      room.startGame();
      broadcastRoom(room);
      ack && ack({ ok: true });
    });
  });

  socket.on('submit_clue', ({ text } = {}, ack) => {
    withRoom(socket, ack, (room, playerId) => {
      room.submitClue(playerId, text);
      broadcastRoom(room);
      ack && ack({ ok: true });
    });
  });

  socket.on('force_reveal', (_payload, ack) => {
    withRoom(socket, ack, (room, playerId) => {
      if (room.hostId !== playerId) throw new Error('Only the host can do that.');
      if (room.status !== 'clue') throw new Error('Not in the clue-giving phase.');
      room.forceRevealClues();
      broadcastRoom(room);
      ack && ack({ ok: true });
    });
  });

  socket.on('submit_guess', ({ text } = {}, ack) => {
    withRoom(socket, ack, (room, playerId) => {
      room.submitGuess(playerId, text);
      broadcastRoom(room);
      ack && ack({ ok: true });
    });
  });

  socket.on('next_round', (_payload, ack) => {
    withRoom(socket, ack, (room, playerId) => {
      if (room.hostId !== playerId) throw new Error('Only the host can continue.');
      room.startNextRound();
      broadcastRoom(room);
      ack && ack({ ok: true });
    });
  });

  socket.on('play_again', (_payload, ack) => {
    withRoom(socket, ack, (room, playerId) => {
      if (room.hostId !== playerId) throw new Error('Only the host can start a new game.');
      if (room.status !== 'gameover') throw new Error('The current game is not finished yet.');
      room.resetForNewGame();
      broadcastRoom(room);
      ack && ack({ ok: true });
    });
  });

  socket.on('leave_room', (_payload, ack) => {
    const { roomCode, playerId } = socket.data;
    if (roomCode) {
      const room = manager.get(roomCode);
      if (room) {
        room.removePlayer(playerId);
        socket.leave(roomCode);
        if (room.players.length === 0) manager.remove(roomCode);
        else broadcastRoom(room);
      }
    }
    socket.data.roomCode = null;
    socket.data.playerId = null;
    ack && ack({ ok: true });
  });

  socket.on('disconnect', () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode) return;
    const room = manager.get(roomCode);
    if (!room) return;
    const player = room.getPlayer(playerId);
    if (player && player.socketId === socket.id) {
      player.connected = false;
      broadcastRoom(room);
    }
  });
});

function withRoom(socket, ack, fn) {
  try {
    const { roomCode, playerId } = socket.data;
    const room = manager.get(roomCode);
    if (!room) throw new Error('You are not in an active room.');
    fn(room, playerId);
  } catch (err) {
    ack && ack({ ok: false, error: err.message });
  }
}

server.listen(PORT, () => {
  console.log(`JUST clONE server listening on port ${PORT}`);
});
