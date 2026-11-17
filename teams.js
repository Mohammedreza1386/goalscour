(() => {
  "use strict";

  const db = window.goalscourSupabase;
  const root = document.getElementById("teamsApp");

  if (!db || !root) {
    console.error("Goalscour Teams: Supabase or teamsApp not found.");
    return;
  }

  let teams = [];
  let members = [];
  let matches = [];
  let players = [];
  let isAdmin = false;
  let activeTeam = null;
  let filter = "all";

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  const notify = (message) => {
    alert(message);
  };

  const dateText = (value) => {
    if (!value) return "نامشخص";
    return new Date(value).toLocaleDateString("fa-IR");
  };

  async function loadData() {
    root.innerHTML = "<p>در حال دریافت اطلاعات تیم‌ها...</p>";

    try {
      const results = await Promise.all([
        db.from("goalscour_teams").select("*").order("created_at", { ascending: false }),
        db.from("goalscour_team_members").select("*"),
        db.from("goalscour_team_matches").select("*").order("match_date", { ascending: false }),
        db.from("goalscour_players").select("*")
      ]);

      for (const result of results) {
        if (result.error) throw result.error;
      }

      teams = results[0].data || [];
      members = results[1].data || [];
      matches = results[2].data || [];
      players = results[3].data || [];

      await checkAdmin();
      render();

    } catch (error) {
      console.error(error);
      root.innerHTML =
        `<p style="color:#ff7777">خطا در دریافت اطلاعات: ${esc(error.message)}</p>`;
    }
  }

  async function checkAdmin() {
    isAdmin = false;

    try {
      const { data } = await db.auth.getUser();
      if (!data?.user) return;

      const result = await db
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      isAdmin = !!result.data;
    } catch (error) {
      console.warn("Admin check:", error);
    }
  }

  function teamMatches(teamId, type = "all") {
    return matches.filter(match => {
      const belongs =
        match.team_id === teamId ||
        match.opponent_team_id === teamId;

      return belongs && (
        type === "all" || match.match_type === type
      );
    });
  }

  function getStats(teamId, type = "all") {
    let played = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let scored = 0;
    let conceded = 0;

    teamMatches(teamId, type).forEach(match => {
      let gf = Number(match.goals_for || 0);
      let ga = Number(match.goals_against || 0);

      if (match.team_id !== teamId) {
        [gf, ga] = [ga, gf];
      }

      played++;
      scored += gf;
      conceded += ga;

      if (gf > ga) wins++;
      else if (gf === ga) draws++;
      else losses++;
    });

    return {
      played,
      wins,
      draws,
      losses,
      scored,
      conceded,
      difference: scored - conceded,
      points: wins * 3 + draws
    };
  }

  function getLeaderboard() {
    return teams.map(team => ({
      ...team,
      stats: getStats(team.id, filter)
    })).sort((a, b) =>
      b.stats.points - a.stats.points ||
      b.stats.difference - a.stats.difference ||
      b.stats.scored - a.stats.scored
    );
  }

  function render() {
    root.innerHTML = `
      <div class="gc-teams">
        <style>
          .gc-teams{color:inherit}
          .gc-teams *{box-sizing:border-box}
          .gc-team-panel{background:#151b18;border:1px solid #344238;
            border-radius:14px;padding:15px;margin:12px 0}
          .gc-team-grid{display:grid;grid-template-columns:
            repeat(auto-fit,minmax(220px,1fr));gap:12px}
          .gc-team-card{background:#19221c;border:1px solid #344238;
            border-radius:13px;padding:14px}
          .gc-teams button,.gc-teams select,.gc-teams input,
          .gc-teams textarea{font:inherit}
          .gc-teams button{background:#b9f27c;color:#152014;
            border:0;border-radius:9px;padding:10px 14px;
            margin:4px;cursor:pointer;font-weight:700}
          .gc-teams button.secondary{background:#303b34;color:white}
          .gc-teams input,.gc-teams select,.gc-teams textarea{
            width:100%;padding:10px;margin:6px 0 12px;
            background:#101612;color:white;border:1px solid #465448;
            border-radius:8px}
          .gc-teams label{display:block;font-size:13px;color:#c5d2c5}
          .gc-team-stats{display:grid;grid-template-columns:
            repeat(3,1fr);gap:7px;margin-top:12px}
          .gc-team-stat{background:#101612;padding:9px;border-radius:8px;
            text-align:center;font-size:13px}
          .gc-team-stat strong{display:block;color:#b9f27c;font-size:19px}
          .gc-team-logo{width:54px;height:54px;object-fit:cover;
            border-radius:50%;background:#303b34}
          .gc-team-row{display:flex;align-items:center;gap:12px}
          .gc-team-muted{color:#aab7aa;font-size:13px}
          .gc-team-table{width:100%;border-collapse:collapse;
            font-size:13px}
          .gc-team-table td,.gc-team-table th{
            padding:10px;border-bottom:1px solid #344238;text-align:center}
            

/* جدول رده‌بندی واکنش‌گرا */
.gc-team-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  font-size: 12px;
}

@media (max-width: 600px) {
  .gc-team-panel {
    padding: 8px;
    max-width: 100%;
    overflow: hidden;
  }

  .gc-team-table {
    width: 100%;
    font-size: 9px;
    table-layout: fixed;
  }

  .gc-team-table th,
  .gc-team-table td {
    padding: 6px 1px;
    text-align: center;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .gc-team-table th:nth-child(2),
  .gc-team-table td:nth-child(2) {
    width: 25%;
  }

  .gc-team-panel h3 {
    font-size: 15px;
  }
}


/* نمایش کامل جدول رده‌بندی در موبایل */
@media (max-width: 600px) {
  .gc-team-panel:has(.gc-team-table) {
    padding: 10px;
    overflow: hidden;
  }

  .gc-team-table,
  .gc-team-table tbody {
    display: block;
    width: 100%;
  }

  .gc-team-table thead {
    display: none;
  }

  .gc-team-table tbody tr {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    width: 100%;
    margin-bottom: 12px;
    border: 1px solid #465448;
    border-radius: 10px;
    overflow: hidden;
  }

  .gc-team-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 9px 5px;
    font-size: 11px;
    border-bottom: 1px solid #344238;
    text-align: right;
  }

  .gc-team-table td::before {
    font-weight: bold;
    color: #b9f27c;
    flex-shrink: 0;
  }

  .gc-team-table td:nth-child(1)::before { content: "رتبه"; }
  .gc-team-table td:nth-child(2)::before { content: "تیم"; }
  .gc-team-table td:nth-child(3)::before { content: "بازی"; }
  .gc-team-table td:nth-child(4)::before { content: "برد"; }
  .gc-team-table td:nth-child(5)::before { content: "مساوی"; }
  .gc-team-table td:nth-child(6)::before { content: "باخت"; }
  .gc-team-table td:nth-child(7)::before { content: "تفاضل"; }
  .gc-team-table td:nth-child(8)::before { content: "امتیاز"; }

  .gc-team-table td:nth-child(2) {
    overflow-wrap: anywhere;
  }

  .gc-team-table td:nth-child(8) {
    color: #b9f27c;
    font-weight: bold;
  }
}



        </style>

        <div class="gc-team-panel">
          <h2>⚽ تیم‌های Goalscour</h2>
          <p class="gc-team-muted">
            ساخت تیم، ثبت مسابقات و مشاهده جدول رده‌بندی
          </p>
          ${isAdmin ? `
            <button onclick="GoalscourTeams.showCreate()">＋ ساخت تیم جدید</button>
          ` : ""}
        </div>

        <div id="gcTeamCreate"></div>
        <div id="gcTeamDetails"></div>

        <div class="gc-team-panel">
          <h3>🏆 جدول رده‌بندی تیم‌ها</h3>
          <select onchange="GoalscourTeams.setFilter(this.value)">
            <option value="all" ${filter === "all" ? "selected" : ""}>همه مسابقات</option>
            <option value="official" ${filter === "official" ? "selected" : ""}>فقط رسمی</option>
            <option value="unofficial" ${filter === "unofficial" ? "selected" : ""}>فقط غیررسمی</option>
          </select>
          <div id="gcTeamRanking"></div>
        </div>

        <div class="gc-team-panel">
          <h3>📋 فهرست تیم‌ها</h3>
          <div id="gcTeamList" class="gc-team-grid"></div>
        </div>
      </div>
    `;

    renderRanking();
    renderTeamList();
  }

  function renderRanking() {
    const target = document.getElementById("gcTeamRanking");
    if (!target) return;

    const ranking = getLeaderboard();

    if (!ranking.length) {
      target.innerHTML = "<p>هنوز تیمی ثبت نشده است.</p>";
      return;
    }

    target.innerHTML = `
      <table class="gc-team-table">
        <thead>
          <tr>
            <th>رتبه</th><th>تیم</th><th>بازی</th>
            <th>برد</th><th>مساوی</th><th>باخت</th>
            <th>تفاضل</th><th>امتیاز</th>
          </tr>
        </thead>
        <tbody>
          ${ranking.map((team, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${esc(team.name)}</td>
              <td>${team.stats.played}</td>
              <td>${team.stats.wins}</td>
              <td>${team.stats.draws}</td>
              <td>${team.stats.losses}</td>
              <td>${team.stats.difference}</td>
              <td><strong>${team.stats.points}</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
    function renderTeamList() {
    const target = document.getElementById("gcTeamList");
    if (!target) return;

    if (!teams.length) {
      target.innerHTML = "<p>هنوز تیمی ساخته نشده است.</p>";
      return;
    }

    target.innerHTML = teams.map(team => {
      const stats = getStats(team.id);
      const count = members.filter(m => m.team_id === team.id).length;

      return `
        <div class="gc-team-card">
          <div class="gc-team-row">
            ${team.logo_url
              ? `<img class="gc-team-logo" src="${esc(team.logo_url)}" alt="">`
              : `<div class="gc-team-logo"></div>`}
            <div>
              <strong>${esc(team.name)}</strong>
              <div class="gc-team-muted">
                ${team.team_type === "roster" ? "تیم دارای بازیکنان" : "تیم مستقل"}
              </div>
            </div>
          </div>

          <div class="gc-team-stats">
            <div class="gc-team-stat"><strong>${stats.played}</strong>بازی</div>
            <div class="gc-team-stat"><strong>${stats.wins}</strong>برد</div>
            <div class="gc-team-stat"><strong>${stats.points}</strong>امتیاز</div>
          </div>

          ${team.team_type === "roster"
            ? `<p class="gc-team-muted">تعداد اعضا: ${count}</p>`
            : ""}

          
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
  <button
    onclick="GoalscourTeams.openTeam('${team.id}')"
    style="flex:1"
  >
    مشاهده جزئیات
  </button>

  ${isAdmin ? `
    <button
      onclick="GoalscourTeams.openTeam('${team.id}'); GoalscourTeams.showMatch('${team.id}')"
      style="flex:1"
    >
      ＋ ثبت مسابقه
    </button>
  ` : ""}
</div>

        </div>
      `;
    }).join("");
  }

  function showCreate() {
    if (!isAdmin) return;

    const target = document.getElementById("gcTeamCreate");

    target.innerHTML = `
      <div class="gc-team-panel">
        <h3>＋ ساخت تیم جدید</h3>

        <label>نام تیم</label>
        <input id="gcNewName" placeholder="نام تیم">

        <label>نوع تیم</label>
        <select id="gcNewType">
          <option value="roster">تیم دارای بازیکنان Goalscour</option>
          <option value="independent">تیم مستقل</option>
        </select>

        <label>لینک لوگوی تیم (اختیاری)</label>
        <input id="gcNewLogo" placeholder="https://example.com/logo.png">

        <label>توضیحات</label>
        <textarea id="gcNewDescription" placeholder="توضیحات تیم"></textarea>

        <label>تاریخ تأسیس</label>
        <input id="gcNewFounded" type="date">

        <button onclick="GoalscourTeams.createTeam()">ساخت تیم</button>
        <button class="secondary" onclick="GoalscourTeams.cancelCreate()">انصراف</button>
      </div>
    `;

    target.scrollIntoView({ behavior: "smooth" });
  }

  async function createTeam() {
    if (!isAdmin) return;

    const name = document.getElementById("gcNewName").value.trim();
    const type = document.getElementById("gcNewType").value;
    const logo = document.getElementById("gcNewLogo").value.trim();
    const description = document.getElementById("gcNewDescription").value.trim();
    const founded = document.getElementById("gcNewFounded").value || null;

    if (!name) {
      notify("نام تیم را وارد کن.");
      return;
    }

    const { error } = await db.from("goalscour_teams").insert({
      name,
      team_type: type,
      logo_url: logo || null,
      description: description || null,
      founded_on: founded
    });

    if (error) {
      notify("خطا در ساخت تیم: " + error.message);
      return;
    }

    notify("تیم با موفقیت ساخته شد.");
    await loadData();
  }

  function cancelCreate() {
    document.getElementById("gcTeamCreate").innerHTML = "";
  }

  async function deleteTeam(teamId) {
    if (!isAdmin) return;
    if (!confirm("آیا از حذف این تیم مطمئن هستی؟")) return;

    const { error } = await db
      .from("goalscour_teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      notify("خطا در حذف تیم: " + error.message);
      return;
    }

    activeTeam = null;
    notify("تیم حذف شد.");
    await loadData();
  }

  async function editTeam(teamId) {
    if (!isAdmin) return;

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const name = prompt("نام جدید تیم:", team.name);
    if (name === null || !name.trim()) return;

    const { error } = await db
      .from("goalscour_teams")
      .update({ name: name.trim() })
      .eq("id", teamId);

    if (error) {
      notify("خطا: " + error.message);
      return;
    }

    await loadData();
    openTeam(teamId);
  }

  async function addMember(teamId) {
    if (!isAdmin) return;

    const team = teams.find(t => t.id === teamId);
    if (!team || team.team_type !== "roster") return;

    const playerOptions = players.map(player =>
      `<option value="${player.id}">${esc(player.name)}</option>`
    ).join("");

    const target = document.getElementById("gcAddMember");

    target.innerHTML = `
      <div class="gc-team-panel">
        <h3>افزودن بازیکن</h3>

        <label>انتخاب بازیکن</label>
        <select id="gcMemberPlayer">
          <option value="">انتخاب کن</option>
          ${playerOptions}
        </select>

        <label>شماره پیراهن</label>
        <input id="gcMemberNumber" type="number" min="0" placeholder="مثلاً 10">

        <label>پست بازیکن</label>
        <select id="gcMemberPosition">
          <option value="دروازه‌بان">دروازه‌بان</option>
          <option value="مدافع">مدافع</option>
          <option value="هافبک">هافبک</option>
          <option value="مهاجم">مهاجم</option>
          <option value="سایر">سایر</option>
        </select>

        <button onclick="GoalscourTeams.saveMember('${teamId}')">افزودن به تیم</button>
      </div>
    `;
  }

  async function saveMember(teamId) {
    if (!isAdmin) return;

    const playerId = document.getElementById("gcMemberPlayer").value;
    const number = document.getElementById("gcMemberNumber").value;
    const position = document.getElementById("gcMemberPosition").value;

    if (!playerId) {
      notify("یک بازیکن انتخاب کن.");
      return;
    }

    const alreadyExists = members.some(
      m => m.team_id === teamId && m.player_id === playerId
    );

    if (alreadyExists) {
      notify("این بازیکن قبلاً عضو تیم شده است.");
      return;
    }

    const { error } = await db.from("goalscour_team_members").insert({
      team_id: teamId,
      player_id: playerId,
      shirt_number: number ? Number(number) : null,
      position
    });

    if (error) {
      notify("خطا در افزودن بازیکن: " + error.message);
      return;
    }

    notify("بازیکن به تیم اضافه شد.");
    await loadData();
    openTeam(teamId);
  }

  async function removeMember(memberId, teamId) {
    if (!isAdmin) return;
    if (!confirm("این بازیکن از تیم حذف شود؟")) return;

    const { error } = await db
      .from("goalscour_team_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      notify("خطا: " + error.message);
      return;
    }

    await loadData();
    openTeam(teamId);
  }
    function openTeam(teamId) {
    activeTeam = teamId;

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const stats = getStats(teamId);
    const teamMembers = members.filter(m => m.team_id === teamId);
    const history = teamMatches(teamId);

    const target = document.getElementById("gcTeamDetails");

    target.innerHTML = `
      <div class="gc-team-panel">
        <h2>${esc(team.name)}</h2>
        <p>${esc(team.description || "")}</p>
        <p class="gc-team-muted">
          نوع تیم: ${team.team_type === "roster" ? "دارای بازیکنان" : "مستقل"}
        </p>
        <p class="gc-team-muted">تاریخ تأسیس: ${dateText(team.founded_on)}</p>

        <div class="gc-team-stats">
          <div class="gc-team-stat"><strong>${stats.played}</strong>بازی</div>
          <div class="gc-team-stat"><strong>${stats.wins}</strong>برد</div>
          <div class="gc-team-stat"><strong>${stats.draws}</strong>مساوی</div>
          <div class="gc-team-stat"><strong>${stats.losses}</strong>باخت</div>
          <div class="gc-team-stat"><strong>${stats.scored}</strong>گل زده</div>
          <div class="gc-team-stat"><strong>${stats.points}</strong>امتیاز</div>
        </div>

        ${isAdmin ? `
          <button onclick="GoalscourTeams.showMatch('${teamId}')">＋ ثبت مسابقه</button>
          <button class="secondary" onclick="GoalscourTeams.editTeam('${teamId}')">ویرایش نام</button>
          <button class="secondary" onclick="GoalscourTeams.deleteTeam('${teamId}')">حذف تیم</button>
        ` : ""}

        ${team.team_type === "roster" ? `
          <h3>👥 بازیکنان تیم</h3>
          ${isAdmin ? `<button onclick="GoalscourTeams.addMember('${teamId}')">＋ افزودن بازیکن</button>` : ""}
          <div id="gcAddMember"></div>

          ${teamMembers.length ? teamMembers.map(member => {
            const player = players.find(p => p.id === member.player_id);
            return `
              <div class="gc-team-card gc-team-row">
                ${player?.photo ? `<img class="gc-team-logo" src="${esc(player.photo)}" alt="">` : ""}
                <div style="flex:1">
                  <strong>${esc(player?.name || "بازیکن")}</strong>
                  <div class="gc-team-muted">
                    شماره ${esc(member.shirt_number ?? "-")} · ${esc(member.position || "نامشخص")}
                  </div>
                </div>
                ${isAdmin ? `
                  <button class="secondary"
                    onclick="GoalscourTeams.removeMember('${member.id}','${teamId}')">
                    حذف
                  </button>
                ` : ""}
              </div>
            `;
          }).join("") : "<p>هنوز بازیکنی اضافه نشده است.</p>"}
        ` : ""}

        <h3>📅 تاریخچه مسابقات</h3>
        ${history.length ? history.map(match => {
          const home = match.team_id === teamId;
          const opponent = match.opponent_team_id
            ? teams.find(t => t.id === match.opponent_team_id)?.name
            : null;

          const gf = home ? match.goals_for : match.goals_against;
          const ga = home ? match.goals_against : match.goals_for;

          return `
            <div class="gc-team-card">
              <strong>${esc(team.name)}</strong>
              ${gf} - ${ga}
              <strong>${esc(opponent || match.opponent_name || "حریف")}</strong>
              <p class="gc-team-muted">
                ${dateText(match.match_date)} ·
                ${match.match_type === "official" ? "رسمی" : "غیررسمی"}
                ${match.competition ? " · " + esc(match.competition) : ""}
              </p>
              ${match.notes ? `<p>${esc(match.notes)}</p>` : ""}
              ${isAdmin ? `
                <button class="secondary"
                  onclick="GoalscourTeams.deleteMatch('${match.id}','${teamId}')">
                  حذف مسابقه
                </button>
              ` : ""}
            </div>
          `;
        }).join("") : "<p>هنوز مسابقه‌ای ثبت نشده است.</p>"}
      </div>
    `;

    target.scrollIntoView({ behavior: "smooth" });
  }

  function showMatch(teamId) {
    if (!isAdmin) return;

    const target = document.getElementById("gcTeamDetails");
    const opponentOptions = teams
      .filter(t => t.id !== teamId)
      .map(t => `<option value="${t.id}">${esc(t.name)}</option>`)
      .join("");

    target.insertAdjacentHTML("beforeend", `
      <div class="gc-team-panel">
        <h3>ثبت مسابقه جدید</h3>

        <label>نوع مسابقه</label>
        <select id="gcMatchType">
          <option value="official">رسمی</option>
          <option value="unofficial">غیررسمی</option>
        </select>

        <label>انتخاب تیم حریف (اختیاری)</label>
        <select id="gcOpponentTeam">
          <option value="">حریف دستی</option>
          ${opponentOptions}
        </select>

        <label>نام حریف در صورت انتخاب‌نکردن تیم</label>
        <input id="gcOpponentName" placeholder="نام تیم حریف">

        <label>گل زده تیم ما</label>
        <input id="gcGoalsFor" type="number" min="0" value="0">

        <label>گل خورده تیم ما</label>
        <input id="gcGoalsAgainst" type="number" min="0" value="0">

        <label>تاریخ مسابقه</label>
        <input id="gcMatchDate" type="date">

        <label>نام مسابقات یا لیگ</label>
        <input id="gcCompetition" placeholder="اختیاری">

        <label>توضیحات</label>
        <textarea id="gcMatchNotes"></textarea>

        <button onclick="GoalscourTeams.saveMatch('${teamId}')">ثبت مسابقه</button>
      </div>
    `);
  }

  async function saveMatch(teamId) {
    if (!isAdmin) return;

    const opponentId = document.getElementById("gcOpponentTeam").value || null;
    const opponentName = document.getElementById("gcOpponentName").value.trim();

    const goalsFor = Number(document.getElementById("gcGoalsFor").value);
    const goalsAgainst = Number(document.getElementById("gcGoalsAgainst").value);

    const matchDate = document.getElementById("gcMatchDate").value;
    const matchType = document.getElementById("gcMatchType").value;

    if (!matchDate || goalsFor < 0 || goalsAgainst < 0 ||
        !Number.isInteger(goalsFor) || !Number.isInteger(goalsAgainst)) {
      notify("تاریخ و نتیجه معتبر وارد کن.");
      return;
    }

    if (!opponentId && !opponentName) {
      notify("نام حریف را وارد کن یا یک تیم انتخاب کن.");
      return;
    }

    const opponentTeam = teams.find(t => t.id === opponentId);

    const { error } = await db.from("goalscour_team_matches").insert({
      team_id: teamId,
      opponent_team_id: opponentId,
      opponent_name: opponentTeam?.name || opponentName,
      goals_for: goalsFor,
      goals_against: goalsAgainst,
      match_date: matchDate,
      match_type: matchType,
      competition: document.getElementById("gcCompetition").value.trim() || null,
      notes: document.getElementById("gcMatchNotes").value.trim() || null
    });

    if (error) {
      notify("خطا در ثبت مسابقه: " + error.message);
      return;
    }

    notify("مسابقه با موفقیت ثبت شد.");
    await loadData();
    openTeam(teamId);
  }

  async function deleteMatch(matchId, teamId) {
    if (!isAdmin) return;
    if (!confirm("مسابقه حذف شود؟")) return;

    const { error } = await db
      .from("goalscour_team_matches")
      .delete()
      .eq("id", matchId);

    if (error) {
      notify("خطا در حذف مسابقه: " + error.message);
      return;
    }

    await loadData();
    openTeam(teamId);
  }

  function setFilter(value) {
    filter = value;
    renderRanking();
  }

  window.GoalscourTeams = {
    showCreate,
    createTeam,
    cancelCreate,
    openTeam,
    editTeam,
    deleteTeam,
    addMember,
    saveMember,
    removeMember,
    showMatch,
    saveMatch,
    deleteMatch,
    setFilter
  };

  loadData();
})();
