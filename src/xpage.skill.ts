import type { XDashboardDiscoverySkill } from "./xskills";

export const XPAGE_SKILL: XDashboardDiscoverySkill = {
  _id: "xpage",
  _title: "XPage",
  _version: "1.0.0",
  _active: true,
  _type: "view-skill",
  _category: "composition",
  _purpose: "page width, padding, and vertical rhythm for XDashboard apps",
  _aliases: ["page", "dashboard page", "content page", "app page"],
  _capabilities: [
    "page-padding",
    "content-width",
    "vertical-rhythm",
    "responsive-page-spacing",
  ],
  _bindings: {
    _layout: ["_width", "_density", "_children"],
  },
  _usage: [
    "Use xpage inside xshell to establish content width, padding, and page rhythm.",
    "Use _width:'contained' for normal application pages, _width:'full' for wide operational views, and _width:'readable' for text-heavy pages.",
    "Place xpage-header, toolbar, and xsection children directly inside xpage.",
  ],
  _requires: ["xuiobject", "view", "xpage-header", "toolbar", "xsection"],
  _description:
    "Page composition object that applies canonical page padding, content width modes, vertical gaps, and responsive spacing for modern XDashboard application pages.",
  _fields: {
    _children: "Page content children.",
    _width: "Page width mode: full, contained, or readable. Defaults to contained.",
    _density: "Page rhythm density: compact, comfortable, or spacious.",
    class: "Optional CSS classes. xpage is applied automatically.",
  },
  _core_rules: [
    "Use xpage to avoid starter-specific page padding and max-width CSS.",
    "Use _width:'contained' for most app pages.",
    "Use _width:'full' only when content legitimately needs the full main region.",
    "Use _width:'readable' for prose/settings pages where line length matters.",
    "Do not use spacer objects for routine page gaps; xpage owns normal vertical rhythm.",
  ],
  _canonical_examples: [
    {
      _type: "xpage",
      _width: "contained",
      _children: [
        {
          _type: "xpage-header",
          _title: "Customers",
          _subtitle: "Manage customer accounts",
        },
        {
          _type: "toolbar",
          _children: [{ _type: "search", _placeholder: "Search customers" }],
        },
        {
          _type: "xsection",
          _title: "Customer list",
          _children: [],
        },
      ],
    },
  ],
};
