import { _xd, _xem, XUI, XUIObject } from "@xpell/ui";
import type { XObjectData, XUIObjectData, XpellSkill } from "@xpell/ui";
import {
  normalizeDashboardImageSlot,
  type XDashboardImageSlotValue,
} from "./imageSlots";
import type { XDashboardDiscoverySkill } from "./xskills";
import { XKANBAN_SKILL } from "./xkanban.skill";

export type XKanbanColumn = {
  _value: any;
  _label?: string;
};

export type XKanbanItemMap = {
  _title?: any;
  _subtitle?: any;
  _image?: any;
  _image_alt?: any;
  _description?: any;
  _meta?: any;
  _badge?: any;
  _actions?: XObjectData[];
};

export type XKanbanMovePayload = {
  record: any;
  source_group: any;
  target_group: any;
  row_index: number;
  source_column?: XKanbanColumn;
  target_column?: XKanbanColumn;
};

export interface XKanbanData extends XUIObjectData {
  _type: "xkanban";
  _items?: any[] | string;
  _data_source?: string;
  _group_by?: string;
  _columns?: XKanbanColumn[];
  _item?: XKanbanItemMap;
  _actions?: XObjectData[];
  _row_key?: string;
  _min_col_width?: number;
  _gap?: number;
  _empty_text?: string;
  _empty_column_text?: string;
  _empty?: XObjectData;
  _draggable?: boolean;
  _on_select?: (xobj: XKanban, record: any, context: Record<string, any>) => void;
  _on_card_moved?: (xobj: XKanban, payload: XKanbanMovePayload) => void;
  _on_data?: ((xobj: XKanban, data: any) => void) | string;
  class?: string;
}

type KanbanRowsValue = any[] | string | undefined;

type GroupedKanbanColumn = {
  _value: any;
  _label: string;
  rows: Array<{ row: any; rowIndex: number; group: any }>;
};

export class XKanban extends XUIObject {
  static _xtype = "xkanban";
  static _skill: XpellSkill & XDashboardDiscoverySkill = XKANBAN_SKILL;

  static override getArtifactStrategy() {
    return "generator" as const;
  }

  static generateArtifact(intent: any = {}): XKanbanData {
    const entity =
      typeof intent._entity === "string" && intent._entity.trim()
        ? intent._entity.trim()
        : "records";

    return {
      _type: "xkanban",
      ...(intent._id ? { _id: intent._id } : {}),
      _data_source: `${entity}.records`,
      _group_by: "status",
      _row_key: "id",
      _min_col_width: 260,
      _gap: 16,
      _item: {
        _title: "$row.title",
        _subtitle: "$row.subtitle",
        _description: "$row.description",
        _badge: "$row.status",
      },
      _empty_text: "No records",
      _empty_column_text: "No records",
      _draggable: true,
    };
  }

  private __items: KanbanRowsValue;
  private __group_by = "status";
  private __columns?: XKanbanColumn[];
  private __item: XKanbanItemMap = {};
  private __actions?: XObjectData[];
  private __row_key?: string;
  private __min_col_width = 260;
  private __gap = 16;
  private __empty_text = "No records";
  private __empty_column_text = "No records";
  private __empty?: XObjectData;
  private __draggable = true;
  private __ready = false;
  private __data_inflight = false;
  private __drag?: { row: any; rowIndex: number; sourceGroup: any };

  private readonly __board_id: string;

