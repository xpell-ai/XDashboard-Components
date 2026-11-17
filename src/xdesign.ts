import type { XpellSkill } from "@xpell/core";

type XpellSkillDesign = NonNullable<XpellSkill["_design"]>;
type XpellCoreSkillInspectorField = NonNullable<
  NonNullable<XpellSkillDesign["_inspector"]>["_fields"]
>[number];
type XDashboardInspectorGroup = "design" | "content" | "data" | "interactions" | "advanced";
type XpellSkillInspectorField = XpellCoreSkillInspectorField & {
  _group?: XDashboardInspectorGroup;
  _capabilities?: string[];
};
type XDashboardSkillDesign = XpellSkillDesign & {
  _capabilities?: string[];
};
type XpellSkillChildDesign = NonNullable<XpellSkillDesign["_children"]>;
type XpellSkillSemanticChild = NonNullable<XpellSkillDesign["_semantic_children"]>[number];

type XDashboardType =
  | "xshell"
  | "xpage"
  | "xpage-header"
  | "card"
  | "grid"
  | "navlist"
  | "badge"
  | "table"
  | "xlist"
  | "xtimeline"
  | "xcalendar"
  | "xgallery"
  | "xkanban"
  | "xstats"
  | "modal"
  | "toast"
  | "divider"
  | "stack"
  | "kpi-card"
  | "scroll"
  | "spacer"
  | "toolbar"
  | "empty"
  | "igroup"
  | "search"
  | "xselect"
  | "field"
  | "drawer"
  | "sidebar"
  | "xsection";

const sections: NonNullable<XpellSkillDesign["_inspector"]>["_sections"] = [
  "properties",
  "interactions",
  "raw-json",
];

const rootContainerCapabilities = ["spacing", "layout", "appearance"];
const rootTextCapabilities = ["typography", "spacing", "appearance"];
const rootSurfaceCapabilities = ["spacing", "appearance"];

const advancedInspectorKeys = new Set([
  "class",
  "_class",
  "_on_data",
  "_on_change",
  "_top",
  "_input_id",
  "_select_id",
  "_name",
  "_href",
  "_width",
  "_max_height",
  "_max_width",
  "_autofocus",
  "_data_output",
  "_selected_data_source",
  "_update_data_source_event",
]);

const designInspectorKeys = new Set([
  "_variant",
  "_density",
  "_size",
  "_elevation",
  "_side",
  "_direction",
  "_gap",
  "_cols",
  "_min_col_width",
  "_align",
  "_justify",
  "_wrap",
  "_grow",
  "_bordered",
  "_striped",
  "_hover",
  "_pill",
  "_dot",
  "_orientation",
  "_thickness",
  "_length",
  "_inset",
  "_muted",
  "_hide_image",
  "_hide_scrollbar",
  "_scroll",
  "_dividers",
  "_collapsed",
  "_overlay",
  "_inline",
  "_required",
  "_clearable",
  "_icon",
  "_view",
  "_week_start",
]);

const contentInspectorKeys = new Set([
  "_title",
  "_subtitle",
  "_meta",
  "_text",
  "_description",
  "_label",
  "_value",
  "_delta",
  "_delta_state",
  "_empty_text",
  "_empty_column_text",
  "_undated_text",
  "_placeholder",
  "_image",
  "_image_alt",
  "_link_text",
  "_logo",
  "_empty",
  "_content",
  "_children",
  "_control",
  "_nav",
  "_sidebar",
  "_footer",
]);

const dataInspectorKeys = new Set([
  "_items",
  "_rows",
  "_records",
  "_columns",
  "_data_source",
  "_row_key",
  "_item",
  "_group_by",
  "_date_field",
  "_end_date_field",
  "_order",
  "_month",
  "_options",
]);

const interactionInspectorKeys = new Set([
  "_actions",
  "_action",
  "_open",
  "_active",
  "_selectable",
  "_selected_key",
  "_draggable",
  "_disabled",
  "_closable",
  "_close_on_backdrop",
  "_auto_close_ms",
  "_position",
  "_merged",
]);

function inferInspectorGroup(
  _key: string,
  extra: Partial<XpellSkillInspectorField>
): XDashboardInspectorGroup | undefined {
  if (extra._group) return extra._group;
  if (extra._advanced || advancedInspectorKeys.has(_key)) return "advanced";
  if (designInspectorKeys.has(_key)) return "design";
  if (dataInspectorKeys.has(_key)) return "data";
  if (interactionInspectorKeys.has(_key)) return "interactions";
  if (contentInspectorKeys.has(_key)) return "content";
  return undefined;
}

function inferDesignCapabilities(
  fields: XpellSkillInspectorField[],
  children: XpellSkillDesign["_children"]
): string[] | undefined {
  const capabilitySet = new Set<string>();
  if (children?._allowed) rootContainerCapabilities.forEach((capability) => capabilitySet.add(capability));
  if (fields.some((field) => field._group === "content")) {
    rootTextCapabilities.forEach((capability) => capabilitySet.add(capability));
  }
  if (fields.some((field) => field._group === "design")) {
    rootSurfaceCapabilities.forEach((capability) => capabilitySet.add(capability));
  }
  return capabilitySet.size ? Array.from(capabilitySet) : undefined;
}

const dashboardChildren = [
  "xpage",
  "xpage-header",
  "card",
  "grid",
  "stack",
  "kpi-card",
  "table",
  "xlist",
  "xtimeline",
  "xcalendar",
  "xgallery",
  "xkanban",
  "xstats",
  "badge",
  "toolbar",
  "field",
  "igroup",
  "search",
  "xselect",
  "empty",
  "divider",
  "scroll",
  "drawer",
  "modal",
  "xsection",
];

const shellChildren = [
  "xpage",
  "scroll",
  "stack",
  "xsection",
  "toolbar",
  "grid",
  "table",
  "xlist",
  "xgallery",
  "xkanban",
  "xtimeline",
  "xcalendar",
  "xstats",
  "drawer",
  "modal",
  "toast",
];

const pageChildren = [
  "xpage-header",
  "toolbar",
  "xsection",
  "grid",
  "stack",
  "table",
  "xlist",
  "xgallery",
  "xkanban",
  "xtimeline",
  "xcalendar",
  "xstats",
  "empty",
  "divider",
  "scroll",
  "drawer",
  "modal",
  "toast",
];

function field(
  _key: string,
  _label: string,
  _input: NonNullable<XpellSkillInspectorField["_input"]>,
  _description: string,
  extra: Partial<XpellSkillInspectorField> = {}
): XpellSkillInspectorField {
  return {
    _key,
    _label,
    _input,
    _description,
    _group: inferInspectorGroup(_key, extra),
    ...extra,
  };
}

function selectField(
  _key: string,
  _label: string,
  _description: string,
  _options: string[],
  extra: Partial<XpellSkillInspectorField> = {}
): XpellSkillInspectorField {
  return field(_key, _label, "select", _description, {
    _options,
    ...extra,
  });
}

function leaf(): XpellSkillChildDesign {
  return {
    _allowed: false,
    _insert_modes: ["before", "after"],
  };
}

