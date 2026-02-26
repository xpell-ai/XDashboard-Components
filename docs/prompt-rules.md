# XPell Prompt Rules — Component Design Guidelines

This document defines REUSABLE, CATEGORY-LEVEL rules
that apply to groups of UI components.

These rules are NOT global laws (see codex.md).
They are VERSIONED DESIGN DECISIONS.

If a task prompt references a rule set here,
Codex MUST apply it fully.

If a rule conflicts with codex.md → codex.md wins.

---

## OVERLAY COMPONENTS — v1

Applies to:
- XModal
- XToast
- XDrawer
- Future overlays

Rules:
- NO global manager or singleton in v1
- ONE component instance = ONE UI element
- NO stacking / queueing logic
- Animations via CSS only
- No timers unless explicitly allowed
- Use CSS modifiers for open/close state
- No focus trap / keyboard handling unless explicitly requested

---

## SIDEBAR & NAVIGATION — v1

Applies to:
- XSidebar
- XNavList
- Future navigation primitives

Rules:
- NO routing logic
- NO URL manipulation
- Navigation is purely visual + events
- Selection state is internal only
- Do NOT infer hierarchy unless explicitly provided
- No tree logic in v1

---

## FORM & INPUT COMPONENTS — v1

Applies to:
- XField
- XInput
- XSelect
- XSearchBox
- XInputGroup

Rules:
- No validation engine in v1
- No form submission logic
- Field components do NOT manage data persistence
- Errors/hints are visual only
- Use XField as the composition wrapper
- Do NOT introduce custom event systems

---

## DATA DISPLAY — v1

Applies to:
- XTable
- XBadge
- XEmptyState
- KPI / Card components

Rules:
- Read-only unless explicitly stated
- No mutation of source data
- No implicit sorting / filtering
- No pagination logic
- Rendering must be deterministic
- Empty state must be explicit (no auto inference)

---

## DASHBOARD LAYOUT — v1

Applies to:
- XGrid
- XStack
- XSection
- XToolbar
- XScroll

Rules:
- No responsive breakpoints in JS
- Layout behavior via CSS only
- Composition over configuration
- No layout intelligence (keep primitives dumb)
- No implicit spacing rules beyond tokens

---

## VERSIONING RULE

- v1 rules prioritize:
  - simplicity
  - composability
  - debuggability
- Advanced behavior moves to v2+
- Do NOT pre-design for v2

---

## USAGE IN PROMPTS

Example:

"Apply docs/codex.md as a strict system contract.
Apply Overlay Components — v1 rules from prompt-rules.md."

If a task does NOT reference a section here,
ONLY codex.md rules apply.

---

## FINAL NOTE

If unsure which rule set applies:
STOP and ask before generating code.
