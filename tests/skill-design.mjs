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
const {
  XDashPack,
  XDashboardObjectSkills,
  getXDashboardObjectSkills,
  getXDashboardObjectSkillsByCategory,
} = await import("../dist/index.js");

XUI.importObjectPack(XDashPack);

const objects = XDashPack.getObjects();
const entries = Object.entries(objects);
const objectSkills = getXDashboardObjectSkills();
const collectionPresentationSkills = getXDashboardObjectSkillsByCategory(
  "collection-presentation"
);
const dataSummarySkills = getXDashboardObjectSkillsByCategory("data-summary");

const expectedTypes = new Set([
  "card",
  "grid",
  "navlist",
  "badge",
  "table",
  "xlist",
  "xtimeline",
  "xcalendar",
  "xgallery",
  "xkanban",
  "xstats",
  "modal",
  "toast",
  "divider",
  "stack",
  "kpi-card",
  "scroll",
  "spacer",
  "toolbar",
  "empty",
  "igroup",
  "search",
  "xselect",
  "field",
  "drawer",
  "sidebar",
  "xsection",
]);

const validInputs = new Set(["text", "textarea", "number", "checkbox", "select", "json"]);
const validSections = new Set(["properties", "interactions", "raw-json", "danger"]);
const validCategories = new Set([
  "Dashboard",
  "Layout",
  "Navigation",
  "Data Display",
  "Cards",
  "Metrics",
  "Tables",
  "Charts",
  "Feedback",
  "Media",
]);
const internalFieldPattern = /^(__|_on_open$|_on_close$|_on_select$|_on_toggle$|_on_input$|_on_clear$|_dom|_cache|_runtime)/;

const supportedInspectorKeys = {
  card: ["_image", "_image_alt", "_hide_image", "_title", "_text", "_href", "_link_text", "_actions", "class"],
  grid: ["_children", "_cols", "_gap", "_min_col_width", "class"],
  navlist: ["_items", "_active", "_dense", "_dividers", "class"],
  badge: ["_text", "_variant", "_size", "_pill", "_dot", "_title", "class"],
  table: ["_columns", "_rows", "_data_source", "_on_data", "_row_key", "_dense", "_striped", "_hover", "_bordered", "_empty_text", "class"],
  xlist: ["_items", "_data_source", "_item", "_actions", "_row_key", "_dense", "_selectable", "_selected_key", "_gap", "_empty_text", "_empty", "_on_data", "class"],
  xtimeline: ["_items", "_data_source", "_date_field", "_order", "_item", "_actions", "_row_key", "_selectable", "_selected_key", "_empty_text", "_empty", "_undated_text", "_on_data", "class"],
  xcalendar: ["_items", "_data_source", "_date_field", "_end_date_field", "_view", "_month", "_week_start", "_item", "_actions", "_row_key", "_selectable", "_selected_key", "_empty_text", "_empty", "_on_data", "class"],
  xgallery: ["_items", "_data_source", "_item", "_actions", "_row_key", "_columns", "_min_col_width", "_gap", "_empty_text", "_empty", "_on_data", "class"],
  xkanban: ["_items", "_data_source", "_group_by", "_columns", "_item", "_actions", "_row_key", "_min_col_width", "_gap", "_empty_text", "_empty_column_text", "_empty", "_draggable", "_on_data", "class"],
  xstats: ["_data_source", "_records", "_items", "_min_col_width", "_gap", "_empty_text", "_empty", "_on_data", "class"],
  modal: ["_open", "_title", "_subtitle", "_size", "_width", "_closable", "_close_on_backdrop", "_scroll", "_actions", "_content", "_children", "class"],
  toast: ["_open", "_text", "_variant", "_icon", "_actions", "_closable", "_auto_close_ms", "_position", "class"],
  divider: ["_orientation", "_thickness", "_length", "_inset", "_muted", "class"],
  stack: ["_children", "_direction", "_gap", "_align", "_justify", "_wrap", "_grow", "_class", "class"],
  "kpi-card": ["_label", "_value", "_delta", "_delta_state", "_icon", "class"],
  scroll: ["_children", "_direction", "_grow", "_hide_scrollbar", "_max_height", "_max_width", "class"],
  spacer: ["_direction", "class"],
  toolbar: ["_children", "_gap", "_align", "_justify", "_wrap", "_sticky", "_top", "_elevated", "class"],
  empty: ["_title", "_description", "_icon", "_action", "_size", "_align", "class"],
  igroup: ["_children", "_gap", "_align", "_wrap", "_dense", "_merged", "class"],
  search: ["_value", "_placeholder", "_size", "_disabled", "_clearable", "_icon", "_autofocus", "_input_id", "class"],
  xselect: ["_value", "_placeholder", "_options", "_data_source", "_selected_data_source", "_data_output", "_size", "_disabled", "_name", "_select_id", "_on_change", "class"],
  field: ["_label", "_hint", "_error", "_required", "_inline", "_size", "_control", "_data_output", "_update_data_source_event", "class"],
  drawer: ["_open", "_side", "_width", "_title", "_closable", "_scroll", "_elevated", "_overlay", "_children", "class"],
  sidebar: ["_side", "_width", "_title", "_subtitle", "_logo", "_actions", "_nav", "_scroll", "_dividers", "_footer", "_collapsed", "_children", "class"],
  xsection: ["_title", "_subtitle", "_actions", "_children", "class"],
};

