const { getState, setState, subscribe } = window.ScoreboardState;
const M = window.Match;

let state = null;
let clockInterval = null;

function renderTeamPanel(team) {
  const panel = document.getElementById(`panel-${team}`);
  const t = state.teams[team];
  const foulsWarning = state.fouls[team] >= state.settings.foulLimit;

  panel.style.setProperty("--team-color", t.color);
  panel.innerHTML = `
    <div class="team-name">
      ${t.logo ? `<img class="team-logo" src="${t.logo}" alt="">` : ""}
      ${t.name}
    </div>
    <div class="score-value">${state.score[team]}</div>
    <div class="point-btns">
      <button data-action="point" data-value="${state.settings.onePointValue}">+${state.settings.onePointValue}</button>
      <button data-action="point" data-value="${state.settings.twoPointValue}">+${state.settings.twoPointValue}</button>
    </div>
    <div class="foul-row">
      فاولز:
      <span class="foul-count ${foulsWarning ? "warning" : ""}">${state.fouls[team]}</span>
      <button data-action="foul">+1 فاول</button>
    </div>
  `;

  panel.querySelectorAll('[data-action="point"]').forEach((btn) => {
    btn.addEventListener("click", () => handlePoint(team, Number(btn.dataset.value)));
  });
  panel.querySelector('[data-action="foul"]').addEventListener("click", () => handleFoul(team));
}

function renderClock() {
  document.getElementById("clock-display").textContent = M.formatClock(state.clock.remainingSec);
  document.getElementById("clock-toggle").textContent = state.clock.running ? "إيقاف" : "ابدأ";
}

function renderWinnerBanner() {
  const banner = document.getElementById("winner-banner");
  if (state.status === "finished" && state.winner) {
    document.getElementById("winner-text").textContent =
      `${state.teams[state.winner].name} فاز بالمباراة!`;
    banner.style.display = "flex";
  } else {
    banner.style.display = "none";
  }
}

function renderAll() {
  renderTeamPanel("a");
  renderTeamPanel("b");
  renderClock();
  renderWinnerBanner();
}

async function persist() {
  await setState(state);
  renderAll();
}

async function handlePoint(team, value) {
  M.addPoint(state, team, value);
  await persist();
}

async function handleFoul(team) {
  M.addFoul(state, team);
  await persist();
}

document.getElementById("undo-btn").addEventListener("click", async () => {
  M.undoLast(state);
  await persist();
});

document.getElementById("clock-toggle").addEventListener("click", async () => {
  if (state.clock.running) {
    M.pauseClock(state);
  } else {
    M.startClock(state);
  }
  await persist();
});

document.getElementById("clock-reset").addEventListener("click", async () => {
  M.resetClock(state);
  await persist();
});

document.getElementById("winner-new-game").addEventListener("click", () => {
  window.location.href = "setup.html";
});

// The control device owns the countdown: it ticks the clock locally once
// per second and pushes the updated state so the display screen (and any
// other viewer) stays in sync.
function startLocalClockLoop() {
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(async () => {
    if (!state || !state.clock.running) return;
    M.tickClock(state);
    await persist();
  }, 1000);
}

function renderDisplayLink() {
  const box = document.getElementById("display-link-box");
  const url = new URL("display.html", window.location.href).href;
  box.innerHTML = `افتح شاشة العرض على الجهاز الثاني: <code>${url}</code>`;
}

(async function init() {
  state = await getState();
  if (state.status === "setup") {
    window.location.href = "setup.html";
    return;
  }
  renderAll();
  renderDisplayLink();
  startLocalClockLoop();

  subscribe((incoming) => {
    // Ignore our own echoes; only matters when another control tab exists.
    state = incoming;
    renderAll();
  });
})();