function container(_accepted_types = dashboardChildren): XpellSkillChildDesign {
  return {
    _allowed: true,
    _accepted_types,
    _insert_modes: ["inside", "before", "after"],
  };
}

function semanticGroup(
  _id: string,
  _label: string,
  _role: string,
  _children: XpellSkillSemanticChild[],
  _path = "",
  extra: Partial<XpellSkillSemanticChild> = {}
): XpellSkillSemanticChild {
  return {
    _id,
    _label,
    _role,
    _kind: "group",
    _path,
    _children,
    ...extra,
  };
}

function semanticProperty(
  _id: string,
  _label: string,
  _role: string,
  _path: string,
  extra: Partial<XpellSkillSemanticChild> = {}
): XpellSkillSemanticChild {
  return {
    _id,
    _label,
    _role,
    _kind: "property",
    _path,
    _actions: ["editable"],
    ...extra,
  };
}

function semanticObject(
  _id: string,
  _label: string,
  _role: string,
  _path: string
): XpellSkillSemanticChild {
  return {
    _id,
    _label,
    _role,
    _kind: "object",
    _path,
    _actions: ["editable"],
  };
}

function semanticObjectArray(
  _id: string,
  _label: string,
  _role: string,
  _path: string,
  extra: Partial<XpellSkillSemanticChild> = {}
): XpellSkillSemanticChild {
  return {
    _id,
    _label,
    _role,
    _kind: "object-array",
    _path,
    _actions: ["editable"],
    ...extra,
  };
}

const templateSurfaceCapabilities = ["spacing", "layout", "appearance"];
const templateTextCapabilities = ["typography", "spacing", "appearance"];
const templateMediaCapabilities = ["spacing", "layout", "appearance"];
const templateBadgeCapabilities = ["typography", "spacing", "appearance"];

function templateStylePath(surface: string): string {
  return `_styles.${surface}._style`;
}

function semanticTemplateStyleTarget(
  _id: string,
  _label: string,
  _role: string,
  surface: string,
  _capabilities: string[]
): XpellSkillSemanticChild {
  return semanticGroup(_id, _label, _role, [], `_styles.${surface}`, {
    _style_path: templateStylePath(surface),
    _capabilities,
  });
}

function semanticTemplateProperty(
  _id: string,
  _label: string,
  _role: string,
  _path: string,
  surface: string,
  _capabilities: string[]
): XpellSkillSemanticChild {
  return semanticProperty(_id, _label, _role, _path, {
    _style_path: templateStylePath(surface),
    _capabilities,
  });
}

function semanticTemplateObjectArray(
  _id: string,
  _label: string,
  _role: string,
  _path: string,
  surface: string,
  _capabilities: string[]
): XpellSkillSemanticChild {
  return semanticObjectArray(_id, _label, _role, _path, {
    _style_path: templateStylePath(surface),
    _capabilities,
  });
}

const gallerySemanticChildren: XpellSkillSemanticChild[] = [
  semanticGroup("item-template", "Item Template", "collection-item-template", [
    semanticTemplateStyleTarget("item-card", "Card", "item-card", "_item", templateSurfaceCapabilities),
    semanticTemplateProperty("item-image", "Image", "image", "_image", "_image", templateMediaCapabilities),
    semanticProperty("item-image-alt", "Image Alt", "image-alt", "_image_alt"),
    semanticTemplateStyleTarget("item-body", "Body", "body", "_body", templateSurfaceCapabilities),
    semanticTemplateProperty("item-title", "Title", "title", "_title", "_title", templateTextCapabilities),
    semanticTemplateProperty("item-subtitle", "Subtitle", "subtitle", "_subtitle", "_subtitle", templateTextCapabilities),
    semanticTemplateProperty("item-description", "Description", "description", "_description", "_description", templateTextCapabilities),
    semanticTemplateProperty("item-meta", "Meta", "meta", "_meta", "_meta", templateTextCapabilities),
    semanticTemplateProperty("item-badge", "Badge", "badge", "_badge", "_badge", templateBadgeCapabilities),
    semanticTemplateObjectArray("item-actions", "Actions", "actions", "_actions", "_actions", templateSurfaceCapabilities),
  ], "_item"),
  semanticObjectArray("fallback-actions", "Fallback Actions", "fallback-actions", "_actions"),
  semanticGroup("empty-state", "Empty State", "empty-state", [
    semanticProperty("empty-text", "Empty Text", "empty-text", "_empty_text"),
    semanticObject("empty-object", "Empty Object", "empty-object", "_empty"),
  ]),
];

const listSemanticChildren: XpellSkillSemanticChild[] = [
  semanticGroup("item-template", "Item Template", "collection-item-template", [
    semanticTemplateStyleTarget("item-row", "Row", "item-row", "_item", templateSurfaceCapabilities),
    semanticTemplateProperty("item-leading", "Leading", "leading", "_leading", "_leading", templateSurfaceCapabilities),
    semanticTemplateProperty("item-image", "Image", "image", "_image", "_image", templateMediaCapabilities),
    semanticTemplateProperty("item-avatar", "Avatar", "avatar", "_avatar", "_avatar", templateMediaCapabilities),
    semanticTemplateProperty("item-icon", "Icon", "icon", "_icon", "_icon", templateMediaCapabilities),
    semanticProperty("item-image-alt", "Image Alt", "image-alt", "_image_alt"),
    semanticTemplateStyleTarget("item-content", "Content", "content", "_content", templateSurfaceCapabilities),
    semanticTemplateProperty("item-title", "Title", "title", "_title", "_title", templateTextCapabilities),
    semanticTemplateProperty("item-subtitle", "Subtitle", "subtitle", "_subtitle", "_subtitle", templateTextCapabilities),
    semanticTemplateProperty("item-description", "Description", "description", "_description", "_description", templateTextCapabilities),
    semanticTemplateProperty("item-meta", "Meta", "meta", "_meta", "_meta", templateTextCapabilities),
    semanticTemplateProperty("item-badge", "Badge", "badge", "_badge", "_badge", templateBadgeCapabilities),
    semanticTemplateProperty("item-trailing", "Trailing", "trailing", "_trailing", "_trailing", templateSurfaceCapabilities),
    semanticTemplateObjectArray("item-actions", "Actions", "actions", "_actions", "_actions", templateSurfaceCapabilities),
  ], "_item"),
  semanticObjectArray("fallback-actions", "Fallback Actions", "fallback-actions", "_actions"),
  semanticGroup("empty-state", "Empty State", "empty-state", [
    semanticProperty("empty-text", "Empty Text", "empty-text", "_empty_text"),
    semanticObject("empty-object", "Empty Object", "empty-object", "_empty"),
  ]),
];

