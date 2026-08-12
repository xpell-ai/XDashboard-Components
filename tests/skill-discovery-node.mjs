import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

assert.equal(typeof globalThis.window, "undefined");
assert.equal(typeof globalThis.document, "undefined");

const {
  XDashboardObjectSkills,
  getXDashboardObjectSkills,
  getXDashboardObjectSkillsByCategory,
} = await import("../dist/skills.js");

assert.equal(typeof globalThis.window, "undefined");
assert.equal(typeof globalThis.document, "undefined");

const skills = getXDashboardObjectSkills();
const collectionSkills = getXDashboardObjectSkillsByCategory("collection-presentation");
const dataSummarySkills = getXDashboardObjectSkillsByCategory("data-summary");
const gallery = skills.xgallery;
const list = skills.xlist;
const timeline = skills.xtimeline;
const calendar = skills.xcalendar;
const kanban = skills.xkanban;
const stats = skills.xstats;

assert.ok(gallery, "xgallery skill must be package-level enumerable");
assert.equal(gallery._id, "xgallery");
assert.equal(gallery._category, "collection-presentation");
assert.equal(gallery._purpose, "Render record collections as cards/gallery");
assert.deepEqual(gallery._bindings?._collection, ["_data_source", "_items"]);

for (const alias of ["gallery", "cards", "card-grid", "grid", "tiles"]) {
  assert.ok(gallery._aliases?.includes(alias), `missing alias ${alias}`);
}

