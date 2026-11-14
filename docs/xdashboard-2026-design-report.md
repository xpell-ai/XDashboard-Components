# XDashboard 2026 Phase 1 Design Foundation

Date: 2026-08-24

Scope: `@xpell/xdashboard`.

Repo-local contract note: this checkout does not contain `docs/AGENTS.md`. The implementation follows the Xpell base/core/UI contracts and the XDashboard package contract.

## Ownership

XUI owns canonical design tokens and themes. XDashboard consumes those `--x-*` tokens and provides shared dashboard conventions for components.

```text
XUI --x-* tokens
  -> XDashboard shared foundations
  -> component variants and density
  -> application composition
```

XDashboard must not define a second global design token system. Do not introduce `--xd-*`, `--xpell-*`, or duplicate global color/spacing aliases. Component-local variables are allowed only for component geometry or internal implementation, such as `--xgallery-columns`, `--xcard-padding`, or `--xtable-cell-pad-y`.

## Surface Vocabulary

The shared surface vocabulary is:

- `plain`: transparent content surface, no decorative border, no shadow.
- `subtle`: muted surface, subtle border when separation is useful, no meaningful elevation.
- `card`: normal framed surface, subtle border, md/lg radius, none or xs elevation.
- `elevated`: intentionally raised surface, elevated background, stronger shadow.

Use existing `_variant` projection where meaningful. For example, `card` with `_variant: "card"` receives `xcard--variant-card`.

Ordinary 2026 content should avoid medium shadow as its default surface treatment. Medium and large shadows are reserved for elevated/floating UI or explicit `_variant: "elevated"` / `_elevation` use.

## Density Vocabulary

The canonical density values are:

- `compact`: dense data/admin scanning.
- `comfortable`: default XDashboard 2026 density.
- `spacious`: lower-density detail or onboarding surfaces.

Default density: `comfortable`.

Use `_density` when the component has meaningful spacing or row/control sizing. Existing `_dense: true` remains compatible and conceptually maps to `compact`. Do not rewrite persisted app JSON just to migrate `_dense` to `_density`.

## Typography Roles

Modernized XDashboard CSS should consume XUI typography tokens for:

- body: `--x-type-body-*`
- title: `--x-type-title-*`
- section title: `--x-type-section-title-*`
- subtitle: `--x-type-section-subtitle-*`
- metadata/caption: `--x-type-caption-*`
- labels: `--x-type-label-*`

Avoid repeated arbitrary font sizes for these roles. Component-specific display numbers or unique geometry may still use local rules when the value is not a shared role.

## Spacing, Radius, Elevation, Borders

Use XUI tokens for recurring component padding, content gaps, section gaps, control spacing, radius, elevation, and borders:

- spacing: `--x-spacing-*`, `--x-space-*`, `--x-content-gap`, `--x-section-gap`
- controls: `--x-control-*`
- radius: `--x-radius-*`
- elevation: `--x-shadow-none`, `--x-shadow-xs`, `--x-shadow-sm`, `--x-shadow-md`, `--x-shadow-lg`
- borders: `--x-border-subtle`, `--x-border`, `--x-border-strong`

Subtle borders should be the normal 2026 separator. Strong borders and medium shadows should be intentional.

## Responsive Foundation

Use XUI page/content tokens for contained dashboard composition:

- `--x-page-padding-x`
- `--x-page-padding-x-mobile`
- `--x-page-max-width`
- `--x-page-readable-width`
- `--x-content-gap`
- `--x-section-gap`
- `--x-toolbar-gap`

Toolbars and control groups should wrap on narrow screens. Controls that naturally need full-width mobile behavior should use the shared wrapping helpers or component-specific responsive rules in later phases.

## Runtime Fields

Reuse existing semantic runtime fields:

- `_variant`
- `_tone`
- `_size`
- `_density`
- `_elevation`

No new runtime property is required for Phase 1.

`@xpell/ui` projects these fields to semantic classes using the runtime `_type`, for example `xcard--variant-card`, `xtable--density-compact`, and `xcard--elevation-xs`.

Compatibility caveat: components whose runtime `_type` already starts with `x` may receive projected classes such as `xxsection--variant-card` while their authored CSS base class is `xsection`. Component-specific code often adds its own classes for legacy fields like `_dense`. Later modernization phases should normalize this per component without breaking existing JSON.

## Phase 1 CSS Surface

Phase 1 adds `src/style/xfoundation.css` and imports it before component CSS. It establishes:

