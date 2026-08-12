import { XUI, XUIObject } from "@xpell/ui";
import type { XObjectData, XUIObjectData, XpellSkill } from "@xpell/ui";
import {
  buildCollectionActions,
  buildCollectionBadge,
  buildCollectionImage,
  cloneCollectionAction,
  collectionRowKey,
  collectionTextValue,
  firstCollectionRowValue,
  normalizeCollectionDataKey,
  normalizeCollectionNumber,
  normalizeCollectionRows,
  readCollectionRowPath,
  readCollectionXDataValue,
  resolveCollectionField,
  resolveCollectionItems,
  resolveCollectionTemplateValue,
  resolveCollectionTemplates,
  safeCollectionIdSegment,
} from "./xcollection";
import type { XDashboardDiscoverySkill } from "./xskills";
import { XGALLERY_SKILL } from "./xgallery.skill";

export type XGalleryItemMap = {
  _title?: any;
  _subtitle?: any;
  _image?: any;
  _image_alt?: any;
  _description?: any;
  _meta?: any;
  _badge?: any;
  _actions?: XObjectData[];
};

export interface XGalleryData extends XUIObjectData {
  _type: "xgallery";
  _items?: any[] | string;
  _data_source?: string;
  _item?: XGalleryItemMap;
  _actions?: XObjectData[];
  _row_key?: string;
  _columns?: number;
  _min_col_width?: number;
  _gap?: number;
  _empty_text?: string;
  _empty?: XObjectData;
  _on_data?: ((xobj: XGallery, data: any) => void) | string;
  class?: string;
}

type GalleryRowsValue = any[] | string | undefined;

export class XGallery extends XUIObject {
  static _xtype = "xgallery";
  static _skill: XpellSkill & XDashboardDiscoverySkill = XGALLERY_SKILL;

  static override getArtifactStrategy() {
    return "generator" as const;
  }

  static generateArtifact(intent: any = {}): XGalleryData {
    const entity =
      typeof intent._entity === "string" && intent._entity.trim()
        ? intent._entity.trim()
        : "records";

    return {
      _type: "xgallery",
      ...(intent._id ? { _id: intent._id } : {}),
      _data_source: `${entity}.records`,
      _columns: 3,
      _min_col_width: 220,
      _gap: 16,
      _row_key: "id",
      _item: {
        _title: "$row.name",
        _subtitle: "$row.subtitle",
        _image: "$row.image",
        _description: "$row.description",
        _badge: "$row.status",
      },
      _empty_text: "No records",
    };
  }

  private __items: GalleryRowsValue;
  private __item: XGalleryItemMap = {};
  private __actions?: XObjectData[];
  private __row_key?: string;
  private __columns = 3;
  private __min_col_width = 220;
  private __gap = 16;
  private __empty_text = "No records";
  private __empty?: XObjectData;
  private __ready = false;
  private __data_inflight = false;

  private readonly __grid_id: string;