const expectedChildrenAllowed = {
  card: false,
  grid: true,
  navlist: false,
  badge: false,
  table: false,
  xlist: false,
  xtimeline: false,
  xcalendar: false,
  xgallery: false,
  xkanban: false,
  xstats: false,
  modal: true,
  toast: false,
  divider: false,
  stack: true,
  "kpi-card": false,
  scroll: true,
  spacer: false,
  toolbar: true,
  empty: false,
  igroup: true,
  search: false,
  xselect: false,
  field: false,
  drawer: true,
  sidebar: true,
  xsection: true,
};

function visit(value, fn) {
  fn(value);
  if (Array.isArray(value)) {
    value.forEach((item) => visit(item, fn));
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value).forEach((item) => visit(item, fn));
}

function assertCanonicalImageSlots(type, value) {
  visit(value, (node) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    for (const key of ["_image", "_logo"]) {
      if (!(key in node)) continue;
      const slot = node[key];
      assert.equal(typeof slot, "object", `${type}.${key} must be a canonical image object`);
      assert.equal(slot?._type, "image", `${type}.${key} must use _type:image`);
      assert.equal(typeof slot?.src, "string", `${type}.${key} must define src`);
      assert.equal(typeof slot?.alt, "string", `${type}.${key} must define alt`);
    }
  });
}

assert.deepEqual(new Set(entries.map(([type]) => type)), expectedTypes);
assert.equal(XDashboardObjectSkills.xgallery?._id, "xgallery");
assert.equal(XDashboardObjectSkills.xlist?._id, "xlist");
assert.equal(XDashboardObjectSkills.xtimeline?._id, "xtimeline");
assert.equal(XDashboardObjectSkills.xcalendar?._id, "xcalendar");
assert.equal(XDashboardObjectSkills.xkanban?._id, "xkanban");
assert.equal(XDashboardObjectSkills.xstats?._id, "xstats");

