# NERMAI Global Design System

This document outlines the shared design language across the NERMAI Web and React Native applications.
All values defined here are exported via the `@nermai/theme` package.

## 1. Colors

**Backgrounds**
- `background`: `#0E0E0E` (Main screen background)
- `surface`: `#1B1B1B` (Cards, Bottom Sheets)
- `surfaceHighlight`: `#252525` (Inputs, Hover states)

**Brand**
- `primary`: `#D4AF37` (NERMAI Gold - Primary buttons, active states)
- `accent`: `#FF3B30` (NERMAI Red - Alerts, destructive actions)

**Text**
- `textPrimary`: `#F8F8F8` (Headings, primary body)
- `textSecondary`: `#A0A0A0` (Subtitles, labels, placeholders)
- `textInverse`: `#121212` (Text on primary gold buttons)

**Feedback**
- `success`: `#34C759`
- `warning`: `#FF9500`
- `error`: `#FF3B30`

## 2. Spacing Scale (8-Point Grid)

Use strictly the following values for margins, paddings, and gaps.
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px
- `3xl`: 56px

**Rules:**
- Screen Padding: `20px` (mobile), `24px` (tablet), `32px` (web).
- Section Spacing: `24px` between distinct vertical sections.

## 3. Typography

- `h1`: 32px, Bold
- `h2`: 24px, Bold
- `h3`: 20px, Semi-Bold
- `body1`: 16px, Regular
- `body2`: 14px, Regular
- `caption`: 12px, Regular

## 4. Radii

- `sm`: 8px (Small badges)
- `md`: 16px (Buttons, Inputs)
- `lg`: 20px (Cards)
- `xl`: 24px (Bottom Sheets, Modals)
- `full`: 9999px (Avatars, FABs)

## 5. Shadows / Elevation

- `elevation1`: Subtle drop shadow for cards.
- `elevation2`: Pronounced shadow for Bottom Sheets and Modals.
- `elevation3`: Max shadow for FABs.
