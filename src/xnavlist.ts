import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

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
      _on_click: () => {
        if (disabled) return;
        const value = this.getItemValue(item);
        this.setActive(value, true);
        if ((this as any)._on_select) {
          this.checkAndRunInternalFunction((this as any)._on_select, value, item);
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
