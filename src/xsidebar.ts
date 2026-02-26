import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XSidebarData extends XUIObjectData {
  _type: "sidebar";
  _side?: "left" | "right";
  _width?: string;
  _title?: string;
  _subtitle?: string;
  _logo?: XUIObjectData;
  _actions?: XUIObjectData[];
  _nav?: XUIObjectData;
  _scroll?: boolean;
  _dividers?: boolean;
  _footer?: XUIObjectData;
  _collapsed?: boolean;
  _on_toggle?: (xobj: XSidebar, collapsed: boolean) => void;
  class?: string;
}

type XSidebarSide = "left" | "right";

export class XSidebar extends XUIObject {
  static _xtype = "sidebar";

  private __side: XSidebarSide = "left";
  private __width = "280px";
  private __title?: string;
  private __subtitle?: string;
  private __logo?: XUIObjectData;
  private __actions?: XUIObjectData[];
  private __nav?: XUIObjectData;
  private __scroll = true;
  private __dividers = true;
  private __footer?: XUIObjectData;
  private __collapsed = false;
  private __body_children: XUIObjectData[] = [];

  private readonly __panel_id: string;
  private readonly __title_id: string;
  private readonly __subtitle_id: string;

  private static readonly managedStyles = new Set(["--xsidebar-width"]);

