
(() => {
  "use strict";

  const SUPABASE_URL = "https://zusbebjskchgehdjvpsm.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c2JlYmpza2NoZ2VoZGp2cHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNDg1OTEsImV4cCI6MjEwNzgyNDU5MX0.2D86j8JssnCDpmh633zXPlF25oGsN9WIAwWMF7W0IeA";
  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  let isAdmin = false;
  let initialized = false;
  let syncing = Promise.resolve();

  // پنل مدیریت
  const style = document.createElement("style");

  style.textContent = `
    .gc-hidden { display:none !important; }

    .gc-panel {
      background:#111812;
      border:1px solid #273329;
      border-radius:15px;
      padding:14px;
      margin:12px 0 18px;
    }

    .gc-panel input {
      width:100%;
      box-sizing:border-box;
      background:#090d0a;
      color:white;
      border:1px solid #273329;
      border-radius:10px;
      padding:12px;
      margin:7px 0;
    }

    .gc-panel button {
      width:100%;
      padding:12px;
      border:0;
      border-radius:10px;
      background:#b9f27c;
      color:#10170d;
      font-weight:bold;
      margin-top:7px;
    }

    .gc-panel .gc-secondary {
      background:#172019;
      color:#b9f27c;
      border:1px solid #273329;
    }

    #gcStatus {
      font-size:11px;
      color:#89958a;
      line-height:2;
      margin-top:9px;
    }
  `;

  document.head.appendChild(style);

  const panel = document.createElement("section");

  panel.className = "gc-panel";

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
      <strong style="color:#b9f27c">مدیریت Goalscour</strong>
      <button id="gcShowLogin" class="gc-secondary"
        style="width:auto;margin:0">
        ورود مدیر
      </button>
    </div>

    <form id="gcLoginForm" class="gc-hidden">
      <input id="gcEmail" type="email"
        placeholder="ایمیل مدیر" required>

      <input id="gcPassword" type="password"
        placeholder="رمز عبور مدیر" required>

      <button type="submit">ورود مدیر</button>
    </form>
    <button id="gcForgotPassword"
      class="gc-secondary" type="button">
      فراموشی رمز عبور
    </button>

    <form id="gcNewPasswordForm" class="gc-hidden">
      <input id="gcNewPassword" type="password"
        placeholder="رمز عبور جدید" minlength="8" required>

      <button type="submit">ثبت رمز جدید</button>
    </form>
    <div id="gcStatus">
      در حال اتصال به پایگاه داده...
    </div>

    <button id="gcLogout" class="gc-secondary gc-hidden">
      خروج از حساب مدیر
    </button>
  `;

  const nav = document.querySelector("main nav");

  if (nav) {
    nav.insertAdjacentElement("afterend", panel);
  }

  function status(message, success = false) {
    const el = document.getElementById("gcStatus");

    if (!el) return;

    el.textContent = message;
    el.style.color = success ? "#b9f27c" : "#89958a";
  }

  // کنترل دسترسی بخش‌ها
  function applyAccess() {
    const protectedPanels = [
      document.querySelector("#players > .panel"),
      document.querySelector("#official > .panel"),
      document.querySelector("#unofficial > .panel")
    ];

    protectedPanels.forEach(el => {
      if (el) {
        el.classList.toggle("gc-hidden", !isAdmin);
      }
    });

    document.querySelectorAll(
      ".player-actions, #matchHistory button, #unofficialHistory button"
    ).forEach(el => {
      el.classList.toggle("gc-hidden", !isAdmin);
    });

    const login = document.getElementById("gcLoginForm");
    const logout = document.getElementById("gcLogout");
    const show = document.getElementById("gcShowLogin");

    if (login) {
      login.classList.toggle(
        "gc-hidden",
        isAdmin || login.dataset.open !== "yes"
      );
    }

    if (logout) {
      logout.classList.toggle("gc-hidden", !isAdmin);
    }

    if (show) {
      show.classList.toggle("gc-hidden", isAdmin);
    }
  }

  // اتصال به تابع نمایش اصلی
  if (typeof window.renderAll === "function") {
    const oldRender = window.renderAll;

    window.renderAll = function () {
      oldRender();
      applyAccess();
    };
  }

  // دریافت اطلاعات مشترک
  async function fetchCloud() {
    const results = await Promise.all([
      db.from("goalscour_players")
        .select("*")
        .order("updated_at"),

      db.from("goalscour_matches")
        .select("*")
        .order("match_date"),

      db.from("goalscour_unofficial")
        .select("*")
        .order("record_date")
    ]);

    for (const result of results) {
      if (result.error) throw result.error;
    }

    return {
      players: (results[0].data || []).map(x => ({
        id: x.id,
        name: x.name,
        age: x.age,
        likes: x.likes,
        photo: x.photo || ""
      })),

      matches: (results[1].data || []).map(x => ({
        id: x.id,
        opponent: x.opponent,
        date: x.match_date,
        against: x.against_goals,
        scorerId: x.scorer_id,
        goals: x.goals,
        penalties: x.penalties,
        assisterId: x.assister_id || "",
        assists: x.assists
      })),

      unofficial: (results[2].data || []).map(x => ({
        id: x.id,
        playerId: x.player_id,
        goals: x.goals,
        penalties: x.penalties,
        assists: x.assists,
        date: x.record_date,
        note: x.note || ""
      }))
    };
  }

  function saveLocal() {
    localStorage.setItem(
      "gc_players",
      JSON.stringify(players)
    );

    localStorage.setItem(
      "gc_matches",
      JSON.stringify(matches)
    );

    localStorage.setItem(
      "gc_unofficial",
      JSON.stringify(unofficial)
    );
  }

  // ارسال آمار مدیر به دیتابیس
  async function syncAll() {
    if (!isAdmin) {
      throw new Error("فقط مدیر اجازه تغییر اطلاعات را دارد.");
    }

    const groups = [
      {
        table: "goalscour_players",
        rows: players.map(x => ({
          id: String(x.id),
          name: x.name,
          age: x.age || null,
          likes: Number(x.likes) || 0,
          photo: x.photo || "",
          updated_at: new Date().toISOString()
        })),
        local: players
      },

      {
        table: "goalscour_matches",
        rows: matches.map(x => ({
          id: String(x.id),
          opponent: x.opponent || "",
          match_date: x.date,
          against_goals: Number(x.against) || 0,
          scorer_id: String(x.scorerId),
          goals: Number(x.goals) || 0,
          penalties: Number(x.penalties) || 0,
          assister_id: String(x.assisterId || ""),
          assists: Number(x.assists) || 0,
          updated_at: new Date().toISOString()
        })),
        local: matches
      },

      {
        table: "goalscour_unofficial",
        rows: unofficial.map(x => ({
          id: String(x.id),
          player_id: String(x.playerId),
          goals: Number(x.goals) || 0,
          penalties: Number(x.penalties) || 0,
          assists: Number(x.assists) || 0,
          record_date: x.date,
          note: x.note || "",
          updated_at: new Date().toISOString()
        })),
        local: unofficial
      }
    ];

    for (const group of groups) {
      if (group.rows.length) {
        const result = await db
          .from(group.table)
          .upsert(group.rows);

        if (result.error) throw result.error;
      }

      const result = await db
        .from(group.table)
        .select("id");

      if (result.error) throw result.error;

      const keep = new Set(
        group.local.map(x => String(x.id))
      );

      const remove = (result.data || [])
        .map(x => String(x.id))
        .filter(id => !keep.has(id));

      if (remove.length) {
        const deleted = await db
          .from(group.table)
          .delete()
          .in("id", remove);

        if (deleted.error) throw deleted.error;
      }
    }

    status(
      "آمار با موفقیت ذخیره شد و برای همه قابل مشاهده است.",
      true
    );
  }

  function queueSync() {
    if (!isAdmin) return;

    syncing = syncing
      .then(syncAll)
      .catch(error => {
        console.error(error);

        status(
          "خطا در ذخیره آنلاین: " + error.message
        );
      });
  }

  // اتصال ذخیره‌سازی قبلی به فضای ابری
  if (typeof window.saveData === "function") {
    const oldSave = window.saveData;

    window.saveData = function () {
      const result = oldSave();

      if (result && isAdmin && initialized) {
        queueSync();
      }

      return result;
    };
  }

  // بررسی مجوز حساب مدیر
  async function checkAdmin(user) {
    if (!user) return false;

    const result = await db
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    return !result.error && !!result.data;
  }

  // بارگذاری اولیه
  async function initialize() {
    try {
      status("در حال دریافت آمار مشترک...");

      const sessionResult = await db.auth.getSession();

      if (sessionResult.error) {
        throw sessionResult.error;
      }

      const session = sessionResult.data.session;

      isAdmin = await checkAdmin(session?.user);

      const remote = await fetchCloud();

      const hasRemote =
        remote.players.length +
        remote.matches.length +
        remote.unofficial.length > 0;

      if (hasRemote) {
        players = remote.players;
        matches = remote.matches;
        unofficial = remote.unofficial;

        saveLocal();

      } else if (isAdmin) {
        // انتقال اطلاعات قبلی دستگاه مدیر
        status("در حال انتقال آمار قبلی به فضای مشترک...");

        await syncAll();

            } else {
        // اگر هنوز اطلاعاتی در سرور نیست،
        // اطلاعات قبلی مرورگر حفظ می‌شود.
        status(
          "هنوز آماری در سرور نیست. برای انتقال آمار، مدیر وارد شود."
        );
      }

      initialized = true;

      if (typeof window.renderAll === "function") {
        window.renderAll();
      }

      applyAccess();

      if (isAdmin) {
        status(
          "ورود مدیر موفق بود. امکان ثبت و ویرایش فعال است.",
          true
        );
      } else {
        status(
          "حالت مشاهده عمومی فعال است. امکان تغییر آمار وجود ندارد.",
          true
        );
      }

    } catch (error) {
      console.error("Goalscour:", error);

      status(
        "خطای اتصال: " + error.message
      );
    }
  }

  // نمایش فرم ورود
  document.getElementById("gcShowLogin")
    .addEventListener("click", () => {
      const form = document.getElementById("gcLoginForm");

      form.dataset.open = "yes";
      form.classList.remove("gc-hidden");
    });

  // ورود مدیر
  document.getElementById("gcLoginForm")
    .addEventListener("submit", async event => {
      event.preventDefault();

      const email = document
        .getElementById("gcEmail").value.trim();

      const password = document
        .getElementById("gcPassword").value;

      status("در حال بررسی حساب مدیر...");

      const result = await db.auth.signInWithPassword({
        email,
        password
      });

      if (result.error) {
        status("ورود ناموفق: " + result.error.message);
        return;
      }

      const allowed = await checkAdmin(result.data.user);

      if (!allowed) {
        await db.auth.signOut();

        status("این حساب مجوز مدیریت ندارد.");
        return;
      }

      document.getElementById("gcLoginForm")
        .classList.add("gc-hidden");

      await initialize();
    });

  // خروج مدیر
  document.getElementById("gcLogout")
    .addEventListener("click", async () => {
      await db.auth.signOut();

      isAdmin = false;
      initialized = false;

      await initialize();
    });

  // به‌روزرسانی آمار برای بازدیدکنندگان
  async function refreshPublicData() {
    if (isAdmin || !initialized) return;

    try {
      const remote = await fetchCloud();

      players = remote.players;
      matches = remote.matches;
      unofficial = remote.unofficial;

      saveLocal();

      if (typeof window.renderAll === "function") {
        window.renderAll();
      }

    } catch (error) {
      console.warn("Refresh failed:", error);
    }
  }

  window.addEventListener(
    "focus",
    refreshPublicData
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        refreshPublicData();
      }
    }
  );

  initialize();

})();
      
