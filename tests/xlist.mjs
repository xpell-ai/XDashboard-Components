import assert from "node:assert/strict";

function createStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.has(String(key)) ? values.get(String(key)) : null;
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key) {
      values.delete(String(key));
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
  };
}

class FakeStyleDeclaration {
  #props = new Map();

  set cssText(value) {
    this.#props.clear();
    for (const part of String(value ?? "").split(";")) {
      const idx = part.indexOf(":");
      if (idx < 0) continue;
      const name = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (name && val) this.setProperty(name, val);
    }
  }

  get cssText() {
    return Array.from(this.#props.entries())
      .map(([name, value]) => `${name}: ${value};`)
      .join(" ");
  }

  setProperty(name, value) {
    this.#props.set(String(name), String(value));
  }

  getPropertyValue(name) {
    return this.#props.get(String(name)) ?? "";
  }
}

class FakeClassList {
  constructor(el) {
    this.el = el;
  }

  add(...tokens) {
    tokens.filter(Boolean).forEach((token) => this.el._classTokens.add(String(token)));
  }

  remove(...tokens) {
    tokens.forEach((token) => this.el._classTokens.delete(String(token)));
  }

  contains(token) {
    return this.el._classTokens.has(String(token));
  }

  toggle(token, force) {
    const next = force === undefined ? !this.contains(token) : Boolean(force);
    if (next) this.add(token);
    else this.remove(token);
    return next;
  }
}

class FakeTextNode {
  constructor(text) {
    this.nodeType = 3;
    this.textContent = String(text ?? "");
    this.parentElement = null;
  }
}

class FakeElement {
  constructor(tagName) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.attributes = new Map();
    this.childNodes = [];
    this.parentElement = null;
    this.id = "";
    this._listeners = new Map();
    this.style = new FakeStyleDeclaration();
    this._classTokens = new Set();
    this.classList = new FakeClassList(this);
  }

  get className() {
    return Array.from(this._classTokens).join(" ");
  }

  set className(value) {
    this._classTokens = new Set(String(value ?? "").split(/\s+/g).filter(Boolean));
  }

  get textContent() {
    return this.childNodes.map((child) => child.textContent ?? "").join("");
  }

  set textContent(value) {
    this.childNodes = [new FakeTextNode(value)];
  }

  setAttribute(name, value) {
    const attr = String(name);
    if (attr === "class") {
      this.className = value;
      return;
    }
    if (attr === "style") {
      this.attributes.set(attr, String(value));
      this.style.cssText = value;
      return;
    }
    if (attr === "id") {
      this.id = String(value);
    }
    this.attributes.set(attr, String(value));
  }

  getAttribute(name) {
    const attr = String(name);
    if (attr === "class") return this.className || null;
    if (attr === "style") return this.style.cssText || null;
    return this.attributes.get(attr) ?? null;
  }

  hasAttribute(name) {
    const attr = String(name);
    if (attr === "class") return this.className.length > 0;
    if (attr === "style") return this.style.cssText.length > 0;
    return this.attributes.has(attr);
  }

  removeAttribute(name) {
    const attr = String(name);
    if (attr === "class") {
      this.className = "";
      return;
    }
    if (attr === "id") {
      this.id = "";
    }
    this.attributes.delete(attr);
  }

  appendChild(child) {
    child.parentElement = this;
    this.childNodes.push(child);
    return child;
  }

  append(child) {
    return this.appendChild(child);
  }

  insertBefore(child, before) {
    child.parentElement = this;
    const idx = this.childNodes.indexOf(before);
    if (idx < 0) {
      this.childNodes.push(child);
    } else {
      this.childNodes.splice(idx, 0, child);
    }
    return child;
  }

  removeChild(child) {
    const idx = this.childNodes.indexOf(child);
    if (idx >= 0) this.childNodes.splice(idx, 1);
    child.parentElement = null;
    return child;
  }

  replaceChildren(...children) {
    this.childNodes = [];
    children.forEach((child) => this.appendChild(child));
  }

