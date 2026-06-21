import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData, XpellSkill } from "@xpell/ui";

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
  static _skill: XpellSkill = {
    _id: "card",
    _title: "XCard",
    _version: "1.0.0",
    _active: true,
    _type: "view-skill",
    _requires: ["xuiobject"],

    _description:
      "Dashboard card component with optional image, title, text, link, and action buttons.",

    _fields: {
      _image: "Optional card image URL. Missing/empty _image renders no image.",
      _image_alt: "Alt text for the card image.",
      _hide_image: "Hide the image area when true. Missing _image also renders no image.",
      _title: "Card title text.",
      _text: "Card body text.",
      _href: "Optional link URL. No link is rendered when _href is missing or empty.",
      _link_text: "Visible link text. Defaults to Learn more only when _href exists.",
      _actions: "Optional action button/link child objects.",
      class: "Optional CSS classes. xcard is applied automatically."
    },

    _core_rules: [
      "Use card for compact dashboard/content summaries.",
      "Use _title and _text for primary card content.",
      "Use _image only when visual context is useful; cards without _image render no image.",
      "Use _href only when the card should show a link; cards without _href render no link.",
      "Use _actions for card buttons.",
      "Do not use card as a generic layout container; use view/grid/stack instead.",
      "Use _hide_image:true to explicitly hide the image even when an image value might be present."
    ],

    _canonical_examples: [
      {
        _type: "card",
        _title: "Usage",
        _text: "Credits: 0 · Requests: 0 · Plan: Free",
        _hide_image: true
      },
      {
        _type: "card",
        _title: "Customers",
        _text: "Manage customer records and activity.",
        _hide_image: true,
        _actions: [
          {
            _type: "button",
            _text: "View Customers",
            _variant: "primary",
            _flow: {
              _id: "flow-view-customers",
              _payload: {
                _action: "view-customers",
                _entity: "customers"
              }
            }
          }
        ]
      }
    ]
  };
  static getArtifactStrategy() {
    return "merge" as const;
  }

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

  private __suppress_root_text = false;

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

  private hasImage(): boolean {
    return !!this.__image?.trim() && !this.__hide_image;
  }

  private hasLink(): boolean {
    return !!this.__href?.trim();
  }

  private resolveImage(): string {
    return this.__image?.trim() || "";
  }

  private resolveImageAlt(): string {
    return this.__image_alt?.trim() || "";
  }

  private resolveTitle(): string {
    return this.__title?.trim() || "";
  }

  private resolveText(): string {
    return this.__text.trim() || "";
  }

  private resolveHref(): string {
    return this.__href?.trim() || "";
  }

  private resolveLinkText(): string {
    return this.__link_text?.trim() || "Learn more";
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
    if (!this.hasImage()) tokens.push("xcard--no-image");

    return Array.from(new Set(tokens.filter(Boolean))).join(" ");
  }

  private updateChildAttributes(child: any, attrs: Record<string, string>) {
    if (!child) return;
    Object.assign(child, attrs);
    if (typeof HTMLElement !== "undefined") {
      child.update?.(attrs as any);
    }
  }

  private updateChildStyle(child: any, style: string, visible: boolean) {
    if (!child) return;
    child.style = style;
    child._visible = visible;
    if (typeof HTMLElement !== "undefined") {
      child.update?.({ style } as any);
    }
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
          src: this.resolveImage(),
          alt: this.resolveImageAlt(),
          style: this.hasImage() ? "" : "display:none",
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
              href: "",
              style: "display:none",
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
    if (typeof HTMLElement !== "undefined") {
      this.update({ class: nextClass } as any);
    }
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
    if (!img) return;

    if (!this.hasImage()) {
      this.updateChildAttributes(img, { src: "", alt: "" });
      this.updateChildStyle(img, "display:none", false);
      return;
    }

    const src = this.resolveImage();
    const alt = this.resolveImageAlt();
    this.updateChildAttributes(img, { src, alt });
    this.updateChildStyle(img, "", true);
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
    if (!link) return;

    if (!this.hasLink()) {
      link._text = "";
      this.updateChildAttributes(link, { href: "" });
      this.updateChildStyle(link, "display:none", false);
      return;
    }

    const href = this.resolveHref();
    link._text = this.resolveLinkText();
    this.updateChildAttributes(link, { href });
    this.updateChildStyle(link, "", true);
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
    this.applyLayout();
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
    if (this.__suppress_root_text) return "";
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
    this.updateImage();
  }

  get _hide_image() {
    return this.__hide_image;
  }

  // XUIObject projects this._text onto the root in getDOMObject().
  // XCard renders text through its internal label, so suppress only that root read.
  getDOMObject(): HTMLElement {
    const previous = this.__suppress_root_text;
    this.__suppress_root_text = true;
    try {
      return super.getDOMObject();
    } finally {
      this.__suppress_root_text = previous;
    }
  }
}

// Usage example:
// {
//   _type: "card",
//   _title: "Quarterly Report",
//   _text: "Revenue up 12% QoQ.",
//   _image: "/reports/q4.png",
//   _href: "/reports/q4",
//   _link_text: "View report",
//   _actions: [
//     { _type: "button", _text: "Open", class: "dash-btn" }
//   ]
// }