const kanbanSemanticChildren: XpellSkillSemanticChild[] = [
  semanticGroup("kanban-configuration", "Board Configuration", "configuration", [
    semanticProperty("group-by", "Group By", "group-by", "_group_by"),
    semanticProperty("columns", "Columns", "columns", "_columns"),
    semanticProperty("row-key", "Row Key", "row-key", "_row_key"),
    semanticProperty("min-column-width", "Min Column Width", "min-column-width", "_min_col_width"),
    semanticProperty("gap", "Gap", "gap", "_gap"),
    semanticProperty("draggable", "Draggable", "draggable", "_draggable"),
  ]),
  semanticGroup("item-template", "Card Template", "collection-item-template", [
    semanticTemplateStyleTarget("item-card", "Card", "item-card", "_item", templateSurfaceCapabilities),
    semanticTemplateProperty("item-image", "Image", "image", "_image", "_image", templateMediaCapabilities),
    semanticProperty("item-image-alt", "Image Alt", "image-alt", "_image_alt"),
    semanticTemplateStyleTarget("item-body", "Body", "body", "_body", templateSurfaceCapabilities),
    semanticTemplateProperty("item-title", "Title", "title", "_title", "_title", templateTextCapabilities),
    semanticTemplateProperty("item-subtitle", "Subtitle", "subtitle", "_subtitle", "_subtitle", templateTextCapabilities),
    semanticTemplateProperty("item-description", "Description", "description", "_description", "_description", templateTextCapabilities),
    semanticTemplateProperty("item-meta", "Meta", "meta", "_meta", "_meta", templateTextCapabilities),
    semanticTemplateProperty("item-badge", "Badge", "badge", "_badge", "_badge", templateBadgeCapabilities),
    semanticTemplateObjectArray("item-actions", "Actions", "actions", "_actions", "_actions", templateSurfaceCapabilities),
  ], "_item"),
  semanticObjectArray("fallback-actions", "Fallback Actions", "fallback-actions", "_actions"),
  semanticGroup("empty-state", "Empty State", "empty-state", [
    semanticProperty("empty-text", "Empty Text", "empty-text", "_empty_text"),
    semanticProperty("empty-column-text", "Empty Column Text", "empty-column-text", "_empty_column_text"),
    semanticObject("empty-object", "Empty Object", "empty-object", "_empty"),
  ]),
];

const timelineSemanticChildren: XpellSkillSemanticChild[] = [
  semanticGroup("timeline-configuration", "Timeline Configuration", "configuration", [
    semanticProperty("date-field", "Date Field", "date-field", "_date_field"),
    semanticProperty("order", "Order", "order", "_order"),
    semanticProperty("row-key", "Row Key", "row-key", "_row_key"),
    semanticProperty("selectable", "Selectable", "selectable", "_selectable"),
    semanticProperty("selected-key", "Selected Key", "selected-key", "_selected_key"),
    semanticProperty("undated-text", "Undated Text", "undated-text", "_undated_text"),
  ]),
  semanticGroup("item-template", "Entry Template", "collection-item-template", [
    semanticTemplateStyleTarget("item-entry", "Entry", "entry", "_item", templateSurfaceCapabilities),
    semanticTemplateStyleTarget("item-axis", "Axis", "axis", "_axis", templateSurfaceCapabilities),
    semanticTemplateStyleTarget("item-date", "Date", "date", "_date", templateTextCapabilities),
    semanticTemplateStyleTarget("item-marker", "Marker", "marker", "_dot", templateMediaCapabilities),
    semanticTemplateStyleTarget("item-card", "Card", "item-card", "_card", templateSurfaceCapabilities),
    semanticTemplateStyleTarget("item-body", "Body", "body", "_body", templateSurfaceCapabilities),
    semanticTemplateProperty("item-image", "Image", "image", "_image", "_image", templateMediaCapabilities),
    semanticTemplateProperty("item-icon", "Icon", "icon", "_icon", "_icon", templateMediaCapabilities),
    semanticProperty("item-image-alt", "Image Alt", "image-alt", "_image_alt"),
    semanticTemplateProperty("item-title", "Title", "title", "_title", "_title", templateTextCapabilities),
    semanticTemplateProperty("item-subtitle", "Subtitle", "subtitle", "_subtitle", "_subtitle", templateTextCapabilities),
    semanticTemplateProperty("item-description", "Description", "description", "_description", "_description", templateTextCapabilities),
    semanticTemplateProperty("item-meta", "Meta", "meta", "_meta", "_meta", templateTextCapabilities),
    semanticTemplateProperty("item-badge", "Badge", "badge", "_badge", "_badge", templateBadgeCapabilities),
    semanticTemplateObjectArray("item-actions", "Actions", "actions", "_actions", "_actions", templateSurfaceCapabilities),
  ], "_item"),
  semanticObjectArray("fallback-actions", "Fallback Actions", "fallback-actions", "_actions"),
  semanticGroup("empty-state", "Empty State", "empty-state", [
    semanticProperty("empty-text", "Empty Text", "empty-text", "_empty_text"),
    semanticObject("empty-object", "Empty Object", "empty-object", "_empty"),
  ]),
];

const calendarSemanticChildren: XpellSkillSemanticChild[] = [
  semanticGroup("calendar-configuration", "Calendar Configuration", "configuration", [
    semanticProperty("date-field", "Date Field", "date-field", "_date_field"),
    semanticProperty("end-date-field", "End Date Field", "end-date-field", "_end_date_field"),
    semanticProperty("view", "View", "view", "_view"),
    semanticProperty("month", "Month", "month", "_month"),
    semanticProperty("week-start", "Week Start", "week-start", "_week_start"),
    semanticProperty("row-key", "Row Key", "row-key", "_row_key"),
    semanticProperty("selectable", "Selectable", "selectable", "_selectable"),
    semanticProperty("selected-key", "Selected Key", "selected-key", "_selected_key"),
  ]),
  semanticGroup("item-template", "Event Template", "collection-item-template", [
    semanticTemplateStyleTarget("item-event", "Event", "event", "_item", templateSurfaceCapabilities),
    semanticTemplateProperty("item-image", "Image", "image", "_image", "_image", templateMediaCapabilities),
    semanticTemplateProperty("item-icon", "Icon", "icon", "_icon", "_icon", templateMediaCapabilities),
    semanticProperty("item-image-alt", "Image Alt", "image-alt", "_image_alt"),
    semanticTemplateProperty("item-title", "Title", "title", "_title", "_title", templateTextCapabilities),
    semanticTemplateProperty("item-subtitle", "Subtitle", "subtitle", "_subtitle", "_subtitle", templateTextCapabilities),
    semanticTemplateProperty("item-description", "Description", "description", "_description", "_description", templateTextCapabilities),
    semanticTemplateProperty("item-meta", "Meta", "meta", "_meta", "_meta", templateTextCapabilities),
    semanticTemplateProperty("item-badge", "Badge", "badge", "_badge", "_badge", templateBadgeCapabilities),
    semanticTemplateObjectArray("item-actions", "Actions", "actions", "_actions", "_actions", templateSurfaceCapabilities),
  ], "_item"),
  semanticObjectArray("fallback-actions", "Fallback Actions", "fallback-actions", "_actions"),
  semanticGroup("empty-state", "Empty State", "empty-state", [
    semanticProperty("empty-text", "Empty Text", "empty-text", "_empty_text"),
    semanticObject("empty-object", "Empty Object", "empty-object", "_empty"),
  ]),
];

