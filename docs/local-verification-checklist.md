# Local verification checklist

What I verified server-side and what's left for your eyes. Updated after the overnight build + the M3/M4 morning work.

---

## ✅ Verified end-to-end against the live local stack

These are confirmed working — no human inspection needed unless you want to.

### Backend (curl-driven, multi-user)
- Signup → `BETTER_AUTH_SECRET` validation → autoSignIn → token returned
- **Better Auth user-create hook auto-mints an 8-char referral code** (last test: `GW4RQGRE`)
- `POST /favorites` + `GET /favorites` + duplicate 409 + `DELETE` 200
- `POST /checkins` (COMPLETED) → server awards `FIRST_CHECKIN` → emits "First check-in" notification
- `GET /achievements`, `GET /notifications`, `GET /notifications/unread-count` all populated
- Referral redeem flow (user B redeems user A's code) → user A's `referredCount` → 1 + REFERRAL_JOIN notification on user A's inbox
- Referral guards (404 on bad code, 400 on self-redeem, 400 on second redeem)
- `GET /challenges/slug/:slug` returns full challenge JSON

### Mobile (on iOS Simulator)
- Welcome → Register with `Vital30!` → Home with real challenges
- Join challenge → Check in "Yes, completed" → day-complete celebration
- Bell icon orange dot is now driven by real unread count (not hardcoded)
- Notifications inbox shows real "First check-in" notification from the backend
- `flutter analyze` 0 issues, `flutter test` 46/46

### Public website (HTTP 200 on all routes)
```
/  /challenges  /categories  /faq  /privacy  /terms
/health-disclaimer  /sitemap.xml  /robots.txt
/challenges/active-family-weekend
/challenges/active-family-weekend/opengraph-image
```

---

## 👀 Left for your eyes — should take ~10 minutes total

These are visual / UX checks I can't drive headlessly.

### Mobile (back in the running Simulator, hot reload with `r` first)

| Check | Where | Expected |
|---|---|---|
| **Achievements screen** | Profile → Achievements | Header "1 of 5 badges". FIRST_CHECKIN unlocked with today's date + green check. Other 4 dim with lock icon. |
| **Referral code (post-Better-Auth)** | Profile → Invite friends | 8-char code (not "CHARAN-30"). "HAVE A CODE?" Redeem tile below the platform grid. |
| **Help & FAQ** | Profile → Help & FAQ | 9 accordion questions, tap to expand. |
| **Favorites (M3, new)** | Tap heart icon on any challenge card on Home or Challenges → Profile → Saved challenges | Heart fills red on tap; Saved challenges screen lists what you've hearted; tapping a saved card opens its detail. |
| **Share card PNG (M4, new)** | Active challenge → Progress screen → top-right share icon, OR "Share progress" button | New full-bleed share preview (9:16, brand strip, big active-day count, 30-day grid). Tap "Share to…" → iOS share sheet opens with a real PNG attachment. |

### Public website (browser)
- Open http://localhost:3001 and resize to phone width (Chrome DevTools → iPhone SE = 375px)
  - Header collapses to hamburger
  - Hero stacks vertically, phone mockup centers
  - Popular challenges grid: 1 col mobile, 2 col tablet, 3 col desktop
- `/challenges` — type in the search box, change the Category and Difficulty dropdowns; the grid should filter live
- Click any challenge → detail page renders → click "View source" → confirm JSON-LD `Article` schema is in the `<head>`
- Open the OG image directly: `http://localhost:3001/challenges/active-family-weekend/opengraph-image` → should render a green-gradient PNG with the challenge title

---

## 🚦 Status: ready for the next phase

Once the visual checks above pass, the platform is feature-complete for:
- Closed beta (TestFlight + internal Play Store track)
- Marketing site soft launch

Still owed before a public App Store listing:
- Attorney review of `/docs/{privacy,terms,health-disclaimer}.md`
- Real testimonials (replace composites on landing)
- App Store screenshots + metadata
- Contact form backend (currently `mailto:`)
- Push notifications (FCM/APNs — only local notifications work today)
- Web admin restyle to the design system

See [docs/launch-checklist.md](./launch-checklist.md) for the production deploy walkthrough when you're ready.
