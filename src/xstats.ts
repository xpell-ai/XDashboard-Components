import { XUI, XUIObject } from "@xpell/ui";
import type { XObjectData, XUIObjectData, XpellSkill } from "@xpell/ui";
import {
  collectionTextValue,
  normalizeCollectionDataKey,
  normalizeCollectionNumber,
  normalizeCollectionRows,
  readCollectionRowPath,
  readCollectionXDataValue,
  resolveCollectionItems,
  resolveCollectionTemplateValue,
  safeCollectionIdSegment,
  type XCollectionRowsValue,
} from "./xcollection";
import { XSTATS_SKILL } from "./xstats.skill";
import type { XDashboardDiscoverySkill } from "./xskills";

export type XStatsAggregate = "count" | "sum" | "average" | "min" | "max";
export type XStatsFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "truthy"
  | "falsy";

export type XStatsFilter = {
  _field?: string;
  _operator?: XStatsFilterOperator;
  _value?: any;
};

export type XStatsItem = {
  _id?: string;
  _title?: string;
  _aggregate?: XStatsAggregate;
  _field?: string;
  _filter?: XStatsFilter | XStatsFilter[];
  _subtitle?: any;
  _icon?: any;
  _badge?: any;
  _trend?: any;
  _meta?: any;
};

export interface XStatsData extends XUIObjectData {
  _type: "xstats";
  _data_source?: string;
  _records?: XCollectionRowsValue;
  _items?: XStatsItem[];
  _min_col_width?: number;
  _gap?: number;
  _empty_text?: string;
  _empty?: XObjectData;
  _on_data?: ((xobj: XStats, data: any) => void) | string;
  class?: string;
}

type ComputedMetric = {
  item: XStatsItem;
  index: number;
  key: string;
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  badge: any;
  trend: string;
  meta: string;
};

export class XStats extends XUIObject {
  static _xtype = "xstats";
  static _skill: XpellSkill & XDashboardDiscoverySkill = XSTATS_SKILL;

  static override getArtifactStrategy() {
    return "generator" as const;
  }

  static generateArtifact(intent: any = {}): XStatsData {
    const entity =
      typeof intent._entity === "string" && intent._entity.trim()
        ? intent._entity.trim()
        : "records";

    return {
      _type: "xstats",
      ...(intent._id ? { _id: intent._id } : {}),
      _data_source: `${entity}.records`,
      _items: [
        {
          _id: "total",
          _title: "Total",
          _aggregate: "count",
        },
      ],
      _min_col_width: 180,
      _gap: 12,
      _empty_text: "No metrics",
    };
  }

  private __records: XCollectionRowsValue;
  private __items: XStatsItem[] = [];
  private __min_col_width = 180;
  private __gap = 12;
  private __empty_text = "No metrics";
  private __empty?: XObjectData;
  private __ready = false;
  private __data_inflight = false;

  private readonly __grid_id: string;

