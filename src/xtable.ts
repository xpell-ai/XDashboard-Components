import { _xlog, XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData, XObjectData } from "@xpell/ui";
import { _xd } from "@xpell/ui";

export type XTableColumn = {
  key: string;
  label?: string;
  width?: string;
  align?: "start" | "center" | "end";
  class?: string;
  render?: (value: any, row: any, index: number) => any;
};

export interface XTableData extends XUIObjectData {
  _type: "table";
  _columns: XTableColumn[];
  _rows?: any[] | string;
  _data_source?: string;
  _on_data?: ((xobj: XTable, data: any) => void) | string;
  _row_key?: string;
  _dense?: boolean;
  _striped?: boolean;
  _hover?: boolean;
  _bordered?: boolean;
  _empty_text?: string;
}

type XTableAlign = "start" | "center" | "end";

export class XTable extends XUIObject {
  static _xtype = "table";

  private __columns: XTableColumn[] = [];
  private __rows?: any[] | string;
  private __row_key?: string;
  private __dense = false;
  private __striped = false;
  private __hover = true;
  private __bordered = true;
  private __empty_text = "No data";
  private __ready = false;
  private __data_inflight = false;

  constructor(data: XTableData) {
    const defaults: any = {
      _type: XTable._xtype,
      class: "xtable",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.parse(data);
    this.applyPropsFromData();
    this.applyLayout();
    this.buildSkeleton();
    this.__ready = true;
    this.renderBody();
  }

  private get tableId() {
    return this._id + "_table";
  }

  private get theadId() {
    return this._id + "_thead";
  }

  private get tbodyId() {
    return this._id + "_tbody";
  }

  private normalizeAlign(value?: XTableAlign): XTableAlign | undefined {
    if (value === "start" || value === "center" || value === "end") return value;
    return undefined;
  }

  private normalizeBoolean(value?: boolean): boolean {
    return value === true || value === ("true" as any);
  }

  private applyPropsFromData() {
    const dataColumns = (this as any)._columns;
    this.__columns = Array.isArray(dataColumns) ? dataColumns : [];
    this.__rows = (this as any)._rows;
    this.__row_key =
      (this as any)._row_key != null ? String((this as any)._row_key) : undefined;
    this.__dense = this.normalizeBoolean((this as any)._dense);
    this.__striped = this.normalizeBoolean((this as any)._striped);

    const hover = (this as any)._hover;
    if (hover === false || hover === ("false" as any)) this.__hover = false;
    else if (hover === true || hover === ("true" as any)) this.__hover = true;

    const bordered = (this as any)._bordered;
    if (bordered === false || bordered === ("false" as any)) this.__bordered = false;
    else if (bordered === true || bordered === ("true" as any)) this.__bordered = true;

    this.__empty_text = (this as any)._empty_text
      ? String((this as any)._empty_text)
      : "No data";
  }

  private mapAlign(value?: XTableAlign): string | undefined {
    if (!value) return undefined;
    if (value === "start") return "left";
    if (value === "end") return "right";
    return "center";
  }

  private applyLayout() {
    this.addClass("xtable");

    const allMods = [
      "xtable--dense",
      "xtable--striped",
      "xtable--hover",
      "xtable--bordered",
    ];
    const nextMods: string[] = [];
    if (this.__dense) nextMods.push("xtable--dense");
    if (this.__striped) nextMods.push("xtable--striped");
    if (this.__hover) nextMods.push("xtable--hover");
    if (this.__bordered) nextMods.push("xtable--bordered");

    this.replaceClass(allMods.join(" "), nextMods.join(" "));
  }

  private buildSkeleton() {
    const tableData: XObjectData = {
      _type: "xhtml",
      _id: this.tableId,
      class: "xtable__table",
      _html_tag: "table",
      _children: [
        {
          _type: "xhtml",
          _id: this.theadId,
          class: "xtable__head",
          _html_tag: "thead",
        },
        {
          _type: "xhtml",
          _id: this.tbodyId,
          class: "xtable__body",
          _html_tag: "tbody",
        },
      ],
    };

    this.append(tableData);
    this.buildHeader();
  }

  private clearChildren(target: XUIObject | null) {
    if (!target) return;
    const existing = Array.isArray((target as any)._children)
      ? [...((target as any)._children as XUIObject[])]
      : [];
    existing.forEach((child) => {
      if (child) target.removeChild(child as any, true);
    });
    if (target.dom instanceof HTMLElement) {
      target.dom.replaceChildren();
    }
  }

  private getHead() {
    return XUI.getObject(this.theadId) as XUIObject | undefined;
  }

  private getBody() {
    return XUI.getObject(this.tbodyId) as XUIObject | undefined;
  }

  private buildHeader() {
    const head = this.getHead();
    if (!head) return;
    this.clearChildren(head);

    const row = XUI.create({
      _type: "xhtml",
      class: "xtable__row",
      _html_tag: "tr",
    });

    this.__columns.forEach((col) => {
      const align = this.mapAlign(this.normalizeAlign(col.align));
      const styleParts: string[] = [];
      if (col.width) styleParts.push(`width:${col.width}`);
      if (align) styleParts.push(`text-align:${align}`);
      const style = styleParts.join("; ");

      const th = XUI.create({
        _type: "xhtml",
        _html_tag: "th",
        class: `xtable__th${col.class ? " " + col.class : ""}`,
        _text: col.label || col.key,
        ...(style ? { style } : {}),
      });

      row.append(th);
    });

    head.append(row);
  }

  private resolveRows(): any[] {
    if (Array.isArray(this.__rows)) return this.__rows;
    if (typeof this.__rows === "string" && _xd && (_xd as any)._o) {
      const data = (_xd as any)._o[this.__rows];
      if (Array.isArray(data)) return data;
      if (data && Array.isArray((data as any).rows)) return (data as any).rows;
      return [];
    }
    return [];
  }

  private isXObjectData(value: any): value is XObjectData {
    return value && typeof value === "object" && typeof value._type === "string";
  }

  private setCellText(cell: XUIObject, text: string) {
    if (typeof (cell as any).setText === "function") {
      (cell as any).setText(text);
      return;
    }
    (cell as any)._text = text;
    if (cell.dom instanceof HTMLElement) cell.dom.textContent = text;
  }

  private appendCellContent(cell: XUIObject, output: any) {
    if (output instanceof XUIObject) {
      cell.append(output);
      return;
    }
    if (this.isXObjectData(output)) {
      const child = XUI.create(output as XObjectData);
      cell.append(child);
      return;
    }
    this.setCellText(cell, String(output ?? ""));
  }

  renderBody() {
    const body = this.getBody();
    if (!body) return;
    this.clearChildren(body);

    const rows = this.resolveRows();
    const cols = this.__columns || [];
    const colCount = Math.max(1, cols.length);

    if (!rows.length) {
      const emptyRow = XUI.create({
        _type: "xhtml",
        _html_tag: "tr",
        class: "xtable__row xtable__row--empty",
      });

      const emptyCell = XUI.create({
        _type: "xhtml",
        _html_tag: "td",
        class: "xtable__td xtable__empty",
        colspan: String(colCount),
      });

      this.setCellText(emptyCell as XUIObject, this.__empty_text);
      emptyRow.append(emptyCell);
      body.append(emptyRow);
      return;
    }

    rows.forEach((row, rowIndex) => {
      const tr = XUI.create({
        _type: "xhtml",
        _html_tag: "tr",
        class: "xtable__row",
      });

      if (this.__row_key && row && row[this.__row_key] != null) {
        (tr as any)["data-key"] = String(row[this.__row_key]);
      }

      cols.forEach((col) => {
        const align = this.mapAlign(this.normalizeAlign(col.align));
        const styleParts: string[] = [];
        if (col.width) styleParts.push(`width:${col.width}`);
        if (align) styleParts.push(`text-align:${align}`);
        const style = styleParts.join("; ");

        const td = XUI.create({
          _type: "xhtml",
          _html_tag: "td",
          class: `xtable__td${col.class ? " " + col.class : ""}`,
          ...(style ? { style } : {}),
        });

        const value = row ? row[col.key] : undefined;
        if (col.render) {
          const output = col.render(value, row, rowIndex);
          this.appendCellContent(td as XUIObject, output);
        } else {
          this.setCellText(td as XUIObject, String(value ?? ""));
        }

        tr.append(td);
      });

      body.append(tr);
    });
  }

  refresh() {
    this.renderBody();
  }

  private rebuildHeaderAndBody() {
    if (!this.__ready) return;
    this.buildHeader();
    this.renderBody();
  }

  set _columns(value: XTableColumn[]) {
    this.__columns = Array.isArray(value) ? value : [];
    this.rebuildHeaderAndBody();
  }

  get _columns() {
    return this.__columns;
  }

  set _rows(value: any[] | string | undefined) {
    this.__rows = value;
    if (this.__ready) this.renderBody();
  }

  get _rows() {
    return this.__rows;
  }

  set _row_key(value: string | undefined) {
    this.__row_key = value;
  }

  get _row_key() {
    return this.__row_key;
  }

  set _dense(value: boolean | undefined) {
    this.__dense = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _dense() {
    return this.__dense;
  }

  set _striped(value: boolean | undefined) {
    this.__striped = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _striped() {
    return this.__striped;
  }

  set _hover(value: boolean | undefined) {
    this.__hover = value === false ? false : this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _hover() {
    return this.__hover;
  }

  set _bordered(value: boolean | undefined) {
    this.__bordered = value === false ? false : this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _bordered() {
    return this.__bordered;
  }

  set _empty_text(value: string | undefined) {
    this.__empty_text = value || "No data";
    if (this.__ready) this.renderBody();
  }

  get _empty_text() {
    return this.__empty_text;
  }

  async onData(data: any) {
    if (this.__data_inflight) return;
    this.__data_inflight = true;

    const clear =
      (this as any).emptyDataSource || (this as any).emptyDataSorce;
    if (typeof clear === "function") clear.call(this);

    const prevRows = this.__rows;
    await super.onData(data);

    const hasHandler = (this as any)._on_data != null;
    if (!hasHandler) {
      let nextRows: any[] = [];
      if (Array.isArray(data)) {
        nextRows = data;
      } else if (data && Array.isArray((data as any).rows)) {
        nextRows = (data as any).rows;
      }
      const changed = this.__rows !== nextRows;
      this.__rows = nextRows;
      if (changed) this.refresh();
    } else if (this.__rows !== prevRows) {
      this.refresh();
    }

    
    this.__data_inflight = false;
  }
}
