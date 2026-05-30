import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";
import type { XpellSkill } from "@xpell/ui";

export type XNavItem = {
  _id?: string;
  _label: string;
  _icon?: XUIObjectData;
  _badge?: XUIObjectData;
  _disabled?: boolean;
  _active?: boolean;
  _value?: string;
};

export interface XNavListData extends XUIObjectData {
  _type: "navlist";
  _items?: XNavItem[];
  _active?: string;
  _dense?: boolean;
  _dividers?: boolean;
  _on_select?: (xobj: XNavList, value: string, item: XNavItem) => void;
  class?: string;
}

export class XNavList extends XUIObject {
  static _xtype = "navlist";
  static _skill: XpellSkill = {
    _id: "navlist",
    _title: "XNavList",
    _version: "1.0.0",
    _active: true,
    _type: "view-skill",
    _requires: ["xuiobject", "stack", "label"],

    _description:
      "Dashboard navigation list for rendering selectable vertical navigation items with optional icons, badges, dense mode, dividers, and active state.",

    _fields: {
      _items:
        "Navigation items: { _label, _value?, _id?, _icon?, _badge?, _disabled?, _active? }.",
      _active:
        "Currently active item value. Matches _value, then _id, then _label.",
      _dense:
        "Use compact item spacing.",
      _dividers:
        "Show visual dividers between items.",
      class:
        "Optional CSS classes. xnavlist is applied automatically."
    },

    _core_rules: [
      "Use navlist for sidebar/menu/dashboard navigation.",
      "Use _items to define navigation entries.",
      "Use _value as the stable navigation key.",
      "Use _active to highlight the current item.",
      "Use _icon for optional leading icon objects.",
      "Use _badge for optional trailing badge/status objects.",
      "Do not generate _on_select; it is an internal runtime callback only.",
      "Do not generate JavaScript functions in navlist JSON."
    ],

    _canonical_examples: [
      {
        _type: "navlist",
        _id: "main-nav",
        _items: [
          {
            _label: "Home",
            _value: "home"
          },
          {
            _label: "Reports",
            _value: "reports",
            _badge: {
              _type: "badge",
              _text: "3"
            }
          },
          {
            _label: "Settings",
            _value: "settings",
            _disabled: true
          }
        ],
        _active: "home",
        _dense: true,
        _dividers: false
      }
    ]
  };

  static override getArtifactStrategy() {
    return "generator" as const;
  }
  static generateArtifact(intent: any = {}): XNavListData {
    const items =
      Array.isArray(intent._items) && intent._items.length
        ? intent._items
        : [];

    const normalizedItems =
      items.length > 0
        ? items
        : [
          {
            _label: "Overview",
            _value: "overview",
          },
          {
            _label: "Records",
            _value: "records",
          },
        ];

    return {
      _type: "navlist",

      ...(intent._id
        ? { _id: intent._id }
        : {}),

      _items: normalizedItems,

      _active:
        typeof intent._active === "string"
          ? intent._active
          : normalizedItems[0]?._value,

      _dense: true,
      _dividers: false,
    };
  }

  private __items: XNavItem[] = [];
  private __active = "";
  private __dense = false;
  private __dividers = false;

  private readonly __list_id: string;

