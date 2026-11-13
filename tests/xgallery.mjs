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
const { XDashPack } = await import("../dist/index.js");

XUI.importObjectPack(XDashPack);

function createGallery(data) {
  return XUI.create({
    _type: "xgallery",
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

function styleOf(id) {
  return getObject(id)._style ?? {};
}

assert.equal(XDashPack.getObjects().xgallery?._xtype, "xgallery");

if (typeof _xd?.set === "function") {
  _xd.set("gallery.records", {
    records: [
      {
        id: "fern",
        name: "Fern",
        category: "Plant",
        image: "/fern.png",
        summary: "Filtered light",
        updated_at: "2026-08-01",
        status: "ok",
        action_label: "Open Fern",
      },
    ],
  });
}

const itemTemplate = {
  _title: "$row.name",
  _subtitle: "$row.category",
  _image: "$row.image",
  _description: "$row.summary",
  _meta: "$row.updated_at",
  _badge: "$row.status",
  _actions: [{ _type: "button", _text: "$row.action_label" }],
  _styles: {
    _item: { _style: { "border-radius": "16px", "box-shadow": "var(--x-shadow-md)" } },
    _image: { _style: { "aspect-ratio": "4 / 3", "border-radius": "12px" } },
    _body: { _style: { padding: "20px" } },
    _title: { _style: { "font-size": "22px", "font-weight": "600" } },
    _subtitle: { _style: { color: "var(--x-text-muted)" } },
    _description: { _style: { "line-height": "1.6" } },
    _meta: { _style: { color: "gray" } },
    _badge: { _style: { color: "green", padding: "2px 8px" } },
    _actions: { _style: { "justify-content": "flex-end" } },
  },
};
const originalTemplate = JSON.parse(JSON.stringify(itemTemplate));

const gallery = createGallery({
  _id: "styled-gallery",
  _data_source: "gallery.records",
  _row_key: "id",
  _item: itemTemplate,
});
assert.ok(gallery);
assert.deepEqual(itemTemplate, originalTemplate, "rendering must not mutate persisted template data");
assert.deepEqual(childIds(getObject("styled-gallery_grid")), ["styled-gallery_item_fern"]);
assert.equal(getObject("styled-gallery_item_fern_title")._text, "Fern");
assert.equal(styleOf("styled-gallery_item_fern")["border-radius"], "16px");
assert.equal(styleOf("styled-gallery_item_fern")["box-shadow"], "var(--x-shadow-md)");
assert.equal(styleOf("styled-gallery_item_fern_image")["aspect-ratio"], "4 / 3");
assert.equal(styleOf("styled-gallery_item_fern_image")["border-radius"], "12px");
assert.equal(styleOf("styled-gallery_item_fern_body").padding, "20px");
assert.equal(styleOf("styled-gallery_item_fern_title")["font-size"], "22px");
assert.equal(styleOf("styled-gallery_item_fern_title")["font-weight"], "600");
assert.equal(styleOf("styled-gallery_item_fern_subtitle").color, "var(--x-text-muted)");
assert.equal(styleOf("styled-gallery_item_fern_description")["line-height"], "1.6");
assert.equal(styleOf("styled-gallery_item_fern_meta").color, "gray");
assert.equal(styleOf("styled-gallery_item_fern_badge").color, "green");
assert.equal(styleOf("styled-gallery_item_fern_badge").padding, "2px 8px");
assert.equal(styleOf("styled-gallery_item_fern_actions")["justify-content"], "flex-end");

createGallery({
  _id: "gallery-structured-merge",
  _items: [{ id: "merge", name: "Merge", status: "ready" }],
  _row_key: "id",
  _item: {
    _title: "$row.name",
    _badge: {
      _text: "$row.status",
      _style: {
        color: "blue",
      },
    },
    _image: {
      _type: "image",
      src: "/merge.png",
      _style: {
        "border-radius": "4px",
      },
    },
    _styles: {
      _badge: {
        _style: {
          color: "red",
          "font-size": "12px",
        },
      },
      _image: {
        _style: {
          "border-radius": "20px",
          width: "100%",
        },
      },
    },
  },
});
assert.equal(styleOf("gallery-structured-merge_item_merge_badge").color, "blue");
assert.equal(styleOf("gallery-structured-merge_item_merge_badge")["font-size"], "12px");
assert.equal(styleOf("gallery-structured-merge_item_merge_image")["border-radius"], "4px");
assert.equal(styleOf("gallery-structured-merge_item_merge_image").width, "100%");

const removable = createGallery({
  _id: "gallery-remove-style",
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
assert.equal(styleOf("gallery-remove-style_item_remove_title")["font-size"], "24px");
removable._item = {
  _title: "$row.name",
};
assert.equal(getObject("gallery-remove-style_item_remove_title")._style, undefined);

createGallery({
  _id: "gallery-legacy",
  _items: [{ id: "legacy", name: "Legacy" }],
  _row_key: "id",
  _item: {
    _title: "$row.name",
  },
});
assert.equal(getObject("gallery-legacy_item_legacy")._style, undefined);
assert.equal(getObject("gallery-legacy_item_legacy_title")._style, undefined);

console.log("xgallery collection component passed");
