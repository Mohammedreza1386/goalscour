
(() => {
  "use strict";

  const SUPABASE_URL = "https://zusbebjskchgehdjvpsm.supabase.co";
  const SUPABASE_KEY = "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const main = document.querySelector("main");
  if (!main) return;

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const tab = document.createElement("button");
  tab.type = "button";
  tab.dataset.tab = "gcMilestones";
  tab.textContent = "رکوردها و پروفایل";

  const nav = main.querySelector("nav");
  if (nav) nav.appendChild(tab);

  const section = document.createElement("section");
  section.id = "gcMilestones";
  section.className = "section";
  section.innerHTML = `
    <style>
      #gcMilestones { direction:rtl; color:inherit; }
      #gcMilestones .gm-wrap { display:grid; gap:18px; }
      #gcMilestones .gm-panel {
        padding:18px; border:1px solid #303a32; border-radius:18px;
        background:rgba(20,28,23,.72);
      }
      #gcMilestones .gm-title { font-size:20px; font-weight:800; margin:0 0 14px; }
      #gcMilestones .gm-list { display:grid; gap:12px; }
      #gcMilestones .gm-card {
        display:grid; grid-template-columns:54px 1fr; gap:12px;
        align-items:center; padding:13px; border:1px solid #303a32;
        border-radius:14px; background:rgba(255,255,255,.025);
      }
      #gcMilestones .gm-photo {
        width:54px; height:54px; border-radius:50%; object-fit:cover;
        background:#27342b;
      }
      #gcMilestones .gm-name { font-weight:800; margin-bottom:5px; }
      #gcMilestones .gm-muted { opacity:.7; font-size:13px; }
      #gcMilestones .gm-stats {
        display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px; margin-top:12px;
      }
      #gcMilestones .gm-stat {
        padding:10px; border-radius:11px; background:rgba(255,255,255,.045);
        font-size:13px;
      }
      #gcMilestones .gm-stat strong {
        display:block; color:#b9f27c; font-size:18px; margin-top:4px;
      }
      #gcMilestones .gm-progress {
        height:8px; border-radius:20px; overflow:hidden;
        background:#303a32; margin:10px 0 6px;
      }
      #gcMilestones .gm-progress span {
        display:block; height:100%; background:#b9f27c; border-radius:20px;
      }
      #gcMilestones .gm-empty { opacity:.7; padding:12px; }
      #gcMilestones .gm-error { color:#ff9b9b; }
      @media(min-width:700px) {
        #gcMilestones .gm-profiles { grid-template-columns:repeat(2,minmax(0,1fr)); }
        #gcMilestones .gm-stats { grid-template-columns:repeat(3,minmax(0,1fr)); }
      }
    </style>
    <div class="gm-wrap">
      <div class="gm-panel">
        <h2 class="gm-title">🏆 نزدیک‌ترین بازیکنان به رکورد بعدی</h2>
        <div id="gmMilestoneList" class="gm-list">در حال دریافت اطلاعات...</div>
      </div>
      <div class="gm-panel">
        <h2 class="gm-title">👤 پروفایل آماری بازیکنان</h2>
        <div id="gmProfiles" class="gm-list gm-profiles">در حال دریافت اطلاعات...</div>
      </div>
      <div id="gmStatus" class="gm-muted"></div>
    </div>
  `;
  main.appendChild(section);

  function openTab() {
    document.querySelectorAll(".section").forEach((item) => {
      item.classList.toggle("active", item.id === "gcMilestones");
    });
    document.querySelectorAll("nav button[data-tab]").forEach((item) => {
      item.classList.toggle("active", item === tab);
    });
    load();
  }

  tab.addEventListener("click", openTab);

  const milestones = [100, 250, 500, 1000];

  function getNextMilestone(goals) {
    const target = milestones.find((number) => goals < number);
    if (!target) return null;

    const previous = milestones[milestones.indexOf(target) - 1] || 0;
    const remaining = target - goals;
    const progress = Math.max(
      0,
      Math.min(100, ((goals - previous) / (target - previous)) * 100)
    );

    return { target, previous, remaining, progress };
  }

  function photoHTML(photo) {
    if (!photo) {
      return `<div class="gm-photo" style="display:grid;place-items:center">⚽</div>`;
    }
    return `<img class="gm-photo" src="${esc(photo)}" alt="" loading="lazy"
      onerror="this.style.display='none'">`;
  }

  async function load() {
    const milestoneBox = document.getElementById("gmMilestoneList");
    const profilesBox = document.getElementById("gmProfiles");
    const status = document.getElementById("gmStatus");

    milestoneBox.textContent = "در حال دریافت اطلاعات...";
    profilesBox.textContent = "در حال دریافت اطلاعات...";
    status.textContent = "";

    try {
      const results = await Promise.all([
        db.from("goalscour_players").select("id,name,age,photo"),
        db.from("goalscour_matches").select("scorer_id,goals,assister_id,assists"),
        db.from("goalscour_unofficial").select("player_id,goals,assists"),
        db.from("goalscour_dribbles").select("player_id,successful,unsuccessful")
      ]);

      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;

      const [playersResult, matchesResult, unofficialResult, dribblesResult] = results;
      const players = playersResult.data || [];
      const matches = matchesResult.data || [];
      const unofficial = unofficialResult.data || [];
      const dribbles = dribblesResult.data || [];

      const stats = players.map((player) => {
        const officialGoals = matches
          .filter((match) => match.scorer_id === player.id)
          .reduce((sum, match) => sum + Number(match.goals || 0), 0);

        const unofficialGoals = unofficial
          .filter((record) => record.player_id === player.id)
          .reduce((sum, record) => sum + Number(record.goals || 0), 0);

        const officialAssists = matches
          .filter((match) => match.assister_id === player.id)
          .reduce((sum, match) => sum + Number(match.assists || 0), 0);

        const unofficialAssists = unofficial
          .filter((record) => record.player_id === player.id)
          .reduce((sum, record) => sum + Number(record.assists || 0), 0);

        const dribble = dribbles.find((item) => item.player_id === player.id) || {};
        const successful = Number(dribble.successful || 0);
        const unsuccessful = Number(dribble.unsuccessful || 0);
        const goals = officialGoals + unofficialGoals;
        const assists = officialAssists + unofficialAssists;
        const hatTricks = matches.filter(
          (match) => match.scorer_id === player.id && Number(match.goals || 0) >= 3
        ).length;

        return {
          ...player,
          goals,
          assists,
          contributions: goals + assists,
          successful,
          unsuccessful,
          totalDribbles: successful + unsuccessful,
          hatTricks
        };
      });

      const ranked = stats
        .map((player) => ({
          ...player,
          milestone: getNextMilestone(player.goals)
        }))
        .filter((player) => player.milestone)
        .sort((a, b) =>
          a.milestone.remaining - b.milestone.remaining ||
          b.goals - a.goals
        );

      milestoneBox.innerHTML = ranked.length
        ? ranked.map((player, index) => `
          <div class="gm-card">
            ${photoHTML(player.photo)}
            <div>
              <div class="gm-name">${index + 1}. ${esc(player.name)}</div>
              <div class="gm-muted">
                ${player.goals} گل فعلی · هدف بعدی ${player.milestone.target}
              </div>
              <div class="gm-progress">
                <span style="width:${player.milestone.progress}%"></span>
              </div>
              <div class="gm-muted">
                فقط ${player.milestone.remaining} گل تا رکورد بعدی
              </div>
            </div>
          </div>
        `).join("")
        : `<div class="gm-empty">بازیکنی در انتظار رکورد بعدی وجود ندارد.</div>`;

      profilesBox.innerHTML = stats.length
        ? stats.map((player) => `
          <div class="gm-card">
            ${photoHTML(player.photo)}
            <div>
              <div class="gm-name">${esc(player.name)}</div>
              <div class="gm-muted">${player.age ? esc(player.age) + " ساله" : "سن ثبت نشده"}</div>
              <div class="gm-stats">
                <div class="gm-stat">مجموع گل<strong>${player.goals}</strong></div>
                <div class="gm-stat">پاس گل<strong>${player.assists}</strong></div>
                <div class="gm-stat">گل + پاس گل<strong>${player.contributions}</strong></div>
                <div class="gm-stat">دریبل موفق<strong>${player.successful}</strong></div>
                <div class="gm-stat">دریبل ناموفق<strong>${player.unsuccessful}</strong></div>
                <div class="gm-stat">هت‌تریک<strong>${player.hatTricks}</strong></div>
              </div>
            </div>
          </div>
        `).join("")
        : `<div class="gm-empty">هنوز بازیکنی ثبت نشده است.</div>`;

    } catch (error) {
      milestoneBox.innerHTML = `<div class="gm-error">خطا در دریافت اطلاعات رکوردها.</div>`;
      profilesBox.innerHTML = `<div class="gm-error">خطا در دریافت اطلاعات بازیکنان.</div>`;
      status.textContent = error.message || "خطای نامشخص";
    }
  }

  load();
})();
                
