import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XModalData extends XUIObjectData {
  _type: "modal";
  _open?: boolean;
  _title?: string;
  _subtitle?: string;
  _size?: "sm" | "md" | "lg";
  _width?: string;
  _closable?: boolean;
  _close_on_backdrop?: boolean;
  _scroll?: boolean;
  _actions?: XUIObjectData[];
  _content?: XUIObjectData[];
  _on_open?: (xobj: XModal) => void;
  _on_close?: (xobj: XModal) => void;
  class?: string;
}

type XModalSize = "sm" | "md" | "lg";

export class XModal extends XUIObject {
  static _xtype = "modal";

  private __open = false;
  private __title?: string;
  private __subtitle?: string;
  private __size: XModalSize = "md";
  private __width?: string;
  private __closable = true;
  private __close_on_backdrop = true;
  private __scroll = true;
  private __actions?: XUIObjectData[];
  private __content?: XUIObjectData[];
  private __body_children: XUIObjectData[] = [];
  private __ready = false;

  private readonly __backdrop_id: string;
  private readonly __panel_id: string;
  private readonly __body_id: string;

  private static readonly managedStyles = new Set(["--xmodal-width"]);

  constructor(data: XModalData) {
    const defaults: any = {
      _type: XModal._xtype,
      class: "xmodal",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__backdrop_id = this._id + "_backdrop";
    this.__panel_id = this._id + "_panel";
    this.__body_id = this._id + "_body";

    this.parse(data);
    this.applyProps();
    if (!this.__content) {
      this.__body_children = this.captureBodyChildren((data as any)._children);
    }
    (this as any)._children = [];
    this.rebuild();
    this.__ready = true;
  }

  private normalizeBoolean(value?: boolean, fallback = false): boolean {
    if (value === true || value === ("true" as any)) return true;
    if (value === false || value === ("false" as any)) return false;
    return fallback;
  }

  private normalizeSize(value?: XModalSize): XModalSize {
    if (value === "sm" || value === "lg") return value;
    return "md";
  }

  private applyProps() {
    this.__open = this.normalizeBoolean((this as any)._open, false);
    this.__title = (this as any)._title ? String((this as any)._title) : undefined;
    this.__subtitle = (this as any)._subtitle ? String((this as any)._subtitle) : undefined;
    this.__size = this.normalizeSize((this as any)._size);
    this.__width = (this as any)._width ? String((this as any)._width) : undefined;
    this.__closable = this.normalizeBoolean((this as any)._closable, true);
    this.__close_on_backdrop = this.normalizeBoolean((this as any)._close_on_backdrop, true);
    this.__scroll = this.normalizeBoolean((this as any)._scroll, true);
    this.__actions = Array.isArray((this as any)._actions) ? (this as any)._actions : undefined;
    this.__content = Array.isArray((this as any)._content) ? (this as any)._content : undefined;
  }

  private buildHeader() {
    const hasHeader = this.__title || this.__subtitle || this.__closable;
    if (!hasHeader) return [];

    const titleChildren: XUIObjectData[] = [];
    if (this.__title) {
      titleChildren.push({
        _type: "label",
        class: "xmodal__title",
        _text: this.__title,
      });
    }
    if (this.__subtitle) {
      titleChildren.push({
        _type: "label",
        class: "xmodal__subtitle",
        _text: this.__subtitle,
      });
    }

    const headerChildren: XUIObjectData[] = [];
    if (titleChildren.length) {
      headerChildren.push({
        _type: "stack",
        class: "xmodal__titles",
        _direction: "vertical",
        _gap: 2,
        _children: titleChildren,
      });
    }

    if (this.__closable) {
      headerChildren.push({
        _type: "button",
        class: "xmodal__close",
        _text: "×",
        _on_click: () => this.close(),
      });
    }

    return [
      {
        _type: "toolbar",
        class: "xmodal__header",
        _gap: 8,
        _justify: "space-between",
        _children: headerChildren,
      },
      { _type: "divider", _muted: true },
    ];
  }

  private buildBody(contentChildren: XUIObjectData[]) {
    const content = this.__content ? this.__content : contentChildren;
    const bodyChildren: XUIObjectData[] = this.__scroll
      ? [
          {
            _type: "scroll",
            class: "xmodal__scroll",
            _children: content,
          },
        ]
      : content;

    return {
      _type: "view",
      _id: this.__body_id,
      class: "xmodal__body",
      _children: bodyChildren,
    } as XUIObjectData;
  }

  private buildFooter() {
    if (!this.__actions || !this.__actions.length) return [];
    return [
      { _type: "divider", _muted: true },
      {
        _type: "toolbar",
        class: "xmodal__footer",
        _justify: "end",
        _children: [
          {
            _type: "stack",
            _direction: "horizontal",
            _gap: 8,
            _align: "center",
            _children: this.__actions,
          },
        ],
      },
    ];
  }

  private buildSkeleton(contentChildren: XUIObjectData[]) {
    const backdrop: XUIObjectData = {
      _type: "view",
      _id: this.__backdrop_id,
      class: "xmodal__backdrop",
    };
    if (this.__close_on_backdrop) {
      (backdrop as any)._on_click = () => this.close();
    }

    const panelChildren: XUIObjectData[] = [];
    panelChildren.push(...this.buildHeader());
    panelChildren.push(this.buildBody(contentChildren));
    panelChildren.push(...this.buildFooter());

    const panel: XUIObjectData = {
      _type: "view",
      _id: this.__panel_id,
      class: "xmodal__panel",
      _children: [
        {
          _type: "view",
          class: "xmodal__card",
          _children: panelChildren,
        },
      ],
    };

    this.append(backdrop);
    this.append(panel);
  }

  private captureBodyChildren(children?: XUIObjectData[]): XUIObjectData[] {
    const list = Array.isArray(children) ? children : [];
    return list.filter(
      (child) =>
        child &&
        (child as any)._id !== this.__panel_id &&
        (child as any)._id !== this.__backdrop_id
    );
  }

  private rebuild() {
    const panel = XUI.getObject(this.__panel_id) as XUIObject | undefined;
    if (panel && typeof (this as any).removeChild === "function") {
      (this as any).removeChild(panel, true);
    }
    const backdrop = XUI.getObject(this.__backdrop_id) as XUIObject | undefined;
    if (backdrop && typeof (this as any).removeChild === "function") {
      (this as any).removeChild(backdrop, true);
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
      if (XModal.managedStyles.has(prop)) continue;
      kept.push(`${prop}:${val}`);
    }

    return kept.join("; ");
  }

  private applyLayout() {
    this.addClass("xmodal");
    this.replaceClass("xmodal--sm xmodal--md xmodal--lg", `xmodal--${this.__size}`);
    this.replaceClass("xmodal--open", this.__open ? "xmodal--open" : "");

    const baseStyle = this.stripManagedStyles(String((this as any).style || ""));
    const styleParts: string[] = [];
    if (baseStyle) styleParts.push(baseStyle);
    if (this.__width) styleParts.push(`--xmodal-width:${this.__width}`);
    const nextStyle = styleParts.join("; ");
    (this as any).style = nextStyle;
    if (this.__width) this.setStyleAttribute("--xmodal-width", this.__width);
  }

  async onCreate() {
    const children = Array.isArray((this as any)._children)
      ? [...((this as any)._children as XUIObject[])]
      : [];
    children.forEach((child: any) => {
      const id = child?._id;
      if (id === this.__panel_id || id === this.__backdrop_id) return;
      if (typeof (this as any).removeChild === "function") {
        (this as any).removeChild(child, true);
      }
    });
    if (!this.__content && this.__body_children.length && !this.__ready) {
      this.rebuild();
      this.__ready = true;
    }
    await super.onCreate();
  }

  isOpen(): boolean {
    return this.__open;
  }

  setOpen(v: boolean, silent = false) {
    const next = this.normalizeBoolean(v, false);
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

  open() {
    this.setOpen(true);
  }

  close() {
    this.setOpen(false);
  }
}

// Example:
// {
//   _type: "modal",
//   _open: false,
//   _title: "Confirm",
//   _subtitle: "Are you sure?",
//   _children: [{ _type: "label", _text: "Modal body content" }]
// }
