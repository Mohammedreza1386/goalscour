
(() => {
  "use strict";

  const SUPABASE_URL =
    "https://zusbebjskchgehdjvpsm.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  const main = document.querySelector("main");
  if (!main) return;

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    })[char]);

  if (document.getElementById("gcMilestones")) return;

  const nav = main.querySelector("nav");

  const tab = document.createElement("button");
  tab.type = "button";
  tab.dataset.tab = "gcMilestones";
  tab.textContent = "رکوردها و پروفایل";

  if (nav) nav.appendChild(tab);

  const section = document.createElement("section");
  section.id = "gcMilestones";
  section.className = "section";

  section.innerHTML = `
    <style>
      #gcMilestones {
        direction:rtl;
        color:inherit;
      }

      #gcMilestones .gm-wrap {
        display:grid;
        gap:18px;
      }

      #gcMilestones .gm-panel {
        padding:18px;
        border:1px solid #303a32;
        border-radius:18px;
        background:rgba(20,28,23,.72);
      }

      #gcMilestones .gm-title {
        font-size:20px;
        font-weight:800;
        margin:0 0 14px;
      }

      #gcMilestones .gm-list {
        display:grid;
        gap:12px;
      }

      #gcMilestones .gm-card {
        display:grid;
        grid-template-columns:54px 1fr;
        gap:12px;
        align-items:center;
        padding:13px;
        border:1px solid #303a32;
        border-radius:14px;
        background:rgba(255,255,255,.025);
      }

      
#gcMilestones .gm-card.gm-achieved {
  border: 2px solid #b9f27c;
  background: rgba(185,242,124,.09);
}

#gcMilestones .gm-achievement {
  display: inline-block;
  color: #b9f27c;
  font-weight: 800;
  font-size: 12px;
  margin-bottom: 7px;
}


      #gcMilestones .gm-photo {
        width:54px;
        height:54px;
        border-radius:50%;
        object-fit:cover;
        background:#27342b;
      }

      #gcMilestones .gm-name {
        font-weight:800;
        margin-bottom:5px;
      }

      #gcMilestones .gm-muted {
        opacity:.7;
        font-size:13px;
      }

      #gcMilestones .gm-stats {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
        margin-top:12px;
      }

      #gcMilestones .gm-stat {
        padding:10px;
        border-radius:11px;
        background:rgba(255,255,255,.045);
        font-size:13px;
      }

      #gcMilestones .gm-stat strong {
        display:block;
        color:#b9f27c;
        font-size:18px;
        margin-top:4px;
      }

      #gcMilestones .gm-progress {
        height:8px;
        border-radius:20px;
        overflow:hidden;
        background:#303a32;
        margin:10px 0 6px;
      }

      #gcMilestones .gm-progress span {
        display:block;
        height:100%;
        background:#b9f27c;
        border-radius:20px;
      }

      #gcMilestones .gm-empty {
        opacity:.7;
        padding:12px;
      }

      #gcMilestones .gm-error {
        color:#ff9b9b;
      }

      @media(min-width:700px) {
        #gcMilestones .gm-profiles {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        #gcMilestones .gm-stats {
          grid-template-columns:repeat(3,minmax(0,1fr));
        }
      }
    </style>

    <div class="gm-wrap">

      <div class="gm-panel">
        <h2 class="gm-title">
          🏆 نزدیک‌ترین بازیکنان به رکورد بعدی
        </h2>

        <div id="gmMilestoneList" class="gm-list">
          در حال دریافت اطلاعات...
        </div>
      </div>

      <div class="gm-panel">
        <h2 class="gm-title">
          👤 پروفایل آماری بازیکنان
        </h2>

        <div id="gmProfiles" class="gm-list gm-profiles">
          در حال دریافت اطلاعات...
        </div>
      </div>

      <div id="gmStatus" class="gm-muted"></div>

    </div>
  `;

  main.appendChild(section);

  const milestones = [100, 250, 500, 1000];

  const el = id => document.getElementById(id);

  function matchKey(date, opponent) {
    return String(date || "").slice(0,10) + "|" +
      String(opponent || "").trim().toLowerCase();
  }

  function number(value) {
    const result = Number(value || 0);

    return Number.isFinite(result) && result > 0
      ? result
      : 0;
  }

  
