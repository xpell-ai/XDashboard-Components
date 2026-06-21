import { XUIObject, _xlog, type XUIObjectData, type XpellSkill } from "@xpell/ui";

/**
 * XGridData — JSON shape for the `grid` layout primitive.
 *
 * Notes:
 * - XGrid is a pure layout wrapper (CSS Grid). It does NOT touch children.
 * - Use `_cols` for fixed columns.
 * - Use `_min_col_width` for responsive auto-fit columns (recommended for dashboards).
 *
 * Example (fixed cols):
 * {
 *   _type: "grid",
 *   _id: "cards_grid",
 *   _cols: 3,
 *   _gap: 16,
 *   _children: [ ... ]
 * }
 *
 * Example (auto-fit):
 * {
 *   _type: "grid",
 *   _id: "kpis",
 *   _min_col_width: 240,
 *   _gap: 16,
 *   _children: [ ... ]
 * }
 */
export interface XGridData extends XUIObjectData {
  _type: "grid";

  /**
   * Fixed number of columns.
   * Ignored if `_min_col_width` is set (auto-fit mode).
   */
  _cols?: number;

  /**
   * Gap between items in px.
   * (Will be converted to CSS variable --x-grid-gap)
   */
  _gap?: number;

  /**
   * If set, enables responsive auto-fit columns with this min column width (px).
   * (Will be converted to CSS variable --x-grid-min-col)
   */
  _min_col_width?: number;
}


/**
 * XGrid — pure layout primitive
 *
 * JSON:
 * {
 *   _type: "grid",
 *   _cols: 4,                  // optional
 *   _gap: 16,                  // optional (px)
 *   _min_col_width: 220,       // optional → enables auto-fit mode
 *   _children: [ ... ]
 * }
 */
export class XGrid extends XUIObject {
  static _xtype = "grid";
  static _skill: XpellSkill = {
    _id: "grid",
    _title: "XGrid",
    _version: "1.0.0",
    _active: true,
    _type: "view-skill",
    _requires: ["xuiobject", "view"],
    _match: {
      _keywords: ["grid", "layout", "cards", "dashboard", "columns", "responsive"],
      _priority: 80
    },

    _description:
      "Dashboard CSS grid layout container for arranging child UI objects in fixed or responsive columns.",

    _fields: {
      _children: "Child UI objects placed inside the grid.",
      _cols: "Fixed number of columns.",
      _gap: "Gap between grid items in pixels.",
      _min_col_width:
        "Responsive auto-fit minimum column width in pixels. Preferred for dashboards.",
      class: "Optional CSS classes. xgrid is applied automatically."
    },

    _core_rules: [
      "Use grid for dashboard/card layouts.",
      "Use _children for grid items.",
      "Use _min_col_width for responsive dashboards.",
      "Use _cols only when fixed columns are required.",
      "_min_col_width takes priority over _cols.",
      "Do not use grid for tabular data; use table instead."
    ],

    _canonical_examples: [
      {
        _type: "grid",
        _id: "kpi-grid",
        _min_col_width: 240,
        _gap: 16,
        _children: [
          {
            _type: "card",
            _title: "Revenue",
            _text: "$120K"
          },
          {
            _type: "card",
            _title: "Users",
            _text: "4,320"
          }
        ]
      }
    ]
  };

  _cols?: number;
  _gap?: number;
  _min_col_width?: number;

  constructor(data: XGridData) {
    const defaults: any = {
      _type: XGrid._xtype,
      class: "xgrid",
      _html_tag: "div"
    };

    super(data, defaults, true);
    this.parse(data);

    
    
    // translate props → CSS variables
    if (this._cols) {
      (this as any).style = `${(this as any).style || ""}; --x-grid-cols:${this._cols}`;
    }

    if (this._gap) {
      (this as any).style = `${(this as any).style || ""}; --x-grid-gap:${this._gap}px`;
    }

    if (this._min_col_width) {
      (this as any).style =
        `${(this as any).style || ""}; --x-grid-min-col:${this._min_col_width}px`;
    }
  }
}
