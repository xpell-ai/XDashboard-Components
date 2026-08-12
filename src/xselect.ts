import { _xd, XUI, XUIObject } from "@xpell/ui";
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
  _data_source?: string;
  _selected_data_source?: string;
  _data_output?: string;
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
      "Dashboard select/dropdown component with placeholder, options, selected value, size, disabled state, and Nano-Command change handling.",

    _fields: {
      _value: "Currently selected option value.",
      _placeholder: "Optional placeholder option text.",
      _options: "Select options: { value, label, disabled? }.",
      _data_source: "Optional XData key used as the select options array.",
      _selected_data_source:
        "Optional XData key used as the selected option value.",
      _data_output:
        "Optional XData key to write the selected option value on change.",
      _size: "Select size: sm or md.",
      _disabled: "Disable select control when true.",
      _name: "Optional native select name attribute.",
      _select_id: "Optional DOM id for the internal select element.",
      _on_change:
        "Nano-Command/data-only handler executed when selected value changes. Receives selected value as $data.",
      class: "Optional CSS classes. xselect is applied automatically."
    },

    _core_rules: [
      "Use xselect for styled dashboard dropdowns.",
      "Use select only for the core/native XUI select object.",
      "Use _options for available choices.",
      "Use _data_source when options should come from XData.",
      "Use _value for the selected option value.",
      "Use _selected_data_source when the selected value should come from XData.",
      "Use _data_output to write the selected value to XData on change.",
      "Use _placeholder when no value is selected.",
      "Use _on_change for persisted/generated change handlers.",
      "The _on_change handler receives the selected value as $data.",
      "Do not use _on.change or _on._change unless maintaining backward compatibility.",
      "Do not generate _on_change as a JavaScript function.",
      "For persisted/generated views, handlers must be Nano-Commands/data-only.",
      "Use field to wrap xselect with label/hint/error when used in forms."
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
        ],
        _on_change: {
          _module: "xd",
          _op: "set",
          _params: {
            key: "filters.status",
            value: "$data"
          }
        }
      },
      {
        _type: "xselect",
        _value: "terminal",
        _options: [
          { value: "terminal", label: "Terminal" },
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light" }
        ],
        _on_change: {
          _module: "xui",
          _op: "apply-theme",
          _params: {
            _theme: "$data"
          }
        }
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
  private __data_source?: string;
  private __selected_data_source?: string;
  private __data_output?: string;
  private __selected_unsub?: () => void;

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

  private getChangeHandler() {
    const direct =
      (this as any)._on_change;

    if (direct) {
      return direct;
    }

    const on =
      (this as any)._on;

    if (
      on &&
      typeof on === "object"
    ) {
      return (
        on._change ??
        on.change ??
        undefined
      );
    }

    return undefined;
  }

  private normalizeSize(value?: XSelectSize): XSelectSize {
    return value === "sm" ? "sm" : "md";
  }

  private normalizeBoolean(value?: boolean, fallback = false): boolean {
    if (value === true || value === ("true" as any)) return true;
    if (value === false || value === ("false" as any)) return false;
    return fallback;
  }

  private normalizeDataKey(value: any): string | undefined {
    return typeof value === "string" && value.trim()
      ? value.trim()
      : undefined;
  }

  private normalizeValue(value: any): string {
    return value == null ? "" : String(value);
  }

  private normalizeOption(option: any): XSelectOption | undefined {
    if (option == null) return undefined;

    if (typeof option === "string" || typeof option === "number") {
      const value = String(option);
      return { value, label: value };
    }

    if (typeof option !== "object") return undefined;

    const rawValue = (option as any).value;
    const value = this.normalizeValue(rawValue);
    const rawLabel =
      (option as any).label != null ? (option as any).label : rawValue;

    return {
      value,
      label: this.normalizeValue(rawLabel),
      disabled: this.normalizeBoolean((option as any).disabled, false),
    };
  }

  private normalizeOptions(options: any): XSelectOption[] {
    if (!Array.isArray(options)) return [];
    return options
      .map((option) => this.normalizeOption(option))
      .filter((option): option is XSelectOption => Boolean(option));
  }

  private readXDataValue(key?: string): { hasValue: boolean; value: any } {
    if (!key || !_xd) return { hasValue: false, value: undefined };

    if (
      typeof (_xd as any).has === "function" &&
      typeof (_xd as any).get === "function" &&
      (_xd as any).has(key)
    ) {
      return { hasValue: true, value: (_xd as any).get(key) };
    }

    if (typeof (_xd as any).get === "function") {
      const value = (_xd as any).get(key);
      if (value !== undefined) return { hasValue: true, value };
    }

    const legacyStore = (_xd as any)._o;
    if (
      legacyStore &&
      typeof legacyStore === "object" &&
      Object.prototype.hasOwnProperty.call(legacyStore, key)
    ) {
      return { hasValue: true, value: legacyStore[key] };
    }

    return { hasValue: false, value: undefined };
  }

  private writeXDataValue(key: string | undefined, value: string) {
    if (!key || !_xd || typeof (_xd as any).set !== "function") return;
    (_xd as any).set(key, value, {
      source: `${this._type}#${this._id}.change`,
    });
  }

  private hasOptionValue(value: string): boolean {
    return this.__options.some((option) => option.value === value);
  }

  private getDisplayValue(value = this.__value): string {
    if (!value) return "";
    return this.hasOptionValue(value) ? value : "";
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
    this.__data_source = this.normalizeDataKey((this as any)._data_source);
    this.__selected_data_source = this.normalizeDataKey(
      (this as any)._selected_data_source
    );
    this.__data_output = this.normalizeDataKey((this as any)._data_output);

    this.__placeholder = (this as any)._placeholder ? String((this as any)._placeholder) : undefined;
    const dataSourceOptions = this.readXDataValue(this.__data_source);
    this.__options = this.normalizeOptions(
      dataSourceOptions.hasValue
        ? dataSourceOptions.value
        : (this as any)._options
    );

    const selectedData = this.readXDataValue(this.__selected_data_source);
    this.__value = selectedData.hasValue
      ? this.normalizeValue(selectedData.value)
      : this.normalizeValue((this as any)._value);

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
    const controlDom =
      (control as any).dom as HTMLSelectElement | undefined;

    if (controlDom) {
      controlDom.disabled = this.__disabled;

      if (this.__disabled) {
        controlDom.setAttribute("disabled", "disabled");
      } else {
        controlDom.removeAttribute("disabled");
      }
    } else {
      (control as any).disabled = this.__disabled ? true : undefined;
    }

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
    const controlDom =
      (control as any).dom as HTMLSelectElement | undefined;
    if (controlDom) controlDom.replaceChildren();
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
    this.__options = this.normalizeOptions(options);
    const control = this.getControl();
    if (!control) return;
    this.clearOptions(control);

    const displayValue = this.getDisplayValue();
    const hasValue = displayValue.length > 0;
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
      const selected = opt.value === displayValue;
      control.append(this.buildOption(opt, selected));
    });

    this.syncControlValue();

    if (!silent) this.setValue(this.__value, true);
  }

  private syncControlValue() {
    const control = this.getControl();
    if (!control) return;

    const displayValue = this.getDisplayValue();
    (control as any).value = displayValue;

    const controlDom =
      (control as any).dom as HTMLSelectElement | undefined;
    if (controlDom) controlDom.value = displayValue;
  }

  private bindSelectedDataSource() {
    if (
      !this.__selected_data_source ||
      !_xd ||
      typeof (_xd as any).on !== "function"
    ) {
      return;
    }

    this.unbindSelectedDataSource();
    const key = this.__selected_data_source;
    this.__selected_unsub = (_xd as any).on(key, (event: any) => {
      const next =
        event &&
        typeof event === "object" &&
        "value" in event
          ? event.value
          : event;
      this.setValue(next, true);
    });
  }

  private unbindSelectedDataSource() {
    if (this.__selected_unsub) {
      this.__selected_unsub();
      this.__selected_unsub = undefined;
    }
  }

  private handleChange(xobj: any, ev: Event) {
    const val = String((ev as any)?.target?.value ?? xobj?.value ?? xobj?._value ?? "");
    this.__value = val;
    this.writeXDataValue(
      this.__data_output ?? this.__selected_data_source,
      val
    );
    this.syncControlValue();
    const handler = this.getChangeHandler();
    if (handler) this.checkAndRunInternalFunction(handler, val, ev);
  }

  getValue(): string {
    return this.__value;
  }

  setValue(v: string, silent = false) {
    this.__value = this.normalizeValue(v);
    this.syncControlValue();
    if (!silent) {
      const handler = this.getChangeHandler();
      if (handler) this.checkAndRunInternalFunction(handler, this.__value, undefined);
    }
  }

  async onMount() {
    await super.onMount();
    this.bindSelectedDataSource();
  }

  async onData(data: any) {
    // _data_source is bound by XUIObject; xselect consumes that data as options.
    await super.onData(data);
    this.setOptions(this.normalizeOptions(data), true);
  }

  async dispose() {
    this.unbindSelectedDataSource();
    await super.dispose();
  }

  focus() {
    const logger = (globalThis as any)?._xlog ?? (this as any)._xlog;
    if (logger?.log) logger.log("XSelect.focus requires engine input focus support.");
  }
}
