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

const { XUI } = await import("@xpell/ui");
const { XDashPack } = await import("../dist/index.js");

XUI.importObjectPack(XDashPack);

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

const section = XUI.create({
  _type: "xsection",
  _id: "main-section",
  _title: "Main",
  _subtitle: "Primary records",
  _actions: [
    {
      _type: "badge",
      _id: "ready-badge",
      _text: "Ready",
    },
  ],
  _children: [
    {
      _type: "empty",
      _id: "empty-state",
      _title: "No records",
    },
  ],
});

assert.deepEqual(childIds(section), ["main-section_container"]);
assert.deepEqual(childIds(getObject("main-section_container")), [
  "main-section_header",
  "main-section_body",
]);
assert.equal(getObject("main-section_title")._text, "Main");
assert.equal(getObject("main-section_subtitle")._text, "Primary records");
assert.deepEqual(childIds(getObject("main-section_actions")), ["ready-badge"]);
assert.deepEqual(childIds(getObject("main-section_body")), ["empty-state"]);
assert.equal(getObject("ready-badge")._text, "Ready");
assert.equal(getObject("empty-state")._title, "No records");

assert.equal(XUI.getObject("main-section::title"), undefined);
assert.equal(XUI.getObject("main-section::subtitle"), undefined);
assert.equal(XUI.getObject("main-section::actions"), undefined);
assert.equal(XUI.getObject("main-section::body"), undefined);

const plain = XUI.create({
  _type: "xsection",
  _id: "plain-section",
  _title: "Plain",
  _children: [],
});

assert.deepEqual(childIds(plain), ["plain-section_container"]);
assert.equal(getObject("plain-section_title")._text, "Plain");
assert.equal(XUI.getObject("plain-section_subtitle"), undefined);
assert.equal(XUI.getObject("plain-section_actions"), undefined);
assert.deepEqual(childIds(getObject("plain-section_body")), []);

const semantic = XUI.create({
  _type: "xsection",
  _id: "semantic-section",
  _title: "Semantic",
  _variant: "card",
  _density: "compact",
  _children: [],
});
const semanticClass = String(semantic.dom?.className ?? semantic.class);
assert.ok(semanticClass.includes("xsection--variant-card"), semanticClass);
assert.ok(semanticClass.includes("xsection--density-compact"), semanticClass);
assert.deepEqual(childIds(semantic), ["semantic-section_container"]);

console.log("xsection runtime regression passed");