- shared typography helper roles
- shared `plain/subtle/card/elevated` surface helper classes
- shared `compact/comfortable/spacious` density helper classes
- contained/readable/content/section-stack composition helpers
- mobile toolbar wrapping conventions

Narrow component consumption was added only where it establishes the vocabulary:

- `card`: surface variants, density aliases, typography tokens, 2026 theme-aware restrained shadow.
- `kpi-card`: surface variants, density aliases, typography tokens, 2026 theme-aware restrained shadow.
- `toolbar`: surface variants and density aliases.
- `table`: density aliases, subtle borders, typography tokens.
- `field`, `search`, `xselect`: typography/control token consumption.
- `xsection`: typography token consumption only.

## Deferred Component Phases

Detailed redesign remains deferred for:

- `xsection`
- `card`
- `kpi-card`
- `empty`
- `toolbar`
- `table`
- `xlist`
- `xgallery`
- `xkanban`
- `xtimeline`
- `xcalendar`
- `xstats`
- `modal`, `drawer`, `toast`

Known wrapper/variant issues for later work:

- `xsection` renders its visual surface on `.xsection__container`, so root semantic projection cannot fully style the actual surface.
- `xsection`, `xlist`, `xgallery`, `xkanban`, `xtimeline`, `xcalendar`, `xstats`, `xselect`, and other x-prefixed types need per-component review because generic XUI projection may emit `xx*` classes.
- Collection components already have component-local geometry variables and template `_styles`; later phases should keep those local and consume XUI tokens for repeated typography/surface decisions.

## Compatibility Rules

Modernized XDashboard components must:

1. consume XUI canonical `--x-*` tokens
2. avoid duplicate global token systems
3. support semantic `_variant` where meaningful
4. support `_density` where density is meaningful
5. use typography roles instead of repeated arbitrary font values
6. default to restrained borders/elevation under 2026 themes
7. preserve explicit `_style` and custom `class` overrides
8. remain usable under existing `terminal`, `light`, `dark`, and custom themes

Phase 1 keeps older theme behavior compatible by scoping quieter default card/KPI/button shadows to `xdashboard-2026-light` and `xdashboard-2026-dark`, while still exposing opt-in surface variants in all themes.

## Phase 2 Core Component Modernization

Phase 2 modernizes the first visible XDashboard components while preserving legacy theme compatibility.

Theme boundary:

- New quiet defaults are scoped primarily to `xdashboard-2026-light` and `xdashboard-2026-dark`.
- Existing `light`, `dark`, `terminal`, custom CSS, `class`, and `_style` behavior remains supported.

Final core variants:

- `xsection`: `_variant` supports `plain`, `subtle`, and `card`. The visual surface is still `.xsection__container`, but the root now receives authored semantic classes such as `xsection--variant-card` and `xsection--density-compact`, so variant and density styles reach the real surface.
- `card`: `_variant` supports `default`, `interactive`, and `elevated`. Default cards are quiet under 2026 themes; interactive cards use restrained hover/focus feedback; elevated cards intentionally use stronger shadow.
- `kpi-card`: uses the card surface model with `default`, `interactive`, and `elevated`, quieter container treatment, clearer label/value hierarchy, and a less demo-like metric size.
- `empty`: `_variant` supports `inline`, `section`, and `page`; dashed/framed treatments are not required by default.
- `toolbar`: `_variant` supports `plain`, `subtle`, and `sticky`; toolbars wrap predictably and do not default to card-like surfaces in 2026 themes.
- `stack`: remains structural and surface-free; density only controls gap.
- `grid`: remains structural and surface-free; responsive min-column mode now uses `min(var(--x-grid-min-col), 100%)` to avoid narrow viewport overflow.
- `igroup`: remains unframed by default; `plain`, `subtle`, and existing `merged` treatments are available for filters/actions.
- `divider`: defaults to `--x-border-subtle` under 2026 themes while preserving the existing divider/border fallback for older themes.

Density behavior:

- `compact`, `comfortable`, and `spacious` are available across core layout/surface components where meaningful.
- Existing `_dense` paths remain compatible and map visually to compact spacing where the component already supported them.

Design metadata:

- Inspector metadata now exposes supported `_variant` and `_density` options for `xsection`, `card`, `kpi-card`, `toolbar`, `empty`, `stack`, `grid`, and `igroup`.
- No Visual Xpell editor runtime code was changed.

Representative fixture:

- `docs/fixtures/xdashboard-2026-core.html` demonstrates a CRUD/product-style page in both `xdashboard-2026-light` and `xdashboard-2026-dark`.

Deferred:

