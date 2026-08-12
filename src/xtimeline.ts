import { _xem, XUI, XUIObject } from "@xpell/ui";
import type { XObjectData, XUIObjectData, XpellSkill } from "@xpell/ui";
import {
  buildCollectionActions,
  buildCollectionBadge,
  buildCollectionImage,
  collectionRowKey,
  collectionTextValue,
  normalizeCollectionBoolean,
  normalizeCollectionDataKey,
  normalizeCollectionRows,
  readCollectionRowPath,
  readCollectionXDataValue,
  resolveCollectionField,
  resolveCollectionItems,
  resolveCollectionTemplates,
  safeCollectionIdSegment,
  type XCollectionRowsValue,
} from "./xcollection";
import type { XDashboardDiscoverySkill } from "./xskills";
import { XTIMELINE_SKILL } from "./xtimeline.skill";

export type XTimelineOrder = "asc" | "desc";

export type XTimelineItemMap = {
  _title?: any;
  _subtitle?: any;
  _description?: any;
  _meta?: any;
  _icon?: any;
  _image?: any;
  _image_alt?: any;
  _badge?: any;
  _actions?: XObjectData[];
};

export interface XTimelineData extends XUIObjectData {
  _type: "xtimeline";
  _items?: XCollectionRowsValue;
  _data_source?: string;
  _date_field?: string;
  _order?: XTimelineOrder;
  _item?: XTimelineItemMap;
  _actions?: XObjectData[];
  _row_key?: string;
  _selectable?: boolean;
  _selected_key?: string;
  _empty_text?: string;
  _empty?: XObjectData;
  _undated_text?: string;
  _on_select?: (
    xobj: XTimeline,
    record: any,
    context: Record<string, any>
  ) => void;
  _on_data?: ((xobj: XTimeline, data: any) => void) | string;
  class?: string;
}

type TimelineRow = {
  row: any;
  rowIndex: number;
  key: string;
  dateValue: any;
  dateTime?: number;
  dateText: string;
};

export class XTimeline extends XUIObject {
  static _xtype = "xtimeline";
  static _skill: XpellSkill & XDashboardDiscoverySkill = XTIMELINE_SKILL;

  static override getArtifactStrategy() {
    return "generator" as const;
  }

  static generateArtifact(intent: any = {}): XTimelineData {
    const entity =
      typeof intent._entity === "string" && intent._entity.trim()
        ? intent._entity.trim()
        : "activity";

    return {
      _type: "xtimeline",
      ...(intent._id ? { _id: intent._id } : {}),
      _data_source: `${entity}.records`,
      _date_field: "created_at",
      _order: "desc",
      _row_key: "id",
      _selectable: true,
      _item: {
        _title: "$row.title",
        _subtitle: "$row.type",
        _description: "$row.description",
        _meta: "$row.meta",
        _badge: "$row.status",
      },
      _empty_text: "No records",
    };
  }

  private __items: XCollectionRowsValue;
  private __date_field = "created_at";
  private __order: XTimelineOrder = "desc";
  private __item: XTimelineItemMap = {};
  private __actions?: XObjectData[];
  private __row_key?: string;
  private __selectable = true;
  private __selected_key?: string;
  private __empty_text = "No records";
  private __empty?: XObjectData;
  private __undated_text = "Undated";
  private __ready = false;
  private __data_inflight = false;
  private __item_ids = new Map<string, string>();

  private readonly __timeline_id: string;

