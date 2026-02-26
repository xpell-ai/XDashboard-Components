import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XDrawerData extends XUIObjectData {
  _type: "drawer";
  _open?: boolean;
  _side?: "right" | "left";
  _width?: string;
  _title?: string;
  _closable?: boolean;
  _scroll?: boolean;
  _elevated?: boolean;
  _overlay?: boolean;
  _on_open?: (xobj: XDrawer) => void;
  _on_close?: (xobj: XDrawer) => void;
  class?: string;
}

type XDrawerSide = "right" | "left";

export class XDrawer extends XUIObject {
  static _xtype = "drawer";

  private __open = false;
  private __side: XDrawerSide = "right";
  private __width = "360px";
  private __title?: string;
  private __closable = true;
  private __scroll = true;
  private __elevated = true;
  private __overlay = false;
  private __body_children: XUIObjectData[] = [];

  private readonly __panel_id: string;
  private readonly __header_id: string;
  private readonly __body_id: string;
  private readonly __scroll_id: string;
  private readonly __close_id: string;
  private readonly __title_id: string;

  private static readonly managedStyles = new Set(["--xdrawer-width"]);

  constructor(data: XDrawerData) {
    const defaults: any = {
      _type: XDrawer._xtype,
      class: "xdrawer",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__panel_id = this._id + "_panel";
    this.__header_id = this._id + "_header";
    this.__body_id = this._id + "_body";
    this.__scroll_id = this._id + "_scroll";
    this.__close_id = this._id + "_close";
    this.__title_id = this._id + "_title";

    this.parse(data);
    this.applyProps();
    this.__body_children = Array.isArray((this as any)._children)
      ? [...((this as any)._children as XUIObjectData[])]
      : [];
    (this as any)._children = [];
    this.buildSkeleton(this.__body_children);
    this.applyLayout();
  }

  private normalizeSide(value?: XDrawerSide): XDrawerSide {
    return value === "left" ? "left" : "right";
  }

  private normalizeBoolean(value?: boolean, fallback = false): boolean {
    if (value === true || value === ("true" as any)) return true;
    if (value === false || value === ("false" as any)) return false;
    return fallback;
  }

  private applyProps() {
    this.__open = this.normalizeBoolean((this as any)._open, false);
    this.__side = this.normalizeSide((this as any)._side);
    this.__width = (this as any)._width ? String((this as any)._width) : "360px";
    this.__title = (this as any)._title ? String((this as any)._title) : undefined;
    this.__closable = this.normalizeBoolean((this as any)._closable, true);
    this.__scroll = this.normalizeBoolean((this as any)._scroll, true);
    this.__elevated = this.normalizeBoolean((this as any)._elevated, true);
    this.__overlay = this.normalizeBoolean((this as any)._overlay, false);
  }

  private hasTitle(): boolean {
    return this.__title !== undefined && this.__title.trim().length > 0;
  }

  private buildHeader() {
    if (!this.hasTitle() && !this.__closable) return null;

    const headerChildren: XUIObjectData[] = [];
    if (this.hasTitle()) {
      headerChildren.push({
        _type: "label",
        _id: this.__title_id,
        class: "xdrawer__title",
        _text: this.__title?.trim(),
      });
    }
    if (this.__closable) {
      headerChildren.push({
        _type: "button",
        _id: this.__close_id,
        class: "xdrawer__close",
        _text: "×",
        _on_click: () => this.setOpen(false),
      });
    }

    return {
      _type: "view",
      _id: this.__header_id,
      class: "xdrawer__header",
      _children: headerChildren,
    } as XUIObjectData;
  }

  private buildBody(contentChildren: XUIObjectData[]) {
    const content = this.__scroll
      ? [
          {
            _type: "scroll",
            _id: this.__scroll_id,
            class: "xdrawer__scroll",
            _children: contentChildren,
          },
        ]
      : contentChildren;

    return {
      _type: "view",
      _id: this.__body_id,
      class: "xdrawer__body",
      _children: content,
    } as XUIObjectData;
  }

  private buildSkeleton(userChildren: XUIObjectData[]) {
    const rootChildren: XUIObjectData[] = [];
    const header = this.buildHeader();
    if (header) rootChildren.push(header);
    rootChildren.push(this.buildBody(userChildren));

    this.append({
      _type: "view",
      _id: this.__panel_id,
      class: "xdrawer__panel",
      _children: rootChildren,
    });
  }

  private rebuild() {
    const panel = XUI.getObject(this.__panel_id) as XUIObject | undefined;
    if (panel && typeof (this as any).removeChild === "function") {
      (this as any).removeChild(panel as any, true);
    }
    this.buildSkeleton(this.__body_children);
    this.applyLayout();
  }

  private stripManagedStyles(style: string): string {
    if (!style) return "";
    const parts = style
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean);

    const kept: string[] = [];
    for (const part of parts) {
      const idx = part.indexOf(":");
      if (idx === -1) continue;
      const prop = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();
      if (!prop || !val) continue;
      if (XDrawer.managedStyles.has(prop)) continue;
      kept.push(`${prop}:${val}`);
    }

    return kept.join("; ");
  }

