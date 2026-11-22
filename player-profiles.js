/* =========================================================
   GOALSCOUR 4.0 — PLAYER PROFILES
   Read-only profile module. Does not modify Supabase data.
   Load after Supabase CDN and the main Goalscour scripts.
   ========================================================= */
(() => {
  "use strict";

  if (window.gcPlayerProfilesLoaded) return;
  window.gcPlayerProfilesLoaded = true;

  const SUPABASE_URL = "https://zusbebjskchgehdjvpsm.supabase.co";
  const SUPABASE_KEY = "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

  const state = {
    db: null,
    players: [],
    matches: [],
    unofficial: [],
    performances: [],
    events: [],
    awards: [],
    awardTypes: [],
    dribbles: [],
    scores: [],
    selectedPlayerId: null,
    activeTab: "overview",
    chartRange: "all",
    loading: false
  };

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const n = value => {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const fmt = value => n(value).toLocaleString("fa-IR");
  const avg = values => values.length
    ? values.reduce((sum, value) => sum + n(value), 0) / values.length
    : 0;
  const playerId = player => String(player?.id ?? "");
  const findPlayer = id => state.players.find(player => playerId(player) === String(id));
  const dateValue = value => value ? new Date(value).getTime() : 0;

  function getClient() {
    if (state.db) return state.db;
    const library = window.supabase;
    if (!library || typeof library.createClient !== "function") {
      throw new Error("کتابخانه Supabase در صفحه بارگذاری نشده است.");
    }
    state.db = library.createClient(SUPABASE_URL, SUPABASE_KEY);
    return state.db;
  }

  function normalizePlayer(row) {
    return {
      ...row,
      id: String(row.id),
      name: row.name || row.full_name || row.display_name || "بازیکن بدون نام",
      age: row.age == null ? null : n(row.age),
      photo: row.photo || row.avatar_url || row.image_url || "",
      number: row.number ?? row.jersey_number ?? null
    };
  }

  async function readTable(table) {
    const { data, error } = await getClient().from(table).select("*");
    if (error) throw new Error(`${table}: ${error.message}`);
    return Array.isArray(data) ? data : [];
  }

  async function loadData() {
    if (state.loading) return;
    state.loading = true;
    try {
      const tables = [
        "goalscour_players",
        "goalscour_matches",
        "goalscour_unofficial",
        "goalscour_match_performances",
        "goalscour_match_events",
        "goalscour_awards",
        "goalscour_award_types",
        "goalscour_dribbles"
      ];
      const data = await Promise.all(tables.map(readTable));
      state.players = data[0].map(normalizePlayer);
      state.matches = data[1];
      state.unofficial = data[2];
      state.performances = data[3];
      state.events = data[4];
      state.awards = data[5];
      state.awardTypes = data[6];
      state.dribbles = data[7];

      if (!state.selectedPlayerId && state.players.length) {
        state.selectedPlayerId = playerId(state.players[0]);
      }
      state.scores = calculateOverallScores();
      render();
    } catch (error) {
      console.error("Goalscour player profiles:", error);
      const target = $("#ppRoot");
      if (target) {
        target.innerHTML = `<div class="pp-empty pp-error">
          دریافت اطلاعات پروفایل‌ها ناموفق بود.<br>
          <small>${esc(error.message || error)}</small>
          <button type="button" id="ppRetry">تلاش دوباره</button>
        </div>`;
        $("#ppRetry", target)?.addEventListener("click", loadData);
      }
    } finally {
      state.loading = false;
    }
  }

  function unifiedStats(id) {
    if (typeof window.gcGetUnifiedStats === "function") {
      try {
        const result = window.gcGetUnifiedStats(id);
        if (result && typeof result === "object") return result;
      } catch (error) {
        console.warn("Unified stats unavailable:", error);
      }
    }
    return null;
  }

  function statsFor(player) {
    const id = playerId(player);
    const unified = unifiedStats(id);
    if (unified) {
      return {
        officialGoals: n(unified.officialGoals),
        unofficialGoals: n(unified.unofficialGoals),
        totalGoals: n(unified.totalGoals ?? unified.goals),
        totalPenalties: n(unified.totalPenalties),
        nonPenaltyGoals: n(unified.nonPenaltyGoals),
        officialAssists: n(unified.officialAssists),
        unofficialAssists: n(unified.unofficialAssists),
        totalAssists: n(unified.totalAssists ?? unified.assists),
        appearances: n(unified.appearances),
        totalRating: n(unified.totalRating),
        averageRating: n(unified.averageRating),
        goalsPerMatch: n(unified.goalsPerMatch),
        assistsPerMatch: n(unified.assistsPerMatch),
        rightFootGoals: n(unified.totalRightFootGoals ?? unified.rightFootGoals),
        leftFootGoals: n(unified.totalLeftFootGoals ?? unified.leftFootGoals),
        headedGoals: n(unified.totalHeadedGoals ?? unified.headedGoals),
        hatTricks: n(unified.hatTricks),
        perfectHatTricks: n(unified.perfectHatTricks),
        braces: n(unified.braces),
        goalContributions: n(unified.goalContributions)
      };
    }

    // Fallback for pages where the shared statistics engine is unavailable.
    const oldMatches = state.matches.filter(row =>
      String(row.scorer_id ?? row.scorerId) === id
    );
    const oldAssists = state.matches.filter(row =>
      String(row.assister_id ?? row.assisterId) === id
    );
    const unofficial = state.unofficial.filter(row =>
      String(row.player_id ?? row.playerId) === id
    );
    const rated = state.performances.filter(row =>
      String(row.player_id) === id
    );
    const officialGoals = oldMatches.reduce((sum, row) => sum + n(row.goals), 0)
      + rated.reduce((sum, row) => sum + n(row.goals), 0);
    const unofficialGoals = unofficial.reduce((sum, row) => sum + n(row.goals), 0);
    const officialAssists = oldAssists.reduce((sum, row) => sum + n(row.assists), 0)
      + rated.reduce((sum, row) => sum + n(row.assists), 0);
    const unofficialAssists = unofficial.reduce((sum, row) => sum + n(row.assists), 0);
    const totalGoals = officialGoals + unofficialGoals;
    const totalAssists = officialAssists + unofficialAssists;
    const appearances = new Set([
      ...rated.map(row => `rated:${row.match_id}`),
      ...state.matches.filter(row => {
        const participants = row.participant_ids ?? row.participantIds ?? [];
        return Array.isArray(participants) && participants.map(String).includes(id);
      }).map(row => `match:${row.id}`)
    ]).size;
    const totalRating = rated.reduce((sum, row) => sum + n(row.rating), 0);
    return {
      officialGoals, unofficialGoals, totalGoals,
      totalPenalties: 0, nonPenaltyGoals: totalGoals,
      officialAssists, unofficialAssists, totalAssists,
      appearances, totalRating,
      averageRating: rated.length ? totalRating / rated.length : 0,
      goalsPerMatch: appearances ? totalGoals / appearances : 0,
      assistsPerMatch: appearances ? totalAssists / appearances : 0,
      rightFootGoals: 0, leftFootGoals: 0, headedGoals: 0,
      hatTricks: rated.filter(row => n(row.goals) >= 3).length,
      perfectHatTricks: 0,
      braces: rated.filter(row => n(row.goals) === 2).length,
      goalContributions: totalGoals + totalAssists
    };
  }

  function dribbleFor(id) {
    const row = state.dribbles.find(item => String(item.player_id) === String(id)) || {};
    const successful = n(row.successful);
    const unsuccessful = n(row.unsuccessful);
    const total = successful + unsuccessful;
    return { successful, unsuccessful, total, rate: total ? successful / total : 0 };
  }

  function awardsFor(id) {
    return state.awards.filter(row =>
      String(row.winner_player_id) === String(id) &&
      row.status === "awarded"
    );
  }

  function awardPointsFor(id) {
    return awardsFor(id).reduce((sum, row) => sum + n(row.award_points), 0);
  }

  function scale(value, maximum) {
    return maximum > 0 ? Math.max(0, Math.min(100, value / maximum * 100)) : 0;
  }

  function calculateOverallScores() {
    const rows = state.players.map(player => ({
      player,
      stats: statsFor(player),
      dribble: dribbleFor(playerId(player)),
      awardPoints: awardPointsFor(playerId(player))
    }));
    const maxGoals = Math.max(0.01, ...rows.map(row => row.stats.goalsPerMatch));
    const maxAssists = Math.max(0.01, ...rows.map(row => row.stats.assistsPerMatch));
    const maxDribbles = Math.max(0.01, ...rows.map(row => row.dribble.rate));
    const maxImpact = Math.max(0.01, ...rows.map(row =>
      row.stats.goalContributions / Math.max(1, row.stats.appearances)
    ));
    const maxAwards = Math.max(1, ...rows.map(row => row.awardPoints));

    return rows.map(row => {
      const s = row.stats;
      const categories = {
        scoring: scale(s.goalsPerMatch, maxGoals),
        playmaking: scale(s.assistsPerMatch, maxAssists),
        dribbling: scale(row.dribble.rate, maxDribbles),
        matchPerformance: Math.min(100, s.averageRating * 10),
        consistency: Math.min(100, s.appearances * 5),
        impact: scale(s.goalContributions / Math.max(1, s.appearances), maxImpact),
        honors: scale(row.awardPoints, maxAwards)
      };
      const raw =
        categories.scoring * 0.25 +
        categories.playmaking * 0.20 +
        categories.dribbling * 0.15 +
        categories.matchPerformance * 0.15 +
        categories.consistency * 0.10 +
        categories.impact * 0.10 +
        categories.honors * 0.05;
      const sampleFairness = Math.min(1, Math.sqrt(s.appearances / 10));
      return {
        ...row,
        categories,
        score: Math.round(raw * sampleFairness * 10) / 10
      };
    }).sort((a, b) => b.score - a.score);
  }

  function levelFor(score) {
    if (score >= 90) return "افسانه‌ای";
    if (score >= 80) return "جهانی";
    if (score >= 70) return "حرفه‌ای";
    if (score >= 55) return "ستاره";
    if (score >= 40) return "پیشرفته";
    if (score >= 20) return "در حال پیشرفت";
    return "تازه‌کار";
  }

  function scoreFor(id) {
    return state.scores.find(row => playerId(row.player) === String(id)) || null;
  }

  function createInterface() {
    const main = $("main");
    if (!main) throw new Error("بخش اصلی سایت پیدا نشد.");
    let section = $("#gcPlayerProfiles");
    if (!section) {
      section = document.createElement("section");
      section.id = "gcPlayerProfiles";
      section.className = "section";
      section.innerHTML = `
        <h2>پروفایل اختصاصی بازیکنان</h2>
        <div id="ppRoot"><div class="pp-empty">در حال بارگذاری اطلاعات...</div></div>`;
      main.appendChild(section);
    }

    const nav = $("main nav");
    if (nav && !nav.querySelector('[data-profile-navigation="true"]')) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.profileNavigation = "true";
      button.textContent = "پروفایل بازیکنان";
      nav.appendChild(button);
      button.addEventListener("click", () => activateSection(section, button));
    }
    return section;
  }

  function activateSection(section, button) {
    document.querySelectorAll("main nav button").forEach(item => item.classList.remove("active"));
    document.querySelectorAll("main .section").forEach(item => item.classList.remove("active"));
    button?.classList.add("active");
    section.classList.add("active");
    render();
  }

  function injectStyles() {
    if ($("#gcPlayerProfilesStyles")) return;
    const style = document.createElement("style");
    style.id = "gcPlayerProfilesStyles";
    style.textContent = `
      #gcPlayerProfiles{color:#f3f6ef}
      #gcPlayerProfiles .pp-toolbar{display:flex;gap:9px;flex-wrap:wrap;margin:12px 0}
      #gcPlayerProfiles .pp-toolbar select,#gcPlayerProfiles .pp-toolbar input{flex:1;min-width:150px;background:#0b110c;color:#f3f6ef;border:1px solid #273329;border-radius:10px;padding:11px}
      #gcPlayerProfiles .pp-panel,#gcPlayerProfiles .pp-card{background:#111812;border:1px solid #273329;border-radius:16px;padding:14px;margin:10px 0;min-width:0}
      #gcPlayerProfiles .pp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      #gcPlayerProfiles .pp-stat{background:#0b130c;border:1px solid #263529;border-radius:12px;padding:12px;min-width:0}
      #gcPlayerProfiles .pp-stat span{display:block;color:#89958a;font-size:11px}
      #gcPlayerProfiles .pp-stat strong{display:block;color:#b9f27c;font-size:21px;margin-top:7px;overflow-wrap:anywhere}
      #gcPlayerProfiles .pp-header{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:linear-gradient(135deg,#17251a,#0b110c);border:1px solid #38513a;border-radius:18px;padding:16px}
      #gcPlayerProfiles .pp-avatar{width:82px;height:82px;border-radius:50%;object-fit:cover;background:#263529;border:2px solid #b9f27c}
      #gcPlayerProfiles .pp-header-info{flex:1;min-width:150px}
      #gcPlayerProfiles .pp-header-info h3{margin:0 0 7px;font-size:18px}
      #gcPlayerProfiles .pp-muted{color:#89958a;font-size:11px;line-height:1.9}
      #gcPlayerProfiles .pp-tabs{display:flex;gap:7px;overflow:auto;padding:10px 0}
      #gcPlayerProfiles .pp-tabs button,#gcPlayerProfiles .pp-action{white-space:nowrap;border:1px solid #344436;border-radius:10px;background:#172019;color:#b9f27c;padding:9px 12px}
      #gcPlayerProfiles .pp-tabs button.active{background:#b9f27c;color:#10170d;font-weight:bold}
      #gcPlayerProfiles .pp-bar{height:8px;background:#263329;border-radius:20px;overflow:hidden;margin-top:8px}
      #gcPlayerProfiles .pp-bar i{display:block;height:100%;background:#b9f27c;border-radius:20px}
      #gcPlayerProfiles .pp-list{display:grid;gap:8px}
      #gcPlayerProfiles .pp-row{display:flex;justify-content:space-between;gap:12px;padding:10px;background:#0c130d;border:1px solid #263329;border-radius:10px;font-size:12px}
      #gcPlayerProfiles .pp-row b{color:#b9f27c}
      #gcPlayerProfiles .pp-empty{text-align:center;padding:25px;color:#89958a;background:#111812;border:1px solid #273329;border-radius:14px}
      #gcPlayerProfiles .pp-error{color:#ffaaaa}
      #gcPlayerProfiles .pp-match{padding:12px;border:1px solid #273329;background:#0c130d;border-radius:12px;margin:8px 0}
      #gcPlayerProfiles .pp-chart{width:100%;height:190px;display:block;background:#0b130c;border-radius:12px}
      #gcPlayerProfiles .pp-select{background:#0b110c;color:#fff;border:1px solid #344436;border-radius:10px;padding:10px;width:100%}
      #gcPlayerProfiles .pp-award{border:1px solid #3b4b32;background:#152018;border-radius:12px;padding:12px}
      @media(min-width:650px){#gcPlayerProfiles .pp-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function selectedPlayer() {
    return findPlayer(state.selectedPlayerId) || state.players[0] || null;
  }

  function playerSelector() {
    return `<div class="pp-toolbar">
      <select id="ppPlayerSelect" aria-label="انتخاب بازیکن">
        ${state.players.map(player => `<option value="${esc(playerId(player))}" ${playerId(player) === state.selectedPlayerId ? "selected" : ""}>${esc(player.name)}</option>`).join("")}
      </select>
      <button type="button" class="pp-action" id="ppRefresh">به‌روزرسانی</button>
    </div>`;
  }

  function headerHtml(player) {
    const stats = statsFor(player);
    const score = scoreFor(playerId(player));
    const photo = player.photo
      ? `<img class="pp-avatar" src="${esc(player.photo)}" alt="${esc(player.name)}">`
      : `<div class="pp-avatar" aria-label="بدون عکس"></div>`;
    const awards = awardsFor(playerId(player)).length;
    const details = [
      player.age ? `سن: ${fmt(player.age)}` : "",
      player.number != null && player.number !== "" ? `شماره: ${esc(player.number)}` : "",
      score ? `سطح: ${levelFor(score.score)}` : ""
    ].filter(Boolean).join(" • ");
    return `<div class="pp-header">
      ${photo}
      <div class="pp-header-info">
        <h3>${esc(player.name)}</h3>
        <div class="pp-muted">${details || "پروفایل بازیکن"}</div>
        <div class="pp-muted">رتبه رقابتی: ${score ? fmt(state.scores.indexOf(score) + 1) : "—"} • افتخارات: ${fmt(awards)}</div>
      </div>
      <div class="pp-stat"><span>امتیاز کلی</span><strong>${score ? fmt(score.score) : "۰"}/۱۰۰</strong></div>
    </div>`;
  }

  function statCard(label, value) {
    return `<div class="pp-stat"><span>${label}</span><strong>${fmt(value)}</strong></div>`;
  }

  function overviewHtml(player) {
    const s = statsFor(player);
    const score = scoreFor(playerId(player));
    return `<div class="pp-grid">
      ${statCard("مجموع گل", s.totalGoals)}
      ${statCard("گل رسمی", s.officialGoals)}
      ${statCard("گل غیررسمی", s.unofficialGoals)}
      ${statCard("مجموع پاس گل", s.totalAssists)}
      ${statCard("تعداد بازی", s.appearances)}
      ${statCard("میانگین امتیاز", s.averageRating.toFixed(1))}
      ${statCard("گل بدون پنالتی", s.nonPenaltyGoals)}
      ${statCard("مشارکت گل (G+A)", s.goalContributions)}
    </div>
    <div class="pp-panel"><h3>شاخص‌های امتیازدهی</h3>
      ${score ? Object.entries({
        "گلزنی":score.categories.scoring,"بازی‌سازی":score.categories.playmaking,
        "دریبل":score.categories.dribbling,"عملکرد مسابقه":score.categories.matchPerformance,
        "ثبات":score.categories.consistency,"تأثیرگذاری":score.categories.impact,
        "افتخارات":score.categories.honors
      }).map(([label,value]) => `<div class="pp-row"><span>${label}</span><b>${fmt(value)}/۱۰۰</b></div><div class="pp-bar"><i style="width:${value}%"></i></div>`).join("") : "اطلاعاتی موجود نیست"}
    </div>`;
  }

  function statsHtml(player) {
    const s = statsFor(player);
    const d = dribbleFor(playerId(player));
    const items = [
      ["گل رسمی",s.officialGoals],["گل غیررسمی",s.unofficialGoals],
      ["مجموع گل",s.totalGoals],["پنالتی",s.totalPenalties],
      ["گل بدون پنالتی",s.nonPenaltyGoals],["پاس گل رسمی",s.officialAssists],
      ["پاس گل غیررسمی",s.unofficialAssists],["مجموع پاس گل",s.totalAssists],
      ["گل با پای راست",s.rightFootGoals],["گل با پای چپ",s.leftFootGoals],
      ["گل با سر",s.headedGoals],["هت‌تریک",s.hatTricks],
      ["هت‌تریک کامل",s.perfectHatTricks],["دبل",s.braces],
      ["دریبل موفق",d.successful],["دریبل ناموفق",d.unsuccessful],
      ["میانگین گل در بازی",s.goalsPerMatch.toFixed(2)],
      ["میانگین پاس گل در بازی",s.assistsPerMatch.toFixed(2)]
    ];
    return `<div class="pp-grid">${items.map(([label,value]) => statCard(label,value)).join("")}</div>`;
  }

  function matchRows(player) {
    const id = playerId(player);
    const rows = [];
    state.performances.filter(row => String(row.player_id) === id).forEach(row => {
      const match = state.events.find(event => String(event.id) === String(row.match_id))
        || state.matches.find(item => String(item.id) === String(row.match_id));
      rows.push({
        date: match?.match_date || row.created_at,
        opponent: match?.opponent || "مسابقه ثبت‌شده",
        goals: n(row.goals), assists: n(row.assists),
        rating: n(row.rating), kind: "عملکرد مسابقه"
      });
    });
    state.unofficial.filter(row => String(row.player_id ?? row.playerId) === id).forEach(row => {
      rows.push({
        date: row.record_date || row.recordDate,
        opponent: row.opponent || row.note || "ثبت آمار غیررسمی",
        goals: n(row.goals), assists: n(row.assists),
        rating: 0, kind: "غیررسمی"
      });
    });
    if (!rows.length) {
      state.matches.filter(row => String(row.scorer_id ?? row.scorerId) === id).forEach(row => {
        rows.push({
          date: row.match_date || row.matchDate,
          opponent: row.opponent || "مسابقه رسمی",
          goals: n(row.goals), assists: 0, rating: 0, kind: "رسمی"
        });
      });
    }
    const seen = new Set();
    return rows.filter(row => {
      const key = [row.date, row.opponent, row.kind, row.goals, row.assists].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a,b) => dateValue(b.date) - dateValue(a.date));
  }

  function matchesHtml(player) {
    const rows = matchRows(player);
    if (!rows.length) return `<div class="pp-empty">هنوز مسابقه‌ای برای این بازیکن ثبت نشده است.</div>`;
    return rows.map(row => `<div class="pp-match">
      <div class="pp-row"><strong>${esc(row.opponent)}</strong><span>${esc(row.kind)}</span></div>
      <div class="pp-muted">تاریخ: ${esc(row.date || "نامشخص")} • گل: ${fmt(row.goals)} • پاس گل: ${fmt(row.assists)}${row.rating ? ` • امتیاز: ${fmt(row.rating)}` : ""}</div>
    </div>`).join("");
  }

  function honorsHtml(player) {
    const rows = awardsFor(playerId(player));
    if (!rows.length) return `<div class="pp-empty">هنوز جایزه‌ای برای این بازیکن ثبت نشده است.</div>`;
    return `<div class="pp-grid">${rows.map(row => {
      const type = state.awardTypes.find(item => String(item.id) === String(row.award_type));
      return `<div class="pp-award">
        <div style="font-size:25px">${esc(row.award_icon || type?.icon || "🏆")}</div>
        <strong>${esc(row.award_name || type?.title || "جایزه گل‌اسکور")}</strong>
        <div class="pp-muted">${esc(row.season || "")}</div>
        <div class="pp-muted">${esc(row.award_description || type?.description || "")}</div>
        <b style="color:#b9f27c">${fmt(row.award_points)} امتیاز افتخار</b>
      </div>`;
    }).join("")}</div>`;
  }

  function recordsHtml(player) {
    const s = statsFor(player);
    const records = [
      ["بیشترین گل در یک مسابقه", Math.max(0, ...matchRows(player).map(row => row.goals))],
      ["تعداد هت‌تریک", s.hatTricks],
      ["تعداد دبل", s.braces],
      ["مجموع افتخارات", awardsFor(playerId(player)).length],
      ["دریبل موفق", dribbleFor(playerId(player)).successful]
    ];
    return `<div class="pp-list">${records.map(([label,value]) => `<div class="pp-row"><span>${label}</span><b>${fmt(value)}</b></div>`).join("")}</div>`;
  }

  function performanceHtml(player) {
    const s = statsFor(player);
    const score = scoreFor(playerId(player));
    const cats = score?.categories || {};
    return `<div class="pp-panel">
      <h3>تحلیل عملکرد</h3>
      <div class="pp-grid">
        ${statCard("میانگین امتیاز مسابقه",s.averageRating.toFixed(1))}
        ${statCard("گل در هر بازی",s.goalsPerMatch.toFixed(2))}
        ${statCard("پاس گل در هر بازی",s.assistsPerMatch.toFixed(2))}
        ${statCard("مجموع مشارکت گل",s.goalContributions)}
      </div>
      <p class="pp-muted">امتیاز کلی با وزن‌دهی به گلزنی، بازی‌سازی، دریبل، عملکرد مسابقه، ثبات، تأثیرگذاری و افتخارات محاسبه می‌شود. برای رعایت عدالت، تعداد بازی‌ها نیز در امتیاز نهایی اثر دارد.</p>
      ${Object.entries(cats).map(([key,value]) => `<div class="pp-row"><span>${esc(key)}</span><b>${fmt(value)}/۱۰۰</b></div><div class="pp-bar"><i style="width:${value}%"></i></div>`).join("")}
    </div>`;
  }

  function compareHtml(player) {
    const others = state.scores.filter(row => playerId(row.player) !== playerId(player)).slice(0,5);
    if (!others.length) return `<div class="pp-empty">برای مقایسه، حداقل دو بازیکن لازم است.</div>`;
    const own = scoreFor(playerId(player));
    return `<div class="pp-list">
      <div class="pp-row"><strong>${esc(player.name)}</strong><b>${fmt(own?.score || 0)}</b></div>
      ${others.map(row => `<div class="pp-row"><span>${esc(row.player.name)}</span><b>${fmt(row.score)}</b></div>`).join("")}
    </div>
    <div class="pp-muted">مقایسه بر اساس امتیاز کلی محاسبه‌شده در گل‌اسکور ۴.۰ است.</div>`;
  }

  function chartHtml(player) {
    const rows = matchRows(player).slice(0,12).reverse();
    if (!rows.length) return `<div class="pp-empty">برای رسم نمودار، ابتدا آمار مسابقه ثبت شود.</div>`;
    const width = 640, height = 190, pad = 28;
    const max = Math.max(1, ...rows.map(row => row.goals + row.assists));
    const points = rows.map((row,index) => {
      const x = pad + index * ((width - pad*2) / Math.max(1, rows.length - 1));
      const y = height - pad - ((row.goals + row.assists) / max) * (height - pad*2);
      return `${x},${y}`;
    }).join(" ");
    return `<svg class="pp-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="نمودار مشارکت گل و پاس گل">
      <polyline points="${points}" fill="none" stroke="#b9f27c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      ${points.split(" ").map(point => { const [x,y] = point.split(","); return `<circle cx="${x}" cy="${y}" r="4" fill="#b9f27c"/>`; }).join("")}
    </svg><div class="pp-muted">روند مجموع گل و پاس گل در سوابق ثبت‌شده (حداکثر ۱۲ مورد اخیر)</div>`;
  }

  function tabContent(player) {
    switch (state.activeTab) {
      case "stats": return statsHtml(player);
      case "matches": return matchesHtml(player);
      case "honors": return honorsHtml(player);
      case "records": return recordsHtml(player);
      case "performance": return performanceHtml(player) + chartHtml(player);
      case "compare": return compareHtml(player);
      default: return overviewHtml(player) + chartHtml(player);
    }
  }

  function render() {
    const section = $("#gcPlayerProfiles");
    if (!section) return;
    const target = $("#ppRoot", section);
    if (!target) return;
    if (!state.players.length) {
      target.innerHTML = `<div class="pp-empty">هنوز بازیکنی در گل‌اسکور ثبت نشده است.</div>`;
      return;
    }
    const player = selectedPlayer();
    if (!player) return;
    const tabs = [
      ["overview","نمای کلی"],["stats","آمار"],["matches","مسابقات"],
      ["honors","افتخارات"],["records","رکوردها"],
      ["performance","عملکرد"],["compare","مقایسه"]
    ];
    target.innerHTML = playerSelector() + headerHtml(player) +
      `<div class="pp-tabs">${tabs.map(([key,label]) =>
        `<button type="button" data-pp-tab="${key}" class="${state.activeTab === key ? "active" : ""}">${label}</button>`
      ).join("")}</div><div class="pp-content">${tabContent(player)}</div>`;

    $("#ppPlayerSelect", target)?.addEventListener("change", event => {
      state.selectedPlayerId = event.target.value;
      render();
    });
    $("#ppRefresh", target)?.addEventListener("click", loadData);
    target.querySelectorAll("[data-pp-tab]").forEach(button => {
      button.addEventListener("click", () => {
        state.activeTab = button.dataset.ppTab;
        render();
      });
    });
  }

  function init() {
    injectStyles();
    const section = createInterface();
    const nav = $("main nav");
    const profileButton = nav?.querySelector('[data-profile-navigation="true"]');
    profileButton?.addEventListener("click", () => activateSection(section, profileButton));
    loadData();
  }

  window.gcRefreshPlayerProfiles = loadData;
  window.gcGetPlayerProfileStats = id => {
    const player = findPlayer(id);
    return player ? statsFor(player) : null;
  };
  window.gcGetPlayerProfileScores = () => state.scores.slice();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
