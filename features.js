
(() => {
"use strict";

const db = window.supabase.createClient(
  "https://zusbebjskchgehdjvpsm.supabase.co",
  "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK"
);

if (document.getElementById("gcFeatures")) return;

const style = document.createElement("style");
style.textContent = `
#gcFeatures .gcp{background:#111812;border:1px solid #273329;border-radius:15px;padding:14px;margin:12px 0}
#gcFeatures .gcg{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}
#gcFeatures .gcc{background:#0c130d;border:1px solid #273329;border-radius:12px;padding:12px}
#gcFeatures input,#gcFeatures select{background:#090d0a;color:white;border:1px solid #273329;border-radius:8px;padding:9px;max-width:100%;margin:5px}
#gcFeatures button{background:#b9f27c;color:#10170d;border:0;border-radius:8px;padding:9px;font-weight:bold;margin:4px;cursor:pointer}
#gcFeatures button.secondary{background:#263525;color:#b9f27c}
#gcFeatures .gcm{color:#89958a;font-size:11px;line-height:1.9}
#gcFeatures .gcr{display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #273329}
#gcFeatures .gcpill{display:inline-block;background:#263525;color:#b9f27c;border-radius:20px;padding:4px 8px;font-size:10px;margin:3px}
#gcFeatures .gcform{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
#gcFeatures .gcform input{min-width:125px}
#gcFeatures h3{margin-top:8px}
`;

document.head.appendChild(style);

const main = document.querySelector("main");
const nav = main && main.querySelector("nav");

if (!main || !nav) return;

const tab = document.createElement("button");
tab.type = "button";
tab.dataset.tab = "gcFeatures";
tab.textContent = "جوایز و دریبل";
nav.appendChild(tab);

const section = document.createElement("section");
section.id = "gcFeatures";
section.className = "section";

section.innerHTML = `
  <h2>جوایز و آمار بازیکنان</h2>

  <div class="gcp">
    <h3>مدیریت دوره مسابقات</h3>
    <p class="gcm">مدیر تاریخ شروع و پایان هر دوره را خودش مشخص می‌کند.</p>

    <div id="gcPeriodAdmin"></div>

    <div class="gcform">
      <label>دوره انتخاب‌شده:</label>
      <select id="gcPeriodSelect"></select>
    </div>

    <div id="gcPeriodInfo" class="gcm"></div>
  </div>

  <div class="gcp">
    <h3>توپ طلای Goalscour</h3>
    <p class="gcm">پنج نامزد برتر با توجه به عملکرد بازیکنان در دوره انتخاب‌شده پیشنهاد می‌شوند. انتخاب نهایی با مدیر است.</p>
    <div id="gcBallon" class="gcg"></div>
    <div id="gcBallonAdmin"></div>
  </div>

  <div class="gcp">
    <h3>کفش طلای Goalscour</h3>
    <p class="gcm">رتبه‌بندی بر اساس گل‌های رسمی در دوره انتخاب‌شده محاسبه می‌شود.</p>
    <div id="gcGoldenBoot" class="gcg"></div>
    <div id="gcBootAdmin"></div>
  </div>

  <div class="gcp">
    <h3>رتبه‌بندی جوایز بازیکنان</h3>
    <p class="gcm">مجموع جوایز رسمی ثبت‌شده برای هر بازیکن.</p>
    <div id="gcAwardRanking"></div>
  </div>

  <div class="gcp">
    <h3>تاریخچه جوایز</h3>
    <div id="gcAwardsHistory"></div>
  </div>

  <div class="gcp">
    <h3>دریبل‌های بازیکنان</h3>
    <p class="gcm">ثبت دریبل موفق و ناموفق برای هر بازیکن.</p>
    <div id="gcDribbles" class="gcg"></div>
  </div>

  <div class="gcp">
    <h3>مدال دستاورد گلزنی</h3>
    <p class="gcm">مدال‌های ۱۰۰، ۲۵۰، ۵۰۰ و ۱۰۰۰ گل به‌صورت خودکار محاسبه می‌شوند.</p>
    <div id="gcAchievements" class="gcg"></div>
  </div>

  <p id="gcFeatureStatus" class="gcm"></p>
`;

main.appendChild(section);

let admin = false;
let players = [];
let matches = [];
let unofficial = [];
let dribbles = [];
let awards = [];
let achievements = [];
let periods = [];
let matchEvents = [];
let performances = [];
let currentPeriodId = "";

const el = id => document.getElementById(id);

const n = value =>
  Math.max(0, Math.floor(Number(value) || 0));

const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  })[c]);

