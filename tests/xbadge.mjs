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

  get firstChild() {
    return this.childNodes[0] ?? null;
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
    if (attr === "style") {
      this.attributes.delete(attr);
      this.style.cssText = "";
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
    if (idx < 0) this.childNodes.push(child);
    else this.childNodes.splice(idx, 0, child);
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

const { XUI } = await import("@xpell/ui");
const { XDashPack } = await import("../dist/index.js");

XUI.importObjectPack(XDashPack);

function getObject(id) {
  const object = XUI.getObject(id);
  assert.ok(object, `Expected XUI object ${id} to exist`);
  return object;
}

function classTokens(object) {
  return String(object.dom?.className ?? object.class ?? "").split(/\s+/).filter(Boolean);
}

function textNodes(node) {
  const nodes = [];
  for (const child of node.childNodes ?? []) {
    if (child.nodeType === 3) nodes.push(child);
    else nodes.push(...textNodes(child));
  }
  return nodes;
}

function directTextNodes(node) {
  return (node.childNodes ?? []).filter((child) => child.nodeType === 3);
}

function assertVisibleTextOnce(object, text) {
  assert.equal(object.dom.textContent, text);
  assert.equal(textNodes(object.dom).filter((node) => node.textContent === text).length, 1);
  assert.equal(directTextNodes(object.dom).length, 0, "badge root should not own a direct text node");
}

const ready = XUI.create({
  _type: "badge",
  _id: "badge-ready",
  _text: "Ready",
  _variant: "success",
  _size: "sm",
  _pill: true,
  class: "custom-badge",
  _style: { color: "green" },
  _title: "Ready status",
});

assertVisibleTextOnce(ready, "Ready");
assert.equal(getObject("badge-ready_text")._text, "Ready");
assert.ok(classTokens(ready).includes("xbadge"), ready.dom.className);
assert.ok(classTokens(ready).includes("xbadge--success"), ready.dom.className);
assert.ok(classTokens(ready).includes("xbadge--sm"), ready.dom.className);
assert.ok(classTokens(ready).includes("xbadge--pill"), ready.dom.className);
assert.ok(classTokens(ready).includes("custom-badge"), ready.dom.className);
assert.equal(ready.dom.style.getPropertyValue("color"), "green");
assert.equal(ready.dom.getAttribute("title"), "Ready status");
assert.equal(ready.dom.getAttribute("aria-label"), null);

ready._text = "Running";
assertVisibleTextOnce(ready, "Running");

ready.update({
  _type: "badge",
  _text: "Done",
  _variant: "warning",
  _size: "md",
  _pill: false,
  _dot: true,
  _title: "Done status",
});
assertVisibleTextOnce(ready, "Done");
assert.ok(classTokens(ready).includes("xbadge--warn"), ready.dom.className);
assert.ok(classTokens(ready).includes("xbadge--md"), ready.dom.className);
assert.ok(classTokens(ready).includes("xbadge--dot"), ready.dom.className);
assert.equal(classTokens(ready).includes("xbadge--pill"), false);
assert.equal(ready.dom.getAttribute("title"), "Done status");

const optional = XUI.create({
  _type: "badge",
  _id: "badge-optional",
  _text: "Optional",
  _variant: "danger",
});
assertVisibleTextOnce(optional, "Optional");
assert.ok(classTokens(optional).includes("xbadge--error"), optional.dom.className);

const section = XUI.create({
  _type: "xsection",
  _id: "badge-section",
  _title: "Section",
  _actions: [
    {
      _type: "badge",
      _id: "section-ready",
      _text: "Ready",
      _variant: "success",
    },
  ],
  _children: [],
});
assert.ok(section);
assertVisibleTextOnce(getObject("section-ready"), "Ready");

const list = XUI.create({
  _type: "xlist",
  _id: "badge-list",
  _items: [{ id: "item-1", title: "Item", status: "Ready" }],
  _row_key: "id",
  _item: {
    _title: "$row.title",
    _badge: "$row.status",
  },
});
assert.ok(list);
assertVisibleTextOnce(getObject("badge-list_item_item-1_badge"), "Ready");

const toolbar = XUI.create({
  _type: "toolbar",
  _id: "badge-toolbar",
  _children: [
    {
      _type: "badge",
      _id: "toolbar-optional",
      _text: "Optional",
      _variant: "info",
    },
  ],
});
assert.ok(toolbar);
assertVisibleTextOnce(getObject("toolbar-optional"), "Optional");

console.log("xbadge text rendering regression passed");
