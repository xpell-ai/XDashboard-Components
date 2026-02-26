import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XFieldData extends XUIObjectData {
  _type: "field";
  _label?: string;
  _hint?: string;
  _error?: string;
  _required?: boolean;
  _inline?: boolean;
  _size?: "sm" | "md";
  _control?: XUIObjectData;
  class?: string;
}

type XFieldSize = "sm" | "md";
type XFieldAlign = "inline" | "stack";

export class XField extends XUIObject {
  static _xtype = "field";

  private __size: XFieldSize = "md";
  private __align: XFieldAlign = "stack";
  private __has_error = false;
  private __label = "";
  private __hint = "";
  private __error = "";
  private __required = false;
  private __inline = false;
  private __control?: XUIObjectData;
  private __initializing = true;

  private readonly __root_id: string;
  private readonly __label_id: string;
  private readonly __required_id: string;
  private readonly __hint_id: string;
  private readonly __error_id: string;
  private readonly __control_wrap_id: string;
  private readonly __inline_row_id: string;

  constructor(data: XFieldData) {
    const defaults: any = {
      _type: XField._xtype,
      class: "xfield",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__root_id = this._id + "_root";
    this.__label_id = this._id + "_label";
    this.__required_id = this._id + "_required";
    this.__hint_id = this._id + "_hint";
    this.__error_id = this._id + "_error";
    this.__control_wrap_id = this._id + "_control_wrap";
    this.__inline_row_id = this._id + "_inline_row";

    this.parse(data);
    this.applyProps();
    this.buildSkeleton();
    this.applyLayout();
    this.__initializing = false;
  }

  private normalizeSize(value?: XFieldSize): XFieldSize {
    return value === "sm" ? "sm" : "md";
  }

  private normalizeBoolean(value?: boolean): boolean {
    return value === true || value === ("true" as any);
  }

  private applyProps() {
    this.__label = (this as any)._label ? String((this as any)._label) : "";
    this.__hint = (this as any)._hint ? String((this as any)._hint) : "";
    this.__error = (this as any)._error ? String((this as any)._error) : "";
    this.__required = this.normalizeBoolean((this as any)._required);
    this.__inline = this.normalizeBoolean((this as any)._inline);
    this.__control = (this as any)._control as XUIObjectData | undefined;

    this.__align = this.__inline ? "inline" : "stack";
    this.__size = this.normalizeSize((this as any)._size);
    this.__has_error = this.hasError();
  }

  private hasLabel(): boolean {
    return this.__label.trim().length > 0;
  }

  private hasHint(): boolean {
    return this.__hint.trim().length > 0;
  }

  private hasError(): boolean {
    return this.__error.trim().length > 0;
  }

  private buildLabelRow() {
    const children: XUIObjectData[] = [];
    if (this.hasLabel()) {
      children.push({
        _type: "label",
        _id: this.__label_id,
        class: "xfield__label",
        _text: this.__label.trim(),
      });
    }
    if (this.__required) {
      children.push({
        _type: "label",
        _id: this.__required_id,
        class: "xfield__required",
        _text: "*",
      });
    }
    if (!children.length) return null;
    return {
      _type: "stack",
      class: "xfield__label-row",
      _direction: "horizontal",
      _gap: 6,
      _children: children,
    };
  }

  private buildControlRow() {
    if (!this.__control) return null;
    return {
      _type: "view",
      _id: this.__control_wrap_id,
      class: "xfield__control",
      _children: [this.__control],
    };
  }

  private buildMessageRow() {
    if (this.hasError()) {
      return {
        _type: "label",
        _id: this.__error_id,
        class: "xfield__error",
        _text: this.__error.trim(),
      };
    }
    if (this.hasHint()) {
      return {
        _type: "label",
        _id: this.__hint_id,
        class: "xfield__hint",
        _text: this.__hint.trim(),
      };
    }
    return null;
  }

  private buildSkeleton() {
    const rows: XUIObjectData[] = [];
    const labelRow = this.buildLabelRow();
    const controlRow = this.buildControlRow();
    const messageRow = this.buildMessageRow();

    if (this.__inline) {
      const inlineRowChildren: XUIObjectData[] = [];
      if (labelRow) inlineRowChildren.push(labelRow);
      if (controlRow) inlineRowChildren.push(controlRow);
      if (inlineRowChildren.length) {
        rows.push({
          _type: "stack",
          _id: this.__inline_row_id,
          class: "xfield__row xfield__row--inline",
          _direction: "horizontal",
          _gap: 12,
          _children: inlineRowChildren,
        });
      }
      if (messageRow) rows.push(messageRow);
    } else {
      if (labelRow) rows.push(labelRow);
      if (controlRow) rows.push(controlRow);
      if (messageRow) rows.push(messageRow);
    }

    this.append({
      _type: "stack",
      _id: this.__root_id,
      class: "xfield__stack",
      _direction: "vertical",
      _gap: 8,
      _children: rows,
    });
  }

  private getRoot() {
    return XUI.getObject(this.__root_id) as XUIObject | undefined;
  }

  private rebuild() {
    const root = this.getRoot();
    if (root && typeof (this as any).removeChild === "function") {
      (this as any).removeChild(root as any, true);
    }
    this.buildSkeleton();
    this.applyLayout();
  }

  private updateLabelNode() {
    const label = XUI.getObject(this.__label_id) as any;
    if (this.hasLabel()) {
      if (label) {
        label._text = this.__label.trim();
      } else {
        this.rebuild();
      }
    } else if (label) {
      this.rebuild();
    }
  }

  private updateRequiredNode() {
    const required = XUI.getObject(this.__required_id) as any;
    if (this.__required) {
      if (!required) this.rebuild();
    } else if (required) {
      this.rebuild();
    }
  }

  private updateHintNode() {
    if (this.__has_error) return;
    const hint = XUI.getObject(this.__hint_id) as any;
    if (this.hasHint()) {
      if (hint) {
        hint._text = this.__hint.trim();
      } else {
        this.rebuild();
      }
    } else if (hint) {
      this.rebuild();
    }
  }

  private updateErrorNode() {
    const hasError = this.hasError();
    const error = XUI.getObject(this.__error_id) as any;
    const hint = XUI.getObject(this.__hint_id) as any;

    this.__has_error = hasError;

    if (hasError) {
      if (!error || hint) {
        this.rebuild();
        return;
      }
      error._text = this.__error.trim();
    } else {
      if (error) {
        this.rebuild();
        return;
      }
      if (this.hasHint() && !hint) {
        this.rebuild();
        return;
      }
      this.updateHintNode();
    }

    this.applyLayout();
  }

  private applyLayout() {
    this.addClass("xfield");
    this.replaceClass("xfield--sm xfield--md", `xfield--${this.__size}`);
    this.replaceClass(
      "xfield--inline xfield--stack",
      this.__align === "inline" ? "xfield--inline" : "xfield--stack"
    );
    if (this.__has_error) this.addClass("xfield--error");
    else this.removeClass("xfield--error");
  }

  set _label(value: string | undefined) {
    this.__label = value ? String(value) : "";
    if (this.__initializing) return;
    this.updateLabelNode();
  }

  set _hint(value: string | undefined) {
    this.__hint = value ? String(value) : "";
    if (this.__initializing) return;
    this.updateHintNode();
  }

  set _error(value: string | undefined) {
    this.__error = value ? String(value) : "";
    if (this.__initializing) return;
    this.updateErrorNode();
  }

  set _required(value: boolean | undefined) {
    this.__required = this.normalizeBoolean(value);
    if (this.__initializing) return;
    this.updateRequiredNode();
  }

  set _inline(value: boolean | undefined) {
    this.__inline = this.normalizeBoolean(value);
    this.__align = this.__inline ? "inline" : "stack";
    if (this.__initializing) return;
    this.rebuild();
  }

  set _size(value: XFieldSize | undefined) {
    this.__size = this.normalizeSize(value);
    if (this.__initializing) return;
    this.applyLayout();
  }

  set _control(value: XUIObjectData | undefined) {
    this.__control = value;
    if (this.__initializing) return;
    this.rebuild();
  }

  get _label() {
    return this.__label;
  }

  get _hint() {
    return this.__hint;
  }

  get _error() {
    return this.__error;
  }

  get _required() {
    return this.__required;
  }

  get _inline() {
    return this.__inline;
  }

  get _size() {
    return this.__size;
  }

  get _control() {
    return this.__control;
  }
}
