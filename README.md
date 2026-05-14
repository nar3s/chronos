# NareshOS

Offline-first personal daily OS built with Expo Router, React Native, TypeScript, and Zustand.

Chronos replaces a pile of separate apps with one dark-theme mobile app for:
- Dashboard
- Study
- Gym
- Journal
- More tools like habits, AI insights, distraction blocking, and screen time

## Stack

- Expo SDK 54
- React 19
- React Native 0.81.5
- Expo Router v6
- TypeScript
- Zustand v5 with AsyncStorage persistence

## Current App Surface

### Tabs
- `app/(tabs)/index.tsx` -> Dashboard
- `app/(tabs)/study.tsx` -> Study
- `app/(tabs)/gym.tsx` -> Gym
- `app/(tabs)/journal.tsx` -> Journal
- `app/(tabs)/more.tsx` -> More

### Stack screens
- `app/settings.tsx`
- `app/journal/bookmarks.tsx`
- `app/more/blocker.tsx`
- `app/more/habits.tsx`
- `app/more/insights.tsx`
- `app/more/screen-time.tsx`

### Modals
- `app/modals/log-session.tsx`
- `app/modals/log-workout.tsx`
- `app/modals/log-diary.tsx`
- `app/modals/add-study-plan.tsx`
- `app/modals/add-bookmark.tsx`

## Project Rules

Read [AGENTS.md](/C:/Users/nares/Documents/rn/dailytracker/AGENTS.md) before changing code.

Important constraints:
- No `userId` in local Zustand stores
- Never call `cancelAllScheduledNotificationsAsync()`
- Never use `.filter()` or `.map()` inside a Zustand selector
- Screens and hooks call stores; atoms, molecules, and organisms receive props
- Editing flows open modals instead of inline forms

## Context Docs

Domain and architecture references live in [`.context/`](</C:/Users/nares/Documents/rn/dailytracker/.context/README.md>).

Load the relevant file before working in that area:
- `architecture.md`
- `navigation.md`
- `notifications.md`
- `dashboard.md`
- `study.md`
- `gym.md`
- `journal.md`
- `more.md`
- `habits.md`

## Local Development

```bash
npm install
npm run start
```

Useful scripts:
- `npm run android`
- `npm run ios`
- `npm run web`

## Android Notes

- The distraction blocker and screen-time tracking require a native Android build.
- Expo Go will not load `modules/my-module`.
- The app requests `android.permission.PACKAGE_USAGE_STATS`.
- Accessibility permission must be enabled manually for the blocker flow.

