# Vital30 Brand & Visual Design System

**Version:** 1.0.0  
**Status:** Released  
**Target Environments:** Flutter Mobile App (`apps/mobile`), React Admin Dashboard (`apps/admin`)  

---

## 1. Brand Personality

Vital30 occupies a distinct space between cold, clinical tracking applications and overly casual, childishly gamified apps. It is structured around five core brand qualities:

* **🍀 Motivating & Friendly**: Celebrates success with warm streaks, smooth check-ins, and encouraging visual progress loops without childish cartoon drawings.
* **✨ Clean & Trustworthy**: Focuses on airy whitespace, harmonious alignments, and a sense of absolute reliability.
* **🛡️ Health-focused but Not Clinical**: Uses botanical emerald greens and deep ocean trust blues instead of cold sterile whites or hospital colors.
* **🎯 Adult & Intentional**: Tailored to busy professionals who value structured, pre-packaged "habit blueprints" over customizable overload.

---

## 2. Color Palette

Our tailored color palette is designed to ensure visual harmony, trust, and AA/AAA accessibility compliance.

| Token Name | HEX | HSL | Context & Usage |
| :--- | :--- | :--- | :--- |
| **Primary (Emerald)** | `#0F8B65` | `HSL(162, 80%, 30%)` | Health, growth, progress, and main active highlights. |
| **Secondary (Blue)** | `#2563EB` | `HSL(221, 83%, 53%)` | Stability, trust, secondary actions, and informational tags. |
| **Accent (Orange)** | `#F59E0B` | `HSL(38, 94%, 50%)` | Warnings, guidelines, safety notices, and caution cards. |
| **Success (Mint)** | `#10B981` | `HSL(160, 84%, 39%)` | Streaks, completion cards, check-in success status. |
| **Error (Red)** | `#EF4444` | `HSL(0, 84%, 60%)` | Broken streaks, missed check-ins, deletion warnings. |
| **Background (Sage)** | `#F6F8F7` | `HSL(150, 8%, 97%)` | Calming, low-fatigue mobile scaffolds background. |
| **Admin Background** | `#F1F5F9` | `HSL(200, 30%, 96%)` | Admin desktop viewport background (Slate-100). |
| **Neutral Dark (Slate)**| `#1E293B` | `HSL(215, 25%, 27%)` | Title text, primary text, dark borders, and card overlays. |
| **Neutral Light** | `#FFFFFF` | `HSL(0, 0%, 100%)` | Card backgrounds, inputs, surface fills. |

---

## 3. Typography

A clear typographic hierarchy keeps the user focused on the motivational content, removing visual noise.

* **Primary Heading Font**: **Outfit** (Google Fonts)
  * Represents modern energy, friendliness, and clarity.
  * Used for: Headline titles, big stats numbers, challenge catalog headers.
* **Body Text Font**: **Inter** (Google Fonts) or **System UI Sans-Serif**
  * Ensures maximum legibility across small devices and admin dashboards.
  * Used for: Descriptions, lists, form labels, general navigation.

### Type Scale (Mobile)
* **Display Large** (Streaks Count): `48px` | Bold | Outfit
* **Headline Medium** (Challenge Title): `24px` | ExtraBold (w900) | Outfit | `-0.5px` LetterSpacing
* **Title Medium** (Section Header): `16px` | SemiBold (w700) | Outfit
* **Body Regular** (Descriptions): `14px` | Regular (w400) | Inter | `1.5` LineHeight
* **Caption Bold** (Tags / Badges): `12px` | ExtraBold (w800) | Inter | `1.0` LetterSpacing

---

## 4. Spacing Grid

Vital30 uses an **8-point grid** for consistent spatial layouts and predictable alignment across both web and mobile screens.

```
4px   -- Extra Small (xs)   | Micro padding, line-spacers
8px   -- Small (sm)         | Inner-chip gaps, label-to-input spacing
12px  -- Medium (md)        | Grid cell paddings, inner badge gaps
16px  -- Large (lg)         | Standard card padding, list item gaps
24px  -- Extra Large (xl)   | Page margins, major sections separation
32px  -- double Extra (xxl) | Outer containers, welcome layouts
```

---

## 5. Card Style

Cards act as physical containment blocks for habit blueprints, check-in progress, and stats.

* **Background Color**: Neutral Light (`#FFFFFF`).
* **Borders**: Thin, discrete outline (`1.0px` width) in color `#E1E8E4` (Mobile) or Slate-200 (Admin). **Do not use heavy shadows.**
* **Corner Radius**: Modern rounded corners of **20px** (`borderRadius: 20` / `rounded-3xl`).
* **Content Padding**: Uniform **16px** (inner elements) or **20px** (large layout cards).

---

## 6. Button Styles

