import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData, XObjectData, XpellSkill } from "@xpell/ui";

export type XSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface XSelectData extends XUIObjectData {
  _type: "xselect";
  _value?: string;
  _placeholder?: string;
  _options?: XSelectOption[];
  _size?: "sm" | "md";
  _disabled?: boolean;
  _name?: string;
  _select_id?: string;
  class?: string;
  _on_change?: (xobj: XSelect, value: string, ev: Event) => void;
}

type XSelectSize = "sm" | "md";

export class XSelect extends XUIObject {
  static _xtype = "xselect";
  static _skill: XpellSkill = {
    _id: "xselect",
    _title: "XSelect",
    _version: "1.0.0",
    _active: true,
    _type: "view-skill",
    _requires: ["xuiobject", "xhtml"],

    _description:
      "Dashboard select/dropdown component with placeholder, options, selected value, size, disabled state, and change handling.",

    _fields: {
      _value: "Currently selected option value.",
      _placeholder: "Optional placeholder option text.",
      _options: "Select options: { value, label, disabled? }.",
      _size: "Select size: sm or md.",
      _disabled: "Disable select control when true.",
      _name: "Optional native select name attribute.",
      _select_id: "Optional DOM id for the internal select element.",
      class: "Optional CSS classes. xselect is applied automatically."
    },

    _core_rules: [
      "Use xselect for styled dashboard dropdowns.",
      "Use select only for the core/native XUI select object.",
      "Use _options for available choices.",
      "Use _value for the selected option value.",
      "Use _placeholder when no value is selected.",
      "Use field to wrap xselect with label/hint/error when used in forms.",
      "Do not generate _on_change as a JavaScript function.",
      "For persisted/generated views, handlers must be Nano-Commands/data-only."
    ],

    _canonical_examples: [
      {
        _type: "xselect",
        _placeholder: "Choose status",
        _value: "active",
        _options: [
          { value: "active", label: "Active" },
          { value: "paused", label: "Paused" },
          { value: "archived", label: "Archived", disabled: true }
        ]
      }
    ]
  };

  private __value = "";
  private __placeholder?: string;
  private __options: XSelectOption[] = [];
  private __size: XSelectSize = "md";
  private __disabled = false;
  private __name?: string;
  private __select_id?: string;

  private readonly __control_id: string;

  constructor(data: XSelectData) {
    const defaults: any = {
      _type: XSelect._xtype,
      class: "xselect",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__control_id = this._id + "_control";
    this.parse(data);
    this.buildSkeleton();
    this.applyProps();
  }

  private normalizeSize(value?: XSelectSize): XSelectSize {
    return value === "sm" ? "sm" : "md";
  }

  private normalizeBoolean(value?: boolean, fallback = false): boolean {
    if (value === true || value === ("true" as any)) return true;
    if (value === false || value === ("false" as any)) return false;
    return fallback;
  }

  private getControl() {
    return XUI.getObject(this.__control_id) as XUIObject | undefined;
  }

  private buildSkeleton() {
    const control: XObjectData = {
      _type: "xhtml",
      _id: this.__control_id,
      class: "xselect__control",
      _html_tag: "select",
      _on: {
        change: (xobj: any, ev: Event) => this.handleChange(xobj, ev),
      },
    };

    this.append(control);
  }

  private applyProps() {
    this.__value = typeof (this as any)._value === "string" ? (this as any)._value : "";
    this.__placeholder = (this as any)._placeholder ? String((this as any)._placeholder) : undefined;
    this.__options = Array.isArray((this as any)._options) ? (this as any)._options : [];
    this.__size = this.normalizeSize((this as any)._size);
    this.__disabled = this.normalizeBoolean((this as any)._disabled, false);
    this.__name = (this as any)._name ? String((this as any)._name) : undefined;
    this.__select_id = (this as any)._select_id ? String((this as any)._select_id) : undefined;

    this.addClass("xselect");
    this.replaceClass("xselect--sm xselect--md", `xselect--${this.__size}`);
    if (this.__disabled) this.addClass("xselect--disabled");
    else this.removeClass("xselect--disabled");

    const control = this.getControl();
    if (!control) return;

    if (this.__name) (control as any).name = this.__name;
    if (this.__select_id) (control as any).id = this.__select_id;
    (control as any).disabled = this.__disabled;

    this.setOptions(this.__options, true);
    this.setValue(this.__value, true);
  }

  private clearOptions(control: XUIObject) {
    const existing = Array.isArray((control as any)._children)
      ? [...((control as any)._children as XUIObject[])]
      : [];
    existing.forEach((child) => {
      if (child) control.removeChild(child as any, true);
    });
  }

  private buildOption(option: XSelectOption, selected: boolean) {
    const data: XObjectData = {
      _type: "xhtml",
      _html_tag: "option",
      _text: option.label,
      value: option.value,
    };
    if (option.disabled) (data as any).disabled = true;
    if (selected) (data as any).selected = true;
    return data;
  }

  setOptions(options: XSelectOption[], silent = false) {
    this.__options = Array.isArray(options) ? options : [];
    const control = this.getControl();
    if (!control) return;
    this.clearOptions(control);

    const hasValue = typeof this.__value === "string" && this.__value.length > 0;
    if (this.__placeholder) {
      const placeholderOption: XObjectData = {
        _type: "xhtml",
        _html_tag: "option",
        _text: this.__placeholder,
        value: "",
        disabled: true,
        hidden: true,
        selected: !hasValue,
      } as any;
      control.append(placeholderOption);
    }

    this.__options.forEach((opt) => {
      const selected = opt.value === this.__value;
      control.append(this.buildOption(opt, selected));
    });

    if (!silent) this.setValue(this.__value, true);
  }

  private handleChange(xobj: any, ev: Event) {
    const val = String((ev as any)?.target?.value ?? xobj?.value ?? xobj?._value ?? "");
    this.__value = val;
    const handler = (this as any)._on_change;
    if (handler) this.checkAndRunInternalFunction(handler, val, ev);
  }

  getValue(): string {
    return this.__value;
  }

  setValue(v: string, silent = false) {
    this.__value = String(v ?? "");
    const control = this.getControl();
    if (control) {
      (control as any).value = this.__value;
    }
    if (!silent) {
      const handler = (this as any)._on_change;
      if (handler) this.checkAndRunInternalFunction(handler, this.__value, undefined);
    }
  }

  focus() {
    const logger = (globalThis as any)?._xlog ?? (this as any)._xlog;
    if (logger?.log) logger.log("XSelect.focus requires engine input focus support.");
  }
}
