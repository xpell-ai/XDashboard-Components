import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const cssDir = join(root, "src/style");
const foundation = readFileSync(join(cssDir, "xfoundation.css"), "utf8");
const publicCss = readFileSync(join(cssDir, "style.css"), "utf8");
const xcard = readFileSync(join(cssDir, "xcard.css"), "utf8");
const xtable = readFileSync(join(cssDir, "xtable.css"), "utf8");
const xtoolbar = readFileSync(join(cssDir, "xtoolbar.css"), "utf8");
const xfield = readFileSync(join(cssDir, "xfield.css"), "utf8");
const xsearch = readFileSync(join(cssDir, "xsearch.css"), "utf8");
const xselect = readFileSync(join(cssDir, "xselect.css"), "utf8");
const docs = readFileSync(join(root, "docs/xdashboard-2026-design-report.md"), "utf8");
const xuiCss = readFileSync(
  join(root, "../packages/xpell-ui/src/XUI/Style/xui.css"),
  "utf8"
);

assert.ok(publicCss.includes('@import "./xfoundation.css";'));

for (const token of [
  "--x-surface",
  "--x-surface-muted",
  "--x-surface-elevated",
  "--x-border-subtle",
  "--x-border-strong",
]) {
  assert.ok(foundation.includes(token), `foundation should consume ${token}`);
}

for (const forbidden of ["--xd-", "--xpell-"]) {
  for (const file of readdirSync(cssDir).filter((name) => name.endsWith(".css"))) {
    if (file === "xtest.css") continue;
    const source = readFileSync(join(cssDir, file), "utf8");
    assert.equal(
      source.includes(forbidden),
      false,
      `${file} must not introduce ${forbidden} tokens`
    );
  }
}

for (const surface of ["plain", "subtle", "card", "elevated"]) {
  assert.ok(
    foundation.includes(`.xdash-surface--${surface}`),
    `surface vocabulary missing ${surface}`
  );
  assert.ok(
    xcard.includes(`.xcard--variant-${surface}`),
    `xcard should consume surface variant ${surface}`
  );
  assert.ok(
    xtoolbar.includes(`.xtoolbar--variant-${surface}`),
    `toolbar should consume surface variant ${surface}`
  );
}

for (const density of ["compact", "comfortable", "spacious"]) {
  assert.ok(
    foundation.includes(`xdash-density--${density}`),
    `density vocabulary missing ${density}`
  );
  assert.ok(
    xcard.includes(`xcard--density-${density}`),
    `xcard density missing ${density}`
  );
  assert.ok(
    xtoolbar.includes(`xtoolbar--density-${density}`),
    `toolbar density missing ${density}`
  );
}

assert.match(foundation, /Comfortable is the documented XDashboard 2026 default/);
assert.match(docs, /Default density: `comfortable`/);
assert.ok(xcard.includes(".xcard--dense"));
assert.ok(xtable.includes(".xtable--dense"));
assert.ok(xtable.includes(".xtable--density-compact"));

for (const source of [foundation, xcard, xtable, xfield, xsearch, xselect]) {
  assert.match(source, /--x-type-/);
}

for (const token of [
  "--x-spacing",
  "--x-radius",
  "--x-shadow",
  "--x-border-subtle",
  "--x-control-height",
]) {
  assert.ok(
    [foundation, xcard, xtable, xtoolbar, xfield, xsearch, xselect].some((source) =>
      source.includes(token)
    ),
    `expected shared CSS to consume ${token}`
  );
}

for (const theme of ["xdashboard-2026-light", "xdashboard-2026-dark"]) {
  assert.ok(xuiCss.includes(`[data-theme="${theme}"]`), `XUI missing ${theme}`);
}

const definedXuiTokens = new Set(
  Array.from(xuiCss.matchAll(/--(x-[a-z0-9-]+)\s*:/g), (match) => `--${match[1]}`)
);
const usedXTokens = Array.from(
  foundation.matchAll(/var\((--x-[a-z0-9-]+)([^)]*)\)/g),
  (match) => ({ token: match[1], hasFallback: match[2].includes(",") })
);

for (const { token, hasFallback } of usedXTokens) {
  assert.ok(
    hasFallback || definedXuiTokens.has(token),
    `${token} must be defined by XUI or include a fallback`
  );
}

console.log("xdashboard foundation contract passed");
