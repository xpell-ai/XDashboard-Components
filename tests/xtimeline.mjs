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

  addEventListener() {}

  removeEventListener() {}
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

const { XUI, _xd } = await import("@xpell/ui");
const { XDashPack } = await import("../dist/index.js");

XUI.importObjectPack(XDashPack);

function createTimeline(data) {
  return XUI.create({
    _type: "xtimeline",
    ...data,
  });
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

assert.equal(XDashPack.getObjects().xtimeline?._xtype, "xtimeline");
assert.equal(XDashPack.getObjects().xtimeline?._skill?._id, "xtimeline");

if (typeof _xd?.set === "function") {
  _xd.set("activity.records", {
    records: [
      {
        id: "older",
        created_at: "2026-08-01T09:00:00Z",
        title: "Older record",
        type: "note",
        notes: "First",
        status: "open",
        icon: "O",
      },
      {
        id: "newer",
        created_at: "2026-08-03T10:00:00Z",
        title: "Newer record",
        type: "event",
        notes: "Latest",
        status: "done",
        action_label: "Open latest",
      },
      {
        id: "missing-date",
        title: "Missing date",
      },
    ],
  });
}

const bound = createTimeline({
  _id: "activity-timeline",
  _data_source: "activity.records",
  _date_field: "created_at",
  _order: "desc",
  _row_key: "id",
  _item: {
    _title: "$row.title",
    _subtitle: "$row.type",
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

assert.ok(String(bound.class).includes("xtimeline"));
assert.deepEqual(childIds(getObject("activity-timeline_timeline")), [
  "activity-timeline_item_newer",
  "activity-timeline_item_older",
  "activity-timeline_item_missing-date",
]);
assert.equal(getObject("activity-timeline_item_newer_title")._text, "Newer record");
assert.equal(getObject("activity-timeline_item_newer_subtitle")._text, "event");
assert.equal(getObject("activity-timeline_item_newer_description")._text, "Latest");
assert.equal(getObject("activity-timeline_item_newer_badge")._text, "done");
assert.equal(getObject("activity-timeline_item_newer_date")._text, "2026-08-03T10:00:00Z");
assert.equal(getObject("activity-timeline_item_newer_action_0")._text, "Open latest");
assert.equal(getObject("activity-timeline_item_newer_action_0")._row.id, "newer");
assert.equal(getObject("activity-timeline_item_older_icon")._text, "O");
assert.equal(getObject("activity-timeline_item_missing-date_date")._text, "Undated");
assert.equal(XUI.getObject("activity-timeline_item_missing-date_title")._text, "Missing date");
assert.ok(childIds(getObject("activity-timeline_item_newer")).includes("activity-timeline_item_newer_axis"));
assert.ok(childIds(getObject("activity-timeline_item_newer")).includes("activity-timeline_item_newer_card"));

const asc = createTimeline({
  _id: "xtimeline-asc",
  _items: [
    { key: "b", happened_at: "2026-03-02", title: "B" },
    { key: "a", happened_at: "2026-03-01", title: "A" },
  ],
  _date_field: "happened_at",
  _order: "asc",
  _row_key: "key",
});
assert.ok(asc);
assert.deepEqual(childIds(getObject("xtimeline-asc_timeline")), [
  "xtimeline-asc_item_a",
  "xtimeline-asc_item_b",
]);

const imageTimeline = createTimeline({
  _id: "xtimeline-image",
  _items: [{ id: "img", occurred: "2026-01-01", title: "Image row", image_url: "/assets/event.png" }],
  _date_field: "occurred",
  _row_key: "id",
  _item: {
    _title: "$row.title",
    _image: "$row.image_url",
    _image_alt: "$row.title",
  },
});
assert.ok(imageTimeline);
assert.equal(getObject("xtimeline-image_item_img_image")._type, "image");
assert.equal(getObject("xtimeline-image_item_img_image").src, "/assets/event.png");
assert.equal(getObject("xtimeline-image_item_img_image").alt, "Image row");

assert.doesNotThrow(() =>
  createTimeline({
    _id: "xtimeline-missing-fields",
    _items: [{ id: "missing", created_at: "2026-02-01" }],
    _date_field: "created_at",
    _row_key: "id",
    _item: {
      _title: "$row.missing.title",
      _subtitle: "$row.missing.subtitle",
      _description: "$row.missing.notes",
      _badge: "$row.missing.status",
    },
  })
);
assert.equal(XUI.getObject("xtimeline-missing-fields_item_missing_title"), undefined);
assert.equal(XUI.getObject("xtimeline-missing-fields_item_missing_badge"), undefined);

const empty = createTimeline({
  _id: "xtimeline-empty",
  _items: [],
  _empty_text: "No events",
});
assert.ok(empty);
assert.deepEqual(childIds(getObject("xtimeline-empty_timeline")), ["xtimeline-empty_empty"]);
assert.equal(getObject("xtimeline-empty_empty")._title, "No events");

let selectedRecord;
let selectedContext;
const selectable = createTimeline({
  _id: "xtimeline-select",
  _items: [
    { uid: "a", created_at: "2026-04-01", title: "Alpha" },
    { uid: "b", created_at: "2026-04-02", title: "Beta" },
  ],
  _date_field: "created_at",
  _row_key: "uid",
  _on_select: (_xobj, record, context) => {
    selectedRecord = record;
    selectedContext = context;
  },
});
const selectItem = getObject("xtimeline-select_item_b");
selectItem._on.click({ target: getObject("xtimeline-select_item_b_card").dom });
assert.equal(selectable._selected_key, "b");
assert.equal(selectedRecord.title, "Beta");
assert.equal(selectedContext.date_field, "created_at");
assert.ok(String(selectItem.class).includes("xtimeline__item--selected"));

const actionSafe = createTimeline({
  _id: "xtimeline-action-click",
  _items: [{ id: "a", created_at: "2026-05-01", title: "Action row" }],
  _date_field: "created_at",
  _row_key: "id",
  _item: {
    _title: "$row.title",
    _actions: [{ _type: "button", _text: "Action" }],
  },
});
const actionItem = getObject("xtimeline-action-click_item_a");
actionItem._on.click({ target: getObject("xtimeline-action-click_item_a_action_0").dom });
assert.equal(actionSafe._selected_key, undefined);

createTimeline({
  _id: "xtimeline-arbitrary",
  _items: [
    {
      ref: "r-1",
      event: { at: "2026-06-01T12:30:00Z", name: "Nested" },
      payload: { kind: "Media", text: "Nested notes" },
      state: { label: "ready" },
    },
  ],
  _date_field: "$row.event.at",
  _row_key: "ref",
  _item: {
    _title: "$row.event.name",
    _subtitle: "$row.payload.kind",
    _description: "$row.payload.text",
    _badge: { _text: "$row.state.label", _variant: "success" },
  },
});
assert.equal(getObject("xtimeline-arbitrary_item_r-1_title")._text, "Nested");
assert.equal(getObject("xtimeline-arbitrary_item_r-1_subtitle")._text, "Media");
assert.equal(getObject("xtimeline-arbitrary_item_r-1_description")._text, "Nested notes");
assert.equal(getObject("xtimeline-arbitrary_item_r-1_badge")._text, "ready");
assert.equal(getObject("xtimeline-arbitrary_item_r-1_date")._text, "2026-06-01T12:30:00Z");

console.log("xtimeline collection component passed");
