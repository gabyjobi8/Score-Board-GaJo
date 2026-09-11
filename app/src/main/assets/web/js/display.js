const { startPolling } = window.ScoreboardState;
const M = window.Match;

function renderTeam(team, state) {
  const el = document.getElementById(`display-team-${team}`);
  const t = state.teams[team];
  const foulsWarning = state.fouls[team] >= state.settings.foulLimit;

  el.style.setProperty("--team-color", t.color);
  el.innerHTML = `
    <div class="team-name">
      ${t.logo ? `<img class="team-logo" src="${t.logo}" alt="">` : ""}
      ${t.name}
    </div>
    <div class="score-value">${state.score[team]}</div>
    <div class="fouls-label ${foulsWarning ? "warning" : ""}">فاولز: ${state.fouls[team]}</div>
  `;
}

function render(state) {
  if (state.status === "setup") {
    document.getElementById("display-clock").textContent = "--:--";
    document.getElementById("display-team-a").innerHTML = "";
    document.getElementById("display-team-b").innerHTML = "";
    return;
  }
  document.getElementById("display-clock").textContent = M.formatClock(state.clock.remainingSec);
  renderTeam("a", state);
  renderTeam("b", state);

  const overlay = document.getElementById("display-winner-overlay");
  if (state.status === "finished" && state.winner) {
    overlay.textContent = `${state.teams[state.winner].name} فاز بالمباراة!`;
    overlay.style.display = "flex";
  } else {
    overlay.style.display = "none";
  }
}

startPolling(render, 500);