- Data-heavy components (`table`, `xlist`, `xgallery`, `xkanban`, `xtimeline`, `xcalendar`, `xstats`) remain deferred to XDASH-2026-03.
- App Shell, Page, Page Header, and content-width composition remain deferred to XDASH-2026-04.

## Phase 3 Data Component Modernization

Phase 3 modernizes the data presentation layer while preserving existing runtime contracts, data bindings, item templates, actions, and custom class/style overrides.

Components covered:

- `table`
- `xlist`
- `xgallery`
- `xkanban`
- `xtimeline`
- `xcalendar`
- `xstats`

Theme boundary:

- 2026-specific quiet defaults are scoped primarily to `xdashboard-2026-light` and `xdashboard-2026-dark`.
- Legacy `light`, `dark`, `terminal`, and custom themes retain their existing broad behavior.
- Existing runtime defaults such as `table._bordered: true` remain compatible; under 2026 themes bordered tables use subtle outer framing and row separators instead of full debug-style cell boxing.

Table:

- Adds wrapper-level horizontal overflow containment so tables do not force page-level overflow.
- Uses subtle row/header separators under 2026 themes.
- Keeps `_dense`, `_bordered`, `_striped`, and `_hover`.
- Supports `_variant: "plain" | "subtle" | "card"` and `_density: "compact" | "comfortable" | "spacious"`.

List:

- Avoids a mandatory outer box under 2026 defaults.
- Supports `plain`, `subtle`, and `card` variants.
- Uses density-controlled row padding/gaps, subtle separators, clear hover/selected/focus states, and typography tokens.
- Preserves `_item`, `_item._styles`, `_actions`, selection, and data binding behavior.

Gallery:

- Keeps the shared collection template-style contract and card-grid geometry controls.
- Supports `plain`, `subtle`, and `card` variants plus density-controlled card spacing.
- Uses low/no elevation by default under 2026 themes and keeps responsive min-column behavior.

Kanban:

- Keeps the board structural and horizontally/ responsively contained by the current architecture.
- Columns use subtle surfaces and restrained headers/counts.
- Cards use intentional low-elevation surfaces and clear title/meta hierarchy.
- `_density` controls board gaps, column padding, and card padding.
- Empty columns now use `empty` with `_variant: "inline"` and quiet column-local styling.

Timeline:

- Uses a subtler temporal axis and marker treatment.
- Entry cards are lighter under 2026 themes and use tokenized hierarchy.
- `_density` controls axis/content spacing.
- Preserves sorting, date field, item templates, actions, selection, and generated object boundaries.

Calendar:

- Keeps the existing month-grid architecture.
- Uses subtler grid borders, clearer header/day/event hierarchy, focus tokens, today state, and selected event state.
- Adds contained horizontal overflow on narrow screens rather than introducing a new agenda renderer.
- `_density` controls calendar gaps, day height, and event padding.

Stats:

- Aligns metric cards with the KPI/card language.
- Supports `plain`, `subtle`, `card`, and `elevated` variants plus the shared density vocabulary.
- Uses tokenized label/value/meta typography and avoids oversized demo typography.

Empty states:

- Collection-level generated empty states use `_variant: "section"`.
- Kanban column placeholders use `_variant: "inline"`.
- Custom `_empty` objects remain untouched.
- Table still uses its existing single table-row empty message to avoid duplicating empty-state messaging inside the table structure.

Semantic template-style compatibility:

- `xlist`, `xgallery`, `xkanban`, `xtimeline`, and `xcalendar` continue to use `XCollectionTemplateStyles` and `applyCollectionTemplateStyle`.
- Template styles still merge before explicit object `_style`, so item-level `_style` overrides component/template defaults.
- No component-specific replacement style schema was introduced.

Design metadata:

- Inspector metadata now exposes the supported Phase 3 `_variant` and `_density` fields:
  - `table`: variant, density, bordered, striped, hover.
  - `xlist`: variant, density, existing template/selection controls.
  - `xgallery`: variant, density, existing grid/template controls.
  - `xkanban`: density plus existing board/group/card controls.
  - `xtimeline`: density plus existing ordering/selection/template controls.
  - `xcalendar`: density plus existing month/date/selection/template controls.
  - `xstats`: variant and density plus existing metric controls.

Representative fixture:

- `docs/fixtures/xdashboard-2026-data.html` demonstrates the data layer under `xdashboard-2026-light` and `xdashboard-2026-dark`.

Deferred:

- App Shell, Page, Page Header, page width/padding composition, and starter migration remain deferred to XDASH-2026-04.
- Modal/drawer/toast modernization remains outside this data-component phase.

