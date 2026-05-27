import { onAuthChanged, signIn, doSignOut } from "./auth.js";
import { apiGet, apiPost, apiDelete, sendCommand } from "./api.js";
import { initTheme, setTheme, getTheme } from "./theme.js";
import { initViewport, setView, getView } from "./viewport.js";

const loginGate = document.getElementById("login-gate");
const dashboard = document.getElementById("dashboard");
const nav = document.getElementById("nav");
const userEmail = document.getElementById("user-email");

const views = {
  overview: document.getElementById("view-overview"),
  library: document.getElementById("view-library"),
  graph: document.getElementById("view-graph"),
  timeline: document.getElementById("view-timeline"),
  analysis: document.getElementById("view-analysis"),
  planning: document.getElementById("view-planning"),
  commands: document.getElementById("view-commands"),
  reminders: document.getElementById("view-reminders"),
  cmd: document.getElementById("view-cmd"),
};

// =============================================
// Theme & Viewport initialization
// =============================================

initTheme();
initViewport();

// Theme toggle buttons
function _refreshThemeButtons() {
  const current = getTheme();
  document.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === current);
  });
}
_refreshThemeButtons();

document.querySelectorAll("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    setTheme(btn.dataset.theme);
    _refreshThemeButtons();
  });
});

// Viewport toggle buttons
function _refreshViewButtons() {
  const current = getView();
  document.querySelectorAll("[data-viewmode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.viewmode === current);
  });
}
_refreshViewButtons();

document.querySelectorAll("[data-viewmode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    setView(btn.dataset.viewmode);
    _refreshViewButtons();
  });
});

// =============================================
// Navigation
// =============================================

function showView(name) {
  Object.values(views).forEach((el) => el.classList.add("hidden"));
  if (views[name]) views[name].classList.remove("hidden");
  nav.querySelectorAll("a").forEach((a) => a.classList.remove("active"));
  const active = nav.querySelector(`[data-view="${name}"]`);
  if (active) active.classList.add("active");
}

nav.addEventListener("click", (e) => {
  if (e.target.dataset.view) {
    e.preventDefault();
    showView(e.target.dataset.view);
    if (e.target.dataset.view === "overview") loadOverview();
    if (e.target.dataset.view === "library") { loadLibrarySections(); loadLibrary(false); }
    if (e.target.dataset.view === "commands") loadCommands();
    if (e.target.dataset.view === "reminders") loadReminders();
  }
});

// =============================================
// Auth
// =============================================

document.getElementById("btn-login").addEventListener("click", async () => {
  try {
    await signIn();
  } catch (e) {
    alert("Sign-in failed: " + e.message);
  }
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await doSignOut();
});

onAuthChanged((user) => {
  if (user) {
    loginGate.classList.add("hidden");
    dashboard.classList.remove("hidden");
    userEmail.textContent = user.email;
    showView("overview");
    loadOverview();
  } else {
    loginGate.classList.remove("hidden");
    dashboard.classList.add("hidden");
    userEmail.textContent = "";
  }
});

// =============================================
// Utilities
// =============================================

function setBanner(id, message) {
  const el = document.getElementById(id);
  if (!message) {
    el.textContent = "";
    el.classList.add("hidden");
    return;
  }
  el.textContent = message;
  el.classList.remove("hidden");
}

// =============================================
// Overview
// =============================================

async function loadOverview() {
  setBanner("overview-error", "");
  try {
    const data = await apiGet("/api/v1/dashboard/stats");
    const lib = data.library || {};
    document.getElementById("stat-profile").textContent = lib.profile || 0;
    document.getElementById("stat-terms").textContent = lib.terms || 0;
    document.getElementById("stat-books").textContent = lib.books || 0;
    document.getElementById("stat-articles").textContent = lib.articles || 0;
    document.getElementById("stat-thoughts").textContent = lib.thoughts || 0;
    document.getElementById("stat-references").textContent = lib.references || 0;

    const health = data.integrations || {};
    const healthEl = document.getElementById("health-list");
    healthEl.innerHTML = Object.entries(health)
      .map(
        ([name, ok]) =>
          `<div class="health-item"><span class="dot ${ok ? "ok" : "fail"}"></span>${name}</div>`
      )
      .join("");
  } catch (e) {
    console.error(e);
    setBanner("overview-error", e.message || "Could not load overview.");
  }
}

