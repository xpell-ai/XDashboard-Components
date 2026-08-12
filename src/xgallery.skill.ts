import type { XDashboardDiscoverySkill } from "./xskills";

export const XGALLERY_SKILL: XDashboardDiscoverySkill = {
  _id: "xgallery",
  _title: "XGallery",
  _version: "1.0.0",
  _active: true,
  _type: "view-skill",
  _category: "collection-presentation",
  _purpose: "Render record collections as cards/gallery",
  _aliases: ["gallery", "cards", "card-grid", "grid", "tiles"],
  _bindings: {
    _collection: ["_data_source", "_items"],
  },
  _usage: [
    "Use when a collection should be presented as responsive cards or tiles.",
    "Prefer xgallery over table when images, summaries, badges, or card actions are important.",
  ],
  _presentation: {
    _kind: "collection",
    _mode: "gallery",
    _alternatives: [
      "table",
      "xgallery",
      "xlist",
      "xkanban",
      "xtimeline",
      "xcalendar",
    ],
    _prefer_when: [
      "records are visual or card-heavy",
      "image, thumbnail, badge, and summary scanning matter more than dense column comparison",
      "a flat collection should be browsed as cards rather than workflow columns",
    ],
  },
  _requires: ["xuiobject", "xdata", "image", "badge", "empty"],
  _match: {
    _keywords: [
      "gallery",
      "card-grid",
      "grid",
      "tiles",
      "card grid",
      "cards",
      "collection",
      "records",
      "products",
      "contacts",
      "media",
      "recipes",
    ],
    _priority: 88,
  },

  _description:
    "Generic data-bound gallery component that renders a collection of records as responsive cards with mapped title, subtitle, image, description, metadata, badge, and per-item actions.",

  _fields: {
    _items:
      "Static item array or XData key string. Use _data_source for XData-bound record collections.",
    _data_source:
      "Optional XData key used to hydrate and update the gallery records, for example records.items.",
    _item:
      "Item mapping object. Supports _title, _subtitle, _image, _image_alt, _description, _meta, _badge, and _actions. String values may use $row, $row.field, and $row_index.",
    _actions:
      "Optional per-item action child objects used when _item._actions is not set. Action templates receive _row, _row_index, and _context.",
    _row_key: "Optional row field used for stable item and action ids.",
    _columns: "Preferred column count for desktop layouts.",
    _min_col_width: "Responsive auto-fit minimum card width in pixels.",
    _gap: "Gap between cards in pixels.",
    _empty_text: "Text shown when there are no items.",
    _empty:
      "Optional empty-state XUI object. Defaults to an empty object using _empty_text.",
    _on_data:
      "Optional data handler. For persisted/generated views, use Nano-Commands/data-only, not functions.",
    class: "Optional CSS classes. xgallery is applied automatically.",
  },

  _core_rules: [
    "Use xgallery to render record collections as cards or media grids.",
    "Use it for records that benefit from images, summaries, badges, metadata, or per-item actions.",
    "Use _data_source when records should come from XData.",
    "Use _items for static records or for an XData key string.",
    "Use _item to map generic record fields; do not add domain-specific rendering logic.",
    "Use _item._actions or _actions for per-item buttons, links, or menu controls.",
    "Per-item action templates may reference $row, $row.field, and $row_index.",
    "Prefer xgallery over table when images, summaries, badges, or card actions matter more than dense column comparison.",
    "Prefer table over xgallery for spreadsheet-like scanning, sorting, and many comparable columns.",
    "For persisted/generated views, handlers must be Nano-Commands/data-only.",
  ],

  _canonical_examples: [
    {
      _type: "xgallery",
      _id: "record-gallery",
      _data_source: "records.items",
      _columns: 3,
      _min_col_width: 220,
      _gap: 16,
      _row_key: "id",
      _item: {
        _title: "$row.name",
        _subtitle: "$row.type",
        _image: "$row.image",
          _description: "$row.summary",
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
                    source: "record-gallery",
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
