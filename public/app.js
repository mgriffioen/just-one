(() => {
  const ICONS = ['🐎','🪱','🦈','💀','🥏','🧇','🦄','🛝','🐘','😬','🍒','🫈',
                 '🌈','🔥','🥬','🌭','🍕','🍩','💅','🥃','🚀','🍺','🫪','🍆'];

  const $ = (id) => document.getElementById(id);
  const socket = io();

  let state = {
    selectedIcon: ICONS[Math.floor(Math.random() * ICONS.length)],
    view: null,
    joining: false
  };

  // ---------- persistence ----------
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
    clear(key) { localStorage.removeItem(key); }
  };

  function saveSession(roomCode, playerId) {
    store.set('justone_session', { roomCode, playerId });
  }
  function clearSession() {
    store.clear('justone_session');
  }

  // ---------- toast ----------
  let toastTimer = null;
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  // ---------- screens ----------
  // "home" is the only screen marked .active in the static HTML.
  let currentScreenName = 'home';
  let screenTransitioning = false;
  let pendingScreenName = null;

  function showScreen(name) {
    if (screenTransitioning) { pendingScreenName = name; return; }
    if (name === currentScreenName) return;
    beginScreenTransition(name);
  }

  function beginScreenTransition(name) {
    const toEl = $(`screen-${name}`);
    if (!toEl) return;
    const fromEl = $(`screen-${currentScreenName}`);

    if (!fromEl || fromEl === toEl) {
      toEl.classList.add('active');
      currentScreenName = name;
      return;
    }

    screenTransitioning = true;
    fromEl.classList.add('screen-transitioning', 'screen-outgoing');
    toEl.classList.add('active', 'screen-transitioning', 'screen-incoming', 'fold-enter');

    // Flush the starting pose above before flipping to the resting pose
    // below, so the browser actually animates the change.
    void toEl.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toEl.classList.remove('fold-enter');
        fromEl.classList.add('fold-leave');
      });
    });

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      toEl.removeEventListener('transitionend', onTransitionEnd);
      fromEl.classList.remove('active', 'screen-transitioning', 'screen-outgoing', 'fold-leave');
      toEl.classList.remove('screen-transitioning', 'screen-incoming');
      currentScreenName = name;
      screenTransitioning = false;
      const next = pendingScreenName;
      pendingScreenName = null;
      if (next && next !== name) beginScreenTransition(next);
    }
    function onTransitionEnd(e) {
      if (e.target === toEl && e.propertyName === 'transform') finish();
    }
    toEl.addEventListener('transitionend', onTransitionEnd);
    setTimeout(finish, 600); // safety net in case transitionend never fires
  }

  const STATUS_TO_SCREEN = {
    lobby: 'lobby',
    clue: 'clue',
    guess: 'guess',
    result: 'result',
    gameover: 'gameover'
  };

  // ---------- icon grid (home) ----------
  function buildIconGrid() {
    const grid = $('icon-grid');
    grid.innerHTML = '';
    ICONS.forEach((icon) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-btn' + (icon === state.selectedIcon ? ' selected' : '');
      btn.textContent = icon;
      btn.addEventListener('click', () => {
        state.selectedIcon = icon;
        grid.querySelectorAll('.icon-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      grid.appendChild(btn);
    });
  }

  function emitWithAck(event, payload) {
    return new Promise((resolve) => {
      socket.emit(event, payload, (res) => {
        if (!res) return resolve({ ok: false, error: 'No response from server.' });
        if (!res.ok) toast(res.error || 'Something went wrong.');
        resolve(res);
      });
    });
  }

  // ---------- home screen wiring ----------
  buildIconGrid();

  const savedName = store.get('justone_name');
  if (savedName) $('input-name').value = savedName;

  let selectedRounds = 13;
  $('rounds-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    selectedRounds = Number(btn.dataset.rounds);
    $('rounds-grid').querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    btn.classList.add('active');
  });

  $('btn-show-create').addEventListener('click', () => {
    $('create-options').classList.remove('hidden');
    $('join-options').classList.add('hidden');
  });
  $('btn-show-join').addEventListener('click', () => {
    $('join-options').classList.remove('hidden');
    $('create-options').classList.add('hidden');
    setTimeout(() => $('input-code').focus(), 50);
  });

  function currentNameOrToast() {
    const name = $('input-name').value.trim();
    if (!name) {
      toast('Enter your name first.');
      return null;
    }
    store.set('justone_name', name);
    return name;
  }

  $('btn-create').addEventListener('click', async () => {
    const name = currentNameOrToast();
    if (!name || state.joining) return;
    state.joining = true;
    const res = await emitWithAck('create_room', { name, icon: state.selectedIcon, totalRounds: selectedRounds });
    state.joining = false;
    if (res.ok) {
      saveSession(res.roomCode, res.playerId);
      render(res.view);
    }
  });

  $('btn-join').addEventListener('click', async () => {
    const name = currentNameOrToast();
    const code = $('input-code').value.trim().toUpperCase();
    if (!name || state.joining) return;
    if (!code) { toast('Enter a room code.'); return; }
    state.joining = true;
    const res = await emitWithAck('join_room', { code, name, icon: state.selectedIcon });
    state.joining = false;
    if (res.ok) {
      saveSession(res.roomCode, res.playerId);
      render(res.view);
    }
  });

  $('input-code').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  // ---------- lobby ----------
  $('btn-start').addEventListener('click', () => emitWithAck('start_game', {}));
  $('btn-leave-lobby').addEventListener('click', leaveRoom);
  $('btn-new-game').addEventListener('click', leaveRoom);

  async function leaveRoom() {
    await emitWithAck('leave_room', {});
    clearSession();
    state.view = null;
    showScreen('home');
  }

  // ---------- clue phase ----------
  $('clue-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('input-clue');
    const text = input.value.trim();
    if (!text) { toast('Type a one-word clue.'); return; }
    if (/\s/.test(text)) { toast('Just one word, please!'); return; }
    const res = await emitWithAck('submit_clue', { text });
    if (res.ok) input.value = '';
  });
  $('btn-force-reveal').addEventListener('click', () => emitWithAck('force_reveal', {}));

  // ---------- guess phase ----------
  $('guess-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('input-guess');
    const text = input.value.trim();
    if (!text) { toast('Type your guess, or tap Pass.'); return; }
    const res = await emitWithAck('submit_guess', { text });
    if (res.ok) input.value = '';
  });
  $('btn-pass').addEventListener('click', () => emitWithAck('submit_guess', { text: '' }));

  // ---------- result / gameover ----------
  $('btn-next-round').addEventListener('click', () => emitWithAck('next_round', {}));
  $('btn-play-again').addEventListener('click', () => emitWithAck('play_again', {}));

  // ---------- rendering ----------
  socket.on('state', render);

  function render(view) {
    if (!view) return;
    state.view = view;
    const screen = STATUS_TO_SCREEN[view.status] || 'home';
    showScreen(screen);

    if (view.status === 'lobby') renderLobby(view);
    else if (view.status === 'clue') renderClue(view);
    else if (view.status === 'guess') renderGuess(view);
    else if (view.status === 'result') renderResult(view);
    else if (view.status === 'gameover') renderGameOver(view);
  }

  function playerRow(player, extraBadge) {
    const li = document.createElement('li');
    if (player.connected === false) li.classList.add('dim');
    li.innerHTML = `<span class="player-icon">${player.icon}</span><span class="player-name">${escapeHtml(player.name)}</span>`;
    if (player.isHost) {
      const b = document.createElement('span');
      b.className = 'badge';
      b.textContent = 'Host';
      li.appendChild(b);
    }
    if (player.connected === false) {
      const b = document.createElement('span');
      b.className = 'badge muted';
      b.textContent = 'Offline';
      li.appendChild(b);
    }
    if (extraBadge) {
      const b = document.createElement('span');
      b.className = 'badge';
      b.textContent = extraBadge;
      li.appendChild(b);
    }
    return li;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderLobby(view) {
    $('lobby-code').textContent = view.code;
    const list = $('lobby-players');
    list.innerHTML = '';
    view.players.forEach((p) => list.appendChild(playerRow(p)));

    const isHost = view.you && view.you.isHost;
    const canStart = view.players.length >= 3;
    $('btn-start').classList.toggle('hidden', !isHost);
    $('btn-start').disabled = !canStart;
    $('lobby-wait').classList.toggle('hidden', isHost);
    $('lobby-min-hint').classList.toggle('hidden', canStart || !isHost);
  }

  function playerById(view, id) {
    return view.players.find((p) => p.id === id);
  }

  function renderClue(view) {
    $('clue-round-label').textContent = `Round ${view.roundNumber} / ${view.totalRounds}`;
    $('clue-score-label').textContent = `${view.teamScore.correct} / ${view.teamScore.total}`;
    $('btn-force-reveal').classList.toggle('hidden', !(view.you && view.you.isHost));

    if (view.isActive) {
      $('clue-as-guesser').classList.remove('hidden');
      $('clue-as-giver').classList.add('hidden');
      const list = $('clue-progress-list');
      list.innerHTML = '';
      view.clueProgress.forEach((c) => {
        const p = playerById(view, c.playerId);
        if (!p) return;
        list.appendChild(playerRow(p, c.submitted ? '✓ Ready' : 'Thinking…'));
      });
    } else {
      $('clue-as-guesser').classList.add('hidden');
      $('clue-as-giver').classList.remove('hidden');
      $('clue-secret-word').textContent = view.secretWord;
      const activeP = view.activePlayer;
      $('clue-active-name').textContent = activeP ? `${activeP.icon} ${activeP.name}` : 'the guesser';

      const submitted = !!view.myClue;
      $('clue-form').classList.toggle('hidden', submitted);
      $('clue-submitted').classList.toggle('hidden', !submitted);
      if (submitted) {
        $('clue-submitted-text').textContent = view.myClue;
        const list = $('clue-progress-list-giver');
        list.innerHTML = '';
        view.clueProgress.forEach((c) => {
          const p = playerById(view, c.playerId);
          if (!p) return;
          list.appendChild(playerRow(p, c.submitted ? '✓ Ready' : 'Thinking…'));
        });
      }
    }
  }

  function clueLi(clue, { strike }) {
    const li = document.createElement('li');
    if (strike) li.classList.add('removed');
    const author = clue.author || {};
    li.innerHTML = `<span class="clue-text">${escapeHtml(clue.text || '(blank)')}</span>` +
      `<span class="clue-author">${author.icon || ''} ${escapeHtml(author.name || '')}${strike ? ` · ${clue.status}` : ''}</span>`;
    return li;
  }

  function renderGuess(view) {
    $('guess-round-label').textContent = `Round ${view.roundNumber} / ${view.totalRounds}`;
    $('guess-score-label').textContent = `${view.teamScore.correct} / ${view.teamScore.total}`;
    const activeP = view.activePlayer;
    $('guess-active-name').textContent = activeP ? `${activeP.icon} ${activeP.name}` : 'the guesser';

    const list = $('guess-clue-list');
    list.innerHTML = '';
    if (view.isActive) {
      const valid = view.clues.filter((c) => c.status === 'valid');
      if (valid.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No clues made it through this round!';
        list.appendChild(li);
      } else {
        valid.forEach((c) => list.appendChild(clueLi(c, { strike: false })));
      }
    } else {
      view.clues.forEach((c) => list.appendChild(clueLi(c, { strike: c.status !== 'valid' })));
    }

    $('guess-as-guesser').classList.toggle('hidden', !view.isActive);
    $('guess-as-other').classList.toggle('hidden', view.isActive);
    if (!view.isActive) $('guess-waiting-name').textContent = activeP ? `${activeP.icon} ${activeP.name}` : 'the guesser';
  }

  function renderResult(view) {
    const r = view.result;
    if (!r) return;
    let headline = 'Not quite...';
    let icon = '😬';
    if (r.correct) { headline = 'Correct!'; icon = '🎉'; }
    else if (r.passed) { headline = 'Passed'; icon = '🤷'; }
    $('result-headline').textContent = headline;
    $('result-icon').textContent = icon;
    $('result-word').textContent = r.word;
    $('result-guesser-icon').textContent = r.activePlayer ? r.activePlayer.icon : '';
    $('result-guesser-name').textContent = r.activePlayer ? r.activePlayer.name : '';
    $('result-guess-text').textContent = r.passed ? 'passed' : r.guess;
    $('result-score').textContent = `${view.teamScore.correct} / ${view.teamScore.total}`;

    const cluesEl = $('result-clues');
    cluesEl.innerHTML = '';
    if (r.validClues.length) {
      const h = document.createElement('h4');
      h.textContent = 'Clues used';
      cluesEl.appendChild(h);
      const ul = document.createElement('ul');
      ul.className = 'clue-list';
      r.validClues.forEach((c) => ul.appendChild(clueLi(c, { strike: false })));
      cluesEl.appendChild(ul);
    }
    if (r.removedClues.length) {
      const h = document.createElement('h4');
      h.textContent = 'Removed (duplicate or matched the word)';
      cluesEl.appendChild(h);
      const ul = document.createElement('ul');
      ul.className = 'clue-list';
      r.removedClues.forEach((c) => ul.appendChild(clueLi(c, { strike: true })));
      cluesEl.appendChild(ul);
    }

    const isHost = view.you && view.you.isHost;
    const isLastRound = view.roundNumber >= view.totalRounds;
    $('btn-next-round').textContent = isLastRound ? 'See final score' : 'Next round';
    $('btn-next-round').classList.toggle('hidden', !isHost);
    $('result-wait').classList.toggle('hidden', isHost);
  }

  function renderGameOver(view) {
    const s = view.summary;
    if (!s) return;
    $('final-score').textContent = `${s.correct} / ${s.total}`;
    $('final-rating').textContent = s.rating;

    const words = $('final-words');
    words.innerHTML = '';
    const rounds = s.rounds || [];
    if (rounds.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No rounds were played.';
      words.appendChild(li);
    } else {
      rounds.forEach((r) => {
        const li = document.createElement('li');
        if (!r.correct) li.classList.add('missed');
        const guesser = r.activePlayer || {};
        let outcome;
        if (r.correct) outcome = 'guessed it';
        else if (r.passed) outcome = 'passed';
        else outcome = `said "${escapeHtml(r.guess)}"`;
        li.innerHTML = `<span class="round-num">${r.round}</span>` +
          `<span class="final-word">${escapeHtml(r.word)}</span>` +
          `<span class="round-outcome">${r.correct ? '✅' : '❌'} ` +
          `${guesser.icon || ''} ${escapeHtml(guesser.name || '')} ${outcome}</span>`;
        words.appendChild(li);
      });
    }

    const list = $('final-players');
    list.innerHTML = '';
    const sorted = [...s.players].sort((a, b) => b.correctAsActive - a.correctAsActive || b.cluesAccepted - a.cluesAccepted);
    sorted.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = `<div style="display:flex;align-items:center;gap:10px;">` +
        `<span class="player-icon">${p.icon}</span>` +
        `<div><div class="player-name">${escapeHtml(p.name)}</div>` +
        `<div class="stat-line">Guessed right ${p.correctAsActive}/${p.roundsAsActive} as guesser · ${p.cluesAccepted}/${p.cluesGiven} valid clues given</div></div>` +
        `</div>`;
      list.appendChild(li);
    });

    const isHost = view.you && view.you.isHost;
    $('btn-play-again').classList.toggle('hidden', !isHost);
  }

  // ---------- reconnect flow ----------
  const session = store.get('justone_session');
  socket.on('connect', () => {
    if (session && session.roomCode && session.playerId) {
      emitWithAck('rejoin', { code: session.roomCode, playerId: session.playerId }).then((res) => {
        if (res.ok) render(res.view);
        else clearSession();
      });
    }
  });

  socket.on('connect_error', () => toast('Connection trouble — retrying…'));
})();
