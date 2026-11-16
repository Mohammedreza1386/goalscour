
(() => {
  "use strict";

  const db = window.goalscourSupabase;
  const root = document.getElementById("accountApp");

  if (!root) {
  console.error("Goalscour: accountApp not found.");
  return;
}

if (!db) {
  root.innerHTML = `
    <div style="padding:15px;background:#321919;color:#ffaaaa;border-radius:12px">
      خطای اتصال حساب کاربری: Supabase در دسترس نیست.
      <br>
      لطفاً اتصال فایل cloud.js را بررسی کنید.
    </div>
  `;
  console.error("Goalscour: Supabase not found.");
  return;
}

  let currentUser = null;
  let profile = null;
  let players = [];
  let isAdmin = false;
  let busy = false;

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[c]);

  function message(text, error = false) {
    const box = document.getElementById("accountMessage");
    if (!box) return;
    box.textContent = text;
    box.style.color = error ? "#ff9999" : "#b9f27c";
  }

  function button(text, id, secondary = false) {
    return `<button type="button" id="${id}"
      style="width:100%;padding:12px;margin-top:8px;border:1px solid #273329;
      border-radius:10px;background:${secondary ? "#172019" : "#b9f27c"};
      color:${secondary ? "#b9f27c" : "#10170d"};font-weight:bold">
      ${text}</button>`;
  }

  function field(label, id, type = "text", required = true) {
    return `<label>${label}</label>
      <input id="${id}" type="${type}" ${required ? "required" : ""}
      style="width:100%;box-sizing:border-box;background:#090d0a;color:white;
      border:1px solid #273329;border-radius:10px;padding:12px;margin:7px 0 12px">`;
  }

  function panel(content) {
    return `<div style="background:#111812;border:1px solid #273329;
      border-radius:15px;padding:15px;margin-bottom:14px">${content}</div>`;
  }

  async function loadPlayers() {
    const { data, error } = await db
      .from("goalscour_players")
      .select("id,name")
      .order("name");

    if (error) throw error;
    players = data || [];
  }

  async function loadProfile() {
    const { data, error } = await db
      .from("goalscour_profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) throw error;
    profile = data;
  }

  async function checkAdmin() {
    const { data, error } = await db
      .from("admin_users")
      .select("user_id")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();

    isAdmin = !error && !!data;
  }

  function renderLoggedOut() {
    root.innerHTML = panel(`
      <h3 style="color:#b9f27c">👤 حساب کاربری Goalscour</h3>
      <p style="color:#89958a;font-size:12px;line-height:2">
        برای ساخت حساب یا ورود، اطلاعات خود را وارد کن.
      </p>

      <div id="accountMessage" style="font-size:12px;margin:10px 0"></div>

      <form id="registerForm">
        ${field("ایمیل", "registerEmail", "email")}
        ${field("رمز عبور (حداقل ۸ کاراکتر)", "registerPassword", "password")}
        ${field("نام نمایشی", "registerName")}
        <button class="primary" type="submit">ساخت حساب کاربری</button>
      </form>

      <hr style="border-color:#273329;margin:20px 0">

      <form id="loginForm">
        <h3>ورود به حساب</h3>
        ${field("ایمیل", "loginEmail", "email")}
        ${field("رمز عبور", "loginPassword", "password")}
        <button class="primary" type="submit">ورود</button>
      </form>
    `);

    document.getElementById("registerForm").addEventListener("submit", register);
    document.getElementById("loginForm").addEventListener("submit", login);
  }

  async function register(event) {
    event.preventDefault();
    if (busy) return;

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const displayName = document.getElementById("registerName").value.trim();

    if (password.length < 8) {
      message("رمز عبور باید حداقل ۸ کاراکتر باشد.", true);
      return;
    }

    busy = true;
    message("در حال ساخت حساب...");

    try {
      const { data, error } = await db.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        currentUser = data.user;
        await createProfile(displayName);
        await refresh();
      } else {
        message("حساب ساخته شد. ایمیل خود را برای تأیید حساب بررسی کن.");
      }
    } catch (error) {
      message("خطا در ثبت‌نام: " + error.message, true);
    } finally {
      busy = false;
    }
  }

  async function login(event) {
    event.preventDefault();
    if (busy) return;

    busy = true;
    message("در حال ورود...");

    try {
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      currentUser = data.user;
      await refresh();
    } catch (error) {
      message("ورود ناموفق بود: " + error.message, true);
    } finally {
      busy = false;
    }
  }

  async function createProfile(displayName) {
    const { error } = await db
      .from("goalscour_profiles")
      .upsert({
        user_id: currentUser.id,
        display_name: displayName
      }, { onConflict: "user_id" });

    if (error) throw error;
  }

  function renderProfile() {
    const options = players.map(player =>
      `<option value="${esc(player.id)}"
        ${profile?.player_id === String(player.id) ? "selected" : ""}>
        ${esc(player.name)}
      </option>`
    ).join("");

    root.innerHTML = `
      ${panel(`
        <h3 style="color:#b9f27c">سلام، ${esc(profile?.display_name || currentUser.email)}</h3>
        <p style="color:#89958a;font-size:12px">${esc(currentUser.email)}</p>
        <div id="accountMessage" style="font-size:12px;margin:10px 0"></div>

        <form id="profileForm">
          ${field("نام نمایشی", "displayName")}
          <label>انتخاب بازیکن</label>
          <select id="playerSelect" required
            style="width:100%;background:#090d0a;color:white;
            border:1px solid #273329;border-radius:10px;padding:12px;margin:7px 0 12px">
            <option value="">انتخاب بازیکن</option>
            ${options}
          </select>
          <button class="primary" type="submit">ذخیره پروفایل</button>
        </form>
        ${button("خروج از حساب", "accountLogout", true)}
      `)}

      ${profile?.player_id ? requestForm() : panel(`
        <h3>ثبت درخواست آمار</h3>
        <p class="muted">ابتدا پروفایل خود را تکمیل و بازیکن را انتخاب کن.</p>
      `)}

      <div id="myRequests"></div>
      <div id="adminRequests"></div>
    `;

    document.getElementById("displayName").value =
      profile?.display_name || "";

    document.getElementById("profileForm")
      .addEventListener("submit", saveProfile);

    document.getElementById("accountLogout")
      .addEventListener("click", logout);

    if (profile?.player_id) {
      document.getElementById("requestForm")
        ?.addEventListener("submit", submitRequest);
    }

    loadMyRequests();

    if (isAdmin) loadAdminRequests();
  }

  function requestForm() {
    return panel(`
      <h3 style="color:#b9f27c">📝 درخواست ثبت آمار</h3>
      <p class="muted">درخواست پس از بررسی مدیر به آمار اصلی اضافه می‌شود.</p>

      <form id="requestForm">
        <label>نوع آمار</label>
        <select id="requestScope" required>
          <option value="official">مسابقه رسمی</option>
          <option value="unofficial">مسابقه غیررسمی</option>
        </select>

        ${field("تاریخ مسابقه", "requestDate", "date")}
        ${field("نام حریف یا عنوان مسابقه", "requestOpponent")}
        ${field("تعداد گل", "requestGoals", "number", false)}
        ${field("تعداد پاس گل", "requestAssists", "number", false)}
        ${field("توضیحات", "requestDetails", "text", false)}

        <button class="primary" type="submit">ارسال درخواست برای بررسی</button>
      </form>
    `);
  }

  async function saveProfile(event) {
    event.preventDefault();

    const displayName = document.getElementById("displayName").value.trim();
    const playerId = document.getElementById("playerSelect").value;

    if (!displayName || !playerId) {
      message("نام و بازیکن را انتخاب کن.", true);
      return;
    }

    message("در حال ذخیره پروفایل...");

    try {
      const { error } = await db
        .from("goalscour_profiles")
        .upsert({
          user_id: currentUser.id,
          display_name: displayName,
          player_id: playerId
        }, { onConflict: "user_id" });

      if (error) throw error;

      await loadProfile();
      renderProfile();
      message("پروفایل ذخیره شد.");
    } catch (error) {
      message("خطا: " + error.message, true);
    }
  }

  async function submitRequest(event) {
    event.preventDefault();

    const scope = document.getElementById("requestScope").value;
    const goals = Number(document.getElementById("requestGoals").value || 0);
    const assists = Number(document.getElementById("requestAssists").value || 0);

    if (goals < 0 || assists < 0 || (!goals && !assists)) {
      message("حداقل یک گل یا پاس گل وارد کن.", true);
      return;
    }

    const request = {
      user_id: currentUser.id,
      player_id: profile.player_id,
      stat_scope: scope,
      goals,
      assists,
      match_date: document.getElementById("requestDate").value,
      opponent: document.getElementById("requestOpponent").value.trim(),
      details: document.getElementById("requestDetails").value.trim(),
      status: "pending"
    };

    message("در حال ارسال درخواست...");

    try {
      const { error } = await db
        .from("goalscour_stat_requests")
        .insert(request);

      if (error) throw error;

      document.getElementById("requestForm").reset();
      message("درخواست با موفقیت ارسال شد و منتظر بررسی مدیر است.");
      await loadMyRequests();
    } catch (error) {
      message("ارسال درخواست ناموفق بود: " + error.message, true);
    }
  }

  async function loadMyRequests() {
    const target = document.getElementById("myRequests");
    if (!target) return;

    const { data, error } = await db
      .from("goalscour_stat_requests")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      target.innerHTML = panel("خطا در دریافت درخواست‌ها.");
      return;
    }

    target.innerHTML = panel(`
      <h3 style="color:#b9f27c">درخواست‌های من</h3>
      ${(data || []).length ? data.map(item => `
        <div style="padding:10px;border-bottom:1px solid #273329;font-size:12px;line-height:2">
          ${item.stat_scope === "official" ? "رسمی" : "غیررسمی"}
          | گل: ${item.goals} | پاس گل: ${item.assists}
          <br>تاریخ: ${esc(item.match_date || "-")}
          <br>وضعیت: ${statusLabel(item.status)}
          ${item.review_note ? `<br>توضیح مدیر: ${esc(item.review_note)}` : ""}
        </div>
      `).join("") : `<p class="muted">هنوز درخواستی ثبت نکرده‌ای.</p>`}
    `);
  }

  function statusLabel(status) {
    if (status === "approved") return "✅ تأیید شده";
    if (status === "rejected") return "❌ رد شده";
    return "⏳ در انتظار بررسی";
  }

  async function loadAdminRequests() {
    const target = document.getElementById("adminRequests");
    if (!target || !isAdmin) return;

    const { data, error } = await db
      .from("goalscour_stat_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      target.innerHTML = panel("خطا در دریافت درخواست‌های مدیر.");
      return;
    }

    target.innerHTML = panel(`
      <h3 style="color:#b9f27c">🛡️ مدیریت درخواست‌های آمار</h3>
      ${(data || []).length ? data.map(item => {
        const player = players.find(p => String(p.id) === String(item.player_id));
        return `
          <div style="border-bottom:1px solid #273329;padding:12px 0;font-size:12px;line-height:2">
            <b>${esc(player?.name || "بازیکن")}</b>
            <br>${item.stat_scope === "official" ? "رسمی" : "غیررسمی"}
            | گل: ${item.goals} | پاس گل: ${item.assists}
            <br>حریف: ${esc(item.opponent || "-")}
            | تاریخ: ${esc(item.match_date || "-")}
            <br>توضیحات: ${esc(item.details || "-")}
            <br>وضعیت: ${statusLabel(item.status)}
            ${item.status === "pending" ? `
              <input id="note-${esc(item.id)}" placeholder="یادداشت مدیر (اختیاری)">
              <button type="button" data-review="${esc(item.id)}" data-approved="true"
                style="background:#b9f27c;color:#10170d;padding:9px;border:0;border-radius:8px">
                تأیید درخواست
              </button>
              <button type="button" data-review="${esc(item.id)}" data-approved="false"
                style="background:#321919;color:#ffaaaa;padding:9px;border:0;border-radius:8px">
                رد درخواست
              </button>
            ` : ""}
          </div>
        `;
      }).join("") : `<p class="muted">درخواستی وجود ندارد.</p>`}
    `);

    target.querySelectorAll("[data-review]").forEach(btn => {
      btn.addEventListener("click", () => reviewRequest(
        btn.dataset.review,
        btn.dataset.approved === "true"
      ));
    });
  }

  async function reviewRequest(requestId, approved) {
    if (!confirm(approved ? "درخواست تأیید شود و به آمار اصلی اضافه شود؟" : "این درخواست رد شود؟")) {
      return;
    }

    const note = document.getElementById("note-" + requestId)?.value || "";

    try {
      const { error } = await db.rpc("review_goalscour_stat_request", {
        p_request_id: requestId,
        p_approved: approved,
        p_review_note: note
      });

      if (error) throw error;

      alert("درخواست بررسی شد.");
      location.reload();
    } catch (error) {
      alert("خطا در بررسی درخواست: " + error.message);
    }
  }

  async function logout() {
    const { error } = await db.auth.signOut();
    if (error) {
      message(error.message, true);
      return;
    }

    currentUser = null;
    profile = null;
    isAdmin = false;
    renderLoggedOut();
  }

  async function refresh() {
    try {
      await loadPlayers();

      const { data } = await db.auth.getUser();
      currentUser = data.user;

      if (!currentUser) {
        renderLoggedOut();
        return;
      }

      await loadProfile();
      await checkAdmin();

      renderProfile();
    } catch (error) {
      root.innerHTML = panel(
        `<p style="color:#ff9999">خطا: ${esc(error.message)}</p>`
      );
    }
  }

  db.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    setTimeout(refresh, 0);
  });

  refresh();
})();
    
