/**
 * match.js — pure functions that mutate a match state object.
 * No storage, no DOM. Keeping this separate means the same rules can
 * later be reused unchanged even if the transport layer changes.
 */

function otherTeam(team) {
  return team === "a" ? "b" : "a";
}

function checkWinner(state) {
  const { score } = state;
  const { winScore } = state.settings;
  if (score.a >= winScore) return "a";
  if (score.b >= winScore) return "b";
  if (state.clock.remainingSec <= 0) {
    if (score.a !== score.b) return score.a > score.b ? "a" : "b";
  }
  return null;
}

function addPoint(state, team, points) {
  if (state.status === "finished") return state;
  state.score[team] += points;
  state.history.push({ type: "score", team, delta: points });
  const winner = checkWinner(state);
  if (winner) {
    state.status = "finished";
    state.winner = winner;
    state.clock.running = false;
  }
  return state;
}

function addFoul(state, team) {
  if (state.status === "finished") return state;
  state.fouls[team] += 1;
  state.history.push({ type: "foul", team, delta: 1 });
  return state;
}

function undoLast(state) {
  const last = state.history.pop();
  if (!last) return state;
  if (last.type === "score") {
    state.score[last.team] -= last.delta;
  } else if (last.type === "foul") {
    state.fouls[last.team] -= 1;
  }
  // Undoing can revert a finished match back to live.
  if (state.status === "finished") {
    state.status = "live";
    state.winner = null;
  }
  return state;
}

function tickClock(state) {
  if (!state.clock.running || state.status === "finished") return state;
  state.clock.remainingSec = Math.max(0, state.clock.remainingSec - 1);
  if (state.clock.remainingSec === 0) {
    state.clock.running = false;
    const winner = checkWinner(state);
    if (winner) {
      state.status = "finished";
      state.winner = winner;
    }
  }
  return state;
}

function startClock(state) {
  if (state.status !== "finished") state.clock.running = true;
  return state;
}

function pauseClock(state) {
  state.clock.running = false;
  return state;
}

function resetClock(state) {
  state.clock.running = false;
  state.clock.remainingSec = state.settings.matchDurationSec;
  return state;
}

function formatClock(remainingSec) {
  const m = Math.floor(remainingSec / 60);
  const s = remainingSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

window.Match = {
  otherTeam,
  checkWinner,
  addPoint,
  addFoul,
  undoLast,
  tickClock,
  startClock,
  pauseClock,
  resetClock,
  formatClock,
};