  constructor(data: XTimelineData) {
    const defaults: any = {
      _type: XTimeline._xtype,
      class: "xtimeline",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__timeline_id = this._id + "_timeline";
    this.parse(data);
    this.applyPropsFromData();
    this.applyLayout();
    this.buildSkeleton();
    this.__ready = true;
    this.renderItems();
    this.hydrateFromDataSource();
  }

  private applyPropsFromData() {
    this.__items = (this as any)._items;
    this.__date_field = this.normalizeDateField((this as any)._date_field);
    this.__order = this.normalizeOrder((this as any)._order);
    this.__item =
      (this as any)._item && typeof (this as any)._item === "object"
        ? { ...((this as any)._item as XTimelineItemMap) }
        : {};
    this.__actions = Array.isArray((this as any)._actions)
      ? (this as any)._actions
      : undefined;
    this.__row_key = normalizeCollectionDataKey((this as any)._row_key);
    this.__selectable = normalizeCollectionBoolean((this as any)._selectable, true);
    this.__selected_key = this.normalizeSelectedKey((this as any)._selected_key);
    this.__empty_text = (this as any)._empty_text
      ? String((this as any)._empty_text)
      : "No records";
    this.__empty =
      (this as any)._empty && typeof (this as any)._empty === "object"
        ? ((this as any)._empty as XObjectData)
        : undefined;
    this.__undated_text = (this as any)._undated_text
      ? String((this as any)._undated_text)
      : "Undated";
  }

  private normalizeDateField(value: any): string {
    return normalizeCollectionDataKey(value) ?? "created_at";
  }

  private normalizeOrder(value: any): XTimelineOrder {
    return value === "asc" ? "asc" : "desc";
  }

  private normalizeSelectedKey(value: any): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    return String(value);
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private buildClassName(): string {
    const existing = String((this as any).class || "");
    const remove = new Set(["xtimeline"]);
    const filtered = this.splitClasses(existing).filter((c) => !remove.has(c));
    return Array.from(new Set(["xtimeline", ...filtered])).join(" ");
  }

  private applyLayout() {
    (this as any).class = this.buildClassName();
    if (typeof HTMLElement !== "undefined") {
      this.update({ class: (this as any).class } as any);
    }
  }

  private buildSkeleton() {
    this.append({
      _type: "view",
      _id: this.__timeline_id,
      class: "xtimeline__items",
      _children: [],
    });
  }

  private getTimeline() {
    return XUI.getObject(this.__timeline_id) as XUIObject | undefined;
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

    this.__items = normalizeCollectionRows(current.value);
    if (this.__ready) this.refresh();
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

  private readDateValue(row: any, rowIndex: number): any {
    if (this.__date_field === "$row_index") return rowIndex;
    if (this.__date_field === "$row") return row;
    if (this.__date_field.startsWith("$row.")) {
      return readCollectionRowPath(row, this.__date_field.slice("$row.".length));
    }
    return readCollectionRowPath(row, this.__date_field);
  }

  private parseDateTime(value: any): number | undefined {
    if (value instanceof Date) {
      const time = value.getTime();
      return Number.isFinite(time) ? time : undefined;
    }
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === "string" && value.trim()) {
      const time = Date.parse(value);
      return Number.isFinite(time) ? time : undefined;
    }
    return undefined;
  }

  private dateText(value: any): string {
    const text = this.textValue(value);
    return text || this.__undated_text;
  }

  private sortedRows(items: any[]): TimelineRow[] {
    const rows = items.map((row, rowIndex) => {
      const dateValue = this.readDateValue(row, rowIndex);
      return {
        row,
        rowIndex,
        key: this.rowKey(row, rowIndex),
        dateValue,
        dateTime: this.parseDateTime(dateValue),
        dateText: this.dateText(dateValue),
      };
    });

    return rows.sort((a, b) => {
      const aHasDate = a.dateTime !== undefined;
      const bHasDate = b.dateTime !== undefined;
      if (aHasDate && bHasDate && a.dateTime !== b.dateTime) {
        return this.__order === "asc"
          ? (a.dateTime as number) - (b.dateTime as number)
          : (b.dateTime as number) - (a.dateTime as number);
      }
      if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;
      return a.rowIndex - b.rowIndex;
    });
  }

  private buildImageOrIcon(
    row: any,
    rowIndex: number,
    itemId: string,
    title: string
  ): XObjectData | XUIObject | undefined {
    const imageValue = this.resolveField(this.__item._image, row, rowIndex, [
      "image",
      "image_url",
      "thumbnail",
      "src",
    ]);
    const imageAlt =
      this.textValue(
        this.resolveField(this.__item._image_alt, row, rowIndex, [
          "image_alt",
          "alt",
        ])
      ) || title;

    const image = buildCollectionImage(
      imageValue,
      imageAlt,
      itemId,
      "xtimeline__media"
    );
    if (image) return image;

    const icon = this.textValue(
      this.resolveField(this.__item._icon, row, rowIndex, ["icon"])
    );
    if (!icon) return undefined;

    return {
      _type: "label",
      _id: `${itemId}_icon`,
      class: "xtimeline__icon",
      _text: icon,
    };
  }

  private buildActions(row: any, rowIndex: number, itemId: string): XObjectData[] {
    return buildCollectionActions(this.__item._actions, this.__actions, row, rowIndex, itemId);
  }

  private itemClickIsFromActions(event: any): boolean {
    const target = event?.target;
    if (!target) return false;

    if (typeof target.closest === "function") {
      return Boolean(target.closest(".xtimeline__actions"));
    }

    let current = target;
    while (current) {
      const className =
        typeof current.getAttribute === "function"
          ? current.getAttribute("class")
          : current.className;
      if (this.splitClasses(String(className || "")).includes("xtimeline__actions")) {
        return true;
      }
      current = current.parentElement;
    }

    return false;
  }

  private setObjectSelected(itemId: string, selected: boolean) {
    const item = XUI.getObject(itemId) as XUIObject | undefined;
    if (!item) return;

    const classes = this.splitClasses(String((item as any).class || "")).filter(
      (token) => token !== "xtimeline__item--selected"
    );
    if (selected) classes.push("xtimeline__item--selected");
    (item as any).class = Array.from(new Set(classes)).join(" ");

    if (item.dom instanceof HTMLElement) {
      item.dom.className = (item as any).class;
      item.dom.setAttribute("aria-selected", selected ? "true" : "false");
    }
  }

  private applySelection() {
    this.__item_ids.forEach((itemId, key) => {
      this.setObjectSelected(itemId, key === this.__selected_key);
    });
  }

  private selectItem(row: any, rowIndex: number, key: string, dateValue: any) {
    if (!this.__selectable) return;
    this.__selected_key = key;
    this.applySelection();

    const context = {
      row,
      row_index: rowIndex,
      key,
      date_field: this.__date_field,
      date: dateValue,
    };

    if (_xem && typeof (_xem as any).fire === "function") {
      (_xem as any).fire("xtimeline:item-select", {
        record: row,
        row_index: rowIndex,
        key,
        date_field: this.__date_field,
        date: dateValue,
      });
    }

    if ((this as any)._on_select) {
      this.checkAndRunInternalFunction((this as any)._on_select, row, context);
    }
  }

  private buildItem(item: TimelineRow): XObjectData {
    const { row, rowIndex, key, dateValue, dateText } = item;
    const itemId = `${this._id}_item_${this.safeIdSegment(key)}`;
    this.__item_ids.set(key, itemId);

    const title = this.textValue(
      this.resolveField(this.__item._title, row, rowIndex, [
        "title",
        "name",
        "label",
      ])
    );
    const subtitle = this.textValue(
      this.resolveField(this.__item._subtitle, row, rowIndex, [
        "subtitle",
        "type",
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
      this.resolveField(this.__item._meta, row, rowIndex, [
        "meta",
        "date",
        "updated_at",
      ])
    );
    const badge = buildCollectionBadge(
      this.resolveField(this.__item._badge, row, rowIndex, [
        "badge",
        "status",
      ]),
      row,
      rowIndex,
      itemId
    );
    const visual = this.buildImageOrIcon(row, rowIndex, itemId, title);
    const actions = this.buildActions(row, rowIndex, itemId);
    const selected = key === this.__selected_key;

    const headingChildren: XObjectData[] = [];
    if (title) {
      headingChildren.push({
        _type: "label",
        _id: `${itemId}_title`,
        class: "xtimeline__title",
        _text: title,
      });
    }
    if (subtitle) {
      headingChildren.push({
        _type: "label",
        _id: `${itemId}_subtitle`,
        class: "xtimeline__subtitle",
        _text: subtitle,
      });
    }

    const bodyChildren: XObjectData[] = [
      {
        _type: "view",
        _id: `${itemId}_header`,
        class: "xtimeline__header",
        _children: [
          {
            _type: "view",
            _id: `${itemId}_heading`,
            class: "xtimeline__heading",
            _children: headingChildren,
          },
          ...(badge ? [badge] : []),
        ],
      },
    ];

    if (description) {
      bodyChildren.push({
        _type: "label",
        _id: `${itemId}_description`,
        class: "xtimeline__description",
        _text: description,
      });
    }
    if (meta) {
      bodyChildren.push({
        _type: "label",
        _id: `${itemId}_meta`,
        class: "xtimeline__meta",
        _text: meta,
      });
    }
    if (actions.length) {
      bodyChildren.push({
        _type: "view",
        _id: `${itemId}_actions`,
        class: "xtimeline__actions",
        _children: actions,
      });
    }

    return {
      _type: "view",
      _id: itemId,
      class: [
        "xtimeline__item",
        selected ? "xtimeline__item--selected" : "",
        this.__selectable ? "xtimeline__item--selectable" : "",
      ]
        .filter(Boolean)
        .join(" "),
      role: this.__selectable ? "button" : undefined,
      tabindex: this.__selectable ? "0" : undefined,
      "aria-selected": selected ? "true" : "false",
      _row: row,
      _row_index: rowIndex,
      _date: dateValue,
      _context: {
        row,
        row_index: rowIndex,
        key,
        date_field: this.__date_field,
        date: dateValue,
      },
      _on: this.__selectable
        ? {
            click: (event: any) => {
              if (this.itemClickIsFromActions(event)) return;
              this.selectItem(row, rowIndex, key, dateValue);
            },
            keydown: (event: any) => {
              if (event?.key !== "Enter" && event?.key !== " ") return;
              if (event?.preventDefault) event.preventDefault();
              this.selectItem(row, rowIndex, key, dateValue);
            },
          }
        : undefined,
      _children: [
        {
          _type: "view",
          _id: `${itemId}_axis`,
          class: "xtimeline__axis",
          _children: [
            {
              _type: "label",
              _id: `${itemId}_date`,
              class: "xtimeline__date",
              _text: dateText,
            },
            {
              _type: "view",
              _id: `${itemId}_dot`,
              class: "xtimeline__dot",
            },
          ],
        },
        {
          _type: "view",
          _id: `${itemId}_card`,
          class: "xtimeline__card",
          _children: [
            ...(visual
              ? [
                  {
                    _type: "view",
                    _id: `${itemId}_visual`,
                    class: "xtimeline__visual",
                    _children: [visual as XObjectData],
                  } as XObjectData,
                ]
              : []),
            {
              _type: "view",
              _id: `${itemId}_body`,
              class: "xtimeline__body",
              _children: bodyChildren,
            },
          ],
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
    const timeline = this.getTimeline();
    if (!timeline) return;
    this.clearChildren(timeline);
    this.__item_ids.clear();

    const items = resolveCollectionItems(this.__items);
    if (!items.length) {
      timeline.append(this.buildEmpty());
      return;
    }

    this.sortedRows(items).forEach((item) => {
      timeline.append(this.buildItem(item));
    });
    this.applySelection();
  }

  refresh() {
    this.renderItems();
  }

  set _items(value: XCollectionRowsValue) {
    this.__items = value;
    if (this.__ready) this.renderItems();
  }

  get _items() {
    return this.__items;
  }

  set _date_field(value: string | undefined) {
    this.__date_field = this.normalizeDateField(value);
    if (this.__ready) this.renderItems();
  }

  get _date_field() {
    return this.__date_field;
  }

  set _order(value: XTimelineOrder | undefined) {
    this.__order = this.normalizeOrder(value);
    if (this.__ready) this.renderItems();
  }

  get _order() {
    return this.__order;
  }

  set _item(value: XTimelineItemMap | undefined) {
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
    this.__row_key = normalizeCollectionDataKey(value);
    if (this.__ready) this.renderItems();
  }

  get _row_key() {
    return this.__row_key;
  }

  set _selectable(value: boolean | undefined) {
    this.__selectable = normalizeCollectionBoolean(value, true);
    if (this.__ready) this.renderItems();
  }

  get _selectable() {
    return this.__selectable;
  }

  set _selected_key(value: string | undefined) {
    this.__selected_key = this.normalizeSelectedKey(value);
    this.applySelection();
  }

  get _selected_key() {
    return this.__selected_key;
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

  set _undated_text(value: string | undefined) {
    this.__undated_text = value ? String(value) : "Undated";
    if (this.__ready) this.renderItems();
  }

  get _undated_text() {
    return this.__undated_text;
  }

  async onData(data: any) {
    if (this.__data_inflight) return;
    this.__data_inflight = true;

    const prevItems = this.__items;
    await super.onData(data);

    const hasHandler = (this as any)._on_data != null;

    if (!hasHandler) {
      this.__items = normalizeCollectionRows(data);
      this.refresh();
    } else if (this.__items !== prevItems) {
      this.refresh();
    }

    this.__data_inflight = false;
  }
}
