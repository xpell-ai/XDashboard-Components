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

function classTokens(object) {
  return String(object.dom?.className ?? object.class ?? "").split(/\s+/).filter(Boolean);
}

function assertSingle(tokens, token) {
  assert.equal(tokens.filter((value) => value === token).length, 1, `${token} should appear once`);
}

for (const variant of ["plain", "subtle"]) {
  const toolbar = XUI.create({
    _type: "toolbar",
    _id: `toolbar-${variant}`,
    _variant: variant,
    _density: "comfortable",
    class: `custom-toolbar xtoolbar--variant-${variant}`,
  });
  const tokens = classTokens(toolbar);
  assert.ok(tokens.includes("xtoolbar"), tokens.join(" "));
  assert.ok(tokens.includes(`xtoolbar--variant-${variant}`), tokens.join(" "));
  assert.ok(tokens.includes("xtoolbar--density-comfortable"), tokens.join(" "));
  assert.ok(tokens.includes("custom-toolbar"), tokens.join(" "));
  assertSingle(tokens, "xtoolbar");
  assertSingle(tokens, `xtoolbar--variant-${variant}`);
}

for (const density of ["compact", "comfortable", "spacious"]) {
  const toolbar = XUI.create({
    _type: "toolbar",
    _id: `toolbar-${density}`,
    _variant: "plain",
    _density: density,
  });
  const tokens = classTokens(toolbar);
  assert.ok(tokens.includes(`xtoolbar--density-${density}`), tokens.join(" "));
}

const toolbarWithGap = XUI.create({
  _type: "toolbar",
  _id: "toolbar-gap",
  _variant: "plain",
  _density: "compact",
  _gap: 14,
});
assert.equal(toolbarWithGap.dom?.style.getPropertyValue("--xtoolbar-gap"), "14px");

const explicitToolbar = XUI.create({
  _type: "toolbar",
  _id: "toolbar-explicit",
  class: "legacy-toolbar xtoolbar--variant-plain xtoolbar--density-comfortable",
});
const explicitToolbarTokens = classTokens(explicitToolbar);
assert.ok(explicitToolbarTokens.includes("legacy-toolbar"), explicitToolbarTokens.join(" "));
assert.ok(explicitToolbarTokens.includes("xtoolbar--variant-plain"), explicitToolbarTokens.join(" "));
assert.ok(explicitToolbarTokens.includes("xtoolbar--density-comfortable"), explicitToolbarTokens.join(" "));

const igroup = XUI.create({
  _type: "igroup",
  _id: "igroup-test",
  _variant: "plain",
  _density: "comfortable",
  class: "custom-igroup xigroup--variant-plain",
});
const igroupTokens = classTokens(igroup);
assert.ok(igroupTokens.includes("xigroup"), igroupTokens.join(" "));
assert.ok(igroupTokens.includes("xigroup--variant-plain"), igroupTokens.join(" "));
assert.ok(igroupTokens.includes("xigroup--density-comfortable"), igroupTokens.join(" "));
assert.ok(igroupTokens.includes("custom-igroup"), igroupTokens.join(" "));
assertSingle(igroupTokens, "xigroup");
assertSingle(igroupTokens, "xigroup--variant-plain");

const merged = XUI.create({
  _type: "igroup",
  _id: "igroup-merged",
  _merged: true,
  _dense: true,
});
const mergedTokens = classTokens(merged);
assert.ok(mergedTokens.includes("xigroup--merged"), mergedTokens.join(" "));
assert.ok(mergedTokens.includes("xigroup--variant-merged"), mergedTokens.join(" "));
assert.ok(mergedTokens.includes("xigroup--dense"), mergedTokens.join(" "));
assert.ok(mergedTokens.includes("xigroup--density-compact"), mergedTokens.join(" "));

const igroupWithGap = XUI.create({
  _type: "igroup",
  _id: "igroup-gap",
  _density: "spacious",
  _gap: 18,
});
assert.equal(igroupWithGap.dom?.style.getPropertyValue("--xigroup-gap"), "18px");

const explicitIgroup = XUI.create({
  _type: "igroup",
  _id: "igroup-explicit",
  class: "legacy-igroup xigroup--variant-plain xigroup--density-comfortable",
});
const explicitIgroupTokens = classTokens(explicitIgroup);
assert.ok(explicitIgroupTokens.includes("legacy-igroup"), explicitIgroupTokens.join(" "));
assert.ok(explicitIgroupTokens.includes("xigroup--variant-plain"), explicitIgroupTokens.join(" "));
assert.ok(explicitIgroupTokens.includes("xigroup--density-comfortable"), explicitIgroupTokens.join(" "));

const objects = XDashPack.getObjects();
const toolbarFields = objects.toolbar._skill._design._inspector._fields;
const igroupFields = objects.igroup._skill._design._inspector._fields;

assert.deepEqual(
  toolbarFields.find((field) => field._key === "_variant")?._options,
  ["plain", "subtle", "sticky"]
);
assert.deepEqual(
  toolbarFields.find((field) => field._key === "_density")?._options,
  ["compact", "comfortable", "spacious"]
);
assert.deepEqual(
  igroupFields.find((field) => field._key === "_variant")?._options,
  ["plain", "subtle", "merged"]
);
assert.deepEqual(
  igroupFields.find((field) => field._key === "_density")?._options,
  ["compact", "comfortable", "spacious"]
);

console.log("toolbar and igroup semantic class projection passed");
