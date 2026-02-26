/**
 * xtest.ts — XUI + XVM Test Lab (WRAPPER-FIRST)
 *
 * Rules:
 * - Use XUI wrappers when they exist: view/label/button/input/text/textarea/link...
 * - Use XHTML aliases only for semantic tags that have no wrapper (header/main/section/footer/p/span/nav...)
 *
 * What it tests:
 * 1) XUIObject lifecycle events: _on_create, _on_mount, _on_show, _on_hide, _on_frame, _on_data
 * 2) Wrapper events: _on / _once (click, keyup, change, animationend)
 * 3) Nano commands:
 *    hide, show, toggle, set-text, set-text-from-frame, set-text-from-data,
 *    add-class, remove-class, toggle-class, set-style, set-attr, remove-attr
 */

import { _x, _xd, _xlog, XUI, XVM, type XObjectData } from "@xpell/ui";
import type { XVMApp as XVMAppType } from "@xpell/ui";
import "./style/xtest.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const VIEW_EVENTS = "page-events";
const VIEW_NANO = "page-nano";

const REGION_MAIN = "region-main";
const REGION_MODAL = "region-modal";

const LOG_KEY = "xtest:log";
const TARGET_ID = "nano-target";
const INSPECT_ID = "nano-inspect";

const now = () => new Date().toLocaleTimeString();

const pushLog = (msg: string) => {
  const list = (_xd._o[LOG_KEY] as string[]) || [];
  list.push(`[${now()}] ${msg}`);
  _xd._o[LOG_KEY] = list.slice(-30);
};