const listDiscoverySkill = objectSkills.xlist;
assert.ok(listDiscoverySkill, "xlist must be enumerable from package-level skills");
assert.equal(listDiscoverySkill._id, "xlist");
assert.equal(listDiscoverySkill._type, "view-skill");
assert.equal(listDiscoverySkill._category, "collection-presentation");
assert.equal(
  listDiscoverySkill._purpose,
  "compact/rich vertical presentation of record collections"
);
assert.deepEqual(listDiscoverySkill._bindings?._collection, [
  "_data_source",
  "_items",
]);
assert.deepEqual(listDiscoverySkill._bindings?._item, [
  "_item._title",
  "_item._subtitle",
  "_item._description",
  "_item._meta",
  "_item._icon",
  "_item._image",
  "_item._avatar",
  "_item._badge",
  "_item._leading",
  "_item._trailing",
  "_item._actions",
]);
assert.deepEqual(listDiscoverySkill._bindings?._actions, [
  "_item._actions",
  "_actions",
]);
for (const alias of ["list", "rich list", "compact list", "record list", "rows", "feed"]) {
  assert.ok(
    listDiscoverySkill._aliases?.includes(alias),
    `xlist aliases must include ${alias}`
  );
}
for (const useCase of [
  "contacts",
  "tasks",
  "plants",
  "music/media",
  "notifications",
  "messages",
  "orders",
  "activity/feed-style records",
]) {
  assert.ok(
    listDiscoverySkill._use_cases?.includes(useCase),
    `xlist use cases must include ${useCase}`
  );
}