  constructor(data: XStatsData) {
    const defaults: any = {
      _type: XStats._xtype,
      class: "xstats",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__grid_id = this._id + "_grid";
    this.parse(data);
    this.applyPropsFromData();
    this.applyLayout();
    this.buildSkeleton();
    this.__ready = true;
    this.renderStats();
    this.hydrateFromDataSource();
  }

  private applyPropsFromData() {
    this.__records = (this as any)._records;
    this.__items = Array.isArray((this as any)._items)
      ? ([...((this as any)._items as XStatsItem[])] as XStatsItem[])
      : [];
    this.__min_col_width = normalizeCollectionNumber(
      (this as any)._min_col_width,
      180
    );
    this.__gap = normalizeCollectionNumber((this as any)._gap, 12);
    this.__empty_text = (this as any)._empty_text
      ? String((this as any)._empty_text)
      : "No metrics";
    this.__empty =
      (this as any)._empty && typeof (this as any)._empty === "object"
        ? ((this as any)._empty as XObjectData)
        : undefined;
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private buildClassName(): string {
    const existing = String((this as any).class || "");
    const filtered = this.splitClasses(existing).filter((c) => c !== "xstats");
    return Array.from(new Set(["xstats", ...filtered])).join(" ");
  }

  private applyLayout() {
    (this as any).class = this.buildClassName();
    const styleParts = [
      `--xstats-min-col:${this.__min_col_width}px`,
      `--xstats-gap:${this.__gap}px`,
    ];
    const existingStyle = String((this as any).style || "")
      .split(";")
      .map((part) => part.trim())
      .filter(
        (part) =>
          part &&
          !part.startsWith("--xstats-min-col:") &&
          !part.startsWith("--xstats-gap:")
      );
    (this as any).style = [...existingStyle, ...styleParts].join("; ");

    if (typeof HTMLElement !== "undefined") {
      this.update({ class: (this as any).class, style: (this as any).style } as any);
    }
  }

  private buildSkeleton() {
    this.append({
      _type: "view",
      _id: this.__grid_id,
      class: "xstats__grid",
      _children: [],
    });
  }

  private getGrid() {
    return XUI.getObject(this.__grid_id) as XUIObject | undefined;
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

  private hydrateFromDataSource() {
    const dataSource = normalizeCollectionDataKey((this as any)._data_source);
    if (!dataSource) return;

    const current = readCollectionXDataValue(dataSource);
    if (!current.hasValue) return;

    this.__records = normalizeCollectionRows(current.value);
    if (this.__ready) this.refresh();
  }

  private readRows(): any[] {
    if (this.__records !== undefined) return resolveCollectionItems(this.__records);

    const dataSource = normalizeCollectionDataKey((this as any)._data_source);
    if (dataSource) {
      const current = readCollectionXDataValue(dataSource);
      if (current.hasValue) return normalizeCollectionRows(current.value);
    }
    return resolveCollectionItems(this.__records);
  }

  private readField(row: any, field?: string): any {
    const key = normalizeCollectionDataKey(field);
    if (!key) return undefined;
    if (key === "$row") return row;
    if (key.startsWith("$row.")) return readCollectionRowPath(row, key.slice(5));
    return readCollectionRowPath(row, key);
  }

  private resolveFilterValue(value: any, row: any, rowIndex: number): any {
    if (typeof value === "string") {
      return resolveCollectionTemplateValue(value, row, rowIndex);
    }
    return value;
  }

  private compareValues(actual: any, expected: any, operator: XStatsFilterOperator) {
    if (operator === "truthy") return Boolean(actual);
    if (operator === "falsy") return !actual;

    if (operator === "contains") {
      if (Array.isArray(actual)) return actual.includes(expected);
      return String(actual ?? "").includes(String(expected ?? ""));
    }

    if (operator === "gt" || operator === "gte" || operator === "lt" || operator === "lte") {
      const left = Number(actual);
      const right = Number(expected);
      if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
      if (operator === "gt") return left > right;
      if (operator === "gte") return left >= right;
      if (operator === "lt") return left < right;
      return left <= right;
    }

    const same = actual === expected || String(actual ?? "") === String(expected ?? "");
    return operator === "neq" ? !same : same;
  }

  private matchesFilter(row: any, rowIndex: number, filter?: XStatsFilter | XStatsFilter[]) {
    if (!filter) return true;
    const filters = Array.isArray(filter) ? filter : [filter];

    return filters.every((condition) => {
      if (!condition || typeof condition !== "object") return true;
      const operator = condition._operator ?? "eq";
      const actual = this.readField(row, condition._field);
      const expected = this.resolveFilterValue(condition._value, row, rowIndex);
      return this.compareValues(actual, expected, operator);
    });
  }

  private numericValues(rows: any[], item: XStatsItem): number[] {
    return rows
      .map((row) => Number(this.readField(row, item._field)))
      .filter((value) => Number.isFinite(value));
  }

  private aggregate(rows: any[], item: XStatsItem): number {
    const aggregate = item._aggregate ?? "count";
    if (aggregate === "count") return rows.length;

    const values = this.numericValues(rows, item);
    if (!values.length) return 0;

    if (aggregate === "sum") {
      return values.reduce((sum, value) => sum + value, 0);
    }

    if (aggregate === "average") {
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    if (aggregate === "min") return Math.min(...values);
    if (aggregate === "max") return Math.max(...values);
    return rows.length;
  }

  private formatNumber(value: number): string {
    if (!Number.isFinite(value)) return "0";
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toFixed(2)));
  }

  private resolveMetricText(value: any, computedValue: string): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") {
      if (value === "$value") return computedValue;
      return value;
    }
    return collectionTextValue(value);
  }

  private metricKey(item: XStatsItem, index: number): string {
    if (item._id !== undefined && item._id !== null && String(item._id).trim()) {
      return String(item._id);
    }
    if (item._title) return String(item._title);
    return String(index);
  }

  private computeMetrics(): ComputedMetric[] {
    const rows = this.readRows();

    return this.__items.map((item, index) => {
      const key = this.metricKey(item, index);
      const filtered = rows.filter((row, rowIndex) =>
        this.matchesFilter(row, rowIndex, item._filter)
      );
      const value = this.formatNumber(this.aggregate(filtered, item));
      const title =
        collectionTextValue(item._title) ||
        key ||
        collectionTextValue(item._aggregate) ||
        "Metric";

      return {
        item,
        index,
        key,
        title,
        value,
        subtitle: this.resolveMetricText(item._subtitle, value),
        icon: this.resolveMetricText(item._icon, value),
        badge: item._badge,
        trend: this.resolveMetricText(item._trend, value),
        meta: this.resolveMetricText(item._meta, value),
      };
    });
  }

