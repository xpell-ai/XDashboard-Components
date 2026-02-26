# XUI-TEST CODEX — STRICT SYSTEM CONTRACT

This document defines the NON-NEGOTIABLE rules for generating code
in the **xui-test / xpell-ui dashboard** project.

Violations are incorrect output.

---

## 1. CORE PRINCIPLES

- Xpell is NOT React / Vue / Angular
- Declarative JSON + runtime objects
- NO JSX
- NO hooks
- NO virtual DOM
- NO framework assumptions

Everything follows Xpell runtime rules explicitly.

---

## 2. OBJECT MODEL (MANDATORY)

All UI components MUST:

- Extend `XUIObject`
- Accept **one** `data` object in constructor
- Call `super(data, defaults, true)`
- Call `this.parse(data)`
- Use `_type` as the ONLY public identifier
- Define `static _xtype`

---

## 3. PROPERTY NAMING (CRITICAL)

- Any non-HTML property MUST start with `_`
- Examples:
  `_label`, `_value`, `_options`, `_dense`, `_variant`, `_data_source`, `_on_*`

❌ Forbidden:
- `label`, `value`, `options`, `onClick`, etc.

✅ Allowed HTML passthrough (only when intended):
- `style`, `src`, `href`, `title`, `id`
- `class` (explicit project exception)

---

## 4. EVENT SYSTEM

### 4.1 Global events (non-object)
Use `_xem` ONLY:
```ts
_xem.on("event", handler)
_xem.fire("event", payload)
```

### 4.2 Object events (JSON)

Use `_on_*` or `_on` map ONLY.

Supported shortcuts:

**XObject**
- `_on_create`
- `_on_mount`
- `_on_data`
- `_on_frame`

**XUIObject**
- `_on_click`
- `_on_show`
- `_on_hide`
- `_on_change`
- `_on_input`

### 4.3 Nano commands

Handlers MAY be strings invoking nano commands.

Nano commands MAY be used to handle `_on_data`.

### 4.4 Forbidden events

❌ Forbidden:
- `onClick`, `onChange`, `onclick`, `oninput`
- `addEventListener`
- DOM event handlers
- React/Vue conventions

---

## 5. DATA FLOW (XDATA2 — STRICT)

- XData2 (`_xd`) is the ONLY shared runtime state
- XData is NOT persistence
- XData is NOT an event bus

### 5.1 Canonical API (MANDATORY)

- `_xd.get(key)`
- `_xd.set(key, value, { source })`
- `_xd.delete(key, { source })`
- `_xd.on(key, handler)`
- `_xd.touch(key, { source })`
- `_xd.pick(key, { source })`

---

### 5.2 `_data_source` Binding (UI → Data)

```js
{
  _type: "label",
  _data_source: "fps",
  _on_data: "set-text-from-data empty:true"
}
```

---

### 5.3 Legacy Compatibility (STRICTLY LIMITED)

- `_xd._o[...]` is LEGACY ONLY
- New code MUST NOT write to `_xd._o`
- Wormholes MAY write to `_xd._o` only as ingress

---

### 5.4 Forbidden Patterns

❌ polling, timers, DOM queries, mirroring state

---

## 6. NO TIMERS

❌ `setInterval`, `setTimeout`

✅ `_on_frame`, `_on_data`

---

## 7. CHILDREN & DOM

- `_children` ONLY
- DOM is OUTPUT ONLY

---

## 8. STYLING

- NO hardcoded colors
- Use CSS tokens `var(--x-*)`

---

## 9. OUTPUT FORMAT (FOR CODEX)

1. Short explanation
2. Type interface
3. Class implementation
4. Minimal usage example

---

## 10. CODEX LINT CHECKLIST

(unchanged – enforced)

---

## 11. WORMHOLES v2 (WEB CLIENT) — STRICT CONTRACT

### 11.1 Canonical import

```ts
import { Wormholes } from "xpell-ui";
```

### 11.2 Envelope-only protocol

- Uses `_kind` (UPPERCASE)
- REQ/RES via `_rid`
- JSON-only payloads

❌ No raw JSON, no manual WebSocket/fetch

### 11.3 Opening

```ts
Wormholes.open({
  _url: "ws://localhost:3000/wh/v2",
  _auto_reconnect: true,
  _hello_payload: { _client: "xui-test" }
});
```

### 11.4 Events via `_xem`

```ts
_xem.on("wormhole-open", ...)
_xem.on("wormhole-close", ...)
```

### 11.5 Data ingress

- Wormholes is ingress boundary
- UI consumes via `_data_source`

### 11.6 v1 legacy

- Disabled by default
- `_allow_v1: true` required

### 11.7 Requests

```ts
await Wormholes.sendXcmd({
  _module: "xvm",
  _op: "navigate"
});
```

### 11.8 Events

```ts
Wormholes.sendEvt("datasource", { _data_source: "users", _data: [] });
```

### 11.9 Forbidden

❌ fetch/ws/timers/manual protocol

---

## 12 XObject Property Naming Rule (Mandatory)

All **runtime properties** defined inside `XObject` and **every framework-level object that extends it** MUST follow this rule:

- **Every runtime property name MUST start with `_`**
- This includes:
  - state fields (`_position`, `_rotation`, `_mass`)
  - configuration fields (`_enable_physics`, `_fade_duration`)
  - flags and toggles (`_visible`, `_disable_frame_3d_state`)
- Properties **without** a leading `_` are considered:
  - local variables
  - method arguments
  - internal implementation details only

### Rationale
The `_` prefix explicitly marks:
- engine-owned runtime state
- serializable / exportable fields
- fields eligible for command execution, binding, and inspection

This rule prevents:
- accidental API exposure
- ambiguity between runtime state and implementation logic
- cross-framework inconsistencies

### Non-Negotiable
- New framework code **must not** introduce runtime properties without `_`
- Public mutation of runtime state **must occur only via methods**
- Direct field access is allowed **only inside the owning class**

Violations of this rule are considered **engine contract breaks**.


## FINAL RULE

If unsure — STOP and ask.
