// A player's icon is how everyone else identifies whose clue is whose, so no
// two players in a room may share one. That has to be enforced server-side —
// the client picking from a grid can't know what someone else just chose — so
// this list lives here and the client fetches it to draw the grid.
const ICONS = Object.freeze([
  '💋', '🪱', '🦈', '💀', '🥏', '🧇', '🦄', '🛝', '🐘', '🫠', '🍒', '🫈',
  '🌈', '🔥', '🥬', '🌭', '🍕', '🍩', '💅', '🥃', '🚀', '🍺', '🫪', '🍆'
]);

function isIcon(icon) {
  return ICONS.includes(icon);
}

// Returns the requested icon when it's a real one and still free, otherwise a
// random free one. There are 24 icons and at most 8 players, so a room can
// never run out; the last-resort fallback is only there so this can't return
// undefined if that cap ever changes.
function pickIcon(requested, taken) {
  const used = new Set(taken);
  if (isIcon(requested) && !used.has(requested)) return requested;
  const free = ICONS.filter((icon) => !used.has(icon));
  if (free.length === 0) return ICONS[0];
  return free[Math.floor(Math.random() * free.length)];
}

module.exports = { ICONS, isIcon, pickIcon };
