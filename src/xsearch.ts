import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData, XObjectData } from "@xpell/ui";

export interface XSearchBoxData extends XUIObjectData {
  _type: "search";
  _value?: string;
  _placeholder?: string;
  _size?: "sm" | "md";
  _disabled?: boolean;
  _clearable?: boolean;
  _icon?: boolean;
  _autofocus?: boolean;
  _input_id?: string;
  class?: string;
  _on_input?: (xobj: XSearchBox, value: string, ev: Event) => void;
  _on_change?: (xobj: XSearchBox, value: string, ev: Event) => void;
  _on_clear?: (xobj: XSearchBox) => void;
}

type XSearchSize = "sm" | "md";

export class XSearchBox extends XUIObject {
  static _xtype = "search";

  private __value = "";
  private __placeholder = "Search...";
  private __size: XSearchSize = "md";
  private __disabled = false;
  private __clearable = true;
  private __icon = true;
  private __autofocus = false;
  private __input_id?: string;

  private readonly __icon_id: string;
  private readonly __input_id_internal: string;
  private readonly __clear_id: string;

  constructor(data: XSearchBoxData) {
    const defaults: any = {
      _type: XSearchBox._xtype,
      class: "xsearch",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__icon_id = this._id + "_icon";
    this.__input_id_internal = this._id + "_input";
    this.__clear_id = this._id + "_clear";
    this.parse(data);
    this.buildSkeleton();
    this.applyProps();
  }

  private normalizeSize(value?: XSearchSize): XSearchSize {
    return value === "sm" ? "sm" : "md";
  }

  private normalizeBoolean(value?: boolean, fallback = false): boolean {
    if (value === true || value === ("true" as any)) return true;
    if (value === false || value === ("false" as any)) return false;
    return fallback;
  }

  private getIcon() {
    return XUI.getObject(this.__icon_id) as XUIObject | undefined;
  }

  private getInput() {
    return XUI.getObject(this.__input_id_internal) as XUIObject | undefined;
  }

  private getClear() {
    return XUI.getObject(this.__clear_id) as XUIObject | undefined;
  }

  private buildSkeleton() {
    const children: XObjectData[] = [
      {
        _type: "label",
        _id: this.__icon_id,
        class: "xsearch__icon",
        _text: "🔍",
      },
      {
        _type: "input",
        _id: this.__input_id_internal,
        class: "xsearch__input",
        _input_type: "search",
        _on: {
          input: (xobj: any, ev: Event) => this.handleInput(xobj, ev),
          change: (xobj: any, ev: Event) => this.handleChange(xobj, ev),
        },
      },
      {
        _type: "button",
        _id: this.__clear_id,
        class: "xsearch__clear",
        _text: "×",
        "aria-label": "Clear",
        _on_click: () => this.clear(),
      },
    ];

    children.forEach((child) => this.append(child));
  }

  private applyProps() {
    this.__value = typeof (this as any)._value === "string" ? (this as any)._value : "";
    this.__placeholder = (this as any)._placeholder ? String((this as any)._placeholder) : "Search...";
    this.__size = this.normalizeSize((this as any)._size);
    this.__disabled = this.normalizeBoolean((this as any)._disabled, false);
    this.__clearable = this.normalizeBoolean((this as any)._clearable, true);
    this.__icon = this.normalizeBoolean((this as any)._icon, true);
    this.__autofocus = this.normalizeBoolean((this as any)._autofocus, false);
    this.__input_id = (this as any)._input_id ? String((this as any)._input_id) : undefined;

    this.addClass("xsearch");
    this.replaceClass("xsearch--sm xsearch--md", `xsearch--${this.__size}`);
    if (this.__disabled) this.addClass("xsearch--disabled");
    else this.removeClass("xsearch--disabled");

    const input = this.getInput();
    if (input) {
      (input as any)._placeholder = this.__placeholder;
      (input as any)._value = this.__value;
      (input as any)._disabled = this.__disabled;
      (input as any)._autofocus = this.__autofocus;
      if (this.__input_id) (input as any).id = this.__input_id;
    }

    const icon = this.getIcon();
    if (icon) {
      (icon as any)._visible = this.__icon;
    }

    this.toggleClear();
  }

  private toggleClear() {
    const clear = this.getClear();
    if (!clear) return;
    const show = this.__clearable && this.__value.length > 0 && !this.__disabled;
    (clear as any)._visible = show;
  }

  private handleInput(xobj: any, ev: Event) {
    const val = String((ev as any)?.target?.value ?? xobj?._value ?? xobj?._text ?? "");
    this.__value = val;
    this.toggleClear();
    const handler = (this as any)._on_input;
    if (handler) this.checkAndRunInternalFunction(handler, val, ev);
  }

  private handleChange(xobj: any, ev: Event) {
    const val = String((ev as any)?.target?.value ?? xobj?._value ?? xobj?._text ?? "");
    this.__value = val;
    const handler = (this as any)._on_change;
    if (handler) this.checkAndRunInternalFunction(handler, val, ev);
  }

  getValue(): string {
    return this.__value;
  }

  setValue(v: string, silent = false) {
    this.__value = String(v ?? "");
    const input = this.getInput();
    if (input) {
      (input as any)._value = this.__value;
    }
    this.toggleClear();
    if (!silent) {
      const handler = (this as any)._on_input;
      if (handler) this.checkAndRunInternalFunction(handler, this.__value, undefined);
    }
  }

  clear() {
    this.setValue("", true);
    const handler = (this as any)._on_clear;
    if (handler) this.checkAndRunInternalFunction(handler);
    const inputHandler = (this as any)._on_input;
    if (inputHandler) this.checkAndRunInternalFunction(inputHandler, this.__value, undefined);
    this.focus();
  }

  focus() {
    const input = this.getInput();
    if (input && typeof (input as any).focus === "function") {
      (input as any).focus();
    }
  }
}