assert.equal(XDashboardObjectSkills.xgallery?._id, "xgallery");
assert.ok(list, "xlist skill must be package-level enumerable");
assert.equal(list._id, "xlist");
assert.equal(list._category, "collection-presentation");
assert.equal(list._purpose, "compact/rich vertical presentation of record collections");
assert.deepEqual(list._bindings?._collection, ["_data_source", "_items"]);
assert.deepEqual(list._bindings?._item, [
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
assert.deepEqual(list._bindings?._actions, ["_item._actions", "_actions"]);
for (const alias of ["list", "rich list", "compact list", "record list", "rows", "feed"]) {
  assert.ok(list._aliases?.includes(alias), `missing xlist alias ${alias}`);
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
  assert.ok(list._use_cases?.includes(useCase), `missing xlist use case ${useCase}`);
}
assert.deepEqual(list._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.equal(list._presentation?._kind, "collection");
assert.equal(list._presentation?._mode, "list");
assert.equal(XDashboardObjectSkills.xlist?._id, "xlist");
assert.ok(timeline, "xtimeline skill must be package-level enumerable");
assert.equal(timeline._id, "xtimeline");
assert.equal(timeline._category, "collection-presentation");
assert.equal(
  timeline._purpose,
  "chronological/time-based presentation of records"
);
assert.deepEqual(timeline._bindings?._collection, ["_data_source", "_items"]);
assert.deepEqual(timeline._bindings?._date, ["_date_field"]);
assert.deepEqual(timeline._bindings?._sort, ["_order"]);
assert.deepEqual(timeline._bindings?._actions, ["_item._actions", "_actions"]);
assert.deepEqual(timeline._bindings?._events, ["xtimeline:item-select", "_on_select"]);
for (const capability of ["temporal-records", "history-view"]) {
  assert.ok(timeline._capabilities?.includes(capability), `missing xtimeline capability ${capability}`);
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
  assert.ok(timeline._aliases?.includes(alias), `missing xtimeline alias ${alias}`);
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
  assert.ok(timeline._use_cases?.includes(useCase), `missing xtimeline use case ${useCase}`);
}
assert.deepEqual(timeline._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.equal(timeline._presentation?._mode, "timeline");
assert.equal(XDashboardObjectSkills.xtimeline?._id, "xtimeline");
assert.ok(calendar, "xcalendar skill must be package-level enumerable");
assert.equal(calendar._id, "xcalendar");
assert.equal(calendar._category, "collection-presentation");
assert.equal(
  calendar._purpose,
  "date-oriented calendar/schedule presentation of records"
);
assert.deepEqual(calendar._bindings?._collection, ["_data_source", "_items"]);
assert.deepEqual(calendar._bindings?._date, ["_date_field"]);
assert.deepEqual(calendar._bindings?._start_date, ["_date_field"]);
assert.deepEqual(calendar._bindings?._end_date, ["_end_date_field"]);
assert.deepEqual(calendar._bindings?._view, ["_view"]);
assert.deepEqual(calendar._bindings?._actions, ["_item._actions", "_actions"]);
assert.deepEqual(calendar._bindings?._events, ["xcalendar:item-select", "xcalendar:month-change", "_on_select"]);
for (const capability of ["date-layout", "scheduled-records"]) {
  assert.ok(calendar._capabilities?.includes(capability), `missing xcalendar capability ${capability}`);
}
for (const alias of [
  "calendar",
  "schedule",
  "planner",
  "month view",
  "agenda",
  "date view",
]) {
  assert.ok(calendar._aliases?.includes(alias), `missing xcalendar alias ${alias}`);
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
  assert.ok(calendar._use_cases?.includes(useCase), `missing xcalendar use case ${useCase}`);
}
assert.deepEqual(calendar._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.equal(calendar._presentation?._mode, "calendar");
assert.equal(XDashboardObjectSkills.xcalendar?._id, "xcalendar");
assert.ok(kanban, "xkanban skill must be package-level enumerable");
assert.equal(kanban._id, "xkanban");
assert.equal(kanban._category, "collection-presentation");
assert.equal(kanban._purpose, "grouped Kanban/card-board presentation");
assert.deepEqual(kanban._bindings?._collection, ["_data_source", "_items"]);
assert.deepEqual(kanban._bindings?._group, ["_group_by", "_columns"]);
assert.deepEqual(kanban._bindings?._group_by, ["_group_by"]);
for (const alias of [
  "kanban",
  "board",
  "workflow board",
  "pipeline",
  "grouped cards",
  "cards by status",
]) {
  assert.ok(kanban._aliases?.includes(alias), `missing xkanban alias ${alias}`);
}
for (const useCase of [
  "task status",
  "CRM stages",
  "issues",
  "orders by stage",
  "workflow/pipeline records",
]) {
  assert.ok(kanban._use_cases?.includes(useCase), `missing xkanban use case ${useCase}`);
}
assert.deepEqual(kanban._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.deepEqual(gallery._presentation?._alternatives, [
  "table",
  "xgallery",
  "xlist",
  "xkanban",
  "xtimeline",
  "xcalendar",
]);
assert.equal(XDashboardObjectSkills.xkanban?._id, "xkanban");
assert.deepEqual(Object.keys(collectionSkills).sort(), [
  "xcalendar",
  "xgallery",
  "xkanban",
  "xlist",
  "xtimeline",
]);
assert.equal(collectionSkills.xgallery?._id, "xgallery");
assert.equal(collectionSkills.xlist?._id, "xlist");
assert.equal(collectionSkills.xtimeline?._id, "xtimeline");
assert.equal(collectionSkills.xcalendar?._id, "xcalendar");
assert.equal(collectionSkills.xkanban?._id, "xkanban");
assert.ok(stats, "xstats skill must be package-level enumerable");
assert.equal(stats._id, "xstats");
assert.equal(stats._category, "data-summary");
assert.equal(stats._purpose, "generic data-bound summary metrics for record collections");
assert.deepEqual(stats._bindings?._collection, ["_data_source", "_records"]);
assert.deepEqual(stats._bindings?._metrics, ["_items"]);
assert.deepEqual(stats._bindings?._aggregations, [
  "_items._aggregate",
  "_items._field",
  "_items._filter",
]);
for (const capability of ["collection-summary", "record-aggregates", "count", "sum", "average", "min", "max"]) {
  assert.ok(stats._capabilities?.includes(capability), `missing xstats capability ${capability}`);
}
for (const alias of ["stats", "statistics", "metrics", "summary", "KPI", "counters"]) {
  assert.ok(stats._aliases?.includes(alias), `missing xstats alias ${alias}`);
}
assert.equal(stats._presentation?._kind, "summary");
assert.equal(stats._presentation?._mode, "stats");
assert.ok(
  stats._usage?.some((line) => line.includes("complements collection presentations")),
  "xstats must describe complementary collection-presentation behavior"
);
assert.deepEqual(Object.keys(dataSummarySkills).sort(), ["xstats"]);
assert.equal(dataSummarySkills.xstats?._id, "xstats");
assert.equal(XDashboardObjectSkills.xstats?._id, "xstats");
assert.equal(typeof globalThis.window, "undefined");
assert.equal(typeof globalThis.document, "undefined");

const xskillsSource = readFileSync(new URL("../src/xskills.ts", import.meta.url), "utf8");
assert.ok(
  xskillsSource.includes("Object.entries(xdashboardObjectSkillSource)"),
  "discovery must enumerate the generic skill source registry"
);
assert.ok(
  !/if\s*\([^)]*xkanban/i.test(xskillsSource),
  "discovery must not branch specifically for xkanban"
);
assert.ok(
  !/case\s+['"]xkanban['"]/i.test(xskillsSource),
  "discovery must not switch specifically on xkanban"
);
assert.ok(
  !/if\s*\([^)]*xlist/i.test(xskillsSource),
  "discovery must not branch specifically for xlist"
);
assert.ok(
  !/case\s+['"]xlist['"]/i.test(xskillsSource),
  "discovery must not switch specifically on xlist"
);
assert.ok(
  !/if\s*\([^)]*xtimeline/i.test(xskillsSource),
  "discovery must not branch specifically for xtimeline"
);
assert.ok(
  !/case\s+['"]xtimeline['"]/i.test(xskillsSource),
  "discovery must not switch specifically on xtimeline"
);
assert.ok(
  !/if\s*\([^)]*xcalendar/i.test(xskillsSource),
  "discovery must not branch specifically for xcalendar"
);
assert.ok(
  !/case\s+['"]xcalendar['"]/i.test(xskillsSource),
  "discovery must not switch specifically on xcalendar"
);
assert.ok(
  !/if\s*\([^)]*xstats/i.test(xskillsSource),
  "discovery must not branch specifically for xstats"
);
assert.ok(
  !/case\s+['"]xstats['"]/i.test(xskillsSource),
  "discovery must not switch specifically on xstats"
);

console.log("xdashboard package skill discovery metadata passed");
