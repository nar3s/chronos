# NareshOS — Agent Constitution

> Personal daily OS replacing multiple apps. One app for study, gym, journal, habits, and anything else that matters.
> Stack: Expo SDK 54 · React Native 0.81.5 · TypeScript · Expo Router v6 · Zustand v5

---

## Context Files

Load the relevant `.context/` file before working in any domain.

| File | Domain |
|------|--------|
| `.context/architecture.md` | Patterns, Zustand rules, atomic design, folder conventions |
| `.context/navigation.md` | Routes, modals, tabs, stack screens |
| `.context/notifications.md` | Scheduling, stable IDs, cancelAll prohibition |
| `.context/dashboard.md` | snapshotStore, morning block, AI companion |
| `.context/study.md` | studyStore, studyPlanStore, organisms, modals |
| `.context/gym.md` | gymStore, nutritionStore, PPL, organisms, modals |
| `.context/journal.md` | diaryStore, bookmarkStore, diary + bookmark modals |
| `.context/more.md` | Distraction blocker, native module, settings |

---

## Non-Negotiable Rules

### 1. No userId in any local store — ever
`user_id` is injected at Supabase sync time only. Local stores are auth-unaware. See `.context/architecture.md`.

### 2. Never call cancelAllScheduledNotificationsAsync()
Bookmark reminders are long-lived OS notifications. A cancelAll destroys them silently. See `.context/notifications.md`.

### 3. Never use .filter() or .map() inside a Zustand selector
Returns a new array reference every call → infinite re-render loop. Select raw array, filter outside.

### 4. Organisms and screens go in domain subdirectories
`organisms/journal/`, `screens/study/`, etc. Never drop files in `organisms/` or `screens/` root.

### 5. New domain = new .context/ file
Every new feature domain gets a `.context/domainname.md`. See `.context/README.md` for the checklist.

### 6. Screens are the only layer that calls Zustand
Atoms, molecules, organisms get data via props. Only screens and hooks call `useSomeStore()`.

### 7. No inline edit forms on main screens
Editing always opens a modal. Use `router.push('/modals/...')`.

### 8. Auth-safe architecture
See the full auth-safe architecture rule in `.learnings/PLANS.md` (Plan A). Short version: no `userId` locally, inject at sync.

---

## Active Domains

| Domain | Tab | Status |
|--------|-----|--------|
| Dashboard | `index` | ✅ Live |
| Study | `study` | ✅ Live |
| Gym | `gym` | ✅ Live |
| Journal | `journal` | ✅ Live |
| More | `more` | ✅ Live |
| Job Hunt | — | ❌ Out of scope |
| Construction | — | ❌ Out of scope |

---

## Folder Structure (top level)

```
app/                     — Expo Router routes
  (tabs)/                — 5 tabs: index, study, gym, journal, more
  modals/                — all modals (log-session, log-workout, log-diary, add-study-plan, add-bookmark)
  more/                  — stack screens under More (blocker)
  journal/               — stack screens under Journal (bookmarks)
  settings.tsx
  _layout.tsx            — root Stack + modal registration

src/
  components/
    atoms/
    molecules/
    organisms/           — subdirs: dashboard/ study/ gym/ journal/
    templates/
    screens/             — subdirs: dashboard/ study/ gym/ journal/ more/
  store/                 — one file per domain
  domain/
    types/               — TypeScript interfaces per domain
    constants/           — PPL schedule, topics, exercise templates
  hooks/                 — one hook per domain
  services/              — storage.ts, notifications.ts, aiCompanion.ts
  theme/                 — colors.ts, spacing.ts, typography.ts
  utils/                 — dates.ts, formatters.ts, ppl.ts

modules/my-module/       — Android native module (Distraction Blocker)
.context/                — per-domain reference files (load on demand)
.learnings/              — CHANGES.md (session log) + PLANS.md (feature roadmap)
```

---

## UI Direction

- Dark theme always. No gamification.
- Prefer compact card actions and modal-based editing over dense inline forms.
- Avoid native confirmation dialogs — use custom in-app sheets.
- Prefer the visual direction from `previewscreens/ui_kits/mobile`.
