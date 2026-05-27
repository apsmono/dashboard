/**
 * Viewport engine — Desktop / Mobile Phone
 *
 * Stores preference in localStorage (key: "dash-view").
 * Applies CSS class to <body> for layout switching.
 */

const STORAGE_KEY = "dash-view";
const VALID = ["desktop", "mobile"];

function _apply(name) {
  document.body.classList.remove("view-desktop", "view-mobile");
  document.body.classList.add(name === "mobile" ? "view-mobile" : "view-desktop");
}

export function getView() {
  return localStorage.getItem(STORAGE_KEY) || "desktop";
}

export function setView(name) {
  if (!VALID.includes(name)) return;
  localStorage.setItem(STORAGE_KEY, name);
  _apply(name);
}

export function initViewport() {
  const stored = localStorage.getItem(STORAGE_KEY) || "desktop";
  _apply(stored);
}