// =============================================
// Commands
// =============================================

async function loadCommands() {
  try {
    const cmds = await apiGet("/api/v1/commands");
    const tbody = document.querySelector("#commands-table tbody");
    tbody.innerHTML = cmds
      .map(
        (c) =>
          `<tr><td>${new Date(c.created_at).toLocaleString()}</td><td>${
            c.text
          }</td><td>${c.intent || ""}</td></tr>`
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

// =============================================
// Reminders
// =============================================

async function loadReminders() {
  setBanner("reminders-error", "");
  const tbody = document.getElementById("reminders-tbody");
  const table = document.getElementById("reminders-table");
  const empty = document.getElementById("reminders-empty");
  try {
    const data = await apiGet("/api/v1/reminders");
    const items = Array.isArray(data.items) ? data.items : [];
    tbody.innerHTML = "";
    if (items.length === 0) {
      table.classList.add("hidden");
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    table.classList.remove("hidden");
    for (const row of items) {
      const tr = document.createElement("tr");
      const tdWhen = document.createElement("td");
      tdWhen.textContent = row.run_at ? new Date(row.run_at).toLocaleString() : "—";
      const tdMsg = document.createElement("td");
      tdMsg.textContent = row.message || "";
      const tdBtn = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-danger";
      btn.textContent = "Delete";
      btn.addEventListener("click", async () => {
        if (!row.id || !confirm("Remove this reminder?")) return;
        try {
          const out = await apiDelete(`/api/v1/reminders/${encodeURIComponent(row.id)}`);
          if (out.status === "error") {
            alert(out.reply || "Delete failed");
            return;
          }
          await loadReminders();
        } catch (e) {
          alert(e.message);
        }
      });
      tdBtn.appendChild(btn);
      tr.append(tdWhen, tdMsg, tdBtn);
      tbody.appendChild(tr);
    }
  } catch (e) {
    console.error(e);
    table.classList.add("hidden");
    empty.classList.add("hidden");
    setBanner("reminders-error", e.message || "Could not load reminders.");
  }
}

document.getElementById("reminder-create").addEventListener("click", async () => {
  const message = document.getElementById("reminder-msg").value.trim();
  const runAt = document.getElementById("reminder-time").value;
  if (!message || !runAt) return;
  try {
    const out = await apiPost("/api/v1/reminders", { message, run_at: runAt });
    if (out.status === "error") {
      alert(out.reply || "Could not create reminder");
      return;
    }
    document.getElementById("reminder-msg").value = "";
    document.getElementById("reminder-time").value = "";
    loadReminders();
  } catch (e) {
    alert(e.message);
  }
});

// =============================================
// Library
// =============================================

let _libPage = 1;
let _libPerPage = 20;
let _libHasMore = false;

async function loadLibrary(append = false) {
  setBanner("library-error", "");
  const grid = document.getElementById("lib-grid");
  const empty = document.getElementById("lib-empty");
  const moreWrap = document.getElementById("lib-more-wrap");

  if (!append) {
    grid.innerHTML = "";
    _libPage = 1;
  }

  const section = document.getElementById("lib-section").value;
  const status = document.getElementById("lib-status").value;
  const search = document.getElementById("lib-search").value.trim();

  const params = new URLSearchParams();
  params.set("page", String(_libPage));
  params.set("per_page", String(_libPerPage));
  if (section) params.set("section", section);
  if (status) params.set("status", status);
  if (search) params.set("search", search);

  try {
    const data = await apiGet("/api/v1/library/entries?" + params.toString());
    const entries = data.entries || [];
    _libHasMore = data.total > _libPage * _libPerPage;

    if (entries.length === 0 && !append) {
      grid.classList.add("hidden");
      empty.classList.remove("hidden");
      moreWrap.classList.add("hidden");
      return;
    }

    grid.classList.remove("hidden");
    empty.classList.add("hidden");

    for (const e of entries) {
      const card = document.createElement("div");
      card.className = "lib-card";
      const sectionClass = "section-" + (e.section || "").toLowerCase();
      const tagsHtml = (e.tags || [])
        .map((t) => `<span class="lib-tag">${escapeHtml(t)}</span>`)
        .join("");
      card.innerHTML = `
        <div class="lib-card-title">${escapeHtml(e.title)}</div>
        <div class="lib-card-meta">
          <span class="lib-badge ${sectionClass}">${escapeHtml(e.section || "")}</span>
          ${e.status ? `<span class="lib-badge">${escapeHtml(e.status)}</span>` : ""}
          ${e.captured_at ? `<span class="muted">${new Date(e.captured_at).toLocaleDateString()}</span>` : ""}
        </div>
        <div class="lib-tags">${tagsHtml}</div>
      `;
      card.addEventListener("click", () => openEntryModal(e.id));
      grid.appendChild(card);
    }

    moreWrap.classList.toggle("hidden", !_libHasMore);
  } catch (err) {
    console.error(err);
    setBanner("library-error", err.message || "Could not load library.");
  }
}

async function loadLibrarySections() {
  try {
    const data = await apiGet("/api/v1/library/sections");
    const select = document.getElementById("lib-section");
    const current = select.value;
    // Keep first option, remove others
    while (select.children.length > 1) select.removeChild(select.lastChild);
    for (const s of data.sections || []) {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
      select.appendChild(opt);
    }
    select.value = current;
  } catch (e) {
    console.error(e);
  }
}

async function openEntryModal(entryId) {
  const modal = document.getElementById("entry-modal");
  const titleEl = document.getElementById("entry-modal-title");
  const metaEl = document.getElementById("entry-modal-meta");
  const bodyEl = document.getElementById("entry-modal-body");

  titleEl.textContent = "Loading...";
  metaEl.innerHTML = "";
  bodyEl.innerHTML = "";
  modal.classList.remove("hidden");

  try {
    const data = await apiGet("/api/v1/library/entries/" + encodeURIComponent(entryId));
    titleEl.textContent = data.title || "Untitled";
    const sectionClass = "section-" + (data.section || "").toLowerCase();
    const tagsHtml = (data.tags || [])
      .map((t) => `<span class="lib-tag">${escapeHtml(t)}</span>`)
      .join("");
    metaEl.innerHTML = `
      <span class="lib-badge ${sectionClass}">${escapeHtml(data.section || "")}</span>
      ${data.status ? `<span class="lib-badge">${escapeHtml(data.status)}</span>` : ""}
      ${data.captured_at ? `<span class="muted">${new Date(data.captured_at).toLocaleString()}</span>` : ""}
      <div class="lib-tags" style="margin-top:0.5rem;">${tagsHtml}</div>
    `;
    bodyEl.innerHTML = typeof marked !== "undefined" ? marked.parse(data.markdown || "") : escapeHtml(data.markdown || "");
  } catch (err) {
    titleEl.textContent = "Error";
    bodyEl.textContent = err.message || "Failed to load entry.";
  }
}

document.getElementById("entry-modal-close").addEventListener("click", () => {
  document.getElementById("entry-modal").classList.add("hidden");
});

document.getElementById("entry-modal").addEventListener("click", (e) => {
  if (e.target.id === "entry-modal") {
    document.getElementById("entry-modal").classList.add("hidden");
  }
});

document.getElementById("lib-filter-btn").addEventListener("click", () => {
  loadLibrary(false);
});

document.getElementById("lib-search").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadLibrary(false);
});

document.getElementById("lib-more-btn").addEventListener("click", () => {
  _libPage += 1;
  loadLibrary(true);
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// =============================================
// Command input
// =============================================

document.getElementById("dash-cmd-send").addEventListener("click", async () => {
  const input = document.getElementById("dash-cmd-input");
  const text = input.value.trim();
  if (!text) return;
  try {
    const data = await sendCommand(text);
    document.getElementById("dash-cmd-output").textContent = data.reply || data.status;
  } catch (e) {
    document.getElementById("dash-cmd-output").textContent = "Error: " + e.message;
  }
});
