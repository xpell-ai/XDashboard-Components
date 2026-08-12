import type { XpellSkill } from "@xpell/core";

type XpellSkillDesign = NonNullable<XpellSkill["_design"]>;
type XpellSkillInspectorField = NonNullable<
  NonNullable<XpellSkillDesign["_inspector"]>["_fields"]
>[number];
type XpellSkillChildDesign = NonNullable<XpellSkillDesign["_children"]>;

type XDashboardType =
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

const dashboardChildren = [
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

function field(
  _key: string,
  _label: string,
  _input: NonNullable<XpellSkillInspectorField["_input"]>,
  _description: string,
  extra: Partial<XpellSkillInspectorField> = {}
): XpellSkillInspectorField {
  return { _key, _label, _input, _description, ...extra };
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

function design(
  _title: string,
  _category: string,
  _icon: string,
  _default_object: Record<string, any>,
  _fields: XpellSkillInspectorField[],
  _children: XpellSkillDesign["_children"]
): XpellSkillDesign {
  return {
    _inspector: {
      _fields,
      _sections: sections,
    },
    _children,
    _palette: {
      _title,
      _category,
      _icon,
      _default_object,
    },
  };
}

export const XDashboardSkillDesigns: Record<XDashboardType, XpellSkillDesign> = {
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
      field("_columns", "Columns", "json", "Table columns. Prefer _key and _title; do not use render functions.", {
        _required: true,
      }),
      field("_rows", "Rows", "json", "Static row array or XData key string."),
      field("_data_source", "Data Source", "text", "XData key used to hydrate/update rows."),
      field("_row_key", "Row Key", "text", "Row field used as the stable row key."),
      field("_dense", "Dense", "checkbox", "Use compact row spacing."),
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
      field("_dense", "Dense", "checkbox", "Use compact row spacing."),
      field("_selectable", "Selectable", "checkbox", "Enable item click and keyboard selection."),
      field("_selected_key", "Selected Key", "text", "Selected row key."),
      field("_gap", "Gap", "number", "Gap between list rows in pixels."),
      field("_empty_text", "Empty Text", "text", "Message shown when there are no records."),
      field("_empty", "Empty State", "json", "Optional empty-state child object.", { _advanced: true }),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
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
      field("_selectable", "Selectable", "checkbox", "Enable item click and keyboard selection."),
      field("_selected_key", "Selected Key", "text", "Selected row key."),
      field("_empty_text", "Empty Text", "text", "Message shown when there are no records."),
      field("_empty", "Empty State", "json", "Optional empty-state child object.", { _advanced: true }),
      field("_undated_text", "Undated Text", "text", "Text shown when a record has no usable date.", { _advanced: true }),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
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
      field("_selectable", "Selectable", "checkbox", "Enable item click and keyboard selection."),
      field("_selected_key", "Selected Key", "text", "Selected row key."),
      field("_empty_text", "Empty Text", "text", "Message shown when the visible month has no records."),
      field("_empty", "Empty State", "json", "Optional empty-state child object.", { _advanced: true }),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
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
      field("_columns", "Columns", "number", "Preferred desktop column count."),
      field("_min_col_width", "Min Card Width", "number", "Responsive auto-fit minimum card width in pixels."),
      field("_gap", "Gap", "number", "Gap between gallery cards in pixels."),
      field("_empty_text", "Empty Text", "text", "Message shown when there are no records."),
      field("_empty", "Empty State", "json", "Optional empty-state child object.", { _advanced: true }),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
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
      field("_min_col_width", "Min Column Width", "number", "Responsive minimum column width in pixels."),
      field("_gap", "Gap", "number", "Gap between Kanban columns and cards in pixels."),
      field("_empty_text", "Empty Text", "text", "Message shown when there are no records."),
      field("_empty_column_text", "Empty Column Text", "text", "Message shown in empty explicit columns."),
      field("_empty", "Empty State", "json", "Optional empty-board child object.", { _advanced: true }),
      field("_draggable", "Draggable", "checkbox", "Enable generic card-moved event emission."),
      field("_on_data", "Data Handler", "json", "Optional data-only handler for incoming record data.", { _advanced: true }),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    leaf()
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
      field("_items", "Metric Items", "json", "Metric definitions with _aggregate, _field, and optional _filter configuration.", {
        _required: true,
      }),
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
      selectField("_align", "Align", "Cross-axis alignment.", ["start", "center", "end", "stretch"]),
      field("_wrap", "Wrap", "checkbox", "Allow controls to wrap."),
      field("_dense", "Dense", "checkbox", "Use compact spacing."),
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
      field("_actions", "Actions", "json", "Header action child objects."),
      field("_children", "Body Children", "json", "Section body content."),
      field("class", "CSS Classes", "text", "Additional CSS classes.", { _advanced: true }),
    ],
    container()
  ),
};
