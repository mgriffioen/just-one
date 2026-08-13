const { createWordDeck, WORDS } = require('./words');
const { isIcon, pickIcon } = require('./icons');

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 8;
const ROUND_OPTIONS = [5, 8, 13];
const DEFAULT_ROUNDS = 13;

const RATING_SCALE = [
  { max: 2, label: 'A tough crowd! Try again?' },
  { max: 4, label: 'Room for improvement.' },
  { max: 6, label: 'Not bad at all!' },
  { max: 8, label: 'Great teamwork!' },
  { max: 10, label: 'Excellent guessing!' },
  { max: 12, label: 'Amazing! So in sync.' },
  { max: Infinity, label: 'PERFECT SCORE! Telepathic!' }
];

function ratingFor(correct, total) {
  // Scale the rating thresholds (tuned for 13 rounds) to whatever round count was chosen.
  const scaled = (correct / total) * 13;
  const found = RATING_SCALE.find((r) => scaled <= r.max);
  return found.label;
}

function normalizeClue(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

class Room {
  constructor(code, totalRounds = DEFAULT_ROUNDS) {
    this.code = code;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.players = []; // ordered list, order = turn rotation
    this.hostId = null;
    this.status = 'lobby'; // lobby | clue | reveal | guess | result | gameover
    this.totalRounds = ROUND_OPTIONS.includes(totalRounds) ? totalRounds : DEFAULT_ROUNDS;
    this.roundNumber = 0; // 1-indexed once started
    this.activePlayerIndex = -1;
    this.recentWords = []; // words this room has already played, across games
    this.deck = createWordDeck();
    this.currentWord = null;
    this.clues = {}; // playerId -> { text, status: 'pending'|'valid'|'duplicate'|'invalid' }
    this.guess = null;
    this.lastResult = null; // { correct, word, clues }
    this.history = [];
  }

  touch() {
    this.lastActivity = Date.now();
  }

  getPlayer(playerId) {
    return this.players.find((p) => p.id === playerId);
  }

  takenIcons(exceptPlayerId) {
    return this.players.filter((p) => p.id !== exceptPlayerId).map((p) => p.icon);
  }

  addPlayer({ name, icon }) {
    const id = makeId();
    const player = {
      id,
      name: sanitizeName(name),
      // Falls back to a free icon if this one was already claimed, so two
      // players can never share one. The client tells the player if it changed.
      icon: pickIcon(icon, this.takenIcons()),
      connected: true,
      score: { correctAsActive: 0, roundsAsActive: 0, cluesGiven: 0, cluesAccepted: 0 }
    };
    this.players.push(player);
    if (!this.hostId) this.hostId = id;
    return player;
  }

  removePlayer(playerId) {
    this.players = this.players.filter((p) => p.id !== playerId);
    if (this.hostId === playerId) {
      this.hostId = this.players[0] ? this.players[0].id : null;
    }
  }

  // Lobby-only: once the game is running, icons are how players attribute the
  // clues they're looking at, so swapping mid-game would rewrite that history.
  setIcon(playerId, icon) {
    if (this.status !== 'lobby') throw new Error('You can only change your icon in the lobby.');
    const player = this.getPlayer(playerId);
    if (!player) throw new Error('You are not in this room.');
    if (!isIcon(icon)) throw new Error('That is not one of the icons.');
    if (this.takenIcons(playerId).includes(icon)) throw new Error('Someone else already picked that one.');
    player.icon = icon;
    this.touch();
  }

  canStart() {
    return this.status === 'lobby' && this.players.length >= MIN_PLAYERS && this.players.length <= MAX_PLAYERS;
  }

  activePlayer() {
    if (this.activePlayerIndex < 0) return null;
    return this.players[this.activePlayerIndex % this.players.length] || null;
  }

  startGame() {
    if (!this.canStart()) throw new Error('Cannot start game yet.');
    this.roundNumber = 0;
    this.activePlayerIndex = -1;
    this.startNextRound();
  }

  startNextRound() {
    if (this.roundNumber >= this.totalRounds || this.deck.length === 0) {
      this.status = 'gameover';
      this.currentWord = null;
      return;
    }
    this.roundNumber += 1;
    this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
    this.currentWord = this.deck.pop();
    this.rememberWord(this.currentWord);
    this.clues = {};
    this.guess = null;
    this.lastResult = null;
    const active = this.activePlayer();
    active.score.roundsAsActive += 1;
    this.players.forEach((p) => {
      if (p.id !== active.id) this.clues[p.id] = { text: '', status: 'pending' };
    });
    this.status = 'clue';
    this.touch();
  }

  // Tracks what this room has already served so a later game in the same room
  // doesn't repeat it. Capped at half the word list, so a room that plays all
  // night still always has a large pool of unplayed words to draw from.
  rememberWord(word) {
    if (!word) return;
    this.recentWords.push(word);
    const cap = Math.floor(WORDS.length / 2);
    if (this.recentWords.length > cap) {
      this.recentWords = this.recentWords.slice(-cap);
    }
  }

  submitClue(playerId, text) {
    if (this.status !== 'clue') throw new Error('Not accepting clues right now.');
    const active = this.activePlayer();
    if (!active || playerId === active.id) throw new Error('The active player does not submit a clue.');
    if (!this.clues[playerId]) throw new Error('You are not part of this round.');
    const clean = String(text || '').trim().slice(0, 40);
    if (!clean) throw new Error('Clue cannot be empty.');
    if (/\s/.test(clean)) throw new Error('Clue must be a single word.');
    this.clues[playerId] = { text: clean, status: 'pending' };
    this.touch();
    if (this.allCluesIn()) this.resolveClues();
  }

  allCluesIn() {
    return Object.values(this.clues).every((c) => c.text);
  }

  resolveClues() {
    const secretNorm = normalizeClue(this.currentWord);
    const counts = {};
    Object.values(this.clues).forEach((c) => {
      const n = normalizeClue(c.text);
      counts[n] = (counts[n] || 0) + 1;
    });
    Object.entries(this.clues).forEach(([playerId, clue]) => {
      const n = normalizeClue(clue.text);
      let status;
      if (n === secretNorm) status = 'invalid';
      else if (counts[n] > 1) status = 'duplicate';
      else status = 'valid';
      clue.status = status;
      if (status === 'valid') {
        const player = this.getPlayer(playerId);
        if (player) {
          player.score.cluesGiven += 1;
          player.score.cluesAccepted += 1;
        }
      } else if (status === 'duplicate' || status === 'invalid') {
        const player = this.getPlayer(playerId);
        if (player) player.score.cluesGiven += 1;
      }
    });
    this.status = 'guess';
    this.touch();
  }

  forceRevealClues() {
    // Used when the host wants to skip waiting for stragglers.
    Object.values(this.clues).forEach((c) => {
      if (!c.text) c.text = '';
    });
    this.resolveClues();
  }

  submitGuess(playerId, text) {
    if (this.status !== 'guess') throw new Error('Not accepting a guess right now.');
    const active = this.activePlayer();
    if (!active || playerId !== active.id) throw new Error('Only the active player guesses.');
    const guessClean = String(text || '').trim();
    const isPass = guessClean === '';
    const correct = !isPass && normalizeClue(guessClean) === normalizeClue(this.currentWord);
    this.guess = isPass ? '(passed)' : guessClean;
    if (correct) active.score.correctAsActive += 1;
    const validClues = Object.entries(this.clues)
      .filter(([, c]) => c.status === 'valid')
      .map(([playerId, c]) => ({
        playerId,
        text: c.text,
        author: this.getPlayer(playerId) && {
          name: this.getPlayer(playerId).name,
          icon: this.getPlayer(playerId).icon
        }
      }));
    const removedClues = Object.entries(this.clues)
      .filter(([, c]) => c.status !== 'valid')
      .map(([playerId, c]) => ({
        playerId,
        text: c.text,
        status: c.status,
        author: this.getPlayer(playerId) && {
          name: this.getPlayer(playerId).name,
          icon: this.getPlayer(playerId).icon
        }
      }));
    this.lastResult = {
      correct,
      passed: isPass,
      word: this.currentWord,
      guess: this.guess,
      activePlayer: { id: active.id, name: active.name, icon: active.icon },
      validClues,
      removedClues
    };
    this.history.push({ round: this.roundNumber, ...this.lastResult });
    this.status = 'result';
    this.touch();
  }

  teamScore() {
    const correct = this.history.filter((h) => h.correct).length;
    return { correct, total: this.history.length };
  }

  resetForNewGame() {
    this.status = 'lobby';
    this.roundNumber = 0;
    this.activePlayerIndex = -1;
    // recentWords deliberately survives the reset — that's what stops a new
    // game in this room from serving up the words they just played.
    this.deck = createWordDeck(this.recentWords);
    this.currentWord = null;
    this.clues = {};
    this.guess = null;
    this.lastResult = null;
    this.history = [];
    this.players.forEach((p) => {
      p.score = { correctAsActive: 0, roundsAsActive: 0, cluesGiven: 0, cluesAccepted: 0 };
    });
    this.touch();
  }

  finalSummary() {
    const { correct, total } = this.teamScore();
    return {
      correct,
      total,
      rating: total > 0 ? ratingFor(correct, total) : '',
      rounds: this.history.map((h) => ({
        round: h.round,
        word: h.word,
        correct: h.correct,
        passed: h.passed,
        guess: h.guess,
        activePlayer: h.activePlayer
      })),
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        ...p.score
      }))
    };
  }

  publicPlayers() {
    return this.players.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      connected: p.connected,
      isHost: p.id === this.hostId
    }));
  }

  clueProgress() {
    return Object.keys(this.clues).map((playerId) => ({
      playerId,
      submitted: !!this.clues[playerId].text
    }));
  }

  // Builds the state payload as seen by a specific player (hides the secret
  // word from the active player during the clue phase; hides clue text from
  // everyone except during reveal/guess/result phases).
  viewFor(playerId) {
    const me = this.getPlayer(playerId);
    const active = this.activePlayer();
    const isActive = !!active && active.id === playerId;
    const base = {
      code: this.code,
      status: this.status,
      hostId: this.hostId,
      totalRounds: this.totalRounds,
      roundNumber: this.roundNumber,
      players: this.publicPlayers(),
      you: me ? { id: me.id, name: me.name, icon: me.icon, isHost: me.id === this.hostId } : null,
      activePlayer: active ? { id: active.id, name: active.name, icon: active.icon } : null,
      isActive,
      teamScore: this.teamScore()
    };

    if (this.status === 'clue') {
      base.secretWord = isActive ? null : this.currentWord;
      base.clueProgress = this.clueProgress();
      base.myClue = !isActive && this.clues[playerId] ? this.clues[playerId].text : null;
    } else if (this.status === 'guess') {
      base.secretWord = isActive ? null : this.currentWord;
      base.clues = Object.entries(this.clues).map(([pid, c]) => ({
        playerId: pid,
        text: c.text,
        status: c.status,
        author: this.getPlayer(pid) && { name: this.getPlayer(pid).name, icon: this.getPlayer(pid).icon }
      }));
    } else if (this.status === 'result') {
      base.result = this.lastResult;
    } else if (this.status === 'gameover') {
      base.summary = this.finalSummary();
    }
    return base;
  }
}

function sanitizeName(name) {
  const clean = String(name || '').trim().slice(0, 20);
  return clean || 'Player';
}

module.exports = { Room, MIN_PLAYERS, MAX_PLAYERS, ROUND_OPTIONS, DEFAULT_ROUNDS };
