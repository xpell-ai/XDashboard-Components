import type { XDashboardDiscoverySkill } from "./xskills";

export const XSHELL_SKILL: XDashboardDiscoverySkill = {
  _id: "xshell",
  _title: "XShell",
  _version: "1.0.0",
  _active: true,
  _type: "view-skill",
  _category: "composition",
  _purpose: "application shell geometry for XDashboard pages",
  _aliases: ["app shell", "application shell", "dashboard shell", "layout shell"],
  _capabilities: [
    "viewport-containment",
    "sidebar-layout",
    "main-scroll-region",
    "single-main-region",
  ],
  _bindings: {
    _layout: ["_sidebar", "_children", "_scroll"],
  },
  _usage: [
    "Use xshell as the top-level application geometry object for dashboards and consoles.",
    "Place sidebar navigation in _sidebar and page/content objects in _children.",
    "Do not use xshell as a card or panel; it is structural only.",
  ],
  _requires: ["xuiobject", "view", "sidebar", "xpage"],
  _description:
    "Application shell composition object that establishes viewport geometry, optional sidebar placement, primary main region, and deterministic scroll ownership for XDashboard pages.",
  _fields: {
    _sidebar: "Optional sidebar object, usually _type:'sidebar'.",
    _children: "Main application region children, usually xpage objects.",
    _scroll: "Whether the main region owns vertical scrolling. Defaults to true.",
    class: "Optional CSS classes. xshell is applied automatically.",
  },
  _core_rules: [
    "Use xshell once at the root of a dashboard application or app-like view.",
    "Use _sidebar for existing sidebar composition; do not make sidebar mandatory.",
    "Use _children for the main region and prefer xpage as the first child.",
    "Keep xshell structural: no card surface, no business content ownership.",
    "Do not create nested scroll regions unless an inner scroll object is explicitly required.",
  ],
  _canonical_examples: [
    {
      _type: "xshell",
      _sidebar: {
        _type: "sidebar",
        _title: "Operations",
        _nav: {
          _type: "navlist",
          _active: "list",
          _items: [{ _label: "List", _value: "list" }],
        },
      },
      _children: [
        {
          _type: "xpage",
          _children: [
            {
              _type: "xpage-header",
              _title: "Customers",
              _subtitle: "Manage customer accounts",
            },
          ],
        },
      ],
    },
  ],
};
