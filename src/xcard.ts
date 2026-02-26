import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XCardData extends XUIObjectData {
  _type: "card";
  _image?: string;
  _title?: string;
  _text?: string;
  _href?: string;
  _link_text?: string;
  _actions?: XUIObjectData[];
  _image_alt?: string;
  _hide_image?: boolean;
  class?: string;
}

export class XCard extends XUIObject {
  static _xtype = "card";

  private __image?: string;
  private __title?: string;
  private __text = "";
  private __href?: string;
  private __link_text?: string;
  private __actions?: XUIObjectData[];
  private __image_alt?: string;
  private __hide_image = false;

  private readonly __image_id: string;
  private readonly __title_id: string;
  private readonly __text_id: string;
  private readonly __link_id: string;
  private readonly __actions_id: string;

  private __image_placeholder = "https://via.placeholder.com/600x200?text=Card";
  private __title_placeholder = "Card title";
  private __text_placeholder = "Card text...";
  private __href_placeholder = "#";
  private __link_text_placeholder = "Learn more";
  private __image_alt_placeholder = "Card image";

  constructor(data: XCardData) {
    const defaults: any = {
      _type: XCard._xtype,
      class: "xcard",
      _html_tag: "div",
    };

    super(data, defaults, true);

    this.__image_id = this._id + "_image";
    this.__title_id = this._id + "_title";
    this.__text_id = this._id + "_text";
    this.__link_id = this._id + "_link";
    this.__actions_id = this._id + "_actions";

    this.parse(data);
    this.applyProps();
    this.buildSkeleton();
    this.applyLayout();
    this.applyText();
  }

  private normalizeBoolean(value?: boolean, fallback = false): boolean {
    if (value === true || value === ("true" as any)) return true;
    if (value === false || value === ("false" as any)) return false;
    return fallback;
  }

  private applyProps() {
    this.__image = (this as any)._image ? String((this as any)._image) : undefined;
    this.__title = (this as any)._title ? String((this as any)._title) : undefined;
    this.__text = (this as any)._text ? String((this as any)._text) : "";
    this.__href = (this as any)._href ? String((this as any)._href) : undefined;
    this.__link_text = (this as any)._link_text
      ? String((this as any)._link_text)
      : undefined;
    this.__actions = Array.isArray((this as any)._actions) ? (this as any)._actions : undefined;
    this.__image_alt = (this as any)._image_alt
      ? String((this as any)._image_alt)
      : undefined;
    this.__hide_image = this.normalizeBoolean((this as any)._hide_image, false);
  }

  private resolveImage(): string {
    const value = this.__image ? this.__image.trim() : "";
    return value ? value : this.__image_placeholder;
  }

  private resolveImageAlt(): string {
    const value = this.__image_alt ? this.__image_alt.trim() : "";
    return value ? value : this.__image_alt_placeholder;
  }

  private resolveTitle(): string {
    const value = this.__title ? this.__title.trim() : "";
    return value ? value : this.__title_placeholder;
  }

  private resolveText(): string {
    const value = this.__text.trim();
    return value ? value : this.__text_placeholder;
  }

  private resolveHref(): string {
    const value = this.__href ? this.__href.trim() : "";
    return value ? value : this.__href_placeholder;
  }