  private updateTitle() {
    const titleObj = XUI.getObject(this.__title_id) as any;
    if (!titleObj) return;
    const text = this.__title ? String(this.__title) : "";
    titleObj._text = text;
  }

  private applyLayout() {
    this.addClass("xdrawer");
    const allMods = [
      "xdrawer--open",
      "xdrawer--left",
      "xdrawer--right",
      "xdrawer--elevated",
      "xdrawer--overlay",
    ];
    const nextMods: string[] = [];
    if (this.__open) nextMods.push("xdrawer--open");
    nextMods.push(`xdrawer--${this.__side}`);
    if (this.__elevated) nextMods.push("xdrawer--elevated");
    if (this.__overlay) nextMods.push("xdrawer--overlay");
    this.replaceClass(allMods.join(" "), nextMods.join(" "));

    const baseStyle = this.stripManagedStyles(String((this as any).style || ""));
    const styleParts: string[] = [];
    if (baseStyle) styleParts.push(baseStyle);
    if (this.__width) styleParts.push(`--xdrawer-width:${this.__width}`);
    const nextStyle = styleParts.join("; ");
    (this as any).style = nextStyle;

    this.updateTitle();
  }

  isOpen(): boolean {
    return this.__open;
  }

  setOpen(open: boolean, silent = false) {
    const next = this.normalizeBoolean(open, false);
    const changed = next !== this.__open;
    this.__open = next;
    this.applyLayout();

    if (!changed || silent) return;
    if (this.__open && (this as any)._on_open) {
      this.checkAndRunInternalFunction((this as any)._on_open);
    }
    if (!this.__open && (this as any)._on_close) {
      this.checkAndRunInternalFunction((this as any)._on_close);
    }
  }

  toggle() {
    this.setOpen(!this.__open);
  }

  set _open(value: boolean | undefined) {
    this.__open = this.normalizeBoolean(value, false);
    this.applyLayout();
  }

  get _open() {
    return this.__open;
  }

  set _side(value: XDrawerSide | undefined) {
    this.__side = this.normalizeSide(value);
    this.applyLayout();
  }

  get _side() {
    return this.__side;
  }

  set _width(value: string | undefined) {
    this.__width = value ? String(value) : "360px";
    this.applyLayout();
  }

  get _width() {
    return this.__width;
  }

  set _title(value: string | undefined) {
    const hadTitle = this.hasTitle();
    this.__title = value ? String(value) : undefined;
    const hasTitle = this.hasTitle();
    if (hadTitle !== hasTitle) {
      this.rebuild();
    } else {
      this.updateTitle();
      this.applyLayout();
    }
  }

  get _title() {
    return this.__title;
  }

  set _closable(value: boolean | undefined) {
    this.__closable = this.normalizeBoolean(value, true);
    this.rebuild();
  }

  get _closable() {
    return this.__closable;
  }

  set _scroll(value: boolean | undefined) {
    this.__scroll = this.normalizeBoolean(value, true);
    this.rebuild();
  }

  get _scroll() {
    return this.__scroll;
  }

  set _elevated(value: boolean | undefined) {
    this.__elevated = this.normalizeBoolean(value, true);
    this.applyLayout();
  }

  get _elevated() {
    return this.__elevated;
  }

  set _overlay(value: boolean | undefined) {
    this.__overlay = this.normalizeBoolean(value, false);
    this.applyLayout();
  }

  get _overlay() {
    return this.__overlay;
  }
}