function status(message) {
  el("gcFeatureStatus").textContent = message || "";
}

function inRange(date, period) {
  if (!date) return false;
  const d = String(date).slice(0, 10);
  return d >= period.start_date && d <= period.end_date;
}

function matchKey(date, opponent) {
  return String(date || "").slice(0, 10) + "|" +
    String(opponent || "").trim().toLowerCase();
}

async function checkAdmin() {
  const result = await db.auth.getSession();
  const user = result.data?.session?.user;

  if (!user) return false;

  const a = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return !a.error && !!a.data;
}

async function load() {
  const results = await Promise.all([
    db.from("goalscour_players").select("*"),
    db.from("goalscour_matches").select("*"),
    db.from("goalscour_unofficial").select("*"),
    db.from("goalscour_dribbles").select("*"),
    db.from("goalscour_awards").select("*").order("created_at", {ascending:false}),
    db.from("goalscour_achievements").select("*"),
    db.from("goalscour_periods").select("*").order("created_at", {ascending:false}),
    db.from("goalscour_match_events").select("*"),
    db.from("goalscour_match_performances").select("*")
  ]);

  for (const result of results) {
    if (result.error) throw result.error;
  }

  players = results[0].data || [];
  matches = results[1].data || [];
  unofficial = results[2].data || [];
  dribbles = results[3].data || [];
  awards = results[4].data || [];
  achievements = results[5].data || [];
  periods = results[6].data || [];
  matchEvents = results[7].data || [];
  performances = results[8].data || [];

  if (!periods.some(p => p.id === currentPeriodId)) {
    const active = periods.find(p => p.status === "active");
    currentPeriodId = active?.id || periods[0]?.id || "";
  }
}

function calculateStats(player, period = null) {
  const id = String(player.id);

  const eventsInRange = matchEvents.filter(event =>
    !period || inRange(event.match_date, period)
  );

  const ratedKeys = new Set(
    eventsInRange.map(event =>
      matchKey(event.match_date, event.opponent)
    )
  );

  const oldMatches = matches.filter(match => {
    if (period && !inRange(match.match_date, period)) return false;

    return !ratedKeys.has(
      matchKey(match.match_date, match.opponent)
    );
  });

  const oldScored = oldMatches.filter(
    x => String(x.scorer_id) === id
  );

  const oldAssisted = oldMatches.filter(
    x => String(x.assister_id) === id
  );

  const ratedEventIds = new Set(
    eventsInRange.map(event => String(event.id))
  );

  const ratedRows = performances.filter(row =>
    String(row.player_id) === id &&
    ratedEventIds.has(String(row.match_id))
  );

  const unofficialRows = unofficial.filter(row =>
    String(row.player_id) === id &&
    (!period || inRange(row.record_date, period))
  );

  const officialGoals =
    oldScored.reduce((sum, x) => sum + n(x.goals), 0) +
    ratedRows.reduce((sum, x) => sum + n(x.goals), 0);

  const unofficialGoals = unofficialRows.reduce(
    (sum, x) => sum + n(x.goals), 0
  );

  const oldAssists = oldAssisted.reduce(
    (sum, x) => sum + n(x.assists), 0
  );

  const ratedAssists = ratedRows.reduce(
    (sum, x) => sum + n(x.assists), 0
  );

  const unofficialAssists = unofficialRows.reduce(
    (sum, x) => sum + n(x.assists), 0
  );

  const hatTricks =
    oldScored.filter(x => n(x.goals) >= 3).length +
    ratedRows.filter(x => n(x.goals) >= 3).length;

  const braces =
    oldScored.filter(x => n(x.goals) === 2).length +
    ratedRows.filter(x => n(x.goals) === 2).length;

  const ratingTotal = ratedRows.reduce(
    (sum, x) => sum + Number(x.rating || 0), 0
  );

  const appearances = ratedRows.length;

  const dribble = dribbles.find(
    x => String(x.player_id) === id
  ) || {};

  return {
    officialGoals,
    unofficialGoals,
    goals: officialGoals + unofficialGoals,
    assists: oldAssists + ratedAssists + unofficialAssists,
    hatTricks,
    braces,
    appearances,
    ratingTotal,
    averageRating: appearances ? ratingTotal / appearances : 0,
    success: n(dribble.successful),
    fail: n(dribble.unsuccessful)
  };
}

