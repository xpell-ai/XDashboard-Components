import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XKpiCardData extends XUIObjectData {
  _type: "kpi-card";
  _label?: string;
  _value?: string;
  _delta?: string;
  _delta_state?: "up" | "down" | "flat";
  _icon?: string;
  class?: string;
}

type XKpiDeltaState = "up" | "down" | "flat";

export class XKpiCard extends XUIObject {
  static _xtype = "kpi-card";

  private __label = "";
  private __value = "";
  private __delta = "";
  private __delta_state: XKpiDeltaState = "flat";
  private __icon = "";

  private __label_placeholder = "KPI";
  private __value_placeholder = "—";
  private __delta_placeholder = "";
  private __icon_placeholder = "";

  private readonly __icon_id: string;
  private readonly __label_id: string;
  private readonly __value_id: string;
  private readonly __delta_id: string;

  constructor(data: XKpiCardData) {
    const defaults: any = {
      _type: XKpiCard._xtype,
      class: "xkpi-card",
      _html_tag: "div",
    };

    super(data, defaults, true);

    this.__icon_id = this._id + "_icon";
    this.__label_id = this._id + "_label";
    this.__value_id = this._id + "_value";
    this.__delta_id = this._id + "_delta";

    this.parse(data);
    this.applyProps();
    this.buildSkeleton();
    this.applyLayout();
    this.applyText();
  }

  private normalizeState(value?: XKpiDeltaState): XKpiDeltaState {
    if (value === "up" || value === "down" || value === "flat") return value;
    return "flat";
  }

  private applyProps() {
    this.__label = (this as any)._label ? String((this as any)._label) : "";
    this.__value = (this as any)._value ? String((this as any)._value) : "";
    this.__delta = (this as any)._delta ? String((this as any)._delta) : "";
    this.__delta_state = this.normalizeState((this as any)._delta_state);
    this.__icon = (this as any)._icon ? String((this as any)._icon) : "";
  }

  private resolveLabel(): string {
    const value = this.__label.trim();
    return value ? value : this.__label_placeholder;
  }

  private resolveValue(): string {
    const value = this.__value.trim();
    return value ? value : this.__value_placeholder;
  }

  private resolveDelta(): string {
    const value = this.__delta.trim();
    return value ? value : this.__delta_placeholder;
  }

  private resolveIcon(): string {
    const value = this.__icon.trim();
    return value ? value : this.__icon_placeholder;
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
      .filter(
        (c) =>
          c !== "xkpi-card" &&
          c !== "xkpi-card--up" &&
          c !== "xkpi-card--down" &&
          c !== "xkpi-card--flat"
      );

    const tokens = ["xkpi-card", `xkpi-card--${this.__delta_state}`, ...filtered];
    return Array.from(new Set(tokens.filter(Boolean))).join(" ");
  }

  private buildSkeleton() {
    const inner: XUIObjectData = {
      _type: "view",
      class: "kpi-body",
      _children: [
        {
          _type: "view",
          class: "kpi-top",
          _children: [
            { _type: "label", _id: this.__icon_id, class: "kpi-icon", _text: "" },
            { _type: "label", _id: this.__label_id, class: "kpi-label", _text: "" },
          ],
        },
        { _type: "label", _id: this.__value_id, class: "kpi-value", _text: "" },
        {
          _type: "label",
          _id: this.__delta_id,
          class: "kpi-delta kpi-delta--flat",
          _text: "",
        },
      ],
    };

    this.append(inner);
  }

  private applyLayout() {
    const nextClass = this.buildClassName();
    (this as any).class = nextClass;

    const delta = XUI.getObject(this.__delta_id) as any;
    if (delta && typeof delta.replaceClass === "function") {
      delta.replaceClass(
        "kpi-delta--up kpi-delta--down kpi-delta--flat",
        `kpi-delta--${this.__delta_state}`
      );
    } else if (delta) {
      delta.class = `kpi-delta kpi-delta--${this.__delta_state}`;
    }
  }

  private applyText() {
    const icon = XUI.getObject(this.__icon_id) as any;
    if (icon) icon._text = this.resolveIcon();

    const label = XUI.getObject(this.__label_id) as any;
    if (label) label._text = this.resolveLabel();

    const value = XUI.getObject(this.__value_id) as any;
    if (value) value._text = this.resolveValue();

    const delta = XUI.getObject(this.__delta_id) as any;
    if (delta) delta._text = this.resolveDelta();
  }

  set _label(value: string | undefined) {
    this.__label = value ? String(value) : "";
    this.applyText();
  }

  get _label() {
    return this.__label;
  }

  set _value(value: string | undefined) {
    this.__value = value ? String(value) : "";
    this.applyText();
  }

  get _value() {
    return this.__value;
  }

  set _delta(value: string | undefined) {
    this.__delta = value ? String(value) : "";
    this.applyText();
  }

  get _delta() {
    return this.__delta;
  }

  set _delta_state(value: XKpiDeltaState | undefined) {
    this.__delta_state = this.normalizeState(value);
    this.applyLayout();
  }

  get _delta_state() {
    return this.__delta_state;
  }

  set _icon(value: string | undefined) {
    this.__icon = value ? String(value) : "";
    this.applyText();
  }

  get _icon() {
    return this.__icon;
  }
}

// Usage example:
// {
//   _type: "kpi-card",
//   _label: "Users",
//   _value: "1,204",
//   _delta: "+8%",
//   _delta_state: "up",
//   _icon: "👤"
// }
// {
//   _type: "kpi-card",
//   _label: "Churn",
//   _value: "2.4%",
//   _delta: "-0.6%",
//   _delta_state: "down",
//   _icon: "⚠️"
// }