  private buildBadge(metric: ComputedMetric, itemId: string): XObjectData | undefined {
    const badge = metric.badge;
    if (badge === undefined || badge === null || badge === "") return undefined;
    if (typeof badge === "object") {
      return {
        _type: "badge",
        _id: `${itemId}_badge`,
        ...(badge as Record<string, any>),
      };
    }

    const text = this.resolveMetricText(badge, metric.value);
    if (!text) return undefined;
    return {
      _type: "badge",
      _id: `${itemId}_badge`,
      _text: text,
      _size: "sm",
      _pill: true,
    };
  }

  private buildMetric(metric: ComputedMetric): XObjectData {
    const itemId = `${this._id}_item_${safeCollectionIdSegment(metric.key)}`;
    const badge = this.buildBadge(metric, itemId);

    const headerChildren: XObjectData[] = [
      ...(metric.icon
        ? [
            {
              _type: "label",
              _id: `${itemId}_icon`,
              class: "xstats__icon",
              _text: metric.icon,
            } as XObjectData,
          ]
        : []),
      {
        _type: "label",
        _id: `${itemId}_title`,
        class: "xstats__title",
        _text: metric.title,
      },
      ...(badge ? [badge] : []),
    ];

    return {
      _type: "view",
      _id: itemId,
      class: "xstats__card",
      _metric: metric.item,
      _metric_index: metric.index,
      _aggregate: metric.item._aggregate ?? "count",
      _value: metric.value,
      _children: [
        {
          _type: "view",
          _id: `${itemId}_header`,
          class: "xstats__header",
          _children: headerChildren,
        },
        {
          _type: "label",
          _id: `${itemId}_value`,
          class: "xstats__value",
          _text: metric.value,
        },
        ...(metric.subtitle
          ? [
              {
                _type: "label",
                _id: `${itemId}_subtitle`,
                class: "xstats__subtitle",
                _text: metric.subtitle,
              } as XObjectData,
            ]
          : []),
        ...(metric.trend
          ? [
              {
                _type: "label",
                _id: `${itemId}_trend`,
                class: "xstats__trend",
                _text: metric.trend,
              } as XObjectData,
            ]
          : []),
        ...(metric.meta
          ? [
              {
                _type: "label",
                _id: `${itemId}_meta`,
                class: "xstats__meta",
                _text: metric.meta,
              } as XObjectData,
            ]
          : []),
      ],
    };
  }

  private buildEmpty(): XObjectData {
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

  renderStats() {
    const grid = this.getGrid();
    if (!grid) return;
    this.clearChildren(grid);

    if (!this.__items.length) {
      grid.append(this.buildEmpty());
      return;
    }

    this.computeMetrics().forEach((metric) => {
      grid.append(this.buildMetric(metric));
    });
  }

  refresh() {
    this.renderStats();
  }

  set _records(value: XCollectionRowsValue) {
    this.__records = value;
    if (this.__ready) this.renderStats();
  }

  get _records() {
    return this.__records;
  }

  set _items(value: XStatsItem[] | undefined) {
    this.__items = Array.isArray(value) ? [...value] : [];
    if (this.__ready) this.renderStats();
  }

  get _items() {
    return this.__items;
  }

  set _min_col_width(value: number | undefined) {
    this.__min_col_width = normalizeCollectionNumber(value, 180);
    this.applyLayout();
  }

  get _min_col_width() {
    return this.__min_col_width;
  }

  set _gap(value: number | undefined) {
    this.__gap = normalizeCollectionNumber(value, 12);
    this.applyLayout();
  }

  get _gap() {
    return this.__gap;
  }

  set _empty_text(value: string | undefined) {
    this.__empty_text = value ? String(value) : "No metrics";
    if (this.__ready) this.renderStats();
  }

  get _empty_text() {
    return this.__empty_text;
  }

  set _empty(value: XObjectData | undefined) {
    this.__empty = value && typeof value === "object" ? value : undefined;
    if (this.__ready) this.renderStats();
  }

  get _empty() {
    return this.__empty;
  }

  async onData(data: any) {
    if (this.__data_inflight) return;
    this.__data_inflight = true;

    const prevRecords = this.__records;
    await super.onData(data);

    const hasHandler = (this as any)._on_data != null;

    if (!hasHandler) {
      this.__records = normalizeCollectionRows(data);
      this.refresh();
    } else if (this.__records !== prevRecords) {
      this.refresh();
    }

    this.__data_inflight = false;
  }
}
