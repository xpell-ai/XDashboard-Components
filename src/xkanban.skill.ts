import type { XDashboardDiscoverySkill } from "./xskills";

export const XKANBAN_SKILL: XDashboardDiscoverySkill = {
  _id: "xkanban",
  _title: "XKanban",
  _version: "1.0.0",
  _active: true,
  _type: "view-skill",
  _category: "collection-presentation",
  _purpose: "grouped Kanban/card-board presentation",
  _aliases: [
    "kanban",
    "board",
    "workflow board",
    "pipeline",
    "grouped cards",
    "cards by status",
  ],
  _bindings: {
    _collection: ["_data_source", "_items"],
    _group: ["_group_by", "_columns"],
    _group_by: ["_group_by"],
  },
  _usage: [
    "Use when a collection should be grouped into responsive Kanban columns.",
    "Use _group_by to choose the record field that owns each column.",
    "Use _columns when column order or labels should be explicit.",
    "Prefer xkanban over table when workflow state matters more than dense column comparison.",
    "Prefer xkanban over xgallery when grouped progression, status lanes, or pipeline movement is central to the view.",
  ],
  _use_cases: [
    "task status",
    "CRM stages",
    "issues",
    "orders by stage",
    "workflow/pipeline records",
  ],
  _presentation: {
    _kind: "collection",
    _mode: "kanban",
    _alternatives: [
      "table",
      "xgallery",
      "xlist",
      "xkanban",
      "xtimeline",
      "xcalendar",
    ],
    _prefer_when: [
      "Records need to be grouped by a lifecycle, status, stage, or owner field.",
      "Users need to scan work-in-progress by column.",
      "Drag transition intent should be emitted without hardcoded entity persistence.",
    ],
  },
  _requires: ["xuiobject", "xdata", "badge", "empty"],
  _match: {
    _keywords: [
      "kanban",
      "board",
      "columns",
      "grouped",
      "group by",
      "grouped cards",
      "cards by status",
      "status",
      "pipeline",
      "workflow",
      "workflow board",
      "cards",
      "collection",
      "records",
      "task status",
      "crm stages",
      "issues",
      "orders by stage",
    ],
    _priority: 90,
  },

  _description:
    "Generic data-bound Kanban component that groups collection records by a field and renders mapped cards with title, subtitle, description, metadata, badge, optional image, actions, select events, and card-moved drag transition events.",

  _fields: {
    _items:
      "Static item array or XData key string. Use _data_source for XData-bound record collections.",
    _data_source:
      "Optional XData key used to hydrate and update Kanban records, for example task.records.",
    _group_by:
      "Record field or $row path used to group cards into columns, for example status or $row.status.",
    _columns:
      "Optional explicit column definitions: [{ _value, _label }]. Defines order and labels.",
    _item:
      "Item mapping object. Supports _title, _subtitle, _image, _image_alt, _description, _meta, _badge, and _actions. String values may use $row, $row.field, and $row_index.",
    _actions:
      "Optional per-item action child objects used when _item._actions is not set. Action templates receive _row, _row_index, and _context.",
    _row_key: "Optional row field used for stable card and action ids.",
    _min_col_width: "Responsive minimum column width in pixels.",
    _gap: "Gap between columns and cards in pixels.",
    _empty_text: "Text shown when the board has no records.",
    _empty_column_text: "Text shown when an explicit column has no records.",
    _empty:
      "Optional empty-board XUI object. Defaults to an empty object using _empty_text.",
    _draggable:
      "Enable native card drag/drop event emission. Defaults to true. The component never updates records directly.",
    _on_select:
      "Runtime-only callback for card selection. Do not persist JavaScript functions in generated views.",
    _on_card_moved:
      "Runtime-only callback for drag transitions. Receives record, source_group, and target_group; the component never persists entity changes.",
    _on_data:
      "Optional data handler. For persisted/generated views, use Nano-Commands/data-only, not functions.",
    class: "Optional CSS classes. xkanban is applied automatically.",
  },

  _core_rules: [
    "Use xkanban to render grouped record collections as Kanban columns.",
    "Keep the component generic; do not add entity-specific rendering or persistence logic.",
    "Use _data_source when records should come from XData.",
    "Use _items for static records or for an XData key string.",
    "Use _group_by for the record field that determines a card's group.",
    "Use _columns only when column order or labels need to be explicit.",
    "Use _item to map generic record fields; do not add domain-specific rendering logic.",
    "Use _item._actions or _actions for per-item buttons, links, or menu controls.",
    "Per-item action templates may reference $row, $row.field, and $row_index.",
    "Card clicks emit xkanban:item-select and may invoke runtime _on_select.",
    "Drag/drop emits xkanban:card-moved and may invoke runtime _on_card_moved; it must not mutate entities.",
    "Use xkanban for task status, CRM stages, issues, orders by stage, and workflow/pipeline records.",
    "Prefer xkanban over table when grouped workflow state matters more than dense comparison.",
    "Prefer xkanban over xgallery when the primary distinction is cards by group/status rather than a flat card grid.",
    "For persisted/generated views, handlers must be Nano-Commands/data-only.",
  ],

  _canonical_examples: [
    {
      _type: "xkanban",
      _id: "task-kanban",
      _data_source: "task.records",
      _group_by: "status",
      _columns: [
        { _value: "todo", _label: "To Do" },
        { _value: "doing", _label: "Doing" },
        { _value: "done", _label: "Done" },
      ],
      _row_key: "id",
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
    },
  ],
};