function getNextMilestone(goals) {
  const achieved = Math.floor(goals / 100) * 100;
  const target = achieved + 100;
  const previous = achieved;

  const remaining = target - goals;

  const progress = Math.max(
    0,
    Math.min(
      100,
      ((goals - previous) / 100) * 100
    )
  );

  return {
    achieved,
    target,
    previous,
    remaining,
    progress
  };
}


  function photoHTML(photo) {
    if (!photo) {
      return `
        <div class="gm-photo"
          style="display:grid;place-items:center">
          ⚽
        </div>
      `;
    }

    return `
      <img class="gm-photo"
        src="${esc(photo)}"
        alt=""
        loading="lazy"
        onerror="this.style.display='none'">
    `;
  }

  function renderMilestones(stats) {
    const ranked = stats
      .map(player => ({
        ...player,
        milestone: getNextMilestone(player.goals)
      }))
      .filter(player => player.milestone)
      .sort((a,b) =>
        a.milestone.remaining - b.milestone.remaining ||
        b.goals - a.goals
      );

    el("gmMilestoneList").innerHTML = ranked.length
      ? ranked.map((player,index) => `
        <div class="gm-card ${player.milestone.achieved >= 100 ? "gm-achieved" : ""}">

          ${photoHTML(player.photo)}

          <div>
            <div class="gm-name">
              ${index + 1}. ${esc(player.name)}
            </div>

            <div class="gm-muted">
              ${player.goals} گل فعلی
              · هدف بعدی ${player.milestone.target}
            </div>

            <div class="gm-progress">
              <span style="width:${player.milestone.progress}%"></span>
            </div>

            <div class="gm-muted">
              فقط ${player.milestone.remaining}
              گل تا رکورد بعدی
            </div>
          </div>

        </div>
      `).join("")
      : `
        <div class="gm-empty">
          بازیکنی در انتظار رکورد بعدی وجود ندارد.
        </div>
      `;
  }

  function renderProfiles(stats) {
    el("gmProfiles").innerHTML = stats.length
      ? stats.map(player => `
        <div class="gm-card">

          ${photoHTML(player.photo)}

          <div>
            <div class="gm-name">
              ${esc(player.name)}
            </div>

            <div class="gm-muted">
              ${player.age
                ? esc(player.age) + " ساله"
                : "سن ثبت نشده"}
            </div>

            <div class="gm-stats">

              <div class="gm-stat">
                مجموع گل
                <strong>${player.goals}</strong>
              </div>

              <div class="gm-stat">
                پاس گل
                <strong>${player.assists}</strong>
              </div>

              <div class="gm-stat">
                گل + پاس گل
                <strong>${player.contributions}</strong>
              </div>

              <div class="gm-stat">
                دریبل موفق
                <strong>${player.successful}</strong>
              </div>

              <div class="gm-stat">
                دریبل ناموفق
                <strong>${player.unsuccessful}</strong>
              </div>

              <div class="gm-stat">
                هت‌تریک
                <strong>${player.hatTricks}</strong>
              </div>

            </div>
          </div>

        </div>
      `).join("")
      : `
        <div class="gm-empty">
          هنوز بازیکنی ثبت نشده است.
        </div>
      `;
  }
  
  async function load() {
    const milestoneBox = el("gmMilestoneList");
    const profilesBox = el("gmProfiles");
    const status = el("gmStatus");

    milestoneBox.textContent = "در حال دریافت اطلاعات...";
    profilesBox.textContent = "در حال دریافت اطلاعات...";
    status.textContent = "";

    try {
      const results = await Promise.all([

        db.from("goalscour_players")
          .select("id,name,age,photo"),

        db.from("goalscour_matches")
          .select("*"),

        db.from("goalscour_unofficial")
          .select("*"),

        db.from("goalscour_dribbles")
          .select("*"),

        db.from("goalscour_match_events")
          .select("id,opponent,match_date"),

        db.from("goalscour_match_performances")
          .select("match_id,player_id,goals,assists,penalties")

      ]);

      const failed = results.find(result => result.error);

      if (failed) throw failed.error;

      const [
        playersResult,
        matchesResult,
        unofficialResult,
        dribblesResult,
        eventsResult,
        performancesResult
      ] = results;

      const players = playersResult.data || [];
      const matches = matchesResult.data || [];
      const unofficial = unofficialResult.data || [];
      const dribbles = dribblesResult.data || [];
      const events = eventsResult.data || [];
      const performances = performancesResult.data || [];

      // مسابقات جدید را از محاسبه قدیمی جدا می‌کنیم
      // تا گل‌ها دوبار شمرده نشوند.

      const ratedKeys = new Set(
        events.map(event =>
          matchKey(event.match_date, event.opponent)
        )
      );

      const oldMatches = matches.filter(match =>
        !ratedKeys.has(
          matchKey(match.match_date, match.opponent)
        )
      );

      const stats = players.map(player => {

        const playerId = String(player.id);

        const oldScored = oldMatches.filter(match =>
          String(match.scorer_id) === playerId
        );

        const oldAssisted = oldMatches.filter(match =>
          String(match.assister_id) === playerId
        );

        const ratedRows = performances.filter(row =>
          String(row.player_id) === playerId
        );

        const unofficialRows = unofficial.filter(row =>
          String(row.player_id) === playerId
        );

        // گل‌های رسمی قدیمی و جدید

        const oldGoals = oldScored.reduce(
          (sum, match) => sum + number(match.goals),
          0
        );

        const newGoals = ratedRows.reduce(
          (sum, row) => sum + number(row.goals),
          0
        );

        const unofficialGoals = unofficialRows.reduce(
          (sum, row) => sum + number(row.goals),
          0
        );

        const officialGoals = oldGoals + newGoals;

        // پاس گل‌های رسمی قدیمی و جدید

        const oldAssists = oldAssisted.reduce(
          (sum, match) => sum + number(match.assists),
          0
        );

        const newAssists = ratedRows.reduce(
          (sum, row) => sum + number(row.assists),
          0
        );

        const unofficialAssists = unofficialRows.reduce(
          (sum, row) => sum + number(row.assists),
          0
        );

        const assists =
          oldAssists + newAssists + unofficialAssists;

        // مجموع گل‌ها

        const goals = officialGoals + unofficialGoals;

        // هت‌تریک‌ها

        const oldHatTricks = oldScored.filter(
          match => number(match.goals) >= 3
        ).length;

        const newHatTricks = ratedRows.filter(
          row => number(row.goals) >= 3
        ).length;

        const hatTricks = oldHatTricks + newHatTricks;

        // دوبل‌ها

        const oldBraces = oldScored.filter(
          match => number(match.goals) === 2
        ).length;

        const newBraces = ratedRows.filter(
          row => number(row.goals) === 2
        ).length;

        const braces = oldBraces + newBraces;

        // دریبل‌ها

        const dribble = dribbles.find(
          item => String(item.player_id) === playerId
        ) || {};

        const successful = number(dribble.successful);
        const unsuccessful = number(dribble.unsuccessful);

        return {
          ...player,

          officialGoals,
          unofficialGoals,
          goals,

          assists,
          officialAssists: oldAssists + newAssists,
          unofficialAssists,

          contributions: goals + assists,

          hatTricks,
          braces,

          successful,
          unsuccessful,

          totalDribbles: successful + unsuccessful
        };
      });

      // نمایش رتبه‌بندی و پروفایل

      renderMilestones(stats);
      renderProfiles(stats);

      status.textContent =
        `اطلاعات ${players.length} بازیکن با موفقیت به‌روز شد.`;

    } catch (error) {

      milestoneBox.innerHTML = `
        <div class="gm-error">
          خطا در دریافت اطلاعات رکوردها.
        </div>
      `;

      profilesBox.innerHTML = `
        <div class="gm-error">
          خطا در دریافت اطلاعات بازیکنان.
        </div>
      `;

      status.textContent =
        error.message || "خطای نامشخص در دریافت اطلاعات";
    }
  }

  // به‌روزرسانی خودکار رکوردها پس از تغییر آمار
  let renderRefreshTimer = null;

  if (typeof window.renderAll === "function") {
    const originalRenderAll = window.renderAll;

    window.renderAll = function (...args) {
      const result = originalRenderAll.apply(this, args);

      clearTimeout(renderRefreshTimer);

      renderRefreshTimer = setTimeout(() => {
        load();
      }, 1500);

      return result;
    };
  }

  // به‌روزرسانی هنگام بازگشت به صفحه
  window.addEventListener("focus", load);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) load();
  });

  // تازه‌سازی خودکار هر ۳۰ ثانیه
  window.setInterval(() => {
    if (!document.hidden) load();
  }, 30000);

  window.gcRefreshMilestones = load;

  function openTab() {
    document.querySelectorAll(".section").forEach(item => {
      item.classList.toggle(
        "active",
        item.id === "gcMilestones"
      );
    });

    document.querySelectorAll("nav button[data-tab]").forEach(item => {
      item.classList.toggle("active", item === tab);
    });

    load();
  }

  tab.addEventListener("click", openTab);

  // دریافت اولیه اطلاعات

  load();

})();
