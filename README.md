# JUST *cl*ONE — Party Game (Mobile Web)

A free, open-source mobile-web version of the cooperative party game
**Just One**, rebranded here as **JUST *cl*ONE** — built to be played by a
group in the same room, each on their own phone, joined together with a
short room code.

No app install, no accounts, no database — just open the site, create or
join a room, and play.

## How the game works

JUST *cl*ONE is fully cooperative. Each round:

1. One player is the **guesser**. Everyone else sees a secret word.
2. Every other player secretly writes **one word** as a clue for the
   guesser (it can't be the secret word itself).
3. Clues that exactly match each other are **automatically removed** —
   too obvious, or duplicated, means it's tossed.
4. The guesser sees whatever clues survive and gets **one guess**.
5. The group's score is simply how many of the rounds (5, 8, or 13 —
   host's choice) were guessed correctly. Everyone rotates through being
   the guesser.

At the end, everyone sees the team's final score, a recap of every secret
word from the round (with who was guessing and how it went), plus a
per-player breakdown (icon, name, correct guesses as guesser, valid clues
given).

This project ships its own original word list (`server/words.js`) rather
than reusing the commercial game's card content.

## Tech stack

- **Server:** Node.js, Express, [Socket.io](https://socket.io) for
  real-time updates. Game state lives in memory (a `Map` of rooms) — no
  database required.
- **Client:** Plain HTML/CSS/JS (no build step, no framework), mobile-first,
  loaded straight from the server's `public/` folder.

Rooms auto-expire after 6 hours of inactivity. There's nothing to persist
between games, so this deliberately avoids a database for simplicity and
zero hosting cost.

## Running locally

```bash
npm install
npm start
```

Then open `http://localhost:3000` on your phone (or in multiple browser
tabs/windows to simulate multiple players — each tab is a separate
"player" via its own websocket connection).

To let phones on the same Wi-Fi join, start the server and browse to
`http://<your-computer's-LAN-IP>:3000` from each phone.

## Deploying for free

Because it's a small stateless Node/WebSocket app, it fits comfortably in
any free tier that supports persistent WebSocket connections, for example:

- **Render** (Web Service, free tier): connect the repo, build command
  `npm install`, start command `npm start`.
- **Fly.io**: `fly launch`, then `fly deploy` (free allowance covers a
  small always-on app for casual use).
- **Railway** / **Glitch**: import the repo, it auto-detects `npm start`.

No environment variables are required. The server reads `PORT` from the
environment if set (falls back to `3000`).

## Project structure

```
server/
  index.js   Express app + Socket.io event handlers
  rooms.js   In-memory room registry, room-code generation, cleanup
  game.js    Room/game state machine: rounds, clue validation, scoring
  words.js   Original word list + shuffled deck
public/
  index.html Single-page app shell (all screens, mobile-first)
  styles.css Dark, mobile-first party theme
  app.js     Client state machine driven by the server's per-player view
```

## Game rules notes / house rules

- Rooms hold 3–8 players (Just One officially supports up to 7, we allow
  8 for larger groups).
- A clue must be a single word (no spaces) — the client and server both
  enforce this.
- Duplicate clues are matched case-insensitively.
- The host can tap **"reveal clues now"** during the clue phase to skip
  waiting on a straggler, and controls advancing to the next round.
- If a player's phone disconnects (locks, drops wifi), the game keeps
  their seat — reopening the site in the same browser automatically
  rejoins them to their room and role.
