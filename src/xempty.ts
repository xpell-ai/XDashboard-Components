import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData, XpellSkill } from "@xpell/ui";

export interface XEmptyStateData extends XUIObjectData {
  _type: "empty";
  _title?: string;
  _description?: string;
  _icon?: XUIObjectData;
  _action?: XUIObjectData;
  _size?: "sm" | "md" | "lg";
  _align?: "start" | "center";
  class?: string;
}

type XEmptySize = "sm" | "md" | "lg";
type XEmptyAlign = "start" | "center";

export class XEmptyState extends XUIObject {
  static _xtype = "empty";
  static _skill: XpellSkill = {
    _id: "empty",
    _title: "XEmptyState",
    _version: "1.0.0",
    _active: true,
    _type: "view-skill",
    _requires: ["xuiobject", "stack", "label"],

    _description:
      "Dashboard empty-state component for showing no-data, no-results, onboarding, or fallback messages with optional icon and action.",

    _fields: {
      _title: "Primary empty-state title.",
      _description: "Optional descriptive text.",
      _icon: "Optional icon/visual child object.",
      _action: "Optional action child object, usually a button or link.",
      _size: "Empty-state size: sm, md, or lg.",
      _align: "Content alignment: start or center.",
      class: "Optional CSS classes. xempty is applied automatically."
    },

    _core_rules: [
      "Use empty when there is no data, no search result, or no selected item.",
      "Use _title for the main message.",
      "Use _description for helpful context.",
      "Use _action for a recovery action like create, retry, or clear filters.",
      "Do not use empty as a generic layout container."
    ],

    _canonical_examples: [
      {
        _type: "empty",
        _title: "No results found",
        _description: "Try changing your filters or search query.",
        _size: "md",
        _align: "center",
        _action: {
          _type: "button",
          _text: "Clear filters"
        }
      }
    ]
  };
  
  private __size: XEmptySize = "md";
  private __align: XEmptyAlign = "center";
  private __title = "";
  private __description = "";
  private __icon?: XUIObjectData;
  private __action?: XUIObjectData;

  private readonly __stack_id: string;
  private readonly __title_id: string;
  private readonly __desc_id: string;

  constructor(data: XEmptyStateData) {
    const defaults: any = {
      _type: XEmptyState._xtype,
      class: "xempty",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__stack_id = this._id + "_stack";
    this.__title_id = this._id + "_title";
    this.__desc_id = this._id + "_desc";

    this.parse(data);
    this.applyProps();
    this.buildSkeleton();
    this.applyLayout();
  }

  private normalizeSize(value?: XEmptySize): XEmptySize {
    if (value === "sm" || value === "lg") return value;
    return "md";
  }

  private normalizeAlign(value?: XEmptyAlign): XEmptyAlign {
    return value === "start" ? "start" : "center";
  }

  private applyProps() {
    this.__size = this.normalizeSize((this as any)._size);
    this.__align = this.normalizeAlign((this as any)._align);
    this.__title = (this as any)._title ? String((this as any)._title) : "";
    this.__description = (this as any)._description
      ? String((this as any)._description)
      : "";
    this.__icon = (this as any)._icon as XUIObjectData | undefined;
    this.__action = (this as any)._action as XUIObjectData | undefined;
  }

  private hasTitle(): boolean {
    return this.__title.trim().length > 0;
  }

  private hasDescription(): boolean {
    return this.__description.trim().length > 0;
  }

  private buildSkeleton() {
    const stackChildren: XUIObjectData[] = [];

    if (this.__icon) stackChildren.push(this.__icon);

    if (this.hasTitle()) {
      stackChildren.push({
        _type: "label",
        _id: this.__title_id,
        class: "xempty__title",
        _text: this.__title.trim(),
      });
    }

    if (this.hasDescription()) {
      stackChildren.push({
        _type: "label",
        _id: this.__desc_id,
        class: "xempty__desc",
        _text: this.__description.trim(),
      });
    }

    if (this.__action) stackChildren.push(this.__action);

    this.append({
      _type: "stack",
      _id: this.__stack_id,
      class: "xempty__stack",
      _direction: "vertical",
      _children: stackChildren,
    });
  }

  private rebuild() {
    const stack = XUI.getObject(this.__stack_id) as XUIObject | undefined;
    if (stack && typeof (this as any).removeChild === "function") {
      (this as any).removeChild(stack as any, true);
    }
    this.buildSkeleton();
    this.applyLayout();
  }

  private updateTitle() {
    const title = XUI.getObject(this.__title_id) as any;
    if (this.hasTitle()) {
      if (title) {
        title._text = this.__title.trim();
      } else {
        this.rebuild();
      }
    } else if (title) {
      this.rebuild();
    }
  }

  private updateDescription() {
    const desc = XUI.getObject(this.__desc_id) as any;
    if (this.hasDescription()) {
      if (desc) {
        desc._text = this.__description.trim();
      } else {
        this.rebuild();
      }
    } else if (desc) {
      this.rebuild();
    }
  }

  private applyLayout() {
    this.addClass("xempty");

    const allMods = ["xempty--sm", "xempty--md", "xempty--lg", "xempty--start", "xempty--center"];
    const nextMods: string[] = [];

    nextMods.push(`xempty--${this.__size}`);
    nextMods.push(`xempty--${this.__align}`);

    this.replaceClass(allMods.join(" "), nextMods.join(" "));
  }

  set _title(value: string | undefined) {
    this.__title = value ? String(value) : "";
    this.updateTitle();
  }

  get _title() {
    return this.__title;
  }

  set _description(value: string | undefined) {
    this.__description = value ? String(value) : "";
    this.updateDescription();
  }

  get _description() {
    return this.__description;
  }


  set _align(value: XEmptyAlign | undefined) {
    this.__align = this.normalizeAlign(value);
    this.applyLayout();
  }

  get _align() {
    return this.__align;
  }

  set _icon(value: XUIObjectData | undefined) {
    this.__icon = value;
    this.rebuild();
  }

  get _icon() {
    return this.__icon;
  }

  set _action(value: XUIObjectData | undefined) {
    this.__action = value;
    this.rebuild();
  }

  get _action() {
    return this.__action;
  }
}
