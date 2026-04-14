/**
 * Landing CTAs, footer auth triggers, footer year, and optional Calm UI (reduced motion).
 */
const CALM_KEY = "upeo_calm_ui";

function applyCalmPreference() {
  let calm = false;
  try {
    if (localStorage.getItem(CALM_KEY) === "1") calm = true;
  } catch {
    /* private mode */
  }
  if (!calm && window.matchMedia("(prefers-reduced-motion: reduce)").matches) calm = true;
  document.documentElement.classList.toggle("upeo-calmer", calm);
}

function syncCalmButton(btn) {
  if (!btn) return;
  const on = document.documentElement.classList.contains("upeo-calmer");
  btn.setAttribute("aria-pressed", on ? "true" : "false");
}

document.addEventListener("DOMContentLoaded", () => {
  applyCalmPreference();

  const openLogin = document.getElementById("openLoginBtn");
  const openRegister = document.getElementById("openRegisterBtn");
  const triggerLogin = () => openLogin?.click();

  document.getElementById("heroLoginBtn")?.addEventListener("click", triggerLogin);
  document.getElementById("trustCtaBtn")?.addEventListener("click", triggerLogin);
  document.getElementById("footerLoginBtn")?.addEventListener("click", triggerLogin);
  document.getElementById("footerRegisterBtn")?.addEventListener("click", () => openRegister?.click());

  const calmBtn = document.getElementById("upeoReduceMotionBtn");
  syncCalmButton(calmBtn);
  calmBtn?.addEventListener("click", () => {
    document.documentElement.classList.toggle("upeo-calmer");
    const nowOn = document.documentElement.classList.contains("upeo-calmer");
    try {
      if (nowOn) localStorage.setItem(CALM_KEY, "1");
      else localStorage.removeItem(CALM_KEY);
    } catch {
      /* ignore */
    }
    syncCalmButton(calmBtn);
    const live = document.getElementById("upeo-live-landing");
    if (live) {
      live.textContent = nowOn
        ? "Calm UI on: extra motion and transitions are reduced."
        : "Calm UI off: standard motion restored.";
    }
  });

  const y = document.getElementById("upeo-year");
  if (y) y.textContent = String(new Date().getFullYear());
});
