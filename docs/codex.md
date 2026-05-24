# @xpell/xdashboard codex.md — AI Agent Contract for Vibe Coding

## Purpose

This document defines the strict contract for **@xpell/xdashboard** —  
the dashboard UI object pack of the Xpell 2 ecosystem.

This package builds on:

- @xpell/core (runtime engine)
- @xpell/ui (UI runtime layer)

It provides structured dashboard-oriented UI objects.

This document MUST be applied by any AI agent modifying or generating code in this package.

---

## Scope & Position in the Stack

```
@xpell/core      → runtime engine (XObject, XData2, XEventManager)
@xpell/ui        → DOM runtime + XUIObject
@xpell/xdashboard → dashboard UI object pack (this project)
```

@xpell/xdashboard:

- EXTENDS @xpell/ui
- Registers XUIObject subclasses
- Ships UI components only
- MUST NOT introduce runtime logic
- MUST NOT mutate XData directly
- MUST NOT introduce application state

---

## Architectural Role

@xpell/xdashboard is:

- A pure XObjectPack
- A collection of XUIObject subclasses
- JSON-driven
- Nano-command compatible

It is NOT:

- A framework
- A state manager
- A service layer
- A runtime module
- A behavior engine

---

## Authoritative Object Registry

The only registered objects are those returned by:

```
XDashPack.getObjects()
```

Current registered classes:

- XCard
- XKpiCard
- XGrid
- XStack
- XScroll
- XSpacer
- XDivider
- XToolbar
- XTable
- XBadge
- XEmptyState
- XSearchBox
- XInputGroup
- XSelect
- XField
- XDrawer
- XNavList
- XSidebar
- XModal
- XToast
- XSection

AI agents MUST NOT invent additional types.
AI agents MUST NOT generate `_type` values not registered in XDashPack.

---

## Component Rules

Each component:

- MUST extend XUIObject
- MUST follow XUI rendering lifecycle
- MUST not contain business logic
- MUST not directly mutate global state
- MUST not perform data fetching
- MUST not embed application logic

UI-only behavior is allowed.
Runtime state management is forbidden.

---

## JSON Contract

Components must be instantiable via:

```json
{
  "_type": "<registered xtype>",
  ...
}
```

Rules:

- No inline JS functions
- No direct DOM manipulation
- No side-channel state
- Nano-commands only

---

## Layout Philosophy

@xpell/xdashboard provides structural primitives:

- Layout (XGrid, XStack, XSection, XSidebar)
- Containers (XCard, XKpiCard, XModal, XDrawer)
- Data display (XTable, XBadge)
- UX helpers (XToast, XEmptyState)
- Input primitives (XField, XSelect, XSearchBox)

It does not define application flow.

---

## XData Rules

Fully inherits XData2 rules from @xpell/core:

- No shadow state
- No hidden local mirrors
- No direct XData mutation outside contract
- No polling
- No implicit syncing

---

## Forbidden Patterns

- Adding runtime modules inside this package
- Embedding API calls
- Introducing service logic
- Modifying unrelated packs
- Exposing private internals publicly
- Loosening encapsulation to fix compile errors

---

## One-Line Anchor

@xpell/xdashboard is a deterministic dashboard UI object pack for Xpell 2, providing structured layout and presentation components without owning application logic.