  constructor(data: XKanbanData) {
    const defaults: any = {
      _type: XKanban._xtype,
      class: "xkanban",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__board_id = this._id + "_board";
    this.parse(data);
    this.applyPropsFromData();
    this.applyLayout();
    this.buildSkeleton();
    this.__ready = true;
    this.renderItems();
    this.hydrateFromDataSource();
  }

  private normalizeBoolean(value?: boolean, fallback = false): boolean {
    if (value === true || value === ("true" as any)) return true;
    if (value === false || value === ("false" as any)) return false;
    return fallback;
  }

  private normalizeNumber(value: any, fallback: number): number {
    const next = Number(value);
    return Number.isFinite(next) && next > 0 ? next : fallback;
  }

  private normalizeDataKey(value: any): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private normalizeColumns(value: any): XKanbanColumn[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const columns = value
      .map((column) => {
        if (!column || typeof column !== "object") return undefined;
        const next = column as XKanbanColumn;
        if (next._value === undefined || next._value === null) return undefined;
        return {
          _value: next._value,
          _label:
            next._label !== undefined && next._label !== null
              ? String(next._label)
              : this.textValue(next._value),
        };
      })
      .filter(Boolean) as XKanbanColumn[];
    return columns.length ? columns : undefined;
  }

  private applyPropsFromData() {
    this.__items = (this as any)._items;
    this.__group_by = this.normalizeDataKey((this as any)._group_by) ?? "status";
    this.__columns = this.normalizeColumns((this as any)._columns);
    this.__item =
      (this as any)._item && typeof (this as any)._item === "object"
        ? { ...((this as any)._item as XKanbanItemMap) }
        : {};
    this.__actions = Array.isArray((this as any)._actions)
      ? (this as any)._actions
      : undefined;
    this.__row_key = this.normalizeDataKey((this as any)._row_key);
    this.__min_col_width = this.normalizeNumber(
      (this as any)._min_col_width,
      260
    );
    this.__gap = this.normalizeNumber((this as any)._gap, 16);
    this.__empty_text = (this as any)._empty_text
      ? String((this as any)._empty_text)
      : "No records";
    this.__empty_column_text = (this as any)._empty_column_text
      ? String((this as any)._empty_column_text)
      : "No records";
    this.__empty =
      (this as any)._empty && typeof (this as any)._empty === "object"
        ? ((this as any)._empty as XObjectData)
        : undefined;
    this.__draggable = this.normalizeBoolean((this as any)._draggable, true);
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private buildClassName(): string {
    const existing = String((this as any).class || "");
    const filtered = this.splitClasses(existing).filter((c) => c !== "xkanban");
    return Array.from(new Set(["xkanban", ...filtered])).join(" ");
  }

  private applyLayout() {
    (this as any).class = this.buildClassName();
    const styleParts = [
      `--xkanban-min-col:${this.__min_col_width}px`,
      `--xkanban-gap:${this.__gap}px`,
    ];
    const existingStyle = String((this as any).style || "")
      .split(";")
      .map((part) => part.trim())
      .filter(
        (part) =>
          part &&
          !part.startsWith("--xkanban-min-col:") &&
          !part.startsWith("--xkanban-gap:")
      );
    (this as any).style = [...existingStyle, ...styleParts].join("; ");
    if (typeof HTMLElement !== "undefined") {
      this.update({ class: (this as any).class, style: (this as any).style } as any);
    }
  }

  private buildSkeleton() {
    this.append({
      _type: "view",
      _id: this.__board_id,
      class: "xkanban__board",
      _children: [],
    });
  }

  private getBoard() {
    return XUI.getObject(this.__board_id) as XUIObject | undefined;
  }

  private clearChildren(target: XUIObject | undefined) {
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

    return { hasValue: false, value: undefined };
  }

  private hydrateFromDataSource() {
    const dataSource = this.normalizeDataKey((this as any)._data_source);
    if (!dataSource) return;

    const current = this.readXDataValue(dataSource);
    if (!current.hasValue) return;

    this.__items = this.normalizeRows(current.value);
    if (this.__ready) this.refresh();
  }

  private normalizeRows(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];

    if (Array.isArray((value as any).records)) return (value as any).records;
    if (Array.isArray((value as any)._records)) return (value as any)._records;
    if (Array.isArray((value as any)._records?._data)) return (value as any)._records._data;
    if (Array.isArray((value as any).items)) return (value as any).items;
    if (Array.isArray((value as any)._items)) return (value as any)._items;
    if (Array.isArray((value as any).rows)) return (value as any).rows;
    if (Array.isArray((value as any)._rows)) return (value as any)._rows;
    if (Array.isArray((value as any).data)) return (value as any).data;
    if (Array.isArray((value as any)._data)) return (value as any)._data;

    return [];
  }

  private resolveItems(): any[] {
    if (Array.isArray(this.__items)) return this.__items;
    if (typeof this.__items === "string") {
      const current = this.readXDataValue(this.__items.trim());
      if (!current.hasValue) return [];
      return this.normalizeRows(current.value);
    }
    return [];
  }

  private readRowPath(row: any, path: string): any {
    if (!path) return row;

    return path.split(".").reduce((current, key) => {
      if (current == null) return undefined;
      return current[key];
    }, row);
  }

  private firstRowValue(row: any, paths: string[]): any {
    for (const path of paths) {
      const value = this.readRowPath(row, path);
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }
    return undefined;
  }

  private resolveTemplateValue(value: string, row: any, rowIndex: number): any {
    if (value === "$row_index") return rowIndex;
    if (value === "$row") return row;
    if (!value.startsWith("$row.")) return value;
    return this.readRowPath(row, value.slice("$row.".length));
  }

  private resolveTemplates(value: any, row: any, rowIndex: number): any {
    if (typeof value === "string") {
      return this.resolveTemplateValue(value, row, rowIndex);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolveTemplates(item, row, rowIndex));
    }

    if (!value || typeof value !== "object") return value;

    const next: Record<string, any> = {};
    Object.keys(value).forEach((key) => {
      next[key] = this.resolveTemplates(value[key], row, rowIndex);
    });
    return next;
  }