const pageHeaderSemanticChildren: XpellSkillSemanticChild[] = [
  semanticProperty("title", "Title", "title", "_title"),
  semanticProperty("subtitle", "Subtitle", "subtitle", "_subtitle"),
  semanticProperty("meta", "Metadata", "metadata", "_meta"),
  semanticObjectArray("actions", "Actions", "actions", "_actions"),
];

function design(
  _title: string,
  _category: string,
  _icon: string,
  _default_object: Record<string, any>,
  _fields: XpellSkillInspectorField[],
  _children: XpellSkillDesign["_children"],
  _semantic_children: XpellSkillSemanticChild[] = []
): XDashboardSkillDesign {
  const capabilities = inferDesignCapabilities(_fields, _children);
  return {
    _inspector: {
      _fields,
      _sections: sections,
    },
    _children,
    ...(_semantic_children.length > 0 ? { _semantic_children } : {}),
    ...(capabilities ? { _capabilities: capabilities } : {}),
    _palette: {
      _title,
      _category,
      _icon,
      _default_object,
    },
  };
}

export const XDashboardSkillDesigns: Record<XDashboardType, XDashboardSkillDesign> = {
  xshell: design(
    "App Shell",
    "Composition",
    "app-window",
    {
      _type: "xshell",
      _scroll: true,
      _children: [
        {
          _type: "xpage",
          _children: [
            {
              _type: "xpage-header",
              _title: "Page title",
              _subtitle: "Page subtitle",
            },
          ],
        },
      ],
    },
    [
      field("_sidebar", "Sidebar", "json", "Optional sidebar object for app navigation."),
      field("_children", "Main Children", "json", "Main application region children, usually xpage objects."),
      field("_scroll", "Main Scroll", "checkbox", "Let the shell main region own vertical scrolling."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container(shellChildren)
  ),

  xpage: design(
    "Page",
    "Composition",
    "file-text",
    {
      _type: "xpage",
      _width: "contained",
      _children: [
        {
          _type: "xpage-header",
          _title: "Page title",
          _subtitle: "Page subtitle",
        },
        {
          _type: "toolbar",
          _variant: "plain",
          _children: [],
        },
        {
          _type: "xsection",
          _title: "Section",
          _children: [],
        },
      ],
    },
    [
      selectField("_width", "Width", "Page width mode.", ["full", "contained", "readable"], { _group: "design" }),
      selectField("_density", "Density", "Page rhythm density.", ["compact", "comfortable", "spacious"]),
      field("_children", "Children", "json", "Page content children."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container(pageChildren)
  ),

  "xpage-header": design(
    "Page Header",
    "Composition",
    "heading-1",
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
    [
      field("_title", "Title", "text", "Page title text."),
      field("_subtitle", "Subtitle", "textarea", "Page subtitle or description."),
      field("_meta", "Metadata", "text", "Optional status or metadata text."),
      field("_actions", "Actions", "json", "Page-level action child objects.", { _group: "content" }),
      selectField("_density", "Density", "Header spacing density.", ["compact", "comfortable", "spacious"]),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf(),
    pageHeaderSemanticChildren
  ),

  card: design(
    "Dashboard Card",
    "Cards",
    "panel-top",
    {
      _type: "card",
      _title: "Dashboard card",
      _text: "Use this card for grouped dashboard content.",
      _hide_image: true,
    },
    [
      field("_title", "Title", "text", "Card title text."),
      field("_text", "Text", "textarea", "Card body text."),
      field("_image", "Image", "json", "Canonical image object for the optional card image.", {
        _advanced: true,
      }),
      field("_image_alt", "Image Alt", "text", "Alt text for the card image.", {
        _advanced: true,
      }),
      field("_hide_image", "Hide Image", "checkbox", "Hide the image area."),
      selectField("_variant", "Variant", "Card variant.", ["default", "interactive", "elevated"]),
      selectField("_density", "Density", "Card density.", ["compact", "comfortable", "spacious"]),
      selectField("_elevation", "Elevation", "Card elevation.", ["none", "xs", "sm", "md"]),
      field("_href", "Link URL", "text", "Optional link URL.", {
        _advanced: true,
      }),
      field("_link_text", "Link Text", "text", "Visible text for the optional link.", {
        _advanced: true,
      }),
      field("_actions", "Actions", "json", "Action child objects rendered in the card action slot.", {
        _advanced: true,
      }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", {
        _advanced: true,
      }),
    ],
    leaf()
  ),

  grid: design(
    "Dashboard Grid",
    "Layout",
    "grid-3x3",
    {
      _type: "grid",
      _min_col_width: 220,
      _gap: 16,
      _children: [
        { _type: "kpi-card", _label: "Requests", _value: "0", _delta_state: "flat" },
        { _type: "card", _title: "Summary", _text: "Dashboard content", _hide_image: true },
      ],
    },
    [
      field("_children", "Children", "json", "Child UI objects placed inside the grid."),
      field("_cols", "Columns", "number", "Fixed column count. Ignored when minimum column width is set."),
      field("_gap", "Gap", "number", "Gap between grid items in pixels."),
      field("_min_col_width", "Min Column Width", "number", "Responsive auto-fit minimum column width in pixels."),
      selectField("_density", "Density", "Grid gap density.", ["compact", "comfortable", "spacious"]),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container(["card", "kpi-card", "table", "badge", "field", "stack", "toolbar", "empty", "xsection"])
  ),

  navlist: design(
    "Navigation List",
    "Navigation",
    "list",
    {
      _type: "navlist",
      _active: "overview",
      _dense: true,
      _items: [
        { _label: "Overview", _value: "overview" },
        { _label: "Reports", _value: "reports" },
      ],
    },
    [
      field("_items", "Items", "json", "Navigation items with _label and stable _value keys.", {
        _required: true,
      }),
      field("_active", "Active Value", "text", "Value, id, or label of the active item."),
      field("_dense", "Dense", "checkbox", "Use compact item spacing."),
      field("_dividers", "Dividers", "checkbox", "Show dividers between navigation items."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  badge: design(
    "Badge",
    "Data Display",
    "badge",
    {
      _type: "badge",
      _text: "Active",
      _variant: "success",
      _size: "md",
      _pill: true,
    },
    [
      field("_text", "Text", "text", "Badge text."),
      selectField("_variant", "Variant", "Semantic badge variant.", ["default", "success", "warn", "error", "info"]),
      selectField("_size", "Size", "Badge size.", ["sm", "md"]),
      field("_pill", "Pill", "checkbox", "Use rounded pill shape."),
      field("_dot", "Dot", "checkbox", "Show a dot indicator."),
      field("_title", "Tooltip", "text", "Native title tooltip.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  table: design(
    "Data Table",
    "Tables",
    "table",
    {
      _type: "table",
      _columns: [
        { _key: "name", _title: "Name" },
        { _key: "status", _title: "Status" },
      ],
      _rows: [{ name: "Example", status: "Active" }],
      _row_key: "name",
      _hover: true,
      _bordered: true,
      _empty_text: "No records",
    },
    [
      field("_columns", "Columns", "json", "Table columns. Prefer _key and _title; use _format or _value_type for date, datetime, and number display; do not use render functions.", {
        _required: true,
      }),
      field("_rows", "Rows", "json", "Static row array or XData key string."),
      field("_data_source", "Data Source", "text", "XData key used to hydrate/update rows."),
      field("_row_key", "Row Key", "text", "Row field used as the stable row key."),
      selectField("_variant", "Variant", "Table surface variant.", ["plain", "subtle", "card"]),
      selectField("_density", "Density", "Table row density.", ["compact", "comfortable", "spacious"]),
      field("_striped", "Striped", "checkbox", "Use striped row styling."),
      field("_hover", "Hover", "checkbox", "Enable row hover styling."),
      field("_bordered", "Bordered", "checkbox", "Enable bordered table styling."),
      field("_empty_text", "Empty Text", "text", "Message shown when there are no rows."),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for row data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  xlist: design(
    "Record List",
    "Data Display",
    "list",
    {
      _type: "xlist",
      _data_source: "records.records",
      _row_key: "id",
      _dense: false,
      _selectable: true,
      _item: {
        _title: "$row.name",
        _subtitle: "$row.category",
        _description: "$row.description",
        _meta: "$row.updated_at",
        _icon: "$row.icon",
        _badge: "$row.status",
        _actions: [
          {
            _type: "button",
            _text: "Open",
          },
        ],
      },
      _empty_text: "No records",
    },
    [
      field("_items", "Items", "json", "Static item array or XData key string."),
      field("_data_source", "Data Source", "text", "XData key used to hydrate/update list records."),
      field("_item", "Item Mapping", "json", "Mapping for _title, _subtitle, _description, _meta, _icon, _image, _avatar, _image_alt, _badge, _leading, _trailing, and _actions.", {
        _required: true,
      }),
      field("_actions", "Actions", "json", "Fallback per-item action child objects when _item._actions is not set."),
      field("_row_key", "Row Key", "text", "Row field used for stable item and action ids."),
      selectField("_variant", "Variant", "List surface variant.", ["plain", "subtle", "card"]),
      selectField("_density", "Density", "List row density.", ["compact", "comfortable", "spacious"]),
      field("_selectable", "Selectable", "checkbox", "Enable item click and keyboard selection."),
      field("_selected_key", "Selected Key", "text", "Selected row key."),
      field("_gap", "Gap", "number", "Gap between list rows in pixels."),
      field("_empty_text", "Empty Text", "text", "Message shown when there are no records."),
      field("_empty", "Empty State", "json", "Optional empty-state child object.", { _advanced: true }),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf(),
    listSemanticChildren
  ),

  xtimeline: design(
    "Timeline",
    "Data Display",
    "history",
    {
      _type: "xtimeline",
      _data_source: "activity.records",
      _date_field: "created_at",
      _order: "desc",
      _row_key: "id",
      _selectable: true,
      _item: {
        _title: "$row.title",
        _subtitle: "$row.type",
        _description: "$row.notes",
        _meta: "$row.updated_at",
        _badge: "$row.status",
        _actions: [
          {
            _type: "button",
            _text: "Open",
          },
        ],
      },
      _empty_text: "No records",
    },
    [
      field("_items", "Items", "json", "Static item array or XData key string."),
      field("_data_source", "Data Source", "text", "XData key used to hydrate/update timeline records."),
      field("_date_field", "Date Field", "text", "Record field or $row path used for date markers and sorting."),
      selectField("_order", "Order", "Chronological sort order.", ["desc", "asc"]),
      field("_item", "Item Mapping", "json", "Mapping for _title, _subtitle, _description, _meta, _icon, _image, _image_alt, _badge, and _actions.", {
        _required: true,
      }),
      field("_actions", "Actions", "json", "Fallback per-item action child objects when _item._actions is not set."),
      field("_row_key", "Row Key", "text", "Row field used for stable item and action ids."),
      selectField("_density", "Density", "Timeline item density.", ["compact", "comfortable", "spacious"]),
      field("_selectable", "Selectable", "checkbox", "Enable item click and keyboard selection."),
      field("_selected_key", "Selected Key", "text", "Selected row key."),
      field("_empty_text", "Empty Text", "text", "Message shown when there are no records."),
      field("_empty", "Empty State", "json", "Optional empty-state child object.", { _advanced: true }),
      field("_undated_text", "Undated Text", "text", "Text shown when a record has no usable date.", { _advanced: true, _group: "content" }),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf(),
    timelineSemanticChildren
  ),

  xcalendar: design(
    "Calendar",
    "Data Display",
    "calendar-days",
    {
      _type: "xcalendar",
      _data_source: "event.records",
      _date_field: "start_at",
      _end_date_field: "end_at",
      _view: "month",
      _month: "2026-08",
      _week_start: "sun",
      _row_key: "id",
      _selectable: true,
      _item: {
        _title: "$row.title",
        _subtitle: "$row.location",
        _description: "$row.notes",
        _meta: "$row.start_at",
        _badge: "$row.status",
        _actions: [
          {
            _type: "button",
            _text: "Open",
          },
        ],
      },
      _empty_text: "No records",
    },
    [
      field("_items", "Items", "json", "Static item array or XData key string."),
      field("_data_source", "Data Source", "text", "XData key used to hydrate/update calendar records."),
      field("_date_field", "Date Field", "text", "Record field or $row path used as the start date/time.", {
        _required: true,
      }),
      field("_end_date_field", "End Date Field", "text", "Optional record field or $row path used as the end date/time."),
      selectField("_view", "Calendar View", "Calendar presentation mode.", ["month"]),
      field("_month", "Month", "text", "Visible month as YYYY-MM or a date string."),
      selectField("_week_start", "Week Start", "First day of the week.", ["sun", "mon"]),
      field("_item", "Item Mapping", "json", "Mapping for _title, _subtitle, _description, _meta, _icon, _image, _image_alt, _badge, and _actions.", {
        _required: true,
      }),
      field("_actions", "Actions", "json", "Fallback per-item action child objects when _item._actions is not set."),
      field("_row_key", "Row Key", "text", "Row field used for stable item and action ids."),
      selectField("_density", "Density", "Calendar density.", ["compact", "comfortable", "spacious"]),
      field("_selectable", "Selectable", "checkbox", "Enable item click and keyboard selection."),
      field("_selected_key", "Selected Key", "text", "Selected row key."),
      field("_empty_text", "Empty Text", "text", "Message shown when the visible month has no records."),
      field("_empty", "Empty State", "json", "Optional empty-state child object.", { _advanced: true }),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf(),
    calendarSemanticChildren
  ),

  xgallery: design(
    "Gallery",
    "Data Display",
    "images",
    {
      _type: "xgallery",
      _data_source: "records.records",
      _columns: 3,
      _min_col_width: 220,
      _gap: 16,
      _row_key: "id",
      _item: {
        _title: "$row.name",
        _subtitle: "$row.category",
        _image: {
          _type: "image",
          src: "$row.image",
          alt: "$row.name",
        },
        _description: "$row.description",
        _badge: "$row.status",
        _actions: [
          {
            _type: "button",
            _text: "Open",
          },
        ],
      },
      _empty_text: "No records",
    },
    [
      field("_items", "Items", "json", "Static item array or XData key string."),
      field("_data_source", "Data Source", "text", "XData key used to hydrate/update gallery records."),
      field("_item", "Item Mapping", "json", "Mapping for _title, _subtitle, _image, _description, _meta, _badge, and _actions.", {
        _required: true,
      }),
      field("_actions", "Actions", "json", "Fallback per-item action child objects when _item._actions is not set."),
      field("_row_key", "Row Key", "text", "Row field used for stable item and action ids."),
      selectField("_variant", "Variant", "Gallery card surface variant.", ["plain", "subtle", "card"]),
      selectField("_density", "Density", "Gallery card density.", ["compact", "comfortable", "spacious"]),
      field("_columns", "Columns", "number", "Preferred desktop column count."),
      field("_min_col_width", "Min Card Width", "number", "Responsive auto-fit minimum card width in pixels."),
      field("_gap", "Gap", "number", "Gap between gallery cards in pixels."),
      field("_empty_text", "Empty Text", "text", "Message shown when there are no records."),
      field("_empty", "Empty State", "json", "Optional empty-state child object.", { _advanced: true }),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf(),
    gallerySemanticChildren
  ),

  xkanban: design(
    "Kanban Board",
    "Data Display",
    "kanban",
    {
      _type: "xkanban",
      _data_source: "task.records",
      _group_by: "status",
      _columns: [
        { _value: "todo", _label: "To Do" },
        { _value: "doing", _label: "Doing" },
        { _value: "done", _label: "Done" },
      ],
      _row_key: "id",
      _min_col_width: 260,
      _gap: 16,
      _item: {
        _title: "$row.title",
        _subtitle: "$row.assignee",
        _description: "$row.notes",
        _badge: "$row.priority",
        _actions: [
          {
            _type: "button",
            _text: "Open",
          },
        ],
      },
      _empty_text: "No records",
      _empty_column_text: "No records",
      _draggable: true,
    },
    [
      field("_items", "Items", "json", "Static item array or XData key string."),
      field("_data_source", "Data Source", "text", "XData key used to hydrate/update Kanban records."),
      field("_group_by", "Group By", "text", "Record field or $row path used to group cards into columns.", {
        _required: true,
      }),
      field("_columns", "Columns", "json", "Optional explicit columns with _value and _label."),
      field("_item", "Item Mapping", "json", "Mapping for _title, _subtitle, _image, _description, _meta, _badge, and _actions.", {
        _required: true,
      }),
      field("_actions", "Actions", "json", "Fallback per-item action child objects when _item._actions is not set."),
      field("_row_key", "Row Key", "text", "Row field used for stable card and action ids."),
      selectField("_density", "Density", "Kanban board density.", ["compact", "comfortable", "spacious"]),
      field("_min_col_width", "Min Column Width", "number", "Responsive minimum column width in pixels."),
      field("_gap", "Gap", "number", "Gap between Kanban columns and cards in pixels."),
      field("_empty_text", "Empty Text", "text", "Message shown when there are no records."),
      field("_empty_column_text", "Empty Column Text", "text", "Message shown in empty explicit columns."),
      field("_empty", "Empty State", "json", "Optional empty-board child object.", { _advanced: true }),
      field("_draggable", "Draggable", "checkbox", "Enable generic card-moved event emission."),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf(),
    kanbanSemanticChildren
  ),

  modal: design(
    "Modal",
    "Feedback",
    "panel-top-open",
    {
      _type: "modal",
      _open: true,
      _title: "Dialog",
      _subtitle: "Focused dashboard content",
      _size: "md",
      _closable: true,
      _close_on_backdrop: true,
      _scroll: true,
      _children: [{ _type: "label", _text: "Modal content" }],
      _actions: [{ _type: "button", _text: "Close" }],
    },
    [
      field("_open", "Open", "checkbox", "Whether the modal is open."),
      field("_title", "Title", "text", "Modal title."),
      field("_subtitle", "Subtitle", "text", "Modal subtitle."),
      selectField("_size", "Size", "Modal size.", ["sm", "md", "lg"]),
      field("_width", "Width", "text", "Custom modal width CSS value.", { _advanced: true }),
      field("_closable", "Closable", "checkbox", "Show the close button."),
      field("_close_on_backdrop", "Close On Backdrop", "checkbox", "Close when the backdrop is clicked."),
      field("_scroll", "Scrollable", "checkbox", "Wrap the body in a scroll container."),
      field("_children", "Body Children", "json", "Modal body content when _content is not provided."),
      field("_content", "Content Slot", "json", "Modal body content that takes priority over _children.", { _advanced: true }),
      field("_actions", "Actions", "json", "Footer action child objects."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container()
  ),

  toast: design(
    "Toast",
    "Feedback",
    "bell",
    {
      _type: "toast",
      _open: true,
      _text: "Saved",
      _variant: "success",
      _closable: true,
      _position: "bottom-right",
    },
    [
      field("_open", "Open", "checkbox", "Whether the toast is visible."),
      field("_text", "Text", "text", "Toast message text."),
      selectField("_variant", "Variant", "Toast variant.", ["default", "success", "error", "warn", "info"]),
      field("_icon", "Icon", "json", "Optional icon child object.", { _advanced: true }),
      field("_actions", "Actions", "json", "Short contextual action objects.", { _advanced: true }),
      field("_closable", "Closable", "checkbox", "Show close button."),
      field("_auto_close_ms", "Auto Close", "number", "Auto-close delay in milliseconds.", { _advanced: true }),
      selectField("_position", "Position", "Screen position.", ["top-right", "top-left", "bottom-right", "bottom-left"]),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  divider: design(
    "Divider",
    "Layout",
    "separator-horizontal",
    {
      _type: "divider",
      _orientation: "horizontal",
      _thickness: 1,
      _length: "100%",
      _muted: true,
    },
    [
      selectField("_orientation", "Orientation", "Divider orientation.", ["horizontal", "vertical"]),
      field("_thickness", "Thickness", "number", "Divider thickness in pixels."),
      field("_length", "Length", "text", "CSS length such as 100%, 240px, or 2rem."),
      field("_inset", "Inset", "number", "Inset spacing in pixels."),
      field("_muted", "Muted", "checkbox", "Use subtle divider styling."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  stack: design(
    "Stack",
    "Layout",
    "rows-3",
    {
      _type: "stack",
      _direction: "vertical",
      _gap: 12,
      _align: "stretch",
      _children: [{ _type: "label", _text: "Stack item" }],
    },
    [
      field("_children", "Children", "json", "Child UI objects arranged by the stack."),
      selectField("_direction", "Direction", "Stack direction.", ["vertical", "horizontal"]),
      field("_gap", "Gap", "number", "Gap between child objects in pixels."),
      selectField("_density", "Density", "Stack gap density.", ["compact", "comfortable", "spacious"]),
      selectField("_align", "Align", "Cross-axis alignment.", ["start", "center", "end", "stretch"]),
      selectField("_justify", "Justify", "Main-axis distribution.", ["start", "center", "end", "space-between", "space-around", "space-evenly"]),
      field("_wrap", "Wrap", "checkbox", "Allow child objects to wrap."),
      field("_grow", "Grow", "checkbox", "Allow the stack to fill available flex space."),
      field("_class", "Extra Classes", "text", "Extra CSS classes appended to the stack.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container()
  ),

  "kpi-card": design(
    "KPI Card",
    "Metrics",
    "gauge",
    {
      _type: "kpi-card",
      _label: "Requests",
      _value: "0",
      _delta: "+0%",
      _delta_state: "flat",
    },
    [
      field("_label", "Label", "text", "Metric label."),
      field("_value", "Value", "text", "Primary metric value."),
      field("_delta", "Delta", "text", "Optional change text."),
      selectField("_delta_state", "Delta State", "Trend state.", ["up", "down", "flat"]),
      selectField("_variant", "Variant", "KPI card variant.", ["default", "interactive", "elevated"]),
      selectField("_density", "Density", "KPI card density.", ["compact", "comfortable", "spacious"]),
      field("_icon", "Icon Text", "text", "Optional icon text.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  xstats: design(
    "Stats Summary",
    "Metrics",
    "sigma",
    {
      _type: "xstats",
      _data_source: "records.records",
      _items: [
        {
          _id: "total",
          _title: "Total",
          _aggregate: "count",
        },
        {
          _id: "sum",
          _title: "Total Amount",
          _aggregate: "sum",
          _field: "amount",
        },
      ],
      _min_col_width: 180,
      _gap: 12,
      _empty_text: "No metrics",
    },
    [
      field("_data_source", "Data Source", "text", "XData key used to hydrate/update records."),
      field("_records", "Records", "json", "Optional static record array or XData key string.", {
        _advanced: true,
      }),
      field("_items", "Metric Items", "json", "Metric definitions with _aggregate, _field, optional _filter, and optional _value_prefix/_value_suffix/_unit display text.", {
        _required: true,
      }),
      selectField("_variant", "Variant", "Stats card surface variant.", ["plain", "subtle", "card", "elevated"]),
      selectField("_density", "Density", "Stats card density.", ["compact", "comfortable", "spacious"]),
      field("_min_col_width", "Min Card Width", "number", "Responsive minimum metric card width in pixels."),
      field("_gap", "Gap", "number", "Gap between metric cards in pixels."),
      field("_empty_text", "Empty Text", "text", "Message shown when no metrics are configured."),
      field("_empty", "Empty State", "json", "Optional empty-state child object.", { _advanced: true }),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  scroll: design(
    "Scroll Area",
    "Layout",
    "scroll-text",
    {
      _type: "scroll",
      _direction: "vertical",
      _grow: true,
      _children: [{ _type: "card", _title: "Scrollable content", _text: "Content can overflow here.", _hide_image: true }],
    },
    [
      field("_children", "Children", "json", "Scrollable child UI objects."),
      selectField("_direction", "Direction", "Scroll direction.", ["vertical", "horizontal", "both"]),
      field("_grow", "Grow", "checkbox", "Allow scroll area to fill available flex space."),
      field("_hide_scrollbar", "Hide Scrollbar", "checkbox", "Hide scrollbar visually while preserving scrolling."),
      field("_max_height", "Max Height", "text", "CSS max-height value."),
      field("_max_width", "Max Width", "text", "CSS max-width value."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container()
  ),

  spacer: design(
    "Spacer",
    "Layout",
    "space",
    {
      _type: "spacer",
      _direction: "vertical",
    },
    [
      selectField("_direction", "Direction", "Spacer direction.", ["vertical", "horizontal"]),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  toolbar: design(
    "Toolbar",
    "Navigation",
    "panel-top",
    {
      _type: "toolbar",
      _gap: 8,
      _align: "center",
      _justify: "space-between",
      _children: [
        { _type: "label", _text: "Toolbar" },
        { _type: "button", _text: "Action" },
      ],
    },
    [
      field("_children", "Children", "json", "Toolbar child objects."),
      field("_gap", "Gap", "number", "Gap between toolbar items in pixels."),
      selectField("_variant", "Variant", "Toolbar surface variant.", ["plain", "subtle", "sticky"]),
      selectField("_density", "Density", "Toolbar density.", ["compact", "comfortable", "spacious"]),
      selectField("_align", "Align", "Cross-axis alignment.", ["start", "center", "end", "stretch"]),
      selectField("_justify", "Justify", "Main-axis distribution.", ["start", "center", "end", "space-between"]),
      field("_wrap", "Wrap", "checkbox", "Allow toolbar items to wrap."),
      field("_sticky", "Sticky", "checkbox", "Make the toolbar sticky."),
      field("_top", "Top Offset", "number", "Top offset in pixels when sticky.", { _advanced: true }),
      field("_elevated", "Elevated", "checkbox", "Use elevated toolbar styling."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container(["button", "label", "search", "xselect", "field", "igroup", "badge", "divider", "stack"])
  ),

  empty: design(
    "Empty State",
    "Feedback",
    "inbox",
    {
      _type: "empty",
      _title: "No records",
      _description: "Create a record or adjust your filters.",
      _size: "md",
      _align: "center",
      _action: { _type: "button", _text: "Create" },
    },
    [
      field("_title", "Title", "text", "Primary empty-state title."),
      field("_description", "Description", "textarea", "Descriptive empty-state text."),
      field("_icon", "Icon", "json", "Optional icon or visual child object.", { _advanced: true }),
      field("_action", "Action", "json", "Optional recovery action child object."),
      selectField("_variant", "Variant", "Empty-state scope.", ["inline", "section", "page"]),
      selectField("_size", "Size", "Empty-state size.", ["sm", "md", "lg"]),
      selectField("_align", "Align", "Content alignment.", ["start", "center"]),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  igroup: design(
    "Input Group",
    "Layout",
    "form-input",
    {
      _type: "igroup",
      _gap: 8,
      _align: "center",
      _wrap: true,
      _children: [
        { _type: "search", _placeholder: "Search...", _clearable: true },
        { _type: "button", _text: "Apply" },
      ],
    },
    [
      field("_children", "Children", "json", "Grouped controls or action objects."),
      field("_gap", "Gap", "number", "Gap between children in pixels."),
      selectField("_variant", "Variant", "Input group surface variant.", ["plain", "subtle", "merged"]),
      selectField("_density", "Density", "Input group density.", ["compact", "comfortable", "spacious"]),
      selectField("_align", "Align", "Cross-axis alignment.", ["start", "center", "end", "stretch"]),
      field("_wrap", "Wrap", "checkbox", "Allow controls to wrap."),
      field("_merged", "Merged", "checkbox", "Use connected control styling."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container(["search", "xselect", "field", "button", "badge", "divider", "stack"])
  ),

  search: design(
    "Search Box",
    "Data Display",
    "search",
    {
      _type: "search",
      _placeholder: "Search records...",
      _size: "md",
      _clearable: true,
      _icon: true,
    },
    [
      field("_value", "Value", "text", "Current search value."),
      field("_placeholder", "Placeholder", "text", "Input placeholder text.", { _placeholder: "Search..." }),
      selectField("_size", "Size", "Search size.", ["sm", "md"]),
      field("_disabled", "Disabled", "checkbox", "Disable the search input."),
      field("_clearable", "Clearable", "checkbox", "Show the clear button when there is a value."),
      field("_icon", "Icon", "checkbox", "Show the search icon."),
      field("_autofocus", "Autofocus", "checkbox", "Autofocus the input when mounted.", { _advanced: true }),
      field("_input_id", "Input DOM ID", "text", "DOM id for the internal input.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  xselect: design(
    "Select",
    "Data Display",
    "list-filter",
    {
      _type: "xselect",
      _placeholder: "Choose status",
      _options: [
        { value: "active", label: "Active" },
        { value: "paused", label: "Paused" },
      ],
      _value: "active",
    },
    [
      field("_value", "Value", "text", "Currently selected option value."),
      field("_placeholder", "Placeholder", "text", "Placeholder option text."),
      field("_options", "Options", "json", "Select options with value, label, and optional disabled."),
      field("_data_source", "Options Data Source", "text", "XData key used as the options array.", { _advanced: true }),
      field("_selected_data_source", "Selected Data Source", "text", "XData key used as the selected value.", { _advanced: true }),
      field("_data_output", "Data Output", "text", "XData key to write the selected value on change.", { _advanced: true }),
      selectField("_size", "Size", "Select size.", ["sm", "md"]),
      field("_disabled", "Disabled", "checkbox", "Disable the select control."),
      field("_name", "Name", "text", "Native select name attribute.", { _advanced: true }),
      field("_select_id", "Select DOM ID", "text", "DOM id for the internal select element.", { _advanced: true }),
      field("_on_change", "Change Handler", "json", "Data-only command handler that receives the value as $data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  field: design(
    "Field",
    "Data Display",
    "text-cursor-input",
    {
      _type: "field",
      _label: "Field label",
      _hint: "Helpful field hint",
      _required: false,
      _control: {
        _type: "text",
        placeholder: "Enter value",
        _data_output: "form.value",
      },
    },
    [
      field("_label", "Label", "text", "Field label text."),
      field("_hint", "Hint", "textarea", "Helper text shown when there is no error."),
      field("_error", "Error", "textarea", "Validation error text. Takes priority over hint."),
      field("_required", "Required", "checkbox", "Show the required marker."),
      field("_inline", "Inline", "checkbox", "Render label and control inline."),
      selectField("_size", "Size", "Field size.", ["sm", "md"]),
      field("_control", "Control", "json", "Single form control child object."),
      field("_data_output", "Data Output", "text", "XData key copied to the control when the control does not define one.", { _advanced: true }),
      field("_update_data_source_event", "Update Event", "text", "Update event copied to the control when the control does not define one.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
  ),

  drawer: design(
    "Drawer",
    "Layout",
    "panel-right-open",
    {
      _type: "drawer",
      _open: true,
      _side: "right",
      _width: "420px",
      _title: "Details",
      _closable: true,
      _scroll: true,
      _elevated: true,
      _overlay: true,
      _children: [{ _type: "label", _text: "Drawer content" }],
    },
    [
      field("_open", "Open", "checkbox", "Whether the drawer is open."),
      selectField("_side", "Side", "Drawer side.", ["right", "left"]),
      field("_width", "Width", "text", "Drawer width CSS value."),
      field("_title", "Title", "text", "Drawer title."),
      field("_closable", "Closable", "checkbox", "Show close button."),
      field("_scroll", "Scrollable", "checkbox", "Wrap body content in a scroll container."),
      field("_elevated", "Elevated", "checkbox", "Use elevated drawer styling."),
      field("_overlay", "Overlay", "checkbox", "Use overlay drawer mode."),
      field("_children", "Body Children", "json", "Drawer body content."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container()
  ),

  sidebar: design(
    "Sidebar",
    "Navigation",
    "panel-left",
    {
      _type: "sidebar",
      _side: "left",
      _width: "280px",
      _title: "Dashboard",
      _subtitle: "Admin",
      _scroll: true,
      _dividers: true,
      _collapsed: false,
      _nav: {
        _type: "navlist",
        _active: "overview",
        _items: [
          { _label: "Overview", _value: "overview" },
          { _label: "Settings", _value: "settings" },
        ],
      },
    },
    [
      selectField("_side", "Side", "Sidebar side.", ["left", "right"]),
      field("_width", "Width", "text", "Sidebar width CSS value."),
      field("_title", "Title", "text", "Sidebar title."),
      field("_subtitle", "Subtitle", "text", "Sidebar subtitle."),
      field("_logo", "Logo", "json", "Canonical image object for the optional logo.", { _advanced: true }),
      field("_actions", "Actions", "json", "Header action child objects.", { _advanced: true }),
      field("_nav", "Navigation", "json", "Navigation object, usually navlist."),
      field("_scroll", "Scrollable", "checkbox", "Wrap the body in a scroll container."),
      field("_dividers", "Dividers", "checkbox", "Show dividers between sections."),
      field("_footer", "Footer", "json", "Footer child object.", { _advanced: true }),
      field("_collapsed", "Collapsed", "checkbox", "Whether the sidebar is collapsed."),
      field("_children", "Body Children", "json", "Sidebar body content when _nav is not provided.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container(["navlist", "button", "badge", "field", "igroup", "search", "xselect", "divider", "stack"])
  ),

  xsection: design(
    "Dashboard Section",
    "Dashboard",
    "layout-dashboard",
    {
      _type: "xsection",
      _title: "Section",
      _subtitle: "Group related dashboard content.",
      _children: [{ _type: "card", _title: "Section card", _text: "Content", _hide_image: true }],
    },
    [
      field("_title", "Title", "text", "Section title."),
      field("_subtitle", "Subtitle", "textarea", "Section subtitle or description."),
      selectField("_variant", "Variant", "Section surface variant.", ["plain", "subtle", "card"]),
      selectField("_density", "Density", "Section density.", ["compact", "comfortable", "spacious"]),
      selectField("_elevation", "Elevation", "Section elevation.", ["none", "xs", "sm", "md"]),
      field("_actions", "Actions", "json", "Header action child objects.", { _group: "content" }),
      field("_children", "Body Children", "json", "Section body content."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container(),
    [
      {
        _id: "title",
        _label: "Title",
        _role: "title",
        _kind: "property",
        _path: "_title",
        _actions: ["editable"],
      },
      {
        _id: "subtitle",
        _label: "Subtitle",
        _role: "subtitle",
        _kind: "property",
        _path: "_subtitle",
        _actions: ["editable"],
      },
      {
        _id: "actions",
        _label: "Actions",
        _role: "actions",
        _kind: "object-array",
        _path: "_actions",
        _actions: ["editable"],
      },
      {
        _id: "body",
        _label: "Body",
        _role: "body",
        _kind: "children",
        _path: "_children",
        _accepted_types: dashboardChildren,
        _actions: ["add-child"],
      },
    ]
  ),
};