  closest(selector) {
    const classNames = String(selector)
      .split(",")
      .map((part) => part.trim().replace(/^\./, ""))
      .filter(Boolean);
    let current = this;
    while (current) {
      if (classNames.some((className) => current.classList?.contains(className))) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  addEventListener(type, listener) {
    const name = String(type);
    const listeners = this._listeners.get(name) ?? [];
    listeners.push(listener);
    this._listeners.set(name, listeners);
  }

  removeEventListener(type, listener) {
    const name = String(type);
    const listeners = this._listeners.get(name);
    if (!listeners) return;
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
    if (listeners.length === 0) this._listeners.delete(name);
  }

  async dispatchEvent(event) {
    const target = {
      id: this.id,
      getAttribute: (name) => this.getAttribute(name),
    };
    const nextEvent = {
      target,
      currentTarget: target,
      preventDefault() {},
      stopPropagation() {},
      ...event,
      type: event?.type,
    };
    const listeners = this._listeners.get(String(nextEvent.type)) ?? [];
    for (const listener of listeners.slice()) {
      await listener(nextEvent);
    }
    return true;
  }

  async click() {
    return this.dispatchEvent({ type: "click" });
  }
}

const localStorage = createStorage();
const sessionStorage = createStorage();

globalThis.window = { localStorage, sessionStorage };
globalThis.document = {
  createElement: (tagName) => new FakeElement(tagName),
  createElementNS: (_ns, tagName) => new FakeElement(tagName),
  createTextNode: (text) => new FakeTextNode(text),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: new FakeElement("body"),
};
globalThis.localStorage = localStorage;
globalThis.sessionStorage = sessionStorage;
globalThis.HTMLElement = FakeElement;
globalThis.HTMLSelectElement = FakeElement;
globalThis.Node = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,
};

const { XUI, _x, _xd } = await import("@xpell/ui");
const { XDashPack } = await import("../dist/index.js");

XUI.importObjectPack(XDashPack);

function createList(data) {
  return XUI.create({
    _type: "xlist",
    ...data,
  });
}

function flushMounts() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function getObject(id) {
  const object = XUI.getObject(id);
  assert.ok(object, `Expected XUI object ${id} to exist`);
  return object;
}

function childIds(object) {
  return Array.isArray(object._children)
    ? object._children.map((child) => child?._id)
    : [];
}

function styleOf(id) {
  return getObject(id)._style ?? {};
}

assert.equal(XDashPack.getObjects().xlist?._xtype, "xlist");

if (typeof _xd?.set === "function") {
  _xd.set("pot.records", {
    records: [
      {
        id: "fern",
        name: "Fern",
        last_watered_at: "2026-08-01",
        notes: "Filtered light",
        icon: "F",
        status: "ok",
        action_label: "Open Fern",
      },
      {
        id: "mint",
        name: "Mint",
        last_watered_at: "2026-08-02",
        notes: "Trim weekly",
        icon: "M",
        status: "watch",
        action_label: "Open Mint",
      },
    ],
  });
}

const bound = createList({
  _id: "pot-rich-list",
  _data_source: "pot.records",
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _subtitle: "$row.last_watered_at",
    _description: "$row.notes",
    _icon: "$row.icon",
    _badge: "$row.status",
    _actions: [
      {
        _type: "button",
        _text: "$row.action_label",
      },
    ],
  },
});

assert.ok(String(bound.class).includes("xlist"));
assert.deepEqual(childIds(getObject("pot-rich-list_list")), [
  "pot-rich-list_item_fern",
  "pot-rich-list_item_mint",
]);
assert.equal(getObject("pot-rich-list_item_fern_title")._text, "Fern");
assert.equal(getObject("pot-rich-list_item_fern_subtitle")._text, "2026-08-01");
assert.equal(getObject("pot-rich-list_item_fern_description")._text, "Filtered light");
assert.equal(getObject("pot-rich-list_item_fern_icon_0")._text, "F");
assert.equal(getObject("pot-rich-list_item_fern_badge")._text, "ok");
assert.equal(getObject("pot-rich-list_item_fern_action_0")._text, "Open Fern");
assert.equal(getObject("pot-rich-list_item_fern_action_0")._row.name, "Fern");
assert.equal(getObject("pot-rich-list_item_fern_action_0")._context.row_index, 0);
assert.equal(getObject("pot-rich-list_item_mint_action_0")._text, "Open Mint");
assert.notEqual(
  getObject("pot-rich-list_item_fern_action_0")._id,
  getObject("pot-rich-list_item_mint_action_0")._id,
);