Buttons must provide large, positive touch targets that reflect immediate interactive priority.

### A. Primary / Filled Button (e.g. "Join Challenge")
* **Style**: Full color fill using HSL color tokens (`#0F8B65` / brand emerald).
* **Corner Radius**: **16px** (slightly sharper than cards to feel more action-oriented).
* **Height**: Standard **52px** to offer friendly, accessible tapping surface.
* **Typography**: Bold `16px` with white text.

### B. Secondary / Outlined Button (e.g. "Share Progress")
* **Style**: Transparent background with a `1.5px` border in `#CBD5E1` (Slate-300).
* **Corner Radius**: **16px**.
* **Foreground Color**: Slate-700 (`#334155`).

---

## 7. Form Styles

Form fields should appear clean, structured, and easy to interact with.

* **Border**: Outline border `1.0px` with Slate-300 (`#CBD5E1`).
* **Corner Radius**: **12px**.
* **Focused State**: Border color changes to brand primary emerald (`#0F8B65`), adding high-contrast visual focus indicators.
* **Textarea**: Expandable resize height (`min-h-[80px]` or `maxLines: 4`) with interior padding `12px` to prevent text crowding.

---

## 8. Progress Indicators

Progress represents the emotional payoff of the app's consistency engine.

### A. Streaks Grid (Habit Calendar)
* Individual cells represent calendar days in a rolling 30-day view.
* **Success Day**: Flat Mint Green fill (`#10B981`) with active white text checkmark icons.
* **Missed Day**: Soft, desaturated light red outline (`#FEE2E2`) with a small dot indicator.
* **Skipped Day**: Soft gray diagonal hatch or thin Slate border, signifying that the streak was preserved but not incremented.

---

## 9. Challenge Cards

Used inside search catalog categories and dashboard listings.

* **Category Tag**: Small capital letters at the top, colored by Category primary color (e.g., fitness in green, diet in blue).
* **Title & Subtitle**: High-contrast Slate-900 typography.
* **Difficulty & Duration Badges**: Nested meta chips utilizing secondary colors with `0.06` opacity fill and high-contrast foreground tags.
* **Touch Target**: The entire card body acts as a button, navigating directly to the blueprint detail view.

---

## 10. Status Badges

Indicators reflecting active states and progress levels:

* **`ACTIVE` Badge**: Soft primary green background with a dark green outline.
* **`COMPLETED` Badge**: Emerald success green background (`#10B981`) with white text.
* **`ABANDONED` / `MISSED` Badge**: Soft red warning pill with dark red text.
* **`SKIPPED` Badge**: Slate-100 gray pill with Slate-600 text.

---

## 11. Empty States

Empty states should motivate and guide, never just report vacancy.

* **Layout**: Centered vertically with comfortable padding.
* **Visual**: Clean, friendly placeholder icon (e.g. `Icons.spa` or `Icons.calendar_today`) in soft desaturated slate-mint (`#8A9A92`).
* **Motivating Copy**: Clear headline (e.g., *"No Active Challenges yet!"*) followed by a friendly subtitle (*"Explore our wellness blueprints to start building better habits today."*).
* **CTA Button**: A primary emerald button directly linking to the discovery catalog, avoiding dead ends.

---

## 12. Error States

Error states should clarify issues and provide immediate recovery loops.

* **Visual**: Thin orange-red alert box with outline border `1.5px`.
* **Copy**: Human-friendly, non-technical message explaining what failed. No system code dump lines.
* **Action**: Include an active, primary emerald **Retry** button or **Back** link to recover.

---

## 13. Loading States

Vital30 prevents jarring layout shifts during data transitions.

* **Mobile circular spinners**: Standard, sleek circular progress spinner styled in emerald green (`#0F8B65`) on a clean backdrop.
* **Admin Skeleton loaders**: Clean, modern shimmers mimicking card shape layouts, styled in soft slate gray background grids.

---

## 14. Accessibility (a11y) Guidelines

We build with inclusivity in mind, ensuring the app is usable by all wellness cohorts.

* **Text Contrast**: All user-visible text must meet the **W3C WCAG 2.1 AA** contrast ratio standards:
  * Regular text (under 18pt): Minimum `4.5:1` contrast ratio against background surfaces.
  * Large text (over 18pt): Minimum `3:1` contrast ratio.
* **Touch Target Areas**: Minimum physical interactive target size is **`48 x 48` pixels** on mobile. Ensure all button heights (52px) and settings rows (minimum 48px height) have sufficient clickable areas.
* **Keyboard Focus Indicators**: Interactive fields must display high-visibility focus borders when traversed via screen readers or keyboards.
* **Semantic HTML (Admin)**: Use appropriate HTML5 tags (`<main>`, `<header>`, `<nav>`, `<section>`) and descriptive `htmlFor` label indicators.
