/**
 * Theme engine — Dark / Light / System
 *
 * Stores preference in localStorage (key: "dash-theme").
 * System mode listens to prefers-color-scheme changes.
 */

const STORAGE_KEY = "dash-theme";
const VALID = ["dark", "light", "system"];

function _apply(name) {
  const html = document.documentElement;
  if (name === "system") {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", name);
  }
}

function _systemIsDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getEffectiveTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) || "system";
  if (stored === "system") {
    return _systemIsDark() ? "dark" : "light";
  }
  return stored;
}

export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || "system";
}

export function setTheme(name) {
  if (!VALID.includes(name)) return;
  localStorage.setItem(STORAGE_KEY, name);
  _apply(name);
}

export function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) || "system";
  _apply(stored);

  // Listen for OS changes when in system mode
  if (window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", () => {
      if (getTheme() === "system") {
        _apply("system");
      }
    });
  }
}
