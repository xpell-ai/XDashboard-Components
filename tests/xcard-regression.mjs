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

const localStorage = createStorage();
const sessionStorage = createStorage();

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
    this._classTokens = new Set(
      String(value ?? "").split(/\s+/g).filter(Boolean)
    );
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

globalThis.window = {
  localStorage,
  sessionStorage,
};
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
globalThis.Node = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,
};

const { XUI } = await import("@xpell/ui");
const { XDashPack } = await import("../dist/index.js");

XUI.importObjectPack(XDashPack);

const svgUrl = "/public/app2/assets/placeholder-record.svg";
const pngUrl = "/public/app2/assets/placeholder-record.png";

function createCard(data) {
  return XUI.create({
    _type: "card",
    ...data,
  });
}

function createSidebar(data) {
  return XUI.create({
    _type: "sidebar",
    ...data,
  });
}

function createTable(data) {
  return XUI.create({
    _type: "table",
    ...data,
  });
}

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

assert.doesNotThrow(() =>
  createSidebar({
    _id: "xsidebar-logo-url",
    _title: "Operations",
    _logo: "/public/shops/assets/logo.svg",
    _nav: {
      _type: "navlist",
      _items: [{ _label: "Overview", _value: "overview" }],
    },
  })
);
assert.equal(getObject("xsidebar-logo-url_logo")._type, "image");
assert.equal(getObject("xsidebar-logo-url_logo").src, "/public/shops/assets/logo.svg");
assert.equal(getObject("xsidebar-logo-url_logo").alt, "Operations");

assert.doesNotThrow(() =>
  createSidebar({
    _id: "xsidebar-logo-object",
    _title: "Operations",
    _logo: {
      _type: "image",
      _id: "custom-sidebar-logo",
      src: "/public/shops/assets/logo.svg",
      alt: "Shops",
    },
    _nav: {
      _type: "navlist",
      _items: [{ _label: "Overview", _value: "overview" }],
    },
  })
);
assert.equal(getObject("custom-sidebar-logo")._type, "image");
assert.equal(getObject("custom-sidebar-logo").src, "/public/shops/assets/logo.svg");
assert.equal(getObject("custom-sidebar-logo").alt, "Shops");

assert.doesNotThrow(() =>
  createCard({
    _id: "xcard-svg",
    _image: svgUrl,
    _image_alt: "Dashboard placeholder",
    _title: "Workspace preferences",
    _text: "Example card",
  })
);

assert.doesNotThrow(() =>
  createCard({
    _id: "xcard-png",
    _image: pngUrl,
    _image_alt: "PNG placeholder",
    _title: "Workspace preferences",
    _text: "Example card",
  })
);

const imageCard = getObject("xcard-svg");
const imageObject = getObject("xcard-svg_image");
assert.equal(imageObject.src, svgUrl);
assert.equal(imageObject.alt, "Dashboard placeholder");
assert.equal(imageObject.style, "");
assert.ok(!String(imageCard.class).includes("xcard--no-image"));

assert.doesNotThrow(() =>
  createCard({
    _id: "xcard-image-object",
    _image: {
      _type: "image",
      _id: "custom-card-image",
      src: svgUrl,
      alt: "Custom image",
    },
    _title: "Workspace preferences",
    _text: "Example card",
  })
);
assert.equal(getObject("custom-card-image")._type, "image");
assert.equal(getObject("custom-card-image").src, svgUrl);
assert.equal(getObject("custom-card-image").alt, "Custom image");

const noImageCard = createCard({
  _id: "xcard-no-image",
  _title: "No image",
  _text: "This card has no image.",
});
assert.equal(XUI.getObject("xcard-no-image_image"), undefined);
assert.ok(String(noImageCard.class).includes("xcard--no-image"));

const nullImageCard = createCard({
  _id: "xcard-null-image",
  _image: null,
  _title: "Null image",
});
assert.equal(XUI.getObject("xcard-null-image_image"), undefined);
assert.ok(String(nullImageCard.class).includes("xcard--no-image"));

const hiddenImageCard = createCard({
  _id: "xcard-hidden-image",
  _image: pngUrl,
  _hide_image: true,
});
assert.equal(XUI.getObject("xcard-hidden-image_image"), undefined);
assert.ok(String(hiddenImageCard.class).includes("xcard--no-image"));

const updateCard = createCard({
  _id: "xcard-update-image",
  _image: svgUrl,
});
updateCard._image = pngUrl;
assert.equal(getObject("xcard-update-image_image").src, pngUrl);
updateCard._image = pngUrl;
assert.equal(getObject("xcard-update-image_image").src, pngUrl);
assert.equal(childIds(getObject("xcard-update-image_inner")).filter((id) => id === "xcard-update-image_image").length, 1);

createCard({
  _id: "xcard-actions",
  _title: "Actions",
  _actions: [
    {
      _id: "xcard-actions-save",
      _type: "button",
      _text: "Save settings",
    },
  ],
});
const actionsContainer = getObject("xcard-actions_actions");
assert.deepEqual(childIds(actionsContainer), ["xcard-actions-save"]);
assert.equal(getObject("xcard-actions-save")._type, "button");

