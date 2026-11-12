(() => {
"use strict";

const db = window.supabase.createClient(
  "https://zusbebjskchgehdjvpsm.supabase.co",
  "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvm"
);

const css = `
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
#gcFeatures input,#gcFeatures select {
  background:#090d0a;
  color:white;
  border:1px solid #273329;
  border-radius:8px;
  padding:9px;
  max-width:100%;
  margin:5px;
}
#gcFeatures button {
  background:#b9f27c;
  color:#10170d;
  border:0;
  border-radius:8px;
  padding:9px;
  font-weight:bold;
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
  padding:7px 0;
  border-bottom:1px solid #273329;
}
#gcFeatures .gcpill {
  display:inline-block;
  background:#263525;
  color:#b9f27c;
  border-radius:20px;
  padding:4px 8px;
  font-size:10px;
  margin:3px;
}
`;

const st = document.createElement("style");
st.textContent = css;
document.head.appendChild(st);

const main = document.querySelector("main");
const nav = main && main.querySelector("nav");

if (!main || !nav || document.getElementById("gcFeatures")) return;

const tab = document.createElement("button");
tab.type = "button";
tab.dataset.tab = "gcFeatures";
tab.textContent = "جوایز و دریبل";
nav.appendChild(tab);

const section = document.createElement("section");
section.id = "gcFeatures";
section.className = "section";

section.innerHTML = `
  <h2>قابلیت‌های جدید Goalscour</h2>

  <div class="gcp">
    <h3>دریبل‌های بازیکنان</h3>
    <p class="gcm">
      ثبت مجموع دریبل‌های موفق و ناموفق برای هر بازیکن.
    </p>
    <div id="gcDribbles" class="gcg">در حال دریافت...</div>
  </div>

  <div class="gcp">
    <h3>توپ طلای Goalscour</h3>
    <p class="gcm">
      سیستم پنج نامزد را بر اساس آمار پیشنهاد می‌کند
      و مدیر برنده نهایی را انتخاب می‌کند.
    </p>
    <div id="gcBallon" class="gcg"></div>
    <div id="gcAwardAdmin"></div>
    <div id="gcAwardsHistory"></div>
  </div>

  <div class="gcp">
    <h3>مدال دستاورد گلزنی</h3>
    <p class="gcm">
      مدال‌های ۱۰۰، ۲۵۰، ۵۰۰ و ۱۰۰۰ گل
      به‌صورت خودکار باز می‌شوند.
    </p>
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

async function checkAdmin() {
  const result = await db.auth.getSession();
  const user = result.data &&
    result.data.session &&
    result.data.session.user;

  if (!user) return false;

  const adminResult = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return !adminResult.error && !!adminResult.data;
}

async function load() {
  const queries = await Promise.all([
    db.from("goalscour_players").select("*"),
    db.from("goalscour_matches").select("*"),
    db.from("goalscour_unofficial").select("*"),
    db.from("goalscour_dribbles").select("*"),
    db.from("goalscour_awards")
      .select("*")
      .order("created_at", { ascending:false }),
    db.from("goalscour_achievements").select("*")
  ]);

  queries.forEach(query => {
    if (query.error) throw query.error;
  });

  players = queries[0].data || [];
  matches = queries[1].data || [];
  unofficial = queries[2].data || [];
  dribbles = queries[3].data || [];
  awards = queries[4].data || [];
  achievements = queries[5].data || [];
}

function stats(player) {
  const id = String(player.id);

  const officialMatches = matches.filter(
    x => String(x.scorer_id) === id
  );

  const unofficialRecords = unofficial.filter(
    x => String(x.player_id) === id
  );

  const assists =
    matches
      .filter(x => String(x.assister_id) === id)
      .reduce((sum, x) => sum + n(x.assists), 0) +
    unofficialRecords.reduce(
      (sum, x) => sum + n(x.assists), 0
    );

  const dribble = dribbles.find(
    x => String(x.player_id) === id
  ) || {};

  return {
    goals:
      officialMatches.reduce(
        (sum, x) => sum + n(x.goals), 0
      ) +
      unofficialRecords.reduce(
        (sum, x) => sum + n(x.goals), 0
      ),

    assists,

    hat: officialMatches.filter(
      x => n(x.goals) >= 3
    ).length,

    success: n(dribble.successful),
    fail: n(dribble.unsuccessful)
  };
}

function nominees() {
  return players
    .map(player => ({
      player,
      stats: stats(player)
    }))
    .sort((a, b) => {
      const scoreA =
        a.stats.goals * 1.4 +
        a.stats.assists * 1.2 +
        a.stats.hat * 2 +
        a.stats.success * 0.15;

      const scoreB =
        b.stats.goals * 1.4 +
        b.stats.assists * 1.2 +
        b.stats.hat * 2 +
        b.stats.success * 0.15;

      return scoreB - scoreA;
    })
    .slice(0, 5);
}

async function render() {

  // دریبل‌ها
  el("gcDribbles").innerHTML = players.length
    ? players.map(player => {
        const s = stats(player);

        return `
          <div class="gcc">
            <b>${esc(player.name)}</b>

            <div class="gcr">
              <span>دریبل موفق</span>
              <b>${s.success}</b>
            </div>

            <div class="gcr">
              <span>دریبل ناموفق</span>
              <b>${s.fail}</b>
            </div>

            <div class="gcr">
              <span>مجموع</span>
              <b>${s.success + s.fail}</b>
            </div>

            ${admin ? `
              <input
                id="gcs-${esc(player.id)}"
                type="number"
                min="0"
                value="${s.success}"
                aria-label="دریبل موفق"
              >

              <input
                id="gcf-${esc(player.id)}"
                type="number"
                min="0"
                value="${s.fail}"
                aria-label="دریبل ناموفق"
              >

              <button data-dribble="${esc(player.id)}">
                ذخیره
              </button>
            ` : ""}
          </div>
        `;
      }).join("")
    : '<p class="gcm">بازیکنی ثبت نشده است.</p>';

  // نامزدهای توپ طلا
  const list = nominees();
  const season = String(new Date().getFullYear());

  const currentAward = awards.find(
    a => a.award_type === "ballon_dor" &&
         a.season === season
  );

  el("gcBallon").innerHTML = list.map((item, index) => `
    <div class="gcc">
      <span class="gcpill">نامزد ${index + 1}</span>
      <b>${esc(item.player.name)}</b>

      <div class="gcr">
        <span>گل</span>
        <b>${item.stats.goals}</b>
      </div>

      <div class="gcr">
        <span>پاس گل</span>
        <b>${item.stats.assists}</b>
      </div>

      <div class="gcr">
        <span>هت‌تریک</span>
        <b>${item.stats.hat}</b>
      </div>
    </div>
  `).join("") || `
    <p class="gcm">برای نامزدی ابتدا بازیکن ثبت کن.</p>
  `;

  // انتخاب برنده توسط مدیر
  el("gcAwardAdmin").innerHTML =
    admin && list.length
      ? `
        <label>انتخاب برنده فصل ${season}</label>

        <select id="gcWinner">
          ${list.map(item => `
            <option
              value="${esc(item.player.id)}"
              ${
                currentAward &&
                String(currentAward.winner_player_id) ===
                String(item.player.id)
                  ? "selected"
                  : ""
              }
            >
              ${esc(item.player.name)}
            </option>
          `).join("")}
        </select>

        <button id="gcSaveAward">
          ثبت برنده توپ طلا
        </button>
      `
      : (
          currentAward
            ? '<p class="gcm">برنده فصل جاری ثبت شده است.</p>'
            : '<p class="gcm">انتخاب برنده نهایی با مدیر است.</p>'
        );

  // تاریخچه برندگان
  el("gcAwardsHistory").innerHTML = awards.length
    ? `
      <h3>برندگان قبلی</h3>
      ${awards.map(award => {
        const winner = players.find(
          p => String(p.id) === String(award.winner_player_id)
        );

        return `
          <div class="gcr">
            <span>${esc(award.season)} - توپ طلا</span>
            <b>${esc(winner ? winner.name : "بازیکن نامشخص")}</b>
          </div>
        `;
      }).join("")}
    `
    : '<p class="gcm">هنوز برنده‌ای ثبت نشده است.</p>';

  // مدال‌ها
  const levels = [100, 250, 500, 1000];

  el("gcAchievements").innerHTML = players.map(player => {
    const s = stats(player);

    const unlocked = achievements.filter(
      a => String(a.player_id) === String(player.id)
    );

    return `
      <div class="gcc">
        <b>${esc(player.name)}</b>
        <p class="gcm">${s.goals} گل</p>

        ${levels.map(level => {
          const has = unlocked.some(
            a => a.achievement_key === "goals_" + level
          );

          return `
            <span
              class="gcpill"
              style="opacity:${has ? 1 : 0.35}"
            >
              ${level} گل ${has ? "✓" : "🔒"}
            </span>
          `;
        }).join("")}
      </div>
    `;
  }).join("") || '<p class="gcm">بازیکنی ثبت نشده است.</p>';
}

async function unlockAchievements() {
  if (!admin) return;

  const levels = [100, 250, 500, 1000];

  const known = new Set(
    achievements.map(
      a => String(a.player_id) + ":" + a.achievement_key
    )
  );

  const rows = [];

  players.forEach(player => {
    levels.forEach(level => {
      const key = "goals_" + level;

      if (
        stats(player).goals >= level &&
        !known.has(String(player.id) + ":" + key)
      ) {
        rows.push({
          player_id: String(player.id),
          achievement_key: key
        });
      }
    });
  });

  if (rows.length) {
    const result = await db
      .from("goalscour_achievements")
      .upsert(rows, {
        onConflict: "player_id,achievement_key"
      });

    if (result.error) throw result.error;

    await load();
  }
}

// جابه‌جایی بین صفحات
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

// ذخیره دریبل و برنده توپ طلا
section.addEventListener("click", async event => {
  try {
    const dribbleButton = event.target.closest("[data-dribble]");

    if (dribbleButton) {
      if (!admin) {
        throw new Error("فقط مدیر اجازه ویرایش دارد.");
      }

      const id = dribbleButton.dataset.dribble;

      const result = await db
        .from("goalscour_dribbles")
        .upsert({
          player_id: String(id),
          successful: n(el("gcs-" + id).value),
          unsuccessful: n(el("gcf-" + id).value),
          updated_at: new Date().toISOString()
        }, {
          onConflict: "player_id"
        });

      if (result.error) throw result.error;

      await load();
      await render();

      status("آمار دریبل ذخیره شد.");
    }

    if (event.target.id === "gcSaveAward") {
      if (!admin) {
        throw new Error("فقط مدیر اجازه انتخاب برنده دارد.");
      }

      const season = String(new Date().getFullYear());
      const list = nominees();

      const result = await db
        .from("goalscour_awards")
        .upsert({
          id: "ballondor-" + season,
          award_type: "ballon_dor",
          season,
          candidate_player_ids: list.map(
            item => String(item.player.id)
          ),
          winner_player_id: String(el("gcWinner").value),
          status: "awarded",
          awarded_at: new Date().toISOString()
        }, {
          onConflict: "award_type,season"
        });

      if (result.error) throw result.error;

      await load();
      await render();

      status("برنده توپ طلا ثبت شد.");
    }

  } catch (error) {
    status("خطا: " + error.message);
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

start();

db.auth.onAuthStateChange(() => {
  start();
});

})();
