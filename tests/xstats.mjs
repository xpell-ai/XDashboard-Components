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
const {
  XDashPack,
  XDashboardObjectSkills,
  getXDashboardObjectSkillsByCategory,
} = await import("../dist/index.js");

XUI.importObjectPack(XDashPack);

function createStats(data) {
  return XUI.create({
    _type: "xstats",
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

assert.equal(XDashPack.getObjects().xstats?._xtype, "xstats");
assert.equal(XDashPack.getObjects().xstats?._skill?._id, "xstats");
assert.equal(XDashboardObjectSkills.xstats?._category, "data-summary");
assert.equal(getXDashboardObjectSkillsByCategory("data-summary").xstats?._id, "xstats");

if (typeof _xd?.set === "function") {
  _xd.set("stat.records", {
    records: [
      { id: "a", amount: 10, status: "open", kind: "alpha" },
      { id: "b", amount: 20, status: "open", kind: "beta" },
      { id: "c", amount: 30, status: "closed", kind: "alpha" },
      { id: "d", amount: 40, status: "closed", kind: "beta" },
    ],
  });
}

const stats = createStats({
  _id: "record-stats",
  _data_source: "stat.records",
  _min_col_width: 160,
  _gap: 10,
  _items: [
    { _id: "total", _title: "Total", _aggregate: "count", _icon: "#", _badge: "All" },
    { _id: "sum", _title: "Sum", _aggregate: "sum", _field: "amount" },
    { _id: "avg", _title: "Average", _aggregate: "average", _field: "amount" },
    { _id: "min", _title: "Min", _aggregate: "min", _field: "amount" },
    { _id: "max", _title: "Max", _aggregate: "max", _field: "amount" },
    {
      _id: "open",
      _title: "Open",
      _aggregate: "count",
      _filter: { _field: "status", _operator: "eq", _value: "open" },
      _subtitle: "Filtered",
      _trend: "$value",
      _meta: "status=open",
    },
    {
      _id: "gte",
      _title: "At Least 30",
      _aggregate: "count",
      _filter: { _field: "amount", _operator: "gte", _value: 30 },
    },
  ],
});

assert.ok(String(stats.class).includes("xstats"));
assert.ok(String(stats.style).includes("--xstats-min-col:160px"));
assert.deepEqual(childIds(getObject("record-stats_grid")), [
  "record-stats_item_total",
  "record-stats_item_sum",
  "record-stats_item_avg",
  "record-stats_item_min",
  "record-stats_item_max",
  "record-stats_item_open",
  "record-stats_item_gte",
]);
assert.equal(getObject("record-stats_item_total_title")._text, "Total");
assert.equal(getObject("record-stats_item_total_value")._text, "4");
assert.equal(getObject("record-stats_item_total_icon")._text, "#");
assert.equal(getObject("record-stats_item_total_badge")._text, "All");
assert.equal(getObject("record-stats_item_sum_value")._text, "100");
assert.equal(getObject("record-stats_item_avg_value")._text, "25");
assert.equal(getObject("record-stats_item_min_value")._text, "10");
assert.equal(getObject("record-stats_item_max_value")._text, "40");
assert.equal(getObject("record-stats_item_open_value")._text, "2");
assert.equal(getObject("record-stats_item_open_subtitle")._text, "Filtered");
assert.equal(getObject("record-stats_item_open_trend")._text, "2");
assert.equal(getObject("record-stats_item_open_meta")._text, "status=open");
assert.equal(getObject("record-stats_item_gte_value")._text, "2");

await stats.onData({
  records: [
    { amount: 5, status: "open" },
    { amount: 15, status: "closed" },
  ],
});
assert.equal(getObject("record-stats_item_total_value")._text, "2");
assert.equal(getObject("record-stats_item_sum_value")._text, "20");
assert.equal(getObject("record-stats_item_avg_value")._text, "10");
assert.equal(getObject("record-stats_item_min_value")._text, "5");
assert.equal(getObject("record-stats_item_max_value")._text, "15");
assert.equal(getObject("record-stats_item_open_value")._text, "1");

const emptyData = createStats({
  _id: "xstats-empty-data",
  _records: [],
  _items: [
    { _id: "total", _title: "Total", _aggregate: "count" },
    { _id: "sum", _title: "Sum", _aggregate: "sum", _field: "amount" },
  ],
});
assert.equal(getObject("xstats-empty-data_item_total_value")._text, "0");
assert.equal(getObject("xstats-empty-data_item_sum_value")._text, "0");

const emptyMetrics = createStats({
  _id: "xstats-empty-metrics",
  _records: [{ id: "a" }],
  _items: [],
  _empty_text: "No stat items",
});
assert.deepEqual(childIds(getObject("xstats-empty-metrics_grid")), ["xstats-empty-metrics_empty"]);
assert.equal(getObject("xstats-empty-metrics_empty")._title, "No stat items");

createStats({
  _id: "xstats-arbitrary",
  _records: [
    { ref: "r1", metrics: { score: 8 }, state: { kind: "ready" } },
    { ref: "r2", metrics: { score: 12 }, state: { kind: "skip" } },
    { ref: "r3", metrics: { score: 20 }, state: { kind: "ready" } },
  ],
  _items: [
    {
      _id: "nested-sum",
      _title: "Nested Sum",
      _aggregate: "sum",
      _field: "$row.metrics.score",
      _filter: { _field: "$row.state.kind", _operator: "eq", _value: "ready" },
    },
    {
      _id: "contains",
      _title: "Contains",
      _aggregate: "count",
      _filter: { _field: "$row.state.kind", _operator: "contains", _value: "ea" },
    },
  ],
});
assert.equal(getObject("xstats-arbitrary_item_nested-sum_value")._text, "28");
assert.equal(getObject("xstats-arbitrary_item_contains_value")._text, "2");

console.log("xstats data-summary component passed");
