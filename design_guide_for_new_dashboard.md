# Time Stock — Design Guide for New Desktop Dashboard

Inspiration: Starline soft-UI / glassmorphism (lime active accent, frosted shell, pill navigation, rounded data tables). This guide is the visual and UX contract for the Stock Manager desktop product at `/stock`. Admin and Finance dashboards keep their existing look.

---

## 1. Product identity

| Item | Value |
|------|--------|
| Product name | **Time Stock** |
| Audience | Users with the `Stock Manager` role (desktop OTP; Admin not required) |
| Entry | `/stock/login` → OTP → `/stock` |
| Platform | Desktop-first web (tablet: collapsible sidebar). Mobile polish is out of v1. |
| Sibling apps | Telegram Stock Manager mini-app remains unchanged |

Brand signal: the wordmark **Time Stock** is the primary hero of the shell chrome (sidebar logo), not a tiny nav label.

---

## 2. Visual system

### 2.1 Color tokens (CSS variables)

```css
:root {
  /* Atmosphere */
  --stock-bg-1: #E8EEF5;
  --stock-bg-2: #DDE5F0;
  --stock-bg-3: #E4E0EC;
  --stock-shell: rgba(255, 255, 255, 0.72);
  --stock-shell-border: rgba(255, 255, 255, 0.55);
  --stock-panel: #FFFFFF;
  --stock-panel-muted: #F4F6F9;

  /* Text */
  --stock-text: #12141A;
  --stock-text-secondary: #6B7280;
  --stock-text-muted: #9CA3AF;

  /* Accent — lime active (Starline) */
  --stock-accent: #C8F560;
  --stock-accent-ink: #12141A;
  --stock-accent-soft: rgba(200, 245, 96, 0.35);

  /* Pagination / soft */
  --stock-highlight: #F5E6A6;
  --stock-highlight-ink: #3D3410;

  /* Pastel KPI surfaces */
  --stock-pastel-peach: #FDE8D8;
  --stock-pastel-lavender: #E8E0F5;
  --stock-pastel-mint: #D8F0E8;
  --stock-pastel-sky: #D8E8F8;

  /* Flow polarity */
  --stock-delta-in: #D8F0E8;
  --stock-delta-in-ink: #0F6B4C;
  --stock-delta-out: #FDE4E1;
  --stock-delta-out-ink: #9B2C2C;

  /* Chrome */
  --stock-radius-sm: 10px;
  --stock-radius-md: 16px;
  --stock-radius-lg: 22px;
  --stock-radius-pill: 999px;
  --stock-shadow: 0 18px 50px rgba(30, 40, 60, 0.10);
  --stock-shadow-soft: 0 4px 16px rgba(30, 40, 60, 0.06);
}
```

Avoid: purple-on-white gradients, terracotta/cream newspaper layouts, heavy multi-layer neon glows, Inter/Roboto/Arial as display fonts.

### 2.2 Typography

- Display / brand: **Outfit** or **Sora** (Google Fonts), semibold–bold.
- Body / UI: **Manrope** or **DM Sans**.
- Hierarchy: brand 22–28px → page title 20–22px → section 16px → body 14px → meta 12px.
- Table headers: uppercase or medium weight, `--stock-text-muted`.

### 2.3 Surfaces

- Page background: soft diagonal gradient using `--stock-bg-*` (blurred atmosphere).
- App shell: frosted panel (`backdrop-filter: blur(18px)`), `--stock-radius-lg`, `--stock-shadow`.
- Content cards: solid white, `--stock-radius-md`, hairline border optional (`#EEF1F5`).
- No cards in the greeting hero strip — greeting is plain text; utilities sit in one pill.

---

## 3. Layout anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  FROSTED SHELL                                              │
│  ┌──────────┬────────────────────────────────────────────┐  │
│  │ SIDEBAR  │  HEADER: Welcome + subtitle | utility pill │  │
│  │ logo     ├────────────────────────────────────────────┤  │
│  │ Materials│  MAIN: white rounded panel(s)              │  │
│  │ Inventories│                                          │  │
│  │ (logout) │                                            │  │
│  └──────────┴────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- Sidebar width ~240px expanded / ~72px collapsed.
- Nav items: full-width pills; **active** = `--stock-accent` fill + `--stock-accent-ink` text + icon.
- Inactive: transparent, `--stock-text-secondary`.
- Header left: “Welcome, @{username}” + “Here’s what’s happening in your stock”.
- Header right: utility pill (logout required; search optional stub).