  constructor(data: XSidebarData) {
    const defaults: any = {
      _type: XSidebar._xtype,
      class: "xsidebar",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__panel_id = this._id + "_panel";
    this.__title_id = this._id + "_title";
    this.__subtitle_id = this._id + "_subtitle";

    this.__body_children = Array.isArray((data as any)._children)
      ? [...((data as any)._children as XUIObjectData[])]
      : [];
    if (Array.isArray((data as any)._children)) (data as any)._children = [];

    this.parse(data);
    this.applyProps();
    this.rebuild();
  }

  private normalizeSide(value?: XSidebarSide): XSidebarSide {
    return value === "right" ? "right" : "left";
  }

  private normalizeBoolean(value?: boolean, fallback = false): boolean {
    if (value === true || value === ("true" as any)) return true;
    if (value === false || value === ("false" as any)) return false;
    return fallback;
  }

  private applyProps() {
    this.__side = this.normalizeSide((this as any)._side);
    this.__width = (this as any)._width ? String((this as any)._width) : "280px";
    this.__title = (this as any)._title ? String((this as any)._title) : undefined;
    this.__subtitle = (this as any)._subtitle ? String((this as any)._subtitle) : undefined;
    this.__logo = (this as any)._logo as XUIObjectData | undefined;
    this.__actions = Array.isArray((this as any)._actions) ? (this as any)._actions : undefined;
    this.__nav = (this as any)._nav as XUIObjectData | undefined;
    this.__scroll = this.normalizeBoolean((this as any)._scroll, true);
    this.__dividers = this.normalizeBoolean((this as any)._dividers, true);
    this.__footer = (this as any)._footer as XUIObjectData | undefined;
    this.__collapsed = this.normalizeBoolean((this as any)._collapsed, false);
  }

  private hasHeader(): boolean {
    return Boolean(
      (this.__title && this.__title.trim().length) ||
        (this.__subtitle && this.__subtitle.trim().length) ||
        this.__logo ||
        (this.__actions && this.__actions.length)
    );
  }

  private buildHeader() {
    if (!this.hasHeader()) return [];

    const titleStackChildren: XUIObjectData[] = [];
    if (this.__title && this.__title.trim().length) {
      titleStackChildren.push({
        _type: "label",
        _id: this.__title_id,
        class: "xsidebar__title",
        _text: this.__title,
      });
    }
    if (this.__subtitle && this.__subtitle.trim().length) {
      titleStackChildren.push({
        _type: "label",
        _id: this.__subtitle_id,
        class: "xsidebar__subtitle",
        _text: this.__subtitle,
      });
    }

    const leftChildren: XUIObjectData[] = [];
    if (this.__logo) leftChildren.push(this.__logo);
    if (titleStackChildren.length) {
      leftChildren.push({
        _type: "stack",
        class: "xsidebar__titles",
        _direction: "vertical",
        _gap: 2,
        _children: titleStackChildren,
      });
    }

    const headerRow: XUIObjectData = {
      _type: "stack",
      class: "xsidebar__header-row",
      _direction: "horizontal",
      _gap: 8,
      _align: "center",
      _justify: "space-between",
      _children: [
        {
          _type: "stack",
          class: "xsidebar__head-left",
          _direction: "horizontal",
          _gap: 8,
          _align: "center",
          _children: leftChildren,
        },
      ],
    };

    if (this.__actions && this.__actions.length) {
      (headerRow._children as XUIObjectData[]).push({
        _type: "stack",
        class: "xsidebar__actions",
        _direction: "horizontal",
        _gap: 6,
        _align: "center",
        _children: this.__actions,
      });
    }

    return [
      {
        _type: "view",
        class: "xsidebar__header",
        _children: [headerRow],
      },
    ];
  }

  private buildBody(contentChildren: XUIObjectData[]) {
    const content = this.__nav ? [this.__nav] : contentChildren;
    const bodyChildren: XUIObjectData[] = this.__scroll
      ? [
          {
            _type: "scroll",
            class: "xsidebar__scroll",
            _children: content,
          },
        ]
      : content;

    return {
      _type: "view",
      class: "xsidebar__body",
      _children: bodyChildren,
    } as XUIObjectData;
  }

  private buildFooter() {
    if (!this.__footer) return [];
    return [
      {
        _type: "view",
        class: "xsidebar__footer",
        _children: [this.__footer],
      },
    ];
  }

  private buildSkeleton(contentChildren: XUIObjectData[]) {
    const children: XUIObjectData[] = [];

    const header = this.buildHeader();
    if (header.length) {
      children.push(...header);
      if (this.__dividers) children.push({ _type: "divider", _muted: true });
    }

    children.push(this.buildBody(contentChildren));

    const footer = this.buildFooter();
    if (footer.length) {
      if (this.__dividers) children.push({ _type: "divider", _muted: true });
      children.push(...footer);
    }

    this.append({
      _type: "view",
      _id: this.__panel_id,
      class: "xsidebar__panel",
      _children: children,
    });
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private extractBodyChildren(): XUIObjectData[] {
    return this.__nav ? [this.__nav] : this.__body_children;
  }

  private rebuild() {
    const bodyChildren = this.extractBodyChildren();
    const panel = XUI.getObject(this.__panel_id) as XUIObject | undefined;
    if (panel && typeof (this as any).removeChild === "function") {
      (this as any).removeChild(panel as any, true);
    }
    this.buildSkeleton(bodyChildren);
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
      if (XSidebar.managedStyles.has(prop)) continue;
      kept.push(`${prop}:${val}`);
    }

    return kept.join("; ");
  }

  private updateTitles() {
    const titleObj = XUI.getObject(this.__title_id) as any;
    if (titleObj) titleObj._text = this.__title || "";
    const subtitleObj = XUI.getObject(this.__subtitle_id) as any;
    if (subtitleObj) subtitleObj._text = this.__subtitle || "";
  }

  private buildClassName(): string {
    const existing = String((this as any).class || "");
    const filtered = this
      .splitClasses(existing)
      .filter(
        (c) =>
          c !== "xsidebar" &&
          c !== "xsidebar--left" &&
          c !== "xsidebar--right" &&
          c !== "xsidebar--collapsed" &&
          c !== "xsidebar--dividers"
      );

    const tokens = ["xsidebar", ...filtered];
    tokens.push(`xsidebar--${this.__side}`);
    if (this.__collapsed) tokens.push("xsidebar--collapsed");
    if (this.__dividers) tokens.push("xsidebar--dividers");

    return Array.from(new Set(tokens.filter(Boolean))).join(" ");
  }

  private applyLayout() {
    const nextClass = this.buildClassName();
    (this as any).class = nextClass;

    const baseStyle = this.stripManagedStyles(String((this as any).style || ""));
    const styleParts: string[] = [];
    if (baseStyle) styleParts.push(baseStyle);
    if (this.__width) styleParts.push(`--xsidebar-width:${this.__width}`);
    const nextStyle = styleParts.join("; ");
    (this as any).style = nextStyle;

    this.updateTitles();
  }

  isCollapsed(): boolean {
    return this.__collapsed;
  }

  setCollapsed(v: boolean, silent = false) {
    const next = this.normalizeBoolean(v, false);
    const changed = next !== this.__collapsed;
    this.__collapsed = next;
    this.applyLayout();
    if (!changed || silent) return;
    const fn = (this as any)._on_toggle;
    if (typeof fn === "function") fn(this, this.__collapsed);
  }

  toggleCollapsed() {
    this.setCollapsed(!this.__collapsed);
  }

  set _collapsed(value: boolean | undefined) {
    this.__collapsed = this.normalizeBoolean(value, false);
    this.applyLayout();
  }

  get _collapsed() {
    return this.__collapsed;
  }

  set _side(value: XSidebarSide | undefined) {
    this.__side = this.normalizeSide(value);
    this.applyLayout();
  }

  get _side() {
    return this.__side;
  }

  set _width(value: string | undefined) {
    this.__width = value ? String(value) : "280px";
    this.applyLayout();
  }

  get _width() {
    return this.__width;
  }

  set _title(value: string | undefined) {
    const hadHeader = this.hasHeader();
    this.__title = value ? String(value) : undefined;
    const hasHeader = this.hasHeader();
    if (hadHeader !== hasHeader) {
      this.rebuild();
    } else {
      this.updateTitles();
      this.applyLayout();
    }
  }

  get _title() {
    return this.__title;
  }

  set _subtitle(value: string | undefined) {
    const hadHeader = this.hasHeader();
    this.__subtitle = value ? String(value) : undefined;
    const hasHeader = this.hasHeader();
    if (hadHeader !== hasHeader) {
      this.rebuild();
    } else {
      this.updateTitles();
      this.applyLayout();
    }
  }

  get _subtitle() {
    return this.__subtitle;
  }

  set _logo(value: XUIObjectData | undefined) {
    this.__logo = value;
    this.rebuild();
  }

  get _logo() {
    return this.__logo;
  }

  set _actions(value: XUIObjectData[] | undefined) {
    this.__actions = Array.isArray(value) ? value : undefined;
    this.rebuild();
  }

  get _actions() {
    return this.__actions;
  }

  set _nav(value: XUIObjectData | undefined) {
    this.__nav = value;
    this.rebuild();
  }

  get _nav() {
    return this.__nav;
  }

  set _scroll(value: boolean | undefined) {
    this.__scroll = this.normalizeBoolean(value, true);
    this.rebuild();
  }

  get _scroll() {
    return this.__scroll;
  }

  set _dividers(value: boolean | undefined) {
    this.__dividers = this.normalizeBoolean(value, true);
    this.rebuild();
  }

  get _dividers() {
    return this.__dividers;
  }

  set _footer(value: XUIObjectData | undefined) {
    this.__footer = value;
    this.rebuild();
  }

  get _footer() {
    return this.__footer;
  }
}