const flowActionCommands = [];
const originalExecute = _x.execute;
const flowActionRecords = [
  { _id: "record-a", name: "Record A" },
  { _id: "record-b", name: "Record B" },
];
try {
  _xd.set("xlist-flow-actions.records", { records: flowActionRecords });
  _x.execute = async (cmd) => {
    flowActionCommands.push(cmd);
    const deletedId = cmd?._params?._event_payload?._id;
    _xd.set("xlist-flow-actions.records", {
      records: flowActionRecords.filter((record) => record._id !== deletedId),
    });
    return { _ok: true };
  };
  const flowList = createList({
    _id: "xlist-flow-actions",
    _data_source: "xlist-flow-actions.records",
    _row_key: "_id",
    _item: {
      _title: "$row.name",
      _actions: [
        {
          _type: "button",
          _text: "Delete",
          _on: {
            click: {
              _module: "flow-client",
              _op: "trigger",
              _params: {
                _flow_id: "delete_record",
                _event_name: "click",
                _event_payload: {
                  _id: "$row._id",
                },
                _object_id: "$event.currentTarget.id",
                _source: "ui",
              },
            },
          },
        },
      ],
    },
  });
  await flowList.onMount();
  await flushMounts();
  const rowADelete = getObject("xlist-flow-actions_item_record-a_action_0");
  const rowBDelete = getObject("xlist-flow-actions_item_record-b_action_0");
  const rowB = getObject("xlist-flow-actions_item_record-b");
  await flushMounts();

  assert.notEqual(rowADelete._id, rowBDelete._id);
  assert.equal(rowADelete._on.click._params._event_payload._id, "record-a");
  assert.equal(rowBDelete._on.click._params._event_payload._id, "record-b");
  assert.equal(XUI.getObject(rowADelete._id), rowADelete);
  assert.equal(XUI.getObject(rowBDelete._id), rowBDelete);
  assert.equal(rowB._mounted, true);
  assert.equal(rowBDelete._mounted, true);
  assert.equal(rowBDelete.dom.id, rowBDelete._id);
  assert.equal(rowBDelete.dom._listeners.get("click")?.length, 1);

  await rowBDelete.dom.click();
  assert.equal(flowActionCommands.length, 1);
  assert.equal(flowActionCommands[0]._module, "flow-client");
  assert.equal(flowActionCommands[0]._op, "trigger");
  assert.equal(flowActionCommands[0]._params._event_payload._id, "record-b");
  assert.equal(flowActionCommands[0]._params._object_id, rowBDelete._id);
  await flushMounts();
  assert.deepEqual(childIds(getObject("xlist-flow-actions_list")), [
    "xlist-flow-actions_item_record-a",
  ]);
  assert.equal(getObject("xlist-flow-actions_item_record-a_title")._text, "Record A");
} finally {
  _x.execute = originalExecute;
}

assert.doesNotThrow(() =>
  createList({
    _id: "xlist-missing-fields",
    _items: [{ id: "missing" }],
    _row_key: "id",
    _item: {
      _title: "$row.missing.title",
      _subtitle: "$row.missing.subtitle",
      _description: "$row.missing.description",
      _meta: "$row.missing.meta",
      _badge: "$row.missing.status",
      _icon: "$row.missing.icon",
    },
  })
);
assert.equal(XUI.getObject("xlist-missing-fields_item_missing_title"), undefined);
assert.equal(XUI.getObject("xlist-missing-fields_item_missing_badge"), undefined);

createList({
  _id: "xlist-image",
  _items: [{ id: "img", name: "Image row", picture: "/assets/row.png" }],
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _image: "$row.picture",
    _image_alt: "$row.name",
  },
});
assert.equal(getObject("xlist-image_item_img_image")._type, "image");
assert.equal(getObject("xlist-image_item_img_image").src, "/assets/row.png");
assert.equal(getObject("xlist-image_item_img_image").alt, "Image row");

createList({
  _id: "xlist-slots",
  _items: [{ id: "slot", name: "Slot row", score: 7 }],
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _leading: { _type: "badge", _text: "$row.score" },
    _trailing: { _type: "label", _text: "$row_index" },
  },
});
assert.equal(getObject("xlist-slots_item_slot_leading_0")._text, "7");
assert.equal(getObject("xlist-slots_item_slot_trailing_0")._text, 0);

const empty = createList({
  _id: "xlist-empty",
  _items: [],
  _empty_text: "Nothing here",
});
assert.ok(empty);
assert.deepEqual(childIds(getObject("xlist-empty_list")), ["xlist-empty_empty"]);
assert.equal(getObject("xlist-empty_empty")._title, "Nothing here");

let selectedRecord;
let selectedContext;
const selectable = createList({
  _id: "xlist-select",
  _items: [
    { uid: "a", title: "Alpha" },
    { uid: "b", title: "Beta" },
  ],
  _row_key: "uid",
  _on_select: (_xobj, record, context) => {
    selectedRecord = record;
    selectedContext = context;
  },
});

