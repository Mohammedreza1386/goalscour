
(() => {
  "use strict";

  function startHallOfFame() {
    const section = document.getElementById("gcHallOfFame");

    if (!section) {
      console.error("Goalscour: gcHallOfFame not found.");
      return;
    }

    let box = document.getElementById("hfCategories");
    let status = document.getElementById("hfStatus");

    if (!box) {
      box = document.createElement("div");
      box.id = "hfCategories";
      section.appendChild(box);
    }

    if (!status) {
      status = document.createElement("div");
      status.id = "hfStatus";
      status.className = "muted";
      section.appendChild(status);
    }

    box.textContent = "در حال اتصال به پایگاه داده...";
    status.textContent = "اسکریپت تالار افتخارات اجرا شد.";

    const nav = document.querySelector("main nav");
    const tab = nav?.querySelector(
      'button[data-tab="gcHallOfFame"]'
    );

    if (tab && !tab.dataset.hfBound) {
      tab.dataset.hfBound = "1";
      tab.addEventListener("click", () => {
        setTimeout(load, 100);
      });
    }

    const supabaseLib = window.supabase;

    if (
      !supabaseLib ||
      typeof supabaseLib.createClient !== "function"
    ) {
      box.textContent =
        "کتابخانه Supabase بارگذاری نشده است.";

      status.textContent =
        "خطا: اتصال کتابخانه Supabase برقرار نشد.";

      return;
    }

    const db = supabaseLib.createClient(
      "https://zusbebjskchgehdjvpsm.supabase.co",
      "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK"
    );

    const n = value => {
      const x = Number(value ?? 0);
      return Number.isFinite(x) && x > 0 ? x : 0;
    };

    const esc = value =>
      String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[ch]));

    function render(
      players,
      matches,
      unofficial,
      dribbles,
      performances
    ) {
      const stats = players.map(player => {
        const id = String(player.id);

        const official = matches.filter(
          m => String(m.scorer_id) === id
        );

        const officialAssist = matches.filter(
          m => String(m.assister_id) === id
        );

        const rated = performances.filter(
          r => String(r.player_id) === id
        );

        const un = unofficial.filter(
          r => String(r.player_id) === id
        );

        const dribble =
          dribbles.find(
            r => String(r.player_id) === id
          ) || {};

        const officialGoals =
          official.reduce(
            (sum, m) => sum + n(m.goals), 0
          ) +
          rated.reduce(
            (sum, r) => sum + n(r.goals), 0
          );

        const unofficialGoals = un.reduce(
          (sum, r) => sum + n(r.goals), 0
        );

        const officialAssists =
          officialAssist.reduce(
            (sum, m) => sum + n(m.assists), 0
          ) +
          rated.reduce(
            (sum, r) => sum + n(r.assists), 0
          );

        const unofficialAssists = un.reduce(
          (sum, r) => sum + n(r.assists), 0
        );

        const goals =
          officialGoals + unofficialGoals;

        const assists =
          officialAssists + unofficialAssists;

        const penalties =
          official.reduce(
            (sum, m) => sum + n(m.penalties), 0
          ) +
          rated.reduce(
            (sum, r) => sum + n(r.penalties), 0
          ) +
          un.reduce(
            (sum, r) => sum + n(r.penalties), 0
          );

        return {
          ...player,
          goals,
          officialGoals,
          unofficialGoals,
          assists,
          officialAssists,
          unofficialAssists,
          penalties,

          nonPenaltyGoals: Math.max(
            0,
            goals - penalties
          ),

          contributions: goals + assists,

          hatTricks:
            official.filter(
              m => n(m.goals) >= 3
            ).length +
            rated.filter(
              r => n(r.goals) >= 3
            ).length,

          braces:
            official.filter(
              m => n(m.goals) === 2
            ).length +
            rated.filter(
              r => n(r.goals) === 2
            ).length,

          successfulDribbles: n(dribble.successful)
        };
      });

      const categories = [
        ["آقای گل کل", "goals", "گل"],
        ["بهترین گلزن رسمی", "officialGoals", "گل"],
        ["بهترین گلزن غیررسمی", "unofficialGoals", "گل"],
        ["بهترین گلزن بدون پنالتی", "nonPenaltyGoals", "گل"],
        ["بهترین پنالتی‌زن", "penalties", "پنالتی"],
        ["بهترین پاسور کل", "assists", "پاس گل"],
        ["بهترین پاسور رسمی", "officialAssists", "پاس گل"],
        ["بهترین پاسور غیررسمی", "unofficialAssists", "پاس گل"],
        ["بیشترین مشارکت گل (G+A)", "contributions", "مشارکت"],
        ["بهترین هت‌تریک‌زن", "hatTricks", "هت‌تریک"],
        ["بهترین دبل‌زن", "braces", "دبل"],
        ["بهترین دریبل‌زن", "successfulDribbles", "دریبل موفق"]
      ];

      if (!stats.length) {
        box.textContent =
          "هنوز بازیکنی در پایگاه داده ثبت نشده است.";
        return;
      }

      box.innerHTML = categories.map(category => {
        const ranked = stats
          .filter(p => n(p[category[1]]) > 0)
          .sort(
            (a, b) =>
              n(b[category[1]]) - n(a[category[1]])
          )
          .slice(0, 3);

        const rows = ranked.length
          ? ranked.map((p, i) => {
              const photo = p.photo
                ? '<img class="hf-photo" src="' +
                  esc(p.photo) +
                  '" alt="' + esc(p.name) + '">'
                : '<div class="hf-photo">⚽</div>';

              return (
                '<div class="hf-player">' +
                  '<div class="hf-rank">' +
                    ["🥇", "🥈", "🥉"][i] +
                  '</div>' +
                  photo +
                  '<div class="hf-info">' +
                    '<div class="hf-name">' +
                      esc(p.name) +
                    '</div>' +
                  '</div>' +
                  '<div class="hf-value">' +
                    n(p[category[1]]) +
                  '</div>' +
                '</div>'
              );
            }).join("")
          : '<div class="hf-empty">هنوز آماری ثبت نشده است.</div>';

        return (
          '<div class="hf-panel">' +
            '<h3>' + category[0] + '</h3>' +
            '<div class="hf-list">' +
              rows +
            '</div>' +
          '</div>'
        );
      }).join("");
    }

    async function load() {
      box.textContent =
        "در حال دریافت آمار از Supabase...";

      status.textContent =
        "در حال خواندن اطلاعات بازیکنان و مسابقات...";

      try {
        const names = [
          "goalscour_players",
          "goalscour_matches",
          "goalscour_unofficial",
          "goalscour_dribbles",
          "goalscour_match_performances"
        ];

        const responses = await Promise.all(
          names.map(name =>
            db.from(name).select("*")
          )
        );

        const failedIndex = responses.findIndex(
          response => response.error
        );

        if (failedIndex !== -1) {
          const error = responses[failedIndex].error;

          throw new Error(
            names[failedIndex] + ": " + error.message
          );
        }

        const [
          players,
          matches,
          unofficial,
          dribbles,
          performances
        ] = responses.map(
          response => response.data || []
        );

        render(
          players,
          matches,
          unofficial,
          dribbles,
          performances
        );

        status.textContent =
          "اطلاعات " + players.length +
          " بازیکن با موفقیت دریافت شد.";

      } catch (error) {
        console.error(
          "Goalscour Hall of Fame:",
          error
        );

        box.textContent =
          "دریافت اطلاعات ناموفق بود.";

        status.textContent =
          "جزئیات خطا: " +
          (error.message || String(error));
      }
    }

    window.gcRefreshHallOfFame = load;

    load();

    window.setInterval(() => {
      if (!document.hidden) {
        load();
      }
    }, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      startHallOfFame,
      { once: true }
    );
  } else {
    startHallOfFame();
  }
})();