  constructor(data: XNavListData) {
    const defaults: any = {
      _type: XNavList._xtype,
      class: "xnavlist",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__list_id = this._id + "_list";
    this.parse(data);
    this.applyProps();
    this.applyLayout();
    this.buildSkeleton();
    this.renderItems();
  }

  private normalizeBoolean(value?: boolean): boolean {
    return value === true || value === ("true" as any);
  }

  private normalizeItems(value?: XNavItem[]): XNavItem[] {
    return Array.isArray(value) ? value : [];
  }

  private applyProps() {
    this.__items = this.normalizeItems((this as any)._items);
    this.__active = (this as any)._active ? String((this as any)._active) : "";
    this.__dense = this.normalizeBoolean((this as any)._dense);
    this.__dividers = this.normalizeBoolean((this as any)._dividers);
  }

  private buildSkeleton() {
    this.append({
      _type: "stack",
      _id: this.__list_id,
      class: "xnavlist__list",
      _direction: "vertical",
      _gap: 4,
      _children: [],
    });
  }

  private getList() {
    return XUI.getObject(this.__list_id) as XUIObject | undefined;
  }

  private clearList(target: XUIObject | undefined) {
    if (!target) return;
    const children = Array.isArray((target as any)._children)
      ? [...((target as any)._children as XUIObject[])]
      : [];
    children.forEach((child) => {
      if (typeof (target as any).removeChild === "function") {
        (target as any).removeChild(child as any, true);
      }
    });
    (target as any)._children = [];
    if (target.dom instanceof HTMLElement) {
      target.dom.replaceChildren();
    }
  }

  private getItemValue(item: XNavItem): string {
    if (item._value) return String(item._value);
    if (item._id) return String(item._id);
    return String(item._label);
  }

  private isActive(item: XNavItem): boolean {
    if (item._active === true) return true;
    const value = this.getItemValue(item);
    return value === this.__active;
  }

  private buildItem(item: XNavItem) {
    const disabled = item._disabled === true;
    const active = this.isActive(item);
    const classes = ["xnavlist__item"];
    if (active) classes.push("xnavlist__item--active");
    if (disabled) classes.push("xnavlist__item--disabled");

    const rowChildren: XUIObjectData[] = [];
    if (item._icon) rowChildren.push(item._icon);

    rowChildren.push({
      _type: "label",
      class: "xnavlist__label",
      _text: String(item._label ?? ""),
    });

    if (item._badge) {
      rowChildren.push({
        _type: "view",
        class: "xnavlist__badge",
        _children: [item._badge],
      });
    }

    return {
      _type: "view",
      class: classes.join(" "),
      _on: {
        click: () => {
          if (disabled) return;
          const value = this.getItemValue(item);
          this.setActive(value, true);
          if ((this as any)._on_select) {
            this.checkAndRunInternalFunction((this as any)._on_select, value, item);
          }
        }
      },
      _children: rowChildren,
    } as XUIObjectData;
  }

  private renderItems() {
    const list = this.getList();
    if (!list) return;
    this.clearList(list);

    this.__items.forEach((item) => {
      list.append(this.buildItem(item));
    });
  }

  private applyLayout() {
    this.addClass("xnavlist");
    const allMods = ["xnavlist--dense", "xnavlist--dividers"];
    const nextMods: string[] = [];
    if (this.__dense) nextMods.push("xnavlist--dense");
    if (this.__dividers) nextMods.push("xnavlist--dividers");
    this.replaceClass(allMods.join(" "), nextMods.join(" "));
  }

  setActive(value: string, silent = false) {
    this.__active = String(value ?? "");
    this.renderItems();
    if (!silent && (this as any)._on_select) {
      const match = this.__items.find((i) => this.getItemValue(i) === this.__active);
      if (match) {
        this.checkAndRunInternalFunction((this as any)._on_select, this.__active, match);
      }
    }
  }

  getActive(): string {
    return this.__active;
  }

  setItems(items: XNavItem[]) {
    this.__items = this.normalizeItems(items);
    this.renderItems();
  }

  set _items(value: XNavItem[] | undefined) {
    this.__items = this.normalizeItems(value);
    this.renderItems();
  }

  get _items() {
    return this.__items;
  }

  set _active(value: string | undefined) {
    this.__active = value ? String(value) : "";
    this.renderItems();
  }

  get _active() {
    return this.__active;
  }

  set _dense(value: boolean | undefined) {
    this.__dense = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _dense() {
    return this.__dense;
  }

  set _dividers(value: boolean | undefined) {
    this.__dividers = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _dividers() {
    return this.__dividers;
  }
}