## Phase 4 Application Composition

Phase 4 introduces the small semantic composition layer needed to remove routine shell/page CSS from starters.

Final architecture:

```text
xshell
  -> xpage
     -> xpage-header
     -> toolbar / igroup
     -> xsection / data components
     -> modal / drawer / toast remain independent feedback objects
```

New runtime types were required because existing `view`, `stack`, `scroll`, `toolbar`, `sidebar`, and `xsection` can express layout mechanically but cannot express persisted app-shell, page-width, and page-header semantics cleanly.

### App Shell: `xshell`

Contract:

- Structural app-level geometry only.
- Optional `_sidebar` slot for the existing `sidebar` component.
- `_children` render inside the primary main region.
- `_scroll: true` makes `.xshell__main` the primary vertical scroll owner.
- `_scroll: false` uses normal body/content flow for simpler embedded pages.
- No card surface, shadow, or business-content ownership.

Scroll ownership model:

```text
xshell
  -> viewport containment
xshell__main
  -> primary vertical scroll region when _scroll is true
xpage
  -> normal document/content flow
scroll
  -> explicit nested scrolling only where requested
modal/drawer/toast
  -> remain outside normal page rhythm and are not replaced by shell feedback behavior
```

Sidebar behavior:

- Desktop uses sidebar + flexible main region.
- If `_sidebar` is absent, shell degrades to a single main region.
- Narrow screens stack sidebar above main content as a safe fallback.
- True drawer-style mobile navigation remains a later sidebar enhancement.

### Page: `xpage`

Contract:

- Owns page padding, content max width, and vertical rhythm.
- Uses XUI page/content tokens:
  - `--x-page-padding-x`
  - `--x-page-padding-y`
  - `--x-page-padding-x-mobile`
  - `--x-page-max-width`
  - `--x-page-readable-width`
  - `--x-section-gap`
  - `--x-content-gap`
- Structural only; surfaces belong to `xsection`, `card`, and data components.

Width modes:

- `full`: uses available main-region width.
- `contained`: uses `--x-page-max-width`; this is the default application-page mode.
- `readable`: uses `--x-page-readable-width`.

Density:

- `compact`, `comfortable`, and `spacious` control page rhythm/padding.
- `comfortable` remains the default 2026 composition baseline.

### Page Header: `xpage-header`

Contract:

- Persisted semantic properties:
  - `_title`
  - `_subtitle`
  - `_meta`
  - `_actions`
  - `_density`
- Uses page title/subtitle typography tokens.
- Desktop layout: title/subtitle/meta on the left, actions on the right.
- Mobile layout: title/subtitle/meta first, actions below and wrapping.
- Structural/plain by default; no card surface.

Semantic child metadata:

- `xpage-header` declares semantic children for `title`, `subtitle`, `meta`, and `actions`.
- These map to persisted `_title`, `_subtitle`, `_meta`, and `_actions`; generated runtime labels are not persistence targets.

Toolbar and filter composition:

- Reuse `toolbar` and `igroup`.
- Recommended order is `xpage-header` -> `toolbar` -> `xsection` / content.
- Toolbars align with page width because they are direct `xpage` children.
- No new toolbar component was added.

Responsive behavior:

- Mobile: 16px page padding via `--x-page-padding-x-mobile`, stacked page headers/actions, full available width, no normal horizontal overflow.
- Tablet: 24px fallback page padding.
- Desktop: 32px tokenized page padding and contained max width.

Old List/Tracker comparison:

- Old: title/header wrappers assembled manually in starter CSS.
- Old: page width and padding came from custom application classes.
- Old: arbitrary vertical gaps and dead regions were solved with starter-specific layout rules.
- Old: toolbar and content alignment depended on repeated wrappers.
- New: `xshell -> xpage -> xpage-header -> toolbar -> xsection` handles routine geometry, width, rhythm, header actions, and responsive stacking.

Starter CSS this can eventually remove:

- custom app shell flex/height wrappers
- repeated page max-width containers
- repeated mobile page padding media queries
- manual title/subtitle/action alignment wrappers
- routine toolbar/content alignment wrappers
- spacer-driven page gaps for normal page rhythm

Representative fixture:

- `docs/fixtures/xdashboard-2026-composition.html` demonstrates the composition layer in both `xdashboard-2026-light` and `xdashboard-2026-dark`.

Deferred:

- Starter migration remains deferred.
- App-specific navigation state, sidebar drawer behavior, and live feedback orchestration remain outside Phase 4.