  constructor(data: XGalleryData) {
    const defaults: any = {
      _type: XGallery._xtype,
      class: "xgallery",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__grid_id = this._id + "_grid";
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
    return normalizeCollectionNumber(value, fallback);
  }

  private normalizeDataKey(value: any): string | undefined {
    return normalizeCollectionDataKey(value);
  }

  private applyPropsFromData() {
    this.__items = (this as any)._items;
    this.__item =
      (this as any)._item && typeof (this as any)._item === "object"
        ? { ...((this as any)._item as XGalleryItemMap) }
        : {};
    this.__actions = Array.isArray((this as any)._actions)
      ? (this as any)._actions
      : undefined;
    this.__row_key = this.normalizeDataKey((this as any)._row_key);
    this.__columns = this.normalizeNumber((this as any)._columns, 3);
    this.__min_col_width = this.normalizeNumber(
      (this as any)._min_col_width,
      220
    );
    this.__gap = this.normalizeNumber((this as any)._gap, 16);
    this.__empty_text = (this as any)._empty_text
      ? String((this as any)._empty_text)
      : "No records";
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
    const filtered = this.splitClasses(existing).filter((c) => c !== "xgallery");
    return Array.from(new Set(["xgallery", ...filtered])).join(" ");
  }

  private applyLayout() {
    (this as any).class = this.buildClassName();
    const styleParts = [
      `--xgallery-cols:${this.__columns}`,
      `--xgallery-min-col:${this.__min_col_width}px`,
      `--xgallery-gap:${this.__gap}px`,
    ];
    const existingStyle = String((this as any).style || "")
      .split(";")
      .map((part) => part.trim())
      .filter(
        (part) =>
          part &&
          !part.startsWith("--xgallery-cols:") &&
          !part.startsWith("--xgallery-min-col:") &&
          !part.startsWith("--xgallery-gap:")
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
      class: "xgallery__grid",
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

  private readXDataValue(key?: string): { hasValue: boolean; value: any } {
    return readCollectionXDataValue(key);
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
    return normalizeCollectionRows(value);
  }

  private resolveItems(): any[] {
    return resolveCollectionItems(this.__items);
  }

  private readRowPath(row: any, path: string): any {
    return readCollectionRowPath(row, path);
  }

  private firstRowValue(row: any, paths: string[]): any {
    return firstCollectionRowValue(row, paths);
  }

  private resolveTemplateValue(value: string, row: any, rowIndex: number): any {
    return resolveCollectionTemplateValue(value, row, rowIndex);
  }

  private resolveTemplates(value: any, row: any, rowIndex: number): any {
    return resolveCollectionTemplates(value, row, rowIndex);
  }

  private resolveField(
    fieldValue: any,
    row: any,
    rowIndex: number,
    fallbackPaths: string[]
  ): any {
    return resolveCollectionField(fieldValue, row, rowIndex, fallbackPaths);
  }

  private textValue(value: any): string {
    return collectionTextValue(value);
  }

  private rowKey(row: any, rowIndex: number): string {
    return collectionRowKey(row, rowIndex, this.__row_key);
  }

  private safeIdSegment(value: string): string {
    return safeCollectionIdSegment(value);
  }

  private cloneAction(action: XObjectData): XObjectData {
    return cloneCollectionAction(action);
  }

  private buildActions(row: any, rowIndex: number, itemId: string): XObjectData[] {
    return buildCollectionActions(this.__item._actions, this.__actions, row, rowIndex, itemId);
  }

  private buildBadge(
    value: any,
    row: any,
    rowIndex: number,
    itemId: string
  ): XObjectData | undefined {
    return buildCollectionBadge(value, row, rowIndex, itemId);
  }

  private buildImage(
    value: any,
    alt: string,
    itemId: string
  ): XObjectData | XUIObject | undefined {
    return buildCollectionImage(value, alt, itemId, "xgallery__image");
  }

  private buildItem(row: any, rowIndex: number): XObjectData {
    const itemId = `${this._id}_item_${this.safeIdSegment(this.rowKey(row, rowIndex))}`;
    const title = this.textValue(
      this.resolveField(this.__item._title, row, rowIndex, ["title", "name", "label"])
    );
    const subtitle = this.textValue(
      this.resolveField(this.__item._subtitle, row, rowIndex, [
        "subtitle",
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
        class: "xgallery__title",
        _text: title,
      });
    }
    if (subtitle) {
      headerChildren.push({
        _type: "label",
        _id: `${itemId}_subtitle`,
        class: "xgallery__subtitle",
        _text: subtitle,
      });
    }

    const bodyChildren: XObjectData[] = [
      {
        _type: "view",
        _id: `${itemId}_header`,
        class: "xgallery__header",
        _children: [
          {
            _type: "view",
            _id: `${itemId}_heading`,
            class: "xgallery__heading",
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
        class: "xgallery__description",
        _text: description,
      });
    }
    if (meta) {
      bodyChildren.push({
        _type: "label",
        _id: `${itemId}_meta`,
        class: "xgallery__meta",
        _text: meta,
      });
    }
    if (actions.length) {
      bodyChildren.push({
        _type: "view",
        _id: `${itemId}_actions`,
        class: "xgallery__actions",
        _children: actions,
      });
    }

    return {
      _type: "view",
      _id: itemId,
      class: `xgallery__card${image ? "" : " xgallery__card--no-image"}`,
      _children: [
        ...(image ? [image as XObjectData] : []),
        {
          _type: "view",
          _id: `${itemId}_body`,
          class: "xgallery__body",
          _children: bodyChildren,
        },
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

  renderItems() {
    const grid = this.getGrid();
    if (!grid) return;
    this.clearChildren(grid);

    const items = this.resolveItems();
    if (!items.length) {
      grid.append(this.buildEmpty());
      return;
    }

    items.forEach((row, rowIndex) => {
      grid.append(this.buildItem(row, rowIndex));
    });
  }

  refresh() {
    this.renderItems();
  }

  set _items(value: GalleryRowsValue) {
    this.__items = value;
    if (this.__ready) this.renderItems();
  }

  get _items() {
    return this.__items;
  }

  set _item(value: XGalleryItemMap | undefined) {
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

  set _columns(value: number | undefined) {
    this.__columns = this.normalizeNumber(value, 3);
    this.applyLayout();
  }

  get _columns() {
    return this.__columns;
  }

  set _min_col_width(value: number | undefined) {
    this.__min_col_width = this.normalizeNumber(value, 220);
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

  set _empty(value: XObjectData | undefined) {
    this.__empty = value && typeof value === "object" ? value : undefined;
    if (this.__ready) this.renderItems();
  }

  get _empty() {
    return this.__empty;
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
