(() => {
  "use strict";

  const SUPABASE_URL =
    "https://zusbebjskchgehdjvpsm.supabase.co";

  const SUPABASE_KEY =
  "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK"

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  let isAdmin = false;
  let initialized = false;
  let syncing = Promise.resolve();
  let refreshRunning = false;

  const BACKUP_PREFIX = "gc_backup_before_sync_";

  /* =========================
     ظاهر پنل مدیریت
  ========================= */

  const style = document.createElement("style");

  style.textContent = `
    .gc-hidden {
      display: none !important;
    }

    .gc-panel {
      background: #111812;
      border: 1px solid #273329;
      border-radius: 15px;
      padding: 14px;
      margin: 12px 0 18px;
    }

    .gc-panel input {
      width: 100%;
      box-sizing: border-box;
      background: #090d0a;
      color: white;
      border: 1px solid #273329;
      border-radius: 10px;
      padding: 12px;
      margin: 7px 0;
    }

    .gc-panel button {
      width: 100%;
      padding: 12px;
      border: 0;
      border-radius: 10px;
      background: #b9f27c;
      color: #10170d;
      font-weight: bold;
      margin-top: 7px;
      cursor: pointer;
    }

    .gc-panel .gc-secondary {
      background: #172019;
      color: #b9f27c;
      border: 1px solid #273329;
    }

    .gc-panel .gc-danger {
      background: #3a1919;
      color: #ffaaaa;
      border: 1px solid #633333;
    }

    .gc-section-title {
      color: #b9f27c;
      margin-top: 18px;
      font-size: 14px;
    }

    .gc-description {
      color: #89958a;
      font-size: 11px;
      line-height: 2;
    }

    #gcStatus {
      font-size: 11px;
      color: #89958a;
      line-height: 2;
      margin-top: 9px;
      overflow-wrap: anywhere;
    }
  `;

  document.head.appendChild(style);

  /* =========================
     پنل مدیریت
  ========================= */

  const panel = document.createElement("section");

  panel.className = "gc-panel";

  panel.innerHTML = `
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:10px
    ">
      <strong style="color:#b9f27c">
        مدیریت Goalscour
      </strong>

      <button
        id="gcShowLogin"
        class="gc-secondary"
        style="width:auto;margin:0"
        type="button"
      >
        ورود مدیر
      </button>
    </div>

    <form id="gcLoginForm" class="gc-hidden">
      <input
        id="gcEmail"
        type="email"
        placeholder="ایمیل مدیر"
        autocomplete="username"
        required
      >

      <input
        id="gcPassword"
        type="password"
        placeholder="رمز عبور مدیر"
        autocomplete="current-password"
        required
      >

      <button type="submit">
        ورود به پنل مدیریت
      </button>
    </form>

    <button
      id="gcForgotPassword"
      class="gc-secondary"
      type="button"
    >
      بازیابی رمز عبور
    </button>

    <form id="gcNewPasswordForm" class="gc-hidden">
      <input
        id="gcNewPassword"
        type="password"
        placeholder="رمز عبور جدید"
        minlength="8"
        required
      >

      <button type="submit">
        ثبت رمز جدید
      </button>
    </form>

    <div id="gcAdminTools" class="gc-hidden">

      <div class="gc-section-title">
        پشتیبان‌گیری و بازیابی اطلاعات
      </div>

      <p class="gc-description">
        از اطلاعات بازیکنان، مسابقات و آمار غیررسمی
        یک نسخه پشتیبان JSON تهیه کن یا آن را بازیابی کن.
      </p>

      <button
        id="gcExportBackup"
        type="button"
      >
        دریافت نسخه پشتیبان JSON
      </button>

      <label class="gc-description">
        انتخاب فایل پشتیبان برای بازیابی:
      </label>

      <input
        id="gcImportFile"
        type="file"
        accept=".json,application/json"
      >

      <button
        id="gcImportBackup"
        class="gc-secondary"
        type="button"
      >
        بازیابی اطلاعات از فایل
      </button>

    </div>

    <div id="gcStatus">
      در حال اتصال به پایگاه داده...
    </div>

    <button
      id="gcLogout"
      class="gc-secondary gc-hidden"
      type="button"
    >
      خروج از حساب مدیر
    </button>
  `;

  const nav = document.querySelector("main nav");

  if (nav) {
    nav.insertAdjacentElement("afterend", panel);
  }

  /* =========================
     پیام‌های وضعیت
  ========================= */

  function status(message, success = false) {
    const element = document.getElementById("gcStatus");

    if (!element) return;

    element.textContent = message;

    element.style.color = success
      ? "#b9f27c"
      : "#89958a";
  }

  /* =========================
     پشتیبان‌گیری محلی
  ========================= */

  function createLocalBackup() {
    try {
      const backup = {
        app: "Goalscour",
        version: 3,
        createdAt: new Date().toISOString(),

        players: Array.isArray(players)
          ? players
          : [],

        matches: Array.isArray(matches)
          ? matches
          : [],

        unofficial: Array.isArray(unofficial)
          ? unofficial
          : []
      };

      const key =
        BACKUP_PREFIX + Date.now();

      localStorage.setItem(
        key,
        JSON.stringify(backup)
      );

      return true;

    } catch (error) {
      console.error("Backup failed:", error);

      status(
        "پشتیبان محلی ساخته نشد؛ عملیات متوقف شد."
      );

      return false;
    }
  }

  /* =========================
     ابزار ادغام رکوردها
  ========================= */

  function mergeRecords(localRows, remoteRows) {
    const result = new Map();

    (localRows || []).forEach(item => {
      if (item && item.id != null) {
        result.set(String(item.id), item);
      }
    });

    (remoteRows || []).forEach(item => {
      if (item && item.id != null) {
        result.set(String(item.id), item);
      }
    });

    return Array.from(result.values());
  }

  function validArray(value) {
    return Array.isArray(value) ? value : [];
  }

  /* پایان پارت اول */
   /* =========================
     کنترل دسترسی مدیر
  ========================= */

  function applyAccess() {
    const protectedPanels = [
      document.querySelector("#players > .panel"),
      document.querySelector("#official > .panel"),
      document.querySelector("#unofficial > .panel")
    ];

    protectedPanels.forEach(element => {
      if (element) {
        element.classList.toggle("gc-hidden", !isAdmin);
      }
    });

    document.querySelectorAll(
      ".player-actions, #matchHistory button, #unofficialHistory button"
    ).forEach(element => {
      element.classList.toggle("gc-hidden", !isAdmin);
    });

    const login = document.getElementById("gcLoginForm");
    const logout = document.getElementById("gcLogout");
    const show = document.getElementById("gcShowLogin");
    const tools = document.getElementById("gcAdminTools");

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

    if (tools) {
      tools.classList.toggle("gc-hidden", !isAdmin);
    }
  }

  /* =========================
     اتصال به نمایش سایت
  ========================= */

  if (typeof window.renderAll === "function") {
    const originalRender = window.renderAll;

    window.renderAll = function () {
      originalRender();
      applyAccess();
    };
  }

  /* =========================
     دریافت اطلاعات از سرور
  ========================= */

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
      if (result.error) {
        throw result.error;
      }
    }

    return {
      players: (results[0].data || []).map(item => ({
        id: item.id,
        name: item.name,
        age: item.age,
        likes: item.likes,
        photo: item.photo || ""
      })),

      matches: (results[1].data || []).map(item => ({
        id: item.id,
        opponent: item.opponent,
        date: item.match_date,
        against: item.against_goals,
        scorerId: item.scorer_id,
        goals: item.goals,
        penalties: item.penalties,
        assisterId: item.assister_id || "",
        assists: item.assists
      })),

      unofficial: (results[2].data || []).map(item => ({
        id: item.id,
        playerId: item.player_id,
        goals: item.goals,
        penalties: item.penalties,
        assists: item.assists,
        date: item.record_date,
        note: item.note || ""
      }))
    };
  }

  /* =========================
     ذخیره محلی
  ========================= */

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

  /* =========================
     آماده‌سازی رکوردهای ارسالی
  ========================= */

  function prepareGroups() {
    return [
      {
        table: "goalscour_players",

        rows: validArray(players).map(item => ({
          id: String(item.id),
          name: String(item.name || ""),
          age: item.age ? Number(item.age) : null,
          likes: Number(item.likes) || 0,
          photo: item.photo || "",
          updated_at: new Date().toISOString()
        }))
      },

      {
        table: "goalscour_matches",

        rows: validArray(matches).map(item => ({
          id: String(item.id),
          opponent: String(item.opponent || ""),
          match_date: item.date,
          against_goals: Number(item.against) || 0,
          scorer_id: String(item.scorerId || ""),
          goals: Number(item.goals) || 0,
          penalties: Number(item.penalties) || 0,
          assister_id: String(item.assisterId || ""),
          assists: Number(item.assists) || 0,
          updated_at: new Date().toISOString()
        }))
      },

      {
        table: "goalscour_unofficial",

        rows: validArray(unofficial).map(item => ({
          id: String(item.id),
          player_id: String(item.playerId),
          goals: Number(item.goals) || 0,
          penalties: Number(item.penalties) || 0,
          assists: Number(item.assists) || 0,
          record_date: item.date,
          note: String(item.note || ""),
          updated_at: new Date().toISOString()
        }))
      }
    ];
  }

  /* =========================
     همگام‌سازی امن
  ========================= */

  async function syncAll() {
    if (!isAdmin) {
      throw new Error(
        "فقط مدیر اجازه تغییر اطلاعات را دارد."
      );
    }

    if (!createLocalBackup()) {
      throw new Error(
        "پشتیبان‌گیری ناموفق بود؛ همگام‌سازی متوقف شد."
      );
    }

    const groups = prepareGroups();

    for (const group of groups) {
      if (!group.rows.length) continue;

      const result = await db
        .from(group.table)
        .upsert(group.rows);

      if (result.error) {
        throw result.error;
      }
    }

    status(
      "اطلاعات با موفقیت همگام‌سازی شد.",
      true
    );
  }
  return true;

  /* =========================
     صف ذخیره‌سازی
  ========================= */

  function queueSync() {
    if (!isAdmin || !initialized) return;

    syncing = syncing
      .then(syncAll)
      .catch(error => {
        console.error("Sync error:", error);

        status(
          "خطا در ذخیره آنلاین: " + error.message
        );
      });

    return syncing;
  }

  /* =========================
     اتصال ذخیره قبلی به سرور
  ========================= */

  if (typeof window.saveData === "function") {
    const originalSave = window.saveData;

    window.saveData = function () {
      const result = originalSave();

      if (result && isAdmin && initialized) {
        queueSync();
      }

      return result;
    };
  }

  /* =========================
     بررسی مجوز مدیر
  ========================= */

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

  /* =========================
     ادغام اطلاعات محلی و ابری
  ========================= */

  async function mergeLocalAndCloud() {
    const remote = await fetchCloud();

    const localPlayers = validArray(players);
    const localMatches = validArray(matches);
    const localUnofficial = validArray(unofficial);

    players = mergeRecords(
      localPlayers,
      remote.players
    );

    matches = mergeRecords(
      localMatches,
      remote.matches
    );

    unofficial = mergeRecords(
      localUnofficial,
      remote.unofficial
    );

    saveLocal();

    return {
      remote,
      localCount:
        localPlayers.length +
        localMatches.length +
        localUnofficial.length
    };
  }

  /* پایان پارت دوم */
   /* =========================
     اعتبارسنجی فایل پشتیبان
  ========================= */

  function validateBackup(data) {
    if (!data || typeof data !== "object") {
      throw new Error("ساختار فایل معتبر نیست.");
    }

    if (data.app !== "Goalscour") {
      throw new Error("این فایل متعلق به Goalscour نیست.");
    }

    if (
      !Array.isArray(data.players) ||
      !Array.isArray(data.matches) ||
      !Array.isArray(data.unofficial)
    ) {
      throw new Error("بخش‌های فایل پشتیبان ناقص هستند.");
    }

    const groups = [
      data.players,
      data.matches,
      data.unofficial
    ];

    for (const group of groups) {
      for (const item of group) {
        if (
          !item ||
          typeof item !== "object" ||
          item.id == null
        ) {
          throw new Error(
            "یکی از رکوردها شناسه معتبر ندارد."
          );
        }
      }
    }

    return true;
  }

  /* =========================
     خروجی گرفتن JSON
  ========================= */

  function exportBackup() {
    if (!isAdmin) {
      status("فقط مدیر اجازه دریافت پشتیبان دارد.");
      return;
    }

    try {
      const backup = {
        app: "Goalscour",
        version: 3,
        createdAt: new Date().toISOString(),
        players: validArray(players),
        matches: validArray(matches),
        unofficial: validArray(unofficial)
      };

      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json;charset=utf-8" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        "goalscour-backup-" +
        new Date().toISOString().slice(0, 10) +
        ".json";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      status("فایل پشتیبان JSON آماده شد.", true);

    } catch (error) {
      console.error(error);
      status("خطا در تهیه فایل پشتیبان: " + error.message);
    }
  }

  document.getElementById("gcExportBackup")
    .addEventListener("click", exportBackup);

  /* =========================
     بازیابی فایل JSON
  ========================= */

  async function importBackup() {
    if (!isAdmin) {
      status("فقط مدیر اجازه بازیابی اطلاعات دارد.");
      return;
    }

    const input = document.getElementById("gcImportFile");
    const file = input.files && input.files[0];

    if (!file) {
      status("ابتدا فایل JSON را انتخاب کن.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      status("فقط فایل JSON قابل قبول است.");
      return;
    }

    try {
      status("در حال خواندن فایل پشتیبان...");

      const content = await file.text();
      const imported = JSON.parse(content);

      validateBackup(imported);

      const confirmed = window.confirm(
        "اطلاعات فایل با اطلاعات فعلی ادغام می‌شوند. " +
        "رکوردهای هم‌شناسه از فایل انتخابی جایگزین می‌شوند. " +
        "آیا ادامه می‌دهی؟"
      );

      if (!confirmed) {
        status("بازیابی لغو شد.");
        return;
      }

      // ابتدا از اطلاعات فعلی نسخه پشتیبان می‌گیریم.
      if (!createLocalBackup()) {
        throw new Error(
          "پشتیبان‌گیری از اطلاعات فعلی ناموفق بود."
        );
      }

      const oldPlayers = players;
      const oldMatches = matches;
      const oldUnofficial = unofficial;

      // فایل واردشده برای شناسه‌های تکراری اولویت دارد.
      players = mergeRecords(
        oldPlayers,
        imported.players
      );

      matches = mergeRecords(
        oldMatches,
        imported.matches
      );

      unofficial = mergeRecords(
        oldUnofficial,
        imported.unofficial
      );

      try {
        saveLocal();
      } catch (storageError) {
        // در صورت شکست ذخیره، وضعیت قبلی را برمی‌گردانیم.
        players = oldPlayers;
        matches = oldMatches;
        unofficial = oldUnofficial;

        throw new Error(
          "ذخیره محلی ناموفق بود؛ اطلاعات قبلی حفظ شدند."
        );
      }

      if (typeof window.renderAll === "function") {
        window.renderAll();
      }

      input.value = "";

      status(
        "بازیابی محلی موفق بود؛ در حال ارسال اطلاعات به سرور...",
        true
      );

      await queueSync();

    } catch (error) {
      console.error("Import failed:", error);

      status(
        "بازیابی ناموفق: " + error.message
      );
    }
  }

  document.getElementById("gcImportBackup")
    .addEventListener("click", importBackup);

  /* =========================
     راه‌اندازی اولیه
  ========================= */

  async function initialize() {
    try {
      status("در حال بررسی حساب و دریافت اطلاعات...");

      const sessionResult = await db.auth.getSession();

      if (sessionResult.error) {
        throw sessionResult.error;
      }

      const session = sessionResult.data.session;

      isAdmin = await checkAdmin(session?.user);

      if (isAdmin) {
        status("در حال ادغام اطلاعات محلی و سرور...");

        await mergeLocalAndCloud();

        initialized = true;

        await syncAll();

      } else {
        const remote = await fetchCloud();

        players = remote.players;
        matches = remote.matches;
        unofficial = remote.unofficial;

        saveLocal();

        initialized = true;
      }

      if (typeof window.renderAll === "function") {
        window.renderAll();
      }

      applyAccess();

      if (isAdmin) {
        status(
          "ورود مدیر موفق بود؛ اطلاعات همگام‌سازی شدند.",
          true
        );
      } else {
        status(
          "حالت مشاهده عمومی فعال است.",
          true
        );
      }

    } catch (error) {
      console.error("Goalscour initialization:", error);

      status(
        "خطای اتصال یا همگام‌سازی: " + error.message
      );
    }
  }

  /* =========================
     نمایش فرم ورود
  ========================= */

  document.getElementById("gcShowLogin")
    .addEventListener("click", () => {
      const form = document.getElementById("gcLoginForm");

      form.dataset.open = "yes";
      form.classList.remove("gc-hidden");
    });

  /* =========================
     بازیابی رمز عبور
  ========================= */

  document.getElementById("gcForgotPassword")
    .addEventListener("click", async () => {
      const email = document
        .getElementById("gcEmail")
        .value.trim();

      if (!email) {
        status("ابتدا ایمیل مدیر را وارد کن.");
        return;
      }

      status("در حال ارسال ایمیل بازیابی...");

      try {
        const result = await db.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              "https://goalscour-econova4.vercel.app/"
          }
        );

        if (result.error) {
          throw result.error;
        }

        status(
          "درخواست بازیابی ارسال شد؛ ایمیل خود را بررسی کن.",
          true
        );

      } catch (error) {
        status("خطا: " + error.message);
      }
    });

  /* =========================
     تشخیص لینک بازیابی رمز
  ========================= */

  db.auth.onAuthStateChange(event => {
    if (event === "PASSWORD_RECOVERY") {
      document.getElementById("gcNewPasswordForm")
        .classList.remove("gc-hidden");

      status("رمز عبور جدید را وارد کن.");
    }
  });

  /* =========================
     ثبت رمز جدید
  ========================= */

  document.getElementById("gcNewPasswordForm")
    .addEventListener("submit", async event => {
      event.preventDefault();

      const password = document
        .getElementById("gcNewPassword")
        .value;

      if (password.length < 8) {
        status("رمز عبور باید حداقل ۸ کاراکتر باشد.");
        return;
      }

      status("در حال تغییر رمز عبور...");

      try {
        const result = await db.auth.updateUser({
          password
        });

        if (result.error) {
          throw result.error;
        }

        document.getElementById("gcNewPasswordForm")
          .classList.add("gc-hidden");

        status("رمز عبور با موفقیت تغییر کرد.", true);

      } catch (error) {
        status("خطا: " + error.message);
      }
    });

  /* =========================
     ورود مدیر
  ========================= */

  document.getElementById("gcLoginForm")
    .addEventListener("submit", async event => {
      event.preventDefault();

      const email = document
        .getElementById("gcEmail")
        .value.trim();

      const password = document
        .getElementById("gcPassword")
        .value;

      status("در حال بررسی حساب مدیر...");

      try {
        const result = await db.auth.signInWithPassword({
          email,
          password
        });

        if (result.error) {
          throw result.error;
        }

        const allowed = await checkAdmin(result.data.user);

        if (!allowed) {
          await db.auth.signOut();

          throw new Error(
            "این حساب مجوز مدیریت ندارد."
          );
        }

        document.getElementById("gcLoginForm")
          .classList.add("gc-hidden");

        await initialize();

      } catch (error) {
        status("ورود ناموفق: " + error.message);
      }
    });

  /* =========================
     خروج مدیر
  ========================= */

  document.getElementById("gcLogout")
    .addEventListener("click", async () => {
      try {
        await db.auth.signOut();

        isAdmin = false;
        initialized = false;

        await initialize();

      } catch (error) {
        status("خطا در خروج: " + error.message);
      }
    });

  /* =========================
     تازه‌سازی اطلاعات عمومی
  ========================= */

  async function refreshPublicData() {
    if (
      isAdmin ||
      !initialized ||
      refreshRunning
    ) {
      return;
    }

    refreshRunning = true;

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
      console.warn("Public refresh failed:", error);

    } finally {
      refreshRunning = false;
    }
  }

  window.addEventListener("focus", refreshPublicData);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshPublicData();
    }
  });

  /* =========================
     شروع سیستم
  ========================= */

  initialize();

})();
