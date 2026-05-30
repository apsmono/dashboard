Knowledge Library — View System Development Reference

Implementation spec for the Knowledge Library Cards / List / Table view system.

Stack assumption: React frontend + Firestore backend. Adapt router specifics to

your actual router (React Router / TanStack Router / Next App Router).

0. Goal

Rebuild the Knowledge Library browsing experience around three interchangeable views

(Cards, List, Table) that share one query layer and one URL-driven state model. List

view uses NYT-style rows with thumbnails, including video entries with a play facade.

1. Core architecture principle

One query layer. Three renderers. The URL is the single source of truth.

All three views consume the same query result. Do not fork data fetching per

view — fork only the row/grid component that paints the result.

All view state (view mode, sort, search, filters, page) lives in the URL query string.

Components read state from the URL and write state to the URL; nothing else holds

canonical state. This gives shareable links, back-button support, and refresh-safety

for free.

A fourth view later should require only a new renderer, no data-layer changes.

URL  ──parse──▶  view state  ──build query──▶  Firestore  ──result──▶  renderer (Cards|List|Table)

 ▲                                                                          │

 └──────────────────────── user interaction writes back ───────────────────┘

2. Data model changes

Add these fields, computed at ingest / save time (consistent with the existing

write-time derived-flag pattern). Do not compute them at render.

Field

Type

Notes

excerpt

string

1–2 sentence dek for the List row. Scraped meta description for links; first line of body for terms/thoughts.

mediaType

enum

"link" | "video" | "text". Detected from the saved URL.

provider

string | null

"youtube" | "vimeo" | null. From URL host.

videoId

string | null

Parsed from the URL.

duration

number | null

Seconds, for the duration badge. From oEmbed at ingest.

thumbnail

string | null

OG image (links) or provider thumbnail (video). Null for text entries → render generated monogram.

domain

string | null

Host of the source URL, for the source label.

updatedAt

timestamp

Needed for "recently updated" sort.

Thumbnail rules:

