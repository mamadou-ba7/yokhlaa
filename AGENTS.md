# Yokh Laa - Agent Instructions

> This file is read by both Claude Code (Anthropic) and Codex (OpenAI).
> See CLAUDE.md for the full project reference.

## Quick Reference

### What is this project?
React Native + Expo ride-hailing app for Dakar, Senegal. Backend: Supabase. Language: French UI.

### Commands
```bash
npm start                           # Dev server
npx expo export --platform web      # Build check (MUST pass before any PR)
```

### Key Files
- `/App.js` — Navigation + deep linking + notification listeners
- `/src/screens/` — 17 screens (see CLAUDE.md for full list)
- `/src/lib/` — Auth, Supabase, notifications, haptics, traffic, search history
- `/src/constants/theme.js` — All colors, sizes, fonts
- `/CLAUDE.md` — Full project documentation

### Database
Supabase project `oxzczrwsyvuavgevfhko`. Tables: profiles, rides, messages, subscriptions, waitlist.
Store credentials in local env files only (`.env`, `supabase/.env`) and run SQL migrations via Management API:
```bash
curl -s -X POST "https://api.supabase.com/v1/projects/oxzczrwsyvuavgevfhko/database/query" \
  -H "Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR SQL HERE"}'
```

### Rules
1. Dark mode only (COLORS.black background)
2. French UI text, no i18n
3. Functional components + StyleSheet.create
4. Import COLORS from `../constants/theme`
5. Use haptics from `../lib/haptics` on all interactions
6. Skeleton loading for lists
7. Register new screens in App.js (MainStack + AuthStack if public)
8. Always verify build with `npx expo export --platform web`
9. No class components, no external chart libs
10. Always use the local `SUPABASE_MANAGEMENT_TOKEN` env var for SQL migrations
