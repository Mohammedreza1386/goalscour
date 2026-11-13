
(() => {
  "use strict";

  const SUPABASE_URL = "https://zusbebjskchgehdjvpsm.supabase.co";
  const SUPABASE_KEY = "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  let isAdmin = false;
  let events = [];
  let performances = [];

  const style = document.createElement("style");

  style.textContent = `
    #gcRatings .gc-rating-row {
      background:#0c130d;
      border:1px solid #273329;
      border-radius:12px;
      padding:12px;
      margin:10px 0;
    }

    #gcRatings .gc-rating-grid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:8px;
    }

    #gcRatings input,
    #gcRatings select {
      width:100%;
      box-sizing:border-box;
      background:#090d0a;
      color:white;
      border:1px solid #273329;
      border-radius:9px;
      padding:10px;
      margin:5px 0 10px;
    }

    #gcRatings label {
      color:#b9c5b6;
      font-size:12px;
    }

    #gcRatings .gc-rating-row strong {
      color:#b9f27c;
    }

    #gcRatings .gc-rating-score {
      color:#b9f27c !important;
      font-weight:bold;
      font-size:20px;
      background:#172319 !important;
    }

    #gcRatings .gc-rating-history {
      background:#0c130d;
      border:1px solid #273329;
      border-radius:12px;
      padding:12px;
      margin:9px 0;
      line-height:2;
      font-size:12px;
    }

    #gcRatings .gc-rating-history small {
      color:#89958a;
    }

    #gcRatings .gc-rating-status {
      color:#89958a;
      font-size:12px;
      line-height:2;
      margin-top:10px;
    }

    @media(max-width:420px) {
      #gcRatings .gc-rating-grid {
        grid-template-columns:1fr;
      }
    }
  `;

  document.head.appendChild(style);

  function getPlayers() {
    try {
      return Array.isArray(players) ? players : [];
    } catch {
      return [];
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    })[char]);
  }

  function today() {
    const date = new Date();

    return new Date(
      date.getTime() -
      date.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);
  }

  function getPlayerName(playerId) {
    const player = getPlayers().find(
      item => String(item.id) === String(playerId)
    );

    return player ? player.name : "بازیکن حذف‌شده";
  }

  function getPlayerOptions() {
    return getPlayers().map(player => `
      <option value="${escapeHTML(player.id)}">
        ${escapeHTML(player.name)}
      </option>
    `).join("");
  }

  // فرمول محاسبه خودکار امتیاز

  function calculateRating(
    goals,
    penalties,
    assists,
    teamGoals,
    opponentGoals
  ) {
    const normalGoals = Math.max(0, goals - penalties);

    let score = 6;

    score += normalGoals * 1.15;
    score += penalties * 0.75;
    score += assists * 0.85;

    if (teamGoals > opponentGoals) {
      score += 0.6;
    } else if (teamGoals === opponentGoals) {
      score += 0.2;
    } else {
      score -= 0.4;
    }

    score = Math.max(1, Math.min(10, score));

    return Number(score.toFixed(2));
  }

  function getRows() {
    return [
      ...document.querySelectorAll(
        "#gcPerformanceRows .gc-rating-row"
      )
    ];
  }

  function updateAutomaticRatings() {
    const opponentGoals = Number(
      document.getElementById("gcRatingAgainst")?.value || 0
    );

    const rows = getRows();

    const teamGoals = rows.reduce((sum, row) => {
      return sum + Math.max(
        0,
        Number(row.querySelector(".gc-rating-goals").value || 0)
      );
    }, 0);

    rows.forEach(row => {
      const goals = Number(
        row.querySelector(".gc-rating-goals").value || 0
      );

      const penalties = Number(
        row.querySelector(".gc-rating-penalties").value || 0
      );

      const assists = Number(
        row.querySelector(".gc-rating-assists").value || 0
      );

      const score = calculateRating(
        goals,
        penalties,
        assists,
        teamGoals,
        opponentGoals
      );

      row.querySelector(".gc-rating-score").value =
        score.toFixed(2);
    });
  }

  function buildInterface() {
    const section = document.getElementById("gcRatings");

    if (!section) return;

    section.innerHTML = `
      <h2>ثبت عملکرد و امتیاز مسابقه</h2>

      <div class="panel" id="gcRatingAdminForm">

        <h3>ثبت مسابقه جدید</h3>

        <label>نام حریف</label>
        <input id="gcRatingOpponent"
          maxlength="100"
          placeholder="نام تیم مقابل">

        <div class="gc-rating-grid">
          <div>
            <label>تاریخ مسابقه</label>
            <input id="gcRatingDate"
              type="date"
              value="${today()}">
          </div>

          <div>
            <label>گل‌های حریف</label>
            <input id="gcRatingAgainst"
              type="number"
              min="0"
              max="99"
              value="0">
          </div>
        </div>

        <div class="notice">
          امتیاز بازیکنان به‌صورت خودکار از ۱ تا ۱۰
          محاسبه می‌شود. گل، پنالتی، پاس گل و نتیجه
          مسابقه در محاسبه تأثیر دارند.
        </div>

        <div id="gcPerformanceRows"></div>

        <button class="secondary"
          type="button"
          id="gcAddPerformanceRow">
          + افزودن بازیکن به مسابقه
        </button>

        <button class="primary"
          type="button"
          id="gcSaveRatedMatch">
          ذخیره مسابقه و عملکرد بازیکنان
        </button>

        <div class="gc-rating-status"
          id="gcRatingStatus"></div>

      </div>

      <div class="panel">
        <h3>تاریخچه مسابقات امتیازدهی‌شده</h3>

        <div id="gcRatedMatchHistory">
          در حال دریافت اطلاعات...
        </div>
      </div>
    `;

    document.getElementById("gcAddPerformanceRow")
      .addEventListener("click", addPlayerRow);

    document.getElementById("gcSaveRatedMatch")
      .addEventListener("click", saveRatedMatch);

    document.getElementById("gcRatingAgainst")
      .addEventListener("input", updateAutomaticRatings);

    addPlayerRow();
  }

  function status(message, success = false) {
    const element = document.getElementById("gcRatingStatus");

    if (!element) return;

    element.textContent = message;

    element.style.color = success
      ? "#b9f27c"
      : "#ffaaaa";
  }

  function addPlayerRow() {
    const container = document.getElementById(
      "gcPerformanceRows"
    );

    if (!container) return;

    const available = getPlayers().filter(player => {
      return !getRows().some(row =>
        row.querySelector(".gc-rating-player").value ===
        String(player.id)
      );
    });

    if (!available.length) {
      status("همه بازیکنان به مسابقه اضافه شده‌اند.");
      return;
    }

    const row = document.createElement("div");

    row.className = "gc-rating-row";

    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px">
        <strong>بازیکن مسابقه</strong>

        <button type="button"
          class="danger gc-remove-rating">
          حذف
        </button>
      </div>

      <label>انتخاب بازیکن</label>

      <select class="gc-rating-player">
        <option value="">انتخاب بازیکن</option>
        ${getPlayerOptions()}
      </select>

      <div class="gc-rating-grid">

        <div>
          <label>امتیاز خودکار</label>

          <input class="gc-rating-score"
            type="number"
            min="1"
            max="10"
            step="0.01"
            value="6.20"
            readonly>
        </div>

        <div>
          <label>گل</label>

          <input class="gc-rating-goals"
            type="number"
            min="0"
            max="99"
            value="0">
        </div>

        <div>
          <label>پنالتی</label>

          <input class="gc-rating-penalties"
            type="number"
            min="0"
            max="99"
            value="0">
        </div>

        <div>
          <label>پاس گل</label>

          <input class="gc-rating-assists"
            type="number"
            min="0"
            max="99"
            value="0">
        </div>

      </div>
    `;

    const select = row.querySelector(".gc-rating-player");

    select.addEventListener("change", () => {
      const value = select.value;

      const duplicate = getRows().some(other =>
        other !== row &&
        other.querySelector(".gc-rating-player").value === value &&
        value
      );

      if (duplicate) {
        select.value = "";
        status("این بازیکن قبلاً انتخاب شده است.");
      }
    });

    row.querySelectorAll(
      ".gc-rating-goals, .gc-rating-penalties, .gc-rating-assists"
    ).forEach(input => {
      input.addEventListener("input", updateAutomaticRatings);
    });

    row.querySelector(".gc-remove-rating")
      .addEventListener("click", () => {
        row.remove();
        updateAutomaticRatings();
      });

    container.appendChild(row);

    updateAutomaticRatings();
  }

  async function verifyAdmin() {
    const { data, error } = await db.auth.getUser();

    if (error || !data.user) {
      isAdmin = false;
      return false;
    }

    const result = await db
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    isAdmin = !result.error && !!result.data;

    return isAdmin;
  }
  
  function publishStats() {
    window.gcGetMatchStats = function (playerId) {
      const rows = performances.filter(item =>
        String(item.player_id) === String(playerId)
      );

      const appearances = new Set(
        rows.map(item => item.match_id)
      ).size;

      const goals = rows.reduce(
        (sum, item) => sum + Number(item.goals || 0), 0
      );

      const penalties = rows.reduce(
        (sum, item) => sum + Number(item.penalties || 0), 0
      );

      const assists = rows.reduce(
        (sum, item) => sum + Number(item.assists || 0), 0
      );

      const totalRating = rows.reduce(
        (sum, item) => sum + Number(item.rating || 0), 0
      );

      return {
        appearances,
        totalRating: Number(totalRating.toFixed(2)),

        averageRating: appearances
          ? Number((totalRating / appearances).toFixed(2))
          : 0,

        goals,
        penalties,
        assists,

        goalsPerMatch: appearances
          ? Number((goals / appearances).toFixed(2))
          : 0,

        assistsPerMatch: appearances
          ? Number((assists / appearances).toFixed(2))
          : 0,

        hatTricks: rows.filter(
          item => Number(item.goals) >= 3
        ).length,

        braces: rows.filter(
          item => Number(item.goals) === 2
        ).length
      };
    };

    window.gcIsRatedDuplicate = function (match) {
      return events.some(event =>
        String(event.match_date) === String(match.date) &&
        String(event.opponent || "").trim().toLowerCase() ===
        String(match.opponent || "").trim().toLowerCase()
      );
    };
  }

  async function loadRatings() {
    const [eventResult, performanceResult] = await Promise.all([
      db.from("goalscour_match_events")
        .select("*")
        .order("match_date", { ascending: false }),

      db.from("goalscour_match_performances")
        .select("*")
    ]);

    if (eventResult.error) throw eventResult.error;
    if (performanceResult.error) throw performanceResult.error;

    events = eventResult.data || [];
    performances = performanceResult.data || [];

    publishStats();
    renderHistory();

    if (typeof window.renderAll === "function") {
      window.renderAll();
    }
  }

  async function saveRatedMatch() {
    if (!isAdmin) {
      status("فقط مدیر اجازه ثبت مسابقه دارد.");
      return;
    }

    const opponent = document
      .getElementById("gcRatingOpponent").value.trim();

    const date = document
      .getElementById("gcRatingDate").value;

    const against = Number(
      document.getElementById("gcRatingAgainst").value
    );

    const rows = getRows();

    if (!opponent || !date || !rows.length) {
      status("نام حریف، تاریخ و حداقل یک بازیکن لازم است.");
      return;
    }

    if (
      !Number.isInteger(against) ||
      against < 0 ||
      against > 99
    ) {
      status("تعداد گل‌های حریف معتبر نیست.");
      return;
    }

    const records = [];

    for (const row of rows) {
      const playerId = row.querySelector(
        ".gc-rating-player"
      ).value;

      const goals = Number(
        row.querySelector(".gc-rating-goals").value
      );

      const penalties = Number(
        row.querySelector(".gc-rating-penalties").value
      );

      const assists = Number(
        row.querySelector(".gc-rating-assists").value
      );

      if (!playerId) {
        status("برای تمام ردیف‌ها بازیکن انتخاب کن.");
        return;
      }

      if (
        !Number.isInteger(goals) ||
        goals < 0 || goals > 99 ||
        !Number.isInteger(penalties) ||
        penalties < 0 || penalties > goals ||
        !Number.isInteger(assists) ||
        assists < 0 || assists > 99
      ) {
        status("اطلاعات گل، پنالتی یا پاس گل معتبر نیست.");
        return;
      }

      records.push({
        player_id: playerId,
        goals,
        penalties,
        assists
      });
    }

    if (
      new Set(records.map(item => item.player_id)).size !==
      records.length
    ) {
      status("هر بازیکن فقط یک بار باید ثبت شود.");
      return;
    }

    const teamGoals = records.reduce(
      (sum, item) => sum + item.goals, 0
    );

    // محاسبه نهایی امتیاز همه بازیکنان

    records.forEach(item => {
      item.rating = calculateRating(
        item.goals,
        item.penalties,
        item.assists,
        teamGoals,
        against
      );
    });

    status("در حال ذخیره مسابقه و امتیازهای خودکار...");

    const matchId = crypto.randomUUID();

    const eventResult = await db
      .from("goalscour_match_events")
      .insert({
        id: matchId,
        opponent,
        match_date: date,
        against_goals: against
      });

    if (eventResult.error) {
      status("خطا در ذخیره مسابقه: " + eventResult.error.message);
      return;
    }

    const performanceRows = records.map(item => ({
      ...item,
      match_id: matchId
    }));

    const performanceResult = await db
      .from("goalscour_match_performances")
      .insert(performanceRows);

    if (performanceResult.error) {
      await db.from("goalscour_match_events")
        .delete()
        .eq("id", matchId);

      status(
        "ذخیره عملکرد ناموفق بود: " +
        performanceResult.error.message
      );

      return;
    }

    document.getElementById("gcRatingOpponent").value = "";
    document.getElementById("gcRatingDate").value = today();
    document.getElementById("gcRatingAgainst").value = "0";

    document.getElementById("gcPerformanceRows").innerHTML = "";

    await loadRatings();

    addPlayerRow();

    status(
      "مسابقه و امتیازهای خودکار با موفقیت ذخیره شدند.",
      true
    );
  }

  function renderHistory() {
    const container = document.getElementById(
      "gcRatedMatchHistory"
    );

    if (!container) return;

    if (!events.length) {
      container.innerHTML =
        '<div class="empty">هنوز مسابقه‌ای ثبت نشده است.</div>';
      return;
    }

    container.innerHTML = events.map(event => {
      const rows = performances.filter(item =>
        String(item.match_id) === String(event.id)
      );

      const playerRows = rows.map(item => `
        <div class="history-detail">
          ${escapeHTML(getPlayerName(item.player_id))}
          — امتیاز خودکار:
          <b style="color:#b9f27c">
            ${Number(item.rating).toFixed(2)}
          </b>
          — گل: ${item.goals}
          — پنالتی: ${item.penalties}
          — پاس گل: ${item.assists}
        </div>
      `).join("");

      return `
        <div class="gc-rating-history">

          <strong>${escapeHTML(event.opponent)}</strong>

          <small> | ${escapeHTML(event.match_date)}</small>

          <div class="history-detail">
            گل‌های تیم: ${rows.reduce(
              (sum, item) => sum + Number(item.goals || 0), 0
            )}
            | گل‌های حریف: ${event.against_goals}
            | بازیکنان حاضر: ${rows.length}
          </div>

          ${playerRows}

          ${isAdmin ? `
            <button type="button"
              class="danger"
              data-delete-rating-match="${escapeHTML(event.id)}">
              حذف مسابقه
            </button>
          ` : ""}

        </div>
      `;
    }).join("");

    container.querySelectorAll("[data-delete-rating-match]")
      .forEach(button => {
        button.addEventListener("click", () => {
          deleteRatedMatch(button.dataset.deleteRatingMatch);
        });
      });
  }

  async function deleteRatedMatch(matchId) {
    if (!isAdmin) return;

    if (!confirm("این مسابقه و عملکردهای ثبت‌شده حذف شوند؟")) {
      return;
    }

    const result = await db
      .from("goalscour_match_events")
      .delete()
      .eq("id", matchId);

    if (result.error) {
      status("حذف مسابقه ناموفق بود: " + result.error.message);
      return;
    }

    await loadRatings();

    status("مسابقه حذف شد.", true);
  }

  async function initialize() {
    buildInterface();

    const allowed = await verifyAdmin();

    const form = document.getElementById("gcRatingAdminForm");

    if (form) {
      form.classList.toggle("gc-hidden", !allowed);
    }

    try {
      await loadRatings();
    } catch (error) {
      status("خطا در دریافت اطلاعات: " + error.message);

      document.getElementById("gcRatedMatchHistory").textContent =
        "دریافت اطلاعات ناموفق بود.";
    }

    db.auth.onAuthStateChange(async () => {
      const admin = await verifyAdmin();

      const adminForm = document.getElementById(
        "gcRatingAdminForm"
      );

      if (adminForm) {
        adminForm.classList.toggle("gc-hidden", !admin);
      }

      renderHistory();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

})();
       