function selectedPeriod() {
  return periods.find(p => p.id === currentPeriodId) || null;
}

function periodNominees(period) {
  return players.map(player => {
    const s = calculateStats(player, period);

    const score =
      s.goals * 1.4 +
      s.assists * 1.2 +
      s.hatTricks * 2 +
      s.averageRating * 0.8;

    return {player, stats:s, score};
  }).sort((a,b) => b.score - a.score).slice(0,5);
}

function goldenBootRanking(period) {
  return players.map(player => ({
    player,
    stats: calculateStats(player, period)
  })).sort((a,b) =>
    b.stats.officialGoals - a.stats.officialGoals
  );
}

function awardLabel(type) {
  if (type === "ballon_dor") return "توپ طلا";
  if (type === "golden_boot") return "کفش طلا";
  return type || "جایزه";
}

function periodLabel(id) {
  const p = periods.find(x => String(x.id) === String(id));
  return p ? p.title : "";
}

async function savePeriod(event) {
  event.preventDefault();

  if (!admin) throw new Error("فقط مدیر اجازه ساخت دوره دارد.");

  const title = el("gcPeriodTitle").value.trim();
  const start = el("gcPeriodStart").value;
  const end = el("gcPeriodEnd").value;

  if (!title || !start || !end) {
    throw new Error("عنوان و تاریخ شروع و پایان را وارد کن.");
  }

  if (end < start) {
    throw new Error("تاریخ پایان نمی‌تواند قبل از شروع باشد.");
  }

  const session = await db.auth.getSession();
  const user = session.data?.session?.user;

  const id = "period-" + crypto.randomUUID();

  const result = await db.from("goalscour_periods").insert({
    id,
    title,
    start_date: start,
    end_date: end,
    status: "active",
    created_by: user?.id || null
  });

  if (result.error) throw result.error;

  currentPeriodId = id;
  await load();
  await render();

  status("دوره جدید با موفقیت ساخته شد.");
}

async function saveAward(type, winnerId, candidateIds, period) {
  if (!admin) throw new Error("فقط مدیر اجازه ثبت جایزه دارد.");

  const id = "period-award-" + type + "-" + period.id;
  const season = "period:" + period.id;

  const payload = {
    id,
    award_type: type,
    season,
    period_id: period.id,
    candidate_player_ids: candidateIds,
    winner_player_id: String(winnerId),
    status: "awarded",
    awarded_at: new Date().toISOString()
  };

  const result = await db
    .from("goalscour_awards")
    .upsert(payload, {onConflict:"id"});

  if (result.error) throw result.error;

  await load();
  await render();
}

function renderPeriods() {
  const adminBox = el("gcPeriodAdmin");

  adminBox.innerHTML = admin ? `
    <form id="gcPeriodForm">
      <div class="gcform">
        <input id="gcPeriodTitle" placeholder="نام دوره؛ مثلاً فصل اول" required>
        <label>شروع:</label>
        <input id="gcPeriodStart" type="date" required>
        <label>پایان:</label>
        <input id="gcPeriodEnd" type="date" required>
        <button type="submit">ساخت دوره</button>
      </div>
    </form>
  ` : '<p class="gcm">ساخت و مدیریت دوره‌ها فقط برای مدیر فعال است.</p>';

  el("gcPeriodSelect").innerHTML = periods.map(p => `
    <option value="${esc(p.id)}" ${p.id === currentPeriodId ? "selected" : ""}>
      ${esc(p.title)}
    </option>
  `).join("");

  const p = selectedPeriod();

  el("gcPeriodInfo").textContent = p
    ? `${p.title} | ${p.start_date} تا ${p.end_date} | وضعیت: ${p.status}`
    : "هنوز دوره‌ای ساخته نشده است.";
}

