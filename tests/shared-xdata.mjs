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

const record1 = {
  _id: "ded27ca2-4111-470b-9c2f-0cba4f1de733",
  name: "my pot",
  "last-watered-at": "1990-12-10T00:00:00.000Z",
  notes: "the best pot ever",
  date: "2000-10-10T00:00:00.000Z",
  amount: 1,
  priority: "1",
};

const record2 = {
  _id: "99e3a8d2-754a-49a7-b98b-0b478b4bc006",
  name: "second pot",
  "last-watered-at": "1991-01-10T00:00:00.000Z",
  notes: "another pot",
  date: "2001-01-10T00:00:00.000Z",
  amount: 2,
  priority: "2",
};

let scenarioIndex = 0;

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function objectText(object) {
  return object?.dom?.textContent ?? "";
}

function tableConfig(id, key) {
  return {
    _id: id,
    _type: "table",
    _data_source: key,
    _rows: key,
    _row_key: "_id",
    _empty_text: "No pots yet.",
    _columns: [
      { _key: "name", _label: "Name" },
      { _key: "last-watered-at", _label: "Last Watered At" },
      { _key: "notes", _label: "Notes" },
      { _key: "priority", _label: "Priority" },
    ],
  };
}

function statsConfig(id, key) {
  return {
    _id: id,
    _type: "xstats",
    _data_source: key,
    _records: key,
    _items: [{ _id: "total-pots", _title: "Total Pots", _aggregate: "count" }],
  };
}

function galleryConfig(id, key) {
  return {
    _id: id,
    _type: "xgallery",
    _data_source: key,
    _items: key,
    _row_key: "_id",
    _item: {
      _title: "$row.name",
      _subtitle: "$row.last-watered-at",
      _description: "$row.notes",
      _badge: "$row.priority",
    },
    _empty_text: "No pots yet.",
  };
}

function listConfig(id, key) {
  return {
    _id: id,
    _type: "xlist",
    _data_source: key,
    _items: key,
    _row_key: "_id",
    _item: {
      _title: "$row.name",
      _subtitle: "$row.last-watered-at",
      _description: "$row.notes",
      _badge: "$row.priority",
    },
    _empty_text: "No pots yet.",
  };
}

function createComponent(kind, id, key) {
  if (kind === "table") return XUI.create(tableConfig(id, key));
  if (kind === "xstats") return XUI.create(statsConfig(id, key));
  if (kind === "xgallery") return XUI.create(galleryConfig(id, key));
  if (kind === "xlist") return XUI.create(listConfig(id, key));
  throw new Error(`Unsupported component kind ${kind}`);
}

function assertEmpty(object, kind) {
  const text = objectText(object);
  if (kind === "xstats") {
    assert.match(text, /Total Pots0/);
    return;
  }
  assert.match(text, /No pots yet\./);
}

function assertOneRecord(object, kind) {
  const text = objectText(object);
  if (kind === "xstats") {
    assert.match(text, /Total Pots1/);
    return;
  }
  assert.match(text, /my pot/);
  assert.match(text, /1990-12-10T00:00:00\.000Z/);
}

function assertTwoRecords(object, kind) {
  const text = objectText(object);
  if (kind === "xstats") {
    assert.match(text, /Total Pots2/);
    return;
  }
  assert.match(text, /my pot/);
  assert.match(text, /second pot/);
}

async function runSharedScenario(label, kinds) {
  scenarioIndex += 1;
  const key = `pot.records.shared.${scenarioIndex}`;
  const objects = kinds.map((kind, index) =>
    createComponent(kind, `${label}-${kind}-${index}`, key)
  );

  for (const object of objects) {
    await object.onMount();
  }

  _xd.set(key, []);
  await settle();
  assert.equal(_xd.has(key), true, `${label}: empty update should keep ${key}`);
  objects.forEach((object, index) => assertEmpty(object, kinds[index]));

  _xd.set(key, [record1]);
  await settle();
  assert.equal(_xd.has(key), true, `${label}: one-record update should keep ${key}`);
  objects.forEach((object, index) => assertOneRecord(object, kinds[index]));

  _xd.set(key, [record1, record2]);
  await settle();
  assert.equal(_xd.has(key), true, `${label}: two-record update should keep ${key}`);
  objects.forEach((object, index) => assertTwoRecords(object, kinds[index]));

  for (const object of objects) {
    await object.dispose();
  }
}

await runSharedScenario("stats-first", ["xstats", "table"]);
await runSharedScenario("table-first", ["table", "xstats"]);
await runSharedScenario("gallery-list", ["xgallery", "xlist"]);
await runSharedScenario("list-gallery", ["xlist", "xgallery"]);
await runSharedScenario("all-consumers", ["xstats", "table", "xgallery", "xlist"]);

await (async function generatedPotTableRegression() {
  scenarioIndex += 1;
  const key = `pot.records.generated.${scenarioIndex}`;
  const stats = XUI.create({
    ...statsConfig("generated-pot-stats", key),
    _id: "generated-pot-stats",
  });
  const table = XUI.create({
    ...tableConfig("pot-list-table-regression", key),
    _id: "pot-list-table-regression",
    _entity: "pot",
    _entity_id: "pot",
    _rows: undefined,
    _refresh_after_actions: true,
  });

  await stats.onMount();
  await table.onMount();

  _xd.set(key, [record1]);
  await settle();

  assert.equal(_xd.has(key), true, "generated pot table regression should keep pot.records");
  assert.match(objectText(stats), /Total Pots1/);
  assert.match(objectText(table), /my pot/);
  assert.match(objectText(table), /1990-12-10T00:00:00\.000Z/);

  await stats.dispose();
  await table.dispose();
})();

await (async function disposeUnsubscribesFromSharedSource() {
  scenarioIndex += 1;
  const key = `pot.records.dispose.${scenarioIndex}`;
  const table = XUI.create(tableConfig("disposable-table", key));
  const originalOnData = table.onData.bind(table);
  let calls = 0;
  table.onData = async (data) => {
    calls += 1;
    return originalOnData(data);
  };

  await table.onMount();
  _xd.set(key, []);
  await settle();
  assert.equal(calls, 1);

  await table.dispose();
  _xd.set(key, [record1]);
  await settle();
  assert.equal(calls, 1, "disposed table should not receive later XData updates");
  assert.equal(_xd.has(key), true, "dispose should not delete shared XData");
})();

console.log("shared XData collection consumer tests passed");