const galleryDiscoverySkill = objectSkills.xgallery;
assert.ok(galleryDiscoverySkill, "xgallery must be enumerable from package-level skills");
assert.equal(galleryDiscoverySkill._id, "xgallery");
assert.equal(galleryDiscoverySkill._type, "view-skill");
assert.equal(galleryDiscoverySkill._category, "collection-presentation");
assert.equal(
  galleryDiscoverySkill._purpose,
  "Render record collections as cards/gallery"
);
assert.deepEqual(galleryDiscoverySkill._bindings?._collection, [
  "_data_source",
  "_items",
]);
for (const alias of ["gallery", "cards", "card-grid", "grid", "tiles"]) {
  assert.ok(
    galleryDiscoverySkill._aliases?.includes(alias),
    `xgallery aliases must include ${alias}`
  );
}
assert.deepEqual(galleryDiscoverySkill._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.equal(galleryDiscoverySkill._presentation?._kind, "collection");
assert.equal(galleryDiscoverySkill._presentation?._mode, "gallery");

const timelineDiscoverySkill = objectSkills.xtimeline;
assert.ok(timelineDiscoverySkill, "xtimeline must be enumerable from package-level skills");
assert.equal(timelineDiscoverySkill._id, "xtimeline");
assert.equal(timelineDiscoverySkill._type, "view-skill");
assert.equal(timelineDiscoverySkill._category, "collection-presentation");
assert.equal(
  timelineDiscoverySkill._purpose,
  "chronological/time-based presentation of records"
);
assert.deepEqual(timelineDiscoverySkill._bindings?._collection, [
  "_data_source",
  "_items",
]);
assert.deepEqual(timelineDiscoverySkill._bindings?._date, ["_date_field"]);
assert.deepEqual(timelineDiscoverySkill._bindings?._sort, ["_order"]);
assert.deepEqual(timelineDiscoverySkill._bindings?._actions, [
  "_item._actions",
  "_actions",
]);
assert.deepEqual(timelineDiscoverySkill._bindings?._events, [
  "xtimeline:item-select",
  "_on_select",
]);
for (const capability of ["temporal-records", "history-view"]) {
  assert.ok(
    timelineDiscoverySkill._capabilities?.includes(capability),
    `xtimeline capabilities must include ${capability}`
  );
}
for (const alias of [
  "timeline",
  "history",
  "activity",
  "activity timeline",
  "chronological",
  "event history",
  "events",
]) {
  assert.ok(
    timelineDiscoverySkill._aliases?.includes(alias),
    `xtimeline aliases must include ${alias}`
  );
}
for (const useCase of [
  "activity history",
  "audit logs",
  "order history",
  "maintenance history",
  "milestones",
  "status changes",
  "event feeds",
]) {
  assert.ok(
    timelineDiscoverySkill._use_cases?.includes(useCase),
    `xtimeline use cases must include ${useCase}`
  );
}
assert.deepEqual(timelineDiscoverySkill._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.equal(timelineDiscoverySkill._presentation?._kind, "collection");
assert.equal(timelineDiscoverySkill._presentation?._mode, "timeline");

const calendarDiscoverySkill = objectSkills.xcalendar;
assert.ok(calendarDiscoverySkill, "xcalendar must be enumerable from package-level skills");
assert.equal(calendarDiscoverySkill._id, "xcalendar");
assert.equal(calendarDiscoverySkill._type, "view-skill");
assert.equal(calendarDiscoverySkill._category, "collection-presentation");
assert.equal(
  calendarDiscoverySkill._purpose,
  "date-oriented calendar/schedule presentation of records"
);
assert.deepEqual(calendarDiscoverySkill._bindings?._collection, [
  "_data_source",
  "_items",
]);
assert.deepEqual(calendarDiscoverySkill._bindings?._date, ["_date_field"]);
assert.deepEqual(calendarDiscoverySkill._bindings?._start_date, ["_date_field"]);
assert.deepEqual(calendarDiscoverySkill._bindings?._end_date, ["_end_date_field"]);
assert.deepEqual(calendarDiscoverySkill._bindings?._view, ["_view"]);
assert.deepEqual(calendarDiscoverySkill._bindings?._actions, [
  "_item._actions",
  "_actions",
]);
for (const capability of ["date-layout", "scheduled-records"]) {
  assert.ok(
    calendarDiscoverySkill._capabilities?.includes(capability),
    `xcalendar capabilities must include ${capability}`
  );
}
for (const alias of [
  "calendar",
  "schedule",
  "planner",
  "month view",
  "agenda",
  "date view",
]) {
  assert.ok(
    calendarDiscoverySkill._aliases?.includes(alias),
    `xcalendar aliases must include ${alias}`
  );
}
for (const useCase of [
  "appointments",
  "reminders",
  "bookings",
  "tasks with dates",
  "maintenance",
  "shifts",
  "deliveries",
  "scheduled events",
]) {
  assert.ok(
    calendarDiscoverySkill._use_cases?.includes(useCase),
    `xcalendar use cases must include ${useCase}`
  );
}
assert.deepEqual(calendarDiscoverySkill._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.equal(calendarDiscoverySkill._presentation?._kind, "collection");
assert.equal(calendarDiscoverySkill._presentation?._mode, "calendar");

const kanbanDiscoverySkill = objectSkills.xkanban;
assert.ok(kanbanDiscoverySkill, "xkanban must be enumerable from package-level skills");
assert.equal(kanbanDiscoverySkill._id, "xkanban");
assert.equal(kanbanDiscoverySkill._type, "view-skill");
assert.equal(kanbanDiscoverySkill._category, "collection-presentation");
assert.equal(
  kanbanDiscoverySkill._purpose,
  "grouped Kanban/card-board presentation"
);
assert.deepEqual(kanbanDiscoverySkill._bindings?._collection, [
  "_data_source",
  "_items",
]);
assert.deepEqual(kanbanDiscoverySkill._bindings?._group, [
  "_group_by",
  "_columns",
]);
assert.deepEqual(kanbanDiscoverySkill._bindings?._group_by, ["_group_by"]);
for (const alias of [
  "kanban",
  "board",
  "workflow board",
  "pipeline",
  "grouped cards",
  "cards by status",
]) {
  assert.ok(
    kanbanDiscoverySkill._aliases?.includes(alias),
    `xkanban aliases must include ${alias}`
  );
}
for (const useCase of [
  "task status",
  "CRM stages",
  "issues",
  "orders by stage",
  "workflow/pipeline records",
]) {
  assert.ok(
    kanbanDiscoverySkill._use_cases?.includes(useCase),
    `xkanban use cases must include ${useCase}`
  );
}
assert.deepEqual(kanbanDiscoverySkill._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.equal(kanbanDiscoverySkill._presentation?._kind, "collection");
assert.equal(kanbanDiscoverySkill._presentation?._mode, "kanban");
assert.deepEqual(listDiscoverySkill._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.equal(listDiscoverySkill._presentation?._kind, "collection");
assert.equal(listDiscoverySkill._presentation?._mode, "list");
for (const keyword of [
  "list",
  "record list",
  "rich list",
  "compact list",
  "feed",
  "contacts",
  "notifications",
  "messages",
  "orders",
]) {
  assert.ok(
    listDiscoverySkill._match?._keywords?.includes(keyword),
    `xlist match keywords must include ${keyword}`
  );
}
for (const keyword of [
  "kanban",
  "board",
  "columns",
  "grouped",
  "group by",
  "workflow board",
  "grouped cards",
  "cards by status",
]) {
  assert.ok(
    kanbanDiscoverySkill._match?._keywords?.includes(keyword),
    `xkanban match keywords must include ${keyword}`
  );
}
for (const keyword of [
  "timeline",
  "activity timeline",
  "history",
  "activity",
  "chronological",
  "event history",
  "events",
  "activity history",
  "order history",
  "maintenance history",
  "milestones",
  "event feeds",
  "date",
  "time",
]) {
  assert.ok(
    timelineDiscoverySkill._match?._keywords?.includes(keyword),
    `xtimeline match keywords must include ${keyword}`
  );
}
for (const keyword of [
  "calendar",
  "schedule",
  "planner",
  "month view",
  "agenda",
  "date view",
  "appointments",
  "scheduled events",
  "date",
]) {
  assert.ok(
    calendarDiscoverySkill._match?._keywords?.includes(keyword),
    `xcalendar match keywords must include ${keyword}`
  );
}
for (const keyword of ["gallery", "cards", "card-grid", "grid", "tiles"]) {
  assert.ok(
    galleryDiscoverySkill._match?._keywords?.includes(keyword),
    `xgallery match keywords must include ${keyword}`
  );
}

assert.deepEqual(Object.keys(collectionPresentationSkills).sort(), [
  "xcalendar",
  "xgallery",
  "xkanban",
  "xlist",
  "xtimeline",
]);
assert.equal(collectionPresentationSkills.xgallery?._id, galleryDiscoverySkill._id);
assert.equal(collectionPresentationSkills.xlist?._id, listDiscoverySkill._id);
assert.equal(collectionPresentationSkills.xtimeline?._id, timelineDiscoverySkill._id);
assert.equal(collectionPresentationSkills.xcalendar?._id, calendarDiscoverySkill._id);
assert.equal(collectionPresentationSkills.xkanban?._id, kanbanDiscoverySkill._id);

const statsDiscoverySkill = objectSkills.xstats;
assert.ok(statsDiscoverySkill, "xstats must be enumerable from package-level skills");
assert.equal(statsDiscoverySkill._id, "xstats");
assert.equal(statsDiscoverySkill._type, "view-skill");
assert.equal(statsDiscoverySkill._category, "data-summary");
assert.equal(
  statsDiscoverySkill._purpose,
  "generic data-bound summary metrics for record collections"
);
assert.deepEqual(statsDiscoverySkill._bindings?._collection, [
  "_data_source",
  "_records",
]);
assert.deepEqual(statsDiscoverySkill._bindings?._metrics, ["_items"]);
assert.deepEqual(statsDiscoverySkill._bindings?._aggregations, [
  "_items._aggregate",
  "_items._field",
  "_items._filter",
]);
for (const capability of ["collection-summary", "record-aggregates", "count", "sum", "average", "min", "max"]) {
  assert.ok(
    statsDiscoverySkill._capabilities?.includes(capability),
    `xstats capabilities must include ${capability}`
  );
}
for (const alias of ["stats", "statistics", "metrics", "summary", "KPI", "counters"]) {
  assert.ok(
    statsDiscoverySkill._aliases?.includes(alias),
    `xstats aliases must include ${alias}`
  );
}
for (const useCase of [
  "record totals",
  "filtered counters",
  "numeric summaries",
  "dashboard KPIs",
  "collection overview",
]) {
  assert.ok(
    statsDiscoverySkill._use_cases?.includes(useCase),
    `xstats use cases must include ${useCase}`
  );
}
assert.equal(statsDiscoverySkill._presentation?._kind, "summary");
assert.equal(statsDiscoverySkill._presentation?._mode, "stats");
assert.ok(
  statsDiscoverySkill._usage?.some((line) => line.includes("complements collection presentations")),
  "xstats usage must describe complementary collection-presentation behavior"
);
assert.deepEqual(Object.keys(dataSummarySkills).sort(), ["xstats"]);
assert.equal(dataSummarySkills.xstats?._id, statsDiscoverySkill._id);

const paletteTitles = new Set();

for (const [type, objectClass] of entries) {
  const skill = objectClass._skill;
  assert.ok(skill, `${type} must expose static _skill`);
  assert.equal(skill._id, type, `${type} skill id must match _type`);

  const design = skill._design;
  assert.ok(design, `${type} must expose _skill._design`);

  const palette = design._palette;
  assert.ok(palette, `${type} must expose _design._palette`);
  assert.equal(palette._default_object?._type, type, `${type} default object _type must match registry key`);
  assert.ok(palette._title, `${type} palette title is required`);
  assert.ok(!paletteTitles.has(palette._title), `${type} palette title must be unique`);
  paletteTitles.add(palette._title);
  assert.ok(validCategories.has(palette._category), `${type} palette category is invalid`);
  assert.equal(typeof palette._icon, "string", `${type} palette icon is required`);

  assertCanonicalImageSlots(type, palette._default_object);
  assert.doesNotThrow(() => XUI.create(palette._default_object), `${type} palette default must be creatable`);

  const inspector = design._inspector;
  assert.ok(inspector, `${type} must expose inspector metadata`);
  assert.ok(Array.isArray(inspector._fields), `${type} inspector fields must be an array`);
  assert.ok(inspector._fields.length > 0, `${type} inspector fields must not be empty`);
  assert.ok(Array.isArray(inspector._sections), `${type} inspector sections must be an array`);
  inspector._sections.forEach((section) => {
    assert.ok(validSections.has(section), `${type} inspector section ${section} is invalid`);
  });

  const allowedKeys = new Set(supportedInspectorKeys[type]);
  const seenKeys = new Set();
  for (const inspectorField of inspector._fields) {
    assert.equal(typeof inspectorField._key, "string", `${type} inspector field key is required`);
    assert.ok(!seenKeys.has(inspectorField._key), `${type} duplicate inspector key ${inspectorField._key}`);
    seenKeys.add(inspectorField._key);
    assert.ok(allowedKeys.has(inspectorField._key), `${type} exposes unsupported inspector key ${inspectorField._key}`);
    assert.ok(!internalFieldPattern.test(inspectorField._key), `${type} exposes internal field ${inspectorField._key}`);
    assert.ok(validInputs.has(inspectorField._input), `${type}.${inspectorField._key} has invalid input ${inspectorField._input}`);
    if (inspectorField._input === "select") {
      assert.ok(Array.isArray(inspectorField._options), `${type}.${inspectorField._key} select field needs options`);
      assert.ok(inspectorField._options.length > 0, `${type}.${inspectorField._key} select options must not be empty`);
      inspectorField._options.forEach((option) => {
        assert.equal(typeof option, "string", `${type}.${inspectorField._key} select options must be strings`);
      });
    }
  }

  const children = design._children;
  assert.ok(children, `${type} must expose child metadata`);
  assert.equal(children._allowed, expectedChildrenAllowed[type], `${type} child allowance is wrong`);
  assert.ok(Array.isArray(children._insert_modes), `${type} insert modes must be an array`);
  if (children._allowed) {
    assert.ok(children._insert_modes.includes("inside"), `${type} containers must support inside insertion`);
    assert.ok(Array.isArray(children._accepted_types), `${type} containers need accepted child types`);
    assert.ok(children._accepted_types.length > 0, `${type} accepted child types must not be empty`);
  } else {
    assert.ok(!children._insert_modes.includes("inside"), `${type} leaf objects must not support inside insertion`);
  }
}

const kanbanObjectClass = objects.xkanban;
const kanbanDesign = kanbanObjectClass._skill._design;
assert.equal(kanbanObjectClass._xtype, "xkanban");
assert.equal(kanbanDesign._palette._default_object._type, "xkanban");
assert.equal(kanbanDesign._palette._category, "Data Display");
assert.deepEqual(kanbanDesign._children._insert_modes, ["before", "after"]);

const kanbanInspectorKeys = new Set(
  kanbanDesign._inspector._fields.map((field) => field._key)
);
for (const key of [
  "_data_source",
  "_group_by",
  "_columns",
  "_item",
  "_actions",
  "_empty",
  "_empty_text",
  "_empty_column_text",
  "_draggable",
  "_on_data",
]) {
  assert.ok(kanbanInspectorKeys.has(key), `xkanban inspector must expose ${key}`);
}
assert.ok(!kanbanInspectorKeys.has("_on_select"), "runtime _on_select must not be exposed in Inspector");
assert.ok(!kanbanInspectorKeys.has("_on_card_moved"), "runtime _on_card_moved must not be exposed in Inspector");

const listObjectClass = objects.xlist;
assert.equal(listObjectClass._skill._id, "xlist");
assert.equal(listObjectClass._skill._category, "collection-presentation");
assert.equal(
  listObjectClass._skill._purpose,
  "compact/rich vertical presentation of record collections"
);
assert.deepEqual(listObjectClass._skill._presentation._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
const listDesign = listObjectClass._skill._design;
assert.equal(listObjectClass._xtype, "xlist");
assert.equal(listDesign._palette._default_object._type, "xlist");
assert.equal(listDesign._palette._category, "Data Display");
assert.deepEqual(listDesign._children._insert_modes, ["before", "after"]);
assert.equal(listDesign._children._allowed, false);

const listInspectorKeys = new Set(
  listDesign._inspector._fields.map((field) => field._key)
);
for (const key of [
  "_items",
  "_data_source",
  "_item",
  "_actions",
  "_row_key",
  "_empty",
  "_empty_text",
  "_dense",
  "_selectable",
  "_selected_key",
  "_gap",
  "_on_data",
  "class",
]) {
  assert.ok(listInspectorKeys.has(key), `xlist inspector must expose ${key}`);
}
assert.ok(!listInspectorKeys.has("_on_select"), "runtime _on_select must not be exposed in Inspector");
assert.deepEqual(listDesign._inspector._sections, [
  "properties",
  "interactions",
  "raw-json",
]);
assert.doesNotThrow(() => XUI.create(listDesign._palette._default_object));

const timelineObjectClass = objects.xtimeline;
assert.equal(timelineObjectClass._skill._id, "xtimeline");
assert.equal(timelineObjectClass._skill._category, "collection-presentation");
assert.equal(
  timelineObjectClass._skill._purpose,
  "chronological/time-based presentation of records"
);
const timelineDesign = timelineObjectClass._skill._design;
assert.equal(timelineObjectClass._xtype, "xtimeline");
assert.equal(timelineDesign._palette._default_object._type, "xtimeline");
assert.equal(timelineDesign._palette._category, "Data Display");
assert.equal(timelineDesign._palette._default_object._date_field, "created_at");
assert.equal(timelineDesign._palette._default_object._order, "desc");
assert.deepEqual(timelineDesign._children._insert_modes, ["before", "after"]);
assert.equal(timelineDesign._children._allowed, false);

const timelineInspectorKeys = new Set(
  timelineDesign._inspector._fields.map((field) => field._key)
);
for (const key of [
  "_items",
  "_data_source",
  "_date_field",
  "_order",
  "_item",
  "_actions",
  "_row_key",
  "_selectable",
  "_selected_key",
  "_empty",
  "_empty_text",
  "_undated_text",
  "_on_data",
  "class",
]) {
  assert.ok(timelineInspectorKeys.has(key), `xtimeline inspector must expose ${key}`);
}
assert.ok(!timelineInspectorKeys.has("_on_select"), "runtime _on_select must not be exposed in Inspector");
assert.doesNotThrow(() => XUI.create(timelineDesign._palette._default_object));

const calendarObjectClass = objects.xcalendar;
assert.equal(calendarObjectClass._skill._id, "xcalendar");
assert.equal(calendarObjectClass._skill._category, "collection-presentation");
assert.equal(
  calendarObjectClass._skill._purpose,
  "date-oriented calendar/schedule presentation of records"
);
const calendarDesign = calendarObjectClass._skill._design;
assert.equal(calendarObjectClass._xtype, "xcalendar");
assert.equal(calendarDesign._palette._default_object._type, "xcalendar");
assert.equal(calendarDesign._palette._category, "Data Display");
assert.equal(calendarDesign._palette._default_object._date_field, "start_at");
assert.equal(calendarDesign._palette._default_object._end_date_field, "end_at");
assert.equal(calendarDesign._palette._default_object._view, "month");
assert.equal(calendarDesign._palette._default_object._month, "2026-08");
assert.deepEqual(calendarDesign._children._insert_modes, ["before", "after"]);
assert.equal(calendarDesign._children._allowed, false);

const calendarInspectorKeys = new Set(
  calendarDesign._inspector._fields.map((field) => field._key)
);
for (const key of [
  "_items",
  "_data_source",
  "_date_field",
  "_end_date_field",
  "_view",
  "_month",
  "_week_start",
  "_item",
  "_actions",
  "_row_key",
  "_selectable",
  "_selected_key",
  "_empty",
  "_empty_text",
  "_on_data",
  "class",
]) {
  assert.ok(calendarInspectorKeys.has(key), `xcalendar inspector must expose ${key}`);
}
assert.ok(!calendarInspectorKeys.has("_on_select"), "runtime _on_select must not be exposed in Inspector");
assert.doesNotThrow(() => XUI.create(calendarDesign._palette._default_object));

const statsObjectClass = objects.xstats;
assert.equal(statsObjectClass._skill._id, "xstats");
assert.equal(statsObjectClass._skill._category, "data-summary");
assert.equal(
  statsObjectClass._skill._purpose,
  "generic data-bound summary metrics for record collections"
);
const statsDesign = statsObjectClass._skill._design;
assert.equal(statsObjectClass._xtype, "xstats");
assert.equal(statsDesign._palette._default_object._type, "xstats");
assert.equal(statsDesign._palette._category, "Metrics");
assert.equal(statsDesign._palette._default_object._data_source, "records.records");
assert.equal(statsDesign._palette._default_object._items[0]._aggregate, "count");
assert.equal(statsDesign._palette._default_object._items[1]._aggregate, "sum");
assert.equal(statsDesign._palette._default_object._items[1]._field, "amount");
assert.deepEqual(statsDesign._children._insert_modes, ["before", "after"]);
assert.equal(statsDesign._children._allowed, false);

const statsInspectorKeys = new Set(
  statsDesign._inspector._fields.map((field) => field._key)
);
for (const key of [
  "_data_source",
  "_records",
  "_items",
  "_min_col_width",
  "_gap",
  "_empty",
  "_empty_text",
  "_on_data",
  "class",
]) {
  assert.ok(statsInspectorKeys.has(key), `xstats inspector must expose ${key}`);
}
assert.doesNotThrow(() => XUI.create(statsDesign._palette._default_object));

console.log("xdashboard skill design metadata passed");