function renderBallon(period) {
  const box = el("gcBallon");
  const adminBox = el("gcBallonAdmin");

  if (!period) {
    box.innerHTML = '<p class="gcm">ابتدا مدیر باید یک دوره بسازد.</p>';
    adminBox.innerHTML = "";
    return;
  }

  const list = periodNominees(period);

  const existing = awards.find(a =>
    a.award_type === "ballon_dor" &&
    String(a.period_id) === String(period.id)
  );

  box.innerHTML = list.map((item,index) => `
    <div class="gcc">
      <span class="gcpill">نامزد ${index+1}</span>
      <b>${esc(item.player.name)}</b>
      <div class="gcr"><span>مجموع گل</span><b>${item.stats.goals}</b></div>
      <div class="gcr"><span>پاس گل</span><b>${item.stats.assists}</b></div>
      <div class="gcr"><span>هت‌تریک</span><b>${item.stats.hatTricks}</b></div>
      <div class="gcr"><span>میانگین امتیاز</span><b>${item.stats.averageRating.toFixed(2)}</b></div>
      <div class="gcr"><span>امتیاز پیشنهادی</span><b>${item.score.toFixed(2)}</b></div>
    </div>
  `).join("") || '<p class="gcm">بازیکنی برای نامزدی وجود ندارد.</p>';

  if (admin && list.length) {
    const winner = players.find(p =>
      String(p.id) === String(existing?.winner_player_id)
    );

    adminBox.innerHTML = `
      <p class="gcm">انتخاب برنده توپ طلا برای ${esc(period.title)}</p>
      <select id="gcBallonWinner">
        ${list.map(item => `
          <option value="${esc(item.player.id)}"
            ${winner && String(winner.id) === String(item.player.id) ? "selected" : ""}>
            ${esc(item.player.name)}
          </option>
        `).join("")}
      </select>
      <button id="gcSaveBallon">ثبت برنده توپ طلا</button>
      ${winner ? `<p class="gcm">برنده ثبت‌شده: ${esc(winner.name)}</p>` : ""}
    `;
  } else {
    adminBox.innerHTML = existing
      ? '<p class="gcm">برنده این دوره ثبت شده است.</p>'
      : '<p class="gcm">انتخاب برنده نهایی با مدیر است.</p>';
  }
}

function renderGoldenBoot(period) {
  const box = el("gcGoldenBoot");
  const adminBox = el("gcBootAdmin");

  if (!period) {
    box.innerHTML = '<p class="gcm">ابتدا یک دوره بساز.</p>';
    adminBox.innerHTML = "";
    return;
  }

  const list = goldenBootRanking(period);
  const existing = awards.find(a =>
    a.award_type === "golden_boot" &&
    String(a.period_id) === String(period.id)
  );

  box.innerHTML = list.map((item,index) => `
    <div class="gcc">
      <span class="gcpill">رتبه ${index+1}</span>
      <b>${esc(item.player.name)}</b>
      <div class="gcr"><span>گل رسمی</span><b>${item.stats.officialGoals}</b></div>
    </div>
  `).join("") || '<p class="gcm">بازیکنی ثبت نشده است.</p>';

  const eligible = list.filter(x => x.stats.officialGoals > 0);

  if (admin && eligible.length) {
    adminBox.innerHTML = `
      <p class="gcm">انتخاب برنده کفش طلا از میان گلزنان دوره</p>
      <select id="gcBootWinner">
        ${eligible.map(item => `
          <option value="${esc(item.player.id)}"
            ${String(existing?.winner_player_id) === String(item.player.id) ? "selected" : ""}>
            ${esc(item.player.name)} - ${item.stats.officialGoals} گل
          </option>
        `).join("")}
      </select>
      <button id="gcSaveBoot">ثبت برنده کفش طلا</button>
    `;
  } else {
    adminBox.innerHTML = existing
      ? '<p class="gcm">برنده کفش طلا ثبت شده است.</p>'
      : '<p class="gcm">هنوز گل رسمی در این دوره ثبت نشده است.</p>';
  }
}

