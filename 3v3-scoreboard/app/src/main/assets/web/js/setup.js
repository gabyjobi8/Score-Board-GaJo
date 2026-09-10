const { getSavedLogos, saveLogo, setState, defaultState } = window.ScoreboardState;

const defaults = defaultState();
const teamData = {
  a: { name: defaults.teams.a.name, logo: null, color: defaults.teams.a.color },
  b: { name: defaults.teams.b.name, logo: null, color: defaults.teams.b.color },
};

function teamLabel(team) {
  return team === "a" ? "الفريق الأول" : "الفريق الثاني";
}

function renderTeamBlock(team) {
  const container = document.getElementById(`team-${team}`);
  const data = teamData[team];
  const savedLogos = getSavedLogos();

  container.innerHTML = `
    <h3>
      <span class="team-color-dot" style="background:${data.color}"></span>
      ${teamLabel(team)}
    </h3>

    <div class="field-group">
      <label>اسم الفريق</label>
      <input type="text" data-role="name" value="${data.name}" required>
    </div>

    <div class="field-group">
      <label>اللوغو</label>
      <div class="logo-row">
        <div data-role="preview-wrap"></div>
        <div>
          <input type="file" accept="image/*" data-role="upload">
          <button type="button" class="small-btn" data-role="clear-logo" style="margin-top:6px;">إزالة اللوغو</button>
        </div>
      </div>
      ${savedLogos.length ? `
        <label style="margin-top:10px;">أو اختر من المحفوظ</label>
        <div class="saved-logos" data-role="saved-logos"></div>
      ` : ""}
    </div>

    <div class="field-group">
      <label>لون بديل (Fallback) — يُستخدم إذا ما في لوغو</label>
      <div class="color-row">
        <input type="color" data-role="color" value="${data.color}">
      </div>
    </div>
  `;

  renderLogoPreview(team);
  if (savedLogos.length) renderSavedLogos(team, savedLogos);

  container.querySelector('[data-role="name"]').addEventListener("input", (e) => {
    teamData[team].name = e.target.value;
    container.querySelector("h3").innerHTML = `
      <span class="team-color-dot" style="background:${teamData[team].color}"></span>
      ${teamLabel(team)}
    `;
  });

  container.querySelector('[data-role="color"]').addEventListener("input", (e) => {
    teamData[team].color = e.target.value;
    container.querySelector(".team-color-dot").style.background = e.target.value;
  });

  container.querySelector('[data-role="upload"]').addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      teamData[team].logo = reader.result;
      renderLogoPreview(team);
      // Offer to save it under the team's current name for reuse next time.
      saveLogo(teamData[team].name || teamLabel(team), reader.result);
      renderTeamBlock(team); // refresh saved-logos strip
    };
    reader.readAsDataURL(file);
  });

  container.querySelector('[data-role="clear-logo"]').addEventListener("click", () => {
    teamData[team].logo = null;
    renderLogoPreview(team);
  });
}

function renderLogoPreview(team) {
  const container = document.getElementById(`team-${team}`);
  const wrap = container.querySelector('[data-role="preview-wrap"]');
  const data = teamData[team];
  if (data.logo) {
    wrap.innerHTML = `<img class="logo-preview" src="${data.logo}" alt="logo">`;
  } else {
    wrap.innerHTML = `<div class="logo-preview empty">بدون لوغو</div>`;
  }
}

function renderSavedLogos(team, logos) {
  const container = document.getElementById(`team-${team}`);
  const strip = container.querySelector('[data-role="saved-logos"]');
  if (!strip) return;
  strip.innerHTML = logos.map((l) => `
    <button type="button" class="saved-logo-chip" data-name="${l.name}" title="${l.name}">
      <img src="${l.dataUrl}" alt="${l.name}">
    </button>
  `).join("");
  strip.querySelectorAll(".saved-logo-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const logo = logos.find((l) => l.name === chip.dataset.name);
      teamData[team].logo = logo.dataUrl;
      renderLogoPreview(team);
    });
  });
}

renderTeamBlock("a");
renderTeamBlock("b");

document.getElementById("setup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const state = defaultState();
  state.teams.a = { name: teamData.a.name, logo: teamData.a.logo, color: teamData.a.color };
  state.teams.b = { name: teamData.b.name, logo: teamData.b.logo, color: teamData.b.color };

  const durationMin = Number(document.getElementById("duration").value);
  state.settings.matchDurationSec = durationMin * 60;
  state.clock.remainingSec = durationMin * 60;
  state.settings.winScore = Number(document.getElementById("win-score").value);
  state.settings.foulLimit = Number(document.getElementById("foul-limit").value);
  state.settings.onePointValue = Number(document.getElementById("one-point").value);
  state.settings.twoPointValue = Number(document.getElementById("two-point").value);
  state.status = "live";

  await setState(state);
  window.location.href = "control.html";
});
