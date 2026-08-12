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

function createKanban(data) {
  return XUI.create({
    _type: "xkanban",
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

function childObjects(object) {
  return Array.isArray(object._children) ? object._children : [];
}

function labelsFor(ids) {
  return ids.map((id) => getObject(id)._text);
}

assert.equal(XDashPack.getObjects().xkanban?._xtype, "xkanban");

if (typeof _xd?.set === "function") {
  _xd.set("task.records", {
    records: [
      { id: "t1", status: "todo", title: "Write spec", assignee: "Maya", notes: "Draft", priority: "High" },
      { id: "t2", status: "done", title: "Ship beta", assignee: "Noah", notes: "Released", priority: "Low" },
    ],
  });
}

const bound = createKanban({
  _id: "xkanban-bound",
  _data_source: "task.records",
  _group_by: "status",
  _columns: [
    { _value: "todo", _label: "To Do" },
    { _value: "doing", _label: "Doing" },
    { _value: "done", _label: "Done" },
  ],
  _row_key: "id",
  _item: {
    _title: "$row.title",
    _subtitle: "$row.assignee",
    _description: "$row.notes",
    _badge: "$row.priority",
  },
});

assert.ok(String(bound.class).includes("xkanban"));
assert.ok(String(bound.style).includes("--xkanban-min-col:260px"));
assert.deepEqual(childIds(getObject("xkanban-bound_board")), [
  "xkanban-bound_column_todo",
  "xkanban-bound_column_doing",
  "xkanban-bound_column_done",
]);
assert.equal(getObject("xkanban-bound_column_todo_title")._text, "To Do");
assert.equal(getObject("xkanban-bound_column_doing_title")._text, "Doing");
assert.equal(getObject("xkanban-bound_column_done_title")._text, "Done");
assert.equal(getObject("xkanban-bound_item_t1_title")._text, "Write spec");
assert.equal(getObject("xkanban-bound_item_t1_subtitle")._text, "Maya");
assert.equal(getObject("xkanban-bound_item_t1_description")._text, "Draft");
assert.equal(getObject("xkanban-bound_item_t1_badge")._text, "High");
assert.ok(childIds(getObject("xkanban-bound_column_doing_cards")).includes("xkanban-bound_column_doing_empty"));

const grouped = createKanban({
  _id: "xkanban-grouped",
  _items: [
    { key: "a", phase: "new", name: "Alpha" },
    { key: "b", phase: "review", name: "Beta" },
    { key: "c", phase: "new", name: "Gamma" },
  ],
  _row_key: "key",
  _group_by: "phase",
  _item: {
    _title: "$row.name",
  },
});
assert.deepEqual(labelsFor(childIds(getObject("xkanban-grouped_board")).map((id) => `${id}_title`)), [
  "New",
  "Review",
]);
assert.deepEqual(childIds(getObject("xkanban-grouped_column_new_cards")), [
  "xkanban-grouped_item_a",
  "xkanban-grouped_item_c",
]);
assert.deepEqual(childIds(getObject("xkanban-grouped_column_review_cards")), [
  "xkanban-grouped_item_b",
]);

const empty = createKanban({
  _id: "xkanban-empty",
  _items: [],
  _group_by: "status",
  _empty_text: "Nothing here",
});
assert.ok(empty);
assert.deepEqual(childIds(getObject("xkanban-empty_board")), ["xkanban-empty_empty"]);
assert.equal(getObject("xkanban-empty_empty")._title, "Nothing here");

assert.doesNotThrow(() =>
  createKanban({
    _id: "xkanban-missing-fields",
    _items: [{ id: "missing", lane: "todo" }],
    _row_key: "id",
    _group_by: "lane",
    _item: {
      _title: "$row.missing.title",
      _subtitle: "$row.missing.assignee",
      _description: "$row.missing.notes",
      _badge: "$row.missing.priority",
    },
  })
);
assert.equal(XUI.getObject("xkanban-missing-fields_item_missing_title"), undefined);
assert.equal(XUI.getObject("xkanban-missing-fields_item_missing_badge"), undefined);
assert.ok(getObject("xkanban-missing-fields_item_missing"));

const mapped = createKanban({
  _id: "xkanban-mapped",
  _items: [
    {
      uuid: "deal-1",
      lane: "open",
      headline: "Enterprise plan",
      owner: "Rae",
      summary: "Needs legal review",
      tag: "Large",
      image_url: "/public/deals/deal.png",
    },
  ],
  _row_key: "uuid",
  _group_by: "$row.lane",
  _item: {
    _title: "$row.headline",
    _subtitle: "$row.owner",
    _image: "$row.image_url",
    _description: "$row.summary",
    _badge: "$row.tag",
    _actions: [
      {
        _type: "button",
        _text: "$row.uuid",
      },
    ],
  },
});
assert.ok(mapped);
assert.equal(getObject("xkanban-mapped_item_deal-1_title")._text, "Enterprise plan");
assert.equal(getObject("xkanban-mapped_item_deal-1_subtitle")._text, "Rae");
assert.equal(getObject("xkanban-mapped_item_deal-1_description")._text, "Needs legal review");
assert.equal(getObject("xkanban-mapped_item_deal-1_badge")._text, "Large");
assert.equal(getObject("xkanban-mapped_item_deal-1_image").src, "/public/deals/deal.png");
assert.equal(getObject("xkanban-mapped_item_deal-1_action_0")._text, "deal-1");
assert.equal(getObject("xkanban-mapped_item_deal-1_action_0")._row.uuid, "deal-1");
assert.equal(getObject("xkanban-mapped_item_deal-1_action_0")._context.row_index, 0);

let selected;
const selectable = createKanban({
  _id: "xkanban-selectable",
  _items: [{ id: "sel", status: "todo", title: "Selectable" }],
  _row_key: "id",
  _group_by: "status",
  _item: { _title: "$row.title" },
  _on_select: (_xobj, row, context) => {
    selected = { row, context };
  },
});
await selectable._on_select(selectable, { id: "manual" }, { group: "manual" });
assert.equal(selected.row.id, "manual");
await getObject("xkanban-selectable_item_sel")._on.click();
assert.equal(selected.row.id, "sel");
assert.equal(selected.context.group, "todo");

let moved;
const movable = createKanban({
  _id: "xkanban-movable",
  _items: [{ id: "move", status: "todo", title: "Move me" }],
  _row_key: "id",
  _group_by: "status",
  _columns: [
    { _value: "todo", _label: "To Do" },
    { _value: "done", _label: "Done" },
  ],
  _item: { _title: "$row.title" },
  _on_card_moved: (_xobj, payload) => {
    moved = payload;
  },
});
await getObject("xkanban-movable_item_move")._on.dragstart({
  dataTransfer: {
    setData() {},
  },
});
await getObject("xkanban-movable_column_done")._on.drop({
  preventDefault() {},
});
assert.equal(moved.record.id, "move");
assert.equal(moved.source_group, "todo");
assert.equal(moved.target_group, "done");
assert.equal(getObject("xkanban-movable_item_move")._row.status, "todo");

const people = createKanban({
  _id: "xkanban-people",
  _items: [
    { person_id: "p1", team: "design", display_name: "Ana" },
    { person_id: "p2", team: "engineering", display_name: "Ira" },
  ],
  _row_key: "person_id",
  _group_by: "team",
  _item: {
    _title: "$row.display_name",
  },
});
assert.ok(people);
assert.equal(getObject("xkanban-people_item_p1_title")._text, "Ana");
assert.equal(getObject("xkanban-people_item_p2_title")._text, "Ira");

await bound.onData({
  records: [
    { id: "t3", status: "doing", title: "Review docs", assignee: "Lee", notes: "QA", priority: "Medium" },
  ],
});
assert.equal(getObject("xkanban-bound_item_t3_title")._text, "Review docs");
assert.deepEqual(childIds(getObject("xkanban-bound_column_todo_cards")), [
  "xkanban-bound_column_todo_empty",
]);
assert.deepEqual(childIds(getObject("xkanban-bound_column_doing_cards")), [
  "xkanban-bound_item_t3",
]);

console.log("xkanban behavior passed");