function renderAwardRanking() {
  const totals = new Map();

  awards.forEach(award => {
    if (!award.winner_player_id) return;

    const id = String(award.winner_player_id);

    if (!totals.has(id)) {
      totals.set(id, {
        count:0,
        ballon:0,
        boot:0,
        other:0
      });
    }

    const item = totals.get(id);
    item.count++;

    if (award.award_type === "ballon_dor") item.ballon++;
    else if (award.award_type === "golden_boot") item.boot++;
    else item.other++;
  });

  const ranking = players.map(player => ({
    player,
    total: totals.get(String(player.id)) || {
      count:0, ballon:0, boot:0, other:0
    }
  })).sort((a,b) => b.total.count - a.total.count);

  el("gcAwardRanking").innerHTML = ranking.map((item,index) => `
    <div class="gcr">
      <span>${index+1}. ${esc(item.player.name)}</span>
      <b>${item.total.count} جایزه</b>
    </div>
    <p class="gcm">
      توپ طلا: ${item.total.ballon} |
      کفش طلا: ${item.total.boot} |
      سایر: ${item.total.other}
    </p>
  `).join("") || '<p class="gcm">هنوز جایزه‌ای ثبت نشده است.</p>';
}

function renderHistory() {
  const sorted = awards.slice().sort((a,b) =>
    String(b.awarded_at || b.created_at || "").localeCompare(
      String(a.awarded_at || a.created_at || "")
    )
  );

  el("gcAwardsHistory").innerHTML = sorted.map(award => {
    const winner = players.find(p =>
      String(p.id) === String(award.winner_player_id)
    );

    const label = periodLabel(award.period_id) || award.season || "قدیمی";

    return `
      <div class="gcr">
        <span>${esc(label)} - ${esc(awardLabel(award.award_type))}</span>
        <b>${esc(winner?.name || "بازیکن نامشخص")}</b>
      </div>
    `;
  }).join("") || '<p class="gcm">هنوز جایزه‌ای ثبت نشده است.</p>';
}

function renderDribbles() {
  el("gcDribbles").innerHTML = players.map(player => {
    const s = calculateStats(player);

    return `
      <div class="gcc">
        <b>${esc(player.name)}</b>
        <div class="gcr"><span>موفق</span><b>${s.success}</b></div>
        <div class="gcr"><span>ناموفق</span><b>${s.fail}</b></div>
        <div class="gcr"><span>مجموع</span><b>${s.success+s.fail}</b></div>

        ${admin ? `
          <input id="gcs-${esc(player.id)}" type="number" min="0" value="${s.success}">
          <input id="gcf-${esc(player.id)}" type="number" min="0" value="${s.fail}">
          <button data-dribble="${esc(player.id)}">ذخیره دریبل</button>
        ` : ""}
      </div>
    `;
  }).join("") || '<p class="gcm">بازیکنی ثبت نشده است.</p>';
}

async function unlockAchievements() {
  if (!admin) return;

  const levels = [100,250,500,1000];

  const known = new Set(
    achievements.map(a =>
      String(a.player_id) + ":" + a.achievement_key
    )
  );

  const rows = [];

  players.forEach(player => {
    const total = calculateStats(player).goals;

    levels.forEach(level => {
      const key = "goals_" + level;
      const compound = String(player.id) + ":" + key;

      if (total >= level && !known.has(compound)) {
        rows.push({
          player_id:String(player.id),
          achievement_key:key
        });
      }
    });
  });

  if (rows.length) {
    const result = await db
      .from("goalscour_achievements")
      .upsert(rows, {onConflict:"player_id,achievement_key"});

    if (result.error) throw result.error;

    await load();
  }
}


const GOAL_ACHIEVEMENT_LEVELS = [
  {
    level: 100,
    key: "goals_100",
    medal: "🥉",
    award: "مدال برنز",
    title: "گلزن صدتایی",
    points: 100
  },
  {
    level: 250,
    key: "goals_250",
    medal: "🥈",
    award: "مدال نقره",
    title: "گلزن حرفه‌ای",
    points: 250
  },
  {
    level: 500,
    key: "goals_500",
    medal: "🥇",
    award: "جام طلا",
    title: "گلزن افسانه‌ای",
    points: 500
  },
  {
    level: 1000,
    key: "goals_1000",
    medal: "💎",
    award: "جام الماس",
    title: "اسطوره Goalscour",
    points: 1000
  }
];