const safe = (x: any) => {
  try {
    if (x == null) return String(x);
    if (typeof x === "string") return x;
    if (typeof x === "number" || typeof x === "boolean") return String(x);
    if (x instanceof Event) return x.type;
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
};

const setText = (id: string, text: string) => {
  const o = (XUI as any)._o?.[id];
  if (o) o._text = text;
};

const chipOk = (chipId: string, last?: string) => {
  const chip = (XUI as any)._o?.[chipId];
  if (chip) chip.replaceClass("chip chip-bad", "chip chip-ok");
  if (last) {
    const l = (XUI as any)._o?.[`${chipId}__last`];
    if (l) l._text = last;
  }
};

const refreshInspect = () => {
  const t = (XUI as any)._o?.[TARGET_ID];
  const out: any = {};
  if (t) {
    out._id = t._id;
    out._type = t._type;
    out._visible = t._visible;
    out._text = t._text;
    out.class = (t as any).class;
    out.style = (t as any).style;

    try {
      const el = t.dom;
      out.dom = {
        tag: el?.tagName,
        className: el?.className,
        styleAttr: el?.getAttribute?.("style"),
        title: el?.getAttribute?.("title"),
        display: el ? getComputedStyle(el).display : undefined,
      };
    } catch {}
  }

  const pre = (XUI as any)._o?.[INSPECT_ID];
  if (pre) pre._text = JSON.stringify(out, null, 2);
};

const runNano = (cmd: string) => {
  const t = (XUI as any)._o?.[TARGET_ID];
  if (!t?.checkAndRunInternalFunction) return;
  t.checkAndRunInternalFunction(cmd);
  pushLog(`nano: ${cmd}`);
  refreshInspect();
};

/* -------------------------------------------------------------------------- */
/* UI Builders                                                                */
/* -------------------------------------------------------------------------- */

const chipRow = (id: string, title: string, hint: string): XObjectData => ({
  _type: "view",
  class: "row",
  _children: [
    { _type: "label", class: "row-title", _text: title },
    { _type: "label", class: "row-hint", _text: hint },
    { _type: "label", _id: id, class: "chip chip-bad", _text: "pending" },
    { _type: "label", _id: `${id}__last`, class: "row-last", _text: "last: -" },
  ],
});

const card = (title: string, body: XObjectData[], foot?: XObjectData[]): XObjectData => ({
  _type: "section", // XHTML alias -> semantic
  class: "card",
  _children: [
    { _type: "view", class: "card-head", _children: [{ _type: "label", _text: title }] },
    { _type: "view", class: "card-body", _children: body },
    ...(foot ? [{ _type: "view", class: "card-foot", _children: foot }] : []),
  ],
});

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

const shell: XObjectData = {
  _type: "view",
  _id: "app",
  class: "xtest-app",
  _children: [
    {
      _type: "header", // XHTML alias
      _id: "topbar",
      class: "xtest-topbar",
      _children: [
        {
          _type: "view",
          class: "topbar-left",
          _children: [
            { _type: "label", class: "brand", _text: "XUI Lab" },
            { _type: "label", class: "brand-sub", _text: "Events • Wrappers • Nano Commands" },
          ],
        },
        {
          _type: "nav", // XHTML alias
          class: "topbar-tabs",
          _children: [
            { _type: "link", class: "tab", href: `#${VIEW_EVENTS}`, _text: "Events" },
            { _type: "link", class: "tab", href: `#${VIEW_NANO}`, _text: "Nano Lab" },
          ],
        },
        {
          _type: "view",
          class: "topbar-right",
          _children: [
            { _type: "label", _id: "badge-frame", class: "badge", _text: "Frame: 0" },
            { _type: "label", _id: "badge-fps", class: "badge", _text: "FPS: 0" },
            { _type: "label", _id: "badge-objects", class: "badge", _text: "Objects: 0" },
            { _type: "label", _id: "badge-active", class: "badge", _text: `Active: ${VIEW_EVENTS}` },
          ],
        },
      ],
    },

    // XVM regions
    { _type: "view", _id: REGION_MAIN, class: "xtest-region-main" },
    { _type: "view", _id: REGION_MODAL, class: "xtest-region-modal" },

    // Log console
    {
      _type: "footer", // XHTML alias
      _id: "logbar",
      class: "xtest-logbar",
      _children: [
        { _type: "label", class: "logbar-title", _text: "Log" },
        {
          _type: "textarea",
          _id: "log-list",
          class: "log-list",
          _text: "",
          _data_source: LOG_KEY,
          _on_data: (xobj: any, data: any) => {
            const arr = Array.isArray(data) ? data : [];
            xobj._text = arr.join("\n");
          },
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Views                                                                      */
/* -------------------------------------------------------------------------- */

const eventsView: XObjectData = {
  _id: VIEW_EVENTS,
  _type: "view",
  class: "page",
  _children: [
    {
      _type: "view",
      class: "page-grid",
      _children: [
        /* ------------------------------ LEFT COL ------------------------------ */
        {
          _type: "view",
          class: "col",
          _children: [
            card(
              "1) Lifecycle Events",
              [
                {
                  _type: "view",
                  _id: "lifecycle-probe",
                  class: "probe",
                  _text: "Lifecycle probe (show/hide + frame + data)",
                  _on_create: () => {
                    chipOk("chip_create", "last: on_create");
                    pushLog("lifecycle: _on_create fired");
                  },
                  _on_mount: () => {
                    chipOk("chip_mount", "last: on_mount");
                    pushLog("lifecycle: _on_mount fired");
                  },
                  _on_show: () => {
                    chipOk("chip_show", "last: on_show");
                    pushLog("lifecycle: _on_show fired");
                  },
                  _on_hide: () => {
                    chipOk("chip_hide", "last: on_hide");
                    pushLog("lifecycle: _on_hide fired");
                  },
                  _on_frame: (_xobj: any, frame: any) => {
                    setText("badge-frame", `Frame: ${frame ?? 0}`);
                    chipOk("chip_frame", `last: frame=${frame ?? 0}`);
                  },
                  _data_source: "xdata",
                  _on_data: (_xobj: any, data: any) => {
                    _xlog.log("lifecycle: _on_data fired", data);
                    chipOk("chip_data", `last: xdata=${safe(data)}`);
                    pushLog(`data: xdata -> ${safe(data)}`);
                  },
                } as any,

                chipRow("chip_create", "_on_create", "fires once when created"),
                chipRow("chip_mount", "_on_mount", "fires when mounted to DOM"),
                chipRow("chip_show", "_on_show", "fires when shown"),
                chipRow("chip_hide", "_on_hide", "fires when hidden"),
                chipRow("chip_frame", "_on_frame", "fires each engine frame"),
                chipRow("chip_data", "_on_data", "fires when XData[xdata] changes"),
              ],
              [
                {
                  _type: "button",
                  class: "btn",
                  _text: "Fire xdata",
                  _on_click: () => {
                    _xd._o["xdata"] = Date.now();
                    pushLog("action: set XData[xdata]");
                  },
                },
                {
                  _type: "button",
                  class: "btn",
                  _text: "Hide probe",
                  _on_click: () => (XUI as any)._o["lifecycle-probe"]?.hide?.(),
                },
                {
                  _type: "button",
                  class: "btn",
                  _text: "Show probe",
                  _on_click: () => (XUI as any)._o["lifecycle-probe"]?.show?.(),
                },
                {
                  _type: "button",
                  class: "btn",
                  _text: "Toggle probe",
                  _on_click: () => (XUI as any)._o["lifecycle-probe"]?.toggle?.(),
                },
              ]
            ),

            card("2) Wrapper Events (_on / _once)", [
              {
                _type: "view",
                _id: "wrapper-probe",
                class: "probe probe-focus",
                _text: "Wrapper probe (click + keyup + once)",
                tabindex: 0, // focusable for keyup
                _on: {
                  click: (xobj: any, e: any) => {
                    chipOk("chip_on_click", `last: click (${safe(e?.type)})`);
                    pushLog("wrapper: _on.click");
                    xobj.toggleClass("probe-hot");
                  },
                  keyup: (_xobj: any, e: any) => {
                    chipOk("chip_on_keyup", `last: keyup key=${(e as any)?.key ?? "?"}`);
                    pushLog(`wrapper: _on.keyup ${(e as any)?.key ?? "?"}`);
                  },
                  animationend: (_xobj: any) => {
                    chipOk("chip_on_animend", "last: animationend");
                    pushLog("wrapper: _on.animationend");
                  },
                },
                _once: {
                  mount: () => {
                    chipOk("chip_once_mount", "last: once mount");
                    pushLog("wrapper: _once.mount");
                  },
                  click: () => {
                    chipOk("chip_once_click", "last: once click");
                    pushLog("wrapper: _once.click");
                  },
                },
              } as any,

              chipRow("chip_on_click", "_on: click", "click the probe"),
              chipRow("chip_on_keyup", "_on: keyup", "focus the probe then type"),
              chipRow("chip_once_mount", "_once: mount", "fires once"),
              chipRow("chip_once_click", "_once: click", "fires once (first click only)"),

              {
                _type: "input",
                _id: "probe-input",
                class: "input",
                placeholder: "Type here to test input keyup/change",
                _on: {
                  keyup: (_xobj: any, e: any) => {
                    chipOk("chip_input_keyup", `last: key=${(e as any)?.key ?? "?"}`);
                    pushLog(`input: keyup ${(e as any)?.key ?? "?"}`);
                  },
                  change: (xobj: any) => {
                    const v = (xobj as any)?.dom?.value ?? "";
                    chipOk("chip_input_change", `last: value=${v}`);
                    pushLog(`input: change value=${v}`);
                  },
                },
              } as any,

              chipRow("chip_input_keyup", "input _on: keyup", "keyup on input"),
              chipRow("chip_input_change", "input _on: change", "change on input"),
            ], [
              {
                _type: "button",
                class: "btn",
                _text: "Animate probe (CSS class)",
                _on_click: () => {
                  const p = (XUI as any)._o["wrapper-probe"];
                  if (!p) return;
                  p.addClass("probe-bounce");
                  pushLog("action: addClass probe-bounce");
                },
              },
              {
                _type: "button",
                class: "btn",
                _text: "Go to Nano Lab",
                _on_click: () => XVM.show(VIEW_NANO, { region: "main" }),
              },
            ]),
          ],
        },

                /* ------------------------------ RIGHT COL ----------------------------- */
        {
          _type: "view",
          class: "col",
          _children: [
            card("Quick Actions", [
              { _type: "label", class: "muted", _text: "Fast triggers to update badges + data." },

              {
                _type: "button",
                class: "btn wide",
                _text: "Set XData[fps]",
                _on_click: () => {
                  _xd._o["fps"] = Math.round(30 + Math.random() * 90);
                  setText("badge-fps", `FPS: ${_xd._o["fps"]}`);
                  pushLog(`action: fps=${_xd._o["fps"]}`);
                },
              },

              {
                _type: "button",
                class: "btn wide",
                _text: "Recompute Objects badge",
                _on_click: () => {
                  const count = Object.keys((XUI as any)._o || {}).length;
                  setText("badge-objects", `Objects: ${count}`);
                  pushLog(`action: objects=${count}`);
                },
              },
            ]),
          ],
        },

      ],
    },
  ],
}

const nanoView: XObjectData = {
  _id: VIEW_NANO,
  _type: "view",
  class: "page",
  _children: [
    {
      _type: "view",
      class: "page-grid",
      _children: [
        /* ------------------------------ LEFT COL ------------------------------ */
        {
          _type: "view",
          class: "col",
          _children: [
            card("Nano Command Lab", [
              { _type: "label", class: "muted", _text: `Target: #${TARGET_ID}` },

              {
                _type: "view",
                class: "btn-row",
                _children: [
                  { _type: "button", class: "btn", _text: "hide", _on_click: () => runNano("hide") },
                  { _type: "button", class: "btn", _text: "show", _on_click: () => runNano("show") },
                  { _type: "button", class: "btn", _text: "toggle", _on_click: () => runNano("toggle") },
                ],
              },

              {
                _type: "view",
                class: "btn-row",
                _children: [
                  { _type: "button", class: "btn", _text: "set-text", _on_click: () => runNano("set-text text:'Hello Xpell'") },
                  { _type: "button", class: "btn", _text: "set-text-from-frame", _on_click: () => runNano("set-text-from-frame pattern:'Frame=$data'") },
                  { _type: "button", class: "btn", _text: "set-text-from-data", _on_click: () => runNano("set-text-from-data pattern:'xdata=$data' empty:false") },
                ],
              },

              {
                _type: "view",
                class: "btn-row",
                _children: [
                  {
                    _type: "button",
                    class: "btn",
                    _text: "set (XData[xdata])",
                    _on_click: () => {
                      _xd._o["xdata"] = Date.now();
                      pushLog("action: set XData[xdata]");
                      refreshInspect();
                    },
                  },
                  { _type: "button", class: "btn", _text: "add-class", _on_click: () => runNano("add-class class:'probe-hot'") },
                  { _type: "button", class: "btn", _text: "remove-class", _on_click: () => runNano("remove-class class:'probe-hot'") },
                  { _type: "button", class: "btn", _text: "toggle-class", _on_click: () => runNano("toggle-class class:'probe-hot'") },
                ],
              },

              {
                _type: "view",
                class: "btn-row",
                _children: [
                  { _type: "button", class: "btn", _text: "set-style", _on_click: () => runNano("set-style style:'border:2px dashed #888; padding:12px; border-radius:12px;'") },
                  { _type: "button", class: "btn", _text: "set-attr", _on_click: () => runNano("set-attr name:'title' value:'hello attr'") },
                  { _type: "button", class: "btn", _text: "remove-attr", _on_click: () => runNano("remove-attr name:'title'") },
                ],
              },

              { _type: "button", class: "btn wide", _text: "Back to Events", _on_click: () => XVM.show(VIEW_EVENTS, { region: "main" }) },
            ]),
          ],
        },

        /* ------------------------------ RIGHT COL ----------------------------- */
        {
          _type: "view",
          class: "col",
          _children: [
            card("Target", [
              {
                _type: "view",
                _id: TARGET_ID,
                class: "probe",
                _text: "I am the nano target",
                _on_mount: () => refreshInspect(),
                _on_frame: (_xobj: any, frame: any) => setText("badge-frame", `Frame: ${frame ?? 0}`),
                _data_source: "xdata",
                _on_data: () => refreshInspect(),
              } as any,
              { _type: "label", class: "muted", _text: "Tip: run nano buttons and watch this box + inspector." },
            ]),

            card("Inspector", [
              { _type: "textarea", _id: INSPECT_ID, class: "inspect", _text: "{}" },
            ]),
          ],
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* App                                                                        */
/* -------------------------------------------------------------------------- */

async function main() {
  _x.verbose = true;
  _x.start();
  _x.loadModule(XUI);

  XUI.createPlayer("xplayer");

  const views: Record<string, XObjectData> = {
    [VIEW_EVENTS]: eventsView,
    [VIEW_NANO]: nanoView,
  };

  const app: any = {
    _id: "xui-lab",
    xpell: { version: 2 },

    _shell: shell,

    _containers: [{ _id: REGION_MAIN }, { _id: REGION_MODAL }],

    _regions: [
      { _id: "main", _container_id: REGION_MAIN, _history: true, _hash_sync: true },
      { _id: "modal", _container_id: REGION_MODAL, _history: true, _hash_sync: false },
    ],

    _views: views,

    _router: { _region: "main", _fallback_view_id: VIEW_EVENTS },

    _start: { _view_id: VIEW_EVENTS, _region: "main" },
  };

  // clear stale hashes from other apps
  if (typeof window !== "undefined") {
    const h = String(window.location.hash || "");
    const wanted = new Set([`#${VIEW_EVENTS}`, `#${VIEW_NANO}`]);
    if (h && !wanted.has(h)) window.location.hash = `#${VIEW_EVENTS}`;
  }

  _xd._o[LOG_KEY] = [`[${now()}] XUI Lab started`];

  await (XVM as any).app(app);

  // badges / active view
  setInterval(() => {
    const count = Object.keys((XUI as any)._o || {}).length;
    setText("badge-objects", `Objects: ${count}`);

    const active = String(window?.location?.hash || "").replace("#", "") || VIEW_EVENTS;
    setText("badge-active", `Active: ${active}`);

    // if you also keep fps in XData:
    if (_xd._o["fps"] != null) setText("badge-fps", `FPS: ${_xd._o["fps"]}`);
  }, 500);

  // keep inspector fresh
  setInterval(() => refreshInspect(), 600);

  _xlog.log("✅ XUI Lab loaded");
}

main().catch(console.error);