for (const id of [
  "xcard-svg_inner",
  "xcard-svg_body",
  "xcard-svg_image",
  "xcard-svg_title",
  "xcard-svg_text",
  "xcard-svg_link",
  "xcard-svg_actions",
]) {
  assert.equal(getObject(id)._id, id);
}

const originalCreate = XUI.create.bind(XUI);
const createInputs = [];
XUI.create = (data) => {
  createInputs.push(data);
  assert.notEqual(data, svgUrl, "raw _image string reached XUI.create()");
  return originalCreate(data);
};

try {
  assert.doesNotThrow(() =>
    createCard({
      _id: "xcard-create-guard",
      _image: svgUrl,
      _image_alt: "Dashboard placeholder",
      _actions: [
        {
          _id: "xcard-create-guard-action",
          _type: "button",
          _text: "Open",
        },
      ],
    })
  );
} finally {
  XUI.create = originalCreate;
}

assert.ok(createInputs.length > 0);
assert.ok(
  createInputs.some(
    (input) => input && input._id === "xcard-create-guard_image" && input.src === svgUrl
  )
);

const starterCard = createCard({
  _id: "dashboard-settings-card",
  _image: {
    _id: "dashboard-settings-card-image",
    _type: "image",
    class: "xcard__image",
    src: "/public/app2/assets/placeholder-record.svg",
    alt: "Dashboard placeholder",
  },
  _image_alt: "Dashboard placeholder",
  _title: "Workspace preferences",
  _text: "Example card",
});
assert.equal(
  getObject("dashboard-settings-card-image").src,
  "/public/app2/assets/placeholder-record.svg"
);
assert.ok(!String(starterCard.class).includes("xcard--no-image"));

const regressionNoImage = createCard({
  _id: "dashboard-card-without-image",
  _title: "Workspace preferences",
  _text: "Example card",
});
assert.equal(XUI.getObject("dashboard-card-without-image_image"), undefined);
assert.ok(String(regressionNoImage.class).includes("xcard--no-image"));

assert.doesNotThrow(() =>
  createTable({
    _id: "xtable-scalar-cells",
    _columns: [{ _key: "name", _title: "Name" }],
    _rows: [{ _id: "row-1", name: "/public/shops/assets/logo.svg" }],
  })
);
assert.equal(XUI.getObject("xtable-scalar-cells_logo"), undefined);
assert.equal(XUI.getObject("xtable-scalar-cells_image"), undefined);

const gallery = createGallery({
  _id: "xgallery-products",
  _items: [
    {
      id: "sku-1",
      name: "Widget",
      category: "Hardware",
      image: "/public/products/widget.png",
      notes: "Ships in two business days",
      status: "Active",
    },
    {
      id: "sku-2",
      name: "Service plan",
      category: "Subscription",
      status: "Paused",
    },
  ],
  _row_key: "id",
  _columns: 3,
  _min_col_width: 180,
  _gap: 12,
  _item: {
    _title: "$row.name",
    _subtitle: "$row.category",
    _image: "$row.image",
    _description: "$row.notes",
    _badge: "$row.status",
    _actions: [
      {
        _type: "button",
        _text: "Open",
        _on: {
          click: {
            _module: "xd",
            _op: "set",
            _params: {
              key: "products.selected",
              value: "$row.id",
              source: "xgallery-products",
            },
          },
        },
      },
    ],
  },
});
assert.ok(String(gallery.class).includes("xgallery"));
assert.ok(String(gallery.style).includes("--xgallery-cols:3"));
assert.ok(String(gallery.style).includes("--xgallery-min-col:180px"));
assert.ok(String(gallery.style).includes("--xgallery-gap:12px"));
assert.deepEqual(childIds(getObject("xgallery-products_grid")), [
  "xgallery-products_item_sku-1",
  "xgallery-products_item_sku-2",
]);
assert.equal(getObject("xgallery-products_item_sku-1_title")._text, "Widget");
assert.equal(getObject("xgallery-products_item_sku-1_subtitle")._text, "Hardware");
assert.equal(getObject("xgallery-products_item_sku-1_image").src, "/public/products/widget.png");
assert.equal(getObject("xgallery-products_item_sku-1_description")._text, "Ships in two business days");
assert.equal(getObject("xgallery-products_item_sku-1_badge")._text, "Active");
assert.equal(
  getObject("xgallery-products_item_sku-1_action_0")._on.click._params.value,
  "sku-1"
);
assert.equal(getObject("xgallery-products_item_sku-1_action_0")._row.id, "sku-1");
assert.equal(getObject("xgallery-products_item_sku-1_action_0")._row_index, 0);
assert.equal(XUI.getObject("xgallery-products_item_sku-2_image"), undefined);
assert.ok(String(getObject("xgallery-products_item_sku-2").class).includes("xgallery__card--no-image"));

const emptyGallery = createGallery({
  _id: "xgallery-empty",
  _items: [],
  _empty_text: "Nothing here",
});
assert.equal(childIds(getObject("xgallery-empty_grid"))[0], "xgallery-empty_empty");
assert.equal(getObject("xgallery-empty_empty")._title, "Nothing here");

emptyGallery._items = [{ id: "next", name: "Next record" }];
assert.deepEqual(childIds(getObject("xgallery-empty_grid")), [
  "xgallery-empty_item_0",
]);
assert.equal(getObject("xgallery-empty_item_0_title")._text, "Next record");

console.log("xcard regressions passed");
