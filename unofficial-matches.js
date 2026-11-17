
(() => {
  "use strict";

  const section = document.getElementById("unofficial");

  if (!section) return;

  const panel = document.createElement("div");

  panel.className = "panel";
  panel.id = "gcUnofficialMatchPanel";

  panel.innerHTML = `
    <h3>⚽ ثبت مسابقه غیررسمی کامل</h3>

    <label>نام حریف یا عنوان مسابقه</label>
    <input id="gcUnOpponent" maxlength="100"
      placeholder="مثلاً مسابقه دوستانه با دوستان">

    <label>تاریخ مسابقه</label>
    <input id="gcUnMatchDate" type="date">

    <div class="notice">
      بازیکنان حاضر را انتخاب کن و آمار هرکدام را جداگانه وارد کن.
      حتی بازیکنی که گل و پاس گل ندارد نیز یک بازی ثبت می‌کند.
    </div>

    <div id="gcUnMatchPlayers"></div>

    <button type="button" class="secondary"
      id="gcUnAddPlayer">
      + افزودن بازیکن
    </button>

    <button type="button" class="primary"
      id="gcUnSaveMatch">
      ثبت مسابقه غیررسمی
    </button>

    <p id="gcUnMatchStatus"></p>
  `;

  const oldForm = document.getElementById("unofficialForm");

  oldForm.parentElement.insertBefore(panel, oldForm);

  const $ = id => document.getElementById(id);

  const escape = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);

  const today = () => {
    const d = new Date();
    return new Date(
      d.getTime() - d.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);
  };

  $("gcUnMatchDate").value = today();

  function status(message, success = false) {
    $("gcUnMatchStatus").textContent = message;
    $("gcUnMatchStatus").style.color =
      success ? "#b9f27c" : "#ffaaaa";
  }

  function rows() {
    return [
      ...$("gcUnMatchPlayers").querySelectorAll(".gc-un-player")
    ];
  }

  function addPlayer() {
    const selected = rows().map(row =>
      row.querySelector(".gc-un-player-select").value
    );

    const available = players.filter(player =>
      !selected.includes(String(player.id))
    );

    if (!available.length) {
      status("همه بازیکنان اضافه شده‌اند.");
      return;
    }

    const row = document.createElement("div");

    row.className = "panel";

    row.innerHTML = `
      <label>بازیکن حاضر</label>

      <select class="gc-un-player-select">
        <option value="">انتخاب بازیکن</option>
        ${available.map(player => `
          <option value="${escape(player.id)}">
            ${escape(player.name)}
          </option>
        `).join("")}
      </select>

      <div class="form-grid">
        <div>
          <label>گل</label>
          <input class="gc-un-goals"
            type="number" min="0" max="999" value="0">
        </div>

        <div>
          <label>پنالتی</label>
          <input class="gc-un-penalties"
            type="number" min="0" max="999" value="0">
        </div>

        <div>
          <label>پاس گل</label>
          <input class="gc-un-assists"
            type="number" min="0" max="999" value="0">
        </div>
      </div>

      <button type="button" class="danger gc-un-remove">
        حذف بازیکن
      </button>
    `;

    row.querySelector(".gc-un-remove")
      .addEventListener("click", () => row.remove());

    $("gcUnMatchPlayers").appendChild(row);
  }

  $("gcUnAddPlayer").addEventListener("click", addPlayer);

  $("gcUnSaveMatch").addEventListener("click", () => {

    const opponent = $("gcUnOpponent").value.trim();
    const date = $("gcUnMatchDate").value;
    const playerRows = rows();

    if (!opponent || !date || !playerRows.length) {
      status("نام مسابقه، تاریخ و حداقل یک بازیکن لازم است.");
      return;
    }

    const matchId =
      "unmatch-" + Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7);

    const records = [];

    for (const row of playerRows) {

      const playerId =
        row.querySelector(".gc-un-player-select").value;

      const goals = Number(
        row.querySelector(".gc-un-goals").value
      );

      const penalties = Number(
        row.querySelector(".gc-un-penalties").value
      );

      const assists = Number(
        row.querySelector(".gc-un-assists").value
      );

      if (!playerId) {
        status("برای همه ردیف‌ها بازیکن انتخاب کن.");
        return;
      }

      if (
        !Number.isInteger(goals) || goals < 0 ||
        !Number.isInteger(penalties) ||
        penalties < 0 || penalties > goals ||
        !Number.isInteger(assists) || assists < 0
      ) {
        status("مقادیر گل، پنالتی یا پاس گل معتبر نیست.");
        return;
      }

      records.push({
        id: matchId + "-" + playerId,
        matchId,
        opponent,
        playerId,
        goals,
        penalties,
        assists,
        date,
        note: "مسابقه غیررسمی گروهی"
      });
    }

    if (
      new Set(records.map(record => String(record.playerId))).size !==
      records.length
    ) {
      status("هر بازیکن را فقط یک بار انتخاب کن.");
      return;
    }

    unofficial.push(...records);

    if (!saveData()) {
      unofficial.splice(-records.length, records.length);
      return;
    }

    $("gcUnOpponent").value = "";
    $("gcUnMatchDate").value = today();
    $("gcUnMatchPlayers").innerHTML = "";

    addPlayer();

    renderAll();

    status(
      "مسابقه و آمار تمام بازیکنان با موفقیت ثبت شد.",
      true
    );
  });

  addPlayer();

})();