  private resolveLinkText(): string {
    const value = this.__link_text ? this.__link_text.trim() : "";
    return value ? value : this.__link_text_placeholder;
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private buildClassName(): string {
    const existing = String((this as any).class || "");
    const filtered = this
      .splitClasses(existing)
      .filter((c) => c !== "xcard" && c !== "xcard--no-image");

    const tokens = ["xcard", ...filtered];
    if (this.__hide_image) tokens.push("xcard--no-image");

    return Array.from(new Set(tokens.filter(Boolean))).join(" ");
  }

  private buildSkeleton() {
    const content: XUIObjectData = {
      _type: "view",
      class: "xcard__inner",
      _children: [
        {
          _type: "image",
          _id: this.__image_id,
          class: "xcard__image",
          _src: this.resolveImage(),
          _alt: this.resolveImageAlt(),
        },
        {
          _type: "view",
          class: "xcard__body",
          _children: [
            {
              _type: "label",
              _id: this.__title_id,
              class: "xcard__title",
              _text: "",
            },
            {
              _type: "label",
              _id: this.__text_id,
              class: "xcard__text",
              _text: "",
            },
            {
              _type: "link",
              _id: this.__link_id,
              class: "xcard__link dash-btn",
              _text: "",
              _href: "",
            },
            {
              _type: "view",
              _id: this.__actions_id,
              class: "xcard__actions",
              _children: this.__actions ? [...this.__actions] : [],
            },
          ],
        },
      ],
    };

    this.append(content);
  }

  private applyLayout() {
    const nextClass = this.buildClassName();
    (this as any).class = nextClass;
  }

  private applyText() {
    this.updateImage();
    this.updateTitle();
    this.updateText();
    this.updateLink();
    this.updateActions();
  }

  private updateImage() {
    const img = XUI.getObject(this.__image_id) as any;
    if (img) {
      img._src = this.resolveImage();
      img._alt = this.resolveImageAlt();
    }
  }

  private updateTitle() {
    const title = XUI.getObject(this.__title_id) as any;
    if (title) title._text = this.resolveTitle();
  }

  private updateText() {
    const text = XUI.getObject(this.__text_id) as any;
    if (text) text._text = this.resolveText();
  }

  private updateLink() {
    const link = XUI.getObject(this.__link_id) as any;
    if (link) {
      link._text = this.resolveLinkText();
      link._href = this.resolveHref();
    }
  }

  private updateActions() {
    const container = XUI.getObject(this.__actions_id) as XUIObject | undefined;
    if (!container) return;
    const children = Array.isArray((container as any)._children)
      ? [...((container as any)._children as XUIObject[])]
      : [];
    children.forEach((child) => {
      if (child) container.removeChild(child as any, true);
    });
    if (this.__actions && this.__actions.length) {
      this.__actions.forEach((action) => container.append(action));
    }
  }

  set _image(value: string | undefined) {
    this.__image = value ? String(value) : undefined;
    this.updateImage();
  }

  get _image() {
    return this.__image;
  }

  set _image_alt(value: string | undefined) {
    this.__image_alt = value ? String(value) : undefined;
    this.updateImage();
  }

  get _image_alt() {
    return this.__image_alt;
  }

  set _title(value: string | undefined) {
    this.__title = value ? String(value) : undefined;
    this.updateTitle();
  }

  get _title() {
    return this.__title;
  }

  set _text(value: string) {
    this.__text = value ? String(value) : "";
    this.updateText();
  }

  get _text(): string {
    return this.__text;
  }

  set _href(value: string | undefined) {
    this.__href = value ? String(value) : undefined;
    this.updateLink();
  }

  get _href() {
    return this.__href;
  }

  set _link_text(value: string | undefined) {
    this.__link_text = value ? String(value) : undefined;
    this.updateLink();
  }

  get _link_text() {
    return this.__link_text;
  }

  set _actions(value: XUIObjectData[] | undefined) {
    this.__actions = Array.isArray(value) ? value : undefined;
    this.updateActions();
  }

  get _actions() {
    return this.__actions;
  }

  set _hide_image(value: boolean | undefined) {
    this.__hide_image = this.normalizeBoolean(value, false);
    this.applyLayout();
  }

  get _hide_image() {
    return this.__hide_image;
  }
}

// Usage example:
// {
//   _type: "card",
//   _title: "Quarterly Report",
//   _text: "Revenue up 12% QoQ.",
//   _image: "https://via.placeholder.com/600x200?text=Report",
//   _href: "#",
//   _link_text: "View report",
//   _actions: [
//     { _type: "button", _text: "Open", class: "dash-btn" }
//   ]
// }
