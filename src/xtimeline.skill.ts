import type { XDashboardDiscoverySkill } from "./xskills";

export const XTIMELINE_SKILL: XDashboardDiscoverySkill = {
  _id: "xtimeline",
  _title: "XTimeline",
  _version: "1.0.0",
  _active: true,
  _type: "view-skill",
  _category: "collection-presentation",
  _purpose: "chronological/time-based presentation of records",
  _aliases: [
    "timeline",
    "history",
    "activity",
    "activity timeline",
    "chronological",
    "event history",
    "events",
    "event timeline",
    "activity feed",
    "chronology",
    "feed",
  ],
  _capabilities: ["temporal-records", "history-view"],
  _bindings: {
    _collection: ["_data_source", "_items"],
    _date: ["_date_field"],
    _sort: ["_order"],
    _item: [
      "_item._title",
      "_item._subtitle",
      "_item._description",
      "_item._meta",
      "_item._icon",
      "_item._image",
      "_item._image_alt",
      "_item._badge",
      "_item._actions",
    ],
    _actions: ["_item._actions", "_actions"],
    _events: ["xtimeline:item-select", "_on_select"],
  },
  _usage: [
    "Use when supplied records should be presented chronologically.",
    "Use _date_field to choose the record date/time path used for markers and sorting.",
    "Use _order:'asc' for oldest-first timelines and _order:'desc' for newest-first timelines.",
    "Prefer table for dense structured data.",
    "Prefer xgallery for visual cards.",
    "Prefer xlist for compact vertical scanning.",
    "Prefer xkanban for grouping by workflow or stage.",
    "Prefer xtimeline for records where chronology or history is important.",
    "The component only presents supplied records; it does not query, filter, or fetch history.",
  ],
  _use_cases: [
    "activity history",
    "audit logs",
    "order history",
    "maintenance history",
    "milestones",
    "status changes",
    "event feeds",
    "activity records",
    "events",
  ],
  _presentation: {
    _kind: "collection",
    _mode: "timeline",
    _alternatives: [
      "table",
      "xgallery",
      "xlist",
      "xkanban",
      "xtimeline",
      "xcalendar",
    ],
    _prefer_when: [
      "records where chronology/history is important",
      "record order is primarily chronological",
      "users need date/time markers and event context",
    ],
  },
  _requires: ["xuiobject", "xdata", "image", "badge", "empty"],
  _match: {
    _keywords: [
      "timeline",
      "activity timeline",
      "event timeline",
      "history",
      "activity",
      "chronological",
      "event history",
      "chronology",
      "feed",
      "activity feed",
      "events",
      "activity history",
      "audit",
      "logs",
      "order history",
      "maintenance history",
      "milestones",
      "event feeds",
      "created at",
      "updated at",
      "date",
      "time",
    ],
    _priority: 87,
  },

  _description:
    "Generic data-bound timeline component that renders supplied records in chronological order with a date/time marker, connector, mapped title, subtitle, description, metadata, optional icon/image, badge/status, per-item actions, and selection.",

  _fields: {
    _items:
      "Static item array or XData key string. Use _data_source for XData-bound timeline records.",
    _data_source:
      "Optional XData key used to hydrate and update timeline records, for example activity.records.",
    _date_field:
      "Record field or $row path used for item date/time markers and sorting, for example created_at or $row.created_at.",
    _order:
      "Chronological order: asc for oldest first, desc for newest first. Defaults to desc.",
    _item:
      "Item mapping object. Supports _title, _subtitle, _description, _meta, _icon, _image, _image_alt, _badge, and _actions. String values may use $row, $row.field, and $row_index.",
    _actions:
      "Optional per-item action child objects used when _item._actions is not set. Action templates receive _row, _row_index, and _context.",
    _row_key: "Optional row field used for stable item and action ids.",
    _selectable: "Enable item click/keyboard selection.",
    _selected_key: "Optional selected row key.",
    _empty_text: "Text shown when there are no records.",
    _empty:
      "Optional empty-state XUI object. Defaults to an empty object using _empty_text.",
    _undated_text:
      "Text shown in the date marker when an item has no usable date. Defaults to Undated.",
    _on_data:
      "Optional data handler. For persisted/generated views, use Nano-Commands/data-only, not functions.",
    class: "Optional CSS classes. xtimeline is applied automatically.",
  },

  _core_rules: [
    "Use xtimeline to present supplied records as a chronological vertical timeline.",
    "Keep the component generic; do not add entity-specific rendering, fetching, querying, or filtering logic.",
    "Use _data_source when records should come from XData.",
    "Use _items for static records or for an XData key string.",
    "Use _date_field for the record date/time path used by markers and sorting.",
    "Use _order:'asc' or _order:'desc' for chronological direction.",
    "Use _item to map generic record fields; do not add domain-specific rendering logic.",
    "Supported item mappings include _title, _subtitle, _description, _meta, _icon, _image, _image_alt, _badge, and _actions.",
    "Use _item._actions or _actions for per-item buttons, links, or menu controls.",
    "Per-item action templates may reference $row, $row.field, and $row_index.",
    "Item clicks emit xtimeline:item-select and may invoke runtime _on_select.",
    "For persisted/generated views, handlers must be Nano-Commands/data-only.",
  ],

  _canonical_examples: [
    {
      _type: "xtimeline",
      _id: "activity-timeline",
      _data_source: "activity.records",
      _date_field: "created_at",
      _order: "desc",
      _row_key: "id",
      _item: {
        _title: "$row.title",
        _subtitle: "$row.type",
        _description: "$row.notes",
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
  ],
};
