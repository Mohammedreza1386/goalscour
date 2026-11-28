
(() => {
"use strict";

const db = window.supabase.createClient(
  "https://zusbebjskchgehdjvpsm.supabase.co",
  "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK"
);

if (document.getElementById("gcFeatures")) return;

const style = document.createElement("style");
style.textContent = `
#gcFeatures .gcp {
  background:#111812;
  border:1px solid #273329;
  border-radius:15px;
  padding:14px;
  margin:12px 0;
}
#gcFeatures .gcg {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
  gap:10px;
}
#gcFeatures .gcc {
  background:#0c130d;
  border:1px solid #273329;
  border-radius:12px;
  padding:12px;
}
#gcFeatures input,
#gcFeatures select {
  box-sizing:border-box;
  background:#090d0a;
  color:white;
  border:1px solid #354536;
  border-radius:8px;
  padding:10px;
  max-width:100%;
  margin:5px;
}
#gcFeatures button {
  background:#b9f27c;
  color:#10170d;
  border:0;
  border-radius:8px;
  padding:10px 13px;
  font-weight:bold;
  margin:4px;
  cursor:pointer;
}
#gcFeatures button.secondary,
#gcFeatures .gc-back {
  background:#263525;
  color:#b9f27c;
}
#gcFeatures .gcm {
  color:#89958a;
  font-size:11px;
  line-height:1.9;
}
#gcFeatures .gcr {
  display:flex;
  justify-content:space-between;
  gap:8px;
  padding:8px 0;
  border-bottom:1px solid #273329;
}
#gcFeatures .gcpill {
  display:inline-block;
  background:#263525;
  color:#b9f27c;
  border-radius:20px;
  padding:4px 9px;
  font-size:10px;
  margin:3px;
}
#gcFeatures .gcform {
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:7px;
}
#gcFeatures .gcform input {
  min-width:125px;
}
#gcFeatures .gc-period-card {
  background:#0c130d;
  border:1px solid #354536;
  border-radius:14px;
  padding:13px;
  margin:8px 0;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}
#gcFeatures .gc-period-empty {
  padding:14px;
  border:1px dashed #40513d;
  border-radius:12px;
  color:#89958a;
}
#gcFeatures .gc-award-card {
  cursor:pointer;
  transition:.2s;
}
#gcFeatures .gc-award-card:hover {
  border-color:#b9f27c;
  transform:translateY(-2px);
}
#gcFeatures .gc-award-icon {
  font-size:32px;
}
#gcFeatures [hidden] {
  display:none!important;
}
#gcFeatures .gc-winner {
  border:1px solid #b9f27c;
  background:#172317;
  border-radius:12px;
  padding:13px;
  margin:10px 0;
}
#gcFeatures .gc-admin-form {
  display:grid;
  gap:8px;
}
#gcFeatures .gc-admin-form input,
#gcFeatures .gc-admin-form select {
  width:100%;
  min-height:42px;
}
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
  <h2>🏆 جوایز و آمار بازیکنان Goalscour</h2>

  <div id="gcFeaturesHome">

    <div class="gcp">
      <h3>👑 سه اسطوره برتر تاریخ Goalscour</h3>
      <p class="gcm">
        رتبه‌بندی براساس عملکرد و افتخارات تمام‌دوره بازیکنان
      </p>
      <div id="gcLegendsTop3" class="gcg"></div>
    </div>

    <div class="gcp">
      <h3>🏆 فهرست جوایز مستقل</h3>
      <p class="gcm">
        هر جایزه صفحه، دوره‌ها، رتبه‌بندی و برنده مستقل خودش را دارد.
      </p>
      <div id="gcAwardTypesGrid" class="gcg"></div>
      <div id="gcAwardTypeAdmin"></div>
    </div>

    <div class="gcp">
      <h3>رتبه‌بندی کلی جوایز</h3>
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
      <h3>مدال‌ها و دستاوردهای بازیکنان</h3>
      <p class="gcm">
        دستاوردهای بازیکنان براساس آمار ثبت‌شده محاسبه می‌شوند.
      </p>
      <div id="gcAchievements" class="gcg"></div>
    </div>

  </div>

  <div id="gcAwardDetail" class="gcp" hidden>
    <button type="button" class="gc-back" id="gcBackAwards">
      ← بازگشت به فهرست جوایز
    </button>

    <h2 id="gcAwardDetailTitle"></h2>
    <p id="gcAwardDetailDescription" class="gcm"></p>

    <div id="gcPeriodAdmin"></div>
    <div id="gcPeriodCards"></div>

    <div id="gcPeriodDetail" class="gcp" hidden>
      <button type="button" class="gc-back" id="gcBackPeriods">
        ← بازگشت به دوره‌های این جایزه
      </button>

      <h2 id="gcPeriodDetailTitle"></h2>
      <p id="gcPeriodDetailMeta" class="gcm"></p>

      <div class="gcp">
        <h3 id="gcDynamicRankingTitle">رتبه‌بندی بازیکنان</h3>
        <div id="gcDynamicRanking" class="gcg"></div>
      </div>

      <div class="gcp">
        <h3 id="gcDynamicWinnerHeading">🏆 انتخاب برنده</h3>
        <div id="gcDynamicWinner"></div>
        <div id="gcDynamicWinnerResult"></div>
      </div>
    </div>
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
let awardTypes = [];

let currentAwardTypeId = "";
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
  const box = el("gcFeatureStatus");
  if (box) box.textContent = message || "";
}

function inRange(date, period) {
  if (!date || !period) return false;

  const d = String(date).slice(0, 10);

  return (
    d >= String(period.start_date).slice(0, 10) &&
    d <= String(period.end_date).slice(0, 10)
  );
}

function matchKey(date, opponent) {
  return String(date || "").slice(0, 10) + "|" +
    String(opponent || "").trim().toLowerCase();
}

async function checkAdmin() {
  const sessionResult = await db.auth.getSession();
  const user = sessionResult.data?.session?.user;

  if (!user) return false;

  const result = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return !result.error && !!result.data;
}

async function load() {
  const results = await Promise.all([
    db.from("goalscour_players").select("*"),
    db.from("goalscour_matches").select("*"),
    db.from("goalscour_unofficial").select("*"),
    db.from("goalscour_dribbles").select("*"),
    db.from("goalscour_awards")
      .select("*")
      .order("created_at", {ascending:false}),
    db.from("goalscour_achievements").select("*"),
    db.from("goalscour_periods")
      .select("*")
      .order("created_at", {ascending:false}),
    db.from("goalscour_match_events").select("*"),
    db.from("goalscour_match_performances").select("*"),
    db.from("goalscour_award_types")
      .select("*")
      .order("created_at", {ascending:true})
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
  awardTypes = results[9].data || [];

  const parsed = parseHash();

  currentAwardTypeId = parsed.awardTypeId || "";
  currentPeriodId = parsed.periodId || "";

  if (
    currentAwardTypeId &&
    !awardTypes.some(x => String(x.id) === currentAwardTypeId)
  ) {
    currentAwardTypeId = "";
  }

  if (
    currentPeriodId &&
    !periods.some(x => String(x.id) === currentPeriodId)
  ) {
    currentPeriodId = "";
  }
}

function parseHash() {
  const raw = String(location.hash || "").replace(/^#/, "");

  if (!raw.startsWith("gc-award=")) {
    return {awardTypeId:"", periodId:""};
  }

  const parts = raw.split("&");
  const awardPart = parts.find(x => x.startsWith("gc-award="));
  const periodPart = parts.find(x => x.startsWith("period="));

  return {
    awardTypeId: awardPart
      ? decodeURIComponent(awardPart.slice("gc-award=".length))
      : "",
    periodId: periodPart
      ? decodeURIComponent(periodPart.slice("period=".length))
      : ""
  };
}

function setAwardHash(awardTypeId, periodId = "") {
  let hash = "gc-award=" + encodeURIComponent(awardTypeId);

  if (periodId) {
    hash += "&period=" + encodeURIComponent(periodId);
  }

  location.hash = hash;
}

function getAwardType(id) {
  return awardTypes.find(x => String(x.id) === String(id)) || null;
}

function getPeriod(id) {
  return periods.find(x => String(x.id) === String(id)) || null;
}

function selectedPeriod() {
  return getPeriod(currentPeriodId);
}

function selectedAwardType() {
  return getAwardType(currentAwardTypeId);
}
  function calculateStats(player, period = null) {
  const id = String(player.id);

  
  // آمار کلی از موتور مشترک گل‌اسکور
  if (
    !period &&
    typeof window.gcGetUnifiedStats === "function"
  ) {
    const unified = window.gcGetUnifiedStats(player.id);

    const dribble = dribbles.find(
      x => String(x.player_id) === id
    ) || {};

    return {
      officialGoals: unified.officialGoals,
    
      unofficialGoals: unified.unofficialGoals,
      goals: unified.totalGoals,

      assists: unified.totalAssists,

      hatTricks: unified.hatTricks,
      perfectHatTricks: Number(unified.perfectHatTricks || 0),
      braces: unified.braces,

      appearances: unified.appearances,
      ratingTotal: unified.totalRating,
      averageRating: unified.averageRating,

      success: n(dribble.successful),
      fail: n(dribble.unsuccessful)
    };
  }
    

  const eventsInRange = matchEvents.filter(event =>
    !period || inRange(event.match_date, period)
  );

  const ratedKeys = new Set(
    eventsInRange.map(event =>
      matchKey(event.match_date, event.opponent)
    )
  );

  const oldMatches = matches.filter(match => {
    if (period && !inRange(match.match_date, period)) {
      return false;
    }

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

  const perfectHatTricks =
    oldScored.filter(x =>
      n(x.right_foot_goals) >= 1 &&
      n(x.left_foot_goals) >= 1 &&
      n(x.headed_goals) >= 1
    ).length +
    ratedRows.filter(x =>
      n(x.goals) >= 3 &&
      n(x.right_foot_goals) >= 1 &&
      n(x.left_foot_goals) >= 1 &&
      n(x.headed_goals) >= 1
    ).length;

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
    perfectHatTricks,
    braces,
    appearances,
    ratingTotal,
    averageRating: appearances ? ratingTotal / appearances : 0,
    success: n(dribble.successful),
    fail: n(dribble.unsuccessful)
  };
}

function getAchievementReward(playerId) {
  const levels = [
    {key:"goals_100", title:"گلزن صدتایی", points:100, medal:"🥉"},
    {key:"goals_250", title:"گلزن حرفه‌ای", points:250, medal:"🥈"},
    {key:"goals_500", title:"گلزن افسانه‌ای", points:500, medal:"🥇"},
    {key:"goals_1000", title:"اسطوره Goalscour", points:1000, medal:"💎"}
  ];

  const unlockedKeys = new Set(
    achievements
      .filter(a => String(a.player_id) === String(playerId))
      .map(a => a.achievement_key)
  );

  const unlocked = levels.filter(
    item => unlockedKeys.has(item.key)
  );

  return {
    points: unlocked.reduce((sum, x) => sum + x.points, 0),
    title: unlocked.length
      ? unlocked[unlocked.length - 1].title
      : "بدون عنوان افتخاری",
    unlocked
  };
}

window.gcGetAchievementReward = getAchievementReward;

async function unlockAchievements() {
  if (!admin) return;

  const levels = [100, 250, 500, 1000];

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
          player_id: String(player.id),
          achievement_key: key
        });
      }
    });
  });

  if (!rows.length) return;

  const result = await db
    .from("goalscour_achievements")
    .upsert(rows, {
      onConflict:"player_id,achievement_key"
    });

  if (result.error) throw result.error;

  achievements = [
    ...achievements,
    ...rows
  ];
}

function metricValue(stats, metricKey) {
  const map = {
    goals: stats.officialGoals,
    official_goals: stats.officialGoals,
    total_goals: stats.goals,
    assists: stats.assists,
    hat_tricks: stats.hatTricks,
    perfect_hat_tricks: stats.perfectHatTricks,
    appearances: stats.appearances,
    average_rating: stats.averageRating,
    dribbles: stats.success,
    contributions: stats.goals + stats.assists,
    ballon_score:
      stats.goals * 1.4 +
      stats.assists * 1.2 +
      stats.hatTricks * 2 +
      stats.perfectHatTricks * 3 +
      stats.averageRating * 0.8
  };

  return Number(map[metricKey] ?? stats.officialGoals ?? 0);
}

function metricLabel(metricKey) {
  const map = {
    goals:"گل رسمی",
    official_goals:"گل رسمی",
    total_goals:"مجموع گل",
    assists:"پاس گل",
    hat_tricks:"هت‌تریک",
    perfect_hat_tricks:"پرفکت هت‌تریک",
    appearances:"تعداد بازی",
    average_rating:"میانگین امتیاز",
    dribbles:"دریبل موفق",
    contributions:"مجموع گل و پاس گل",
    ballon_score:"امتیاز عملکرد"
  };

  return map[metricKey] || "امتیاز";
}

function rankingForAward(type, period) {
  const metric = type?.metric_key || "official_goals";

  return players.map(player => {
    const stats = calculateStats(player, period);

    return {
      player,
      stats,
      value: metricValue(stats, metric)
    };
  }).sort((a, b) =>
    b.value - a.value ||
    b.stats.assists - a.stats.assists ||
    b.stats.appearances - a.stats.appearances
  );
}

function periodAward(periodId, awardTypeId) {
  return awards.find(a =>
    String(a.period_id) === String(periodId) &&
    String(a.award_type) === String(awardTypeId) &&
    a.status === "awarded"
  ) || null;
}

function awardWinner(award) {
  if (!award) return null;

  return players.find(p =>
    String(p.id) === String(award.winner_player_id)
  ) || null;
}

function renderLegendsRanking() {
  const box = el("gcLegendsTop3");
  if (!box) return;

  const ranking = players.map(player => {
    const stats = calculateStats(player);
    const awardPoints = awards
      .filter(a =>
        String(a.winner_player_id) === String(player.id)
      )
      .reduce((sum, a) =>
        sum + Number(a.award_points || 0), 0);

    const achievementPoints =
      getAchievementReward(player.id).points;

    const score =
      stats.officialGoals * 3 +
      stats.assists * 2 +
      stats.unofficialGoals +
      stats.hatTricks * 5 +
      awardPoints +
      achievementPoints;

    return {player, stats, score};
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);

  const medals = ["🥇", "🥈", "🥉"];

  box.innerHTML = ranking.map((item, index) => `
    <div class="gcc">
      <span class="gcpill">
        ${medals[index]} رتبه ${index + 1}
      </span>

      <h3>${esc(item.player.name)}</h3>

      <div class="gcr">
        <span>گل رسمی</span>
        <b>${item.stats.officialGoals}</b>
      </div>

      <div class="gcr">
        <span>پاس گل</span>
        <b>${item.stats.assists}</b>
      </div>

      <div class="gcr">
        <span>گل غیررسمی</span>
        <b>${item.stats.unofficialGoals}</b>
      </div>

      <div class="gcr">
        <span>امتیاز کل</span>
        <b>${item.score}</b>
      </div>
    </div>
  `).join("") ||
  '<p class="gcm">هنوز بازیکنی ثبت نشده است.</p>';
}

function renderAwardRanking() {
  const box = el("gcAwardRanking");
  if (!box) return;

  const totals = new Map();

  awards.forEach(award => {
    if (!award.winner_player_id) return;

    const id = String(award.winner_player_id);

    if (!totals.has(id)) {
      totals.set(id, {
        count:0,
        points:0
      });
    }

    const item = totals.get(id);
    item.count++;
    item.points += Number(award.award_points || 0);
  });

  const ranking = players.map(player => ({
    player,
    total: totals.get(String(player.id)) || {
      count:0,
      points:0
    }
  })).sort((a, b) =>
    b.total.points - a.total.points ||
    b.total.count - a.total.count
  );

  box.innerHTML = ranking.map((item, index) => `
    <div class="gcr">
      <span>${index + 1}. ${esc(item.player.name)}</span>
      <b>${item.total.count} جایزه</b>
    </div>
    <p class="gcm">
      امتیاز جوایز: ${item.total.points}
    </p>
  `).join("") ||
  '<p class="gcm">هنوز جایزه‌ای ثبت نشده است.</p>';
}

function renderHistory() {
  const box = el("gcAwardsHistory");
  if (!box) return;

  const sorted = awards.slice().sort((a, b) =>
    String(b.awarded_at || b.created_at || "").localeCompare(
      String(a.awarded_at || a.created_at || "")
    )
  );

  box.innerHTML = sorted.map(award => {
    const winner = awardWinner(award);
    const type = getAwardType(award.award_type);
    const period = getPeriod(award.period_id);

    const title = type
      ? `${type.icon || "🏆"} ${type.title}`
      
      : (award.award_name || award.award_type || "جایزه");

    return `
      <div class="gcr">
        <span>
          ${esc(period?.title || award.season || "دوره قدیمی")}
          · ${esc(title)}
        </span>
        <b>${esc(winner?.name || "بازیکن نامشخص")}</b>
      </div>
    `;
  }).join("") ||
  '<p class="gcm">هنوز جایزه‌ای ثبت نشده است.</p>';
}

function renderDribbles() {
  const box = el("gcDribbles");
  if (!box) return;

  box.innerHTML = players.map(player => {
    const stats = calculateStats(player);

    return `
      <div class="gcc">
        <b>${esc(player.name)}</b>

        <div class="gcr">
          <span>دریبل موفق</span>
          <b>${stats.success}</b>
        </div>

        <div class="gcr">
          <span>دریبل ناموفق</span>
          <b>${stats.fail}</b>
        </div>

        <div class="gcr">
          <span>مجموع</span>
          <b>${stats.success + stats.fail}</b>
        </div>

        ${admin ? `
          <input
            id="gcs-${esc(player.id)}"
            type="number"
            min="0"
            value="${stats.success}"
          >

          <input
            id="gcf-${esc(player.id)}"
            type="number"
            min="0"
            value="${stats.fail}"
          >

          <button data-dribble="${esc(player.id)}">
            ذخیره دریبل
          </button>
        ` : ""}
      </div>
    `;
  }).join("") ||
  '<p class="gcm">بازیکنی ثبت نشده است.</p>';
}

function renderAchievements() {
  const box = el("gcAchievements");
  if (!box) return;

  box.innerHTML = players.map(player => {
    const reward = getAchievementReward(player.id);

    return `
      <div class="gcc">
        <b>${esc(player.name)}</b>

        <p class="gcm">
          ${reward.unlocked.length} دستاورد دریافت‌شده
        </p>

        <h3 style="color:#b9f27c">
          ${esc(reward.title)}
        </h3>

        <div class="gcr">
          <span>امتیاز افتخارات</span>
          <b>${reward.points}</b>
        </div>

        <div>
          ${reward.unlocked.length
            ? reward.unlocked.map(item => `
                <span class="gcpill">
                  ${item.medal} ${esc(item.title)}
                </span>
              `).join("")
            : '<span class="gcm">هنوز دستاوردی دریافت نشده است.</span>'}
        </div>
      </div>
    `;
  }).join("") ||
  '<p class="gcm">بازیکنی ثبت نشده است.</p>';
}
  function renderAwardTypes() {
  const box = el("gcAwardTypesGrid");
  if (!box) return;

  box.innerHTML = awardTypes.map(type => {
    const count = periods.filter(p =>
      String(p.award_type) === String(type.id)
    ).length;

    const winnerCount = awards.filter(a =>
      String(a.award_type) === String(type.id) &&
      a.status === "awarded"
    ).length;

    return `
      <div
        class="gcc gc-award-card"
        data-open-award="${esc(type.id)}"
      >
        <div class="gc-award-icon">
          ${esc(type.icon || "🏆")}
        </div>

        <h3>${esc(type.title)}</h3>

        <p class="gcm">
          ${esc(type.description || "صفحه اختصاصی این جایزه")}
        </p>

        <div class="gcr">
          <span>تعداد دوره‌ها</span>
          <b>${count}</b>
        </div>

        <div class="gcr">
          <span>جوایز اهداشده</span>
          <b>${winnerCount}</b>
        </div>

        <button type="button">
          ورود به صفحه جایزه ←
        </button>
      </div>
    `;
  }).join("") ||
  '<p class="gc-period-empty">هنوز جایزه‌ای ساخته نشده است.</p>';

  renderAwardTypeAdmin();
}

function renderAwardTypeAdmin() {
  const box = el("gcAwardTypeAdmin");
  if (!box) return;

  if (!admin) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <div class="gcp">
      <h3>➕ ساخت جایزه جدید</h3>

      <form id="gcAwardTypeForm" class="gc-admin-form">
        <input
          id="gcNewAwardTitle"
          placeholder="نام جایزه؛ مثلاً بهترین بازیکن فصل"
          required
        >

        <input
          id="gcNewAwardIcon"
          placeholder="آیکون جایزه"
          value="🏆"
        >

        <input
          id="gcNewAwardDescription"
          placeholder="توضیحات جایزه"
        >

        <label class="gcm">معیار رتبه‌بندی</label>

        <select id="gcNewAwardMetric">
          <option value="official_goals">گل رسمی</option>
          <option value="total_goals">مجموع گل</option>
          <option value="assists">پاس گل</option>
          <option value="hat_tricks">هت‌تریک</option>
          <option value="perfect_hat_tricks">پرفکت هت‌تریک</option>
          <option value="appearances">تعداد بازی</option>
          <option value="average_rating">میانگین امتیاز</option>
          <option value="dribbles">دریبل موفق</option>
          <option value="contributions">مجموع گل و پاس گل</option>
          <option value="ballon_score">امتیاز عملکرد</option>
        </select>

        <button type="submit">
          ساخت صفحه مستقل جایزه
        </button>
      </form>
    </div>
  `;
}

function renderAwardDetail() {
  const home = el("gcFeaturesHome");
  const detail = el("gcAwardDetail");
  const periodDetail = el("gcPeriodDetail");

  const type = selectedAwardType();

  if (!type) {
    home.hidden = false;
    detail.hidden = true;
    return;
  }

  home.hidden = true;
  detail.hidden = false;

  el("gcAwardDetailTitle").textContent =
    `${type.icon || "🏆"} ${type.title}`;

  el("gcAwardDetailDescription").textContent =
    type.description || "صفحه اختصاصی این جایزه در Goalscour";

  periodDetail.hidden = !currentPeriodId;

  renderPeriodAdmin(type);
  renderPeriodsForAward(type);

  if (currentPeriodId) {
    const period = selectedPeriod();

    if (period && String(period.award_type) === String(type.id)) {
      renderPeriodDetail(type, period);
    } else {
      currentPeriodId = "";
      periodDetail.hidden = true;
    }
  }
}

function renderPeriodAdmin(type) {
  const box = el("gcPeriodAdmin");
  if (!box) return;

  if (!admin) {
    box.innerHTML = `
      <p class="gcm">
        ساخت دوره برای این جایزه فقط در دسترس مدیر است.
      </p>
    `;
    return;
  }

  box.innerHTML = `
    <div class="gcp">
      <h3>➕ ساخت دوره برای ${esc(type.title)}</h3>

      <form id="gcAwardPeriodForm" class="gcform">
        <input
          id="gcNewPeriodTitle"
          placeholder="نام دوره؛ مثلاً فصل ۱۴۰۵"
          required
        >

        <label>شروع:</label>
        <input id="gcNewPeriodStart" type="date" required>

        <label>پایان:</label>
        <input id="gcNewPeriodEnd" type="date" required>

        <button type="submit">ساخت دوره</button>
      </form>
    </div>
  `;
}

function renderPeriodsForAward(type) {
  const box = el("gcPeriodCards");
  if (!box) return;

  const list = periods.filter(p =>
    String(p.award_type) === String(type.id)
  );

  box.innerHTML = `
    <div class="gcp">
      <h3>دوره‌های ${esc(type.title)}</h3>

      ${list.length ? list.map(period => {
        const award = periodAward(period.id, type.id);
        const winner = awardWinner(award);

        return `
          <div class="gc-period-card">
            <div>
              <b>${esc(period.title)}</b>

              <div class="gcm">
                ${esc(period.start_date)}
                تا
                ${esc(period.end_date)}
              </div>

              <span class="gcpill">
                ${esc(period.status || "ثبت‌شده")}
              </span>

              ${winner ? `
                <div class="gcm">
                  🏆 برنده: ${esc(winner.name)}
                </div>
              ` : ""}
            </div>

            <button
              type="button"
              data-open-period="${esc(period.id)}"
            >
              مشاهده دوره ←
            </button>
          </div>
        `;
      }).join("") : `
        <div class="gc-period-empty">
          هنوز دوره‌ای برای این جایزه ساخته نشده است.
        </div>
      `}
    </div>
  `;
}

function renderPeriodDetail(type, period) {
  el("gcPeriodDetail").hidden = false;

  el("gcPeriodDetailTitle").textContent =
    `${type.icon || "🏆"} ${type.title} · ${period.title}`;

  el("gcPeriodDetailMeta").textContent =
    `${period.start_date} تا ${period.end_date} · وضعیت: ${period.status || "ثبت‌شده"}`;

  el("gcDynamicRankingTitle").textContent =
    `رتبه‌بندی ${type.title} در ${period.title}`;

  el("gcDynamicWinnerHeading").textContent =
    `🏆 انتخاب برنده ${type.title}`;

  renderDynamicRanking(type, period);
  renderDynamicWinner(type, period);
}

function renderDynamicRanking(type, period) {
  const box = el("gcDynamicRanking");
  const ranking = rankingForAward(type, period);

  const label = metricLabel(type.metric_key);

  box.innerHTML = ranking.map((item, index) => `
    <div class="gcc">
      <span class="gcpill">
        رتبه ${index + 1}
      </span>

      <h3>${esc(item.player.name)}</h3>

      <div class="gcr">
        <span>${esc(label)}</span>
        <b>${Number(item.value.toFixed(2))}</b>
      </div>

      <div class="gcr">
        <span>گل رسمی</span>
        <b>${item.stats.officialGoals}</b>
      </div>

      <div class="gcr">
        <span>گل غیررسمی</span>
        <b>${item.stats.unofficialGoals}</b>
      </div>

      <div class="gcr">
        <span>پاس گل</span>
        <b>${item.stats.assists}</b>
      </div>

      <div class="gcr">
        <span>هت‌تریک</span>
        <b>${item.stats.hatTricks}</b>
      </div>

      <div class="gcr">
        <span>پرفکت هت‌تریک</span>
        <b>${item.stats.perfectHatTricks || 0}</b>
      </div>

      <div class="gcr">
        <span>تعداد بازی</span>
        
        <b>${item.stats.appearances}</b>
      </div>

      <div class="gcr">
        <span>میانگین امتیاز</span>
        <b>${item.stats.averageRating.toFixed(2)}</b>
      </div>
    </div>
  `).join("") ||
  '<p class="gcm">بازیکنی برای رتبه‌بندی وجود ندارد.</p>';
}

function renderDynamicWinner(type, period) {
  const box = el("gcDynamicWinner");
  const resultBox = el("gcDynamicWinnerResult");

  const existing = periodAward(period.id, type.id);
  const winner = awardWinner(existing);

  if (winner) {
    resultBox.innerHTML = `
      <div class="gc-winner">
        <span class="gcpill">برنده ثبت‌شده</span>
        <h3>🏆 ${esc(winner.name)}</h3>
        <p class="gcm">
          ${esc(type.title)} · ${esc(period.title)}
        </p>
      </div>
    `;
  } else {
    resultBox.innerHTML = `
      <p class="gcm">
        هنوز برنده‌ای برای این دوره ثبت نشده است.
      </p>
    `;
  }

  if (!admin) {
    box.innerHTML = "";
    return;
  }

  const ranking = rankingForAward(type, period);

  if (!ranking.length) {
    box.innerHTML = `
      <p class="gcm">
        هنوز بازیکنی برای انتخاب برنده وجود ندارد.
      </p>
    `;
    return;
  }

  box.innerHTML = `
    <div class="gcp">
      <label>انتخاب بازیکن برنده</label>

      <select id="gcDynamicWinnerSelect">
        ${ranking.map(item => `
          <option
            value="${esc(item.player.id)}"
            ${String(winner?.id) === String(item.player.id) ? "selected" : ""}
          >
            ${esc(item.player.name)}
            · ${Number(item.value.toFixed(2))}
          </option>
        `).join("")}
      </select>

      <button
        type="button"
        id="gcDynamicSaveWinner"
      >
        ثبت برنده ${esc(type.title)}
      </button>
    </div>
  `;
}

async function createAwardType(event) {
  event.preventDefault();

  if (!admin) {
    throw new Error("فقط مدیر اجازه ساخت جایزه دارد.");
  }

  const title = el("gcNewAwardTitle").value.trim();
  const icon = el("gcNewAwardIcon").value.trim() || "🏆";
  const description = el("gcNewAwardDescription").value.trim();
  const metricKey = el("gcNewAwardMetric").value;

  if (!title) {
    throw new Error("نام جایزه را وارد کن.");
  }

  const session = await db.auth.getSession();
  const user = session.data?.session?.user;

  const id = "award_" +
    crypto.randomUUID().replace(/-/g, "");

  const result = await db
    .from("goalscour_award_types")
    .insert({
      id,
      title,
      icon,
      description,
      metric_key:metricKey,
      created_by:user?.id || null
    });

  if (result.error) throw result.error;

  await load();

  currentAwardTypeId = id;
  currentPeriodId = "";

  setAwardHash(id);

  status("جایزه جدید ساخته شد و صفحه اختصاصی آن ایجاد شد.");
  await render();
}

async function createAwardPeriod(event) {
  event.preventDefault();

  if (!admin) {
    throw new Error("فقط مدیر اجازه ساخت دوره دارد.");
  }

  const type = selectedAwardType();

  if (!type) {
    throw new Error("نوع جایزه انتخاب نشده است.");
  }

  const title = el("gcNewPeriodTitle").value.trim();
  const start = el("gcNewPeriodStart").value;
  const end = el("gcNewPeriodEnd").value;

  if (!title || !start || !end) {
    throw new Error("نام و تاریخ شروع و پایان را وارد کن.");
  }

  if (end < start) {
    throw new Error("تاریخ پایان نمی‌تواند قبل از شروع باشد.");
  }

  const session = await db.auth.getSession();
  const user = session.data?.session?.user;

  const id = "period-" + crypto.randomUUID();

  const result = await db
    .from("goalscour_periods")
    .insert({
      id,
      title,
      start_date:start,
      end_date:end,
      status:"active",
      award_type:type.id,
      created_by:user?.id || null
    });

  if (result.error) throw result.error;

  await load();

  currentAwardTypeId = type.id;
  currentPeriodId = "";

  setAwardHash(type.id);

  status(`دوره جدید برای ${type.title} ساخته شد.`);
  await render();
}

async function saveDynamicWinner() {
  if (!admin) {
    throw new Error("فقط مدیر اجازه ثبت برنده دارد.");
  }

  const type = selectedAwardType();
  const period = selectedPeriod();

  if (!type || !period) {
    throw new Error("جایزه یا دوره انتخاب نشده است.");
  }

  const winnerId = el("gcDynamicWinnerSelect")?.value;

  if (!winnerId) {
    throw new Error("بازیکن برنده را انتخاب کن.");
  }

  const ranking = rankingForAward(type, period);

  const candidateIds = ranking.map(item =>
    String(item.player.id)
  );

  const id = "period-award-" +
    String(type.id) + "-" + String(period.id);

  const payload = {
    id,
    award_type:String(type.id),
    season:"period:" + String(period.id),
    period_id:String(period.id),
    candidate_player_ids:candidateIds,
    winner_player_id:String(winnerId),
    status:"awarded",
    awarded_at:new Date().toISOString()
  };

  const result = await db
    .from("goalscour_awards")
    .upsert(payload, {onConflict:"id"});

  if (result.error) throw result.error;

  await load();

  currentAwardTypeId = type.id;
  currentPeriodId = period.id;

  setAwardHash(type.id, period.id);

  status(`برنده ${type.title} با موفقیت ثبت شد.`);
  await render();
}
  async function saveDribble(button) {
  if (!admin) {
    throw new Error("فقط مدیر اجازه ویرایش دارد.");
  }

  const id = String(button.dataset.dribble);

  const successInput = el("gcs-" + id);
  const failInput = el("gcf-" + id);

  if (!successInput || !failInput) {
    throw new Error("فیلدهای دریبل پیدا نشدند.");
  }

  const result = await db
    .from("goalscour_dribbles")
    .upsert({
      player_id:id,
      successful:n(successInput.value),
      unsuccessful:n(failInput.value),
      updated_at:new Date().toISOString()
    }, {
      onConflict:"player_id"
    });

  if (result.error) throw result.error;

  await load();
  await render();

  status("آمار دریبل ذخیره شد.");
}

async function render() {
  renderLegendsRanking();
  renderAwardTypes();
  renderAwardRanking();
  renderHistory();
  renderDribbles();
  renderAchievements();
  renderAwardDetail();
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

section.addEventListener("click", async event => {
  try {
    const openAward = event.target.closest("[data-open-award]");

    if (openAward) {
      currentAwardTypeId = String(
        openAward.dataset.openAward
      );

      currentPeriodId = "";

      setAwardHash(currentAwardTypeId);
      await render();
      return;
    }

    const openPeriod = event.target.closest("[data-open-period]");

    if (openPeriod) {
      const period = getPeriod(openPeriod.dataset.openPeriod);

      if (!period) {
        throw new Error("دوره موردنظر پیدا نشد.");
      }

      currentAwardTypeId = String(period.award_type);
      currentPeriodId = String(period.id);

      setAwardHash(currentAwardTypeId, currentPeriodId);
      await render();
      return;
    }

    if (event.target.closest("#gcBackAwards")) {
      currentAwardTypeId = "";
      currentPeriodId = "";

      location.hash = "";
      await render();
      return;
    }

    if (event.target.closest("#gcBackPeriods")) {
      currentPeriodId = "";

      if (currentAwardTypeId) {
        setAwardHash(currentAwardTypeId);
      } else {
        location.hash = "";
      }

      await render();
      return;
    }

    if (event.target.closest("#gcDynamicSaveWinner")) {
      await saveDynamicWinner();
      return;
    }

    const dribbleButton = event.target.closest("[data-dribble]");

    if (dribbleButton) {
      await saveDribble(dribbleButton);
      return;
    }

  } catch (error) {
    console.error(error);
    status("خطا: " + (error.message || "مشکل نامشخص"));
  }
});

document.addEventListener("submit", async event => {
  try {
    if (event.target.id === "gcAwardTypeForm") {
      await createAwardType(event);
      return;
    }

    if (event.target.id === "gcAwardPeriodForm") {
      await createAwardPeriod(event);
      return;
    }

  } catch (error) {
    console.error(error);
    status("خطا: " + (error.message || "مشکل نامشخص"));
  }
});

window.addEventListener("hashchange", async () => {
  try {
    const parsed = parseHash();

    currentAwardTypeId = parsed.awardTypeId;
    currentPeriodId = parsed.periodId;

    await render();
  } catch (error) {
    console.error(error);
    status("خطا در بازکردن صفحه جایزه: " + error.message);
  }
});

async function start() {
  try {
    admin = await checkAdmin();

    await load();
    await unlockAchievements();
    await render();

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

window.gcRefreshFeatures = start;
window.gcRefreshAchievements = start;

if (
  typeof window.renderAll === "function" &&
  !window.__gcFeaturesRenderWrapped
) {
  const originalRenderAll = window.renderAll;

  window.renderAll = function (...args) {
    const result = originalRenderAll.apply(this, args);

    clearTimeout(window.__gcFeaturesRefreshTimer);

    window.__gcFeaturesRefreshTimer = setTimeout(() => {
      start();
    }, 350);

    return result;
  };

  window.__gcFeaturesRenderWrapped = true;
}

start();

db.auth.onAuthStateChange(() => {
  setTimeout(start, 0);
});

})();
