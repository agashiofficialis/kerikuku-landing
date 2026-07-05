/* ============================================================
   Karina landing — vanilla JS
   1) LINKS: единственное место, где правятся все внешние ссылки
   2) Донат-цель: живой счётчик (Worker) + donation-goal.json
   ============================================================ */

/* ---------- 1. ССЫЛКИ (заменить плейсхолдеры на реальные URL) ---------- */
const LINKS = {
  kofi:      "https://ko-fi.com/kukukarina",
  bmc:       "https://buymeacoffee.com/kukukarina",
  instagram: "https://www.instagram.com/kuku_karina/",
  tiktok:    "https://www.tiktok.com/@kukukarina",
  x:         "https://x.com/kukukarina",
  merch:     "https://www.inprnt.com/gallery/kuku_karina/", // INPRNT print shop
  myart:     "https://www.instagram.com/kuku_karina/",      // «My Arts» — вся галерея (можно сменить на портфолио-сайт)
};

const UTM_SOURCE = "landing";
const UTM_MEDIUM = "cta";

// Соцплатформы не терпят чужих query-параметров (Meta отвечает 429),
// и UTM там всё равно бесполезны — метим только донаты и магазин.
const NO_UTM = new Set(["instagram", "tiktok", "x", "myart"]);

function isRealUrl(value) {
  return /^https?:\/\//i.test(value);
}

function withUtm(url, campaign) {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", UTM_SOURCE);
    u.searchParams.set("utm_medium", UTM_MEDIUM);
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    return url;
  }
}

document.querySelectorAll("[data-link]").forEach((a) => {
  const key = a.dataset.link;
  const raw = LINKS[key];
  if (isRealUrl(raw)) {
    const campaign = a.dataset.utmCampaign || key;
    a.href = NO_UTM.has(key) ? raw : withUtm(raw, campaign);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  } else {
    // ссылка ещё не задана — ведём на секцию-якорь, помечаем для владельца
    a.dataset.placeholder = "true";
    a.title = "Ссылка ещё не подключена — задаётся в script.js (LINKS)";
    console.warn(`[landing] link "${key}" не задана — плейсхолдер в script.js`);
  }
});

/* ---------- 2. ДОНАТ-ЦЕЛЬ ---------- */
/* Сумма "собрано" приходит с live-счётчика (Ko-fi webhook → Cloudflare Worker).
   Если Worker недоступен — используется значение из donation-goal.json. */
const GOAL_API = "https://kerikuku-goal.rougevolpe.workers.dev/goal";

const fmt = (n, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

Promise.all([
  fetch("donation-goal.json", { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }),
  fetch(GOAL_API)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null),
])
  .then(([goal, live]) => {
    if (live && Number.isFinite(live.collected)) {
      goal.collected = live.collected;
      if (live.updated) goal.updated = live.updated;
    }
    const pct = Math.max(0, Math.min(100, (goal.collected / goal.goal) * 100));
    const collected = fmt(goal.collected, goal.currency);
    const target = fmt(goal.goal, goal.currency);

    document.getElementById("goal-text").textContent = goal.goal_text;
    document.getElementById("goal-collected").textContent = collected;
    document.getElementById("goal-target").textContent = target;
    document.getElementById("progress-note").textContent = collected;

    const bar = document.getElementById("progress");
    bar.setAttribute("aria-valuenow", Math.round(pct));

    const fill = document.getElementById("progress-fill");
    const note = document.getElementById("progress-note");
    const apply = () => {
      fill.style.width = pct + "%";
      note.style.left = pct + "%";
    };

    if (reducedMotion || !("IntersectionObserver" in window)) {
      apply();
      return;
    }
    // анимация заполнения при появлении в viewport
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        requestAnimationFrame(apply);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(bar);
  })
  .catch((err) => {
    console.error("[landing] donation-goal.json не загрузился:", err);
    document.getElementById("goal-text").textContent =
      "Goal numbers are temporarily unavailable — the Ko-fi button still works.";
  });

/* ---------- 3. АНИМАЦИИ ---------- */
// заголовок: буквы взлетают каскадом
if (!reducedMotion) {
  const h1 = document.getElementById("hero-title");
  const text = h1.textContent;
  h1.setAttribute("aria-label", text);
  h1.innerHTML = text
    .split("")
    .map((ch, i) => `<span class="ltr" aria-hidden="true" style="animation-delay:${(0.18 + i * 0.06).toFixed(2)}s">${ch}</span>`)
    .join("");
}

// блоки проявляются при скролле
const toReveal = document.querySelectorAll(".reveal");
// на телефонах/тач-экранах reveal одноразовый: не прячем при скролле вверх.
// Иначе адресная строка (меняет высоту вьюпорта) и инерционный скролл
// передёргивают наблюдатель — элементы «трясутся».
const oneWayReveal = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
if (reducedMotion || !("IntersectionObserver" in window)) {
  toReveal.forEach((el) => el.classList.add("in"));
} else {
  const ro = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        if (oneWayReveal) ro.unobserve(e.target);
      } else if (!oneWayReveal) {
        e.target.classList.remove("in");
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  toReveal.forEach((el) => ro.observe(el));
}

/* ---------- прочее ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
