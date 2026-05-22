# QA Plan: Multi-Sport Support (Basketball + MMA)

## Test Scenarios

### TS1: Homepage (Football) — Happy Path
**Steps:**
1. Navigate to `/`
2. Observe navigation pills: Football, Básquet, MMA
3. Click "Football" pill (already active by default)

**Expected:**
- Page loads with tabs: All | Live | Upcoming | Finished
- No errors in console
- API `/api/matches` called

---

### TS2: Basketball Page
**Steps:**
1. Click "Básquet" pill in navigation
2. Wait for page to load
3. Verify tabs work: click "Live", "Upcoming", "Finished"

**Expected:**
- URL changes to `/basketball`
- Shows NBA matches with correct sport icon (🏀)
- Live tab shows: Lakers vs Celtics (3'), Warriors vs Heat (8')
- Upcoming tab shows: Nets vs 76ers
- Finished tab shows: Bulls vs Bucks (FT 112-118)
- Quarter scores visible (Q1, Q2, Q3, Q4)

---

### TS3: MMA Page
**Steps:**
1. Click "MMA" pill in navigation
2. Wait for page to load

**Expected:**
- URL changes to `/mma`
- Shows UFC fights
- No console errors (empty logo handled with fallback)
- Fight cards show: knockout, submission badges

---

### TS4: Match Detail Navigation
**Steps:**
1. On `/basketball`, click any match card
2. On `/mma`, click any fight card

**Expected:**
- Navigates to `/match/{id}`
- Sport is correctly identified from URL

---

### TS5: BottomNav Mobile Navigation
**Steps:**
1. Resize viewport to mobile (< 768px)
2. Verify bottom navigation shows sport options

**Expected:**
- BottomNav visible
- Taps navigate to correct sport pages

---

## Edge Cases

- [ ] **Empty logo:** MMA fighters show fallback (initial letter) — verified ✅
- [ ] **No API key:** App works with mock data only
- [ ] **Network error:** Error state shown gracefully
- [ ] **No matches:** "No live matches" empty state renders
- [ ] **Invalid image hostname:** next.config.ts remotePatterns configured ✅

## Bugs Encontrados

| # | Descripción | Severidad | Link |
|---|-------------|-----------|------|
| 1 | MMA fighters logo empty string → error | Fijo ✅ | - |

## Release Blocker

- Ninguno. Feature completa y funcional.

---

## Checklist de Sign-off

- [ ] `/basketball` renders correctly
- [ ] `/mma` renders correctly
- [ ] Navigation pills switch between sports
- [ ] Console no errors
- [ ] TypeScript builds without errors
- [ ] ESLint passes (warnings OK)