function getAchievementReward(playerId) {
  const unlockedKeys = new Set(
    achievements
      .filter(a => String(a.player_id) === String(playerId))
      .map(a => a.achievement_key)
  );

  const unlocked = GOAL_ACHIEVEMENT_LEVELS.filter(
    item => unlockedKeys.has(item.key)
  );

  return {
    points: unlocked.reduce(
      (sum, item) => sum + item.points, 0
    ),
    title: unlocked.length
      ? unlocked[unlocked.length - 1].title
      : "بدون عنوان افتخاری",
    unlocked
  };
}

window.gcGetAchievementReward = getAchievementReward;

function renderAchievements() {
  el("gcAchievements").innerHTML = players.map(player => {
    const total = calculateStats(player).goals;
    const reward = getAchievementReward(player.id);

    const next = GOAL_ACHIEVEMENT_LEVELS.find(
      item => total < item.level
    );

    return `
      <div class="gcc">
        <b>${esc(player.name)}</b>

        <p class="gcm">${total} گل در کل دوران</p>

        <div class="gcc">
          <div class="gcm">عنوان افتخاری</div>

          <h3 style="color:#b9f27c">
            ${esc(reward.title)}
          </h3>

          <div class="gcm">امتیاز ویژه افتخارات</div>

          <strong style="font-size:24px;color:#b9f27c">
            ${reward.points}
          </strong>
        </div>

        ${GOAL_ACHIEVEMENT_LEVELS.map(item => {
          const has = reward.unlocked.some(
            a => a.key === item.key
          );

          return `
            <div style="
              display:flex;
              justify-content:space-between;
              padding:10px 0;
              border-bottom:1px solid #273329;

const ACHIEVEMENT_CATEGORIES = [
  {key:"goals",label:"گلزنی"},
  {key:"assists",label:"پاس گل"},
  {key:"appearances",label:"حضور در مسابقات"},
  {key:"hatTricks",label:"هت‌تریک"},
  {key:"braces",label:"دوبل"},
  {key:"dribbles",label:"دریبل"},
  {key:"contributions",label:"مشارکت گل"},
  {key:"performance",label:"کیفیت عملکرد"},
  {key:"special",label:"افتخارات ویژه"}
];

const MEDALS = ["⚽","🥉","🥈","🥇","💎"];

function makeLevels(category, metric, prefix, values, titles, points) {
  return values.map((target,index) => ({
    key: prefix + "_" + target,
    category,
    metric,
    target,
    medal: MEDALS[Math.min(index + 1, 4)],
    title: titles[index],
    award: "دستاورد " + target,
    points: points[index]
  }));
}

const ACHIEVEMENT_LEVELS = [
  ...makeLevels("goals","goals","goals",
    [100,250,500,1000],
    ["گلزن صدتایی","گلزن حرفه‌ای","گلزن افسانه‌ای","اسطوره Goalscour"],
    [100,250,500,1000]
  ),

  ...makeLevels("assists","assists","assists",
    [25,50,100,250,500],
    ["پاسور پرتلاش","معمار حمله","مهندس بازی","سلطان پاس گل","اسطوره پاس‌سازی"],
    [25,50,100,250,500]
  ),

  ...makeLevels("appearances","appearances","appearances",
    [10,25,50,100,250],
    ["شروع‌کننده مسیر","بازیکن متعهد","چهره ثابت تیم","ستون تیم","اسطوره وفاداری"],
    [10,25,50,100,250]
  ),

  ...makeLevels("hatTricks","hatTricks","hatTricks",
    [1,5,10,25],
    ["هت‌تریک‌کن","متخصص هت‌تریک","شکارچی هت‌تریک","افسانه هت‌تریک"],
    [15,50,100,250]
  ),

  ...makeLevels("braces","braces","braces",
    [5,10,25,50],
    ["دبل‌زن","متخصص دبل","دبل‌زن بزرگ","اسطوره دبل"],
    [20,40,100,200]
  ),

  ...makeLevels("dribbles","success","dribbles",
    [25,50,100,250,500],
    ["دریبل‌زن نوظهور","بازیکن تکنیکی","هنرمند دریبل","سلطان دریبل","اسطوره تکنیک"],
    [25,50,100,250,500]
  ),

  ...makeLevels("contributions","contributions","contributions",
    [100,250,500,1000,2500],
    ["بازیکن مؤثر","مهره کلیدی","ستاره تأثیرگذار","رهبر خط حمله","اسطوره تأثیرگذاری"],
    [50,100,200,400,800]
  ),

  {
    key:"rating_8_10",
    category:"performance",
    metric:"averageRating",
    target:8,
    minimumAppearances:10,
    medal:"⭐",
    title:"بازیکن ممتاز",
    award:"عملکرد عالی",
    points:100
  },

  {
    key:"rating_9_20",
    category:"performance",
    metric:"averageRating",
    target:9,
    minimumAppearances:20,
    medal:"🌟",
    title:"ستاره بی‌نظیر",
    award:"عملکرد درخشان",
    points:250
  },

  {
    key:"complete_footballer",
    category:"special",
    medal:"🏅",
    title:"فوتبالیست همه‌فن‌حریف",
    award:"نشان بازیکن کامل",
    points:300,
    condition: s =>
      s.goals >= 50 &&
      s.assists >= 25 &&
      s.appearances >= 25 &&
      s.success >= 50
  }
];

function achievementMetrics(player) {
  const stats = calculateStats(player);

  return {
    ...stats,
    contributions: stats.goals + stats.assists
  };
}

function achievementIsEarned(item, stats) {
  if (item.condition) return item.condition(stats);

  if (
    item.minimumAppearances &&
    stats.appearances < item.minimumAppearances
  ) return false;

  return Number(stats[item.metric] || 0) >= Number(item.target || 0);
}

async function unlockAchievements() {
  if (!admin) return;

  const known = new Set(
    achievements.map(a =>
      String(a.player_id) + ":" + a.achievement_key
    )
  );

  const rows = [];

  players.forEach(player => {
    const stats = achievementMetrics(player);

    ACHIEVEMENT_LEVELS.forEach(item => {
      const compound = String(player.id) + ":" + item.key;

      if (
        achievementIsEarned(item, stats) &&
        !known.has(compound)
      ) {
        rows.push({
          player_id: String(player.id),
          achievement_key: item.key
        });
      }
    });
  });

  if (rows.length) {
    const result = await db
      .from("goalscour_achievements")
      .upsert(rows, {
        onConflict:"player_id,achievement_key"
      });

    if (result.error) throw result.error;

    await load();
  }
}

function getAchievementReward(playerId) {
  const unlockedKeys = new Set(
    achievements
      .filter(a => String(a.player_id) === String(playerId))
      .map(a => a.achievement_key)
  );

  const unlocked = ACHIEVEMENT_LEVELS.filter(
    item => unlockedKeys.has(item.key)
  );

  return {
    points: unlocked.reduce(
      (sum,item) => sum + item.points, 0
    ),
    title: unlocked.length
      ? unlocked[unlocked.length - 1].title
      : "بدون عنوان افتخاری",
    unlocked
  };
}

window.gcGetAchievementReward = getAchievementReward;

function renderAchievements() {
  el("gcAchievements").innerHTML = players.map(player => {
    const stats = achievementMetrics(player);
    const reward = getAchievementReward(player.id);
    const unlockedKeys = new Set(
      reward.unlocked.map(item => item.key)
    );

    const categoryRows = ACHIEVEMENT_CATEGORIES.map(category => {
      const items = ACHIEVEMENT_LEVELS.filter(
        item => item.category === category.key
      );

      const earned = items.filter(
        item => unlockedKeys.has(item.key)
      );

      const next = items.find(
        item => !unlockedKeys.has(item.key)
      );

      return `
        <div class="gcr">
          <span>${esc(category.label)}</span>
          <b>${earned.length}/${items.length}</b>
        </div>

        ${next ? `
          <div class="gcm">
            هدف بعدی: ${esc(next.title)}
            ${next.metric && next.target
              ? " · " + Math.max(
                  0,
                  next.target - Number(stats[next.metric] || 0)
                ) + " تا رسیدن"
              : ""}
          </div>
        ` : ""}
      `;
    }).join("");

    return `
      <div class="gcc">
        <b>${esc(player.name)}</b>

        <p class="gcm">
          ${reward.unlocked.length} دستاورد دریافت‌شده
        </p>

        <div class="gcc">
          <div class="gcm">عنوان افتخاری فعلی</div>
          <h3 style="color:#b9f27c">
            ${esc(reward.title)}
          </h3>

          <div class="gcm">امتیاز ویژه افتخارات</div>
          <strong style="font-size:24px;color:#b9f27c">
            ${reward.points}
          </strong>
        </div>

        ${categoryRows}

        <div class="gcm" style="margin-top:10px">
          مدال‌های دریافت‌شده
        </div>

        <div>
          ${reward.unlocked.length
            ? reward.unlocked.map(item =>
                `<span class="gcpill">
                  ${item.medal} ${esc(item.title)}
                </span>`
              ).join("")
            : '<span class="gcm">هنوز دستاوردی دریافت نشده است.</span>'}
        </div>
      </div>
    `;
  }).join("") ||
  '<p class="gcm">بازیکنی ثبت نشده است.</p>';
}



async function render() {
  renderPeriods();

  const period = selectedPeriod();

  renderBallon(period);
  renderGoldenBoot(period);
  renderAwardRanking();
  renderHistory();
  renderDribbles();
  renderAchievements();
}

nav.addEventListener("click", event => {
  const button = event.target.closest(
    "button[data-tab='gcFeatures']"
  );

  if (!button) return;

  nav.querySelectorAll("button").forEach(item => {
    item.classList.toggle("active", item === button);
  });

  main.querySelectorAll(".section").forEach(item => {
    item.classList.toggle("active", item === section);
  });
});

el("gcPeriodSelect").addEventListener("change", async event => {
  currentPeriodId = event.target.value;
  await render();
});


section.addEventListener("submit", async event => {
  if (event.target.id !== "gcPeriodForm") return;

  try {
    await savePeriod(event);
  } catch (error) {
    status("خطا: " + error.message);
  }
});

section.addEventListener("click", async event => {
  try {
    const dribbleButton = event.target.closest("[data-dribble]");

    if (dribbleButton) {
      if (!admin) throw new Error("فقط مدیر اجازه ویرایش دارد.");

      const id = dribbleButton.dataset.dribble;

      const result = await db
        .from("goalscour_dribbles")
        .upsert({
          player_id: String(id),
          successful: n(el("gcs-" + id).value),
          unsuccessful: n(el("gcf-" + id).value),
          updated_at: new Date().toISOString()
        }, { onConflict: "player_id" });

      if (result.error) throw result.error;

      await load();
      await render();
      status("آمار دریبل ذخیره شد.");
      return;
    }

    const period = selectedPeriod();

    if (event.target.id === "gcSaveBallon") {
      if (!period) throw new Error("دوره‌ای انتخاب نشده است.");

      const list = periodNominees(period);
      const winner = el("gcBallonWinner").value;

      await saveAward(
        "ballon_dor",
        winner,
        list.map(x => String(x.player.id)),
        period
      );

      status("برنده توپ طلا ثبت شد.");
      return;
    }

    if (event.target.id === "gcSaveBoot") {
      if (!period) throw new Error("دوره‌ای انتخاب نشده است.");

      const list = goldenBootRanking(period)
        .filter(x => x.stats.officialGoals > 0);

      const winner = el("gcBootWinner").value;

      await saveAward(
        "golden_boot",
        winner,
        list.map(x => String(x.player.id)),
        period
      );

      status("برنده کفش طلا ثبت شد.");
      return;
    }

  } catch (error) {
    console.error(error);
    status("خطا: " + error.message);
  }
});

async function start() {
  try {
    admin = await checkAdmin();

    await load();
    await unlockAchievements();
    await render();
    if (typeof window.renderAll === "function") {
  window.renderAll();
    }

    status(
      admin
        ? "حالت مدیریت فعال است."
        : "حالت مشاهده عمومی فعال است."
    );

  } catch (error) {
    console.error(error);
    status("خطا در دریافت اطلاعات: " + error.message);
  }
}

start();

db.auth.onAuthStateChange(() => {
  setTimeout(start, 0);
});

})();
