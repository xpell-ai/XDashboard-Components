import type { XDashboardDiscoverySkill } from "./xskills";

export const XPAGE_HEADER_SKILL: XDashboardDiscoverySkill = {
  _id: "xpage-header",
  _title: "XPageHeader",
  _version: "1.0.0",
  _active: true,
  _type: "view-skill",
  _category: "composition",
  _purpose: "canonical page title, subtitle, metadata, and action header",
  _aliases: ["page header", "page title", "app header", "header actions"],
  _capabilities: [
    "page-title",
    "page-subtitle",
    "header-actions",
    "responsive-header-stacking",
  ],
  _bindings: {
    _content: ["_title", "_subtitle", "_meta", "_actions"],
  },
  _usage: [
    "Use xpage-header as the first child of xpage for page title hierarchy.",
    "Use _actions for primary page actions instead of manually aligning wrapper stacks.",
    "Do not use xpage-header as a card; it is structural/plain by default.",
  ],
  _requires: ["xuiobject", "view", "label", "toolbar"],
  _description:
    "Page header composition object with persisted semantic title, subtitle, optional metadata, and action slots using responsive XDashboard layout.",
  _fields: {
    _title: "Page title text.",
    _subtitle: "Optional page subtitle or description.",
    _meta: "Optional metadata/status text.",
    _actions: "Optional action child objects rendered on the trailing side.",
    _density: "Header spacing density: compact, comfortable, or spacious.",
    class: "Optional CSS classes. xpage-header is applied automatically.",
  },
  _core_rules: [
    "Use xpage-header for page-level title/subtitle/action composition.",
    "Use _actions for page-level buttons, badges, and controls.",
    "Do not persist generated title labels as editable targets; edit _title and _subtitle.",
    "Keep xpage-header structural/plain by default.",
  ],
  _canonical_examples: [
    {
      _type: "xpage-header",
      _title: "Customers",
      _subtitle: "Manage customer accounts",
      _actions: [
        {
          _type: "button",
          _text: "Add Customer",
          _variant: "primary",
        },
      ],
    },
  ],
};
