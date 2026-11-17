import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const css = readFileSync(join(root, "src/style/xcomposition.css"), "utf8");
const styleEntry = readFileSync(join(root, "src/style/style.css"), "utf8");
const xcomp = readFileSync(join(root, "src/xcomp.ts"), "utf8");
const xdesign = readFileSync(join(root, "src/xdesign.ts"), "utf8");
const xskills = readFileSync(join(root, "src/xskills.ts"), "utf8");

assert.ok(styleEntry.includes('@import "./xcomposition.css";'));

for (const type of ["XShell", "XPage", "XPageHeader"]) {
  assert.ok(xcomp.includes(type), `${type} must be registered in XDashPack`);
}

for (const token of ["--xd-", "--xpell-"]) {
  assert.equal(css.includes(token), false, `composition CSS must not introduce ${token}`);
}

assert.ok(css.includes(".xshell"));
assert.ok(css.includes("height:100vh"), "xshell must establish viewport containment");
assert.ok(css.includes(".xshell__main"));
assert.ok(css.includes("overflow-y:auto"), "shell main must own vertical scroll by default");
assert.ok(css.includes("overflow-x:hidden"), "shell main must prevent normal horizontal overflow");
assert.ok(css.includes(".xshell--body-flow"), "shell must support non-scroll body flow");
assert.ok(css.includes(".xshell--with-sidebar"), "shell must support sidebar composition");

for (const width of ["full", "contained", "readable"]) {
  assert.ok(css.includes(`.xpage--width-${width}`), `xpage width ${width} missing`);
}
assert.ok(css.includes("--x-page-padding-x"));
assert.ok(css.includes("--x-page-padding-y"));
assert.ok(css.includes("--x-page-max-width"));
assert.ok(css.includes("--x-page-readable-width"));
assert.ok(css.includes("--x-section-gap"));
assert.ok(css.includes("--x-content-gap"));

assert.ok(css.includes(".xpage-header"));
assert.ok(css.includes("--x-type-page-title-size"));
assert.ok(css.includes("--x-type-page-subtitle-size"));
assert.ok(css.includes("@media (max-width: 760px)"));
assert.ok(css.includes("flex-direction:column"), "mobile header/sidebar stacking must be present");

for (const metadata of [
  `xshell: design(`,
  `xpage: design(`,
  `"xpage-header": design(`,
  `selectField("_width", "Width", "Page width mode.", ["full", "contained", "readable"], { _group: "design" })`,
  `selectField("_density", "Density", "Page rhythm density.", ["compact", "comfortable", "spacious"])`,
  `selectField("_density", "Density", "Header spacing density.", ["compact", "comfortable", "spacious"])`,
  `const pageHeaderSemanticChildren`,
  `semanticProperty("title", "Title", "title", "_title")`,
  `semanticObjectArray("actions", "Actions", "actions", "_actions")`,
]) {
  assert.ok(xdesign.includes(metadata), `metadata missing ${metadata}`);
}

for (const skill of ["XSHELL_SKILL", "XPAGE_SKILL", "XPAGE_HEADER_SKILL"]) {
  assert.ok(xskills.includes(skill), `skill discovery missing ${skill}`);
}
assert.ok(xskills.includes('getXDashboardObjectSkillsByCategory'));

const fixture = join(root, "docs/fixtures/xdashboard-2026-composition.html");
assert.ok(existsSync(fixture), "representative composition fixture missing");
const fixtureHtml = readFileSync(fixture, "utf8");
for (const token of [
  'data-theme="xdashboard-2026-light"',
  'data-theme="xdashboard-2026-dark"',
  "xshell xshell--with-sidebar xshell--main-scroll",
  "xpage xpage--width-contained",
  "xpage-header",
  "xtoolbar",
  "xsection",
  "xlist",
  "xtimeline",
]) {
  assert.ok(fixtureHtml.includes(token), `fixture missing ${token}`);
}

console.log("xdashboard 2026 composition contract passed");
