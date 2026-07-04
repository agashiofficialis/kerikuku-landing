/* ============================================================
   Karina landing — vanilla JS
   1) LINKS: единственное место, где правятся все внешние ссылки
   2) Донат-цель из donation-goal.json
   3) Галерея: лайтбокс + lazy loading (native)
   ============================================================ */

/* ---------- 1. ССЫЛКИ (заменить плейсхолдеры на реальные URL) ---------- */
const LINKS = {
  kofi:      "https://ko-fi.com/kukukarina",
  bmc:       "https://buymeacoffee.com/kukukarina",
  instagram: "https://www.instagram.com/kuku_karina/",
  threads:   "https://www.threads.com/@kuku_karina",
  x:         "https://x.com/kukukarina",
  merch:     "https://www.inprnt.com/gallery/kuku_karina/", // INPRNT print shop
};

const UTM_SOURCE = "landing";
const UTM_MEDIUM = "cta";

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
    a.href = withUtm(raw, campaign);
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
    document.getElementById("goal-updated").textContent = `updated ${goal.updated}`;
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

/* ---------- 3. ЛАЙТБОКС ---------- */
const items = Array.from(document.querySelectorAll(".gallery button"));
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
let current = -1;
let lastFocus = null;

function openLightbox(i) {
  current = (i + items.length) % items.length;
  const btn = items[current];
  lbImg.src = btn.dataset.full;
  lbImg.alt = btn.querySelector("img").alt;
  if (lightbox.hidden) {
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("lb-close").focus();
  }
}

function closeLightbox() {
  lightbox.hidden = true;
  lbImg.src = "";
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

items.forEach((btn, i) => btn.addEventListener("click", () => openLightbox(i)));

document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-prev").addEventListener("click", () => openLightbox(current - 1));
document.getElementById("lb-next").addEventListener("click", () => openLightbox(current + 1));

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") openLightbox(current - 1);
  if (e.key === "ArrowRight") openLightbox(current + 1);
});

/* ---------- прочее ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
