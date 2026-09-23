# Firebase — Unified Foundation

One Firebase project — **`apsmono-projects`** — backs every project. Each project gets its
**own Cloud Functions codebase** but they all read/write **one Firestore database** and
**one Storage bucket**. This file is the contract.

> **Config topology (changed 2026-09-23).** The parent `projects` repo was dissolved; there is
> no longer a directory that contains every app as a sibling, so the single central
> `firebase.json` was split. Config now lives in the repo that owns it:
>
> | Repo | Owns | Deploys |
> |---|---|---|
> | `dashboard` (here) | `firebase/` rules, indexes, remoteconfig, emulator ports | `firestore:rules`, `firestore:indexes`, `storage`, `remoteconfig` |
> | `wedding-invitation` | its own `functions/` + `firebase.json` | `functions:wedding` |
> | `koperasi` | its own `functions/` + `firebase.json` | `functions:koperasi` |
>
> All three ship the same `.firebaserc` (`default = apsmono-projects`). Deploy each from its
> own repo root — no cross-repo paths remain.

> Status: **foundation only**. Config, rules, shared snippets, and skeletal function
> codebases are in place. No per-project feature APIs are built yet — see the
> [per-project to-do](#per-project-to-do) below.

## What's wired up

| Feature | State |
|---|---|
| **Firestore** | One DB, project-prefixed collections. Rules in `firebase/firestore.rules`. |
| **Auth** | Single-owner admin via custom claim `admin == true`. solo-leveling already verifies ID tokens server-side. |
| **Storage** | One bucket, project-prefixed paths. Rules in `firebase/storage.rules`. |
| **Cloud Functions** | Per-project codebases `wedding`, `koperasi` (Node 20 + TS). solo-leveling stays FastAPI. |
| **Remote Config** | Defaults in `firebase/remoteconfig.template.json`; edit live in console. |
| **App Check** | Client snippet in `firebase/shared/firebase-init.ts`; register apps + reCAPTCHA key in console. |
| **FCM (Messaging)** | Send via solo-leveling Admin SDK later; web clients need a service worker + VAPID key (console). |
| **Analytics** | `measurementId` already in web config; `getAnalytics()` in the shared init snippet. |
| **Hosting** | **Intentionally not used.** Frontends ship to GitHub Pages / Cloudflare Pages; solo-leveling runs on MacMini. |

## Layout

```
firebase.json                 central config (firestore, storage, functions[], emulators)
.firebaserc                   default project = apsmono-projects
firebase/
  firestore.rules             all collection blocks (incl. grandfathered reminders/commands)
  firestore.indexes.json      composite indexes (seed/empty)
  storage.rules
  remoteconfig.template.json
  shared/                     COPY-SOURCE snippets (not an importable package)
    firebase-init.ts          client init + App Check + Analytics
    collections.ts            collection/path name constants
    rsvp.schema.ts            client validation mirroring the rules
wedding-invitation/functions/ TS codebase "wedding"  (lives in the submodule)
koperasi/functions/           TS codebase "koperasi" (lives in the submodule)
```

## Collection & path naming

Flat, **project-prefixed** top-level collections. solo-leveling's `reminders` and
`commands` are **grandfathered unprefixed — never rename them** (the live backend depends
on them). Canonical names live in `firebase/shared/collections.ts`.

| Project | Collections | Storage paths |
|---|---|---|
| solo-leveling | `reminders`, `commands` | — |
| wedding-invitation | `wedding_rsvps`, `wedding_guestbook` | `wedding/` |
| koperasi | `koperasi_contacts`, `koperasi_members` | `uploads/koperasi/` |
| dashboard | none (reads solo-leveling API) | — |

## Admin gate (one-time setup)

Rules treat a user as owner when their ID token carries the custom claim `admin == true`.
Set it once with the Admin SDK (e.g. a one-off script in solo-leveling):

```python
from firebase_admin import auth
auth.set_custom_user_claims(uid, {"admin": True})  # then user must re-login to refresh token
```

This keeps the owner's email out of git and is rule-friendly. solo-leveling's existing
`ALLOWED_USER_EMAIL` gate (server-side, in `src/integrations/firebase/auth.py`) is
unaffected and can keep running in parallel.

## Critical gotchas

1. **Admin SDK bypasses rules.** solo-leveling's server writes ignore `firestore.rules`.
   Rules only gate client SDKs — keep server-side validation in FastAPI.
2. **Rules/indexes are project-global and all-or-nothing.** They live ONLY in the parent
   repo. `firebase deploy --only firestore:rules` overwrites the whole rule set.
3. **Deploy one codebase at a time:** `firebase deploy --only functions:wedding`. A bare
   `firebase deploy --only functions` touches every codebase and can delete functions whose
   source isn't checked out.
4. **Submodule SHA bump.** Function code lives in submodules; `firebase.json` is in the
   parent. After editing function code: commit + push in the submodule, then
   `git add <submodule>` + commit in the parent. Otherwise you deploy stale code.
5. **Secrets never enter git.** Functions use the runtime service account automatically (no
   key file). Only solo-leveling needs an explicit service-account key — kept in MacMini env,
   gitignored. Verify each submodule's `.gitignore` covers `.env` / `.credentials/`.
6. **Shared DB collisions.** One prod DB for everything — always use the emulator for local
   dev and tests; never seed/test against prod.

## Local development (emulator suite)

```bash
# from the parent repo root
firebase use apsmono-projects
cd wedding-invitation/functions && bun install && bun run build && cd ../..
cd koperasi/functions && bun install && bun run build && cd ../..
firebase emulators:start
# Emulator UI: http://localhost:4000  | functions: 5001  firestore: 8080  auth: 9099  storage: 9199
```

Deploy (when feature work is ready):

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage   # rules
firebase deploy --only functions:wedding                            # one codebase
firebase deploy --only functions:koperasi
firebase deploy --only remoteconfig                                 # remote config
```

## Per-project to-do

These are the next steps once the foundation is approved — **not done yet**.

### solo-leveling
- No structural change required now; it already uses Auth + Firestore on this project.
- Later: send push via Admin SDK (`messaging().send(...)`) for reminder delivery.
- Optional: add a one-off script to set the `admin:true` custom claim on the owner uid.

### dashboard
- Add App Check + Analytics init (copy from `firebase/shared/firebase-init.ts`).
- Set `API_BASE` in `dashboard/shared/firebase-config.js` to the real MacMini origin.
- No own Firestore collections — keep reading the solo-leveling API.

### wedding-invitation
- Add the Firebase client SDK to `package.json` (currently absent) — `bun add firebase`.
- Copy `firebase-init.ts`, `collections.ts`, `rsvp.schema.ts` into `src/`.
- Build the RSVP flow: client writes validated docs to `wedding_rsvps` (rules already
  allow public validated `create`), or route through the `wedding` functions codebase if
  you want server-side side effects (e.g. notify the owner).
- Optional: guestbook (`wedding_guestbook`) and gallery uploads to Storage `wedding/`.

### koperasi
- Scaffold copied snippets into the static page's JS (or a small bundler).
- Build contact-form intake → `koperasi_contacts` (public validated `create`), or via the
  `koperasi` functions codebase for email side effects.

### scrapers / microservices
- Out of scope for Firebase wiring.

## Console-only steps (cannot be done from code)
- Register Web apps for App Check and obtain the reCAPTCHA v3 site key; set enforcement.
- Generate the FCM VAPID key; enable the Cloud Messaging API.
- Add every deployed frontend origin to **Auth → Settings → Authorized domains**
  (GitHub Pages, Cloudflare Pages, the MacMini domain).
- Link GA4 for Analytics.
