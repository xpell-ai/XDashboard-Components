import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XToastData extends XUIObjectData {
  _type: "toast";
  _open?: boolean;
  _text?: string;
  _variant?: "default" | "success" | "error" | "warn" | "info";
  _icon?: XUIObjectData;
  _actions?: XUIObjectData[];
  _closable?: boolean;
  _auto_close_ms?: number;
  _position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  _on_open?: (xobj: XToast) => void;
  _on_close?: (xobj: XToast) => void;
  class?: string;
}

type XToastVariant = "default" | "success" | "error" | "warn" | "info";
type XToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export class XToast extends XUIObject {
  static _xtype = "toast";

  private __open = false;
  private __text = "";
  private __variant: XToastVariant = "default";
  private __icon?: XUIObjectData;
  private __actions?: XUIObjectData[];
  private __closable = true;
  private __auto_close_ms?: number;
  private __position: XToastPosition = "bottom-right";
  private __elapsed = 0;
  private __last_tick?: number;
  private __ready = false;

  private readonly __container_id: string;
  private readonly __text_id: string;

  constructor(data: XToastData) {
    const defaults: any = {
      _type: XToast._xtype,
      class: "xtoast",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__container_id = this._id + "_container";
    this.__text_id = this._id + "_text";

    this.parse(data);
    this.applyProps();
    this.buildSkeleton();
    this.applyLayout();
    this.__ready = true;
  }

  private normalizeBoolean(value?: boolean, fallback = false): boolean {
    if (value === true || value === ("true" as any)) return true;
    if (value === false || value === ("false" as any)) return false;
    return fallback;
  }

  private normalizeVariant(value?: XToastVariant): XToastVariant {
    if (value === "success" || value === "error" || value === "warn" || value === "info") {
      return value;
    }
    return "default";
  }

  private normalizePosition(value?: XToastPosition): XToastPosition {
    if (value === "top-right" || value === "top-left" || value === "bottom-left") {
      return value;
    }
    return "bottom-right";
  }

  private applyProps() {
    this.__open = this.normalizeBoolean((this as any)._open, false);
    this.__text = (this as any)._text ? String((this as any)._text) : "";
    this.__variant = this.normalizeVariant((this as any)._variant);
    this.__icon = (this as any)._icon as XUIObjectData | undefined;
    this.__actions = Array.isArray((this as any)._actions) ? (this as any)._actions : undefined;
    this.__closable = this.normalizeBoolean((this as any)._closable, true);
    this.__auto_close_ms =
      typeof (this as any)._auto_close_ms === "number"
        ? (this as any)._auto_close_ms
        : undefined;
    this.__position = this.normalizePosition((this as any)._position);
  }

  private buildSkeleton() {
    const rowChildren: XUIObjectData[] = [];

    if (this.__icon) {
      rowChildren.push({
        _type: "view",
        class: "xtoast__icon",
        _children: [this.__icon],
      });
    }

    rowChildren.push({
      _type: "label",
      _id: this.__text_id,
      class: "xtoast__text",
      _text: this.__text,
    });

    if (this.__actions && this.__actions.length) {
      rowChildren.push({
        _type: "view",
        class: "xtoast__actions",
        _children: this.__actions,
      });
    }

    if (this.__closable) {
      rowChildren.push({
        _type: "button",
        class: "xtoast__close",
        _text: "×",
        _on_click: () => this.close(),
      });
    }

    this.append({
      _type: "view",
      _id: this.__container_id,
      class: "xtoast__container",
      _children: rowChildren,
    });
  }

  private rebuild() {
    const container = XUI.getObject(this.__container_id) as XUIObject | undefined;
    if (container && typeof (this as any).removeChild === "function") {
      (this as any).removeChild(container, true);
    }
    this.buildSkeleton();
    this.applyLayout();
  }

  private applyLayout() {
    this.addClass("xtoast");
    this.replaceClass("xtoast--open", this.__open ? "xtoast--open" : "");
    this.replaceClass(
      "xtoast--default xtoast--success xtoast--error xtoast--warn xtoast--info",
      `xtoast--${this.__variant}`
    );
    this.replaceClass(
      "xtoast--top-right xtoast--top-left xtoast--bottom-right xtoast--bottom-left",
      `xtoast--${this.__position}`
    );
  }

  private resetTimer() {
    this.__elapsed = 0;
    this.__last_tick = undefined;
  }

  async onFrame(frameNumber: number) {
    if (!this.__open || !this.__auto_close_ms || this.__auto_close_ms <= 0) return;
    await super.onFrame(frameNumber);
    const now = globalThis.performance?.now
      ? globalThis.performance.now()
      : Date.now();
    if (!this.__last_tick) {
      this.__last_tick = now;
      return;
    }
    this.__elapsed += now - this.__last_tick;
    this.__last_tick = now;
    if (this.__elapsed >= this.__auto_close_ms) {
      this.close();
      this.__last_tick = undefined;
    }
  }

  isOpen(): boolean {
    return this.__open;
  }

  setOpen(v: boolean, silent = false) {
    const next = this.normalizeBoolean(v, false);
    const changed = next !== this.__open;
    this.__open = next;
    if (this.__open) this.resetTimer();
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

  set _open(value: boolean | undefined) {
    this.__open = this.normalizeBoolean(value, false);
    if (this.__open) this.resetTimer();
    this.applyLayout();
  }

  get _open() {
    return this.__open;
  }

  set _text(value: string) {
    this.__text = value ? String(value) : "";
    const label = XUI.getObject(this.__text_id) as any;
    if (label) label._text = this.__text;
  }

  get _text(): string {
    return this.__text;
  }

  set _variant(value: XToastVariant | undefined) {
    this.__variant = this.normalizeVariant(value);
    this.applyLayout();
  }

  get _variant() {
    return this.__variant;
  }

  set _position(value: XToastPosition | undefined) {
    this.__position = this.normalizePosition(value);
    this.applyLayout();
  }

  get _position() {
    return this.__position;
  }

  set _icon(value: XUIObjectData | undefined) {
    this.__icon = value;
    if (this.__ready) this.rebuild();
  }

  get _icon() {
    return this.__icon;
  }

  set _actions(value: XUIObjectData[] | undefined) {
    this.__actions = Array.isArray(value) ? value : undefined;
    if (this.__ready) this.rebuild();
  }

  get _actions() {
    return this.__actions;
  }

  set _closable(value: boolean | undefined) {
    this.__closable = this.normalizeBoolean(value, true);
    if (this.__ready) this.rebuild();
  }

  get _closable() {
    return this.__closable;
  }

  set _auto_close_ms(value: number | undefined) {
    this.__auto_close_ms = typeof value === "number" ? value : undefined;
    if (this.__open) this.resetTimer();
  }

  get _auto_close_ms() {
    return this.__auto_close_ms;
  }
}