const selectItem = getObject("xlist-select_item_b");
assert.equal(typeof selectItem._on?.click, "function");
selectItem._on.click({ target: getObject("xlist-select_item_b_content").dom });
assert.equal(selectable._selected_key, "b");
assert.equal(selectedRecord.title, "Beta");
assert.equal(selectedContext.key, "b");
assert.ok(String(selectItem.class).includes("xlist__item--selected"));

const trailingSafe = createList({
  _id: "xlist-action-click",
  _items: [{ id: "a", name: "Action row" }],
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _actions: [{ _type: "button", _text: "Action" }],
  },
});
const actionItem = getObject("xlist-action-click_item_a");
actionItem._on.click({ target: getObject("xlist-action-click_item_a_action_0").dom });
assert.equal(trailingSafe._selected_key, undefined);

createList({
  _id: "xlist-arbitrary",
  _items: [
    {
      ref: "r-1",
      profile: { display: "Nested Name", channel: "Ops" },
      metrics: { score: 42 },
      state: { label: "ready" },
    },
  ],
  _row_key: "ref",
  _item: {
    _title: "$row.profile.display",
    _subtitle: "$row.profile.channel",
    _meta: "$row.metrics.score",
    _badge: { _text: "$row.state.label", _variant: "success" },
  },
});
assert.equal(getObject("xlist-arbitrary_item_r-1_title")._text, "Nested Name");
assert.equal(getObject("xlist-arbitrary_item_r-1_subtitle")._text, "Ops");
assert.equal(getObject("xlist-arbitrary_item_r-1_meta")._text, "42");
assert.equal(getObject("xlist-arbitrary_item_r-1_badge")._text, "ready");

const styled = createList({
  _id: "xlist-styled",
  _items: [
    {
      id: "styled",
      name: "Styled row",
      avatar: "/avatar.png",
      status: "ready",
      action_label: "Open",
    },
  ],
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _avatar: "$row.avatar",
    _badge: "$row.status",
    _leading: "L",
    _trailing: "T",
    _actions: [{ _type: "button", _text: "$row.action_label" }],
    _styles: {
      _item: { _style: { padding: "18px", "border-radius": "12px" } },
      _content: { _style: { gap: "10px" } },
      _title: { _style: { "font-size": "22px", "font-weight": "600" } },
      _avatar: { _style: { width: "48px", height: "48px" } },
      _badge: { _style: { color: "var(--x-primary)", padding: "2px 6px" } },
      _leading: { _style: { color: "red", padding: "4px" } },
      _trailing: { _style: { margin: "0" } },
      _actions: { _style: { "justify-content": "flex-start" } },
    },
  },
});
assert.ok(styled);
assert.equal(styleOf("xlist-styled_item_styled").padding, "18px");
assert.equal(styleOf("xlist-styled_item_styled")["border-radius"], "12px");
assert.equal(styleOf("xlist-styled_item_styled_content").gap, "10px");
assert.equal(styleOf("xlist-styled_item_styled_title")["font-size"], "22px");
assert.equal(styleOf("xlist-styled_item_styled_title")["font-weight"], "600");
assert.equal(styleOf("xlist-styled_item_styled_avatar").width, "48px");
assert.equal(styleOf("xlist-styled_item_styled_avatar").height, "48px");
assert.equal(styleOf("xlist-styled_item_styled_badge").color, "var(--x-primary)");
assert.equal(styleOf("xlist-styled_item_styled_badge").padding, "2px 6px");
assert.equal(styleOf("xlist-styled_item_styled_leading_0").color, "red");
assert.equal(styleOf("xlist-styled_item_styled_leading_0").padding, "4px");
assert.equal(styleOf("xlist-styled_item_styled_trailing_0").margin, "0");
assert.equal(styleOf("xlist-styled_item_styled_actions")["justify-content"], "flex-start");

createList({
  _id: "xlist-icon-style",
  _items: [{ id: "icon", name: "Icon row", icon: "I" }],
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _icon: "$row.icon",
    _styles: {
      _icon: { _style: { color: "blue", width: "36px" } },
    },
  },
});
assert.equal(styleOf("xlist-icon-style_item_icon_icon_0").color, "blue");
assert.equal(styleOf("xlist-icon-style_item_icon_icon_0").width, "36px");

createList({
  _id: "xlist-image-style",
  _items: [{ id: "img", name: "Image row", image: "/row.png" }],
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _image: "$row.image",
    _styles: {
      _image: { _style: { "border-radius": "10px" } },
    },
  },
});
assert.equal(styleOf("xlist-image-style_item_img_image")["border-radius"], "10px");

