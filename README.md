# @xpell/xdashboard

## 2.0.8 release candidate

Target publication date: **13 November 2026**; this candidate has not been published.
Use the coordinated 2.0.8 runtime dependencies. See [CHANGELOG](./CHANGELOG.md)
for package changes and qualification limits; [LICENSE](./LICENSE) contains the MIT terms.

![npm](https://img.shields.io/npm/v/@xpell/xdashboard)
![downloads](https://img.shields.io/npm/dm/@xpell/xdashboard)
![license](https://img.shields.io/npm/l/%40xpell%2Fxdashboard)
![types](https://img.shields.io/badge/TypeScript-Types-blue)
![xpell](https://img.shields.io/badge/Xpell-2%20Alpha-6f42c1)

**XDashboard** is an official **dashboard UI component pack** for **Xpell 2 Alpha**, built on top of `@xpell/ui`.

It provides dashboard-oriented components and layout primitives for:

- Admin panels & internal tools
- Monitoring & observability UIs
- Analytics dashboards
- Builder interfaces (e.g. VIBE)

> Xpell is a runtime interpreter for dynamic systems.  
> `@xpell/xdashboard` is a structured UI object pack that composes dashboards using JSON.

---

## ✨ Highlights

- **Built for Xpell 2**: works with Nano-Commands + JSON-driven views
- **UI-only pack**: ships components, not runtime logic
- **Single CSS output**: predictable bundling (`xdashboard.css`)
- **ESM + CJS**: modern + compatible builds
- **Types included**: `.d.ts` declarations in `dist/types`

---

## 📦 Install

```bash
pnpm add @xpell/xdashboard
```

Peer dependencies (required by the consumer app):

```bash
pnpm add @xpell/ui @xpell/core
```

---

## 🚀 Quick Start

```ts
import { _x } from "@xpell/core";
import { XUI } from "@xpell/ui";
import { XDashboardPack } from "@xpell/xdashboard";

// Optional (recommended): include dashboard styles once
import "@xpell/xdashboard/xdashboard.css";

async function main() {
  _x.verbose = true;
  await _x.start();

  await _x.loadModule(XUI);
  await _x.loadObjectPack(XDashboardPack);

  XUI.createPlayer("xplayer");

  XUI.add({
    _type: "view",
    _id: "dashboard-home",
    _children: [
      {
        _type: "xd-card",
        _title: "Welcome to Xpell 2",
        _content: "Your dashboard is running."
      }
    ]
  });
}

main();
```

---

## 🎨 Styles

This package outputs a **single CSS file**:

```ts
import "@xpell/xdashboard/xdashboard.css";
```

---

## 🧱 What’s inside?

`@xpell/xdashboard` is designed as a **pure UI object pack**:

- Extends `@xpell/ui` primitives
- Adds dashboard-specific components (cards, layouts, widgets, etc.)
- Follows Nano-Commands v2 contract
- Contains **no runtime logic** (behavior lives in Xpell runtime/modules)

---

## 🔁 Versioning & Stability

Current version: `0.1.0-alpha.1`

This package is part of the **Xpell 2 Alpha** release cycle.

- Breaking changes may occur while APIs stabilize
- Once stable, we’ll move toward `beta` and `1.0`

---

## 🧩 Xpell 2 Ecosystem

Core packages:

- `@xpell/core`
- `@xpell/ui`
- `@xpell/node`
- `@xpell/3d`
- `@xpell/xdashboard`

---

## 🔗 Links

- **Website:** https://xpell.ai
- **Docs:** (coming soon)
- **Issues:** (link your GitHub issues page here)
- **Discussions:** (optional)

> Tip: once the repo URL is final, add it to `package.json` (`repository`, `bugs`, `homepage`) for the best npm page.

---

## 🛡️ License

MIT

---

## 👤 Author

Tamir Fridman  
Xpell 2 Alpha — 2026