---

## 4. UX flows

### 4.1 Materials

1. **List** — one row per material:
   - Name + type badge (L / A / P)
   - **Total available** (all inventories)
   - **In Stock Keeper** (inventory id = 2)
   - **# inventories** with amount &gt; 0
2. Row click or eye action → **Detail**.
3. **Detail top** — total available + inventory distribution (bars/chips; include Admin id=1 for clarity).
4. **Detail bottom** — inbound history **to Stock Keeper only**, newest first:
   - Purchases into SK
   - Transfers into SK (including Admin → SK)
   - Manual additions into SK
   - Each row: username, amount, category, relative time (“5 minutes ago”, “2 hours ago”, “3 days ago”, “1 week ago”) with absolute datetime on hover
   - **Load more** pagination

### 4.2 Inventories

1. **List** — all inventories **except Admin (id = 1)**.
2. Click inventory → materials in that inventory + available amount.
3. Click material → **flow chat**:
   - Sticky header: inventory, material, current available
   - Messages oldest → newest (top → bottom)
   - Each event: signed delta, human label, **balance after**
   - Releases: `ORD-{order_code}` + order name
   - Load older at top; first open scrolls to bottom
   - Data from **StockFootprint** ledger (backfilled for historical data, appended on new mutations)

### 4.3 Footprint data contract (UX-facing)

- Historical: system replays every purchase, transfer, release, adjustment from day one → saves footprints.
- Ongoing: each mutation appends a footprint with `balance_after`.
- UI never recomputes the full timeline client-side; it reads the ledger.

---

## 5. Component catalog

| Component | Behavior |
|-----------|----------|
| `StockSidebarItem` | Pill; lime when active |
| `StockDataTable` | White panel, generous row padding, hairline dividers |
| `StockTypeBadge` | Soft pastel chip by L/A/P |
| `StockMetricCell` | Emphasized number + muted label |
| `StockDistributionBar` | Name + amount + proportional bar |
| `StockHistoryRow` | Avatar/initial, title, meta, relative time |
| `StockFlowBubble` | Chat bubble; green tint +, coral − |
| `StockPagination` | Pill group; active page `--stock-highlight` |
| `StockLoadMore` | Text button under lists |
| `StockEmptyState` | Soft illustration-free message + short hint |

---

## 6. Motion

1. Sidebar active pill: layout spring morph (framer-motion `layoutId`).
2. Detail / flow panel: 180ms fade + 8px rise enter.
3. Flow bubbles: staggered 30ms fade-in on first paint (cap at ~20 items).

No continuous ambient animation. Prefer presence over noise.

---

## 7. Responsive

| Breakpoint | Behavior |
|------------|----------|
| ≥1200px | Full shell, sidebar expanded |
| 768–1199px | Sidebar collapsible; tables may horizontal-scroll |
| &lt;768px | Readable stacked layout; not a primary target for v1 |

---

## 8. Accessibility

- Lime active text must stay near-black (`--stock-accent-ink`) for contrast.
- Focus rings: 2px solid `#12141A` offset 2px on interactive pills/buttons.
- Relative times expose `title` / `aria-label` with absolute local datetime.
- Tables: proper `<th>` scope; icon-only actions need `aria-label`.

---

## 9. Copy & empty states

- Materials empty: “No materials yet.”
- Inventories empty: “No inventories to show.”
- Flow empty: “No movement recorded for this material here.”
- Backfill in progress: “Building history…”

---

## 10. Ops note (footprints)

After deploy:

```bash
python manage.py backfill_stock_footprints
```

Optional: `--inventory=ID`, `--material=ID`, `--force` (rebuild). New stock mutations append automatically; first flow API hit also ensures backfill for that inventory×material pair if incomplete.
