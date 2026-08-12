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

function createList(data) {
  return XUI.create({
    _type: "xlist",
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

console.log("xlist collection component passed");
