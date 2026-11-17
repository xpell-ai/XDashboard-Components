import assert from "node:assert/strict";

export function runDashboardRuntimeRegressions(XUI) {
  const failures = [];
  const object = (id) => {
    const result = XUI.getObject(id);
    assert.ok(result, `Missing runtime object ${id}`);
    return result;
  };
  const uniqueTree = (root) => {
    const ids = [];
    const visit = (node) => {
      ids.push(node._id);
      (node._children ?? []).forEach(visit);
    };
    visit(root);
    assert.equal(new Set(ids).size, ids.length, "Generated IDs must be unique");
  };
  const check = (name, run) => {
    try {
      run();
      console.log(`PASS Dashboard regression: ${name}`);
    } catch (error) {
      failures.push(name);
      console.error(`FAIL Dashboard regression: ${name}: ${error.stack}`);
    }
  };

  check("D1 shell definition reuse and clone", () => {
    const source = {
      _type: "xshell",
      _id: "regression-shell-first",
      _children: [{ _type: "label", _text: "Reusable content" }],
    };
    const children = source._children;
    const clone = structuredClone(source);
    XUI.create(source);
    assert.equal(source._children, children);
    assert.equal(source._children.length, 1);
    source._id = "regression-shell-second";
    XUI.create(source);
    XUI.create({ ...clone, _id: "regression-shell-clone" });
    for (const name of ["first", "second", "clone"]) {
      const main = object(`regression-shell-${name}_main`);
      assert.equal(main._children.length, 1);
      assert.equal(main._children[0]._text, "Reusable content");
      uniqueTree(main);
    }
  });

  check("D2 live header regions and stable IDs", () => {
    const header = XUI.create({
      _type: "xpage-header",
      _id: "regression-header",
      _title: "Before",
    });
    const title = object("regression-header_title");
    header.parse({ _title: "After", _subtitle: "Subtitle", _meta: "Metadata" });
    assert.equal(object("regression-header_title"), title);
    assert.equal(title._text, "After");
    assert.equal(object("regression-header_subtitle")._text, "Subtitle");
    assert.equal(object("regression-header_meta")._text, "Metadata");
    header._actions = [{ _type: "button", _id: "regression-header-action", _text: "Add",
      _on: { click: "old-action" } }];
    const actions = object("regression-header_actions");
    const action = object("regression-header-action");
    header.update({
      _title: "Updated", _subtitle: "Changed", _meta: "Ready",
      _actions: [{ _type: "button", _id: "regression-header-action", _text: "Save",
        _on: { click: "new-action" } }],
    });
    assert.equal(object("regression-header_title"), title);
    assert.equal(title._text, "Updated");
    assert.equal(object("regression-header_subtitle")._text, "Changed");
    assert.equal(object("regression-header_meta")._text, "Ready");
    assert.equal(object("regression-header_actions"), actions);
    assert.equal(object("regression-header-action")._id, action._id);
    assert.equal(object("regression-header-action")._text, "Save");
    assert.equal(object("regression-header-action")._on.click, "new-action");
    header._title = "Direct edit";
    assert.equal(title._text, "Direct edit");
    header._subtitle = "";
    header._meta = "";
    header._actions = [];
    assert.equal(XUI.getObject("regression-header_subtitle"), undefined);
    assert.equal(XUI.getObject("regression-header_meta"), undefined);
    assert.equal(XUI.getObject("regression-header_actions"), undefined);
    header._actions = [{ _type: "button", _id: "regression-header-new-action", _text: "New" }];
    uniqueTree(header);
    const empty = XUI.create({ _type: "xpage-header", _id: "regression-header-empty" });
    empty.update({ _title: "First title", _subtitle: "First subtitle", _meta: "First meta",
      _actions: [{ _type: "button", _id: "regression-empty-action", _text: "First action" }] });
    assert.equal(object("regression-header-empty_title")._text, "First title");
    assert.equal(object("regression-header-empty_subtitle")._text, "First subtitle");
    assert.equal(object("regression-header-empty_meta")._text, "First meta");
    assert.equal(object("regression-header-empty_actions")._children.length, 1);
    empty.parse({ _title: "", _subtitle: "", _meta: "", _actions: [] });
    assert.equal(object("regression-header-empty_heading")._children.length, 0);
    uniqueTree(empty);
  });

  check("D3 local-day instant representations and unzoned dates", () => {
    const instants = ["2026-11-13T00:30:00Z", "2026-11-13T23:30:00Z"];
    instants.forEach((instant, index) => {
      const stamp = Date.parse(instant);
      const records = [instant, new Date(stamp), stamp,
        new Date(stamp + 3 * 3600000).toISOString().replace("Z", "+03:00"),
        new Date(stamp - 5 * 3600000).toISOString().replace("Z", "-05:00")];
      XUI.create({ _type: "xstats", _id: `regression-day-${index}`,
        _records: records.map((at) => ({ at })),
        _items: [{ _id: "same", _aggregate: "count",
          _filter: { _field: "at", _operator: "current_day", _value: new Date(stamp) } }] });
      assert.equal(object(`regression-day-${index}_item_same_value`)._text, "5");
    });
    XUI.create({ _type: "xstats", _id: "regression-day-local",
      _records: ["2026-11-13", "2026-11-13T23:30:00", "2026-11-13 00:30:00.123",
        "2026-11-14", "invalid"].map((at) => ({ at })),
      _items: [{ _id: "local", _aggregate: "count",
        _filter: { _field: "at", _operator: "current_day", _value: new Date(2026, 10, 13, 12) } }] });
    assert.equal(object("regression-day-local_item_local_value")._text, "3");
  });

  check("D4 dense toggle and authored density precedence", () => {
    const list = XUI.create({ _type: "xlist", _id: "regression-dense", _dense: true });
    list._dense = false;
    assert.equal(list.class.split(/\s+/u).includes("xlist--dense"), false);
    assert.equal(list.class.split(/\s+/u).includes("xlist--density-compact"), false);
    list._dense = true;
    assert.equal(list.class.split(/\s+/u).filter((c) => c === "xlist--dense").length, 1);
    for (const density of ["compact", "comfortable", "spacious"]) {
      const explicit = XUI.create({ _type: "xlist", _id: `regression-dense-${density}`,
        _dense: true, _density: density });
      for (const dense of [true, false, true]) {
        explicit._dense = dense;
        assert.ok(explicit.class.split(/\s+/u).includes(`xlist--density-${density}`));
        assert.equal(explicit.class.split(/\s+/u).includes("xlist--dense"), false);
        assert.equal(explicit.class.split(/\s+/u).includes("xlist--density-compact"), density === "compact");
      }
    }
  });

  assert.deepEqual(failures, [], "Dashboard runtime regressions must pass");
}