  private resolveField(
    fieldValue: any,
    row: any,
    rowIndex: number,
    fallbackPaths: string[]
  ): any {
    const resolved = this.resolveTemplates(fieldValue, row, rowIndex);
    if (resolved !== undefined && resolved !== null && String(resolved).trim() !== "") {
      return resolved;
    }
    return this.firstRowValue(row, fallbackPaths);
  }

  private textValue(value: any): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
  }

  private groupValue(row: any, rowIndex: number): any {
    const groupBy = this.__group_by;
    if (groupBy === "$row") return row;
    if (groupBy === "$row_index") return rowIndex;
    if (groupBy.startsWith("$row.")) {
      return this.readRowPath(row, groupBy.slice("$row.".length));
    }
    return this.readRowPath(row, groupBy);
  }

  private groupKey(value: any): string {
    if (value === undefined || value === null || value === "") return "__ungrouped";
    return String(value);
  }

  private groupLabel(value: any): string {
    const text = this.textValue(value);
    if (!text) return "Ungrouped";
    return text
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private columnFromValue(value: any): XKanbanColumn {
    return {
      _value: value,
      _label: this.groupLabel(value),
    };
  }

  private buildGroups(items: any[]): GroupedKanbanColumn[] {
    const columns = this.__columns
      ? this.__columns.map((column) => ({
          _value: column._value,
          _label: column._label ?? this.groupLabel(column._value),
          rows: [] as GroupedKanbanColumn["rows"],
        }))
      : [];
    const columnByKey = new Map(columns.map((column) => [this.groupKey(column._value), column]));

    items.forEach((row, rowIndex) => {
      const group = this.groupValue(row, rowIndex);
      const key = this.groupKey(group);
      let column = columnByKey.get(key);
      if (!column) {
        const col = this.columnFromValue(group);
        column = { ...col, _label: col._label ?? this.groupLabel(group), rows: [] };
        columns.push(column);
        columnByKey.set(key, column);
      }
      column.rows.push({ row, rowIndex, group });
    });

    return columns;
  }

  private rowKey(row: any, rowIndex: number): string {
    if (this.__row_key && row && row[this.__row_key] != null) {
      return String(row[this.__row_key]);
    }
    return String(rowIndex);
  }

  private safeIdSegment(value: string): string {
    return (
      value
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "item"
    );
  }

  private cloneAction(action: XObjectData): XObjectData {
    if (typeof structuredClone === "function") {
      try {
        return structuredClone(action);
      } catch {
        // Persisted action objects should be JSON-compatible.
      }
    }
    return JSON.parse(JSON.stringify(action));
  }

  private buildActions(row: any, rowIndex: number, itemId: string): XObjectData[] {
    const actions = Array.isArray(this.__item._actions)
      ? this.__item._actions
      : this.__actions;

    if (!Array.isArray(actions)) return [];

    return actions.map((action, actionIndex) => {
      const cloned = this.resolveTemplates(
        this.cloneAction(action),
        row,
        rowIndex
      ) as XObjectData;

      (cloned as any)._row = row;
      (cloned as any)._row_index = rowIndex;
      (cloned as any)._context = {
        row,
        row_index: rowIndex,
      };

      if (!(cloned as any)._id) {
        (cloned as any)._id = `${itemId}_action_${actionIndex}`;
      }

      return cloned;
    });
  }

  private buildBadge(
    value: any,
    row: any,
    rowIndex: number,
    itemId: string
  ): XObjectData | undefined {
    const resolved = this.resolveTemplates(value, row, rowIndex);
    if (resolved === undefined || resolved === null || resolved === "") return undefined;

    if (typeof resolved === "object") {
      return {
        _type: "badge",
        _id: `${itemId}_badge`,
        ...(resolved as Record<string, any>),
      } as XObjectData;
    }

    const text = this.textValue(resolved);
    if (!text) return undefined;

    return {
      _type: "badge",
      _id: `${itemId}_badge`,
      _text: text,
      _size: "sm",
      _pill: true,
    } as XObjectData;
  }

  private buildImage(
    value: any,
    alt: string,
    itemId: string
  ): XObjectData | XUIObject | undefined {
    const image = normalizeDashboardImageSlot(
      value as XDashboardImageSlotValue,
      {
        parent_id: itemId,
        slot: "_image",
        class: "xkanban__image",
        alt,
      }
    );

    if (!image) return undefined;
    if (!(image as any).class) (image as any).class = "xkanban__image";
    return image;
  }

  private makeMovePayload(
    row: any,
    rowIndex: number,
    sourceGroup: any,
    targetGroup: any
  ): XKanbanMovePayload {
    return {
      record: row,
      source_group: sourceGroup,
      target_group: targetGroup,
      row_index: rowIndex,
      source_column: this.columnFromValue(sourceGroup),
      target_column: this.columnFromValue(targetGroup),
    };
  }

  private emitSelect(row: any, rowIndex: number, group: any) {
    const context = {
      row,
      row_index: rowIndex,
      group,
    };

    if (_xem && typeof (_xem as any).fire === "function") {
      (_xem as any).fire("xkanban:item-select", {
        record: row,
        row_index: rowIndex,
        group,
      });
    }

    if ((this as any)._on_select) {
      this.checkAndRunInternalFunction((this as any)._on_select, row, context);
    }
  }

  private emitCardMoved(payload: XKanbanMovePayload) {
    if (_xem && typeof (_xem as any).fire === "function") {
      (_xem as any).fire("xkanban:card-moved", payload);
    }

    if ((this as any)._on_card_moved) {
      this.checkAndRunInternalFunction((this as any)._on_card_moved, payload);
    }
  }

  private dragStart(row: any, rowIndex: number, sourceGroup: any, event: any) {
    if (!this.__draggable) return;
    this.__drag = { row, rowIndex, sourceGroup };
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", this.rowKey(row, rowIndex));
    }
  }

  private dragEnd() {
    this.__drag = undefined;
  }

  private drop(targetGroup: any) {
    if (!this.__draggable || !this.__drag) return;
    const { row, rowIndex, sourceGroup } = this.__drag;
    this.__drag = undefined;
    if (this.groupKey(sourceGroup) === this.groupKey(targetGroup)) return;
    this.emitCardMoved(this.makeMovePayload(row, rowIndex, sourceGroup, targetGroup));
  }

  private buildItem(row: any, rowIndex: number, group: any): XObjectData {
    const itemId = `${this._id}_item_${this.safeIdSegment(this.rowKey(row, rowIndex))}`;
    const title = this.textValue(
      this.resolveField(this.__item._title, row, rowIndex, ["title", "name", "label"])
    );
    const subtitle = this.textValue(
      this.resolveField(this.__item._subtitle, row, rowIndex, [
        "subtitle",
        "assignee",
        "owner",
        "category",
        "email",
      ])
    );
    const description = this.textValue(
      this.resolveField(this.__item._description, row, rowIndex, [
        "description",
        "summary",
        "notes",
      ])
    );
    const meta = this.textValue(
      this.resolveField(this.__item._meta, row, rowIndex, ["meta", "date", "updated_at"])
    );
    const imageValue = this.resolveField(this.__item._image, row, rowIndex, [
      "image",
      "image_url",
      "thumbnail",
      "avatar",
      "src",
    ]);
    const imageAlt = this.textValue(
      this.resolveField(this.__item._image_alt, row, rowIndex, ["image_alt", "alt"])
    ) || title;
    const badge = this.buildBadge(
      this.resolveField(this.__item._badge, row, rowIndex, ["badge", "status"]),
      row,
      rowIndex,
      itemId
    );
    const actions = this.buildActions(row, rowIndex, itemId);
    const image = this.buildImage(imageValue, imageAlt, itemId);

    const headerChildren: XObjectData[] = [];
    if (title) {
      headerChildren.push({
        _type: "label",
        _id: `${itemId}_title`,
        class: "xkanban__title",
        _text: title,
      });
    }
    if (subtitle) {
      headerChildren.push({
        _type: "label",
        _id: `${itemId}_subtitle`,
        class: "xkanban__subtitle",
        _text: subtitle,
      });
    }

    const bodyChildren: XObjectData[] = [
      {
        _type: "view",
        _id: `${itemId}_header`,
        class: "xkanban__card-header",
        _children: [
          {
            _type: "view",
            _id: `${itemId}_heading`,
            class: "xkanban__heading",
            _children: headerChildren,
          },
          ...(badge ? [badge] : []),
        ],
      },
    ];

    if (description) {
      bodyChildren.push({
        _type: "label",
        _id: `${itemId}_description`,
        class: "xkanban__description",
        _text: description,
      });
    }
    if (meta) {
      bodyChildren.push({
        _type: "label",
        _id: `${itemId}_meta`,
        class: "xkanban__meta",
        _text: meta,
      });
    }
    if (actions.length) {
      bodyChildren.push({
        _type: "view",
        _id: `${itemId}_actions`,
        class: "xkanban__actions",
        _children: actions,
      });
    }

    return {
      _type: "view",
      _id: itemId,
      class: `xkanban__card${image ? "" : " xkanban__card--no-image"}`,
      draggable: this.__draggable ? "true" : undefined,
      _row: row,
      _row_index: rowIndex,
      _context: {
        row,
        row_index: rowIndex,
        group,
      },
      _on: {
        click: () => this.emitSelect(row, rowIndex, group),
        dragstart: (event: any) => this.dragStart(row, rowIndex, group, event),
        dragend: () => this.dragEnd(),
      },
      _children: [
        ...(image ? [image as XObjectData] : []),
        {
          _type: "view",
          _id: `${itemId}_body`,
          class: "xkanban__card-body",
          _children: bodyChildren,
        },
      ],
    };
  }

  private buildBoardEmpty(): XObjectData {
    if (this.__empty) {
      return {
        _id: `${this._id}_empty`,
        ...this.__empty,
      } as XObjectData;
    }

    return {
      _type: "empty",
      _id: `${this._id}_empty`,
      _title: this.__empty_text,
      _size: "md",
      _align: "center",
    };
  }

  private buildColumnEmpty(columnId: string): XObjectData {
    return {
      _type: "empty",
      _id: `${columnId}_empty`,
      class: "xkanban__column-empty",
      _title: this.__empty_column_text,
      _size: "sm",
      _align: "center",
    };
  }

  private buildColumn(column: GroupedKanbanColumn): XObjectData {
    const columnId = `${this._id}_column_${this.safeIdSegment(this.groupKey(column._value))}`;
    const cardChildren = column.rows.length
      ? column.rows.map(({ row, rowIndex, group }) =>
          this.buildItem(row, rowIndex, group)
        )
      : [this.buildColumnEmpty(columnId)];

    return {
      _type: "view",
      _id: columnId,
      class: "xkanban__column",
      _column_value: column._value,
      _on: {
        dragover: (event: any) => {
          if (!this.__draggable) return;
          if (event?.preventDefault) event.preventDefault();
          if (event?.dataTransfer) event.dataTransfer.dropEffect = "move";
        },
        drop: (event: any) => {
          if (event?.preventDefault) event.preventDefault();
          this.drop(column._value);
        },
      },
      _children: [
        {
          _type: "view",
          _id: `${columnId}_header`,
          class: "xkanban__column-header",
          _children: [
            {
              _type: "label",
              _id: `${columnId}_title`,
              class: "xkanban__column-title",
              _text: column._label,
            },
            {
              _type: "badge",
              _id: `${columnId}_count`,
              _text: String(column.rows.length),
              _size: "sm",
              _pill: true,
            },
          ],
        },
        {
          _type: "view",
          _id: `${columnId}_cards`,
          class: "xkanban__cards",
          _children: cardChildren,
        },
      ],
    };
  }

  renderItems() {
    const board = this.getBoard();
    if (!board) return;
    this.clearChildren(board);

    const items = this.resolveItems();
    if (!items.length && !this.__columns?.length) {
      board.append(this.buildBoardEmpty());
      return;
    }

    const groups = this.buildGroups(items);
    groups.forEach((column) => {
      board.append(this.buildColumn(column));
    });
  }

  refresh() {
    this.renderItems();
  }

  set _items(value: KanbanRowsValue) {
    this.__items = value;
    if (this.__ready) this.renderItems();
  }

  get _items() {
    return this.__items;
  }

  set _group_by(value: string | undefined) {
    this.__group_by = this.normalizeDataKey(value) ?? "status";
    if (this.__ready) this.renderItems();
  }

  get _group_by() {
    return this.__group_by;
  }

  set _columns(value: XKanbanColumn[] | undefined) {
    this.__columns = this.normalizeColumns(value);
    if (this.__ready) this.renderItems();
  }

  get _columns() {
    return this.__columns;
  }

  set _item(value: XKanbanItemMap | undefined) {
    this.__item = value && typeof value === "object" ? { ...value } : {};
    if (this.__ready) this.renderItems();
  }

  get _item() {
    return this.__item;
  }

  set _actions(value: XObjectData[] | undefined) {
    this.__actions = Array.isArray(value) ? value : undefined;
    if (this.__ready) this.renderItems();
  }

  get _actions() {
    return this.__actions;
  }

  set _row_key(value: string | undefined) {
    this.__row_key = this.normalizeDataKey(value);
    if (this.__ready) this.renderItems();
  }

  get _row_key() {
    return this.__row_key;
  }

  set _min_col_width(value: number | undefined) {
    this.__min_col_width = this.normalizeNumber(value, 260);
    this.applyLayout();
  }

  get _min_col_width() {
    return this.__min_col_width;
  }

  set _gap(value: number | undefined) {
    this.__gap = this.normalizeNumber(value, 16);
    this.applyLayout();
  }

  get _gap() {
    return this.__gap;
  }

  set _empty_text(value: string | undefined) {
    this.__empty_text = value ? String(value) : "No records";
    if (this.__ready) this.renderItems();
  }

  get _empty_text() {
    return this.__empty_text;
  }

  set _empty_column_text(value: string | undefined) {
    this.__empty_column_text = value ? String(value) : "No records";
    if (this.__ready) this.renderItems();
  }

  get _empty_column_text() {
    return this.__empty_column_text;
  }

  set _empty(value: XObjectData | undefined) {
    this.__empty = value && typeof value === "object" ? value : undefined;
    if (this.__ready) this.renderItems();
  }

  get _empty() {
    return this.__empty;
  }

  set _draggable(value: boolean | undefined) {
    this.__draggable = this.normalizeBoolean(value, true);
    if (this.__ready) this.renderItems();
  }

  get _draggable() {
    return this.__draggable;
  }

  async onData(data: any) {
    if (this.__data_inflight) return;
    this.__data_inflight = true;

    const prevItems = this.__items;
    await super.onData(data);

    const hasHandler = (this as any)._on_data != null;

    if (!hasHandler) {
      this.__items = this.normalizeRows(data);
      this.refresh();
    } else if (this.__items !== prevItems) {
      this.refresh();
    }

    this.__data_inflight = false;
  }
}