Video (YouTube): [https://img.youtube.com/vi/{videoId}/maxresdefault.jpg](https://img.youtube.com/vi/{videoId}/maxresdefault.jpg),

fall back to hqdefault.jpg on 404.

Video (Vimeo/other): resolve thumbnail via provider oEmbed at ingest, store URL.

Link: scrape OpenGraph og:image + og:description once at save time.

Text (term/thought/reference w/o URL): no image. Renderer generates a monogram

(first letter of title) tinted by entry type. Never leave an empty thumbnail slot.

3. URL / search-params contract

This schema is the contract between the URL and the data layer. Implement one

serialize(state) and one parse(searchParams) helper; everything else uses them.

?view=list            # cards | list | table

&sort=newest          # newest | oldest | title | updated | type

&q=elixir             # free-text search, debounced

&type=term,reference  # comma-separated entry types (OR)

&tags=concept,ml      # comma-separated tags

&tagMode=any          # any (OR) | all (AND)  ← default "any" (see §7)

&status=active        # draft | active | (omitted = all)

&media=video          # link | video | text | (omitted = all)

&page=2               # 1-indexed page number

Rules:

Hydrate full state from the URL on load. Sync state → URL on every change.

Search input: debounce ~300ms. Use replaceState while typing, pushState on

submit/blur. Never push history on every keystroke.

Changing any filter, sort, or search resets page to 1 and resets the pagination

cursor stack (§4).

localStorage may hold a default view for when the URL omits it. URL always wins.

Omit default-valued params from the URL to keep links clean.

4. Data layer (query + pagination + counts)

Query

Build the Firestore query from parsed URL state: where clauses for type/tag/status/

media, orderBy for sort, limit for page size.

Pagination — cursor-based, not offset

Firestore offset() bills for skipped docs and does not scale. Use cursors.

Forward: query.startAfter(lastVisibleDoc).limit(pageSize).

Maintain a cursor stack so Prev works: push the first-doc snapshot of each page.

UI is Next / Prev (+ "page N of M" label from the count below). Avoid arbitrary

"jump to page 7" — it is not Firestore-native.

Reset the cursor stack whenever filter/sort/search changes.

Total count

Use the Firestore count() aggregation query (GA) for:

the "N entries" header,

total page count (ceil(count / pageSize)),

the live "Show N results" preview inside the filter modal (§6).

One cheap aggregation call — do not read all docs to count.

Page size

Selector already exists (12 / page). View may set a sensible default:

Cards 12, List 12, Table 25. Page size lives in component/local state (not required in URL

unless you want it shareable).

5. View modes

All three render the same entries[]. Differences below.

5.1 Cards (existing)

Keep current behavior. Visual, tag-forward, discovery-oriented.

5.2 List — NYT-style rows

Row anatomy (left content column + right thumbnail):

┌─────────────────────────────────────────────┬──────────┐

│ KICKER (TYPE · status)                        │          │

│ Headline (title, clamp 2 lines)               │  thumb   │  96×72

│ Excerpt / dek (clamp 2 lines, muted)          │  96×72   │

│ #tag #tag                      �clock  date    │          │

└─────────────────────────────────────────────┴──────────┘

Kicker: uppercase type + status, small, info-colored.

Headline: title, 2-line clamp.

Dek: excerpt, 2-line clamp, muted.

Thumbnail (right, ~96×72, rounded):

link → thumbnail (OG image)

text → generated monogram tinted by type

video → thumbnail + play facade (below)

Drafts read distinctly: muted kicker, dashed thumbnail frame.

Responsive: hide/shrink thumbnail under ~480px; dek clamps to 1 line.

Video rows (facade pattern — important)

Do not mount a YouTube iframe per row. N iframes destroy scroll performance and

leak tracking. Use a facade:

Render thumbnail + centered play button + duration badge (bottom-right corner).

On click, swap the facade for the real player — either inline-expand the row or open

the detail drawer (§9) with the embed.

Use [youtube-nocookie.com](http://youtube-nocookie.com) for the embed. Consider the lite-youtube-embed library,

or a ~30-line custom facade.

Play button is a real <button aria-label="Play video: {title}">, keyboard-activatable.

thumbnail (img.youtube.com/vi/{id}/maxresdefault.jpg)

   + <button> play overlay      ──click──▶  iframe [youtube-nocookie.com/embed/{id}?autoplay=1](http://youtube-nocookie.com/embed/{id}?autoplay=1)

   + duration badge "12:04"

5.3 Table

Densest view; power-user / bulk-ops surface.

Use TanStack Table for headless column logic (sorting, selection, column config).

Columns: select checkbox · title · type · status · tags · domain/source · date.

Sortable column headers with aria-sort.

Row selection enables bulk actions (§9).

Column show/hide + reorder (persist to localStorage).

Constrained width → table-layout: fixed + explicit widths, or horizontal scroll.

Hover = flat row highlight, not a lift (lifting breaks the grid — see §8).

6. Filter modal

Inline type/tag chips stay for quick access; the modal holds the richer combinations.

Contents:

Type (multi-select)

Tags (multi-select) + AND/OR toggle (tagMode)

Status (draft / active)

Media type (link / video / text)

Date range

Source domain

Behavior:

Live result count via count() before applying ("Show 24 results").

A persistent active-filters bar outside the modal: applied filters as removable

chips, visible even when the modal is closed.

"Clear all" resets all filter params (not search/sort/view).

7. Firestore constraints & required indexes

⚠️ These shape the UI. Read before building filters.

Tag AND-filtering is the main gotcha

Firestore allows only one array-contains per query.

array-contains-any is OR only (max 30 values).

So "has tag X and tag Y" is not a single native query. Options:

Denormalized boolean flag fields per common tag, written at ingest

(matches the existing flag-at-ingest pattern) — query where('tag_concept','==',true).

Composite tag-combination fields at ingest.

Client-side intersection after an OR query (only viable at small scale).

Recommendation: default tagMode=any (OR via array-contains-any). Make all

(AND) opt-in, backed by boolean flag fields for the common tags.

Composite indexes

Every filter + orderBy combination needs a composite index, or Firestore throws at

runtime. Plan the index set up front. Minimum expected:

entries: status ASC,  createdAt DESC

entries: type   ASC,  createdAt DESC

entries: mediaType ASC, createdAt DESC

entries: tags ARRAY,  createdAt DESC          # array-contains-any + orderBy

entries: status ASC,  title ASC               # title sort + status filter

entries: <each active filter> + <each sort field>

Generate the full matrix from {active filters} × {sort fields} and add to

firestore.indexes.json. Firestore's error message includes a create-index link — but

pre-declaring avoids prod failures.

Counts

count() aggregation respects the same where clauses — use it for filtered totals too.

8. Interaction & accessibility details

Hover (Cards/List): translateY(-2px) + box-shadow + accent border. Animate

transform and box-shadow only (GPU); never animate layout properties.

Table hover: flat row highlight, no lift.

Focus: mirror the hover affordance on :focus-visible for keyboard users.

Reduced motion: wrap lift/transition in @media (prefers-reduced-motion: reduce).

Keyboard nav: / focuses search (exists); j/k move row selection; Enter

opens the entry (drawer); g c / g l / g t switch views.

Semantics: List uses list roles; Table uses real table semantics with aria-sort

on sortable headers. Modal traps focus and restores it on close.

Images: lazy-load thumbnails (loading="lazy"); provide alt from title.

9. Additional features (phased, post-core)

Detail drawer: open an entry in a side panel on row/card click without leaving the

list. Also hosts the video player for facade click-through.

Bulk actions (Table): select rows → retag / change status / archive.

Saved / smart views: "To read", "Drafts", "This week" as presets that just set URL

params.

Sort options: newest, oldest, title A–Z, recently updated, by type (each needs an

index — §7).

Search match highlighting: bold matched term in title/excerpt.

Density toggle: comfortable / compact for List + Table.

Skeletons + empty states: one per view; design deliberately.

Virtualization: add TanStack Virtual / react-window once entries exceed a few

hundred.

10. Build order

Sequenced so each phase rests on the previous. Each task lists acceptance criteria.

Phase 1 — Foundations

URL state helpers — parse(searchParams) + serialize(state) for the full §3 schema.

✅ Reloading any URL reproduces the exact view, filters, sort, page.

✅ Back button steps through filter/search changes correctly.

Shared query hook — builds the Firestore query from parsed state; returns

{ entries, loading, error }.

✅ All views call this one hook; no view fetches independently.

Phase 2 — Views

View tabs (Cards / List / Table segmented control) wired to ?view=.

✅ Switching views re-renders the same result set with no refetch jank.

List renderer with NYT row anatomy + thumbnail fallbacks + video facade.

✅ Link, text, and video entries each render correct thumbnails.

✅ Clicking a video play button loads the embed; no iframes mount until clicked.

Table renderer (TanStack Table): columns, sortable headers, selection.

✅ Sort + select work; hover highlights flat (no lift).

Phase 3 — Pagination & counts

Cursor pagination (Next/Prev + cursor stack) + page-size selector.

✅ Prev returns to the exact prior page; cursor stack resets on filter/sort change.

count() aggregation for header total + page count.

✅ "N entries" and "page N of M" are correct without reading all docs.

Phase 4 — Filtering

Filter modal + active-filters bar + live result count.

✅ AND/OR tag toggle works; OR is default, AND backed by flag fields.

✅ Modal shows accurate "Show N results" before applying.

Composite indexes declared in firestore.indexes.json.

✅ No runtime index errors across the filter × sort matrix.

Phase 5 — Polish

Detail drawer, bulk actions, saved views, hover/focus/reduced-motion, keyboard nav,

skeletons, empty states, search highlighting.

11. Non-goals & conventions

Non-goal: offset-based "jump to arbitrary page" (not Firestore-native).

Non-goal: embedding live YouTube iframes per row.

Non-goal: computing thumbnails/excerpts at render time — always at ingest.

Convention: URL is canonical state; components never hold duplicate filter state.

Convention: derived fields (mediaType, provider, thumbnail, flag fields) are

written once at save time, never recomputed on read.

