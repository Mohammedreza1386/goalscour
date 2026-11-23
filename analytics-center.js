/* =====================================================
   GOALSCOUR 4.0 — ANALYTICS CENTER
   مرکز هوش و تحلیل جامع
   Read-only: بدون تغییر اطلاعات دیتابیس
===================================================== */

(() => {
  "use strict";

  if (window.gcAnalyticsLoaded) return;
  window.gcAnalyticsLoaded = true;

  const state = {
    players: [],
    scores: [],
    matches: [],
    performances: [],
    selectedPlayer: "all",
    loading: false,
    error: ""
  };

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const num = value => {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const fmt = value =>
    num(value).toLocaleString("fa-IR");

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  const db = () => {
    if (!window.goalscourSupabase) {
      throw new Error("اتصال دیتابیس در دسترس نیست.");
    }
    return window.goalscourSupabase;
  };

  async function readTable(table) {
    const { data, error } = await db()
      .from(table)
      .select("*");

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  async function loadAnalytics() {
    if (state.loading) return;

    state.loading = true;
    state.error = "";
    render();

    try {
      const results = await Promise.all([
        readTable("goalscour_players"),
        readTable("goalscour_matches"),
        readTable("goalscour_match_performances")
      ]);

      state.players = results[0]
        .filter(p => p.is_archived !== true);

      state.matches = results[1];
      state.performances = results[2];

      if (typeof window.gcRefreshPlayerProfiles === "function") {
        await window.gcRefreshPlayerProfiles();
      }

      state.scores =
        typeof window.gcGetPlayerProfileScores === "function"
          ? window.gcGetPlayerProfileScores()
          : [];

      if (
        state.selectedPlayer !== "all" &&
        !state.players.some(
          p => String(p.id) === state.selectedPlayer
        )
      ) {
        state.selectedPlayer = "all";
      }

    } catch (error) {
      console.error("Goalscour Analytics:", error);
      state.error = error.message || "خطا در دریافت اطلاعات";
    } finally {
      state.loading = false;
      render();
    }
  }

  function playerStats(player) {
    if (
      typeof window.gcGetPlayerProfileStats === "function"
    ) {
      return window.gcGetPlayerProfileStats(player.id) || {};
    }

    return {};
  }

  function scoreFor(player) {
    const row = state.scores.find(
      item => String(item.player?.id) === String(player.id)
    );

    return num(row?.score);
  }

  function selectedPlayers() {
    if (state.selectedPlayer === "all") {
      return state.players;
    }

    return state.players.filter(
      p => String(p.id) === state.selectedPlayer
    );
  }

  function statCard(label, value, note = "") {
    return `
      <div class="ga-card">
        <span>${esc(label)}</span>
        <strong>${esc(value)}</strong>
        ${note ? `<small>${esc(note)}</small>` : ""}
      </div>
    `;
  }
    function calculateOverview() {
    const players = selectedPlayers();

    let goals = 0;
    let assists = 0;
    let appearances = 0;
    let ratingTotal = 0;
    let ratedCount = 0;

    players.forEach(player => {
      const stats = playerStats(player);

      goals += num(stats.totalGoals);
      assists += num(stats.totalAssists);
      appearances += num(stats.appearances);

      const ratings = state.performances.filter(
        row =>
          String(row.player_id) === String(player.id) &&
          row.rating != null
      );

      ratings.forEach(row => {
        ratingTotal += num(row.rating);
        ratedCount++;
      });
    });

    return {
      players: players.length,
      goals,
      assists,
      appearances,
      averageRating: ratedCount
        ? ratingTotal / ratedCount
        : 0
    };
  }

  function topPlayers(metric, limit = 5) {
    return state.players
      .map(player => ({
        player,
        stats: playerStats(player),
        score: scoreFor(player)
      }))
      .sort((a, b) => {
        if (metric === "goals") {
          return num(b.stats.totalGoals) -
                 num(a.stats.totalGoals);
        }

        if (metric === "assists") {
          return num(b.stats.totalAssists) -
                 num(a.stats.totalAssists);
        }

        if (metric === "score") {
          return b.score - a.score;
        }

        return num(b.stats.appearances) -
               num(a.stats.appearances);
      })
      .slice(0, limit);
  }

  function playerAnalysis(player) {
    const stats = playerStats(player);
    const score = scoreFor(player);

    const goals = num(stats.totalGoals);
    const assists = num(stats.totalAssists);
    const matches = num(stats.appearances);
    const averageRating = num(stats.averageRating);

    const goalsPerMatch = matches
      ? goals / matches
      : 0;

    const assistsPerMatch = matches
      ? assists / matches
      : 0;

    const strengths = [];
    const improvements = [];

    if (goalsPerMatch >= 0.8) {
      strengths.push("قدرت گل‌زنی بالا");
    } else if (matches > 0) {
      improvements.push("افزایش مشارکت در گل‌زنی");
    }

    if (assistsPerMatch >= 0.5) {
      strengths.push("توانایی خوب در بازی‌سازی");
    } else if (matches > 0) {
      improvements.push("افزایش مشارکت در موقعیت‌سازی");
    }

    if (averageRating >= 8) {
      strengths.push("میانگین امتیاز مسابقات بالا");
    } else if (averageRating > 0 && averageRating < 6) {
      improvements.push("بهبود عملکرد در مسابقات");
    }

    if (score >= 75) {
      strengths.push("امتیاز کلی عملکرد بالا");
    }

    if (matches < 5) {
      improvements.push("نیاز به مسابقات بیشتر برای ارزیابی دقیق");
    }

    return {
      score,
      goals,
      assists,
      matches,
      averageRating,
      goalsPerMatch,
      assistsPerMatch,
      strengths,
      improvements
    };
  }

  function overallInsights() {
    const players = state.players;

    if (!players.length) {
      return ["هنوز اطلاعات کافی برای تحلیل وجود ندارد."];
    }

    const bestScorer = topPlayers("goals", 1)[0];
    const bestPlaymaker = topPlayers("assists", 1)[0];
    const bestOverall = topPlayers("score", 1)[0];

    const insights = [];

    if (bestScorer) {
      insights.push(
        `برترین گلزن فعلی: ${bestScorer.player.name}`
      );
    }

    if (bestPlaymaker) {
      insights.push(
        `برترین پاسور فعلی: ${bestPlaymaker.player.name}`
      );
    }

    if (bestOverall) {
      insights.push(
        `بالاترین امتیاز کلی: ${bestOverall.player.name}`
      );
    }

    return insights;
  }
    function render() {
    const section = $("#gc-analytics-section");
    if (!section) return;

    const overview = calculateOverview();
    const players = selectedPlayers();
    const selected = players.length === 1 ? players[0] : null;
    const analysis = selected ? playerAnalysis(selected) : null;

    const leaders = [
      {
        title: "برترین گلزنان",
        items: topPlayers("goals"),
        value: p => num(p.stats.totalGoals)
      },
      {
        title: "برترین پاسورها",
        items: topPlayers("assists"),
        value: p => num(p.stats.totalAssists)
      },
      {
        title: "بالاترین امتیاز کلی",
        items: topPlayers("score"),
        value: p => p.score.toFixed(1)
      }
    ];

    const leaderHtml = leaders.map(group => `
      <div class="ga-panel">
        <h3>${group.title}</h3>
        ${group.items.length
          ? group.items.map((item, index) => `
            <div class="ga-leader">
              <span class="ga-rank">${fmt(index + 1)}</span>
              <span class="ga-leader-name">
                ${esc(item.player.name || item.player.full_name || "بازیکن")}
              </span>
              <strong>${esc(group.value(item))}</strong>
            </div>
          `).join("")
          : `<p class="ga-muted">اطلاعاتی موجود نیست.</p>`
        }
      </div>
    `).join("");

    const insights = overallInsights();

    const playerReport = analysis ? `
      <div class="ga-panel">
        <h3>گزارش اختصاصی بازیکن</h3>

        <div class="ga-report-grid">
          ${statCard("مجموع گل", fmt(analysis.goals))}
          ${statCard("مجموع پاس گل", fmt(analysis.assists))}
          ${statCard("تعداد مسابقات", fmt(analysis.matches))}
          ${statCard(
            "میانگین امتیاز",
            analysis.averageRating
              ? analysis.averageRating.toFixed(1)
              : "نامشخص"
          )}
          ${statCard("گل در هر مسابقه", analysis.goalsPerMatch.toFixed(2))}
          ${statCard("پاس گل در هر مسابقه", analysis.assistsPerMatch.toFixed(2))}
        </div>

        <div class="ga-analysis-columns">
          <div>
            <h4>نقاط قوت</h4>
            ${analysis.strengths.length
              ? analysis.strengths.map(x => `
                <p class="ga-positive">✓ ${esc(x)}</p>
              `).join("")
              : `<p class="ga-muted">داده کافی برای تشخیص وجود ندارد.</p>`
            }
          </div>

          <div>
            <h4>زمینه‌های قابل بهبود</h4>
            ${analysis.improvements.length
              ? analysis.improvements.map(x => `
                <p class="ga-improve">• ${esc(x)}</p>
              `).join("")
              : `<p class="ga-muted">مورد مشخصی شناسایی نشد.</p>`
            }
          </div>
        </div>

        <p class="ga-muted">
          امتیاز کلی بازیکن:
          <strong>${analysis.score.toFixed(1)} از ۱۰۰</strong>
        </p>
      </div>
    ` : `
      <div class="ga-panel">
        <h3>گزارش اختصاصی بازیکن</h3>
        <p class="ga-muted">
          برای مشاهده گزارش اختصاصی، یک بازیکن را انتخاب کن.
        </p>
      </div>
    `;

    const recentMatches = state.matches
      .slice()
      .sort((a, b) =>
        String(b.match_date || "").localeCompare(
          String(a.match_date || "")
        )
      )
      .slice(0, 5);

    section.innerHTML = `
      <div class="ga-container">

        <div class="ga-header">
          <div>
            <span class="ga-eyebrow">GOALSCOUR 4.0</span>
            <h2>مرکز هوش و تحلیل</h2>
            <p>تحلیل آماری بر پایه اطلاعات واقعی گل‌اسکور</p>
          </div>

          <button class="ga-refresh" id="ga-refresh">
            ↻ بروزرسانی اطلاعات
          </button>
        </div>

        <div class="ga-panel ga-filter">
          <label for="ga-player-select">انتخاب بازیکن</label>
          <select id="ga-player-select">
            <option value="all">تمام بازیکنان</option>
            ${state.players.map(p => `
              <option
                value="${esc(p.id)}"
                ${state.selectedPlayer === String(p.id) ? "selected" : ""}
              >
                ${esc(p.name || p.full_name || "بازیکن")}
              </option>
            `).join("")}
          </select>
        </div>

        ${state.error ? `
          <div class="ga-error">
            ${esc(state.error)}
          </div>
        ` : ""}

        ${state.loading ? `
          <div class="ga-panel ga-loading">
            در حال دریافت و تحلیل اطلاعات...
          </div>
        ` : ""}

        <div class="ga-stats-grid">
          ${statCard("بازیکنان فعال", fmt(overview.players))}
          ${statCard("مجموع گل‌ها", fmt(overview.goals))}
          ${statCard("مجموع پاس گل‌ها", fmt(overview.assists))}
          ${statCard("حضور در مسابقات", fmt(overview.appearances))}
          ${statCard(
            "میانگین امتیاز مسابقات",
            overview.averageRating
              ? overview.averageRating.toFixed(1)
              : "نامشخص"
          )}
        </div>

        <div class="ga-section-title">
          <h3>رتبه‌بندی و برترین‌ها</h3>
        </div>

        <div class="ga-leaders-grid">
          ${leaderHtml}
        </div>

        <div class="ga-section-title">
          <h3>تحلیل عملکرد</h3>
        </div>

        ${playerReport}

        <div class="ga-panel">
          <h3>بینش‌های کلی گل‌اسکور</h3>
          ${insights.map(item => `
            <p class="ga-insight">✦ ${esc(item)}</p>
          `).join("")}
        </div>

        <div class="ga-panel">
          <h3>آخرین مسابقات ثبت‌شده</h3>

          ${recentMatches.length
            ? recentMatches.map(match => {
                const matchName =
                  match.title ||
                  match.name ||
                  match.opponent ||
                  "مسابقه ثبت‌شده";

                return `
                  <div class="ga-match-row">
                    <span>${esc(matchName)}</span>
                    <small>
                      ${esc(match.match_date || "تاریخ نامشخص")}
                    </small>
                  </div>
                `;
              }).join("")
            : `<p class="ga-muted">هنوز مسابقه‌ای ثبت نشده است.</p>`
          }
        </div>

        <p class="ga-disclaimer">
          تحلیل‌ها آماری و مبتنی بر داده‌های ثبت‌شده هستند.
          نتیجه‌گیری‌ها با توجه به کامل بودن اطلاعات قابل تغییرند.
        </p>

      </div>
    `;

    const refreshButton = $("#ga-refresh", section);
    if (refreshButton) {
      refreshButton.addEventListener("click", loadAnalytics);
    }

    const playerSelect = $("#ga-player-select", section);
    if (playerSelect) {
      playerSelect.addEventListener("change", event => {
        state.selectedPlayer = event.target.value;
        render();
      });
    }
  }

  function addAnalyticsStyles() {
    if ($("#gc-analytics-styles")) return;

    const style = document.createElement("style");
    style.id = "gc-analytics-styles";

    style.textContent = `
      #gc-analytics-section {
        direction: rtl;
        width: 100%;
      }

      .ga-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 16px;
        color: var(--text-color, #f5f5f5);
      }

      .ga-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
        margin-bottom: 22px;
      }

      .ga-header h2 {
        margin: 8px 0;
        font-size: 25px;
      }

      .ga-header p,
      .ga-muted {
        color: #999;
        font-size: 13px;
      }

      .ga-eyebrow {
        color: #b9f27c;
        font-size: 11px;
        letter-spacing: 2px;
      }

      .ga-panel {
        background: #151a17;
        border: 1px solid #29332b;
        border-radius: 15px;
        padding: 17px;
        margin-bottom: 16px;
      }

      .ga-panel h3 {
        margin: 0 0 16px;
        font-size: 16px;
      }

      .ga-stats-grid,
      .ga-report-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
        gap: 10px;
        margin: 16px 0;
      }

      .ga-card {
        background: #1d251f;
        border: 1px solid #303c32;
        border-radius: 12px;
        padding: 15px 12px;
        min-width: 0;
      }

      .ga-card span,
      .ga-card small {
        display: block;
        color: #a4aaa4;
        font-size: 12px;
      }

      .ga-card strong {
        display: block;
        color: #b9f27c;
        font-size: 22px;
        margin: 9px 0;
        overflow-wrap: anywhere;
      }

      .ga-leaders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }

      .ga-leader,
      .ga-match-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 11px 0;
        border-bottom: 1px solid #29332b;
      }

      .ga-leader:last-child,
      .ga-match-row:last-child {
        border-bottom: 0;
      }

      .ga-rank {
        color: #b9f27c;
        font-weight: bold;
      }

      .ga-leader-name {
        flex: 1;
        font-size: 13px;
      }

      .ga-leader strong {
        color: #b9f27c;
      }

      .ga-filter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .ga-filter select {
        min-width: 180px;
        max-width: 100%;
        padding: 10px;
        color: white;
        background: #202820;
        border: 1px solid #465344;
        border-radius: 9px;
      }

      .ga-refresh {
        background: #b9f27c;
        color: #10150e;
        border: 0;
        border-radius: 9px;
        padding: 11px 15px;
        font-weight: bold;
        cursor: pointer;
      }

      .ga-analysis-columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 15px;
        margin-top: 18px;
      }

      .ga-positive {
        color: #b9f27c;
        font-size: 13px;
      }

      .ga-improve {
        color: #e6c47b;
        font-size: 13px;
      }

      .ga-insight {
        padding: 8px 0;
        border-bottom: 1px solid #29332b;
        font-size: 13px;
      }

      .ga-match-row small {
        color: #999;
      }

      .ga-error {
        background: #3a2020;
        color: #ffb6b6;
        padding: 13px;
        border-radius: 10px;
        margin: 12px 0;
      }

      .ga-loading {
        color: #b9f27c;
        text-align: center;
      }

      .ga-disclaimer {
        color: #888;
        font-size: 11px;
        text-align: center;
        margin: 20px 0;
      }

      .ga-section-title {
        margin: 24px 0 12px;
      }

      @media (max-width: 520px) {
        .ga-header h2 {
          font-size: 21px;
        }

        .ga-refresh {
          width: 100%;
        }

        .ga-container {
          padding: 10px;
        }
      }
    `;

    document.head.appendChild(style);
  }
    function initAnalyticsCenter() {
    addAnalyticsStyles();

    const nav = $("nav");
    const main = $("main");

    if (!nav || !main) {
      console.error("Goalscour Analytics: منو یا بخش اصلی پیدا نشد.");
      return;
    }

    let button = $('[data-tab="gcAnalytics"]', nav);

    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.dataset.tab = "gcAnalytics";
      button.textContent = "🧠 مرکز تحلیل";
      nav.appendChild(button);
    }

    let section = $("#gc-analytics-section");

    if (!section) {
      section = document.createElement("section");
      section.id = "gc-analytics-section";
      section.className = "section";
      main.appendChild(section);
    }

    button.addEventListener("click", () => {
      document.querySelectorAll(".section").forEach(item => {
        item.classList.remove("active");
      });

      document.querySelectorAll("nav button").forEach(item => {
        item.classList.remove("active");
      });

      section.classList.add("active");
      button.classList.add("active");

      loadAnalytics();
    });

    document.querySelectorAll("nav button").forEach(item => {
      if (item === button) return;

      item.addEventListener("click", () => {
        section.classList.remove("active");
        button.classList.remove("active");
      });
    });

    render();
  }

  window.gcRefreshAnalytics = loadAnalytics;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initAnalyticsCenter,
      { once: true }
    );
  } else {
    initAnalyticsCenter();
  }

})();
