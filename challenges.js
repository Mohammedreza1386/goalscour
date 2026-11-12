
(() => {
  "use strict";

  const URL = "https://zusbebjskchgehdjvpsm.supabase.co";
  const KEY = "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";
  const db = window.supabase.createClient(URL, KEY);

  const main = document.querySelector("main");
  if (!main) return;

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);

  const tab = document.createElement("button");
  tab.type = "button";
  tab.dataset.tab = "gcChallenges";
  tab.textContent = "چالش‌ها و برندگان";
  main.querySelector("nav")?.appendChild(tab);

  const section = document.createElement("section");
  section.id = "gcChallenges";
  section.className = "section";
  section.innerHTML = `
    <style>
      #gcChallenges {direction:rtl;color:inherit}
      #gcChallenges .ch-wrap{display:grid;gap:16px}
      #gcChallenges .ch-panel{padding:17px;border:1px solid #303a32;border-radius:17px;background:rgba(20,28,23,.75)}
      #gcChallenges .ch-title{font-size:20px;font-weight:800;margin:0 0 14px}
      #gcChallenges .ch-list{display:grid;gap:12px}
      #gcChallenges .ch-card{padding:14px;border:1px solid #303a32;border-radius:14px;background:rgba(255,255,255,.025)}
      #gcChallenges .ch-name{font-weight:800;font-size:16px}
      #gcChallenges .ch-muted{opacity:.7;font-size:13px;margin-top:5px}
      #gcChallenges .ch-row{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
      #gcChallenges .ch-progress{height:8px;background:#303a32;border-radius:20px;overflow:hidden;margin:9px 0}
      #gcChallenges .ch-progress span{display:block;height:100%;background:#b9f27c}
      #gcChallenges .ch-rank{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #303a32;gap:8px}
      #gcChallenges .ch-rank:last-child{border:0}
      #gcChallenges input,#gcChallenges select,#gcChallenges textarea{
        width:100%;box-sizing:border-box;padding:11px;border-radius:10px;
        border:1px solid #465248;background:#111a14;color:inherit;font:inherit;margin:5px 0 12px
      }
      #gcChallenges button.ch-btn{padding:11px 16px;border:0;border-radius:10px;background:#b9f27c;color:#172014;font-weight:800;cursor:pointer}
      #gcChallenges .ch-empty{opacity:.7;padding:10px}
      #gcChallenges .ch-error{color:#ff9999}
      #gcChallenges .ch-form{display:grid;gap:2px}
      #gcChallenges .ch-form label{font-size:13px;opacity:.8}
      @media(min-width:700px){#gcChallenges .ch-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}}
    </style>
    <div class="ch-wrap">
      <div class="ch-panel" id="chAdminPanel" hidden>
        <h2 class="ch-title">➕ ساخت چالش جدید</h2>
        <form class="ch-form" id="chCreateForm">
          <label>عنوان چالش</label>
          <input id="chTitle" maxlength="100" required placeholder="مثلاً سلطان گل هفته">
          <label>توضیحات</label>
          <textarea id="chDescription" rows="2" maxlength="500" placeholder="توضیحات چالش"></textarea>
          <div class="ch-grid">
            <div>
              <label>نوع چالش</label>
              <select id="chMetric">
                <option value="goals">تعداد گل</option>
                <option value="assists">پاس گل</option>
                <option value="goal_contributions">گل + پاس گل</option>
                <option value="hat_tricks">هت‌تریک</option>
                <option value="dribbles_total">مجموع دریبل</option>
                <option value="successful_dribbles">دریبل موفق</option>
              </select>
            </div>
            <div>
              <label>هدف عددی</label>
              <input id="chTarget" type="number" min="1" max="100000" required value="10">
            </div>
            <div>
              <label>شروع چالش</label>
              <input id="chStart" type="date" required>
            </div>
            <div>
              <label>پایان چالش</label>
              <input id="chEnd" type="date" required>
            </div>
          </div>
          <button class="ch-btn" type="submit">ساخت چالش</button>
          <div id="chFormStatus" class="ch-muted"></div>
        </form>
      </div>

      <div class="ch-panel">
        <h2 class="ch-title">🔥 چالش‌های فعال</h2>
        <div id="chActive" class="ch-list">در حال بارگذاری...</div>
      </div>

      <div class="ch-panel">
        <h2 class="ch-title">🏆 برندگان و چالش‌های پایان‌یافته</h2>
        <div id="chWinners" class="ch-list">در حال بارگذاری...</div>
      </div>
      <div id="chStatus" class="ch-muted"></div>
    </div>
  `;
  main.appendChild(section);

  const metricNames = {
    goals: "گل",
    assists: "پاس گل",
    goal_contributions: "گل + پاس گل",
    hat_tricks: "هت‌تریک",
    dribbles_total: "مجموع دریبل",
    successful_dribbles: "دریبل موفق"
  };

  let isAdmin = false;

  function openTab() {
    document.querySelectorAll(".section").forEach(el =>
      el.classList.toggle("active", el.id === "gcChallenges")
    );
    document.querySelectorAll("nav button[data-tab]").forEach(el =>
      el.classList.toggle("active", el === tab)
    );
    load();
  }

  tab.addEventListener("click", openTab);

  function dateValue(value) {
    return value ? new Date(value + "T00:00:00") : null;
  }

  function inPeriod(value, start, end) {
    if (!value) return false;
    const d = new Date(value);
    const from = dateValue(start);
    const to = dateValue(end);
    if (!from || !to || Number.isNaN(d.getTime())) return false;
    to.setHours(23, 59, 59, 999);
    return d >= from && d <= to;
  }

  function metricFor(player, challenge, matches, unofficial, dribbles) {
    const start = challenge.starts_at.slice(0, 10);
    const end = challenge.ends_at.slice(0, 10);

    const playerMatches = matches.filter(m =>
      (m.scorer_id === player.id || m.assister_id === player.id) &&
      inPeriod(m.match_date, start, end)
    );

    const playerUnofficial = unofficial.filter(r =>
      r.player_id === player.id && inPeriod(r.record_date, start, end)
    );

    const goals = playerMatches
      .filter(m => m.scorer_id === player.id)
      .reduce((s, m) => s + Number(m.goals || 0), 0)
      + playerUnofficial.reduce((s, r) => s + Number(r.goals || 0), 0);

    const assists = playerMatches
      .filter(m => m.assister_id === player.id)
      .reduce((s, m) => s + Number(m.assists || 0), 0)
      + playerUnofficial.reduce((s, r) => s + Number(r.assists || 0), 0);

    const hatTricks = playerMatches.filter(m =>
      m.scorer_id === player.id && Number(m.goals || 0) >= 3
    ).length;

    const dribble = dribbles.find(d => d.player_id === player.id) || {};
    const successful = Number(dribble.successful || 0);
    const totalDribbles = successful + Number(dribble.unsuccessful || 0);

    switch (challenge.metric_key) {
      case "goals": return goals;
      case "assists": return assists;
      case "goal_contributions": return goals + assists;
      case "hat_tricks": return hatTricks;
      case "successful_dribbles": return successful;
      case "dribbles_total": return totalDribbles;
      default: return 0;
    }
  }

  function challengeCard(challenge, players, matches, unofficial, dribbles, completed) {
    const target = Number(challenge.target_value);
    const results = players.map(player => ({
      player,
      value: metricFor(player, challenge, matches, unofficial, dribbles)
    })).sort((a, b) => b.value - a.value);

    const winner = results[0];
    const winnerText = winner && winner.value > 0
      ? `🥇 برنده فعلی: ${esc(winner.player.name)} با ${winner.value} ${metricNames[challenge.metric_key]}`
      : "هنوز بازیکنی امتیاز ثبت نکرده است.";

    return `
      <div class="ch-card">
        <div class="ch-row">
          <div class="ch-name">${esc(challenge.title)}</div>
          <span class="ch-muted">${completed ? "پایان‌یافته" : "در حال برگزاری"}</span>
        </div>
        ${challenge.description ? `<div class="ch-muted">${esc(challenge.description)}</div>` : ""}
        <div class="ch-muted">
          هدف: ${target} ${metricNames[challenge.metric_key] || ""}
          · از ${esc(challenge.starts_at.slice(0,10))}
          تا ${esc(challenge.ends_at.slice(0,10))}
        </div>
        <div class="ch-muted">${winnerText}</div>
        <div style="margin-top:12px;font-weight:700">جدول رتبه‌بندی</div>
        ${results.length ? results.slice(0, 10).map((item, index) => {
          const percent = Math.min(100, item.value / target * 100);
          return `
            <div class="ch-rank">
              <span>${index + 1}. ${esc(item.player.name)}</span>
              <strong>${item.value} / ${target}</strong>
            </div>
            <div class="ch-progress"><span style="width:${percent}%"></span></div>
          `;
        }).join("") : `<div class="ch-empty">بازیکنی ثبت نشده است.</div>`}
      </div>
    `;
  }

  async function load() {
    $("chActive").textContent = "در حال بارگذاری...";
    $("chWinners").textContent = "در حال بارگذاری...";
    $("chStatus").textContent = "";

    try {
      const [p, m, u, d, c] = await Promise.all([
        db.from("goalscour_players").select("id,name"),
        db.from("goalscour_matches").select("scorer_id,goals,assister_id,assists,match_date"),
        db.from("goalscour_unofficial").select("player_id,goals,assists,record_date"),
        db.from("goalscour_dribbles").select("player_id,successful,unsuccessful"),
        db.from("goalscour_challenges").select("*").order("created_at", { ascending: false })
      ]);

      const failed = [p,m,u,d,c].find(x => x.error);
      if (failed) throw failed.error;

      const players = p.data || [];
      const matches = m.data || [];
      const unofficial = u.data || [];
      const dribbles = d.data || [];
      const challenges = c.data || [];
      const today = new Date().toISOString().slice(0,10);

      const active = challenges.filter(ch =>
        ch.status === "active" &&
        ch.starts_at.slice(0,10) <= today &&
        ch.ends_at.slice(0,10) >= today
      );

      const finished = challenges.filter(ch =>
        ch.status === "completed" ||
        (ch.status === "active" && ch.ends_at.slice(0,10) < today)
      );

      $("chActive").innerHTML = active.length
        ? active.map(ch => challengeCard(ch, players, matches, unofficial, dribbles, false)).join("")
        : `<div class="ch-empty">در حال حاضر چالش فعالی وجود ندارد.</div>`;

      $("chWinners").innerHTML = finished.length
        ? finished.map(ch => challengeCard(ch, players, matches, unofficial, dribbles, true)).join("")
        : `<div class="ch-empty">هنوز چالشی به پایان نرسیده است.</div>`;

      $("chAdminPanel").hidden = !isAdmin;

    } catch (error) {
      $("chActive").innerHTML = `<div class="ch-error">خطا در دریافت چالش‌ها.</div>`;
      $("chWinners").innerHTML = "";
      $("chStatus").textContent = error.message || "خطای نامشخص";
    }
  }

  async function checkAdmin() {
    try {
      const { data: sessionData } = await db.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return false;

      const { data, error } = await db
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  $("chCreateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdmin) return;

    const title = $("chTitle").value.trim();
    const description = $("chDescription").value.trim();
    const metric = $("chMetric").value;
    const target = Number($("chTarget").value);
    const start = $("chStart").value;
    const end = $("chEnd").value;
    const status = $("chFormStatus");

    if (!title || !start || !end || !Number.isInteger(target) || target < 1 || end < start) {
      status.textContent = "لطفاً اطلاعات چالش را درست وارد کن.";
      return;
    }

    status.textContent = "در حال ساخت چالش...";

    const { error } = await db.from("goalscour_challenges").insert({
      title,
      description,
      metric_key: metric,
      target_value: target,
      starts_at: new Date(start + "T00:00:00").toISOString(),
      ends_at: new Date(end + "T23:59:59").toISOString(),
      status: "active"
    });

    if (error) {
      status.textContent = "خطا: " + error.message;
      return;
    }

    $("chCreateForm").reset();
    status.textContent = "چالش با موفقیت ساخته شد.";
    await load();
  });

  async function start() {
    isAdmin = await checkAdmin();
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    $("chStart").value = now.toISOString().slice(0,10);
    $("chEnd").value = end.toISOString().slice(0,10);
    await load();
  }

  start();
  db.auth.onAuthStateChange(async () => {
    isAdmin = await checkAdmin();
    $("chAdminPanel").hidden = !isAdmin;
    load();
  });
})();
      
