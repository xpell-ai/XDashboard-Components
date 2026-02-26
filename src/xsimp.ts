/**
 * xtest.ts — XUI Dashboard Playground (xsimp)
 *
 * Goals:
 * - Clean “component gallery” layout
 * - Every primitive has its own section (easy to verify)
 * - Zero random/demo noise
 * - Contract-compliant: underscore props + `_on_*` hooks only
 */

import { _x, _xd, _xlog, XUI } from "@xpell/ui";
import { XDashPack } from "./xcomp";
import "./style/dash.css";

async function main() {
  _x.verbose = true;
  _x.start();
  _x.loadModule(XUI);

  XUI.importObjectPack(XDashPack);
  XUI.createPlayer("xplayer");

  // ---------------------------------------------------------------------------
  // Demo data
  // ---------------------------------------------------------------------------
  const EVENTS_KEY = "table-data-demo";
  _xd._o[EVENTS_KEY] = [
    { id: "e1", time: "12:03", type: "LOGIN", user: "Alice" },
    { id: "e2", time: "12:10", type: "PURCHASE", user: "Bob" },
    { id: "e3", time: "12:18", type: "UPLOAD", user: "Cheng" },
    { id: "e4", time: "12:26", type: "LOGOUT", user: "Dana" }
  ];

  const readEvents = (): any[] => {
    const table = XUI.getObject("events_table") as any;
    if (Array.isArray(table?._rows)) return table._rows;
    const v = (_xd._o[EVENTS_KEY] as any) ?? [];
    if (Array.isArray(v)) return v;
    if (v && Array.isArray(v.rows)) return v.rows;
    return [];
  };

  const addEventRow = () => {
    const cur = readEvents();
    const types = ["LOGIN", "PURCHASE", "UPLOAD", "LOGOUT"];
    const nextIndex = cur.length + 1;
    const type = types[nextIndex % types.length];
    const now = new Date().toLocaleTimeString().slice(0, 5);

    const next = [
      ...cur,
      { id: `e${nextIndex}`, time: now, type, user: `User ${nextIndex}` }
    ];
    _xd._o[EVENTS_KEY] = next;
    const table = XUI.getObject("events_table") as any;
    if (table) {
      table._rows = next;
      if (typeof table.refresh === "function") table.refresh();
    }
    _xlog.log(`Added event row #${nextIndex}`, next);
  };

  // ---------------------------------------------------------------------------
  // App
  // ---------------------------------------------------------------------------
  XUI.add({
    _type: "view",
    _id: "xsimp",
    // HTML style is allowed; colors must come from tokens
    style:
      "width:100%;height:100%;display:flex;flex-direction:column;" +
      "align-items:stretch;box-sizing:border-box;" +
      "padding:20px;background:var(--x-bg);",

    _children: [
      // Centered content column
      {
        _type: "view",
        _id: "xsimp_content",
        style:
          "width:100%;max-width:1120px;margin:0 auto;" +
          "display:flex;flex-direction:column;gap:16px;",

        _children: [
          // -------------------------------------------------------------------
          // Header
          // -------------------------------------------------------------------
          {
            _type: "toolbar",
            _gap: 12,
            _justify: "space-between",
            _elevated: true,
            _children: [
              {
                _type: "stack",
                _direction: "horizontal",
                _gap: 10,
                _align: "center",
                _children: [
                  { _type: "label", _text: "XUI Dashboard Primitives" },
                  {
                    _type: "badge",
                    _text: "xsimp",
                    _variant: "info",
                    _dot: true,
                    _pill: true,
                    _size: "sm"
                  }
                ]
              },

              {
                _type: "stack",
                _direction: "horizontal",
                _gap: 8,
                _children: [
                  {
                    _type: "button",
                    _text: "Update Title",
                    class: "dash-btn",
                    _on_click: () => {
                      _xd._o["app_title"] =
                        "Updated " + new Date().toLocaleTimeString();
                    }
                  },
                  {
                    _type: "button",
                    _text: "Log Theme",
                    class: "dash-btn",
                    _on_click: () => _xlog.log("theme:", _xd._o["theme"] ?? "n/a")
                  }
                ]
              }
            ]
          },

          // Dynamic title (tests _data_source + _on_data contract)
          {
            _type: "label",
            _id: "xsimp_title",
            _text: "Component Gallery",
            _data_source: "app_title",
            _on_data: (xobj: any, data: any) => {
              xobj._text = `Component Gallery — ${String(data ?? "")}`;
              if (typeof xobj.emptyDataSorce === "function") xobj.emptyDataSorce();
            }
          },

          { _type: "divider", _muted: true },

          // -------------------------------------------------------------------
          // Cards / KPI
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_cards",
            _title: "Cards",
            _subtitle: "XCard + XKpiCard",
            _children: [
              {
                _type: "grid",
                _min_col_width: 260,
                _gap: 16,
                _children: [
                  {
                    _type: "card",
                    _id: "card_1",
                    _title: "My Test Card",
                    _card_text: "This is a sample card created using XCard.",
                    _link_url: "https://google.com",
                    _image: "/public/xlogo.png"
                  },
                  {
                    _type: "card",
                    _id: "card_2",
                    _title: "Another Card",
                    _card_text: "Another sample card using XCard.",
                    _link_url: "https://github.com",
                    _image: "/public/xlogo.png"
                  },
                  {
                    _type: "kpi-card",
                    _id: "kpi_1",
                    _label: "Users",
                    _value: "1,204",
                    _delta: "+8%",
                    _delta_state: "up"
                  },
                  {
                    _type: "kpi-card",
                    _id: "kpi_2",
                    _label: "Sales",
                    _value: "$32,400",
                    _delta: "-2%",
                    _delta_state: "down"
                  }
                ]
              }
            ]
          },

          // -------------------------------------------------------------------
          // Badges
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_badge",
            _title: "Badge",
            _subtitle: "XBadge variants",
            _children: [
              {
                _type: "toolbar",
                _gap: 10,
                _children: [
                  { _type: "badge", _text: "Online", _variant: "success", _dot: true, _pill: true },
                  { _type: "badge", _text: "Warn", _variant: "warn", _dot: true, _pill: true },
                  { _type: "badge", _text: "Fail", _variant: "error", _dot: true, _pill: true },
                  { _type: "badge", _text: "Info", _variant: "info", _dot: true, _pill: false },
                  { _type: "badge", _text: "Small", _variant: "default", _size: "sm", _pill: true }
                ]
              }
            ]
          },

          // -------------------------------------------------------------------
          // Inputs (Search / Select / InputGroup / Field)
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_inputs",
            _title: "Inputs",
            _subtitle: "XSearchBox + XSelect + XInputGroup + XField",
            _children: [
              {
                _type: "toolbar",
                _gap: 12,
                _justify: "space-between",
                _children: [
                  {
                    _type: "igroup",
                    _gap: 8,
                    _children: [
                      {
                        _type: "search",
                        _placeholder: "Search…",
                        _clearable: true,
                        // contract: use `_on_*` (we standardize on `_on_change`)
                        _on_change: (xobj: any, value: string) =>
                          _xlog.log("search:", value ?? (xobj?.getValue?.() ?? ""))
                      },
                      {
                        _type: "select",
                        _placeholder: "Status",
                        _options: [
                          { value: "all", label: "All" },
                          { value: "open", label: "Open" },
                          { value: "closed", label: "Closed" }
                        ],
                        _on_change: (_xobj: any, v: string) => _xlog.log("status:", v)
                      },
                      { _type: "button", _text: "Filter", class: "dash-btn" }
                    ]
                  },
                  { _type: "spacer" },
                  { _type: "button", _text: "New", class: "dash-btn" }
                ]
              },

              { _type: "divider", _muted: true },

              {
                _type: "stack",
                _gap: 12,
                _children: [
                  {
                    _type: "field",
                    _label: "Username",
                    _hint: "Visible to teammates.",
                    _required: true,
                    _control: {
                      _type: "input",
                      _placeholder: "Enter username…"
                    }
                  },
                  {
                    _type: "field",
                    _label: "Role",
                    _control: {
                      _type: "select",
                      _placeholder: "Choose",
                      _options: [
                        { value: "admin", label: "Admin" },
                        { value: "editor", label: "Editor" },
                        { value: "viewer", label: "Viewer" }
                      ]
                    }
                  }
                ]
              }
            ]
          },

          // -------------------------------------------------------------------
          // Table (XData bound)
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_table",
            _title: "Table",
            _subtitle: "XTable v1.1 (_data_source + _on_data)",
            _children: [
              {
                _type: "toolbar",
                _gap: 8,
                _children: [
                  { _type: "button", _text: "Add Row", class: "dash-btn", _on_click: addEventRow },
                  {
                    _type: "button",
                    _text: "Clear",
                    class: "dash-btn",
                    _on_click: () => {
                      _xd._o[EVENTS_KEY] = [];
                      const table = XUI.getObject("events_table") as any;
                      if (table) {
                        table._rows = [];
                        if (typeof table.refresh === "function") table.refresh();
                      }
                    }
                  }
                ]
              },

              {
                _type: "scroll",
                _max_height: "240px",
                _children: [
                  {
                    _type: "table",
                    _id: "events_table",
                    _striped: true,
                    _hover: true,
                    _bordered: true,

                    _data_source: EVENTS_KEY,
                    _on_data: (xobj: any, data: any) => {
                      _xlog.log("Table data updated:", data);
                      xobj._rows = Array.isArray(data) ? data : (data?.rows ?? []);
                      if (typeof xobj.refresh === "function") xobj.refresh();
                      if (typeof xobj.emptyDataSorce === "function") xobj.emptyDataSorce();
                    },

                    _columns: [
                      { key: "time", label: "Time", width: "80px" },
                      {
                        key: "type",
                        label: "Type",
                        align: "center",
                        render: (_value: any, row: any) => ({
                          _type: "badge",
                          _text: row?.type || "",
                          _variant:
                            row?.type === "LOGIN"
                              ? "success"
                              : row?.type === "PURCHASE"
                              ? "info"
                              : row?.type === "UPLOAD"
                              ? "warn"
                              : "default",
                          _dot: true,
                          _pill: true,
                          _size: "sm"
                        })
                      },
                      { key: "user", label: "User" },
                      { key: "id", label: "ID", align: "end", width: "90px" }
                    ],
                    _empty_text: "No events"
                  }
                ]
              }
            ]
          },

          // -------------------------------------------------------------------
          // Empty State
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_empty",
            _title: "Empty State",
            _subtitle: "XEmptyState",
            _children: [
              {
                _type: "empty",
                _title: "No projects",
                _description: "Create your first project to get started.",
                _action: { _type: "button", _text: "Create Project", class: "dash-btn" }
              }
            ]
          },

          // -------------------------------------------------------------------
          // Drawer
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_drawer",
            _title: "Drawer",
            _subtitle: "XDrawer v1 (properties panel)",
            _children: [
              {
                _type: "toolbar",
                _children: [
                  { _type: "label", _text: "Drawer Playground" },
                  { _type: "spacer" },
                  {
                    _type: "button",
                    _text: "Open Properties",
                    class: "dash-btn",
                    _on_click: () => {
                      const d = XUI.getObject("props-drawer") as any;
                      if (d?.setOpen) d.setOpen(true);
                    }
              }
            ]
          },

          // -------------------------------------------------------------------
          // NavList
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_navlist",
            _title: "NavList",
            _subtitle: "Sidebar list primitive",
            _children: [
              {
                _type: "navlist",
                _active: "overview",
                _items: [
                  {
                    _value: "overview",
                    _label: "Overview",
                    _badge: {
                      _type: "badge",
                      _text: "3",
                      _variant: "info",
                      _pill: true,
                      _size: "sm"
                    }
                  },
                  { _value: "users", _label: "Users" },
                  { _value: "settings", _label: "Settings", _disabled: true }
                ],
                _on_select: (_xobj: any, value: string) =>
                  _xlog.log("nav select:", value)
              }
            ]
          },

          // -------------------------------------------------------------------
          // Sidebar
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_sidebar",
            _title: "Sidebar",
            _subtitle: "XSidebar v1",
            _children: [
              {
                _type: "view",
                style:
                  "position:relative;min-height:320px;display:flex;overflow:hidden;" +
                  "border:1px solid var(--x-border);border-radius:12px;",
                _children: [
                  {
                    _type: "sidebar",
                    _id: "demo_sidebar",
                    _side: "left",
                    _width: "280px",
                    _title: "XUI Builder",
                    _subtitle: "Dashboard shell",
                    _dividers: true,
                    _scroll: true,
                    _actions: [
                      {
                        _type: "button",
                        _text: "≡",
                        class: "dash-btn",
                        _on_click: () => {
                          const s = XUI.getObject("demo_sidebar") as any;
                          if (s?.toggleCollapsed) s.toggleCollapsed();
                        }
                      }
                    ],
                    _nav: {
                      _type: "navlist",
                      _active: "overview",
                      _items: [
                        { _value: "overview", _label: "Overview" },
                        { _value: "projects", _label: "Projects" },
                        { _value: "settings", _label: "Settings", _disabled: true }
                      ],
                      _on_select: (_xobj: any, value: string) =>
                        _xlog.log("nav:", value)
                    },
                    _footer: {
                      _type: "stack",
                      _direction: "horizontal",
                      _gap: 8,
                      _children: [
                        {
                          _type: "badge",
                          _text: "v1",
                          _variant: "info",
                          _pill: true,
                          _size: "sm"
                        },
                        { _type: "label", _text: "Ready" }
                      ]
                    }
                  },
                  {
                    _type: "view",
                    class: "sidebar-demo-main",
                    style: "flex:1;padding:16px;",
                    _children: [
                      { _type: "label", _text: "Main content area" }
                    ]
                  }
                ]
              }
            ]
          },

          // -------------------------------------------------------------------
          // Modal
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_modal",
            _title: "Modal",
            _subtitle: "XModal v1",
            _children: [
              {
                _type: "button",
                _text: "Open Modal",
                class: "dash-btn",
                _on_click: () => {
                  const m = XUI.getObject("demo_modal") as any;
                  _xlog.log("Opening modal",m);
                  if (m?.open) m.open();
                }
              },
              {
                _type: "modal",
                _id: "demo_modal",
                _open: false,
                _title: "Delete project?",
                _subtitle: "This action cannot be undone.",
                _closable: true,
                _close_on_backdrop: true,
                _scroll: true,
                _children: [
                  {
                    _type: "label",
                    _text: "Are you sure you want to delete this project?"
                  },
                  { _type: "divider", _muted: true },
                  {
                    _type: "label",
                    _text: "Tip: use XToast later for non-blocking feedback."
                  }
                ],
                _actions: [
                  {
                    _type: "button",
                    _text: "Cancel",
                    class: "dash-btn",
                    _on_click: () => {
                      const m = XUI.getObject("demo_modal") as any;
                      if (m?.close) m.close();
                    }
                  },
                  {
                    _type: "button",
                    _text: "Confirm",
                    class: "dash-btn",
                    _on_click: () => {
                      console.log("confirmed");
                      const m = XUI.getObject("demo_modal") as any;
                      if (m?.close) m.close();
                    }
                  }
                ]
              }
            ]
          },

          // -------------------------------------------------------------------
          // Toast
          // -------------------------------------------------------------------
          {
            _type: "section",
            _id: "sec_toast",
            _title: "Toast",
            _subtitle: "XToast v1",
            _children: [
              {
                _type: "stack",
                _direction: "horizontal",
                _gap: 8,
                _children: [
                  {
                    _type: "button",
                    _text: "Show Success Toast",
                    class: "dash-btn",
                    _on_click: () => {
                      const t = XUI.getObject("demo_toast_success") as any;
                      if (t?.open) t.open();
                    }
                  },
                  {
                    _type: "button",
                    _text: "Show Fail Toast",
                    class: "dash-btn",
                    _on_click: () => {
                      const t = XUI.getObject("demo_toast_error") as any;
                      if (t?.open) t.open();
                    }
                  },
                  {
                    _type: "button",
                    _text: "Show Warn Toast",
                    class: "dash-btn",
                    _on_click: () => {
                      const t = XUI.getObject("demo_toast_warn") as any;
                      if (t?.open) t.open();
                    }
                  },
                  {
                    _type: "button",
                    _text: "Show Info Toast",
                    class: "dash-btn",
                    _on_click: () => {
                      const t = XUI.getObject("demo_toast_info") as any;
                      if (t?.open) t.open();
                    }
                  },
                  {
                    _type: "button",
                    _text: "Show Default Toast",
                    class: "dash-btn",
                    _on_click: () => {
                      const t = XUI.getObject("demo_toast_default") as any;
                      if (t?.open) t.open();
                    }
                  }
                ]
              },
              {
                _type: "toast",
                _id: "demo_toast_success",
                _variant: "success",
                _text: "Project saved successfully",
                _auto_close_ms: 3000,
                _position: "bottom-right",
                _actions: [
                  { _type: "button", _text: "Undo", class: "dash-btn" }
                ]
              },
              {
                _type: "toast",
                _id: "demo_toast_error",
                _variant: "error",
                _text: "Save failed. Try again.",
                _auto_close_ms: 3000,
                _position: "bottom-left",
                _actions: [
                  { _type: "button", _text: "Retry", class: "dash-btn" }
                ]
              },
              {
                _type: "toast",
                _id: "demo_toast_warn",
                _variant: "warn",
                _text: "Storage is almost full.",
                _auto_close_ms: 3000,
                _position: "top-right",
                _actions: [
                  { _type: "button", _text: "Manage", class: "dash-btn" }
                ]
              },
              {
                _type: "toast",
                _id: "demo_toast_info",
                _variant: "info",
                _text: "New updates available.",
                _auto_close_ms: 3000,
                _position: "top-left",
                _actions: [
                  { _type: "button", _text: "View", class: "dash-btn" }
                ]
              },
              {
                _type: "toast",
                _id: "demo_toast_default",
                _variant: "default",
                _text: "Background sync completed.",
                _auto_close_ms: 3000,
                _position: "bottom-right",
                _actions: [
                  { _type: "button", _text: "OK", class: "dash-btn" }
                ]
              }
            ]
          },

              // Drawer must live in a positioned container for clean demo
              {
                _type: "view",
                class: "xsimp-drawer-host",
                style:
                  "position:relative;min-height:260px;display:flex;" +
                  "justify-content:flex-end;overflow:hidden;" +
                  "border:1px solid var(--x-border);border-radius:12px;",
                _children: [
                  {
                    _type: "drawer",
                    _id: "props-drawer",
                    _open: false,
                    _side: "right",
                    _width: "340px",
                    _title: "Properties",
                    _closable: true,
                    _scroll: true,
                    _children: [
                      {
                        _type: "stack",
                        _gap: 12,
                        _children: [
                          {
                            _type: "field",
                            _label: "Variant",
                            _control: {
                              _type: "select",
                              _placeholder: "Choose",
                              _options: [
                                { value: "default", label: "Default" },
                                { value: "success", label: "Success" },
                                { value: "warn", label: "Warn" },
                                { value: "error", label: "Error" }
                              ]
                            }
                          },
                          {
                            _type: "field",
                            _label: "Title",
                            _control: { _type: "input", _placeholder: "Enter title…" }
                          }
                        ]
                      }
                    ],
                    _on_open: () => _xlog.log("drawer open"),
                    _on_close: () => _xlog.log("drawer close")
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  });

  _xlog.log("✅ xsimp loaded");
  _xd._o["app_title"] = "Ready";
}

main().catch(console.error);