createList({
  _id: "xlist-structured-merge",
  _items: [{ id: "merge", name: "Merge row", status: "ready" }],
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _badge: {
      _text: "$row.status",
      _variant: "success",
      _style: {
        color: "green",
      },
    },
    _leading: {
      _type: "label",
      _text: "Lead",
      _style: {
        color: "blue",
      },
    },
    _styles: {
      _badge: {
        _style: {
          color: "red",
          "font-size": "12px",
        },
      },
      _leading: {
        _style: {
          color: "red",
          padding: "6px",
        },
      },
    },
  },
});
assert.equal(styleOf("xlist-structured-merge_item_merge_badge").color, "green");
assert.equal(styleOf("xlist-structured-merge_item_merge_badge")["font-size"], "12px");
assert.equal(styleOf("xlist-structured-merge_item_merge_leading_0").color, "blue");
assert.equal(styleOf("xlist-structured-merge_item_merge_leading_0").padding, "6px");

function localDateTime(offsetDays, hour, minute = 0) {
  const value = new Date();
  value.setDate(value.getDate() + offsetDays);
  value.setHours(hour, minute, 0, 0);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

createList({
  _id: "xlist-formatted-values",
  _items: [
    {
      id: "run",
      occurred_at: localDateTime(0, 7, 30),
      distance_kilometers: 3.456,
    },
  ],
  _row_key: "id",
  _item: {
    _title: {
      _field: "occurred_at",
      _format: "relative-datetime",
    },
    _trailing: {
      _field: "distance_kilometers",
      _format: "number",
      _suffix: " km",
    },
  },
});
assert.match(getObject("xlist-formatted-values_item_run_title")._text, /^Today, \d{2}:\d{2}$/);
assert.equal(getObject("xlist-formatted-values_item_run_trailing_0")._text, "3.46 km");

// Equivalent instants must render identically, regardless of input representation.
// Run this suite under UTC and both positive/negative-offset host timezones.
const timestampCases = [
  "2026-11-13T00:30:00Z",
  "2026-11-13T02:30:00+02:00",
  "2026-11-12T19:30:00-05:00",
  "2026-11-13T23:30:00.123Z",
];
let timestampCase = 0;
function formattedTimestamp(value, format) {
  const id = "xlist-timestamp-" + timestampCase++;
  createList({
    _id: id,
    _items: [{ id: "row", occurred_at: value }],
    _row_key: "id",
    _item: { _title: { _field: "occurred_at", _format: format } },
  });
  return getObject(id + "_item_row_title")._text;
}
for (const timestamp of timestampCases) {
  const instant = new Date(timestamp);
  for (const format of ["time", "date", "datetime", "relative-datetime"]) {
    const expected = formattedTimestamp(instant, format);
    assert.equal(formattedTimestamp(timestamp, format), expected, timestamp + " / " + format);
    assert.equal(formattedTimestamp(instant.getTime(), format), expected);
    if (format === "time") {
      assert.equal(expected, instant.toLocaleTimeString(undefined, {
        hour: "2-digit", minute: "2-digit", hour12: false,
      }));
    }
  }
}
for (const [timestamp, localDate] of [
  ["2026-11-13", new Date(2026, 10, 13)],
  ["2026-11-13T07:30:00", new Date(2026, 10, 13, 7, 30)],
]) {
  for (const format of ["time", "date", "datetime"]) {
    assert.equal(formattedTimestamp(timestamp, format), formattedTimestamp(localDate, format));
  }
}

const mappingTemplate = {
  _title: "$row.name",
  _styles: {
    _title: {
      _style: {
        "font-size": "22px",
        "font-weight": "600",
      },
    },
    _subtitle: {
      _style: {
        color: "gray",
      },
    },
  },
};
mappingTemplate._title = "$row.label";
assert.equal(mappingTemplate._title, "$row.label");
assert.equal(mappingTemplate._styles._title._style["font-size"], "22px");
mappingTemplate._styles._title._style["font-size"] = "24px";
assert.equal(mappingTemplate._styles._title._style["font-weight"], "600");
assert.equal(mappingTemplate._styles._subtitle._style.color, "gray");

const removable = createList({
  _id: "xlist-remove-style",
  _items: [{ id: "remove", name: "Remove style" }],
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _styles: {
      _title: {
        _style: {
          "font-size": "24px",
        },
      },
    },
  },
});
assert.equal(styleOf("xlist-remove-style_item_remove_title")["font-size"], "24px");
removable._item = {
  _title: "$row.name",
};
assert.equal(getObject("xlist-remove-style_item_remove_title")._style, undefined);
assert.equal(getObject("pot-rich-list_item_fern_title")._style, undefined);

console.log("xlist collection component passed");
