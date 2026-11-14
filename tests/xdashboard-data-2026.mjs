import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const css = (name) => readFileSync(join(root, "src/style", name), "utf8");
const src = (name) => readFileSync(join(root, "src", name), "utf8");

const xtable = css("xtable.css");
const xlist = css("xlist.css");
const xgallery = css("xgallery.css");
const xkanban = css("xkanban.css");
const xtimeline = css("xtimeline.css");
const xcalendar = css("xcalendar.css");
const xstats = css("xstats.css");
const xdesign = src("xdesign.ts");

for (const file of readdirSync(join(root, "src/style")).filter((name) => name.endsWith(".css"))) {
  const source = css(file);
  assert.equal(source.includes("--xd-"), false, `${file} must not introduce --xd-* tokens`);
  assert.equal(source.includes("--xpell-"), false, `${file} must not introduce --xpell-* tokens`);
}

assert.ok(xtable.includes("overflow-x:auto"), "table must contain horizontal overflow");
assert.ok(xtable.includes("-webkit-overflow-scrolling:touch"), "table scroll must be mobile-friendly");
assert.ok(xtable.includes('[data-theme="xdashboard-2026-light"] .xtable__table'));
assert.ok(xtable.includes("border-collapse:separate"));
assert.ok(xtable.includes("var(--x-border-subtle"));
assert.ok(xtable.includes("xtable--density-compact"));
assert.ok(xtable.includes("xtable--density-comfortable"));
assert.ok(xtable.includes("xtable--density-spacious"));
assert.ok(xtable.includes("xtable--bordered .xtable__table"));
assert.ok(xtable.includes("xtable--striped"));
assert.ok(xtable.includes("xtable--hover"));
assert.ok(xtable.includes("tr[aria-selected=\"true\"]"));
assert.ok(xtable.includes("--x-focus-ring"));

for (const variant of ["plain", "subtle", "card"]) {
  assert.ok(xlist.includes(`xlist--variant-${variant}`), `xlist missing ${variant}`);
  assert.ok(xgallery.includes(`xgallery--variant-${variant}`), `xgallery missing ${variant}`);
}
for (const density of ["compact", "comfortable", "spacious"]) {
  assert.ok(xlist.includes(`xlist--density-${density}`), `xlist density ${density}`);
  assert.ok(xgallery.includes(`xgallery--density-${density}`), `xgallery density ${density}`);
  assert.ok(xkanban.includes(`xkanban--density-${density}`), `xkanban density ${density}`);
  assert.ok(xtimeline.includes(`xtimeline--density-${density}`), `xtimeline density ${density}`);
  assert.ok(xcalendar.includes(`xcalendar--density-${density}`), `xcalendar density ${density}`);
  assert.ok(xstats.includes(`xstats--density-${density}`), `xstats density ${density}`);
}

assert.ok(xlist.includes("xlist__item--selectable:hover"));
assert.ok(xlist.includes("xlist__item--selected"));
assert.ok(xlist.includes("--x-focus-ring"));
assert.ok(xgallery.includes("@media (max-width: 640px)"));
assert.ok(xgallery.includes("grid-template-columns:1fr"));
assert.ok(xgallery.includes("var(--x-shadow-xs"));

assert.ok(xkanban.includes("overflow-x:auto"));
assert.ok(xkanban.includes("xkanban__column-empty"));
assert.ok(xkanban.includes("var(--x-border-subtle"));
assert.ok(xkanban.includes("var(--x-shadow-xs"));

assert.ok(xtimeline.includes("xtimeline__axis::before"));
assert.ok(xtimeline.includes("var(--x-border-subtle"));
assert.ok(xtimeline.includes("xtimeline__item--selected"));
assert.ok(xtimeline.includes("--x-focus-ring"));

assert.ok(xcalendar.includes("xcalendar__day--today"));
assert.ok(xcalendar.includes("xcalendar__event--selected"));
assert.ok(xcalendar.includes("min-width:560px"));
assert.ok(xcalendar.includes("overflow-x:auto"));
assert.ok(xcalendar.includes("var(--x-border-subtle"));

for (const variant of ["plain", "subtle", "card", "elevated"]) {
  assert.ok(xstats.includes(`xstats--variant-${variant}`), `xstats missing ${variant}`);
}
assert.ok(xstats.includes("--x-type-page-title-size"));
assert.ok(xstats.includes("repeat(auto-fit"));

for (const [file, expected] of [
  ["xtable.ts", ["buildCollectionRootClassName", "_variant", "_density", "_dense", "_bordered", "_striped", "_hover"]],
  ["xlist.ts", ["buildCollectionRootClassName", "applyCollectionTemplateStyle", "_variant", "_density", "_variant: \"section\""]],
  ["xgallery.ts", ["buildCollectionRootClassName", "applyCollectionTemplateStyle", "_variant", "_density", "_variant: \"section\""]],
  ["xkanban.ts", ["buildCollectionRootClassName", "applyCollectionTemplateStyle", "_density", "_variant: \"inline\""]],
  ["xtimeline.ts", ["buildCollectionRootClassName", "applyCollectionTemplateStyle", "_density", "_variant: \"section\""]],
  ["xcalendar.ts", ["buildCollectionRootClassName", "applyCollectionTemplateStyle", "_density", "_variant: \"section\""]],
  ["xstats.ts", ["buildCollectionRootClassName", "_variant", "_density", "_variant: \"section\""]],
]) {
  const source = src(file);
  for (const token of expected) {
    assert.ok(source.includes(token), `${file} missing ${token}`);
  }
  assert.ok(source.includes("_data_source"), `${file} must preserve data source binding`);
  assert.ok(source.includes("_on_data"), `${file} must preserve data handlers`);
}

for (const metadata of [
  `selectField("_variant", "Variant", "Table surface variant.", ["plain", "subtle", "card"])`,
  `selectField("_density", "Density", "Table row density.", ["compact", "comfortable", "spacious"])`,
  `selectField("_variant", "Variant", "List surface variant.", ["plain", "subtle", "card"])`,
  `selectField("_variant", "Variant", "Gallery card surface variant.", ["plain", "subtle", "card"])`,
  `selectField("_density", "Density", "Kanban board density.", ["compact", "comfortable", "spacious"])`,
  `selectField("_density", "Density", "Timeline item density.", ["compact", "comfortable", "spacious"])`,
  `selectField("_density", "Density", "Calendar density.", ["compact", "comfortable", "spacious"])`,
  `selectField("_variant", "Variant", "Stats card surface variant.", ["plain", "subtle", "card", "elevated"])`,
]) {
  assert.ok(xdesign.includes(metadata), `design metadata missing ${metadata}`);
}

const fixture = join(root, "docs/fixtures/xdashboard-2026-data.html");
assert.ok(existsSync(fixture), "representative 2026 data fixture missing");
const fixtureHtml = readFileSync(fixture, "utf8");
for (const token of [
  'data-theme="xdashboard-2026-light"',
  'data-theme="xdashboard-2026-dark"',
  "xtable",
  "xlist",
  "xgallery",
  "xkanban",
  "xtimeline",
  "xcalendar",
  "xstats",
  "xtable--density-compact",
  "xlist--density-comfortable",
  "xgallery--variant-card",
  "xkanban--density-compact",
  "xcalendar__day--today",
  "xempty xempty--variant-section",
]) {
  assert.ok(fixtureHtml.includes(token), `fixture missing ${token}`);
}

console.log("xdashboard 2026 data component contract passed");
