import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const css = (name) => readFileSync(join(root, "src/style", name), "utf8");

const xsection = css("xsection.css");
const xcard = css("xcard.css");
const xkpi = css("xkpicard.css");
const xempty = css("xempty.css");
const xtoolbar = css("xtoolbar.css");
const xstack = css("xstack.css");
const xgrid = css("xgrid.css");
const xigroup = css("xigroup.css");
const xdivider = css("xdivider.css");
const xdesign = readFileSync(join(root, "src/xdesign.ts"), "utf8");

for (const variant of ["plain", "subtle", "card"]) {
  assert.ok(
    xsection.includes(`.xsection--variant-${variant} .xsection__container`),
    `xsection ${variant} must style actual visual container`
  );
}
for (const density of ["compact", "comfortable", "spacious"]) {
  assert.ok(xsection.includes(`xsection--density-${density}`));
}
assert.ok(xsection.includes('[data-theme="xdashboard-2026-light"] .xsection'));
assert.ok(xsection.includes("--x-type-section-title-size"));
assert.ok(xsection.includes("--x-type-section-subtitle-size"));

for (const variant of ["default", "interactive", "elevated"]) {
  assert.ok(xcard.includes(`xcard--variant-${variant}`), `card missing ${variant}`);
}
assert.ok(xcard.includes(":focus-within"));

for (const source of [xkpi, xtoolbar]) {
  assert.ok(source.includes("--x-border-subtle"));
  assert.ok(source.includes("--x-type-") || source.includes("--x-control-height"));
}
assert.ok(xempty.includes("--x-type-title-line-height"));
assert.ok(xempty.includes("--x-density-comfortable-padding"));
assert.ok(xkpi.includes("--xkpi-value-size"));
assert.ok(xkpi.includes("xkpi-card--variant-interactive"));

for (const variant of ["inline", "section", "page"]) {
  assert.ok(xempty.includes(`xempty--variant-${variant}`));
}
assert.equal(xempty.includes("dashed"), false, "empty must not require dashed borders");

for (const variant of ["plain", "subtle", "sticky"]) {
  assert.ok(xtoolbar.includes(`xtoolbar--variant-${variant}`));
}
assert.ok(xtoolbar.includes("@media (max-width: 640px)"));

for (const density of ["compact", "comfortable", "spacious"]) {
  assert.ok(xstack.includes(`xstack--density-${density}`));
  assert.ok(xgrid.includes(`xgrid--density-${density}`));
  assert.ok(xigroup.includes(`xigroup--density-${density}`));
}

const xstackBase = xstack.match(/\.xstack\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
const xgridBase = xgrid.match(/\.xgrid\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
assert.equal(/background\s*:|box-shadow\s*:|border\s*:/.test(xstackBase), false);
assert.equal(/background\s*:|box-shadow\s*:|border\s*:/.test(xgridBase), false);
assert.ok(xgrid.includes("min(var(--x-grid-min-col), 100%)"));

assert.ok(xigroup.includes("flex-wrap:wrap"));
assert.ok(xigroup.includes("xigroup--variant-subtle"));
assert.ok(xdivider.includes('[data-theme="xdashboard-2026-light"] .xdivider'));
assert.ok(xdivider.includes("var(--x-divider, var(--x-border-subtle"));

for (const metadata of [
  `selectField("_variant", "Variant", "Section surface variant.", ["plain", "subtle", "card"])`,
  `selectField("_variant", "Variant", "Card variant.", ["default", "interactive", "elevated"])`,
  `selectField("_variant", "Variant", "Empty-state scope.", ["inline", "section", "page"])`,
  `selectField("_density", "Density", "Toolbar density.", ["compact", "comfortable", "spacious"])`,
]) {
  assert.ok(xdesign.includes(metadata), `metadata missing ${metadata}`);
}

const fixture = join(root, "docs/fixtures/xdashboard-2026-core.html");
assert.ok(existsSync(fixture), "representative 2026 fixture missing");
const fixtureHtml = readFileSync(fixture, "utf8");
assert.ok(fixtureHtml.includes('data-theme="xdashboard-2026-light"'));
assert.ok(fixtureHtml.includes('data-theme="xdashboard-2026-dark"'));

console.log("xdashboard 2026 core component contract passed");
