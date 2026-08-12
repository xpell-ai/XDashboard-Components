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

function createCalendar(data) {
  return XUI.create({
    _type: "xcalendar",
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

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(date = new Date()) {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${names[date.getMonth()]} ${date.getFullYear()}`;
}

assert.equal(XDashPack.getObjects().xcalendar?._xtype, "xcalendar");
assert.equal(XDashPack.getObjects().xcalendar?._skill?._id, "xcalendar");

if (typeof _xd?.set === "function") {
  _xd.set("event.records", {
    records: [
      {
        id: "kickoff",
        start_at: "2026-08-05T09:00:00Z",
        end_at: "2026-08-05T10:00:00Z",
        title: "Kickoff",
        location: "Room 1",
        notes: "Opening notes",
        status: "confirmed",
        icon: "K",
        action_label: "Open kickoff",
      },
      {
        id: "review",
        start_at: "2026-08-05",
        title: "Review",
        location: "Room 2",
      },
      {
        id: "span",
        start_at: "2026-08-10",
        end_at: "2026-08-12",
        title: "Multi-day",
        status: "open",
      },
      {
        id: "invalid",
        start_at: "not-a-date",
        title: "Invalid",
      },
      {
        id: "missing",
        title: "Missing date",
      },
    ],
  });
}

const bound = createCalendar({
  _id: "event-calendar",
  _data_source: "event.records",
  _date_field: "start_at",
  _end_date_field: "end_at",
  _month: "2026-08",
  _row_key: "id",
  _item: {
    _title: "$row.title",
    _subtitle: "$row.location",
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

assert.ok(String(bound.class).includes("xcalendar"));
assert.equal(bound._month, "2026-08");
assert.equal(bound._view, "month");
assert.equal(getObject("event-calendar_title")._text, "August 2026");
assert.equal(childIds(getObject("event-calendar_weekdays")).length, 7);
assert.equal(childIds(getObject("event-calendar_days")).length, 42);
assert.deepEqual(childIds(getObject("event-calendar_day_2026-08-05_events")), [
  "event-calendar_item_kickoff_2026-08-05",
  "event-calendar_item_review_2026-08-05",
]);
assert.equal(getObject("event-calendar_item_kickoff_2026-08-05_title")._text, "Kickoff");
assert.equal(getObject("event-calendar_item_kickoff_2026-08-05_subtitle")._text, "Room 1");
assert.equal(getObject("event-calendar_item_kickoff_2026-08-05_description")._text, "Opening notes");
assert.equal(getObject("event-calendar_item_kickoff_2026-08-05_badge")._text, "confirmed");
assert.equal(getObject("event-calendar_item_kickoff_2026-08-05_icon")._text, "K");
assert.equal(getObject("event-calendar_item_kickoff_2026-08-05_action_0")._text, "Open kickoff");
assert.equal(getObject("event-calendar_item_kickoff_2026-08-05_action_0")._row.id, "kickoff");
assert.equal(getObject("event-calendar_item_kickoff_2026-08-05")._end_date, "2026-08-05T10:00:00Z");
assert.ok(childIds(getObject("event-calendar_day_2026-08-10_events")).includes("event-calendar_item_span_2026-08-10"));
assert.ok(childIds(getObject("event-calendar_day_2026-08-11_events")).includes("event-calendar_item_span_2026-08-11"));
assert.ok(childIds(getObject("event-calendar_day_2026-08-12_events")).includes("event-calendar_item_span_2026-08-12"));
assert.equal(XUI.getObject("event-calendar_item_invalid_2026-08-05"), undefined);
assert.equal(XUI.getObject("event-calendar_item_missing_2026-08-05"), undefined);
assert.deepEqual(childIds(getObject("event-calendar_empty_wrap")), []);

getObject("event-calendar_next")._on.click({});
assert.equal(bound._month, "2026-09");
assert.equal(getObject("event-calendar_title")._text, "September 2026");
getObject("event-calendar_prev")._on.click({});
assert.equal(bound._month, "2026-08");
assert.equal(getObject("event-calendar_title")._text, "August 2026");
getObject("event-calendar_today")._on.click({});
assert.equal(bound._month, monthKey());
assert.equal(getObject("event-calendar_title")._text, monthTitle());

assert.doesNotThrow(() =>
  createCalendar({
    _id: "xcalendar-missing-fields",
    _items: [{ id: "sparse", start_at: "2026-08-07", title: "Sparse" }],
    _date_field: "start_at",
    _month: "2026-08",
    _row_key: "id",
    _item: {
      _title: "$row.title",
      _subtitle: "$row.missing.subtitle",
      _description: "$row.missing.notes",
      _badge: "$row.missing.status",
    },
  })
);
assert.equal(getObject("xcalendar-missing-fields_item_sparse_2026-08-07_title")._text, "Sparse");
assert.equal(XUI.getObject("xcalendar-missing-fields_item_sparse_2026-08-07_subtitle"), undefined);
assert.equal(XUI.getObject("xcalendar-missing-fields_item_sparse_2026-08-07_badge"), undefined);

const empty = createCalendar({
  _id: "xcalendar-empty",
  _items: [],
  _month: "2026-08",
  _empty_text: "No events",
});
assert.ok(empty);
assert.deepEqual(childIds(getObject("xcalendar-empty_empty_wrap")), ["xcalendar-empty_empty"]);
assert.equal(getObject("xcalendar-empty_empty")._title, "No events");

const invalidOnly = createCalendar({
  _id: "xcalendar-invalid-only",
  _items: [{ id: "bad", start_at: "never", title: "Bad" }],
  _date_field: "start_at",
  _month: "2026-08",
});
assert.ok(invalidOnly);
assert.deepEqual(childIds(getObject("xcalendar-invalid-only_empty_wrap")), ["xcalendar-invalid-only_empty"]);
assert.equal(XUI.getObject("xcalendar-invalid-only_item_bad_2026-08-01"), undefined);

let selectedRecord;
let selectedContext;
const selectable = createCalendar({
  _id: "xcalendar-select",
  _items: [{ uid: "beta", start_at: "2026-08-09", title: "Beta" }],
  _date_field: "start_at",
  _month: "2026-08",
  _row_key: "uid",
  _on_select: (_xobj, record, context) => {
    selectedRecord = record;
    selectedContext = context;
  },
});
const selectItem = getObject("xcalendar-select_item_beta_2026-08-09");
selectItem._on.click({ target: getObject("xcalendar-select_item_beta_2026-08-09_title").dom });
assert.equal(selectable._selected_key, "beta");
assert.equal(selectedRecord.title, "Beta");
assert.equal(selectedContext.date_field, "start_at");
assert.equal(selectedContext.day, "2026-08-09");
assert.ok(String(selectItem.class).includes("xcalendar__event--selected"));

const actionSafe = createCalendar({
  _id: "xcalendar-action-click",
  _items: [{ id: "a", start_at: "2026-08-13", title: "Action row" }],
  _date_field: "start_at",
  _month: "2026-08",
  _row_key: "id",
  _item: {
    _title: "$row.title",
    _actions: [{ _type: "button", _text: "Action" }],
  },
});
const actionItem = getObject("xcalendar-action-click_item_a_2026-08-13");
actionItem._on.click({ target: getObject("xcalendar-action-click_item_a_2026-08-13_action_0").dom });
assert.equal(actionSafe._selected_key, undefined);

createCalendar({
  _id: "xcalendar-arbitrary",
  _items: [
    {
      ref: "r-1",
      schedule: { start: "2026-08-20", finish: "2026-08-21" },
      payload: { name: "Nested", place: "Studio", text: "Nested notes" },
      state: { label: "ready" },
    },
  ],
  _date_field: "$row.schedule.start",
  _end_date_field: "$row.schedule.finish",
  _month: "2026-08",
  _row_key: "ref",
  _item: {
    _title: "$row.payload.name",
    _subtitle: "$row.payload.place",
    _description: "$row.payload.text",
    _badge: { _text: "$row.state.label", _variant: "success" },
  },
});
assert.equal(getObject("xcalendar-arbitrary_item_r-1_2026-08-20_title")._text, "Nested");
assert.equal(getObject("xcalendar-arbitrary_item_r-1_2026-08-20_subtitle")._text, "Studio");
assert.equal(getObject("xcalendar-arbitrary_item_r-1_2026-08-20_description")._text, "Nested notes");
assert.equal(getObject("xcalendar-arbitrary_item_r-1_2026-08-20_badge")._text, "ready");
assert.ok(childIds(getObject("xcalendar-arbitrary_day_2026-08-21_events")).includes("xcalendar-arbitrary_item_r-1_2026-08-21"));

console.log("xcalendar collection component passed");
