import type { XDashboardDiscoverySkill } from "./xskills";

export const XLIST_SKILL: XDashboardDiscoverySkill = {
  _id: "xlist",
  _title: "XList",
  _version: "1.0.0",
  _active: true,
  _type: "view-skill",
  _category: "collection-presentation",
  _purpose: "compact/rich vertical presentation of record collections",
  _aliases: [
    "list",
    "rich list",
    "compact list",
    "record list",
    "rows",
    "feed",
    "rich-list",
    "compact-list",
    "record-list",
  ],
  _bindings: {
    _collection: ["_data_source", "_items"],
    _item: [
      "_item._title",
      "_item._subtitle",
      "_item._description",
      "_item._meta",
      "_item._icon",
      "_item._image",
      "_item._avatar",
      "_item._badge",
      "_item._leading",
      "_item._trailing",
      "_item._actions",
    ],
    _actions: ["_item._actions", "_actions"],
  },
  _usage: [
    "Use when a collection should be presented as a vertical record list.",
    "Prefer xlist between table and xgallery when records need summaries, badges, icons, and actions without a card grid.",
    "Prefer table for dense structured data with many comparable columns.",
    "Prefer xgallery for visual/card-heavy records.",
    "Prefer xlist for compact scanning with richer content than a table row.",
    "Prefer xkanban for records grouped by workflow, lifecycle, status, or stage.",
  ],
  _use_cases: [
    "contacts",
    "tasks",
    "plants",
    "music/media",
    "notifications",
    "messages",
    "orders",
    "activity/feed-style records",
  ],
  _requires: ["xuiobject", "xdata", "image", "badge", "empty"],
  _match: {
    _keywords: [
      "list",
      "record list",
      "rich list",
      "compact list",
      "rows",
      "feed",
      "collection",
      "records",
      "summaries",
      "status list",
      "contacts",
      "tasks",
      "plants",
      "music",
      "media",
      "notifications",
      "messages",
      "orders",
      "activity",
    ],
    _priority: 86,
  },
  _presentation: {
    _kind: "collection",
    _mode: "list",
    _alternatives: [
      "table",
      "xgallery",
      "xlist",
      "xkanban",
      "xtimeline",
      "xcalendar",
    ],
    _prefer_when: [
      "compact scanning is needed with richer content than a table row",
      "items need title, subtitle, description/meta, icon/image/avatar, badge/status, leading/trailing content, or actions",
      "records should remain readable in narrow/mobile layouts without becoming visual cards",
    ],
  },

  _description:
    "Generic data-bound list component that renders a collection of records as responsive rows with mapped title, subtitle, description, metadata, icon/image/avatar, badge, leading/trailing content, per-item actions, and selection.",

  _fields: {
    _items:
      "Static item array or XData key string. Use _data_source for XData-bound record collections.",
    _data_source:
      "Optional XData key used to hydrate and update list records, for example records.items.",
    _item:
      "Item mapping object. Supports _title, _subtitle, _description, _meta, _icon, _image, _avatar, _image_alt, _badge, _leading, _trailing, and _actions. String values may use $row, $row.field, and $row_index.",
    _actions:
      "Optional per-item action child objects used when _item._actions is not set. Action templates receive _row, _row_index, and _context.",
    _row_key: "Optional row field used for stable item and action ids.",
    _dense: "Use compact row spacing.",
    _selectable: "Enable item click/keyboard selection.",
    _selected_key: "Optional selected row key.",
    _gap: "Gap between list rows in pixels.",
    _empty_text: "Text shown when there are no items.",
    _empty:
      "Optional empty-state XUI object. Defaults to an empty object using _empty_text.",
    _on_data:
      "Optional data handler. For persisted/generated views, use Nano-Commands/data-only, not functions.",
    class: "Optional CSS classes. xlist is applied automatically.",
  },

  _core_rules: [
    "Use xlist to render record collections as vertical rich or compact rows.",
    "Use _data_source when records should come from XData.",
    "Use _items for static records or for an XData key string.",
    "Use _item to map generic record fields; do not add domain-specific rendering logic.",
    "Supported item mappings include _title, _subtitle, _description, _meta, _icon, _image, _avatar, _badge, _leading, _trailing, and _actions.",
    "Use _item._actions or _actions for per-item buttons, links, or menu controls.",
    "Use _item._leading and _item._trailing for additional generic row slots.",
    "Per-item action templates may reference $row, $row.field, and $row_index.",
    "Use xlist for contacts, tasks, plants, music/media, notifications, messages, orders, and activity/feed-style records when a generic vertical collection is appropriate.",
    "Prefer table for dense structured data or many columns.",
    "Prefer xgallery for visual/card-heavy records.",
    "Prefer xlist for compact scanning with richer content than a table row.",
    "Prefer xkanban for records grouped by workflow or stage.",
    "For persisted/generated views, handlers must be Nano-Commands/data-only.",
  ],

  _canonical_examples: [
    {
      _type: "xlist",
      _id: "record-list",
      _data_source: "records.items",
      _row_key: "id",
      _dense: false,
      _selectable: true,
      _item: {
        _title: "$row.name",
        _subtitle: "$row.type",
        _description: "$row.summary",
        _meta: "$row.updated_at",
        _icon: "$row.icon",
        _badge: "$row.status",
        _actions: [
          {
            _type: "button",
            _text: "Open",
            _on: {
              click: {
                _module: "xd",
                _op: "set",
                _params: {
                  key: "records.selected",
                  value: "$row",
                  source: "record-list",
                },
              },
            },
          },
        ],
      },
      _empty_text: "No records",
    },
  ],
};
