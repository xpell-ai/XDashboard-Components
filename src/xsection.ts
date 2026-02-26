import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XSectionData extends XUIObjectData {
  _type: "section";
  _title?: string;
  _subtitle?: string;
  _actions?: XUIObjectData[];
}

type XSectionHeader = {
  title: string;
  subtitle: string;
  actions: XUIObjectData[];
};

export class XSection extends XUIObject {
  static _xtype = "section";

  private __title = "";
  private __subtitle = "";
  private __actions: XUIObjectData[] = [];
  private __body_children: XUIObjectData[] = [];
  private __initializing = true;

  private readonly __container_id: string;
  private readonly __header_id: string;
  private readonly __title_id: string;
  private readonly __subtitle_id: string;
  private readonly __actions_id: string;
  private readonly __body_id: string;

  constructor(data: XSectionData) {
    const defaults: any = {
      _type: XSection._xtype,
      class: "xsection",
      _html_tag: "section",
    };

    const userChildren = Array.isArray((data as any)._children)
      ? [...((data as any)._children as XUIObjectData[])]
      : [];
    if (Array.isArray((data as any)._children)) (data as any)._children = [];

    super(data, defaults, true);

    this.__container_id = this._id + "_container";
    this.__header_id = this._id + "_header";
    this.__title_id = this._id + "_title";
    this.__subtitle_id = this._id + "_subtitle";
    this.__actions_id = this._id + "_actions";
    this.__body_id = this._id + "_body";

    this.parse(data);
    this.applyProps();
    this.__body_children = userChildren;
    this.buildSkeleton();
    this.__initializing = false;
  }

  private normalizeActions(value?: XUIObjectData[]): XUIObjectData[] {
    return Array.isArray(value) ? value : [];
  }

  private applyProps() {
    this.__title = (this as any)._title ? String((this as any)._title) : "";
    this.__subtitle = (this as any)._subtitle ? String((this as any)._subtitle) : "";
    this.__actions = this.normalizeActions((this as any)._actions);
  }

  private hasTitle(): boolean {
    return this.__title.trim().length > 0;
  }

  private hasSubtitle(): boolean {
    return this.__subtitle.trim().length > 0;
  }

  private hasActions(): boolean {
    return this.__actions.length > 0;
  }

  private hasHeader(): boolean {
    return this.hasTitle() || this.hasSubtitle() || this.hasActions();
  }

  private currentHeaderState(): XSectionHeader {
    return {
      title: this.__title.trim(),
      subtitle: this.__subtitle.trim(),
      actions: this.__actions,
    };
  }

  private buildHeader(): XUIObjectData | null {
    if (!this.hasHeader()) return null;

    const headerChildren: XUIObjectData[] = [];
    if (this.hasTitle() || this.hasSubtitle()) {
      const headings: XUIObjectData[] = [];
      if (this.hasTitle()) {
        headings.push({
          _type: "label",
          _id: this.__title_id,
          _html_tag: "h2",
          class: "xsection__title",
          _text: this.__title.trim(),
        });
      }
      if (this.hasSubtitle()) {
        headings.push({
          _type: "label",
          _id: this.__subtitle_id,
          _html_tag: "p",
          class: "xsection__subtitle",
          _text: this.__subtitle.trim(),
        });
      }

      headerChildren.push({
        _type: "view",
        class: "xsection__headings",
        _children: headings,
      });
    }

    if (this.hasActions()) {
      headerChildren.push({
        _type: "view",
        _id: this.__actions_id,
        class: "xsection__actions",
        _children: this.__actions,
      });
    }

    return {
      _type: "view",
      _id: this.__header_id,
      class: "xsection__header",
      _children: headerChildren,
    } as XUIObjectData;
  }

  private buildSkeleton() {
    const children: XUIObjectData[] = [];
    const header = this.buildHeader();
    if (header) children.push(header);

    children.push({
      _type: "view",
      _id: this.__body_id,
      class: "xsection__body",
      _children: this.__body_children,
    });

    this.append({
      _type: "view",
      _id: this.__container_id,
      class: "xsection__container",
      _children: children,
    });
  }

  private rebuild() {
    const container = XUI.getObject(this.__container_id) as XUIObject | undefined;
    if (container && typeof (this as any).removeChild === "function") {
      (this as any).removeChild(container as any, true);
    }
    this.buildSkeleton();
  }

  set _title(v: string | undefined) {
    const prev = this.currentHeaderState();
    this.__title = v ? String(v) : "";
    if (this.__initializing) return;
    const nextHeader = this.hasHeader();
    const prevHeader = prev.title.length > 0 || prev.subtitle.length > 0 || prev.actions.length > 0;
    if (prevHeader !== nextHeader) {
      this.rebuild();
      return;
    }
    const label = XUI.getObject(this.__title_id) as any;
    if (label) label._text = this.__title.trim();
    else if (this.hasTitle()) this.rebuild();
  }

  get _title() {
    return this.__title;
  }

  set _subtitle(v: string | undefined) {
    const prev = this.currentHeaderState();
    this.__subtitle = v ? String(v) : "";
    if (this.__initializing) return;
    const nextHeader = this.hasHeader();
    const prevHeader = prev.title.length > 0 || prev.subtitle.length > 0 || prev.actions.length > 0;
    if (prevHeader !== nextHeader) {
      this.rebuild();
      return;
    }
    const label = XUI.getObject(this.__subtitle_id) as any;
    if (label) label._text = this.__subtitle.trim();
    else if (this.hasSubtitle()) this.rebuild();
  }

  get _subtitle() {
    return this.__subtitle;
  }

  set _actions(v: XUIObjectData[] | undefined) {
    if (this.__initializing) {
      this.__actions = this.normalizeActions(v);
      return;
    }
    const hadHeader = this.hasHeader();
    const nextActions = this.normalizeActions(v);
    this.__actions = nextActions;
    const hasHeader = this.hasHeader();
    if (hadHeader !== hasHeader) {
      this.rebuild();
      return;
    }

    const actionsContainer = XUI.getObject(this.__actions_id) as XUIObject | undefined;
    if (!actionsContainer) {
      if (this.hasActions()) this.rebuild();
      return;
    }

    const existing = Array.isArray((actionsContainer as any)._children)
      ? [...((actionsContainer as any)._children as XUIObject[])]
      : [];
    existing.forEach((child) => {
      if (child) actionsContainer.removeChild(child as any, true);
    });
    this.__actions.forEach((action) => actionsContainer.append(action));
  }

  get _actions() {
    return this.__actions;
  }
}
