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
  normalizeCollectionNumber,
  normalizeCollectionRows,
  readCollectionXDataValue,
  resolveCollectionField,
  resolveCollectionItems,
  resolveCollectionTemplates,
  safeCollectionIdSegment,
  type XCollectionRowsValue,
} from "./xcollection";
import type { XDashboardDiscoverySkill } from "./xskills";
import { XLIST_SKILL } from "./xlist.skill";

export type XListItemMap = {
  _title?: any;
  _subtitle?: any;
  _description?: any;
  _meta?: any;
  _icon?: any;
  _image?: any;
  _avatar?: any;
  _image_alt?: any;
  _badge?: any;
  _leading?: any;
  _trailing?: any;
  _actions?: XObjectData[];
};

export interface XListData extends XUIObjectData {
  _type: "xlist";
  _items?: XCollectionRowsValue;
  _data_source?: string;
  _item?: XListItemMap;
  _actions?: XObjectData[];
  _row_key?: string;
  _dense?: boolean;
  _selectable?: boolean;
  _selected_key?: string;
  _gap?: number;
  _empty_text?: string;
  _empty?: XObjectData;
  _on_select?: (xobj: XList, record: any, context: Record<string, any>) => void;
  _on_data?: ((xobj: XList, data: any) => void) | string;
  class?: string;
}

type XListSlotValue = XObjectData | XObjectData[] | string | number | boolean;

export class XList extends XUIObject {
  static _xtype = "xlist";
  static _skill: XpellSkill & XDashboardDiscoverySkill = XLIST_SKILL;

  static override getArtifactStrategy() {
    return "generator" as const;
  }

  static generateArtifact(intent: any = {}): XListData {
    const entity =
      typeof intent._entity === "string" && intent._entity.trim()
        ? intent._entity.trim()
        : "records";

    return {
      _type: "xlist",
      ...(intent._id ? { _id: intent._id } : {}),
      _data_source: `${entity}.records`,
      _row_key: "id",
      _dense: false,
      _selectable: true,
      _item: {
        _title: "$row.name",
        _subtitle: "$row.subtitle",
        _description: "$row.description",
        _meta: "$row.updated_at",
        _badge: "$row.status",
      },
      _empty_text: "No records",
    };
  }

  private __items: XCollectionRowsValue;
  private __item: XListItemMap = {};
  private __actions?: XObjectData[];
  private __row_key?: string;
  private __dense = false;
  private __selectable = true;
  private __selected_key?: string;
  private __gap = 0;
  private __empty_text = "No records";
  private __empty?: XObjectData;
  private __ready = false;
  private __data_inflight = false;
  private __item_ids = new Map<string, string>();

  private readonly __list_id: string;

  constructor(data: XListData) {
    const defaults: any = {
      _type: XList._xtype,
      class: "xlist",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__list_id = this._id + "_list";
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
    this.__item =
      (this as any)._item && typeof (this as any)._item === "object"
        ? { ...((this as any)._item as XListItemMap) }
        : {};
    this.__actions = Array.isArray((this as any)._actions)
      ? (this as any)._actions
      : undefined;
    this.__row_key = normalizeCollectionDataKey((this as any)._row_key);
    this.__dense = normalizeCollectionBoolean((this as any)._dense, false);
    this.__selectable = normalizeCollectionBoolean((this as any)._selectable, true);
    this.__selected_key = this.normalizeSelectedKey((this as any)._selected_key);
    this.__gap = normalizeCollectionNumber((this as any)._gap, 0);
    this.__empty_text = (this as any)._empty_text
      ? String((this as any)._empty_text)
      : "No records";
    this.__empty =
      (this as any)._empty && typeof (this as any)._empty === "object"
        ? ((this as any)._empty as XObjectData)
        : undefined;
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
    const remove = new Set(["xlist", "xlist--dense"]);
    const filtered = this.splitClasses(existing).filter((c) => !remove.has(c));
    const tokens = ["xlist", ...filtered];
    if (this.__dense) tokens.push("xlist--dense");
    return Array.from(new Set(tokens)).join(" ");
  }

  private applyLayout() {
    (this as any).class = this.buildClassName();
    const styleParts = [`--xlist-gap:${this.__gap}px`];
    const existingStyle = String((this as any).style || "")
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part && !part.startsWith("--xlist-gap:"));
    (this as any).style = [...existingStyle, ...styleParts].join("; ");
    if (typeof HTMLElement !== "undefined") {
      this.update({ class: (this as any).class, style: (this as any).style } as any);
    }
  }

  private buildSkeleton() {
    this.append({
      _type: "view",
      _id: this.__list_id,
      class: "xlist__items",
      _children: [],
    });
  }

  private getList() {
    return XUI.getObject(this.__list_id) as XUIObject | undefined;
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

  private withClass(value: XObjectData, className: string): XObjectData {
    const existing = typeof (value as any).class === "string" ? (value as any).class : "";
    if (!existing.trim()) return { ...value, class: className };
    const classes = this.splitClasses(existing);
    if (classes.includes(className)) return value;
    return { ...value, class: `${existing} ${className}` };
  }

  private buildSlot(
    value: XListSlotValue | null | undefined,
    row: any,
    rowIndex: number,
    itemId: string,
    slot: string,
    className: string
  ): XObjectData[] {
    const resolved = resolveCollectionTemplates(value, row, rowIndex);
    if (resolved === undefined || resolved === null || resolved === "") return [];

    const values = Array.isArray(resolved) ? resolved : [resolved];
    return values
      .map((slotValue, index) => {
        if (slotValue === undefined || slotValue === null || slotValue === "") return undefined;

        if (typeof slotValue === "string" || typeof slotValue === "number" || typeof slotValue === "boolean") {
          const text = this.textValue(slotValue);
          if (!text) return undefined;
          return {
            _type: "label",
            _id: `${itemId}_${slot}_${index}`,
            class: className,
            _text: text,
          } as XObjectData;
        }

        if (typeof slotValue !== "object") return undefined;

        const next = { ...(slotValue as XObjectData) };
        if (!(next as any)._id) (next as any)._id = `${itemId}_${slot}_${index}`;
        return this.withClass(next, className);
      })
      .filter(Boolean) as XObjectData[];
  }

  private buildVisual(
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
    const avatarValue = this.resolveField(this.__item._avatar, row, rowIndex, [
      "avatar",
      "avatar_url",
    ]);
    const imageAlt =
      this.textValue(
        this.resolveField(this.__item._image_alt, row, rowIndex, [
          "image_alt",
          "alt",
        ])
      ) || title;

    const image = buildCollectionImage(
      imageValue ?? avatarValue,
      imageAlt,
      itemId,
      "xlist__media",
      imageValue ? "_image" : "_avatar"
    );
    if (image) return image;

    const iconValue = this.resolveField(this.__item._icon, row, rowIndex, [
      "icon",
    ]);
    const icon = this.buildSlot(iconValue, row, rowIndex, itemId, "icon", "xlist__icon");
    return icon[0];
  }

  private buildBadge(
    value: any,
    row: any,
    rowIndex: number,
    itemId: string
  ): XObjectData | undefined {
    return buildCollectionBadge(value, row, rowIndex, itemId);
  }

  private buildActions(row: any, rowIndex: number, itemId: string): XObjectData[] {
    return buildCollectionActions(this.__item._actions, this.__actions, row, rowIndex, itemId);
  }

  private itemClickIsFromTrailing(event: any): boolean {
    const target = event?.target;
    if (!target) return false;

    if (typeof target.closest === "function") {
      return Boolean(target.closest(".xlist__trailing, .xlist__actions"));
    }

    let current = target;
    while (current) {
      const className =
        typeof current.getAttribute === "function"
          ? current.getAttribute("class")
          : current.className;
      const classes = this.splitClasses(String(className || ""));
      if (classes.includes("xlist__trailing") || classes.includes("xlist__actions")) {
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
      (token) => token !== "xlist__item--selected"
    );
    if (selected) classes.push("xlist__item--selected");
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

  private selectItem(row: any, rowIndex: number, key: string) {
    if (!this.__selectable) return;
    this.__selected_key = key;
    this.applySelection();

    const context = {
      row,
      row_index: rowIndex,
      key,
    };

    if (_xem && typeof (_xem as any).fire === "function") {
      (_xem as any).fire("xlist:item-select", {
        record: row,
        row_index: rowIndex,
        key,
      });
    }

    if ((this as any)._on_select) {
      this.checkAndRunInternalFunction((this as any)._on_select, row, context);
    }
  }

  private buildItem(row: any, rowIndex: number): XObjectData {
    const key = this.rowKey(row, rowIndex);
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
        "category",
        "email",
        "type",
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
        "created_at",
      ])
    );
    const badge = this.buildBadge(
      this.resolveField(this.__item._badge, row, rowIndex, [
        "badge",
        "status",
      ]),
      row,
      rowIndex,
      itemId
    );
    const visual = this.buildVisual(row, rowIndex, itemId, title);
    const leading = this.buildSlot(
      this.__item._leading,
      row,
      rowIndex,
      itemId,
      "leading",
      "xlist__leading-content"
    );
    const trailing = this.buildSlot(
      this.__item._trailing,
      row,
      rowIndex,
      itemId,
      "trailing",
      "xlist__trailing-content"
    );
    const actions = this.buildActions(row, rowIndex, itemId);

    const headingChildren: XObjectData[] = [];
    if (title) {
      headingChildren.push({
        _type: "label",
        _id: `${itemId}_title`,
        class: "xlist__title",
        _text: title,
      });
    }
    if (subtitle) {
      headingChildren.push({
        _type: "label",
        _id: `${itemId}_subtitle`,
        class: "xlist__subtitle",
        _text: subtitle,
      });
    }

    const contentChildren: XObjectData[] = [
      {
        _type: "view",
        _id: `${itemId}_header`,
        class: "xlist__header",
        _children: [
          {
            _type: "view",
            _id: `${itemId}_heading`,
            class: "xlist__heading",
            _children: headingChildren,
          },
          ...(badge ? [badge] : []),
        ],
      },
    ];

    if (description) {
      contentChildren.push({
        _type: "label",
        _id: `${itemId}_description`,
        class: "xlist__description",
        _text: description,
      });
    }
    if (meta) {
      contentChildren.push({
        _type: "label",
        _id: `${itemId}_meta`,
        class: "xlist__meta",
        _text: meta,
      });
    }

    const trailingChildren: XObjectData[] = [
      ...trailing,
      ...(actions.length
        ? [
            {
              _type: "view",
              _id: `${itemId}_actions`,
              class: "xlist__actions",
              _children: actions,
            } as XObjectData,
          ]
        : []),
    ];

    const selected = key === this.__selected_key;

    return {
      _type: "view",
      _id: itemId,
      class: [
        "xlist__item",
        selected ? "xlist__item--selected" : "",
        this.__selectable ? "xlist__item--selectable" : "",
      ]
        .filter(Boolean)
        .join(" "),
      role: this.__selectable ? "button" : undefined,
      tabindex: this.__selectable ? "0" : undefined,
      "aria-selected": selected ? "true" : "false",
      _row: row,
      _row_index: rowIndex,
      _context: {
        row,
        row_index: rowIndex,
        key,
      },
      _on: this.__selectable
        ? {
            click: (event: any) => {
              if (this.itemClickIsFromTrailing(event)) return;
              this.selectItem(row, rowIndex, key);
            },
            keydown: (event: any) => {
              if (event?.key !== "Enter" && event?.key !== " ") return;
              if (event?.preventDefault) event.preventDefault();
              this.selectItem(row, rowIndex, key);
            },
          }
        : undefined,
      _children: [
        ...(visual || leading.length
          ? [
              {
                _type: "view",
                _id: `${itemId}_leading`,
                class: "xlist__leading",
                _children: [
                  ...(visual ? [visual as XObjectData] : []),
                  ...leading,
                ],
              } as XObjectData,
            ]
          : []),
        {
          _type: "view",
          _id: `${itemId}_content`,
          class: "xlist__content",
          _children: contentChildren,
        },
        ...(trailingChildren.length
          ? [
              {
                _type: "view",
                _id: `${itemId}_trailing`,
                class: "xlist__trailing",
                _children: trailingChildren,
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

  renderItems() {
    const list = this.getList();
    if (!list) return;
    this.clearChildren(list);
    this.__item_ids.clear();

    const items = resolveCollectionItems(this.__items);
    if (!items.length) {
      list.append(this.buildEmpty());
      return;
    }

    items.forEach((row, rowIndex) => {
      list.append(this.buildItem(row, rowIndex));
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

  set _item(value: XListItemMap | undefined) {
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

  set _dense(value: boolean | undefined) {
    this.__dense = normalizeCollectionBoolean(value, false);
    this.applyLayout();
  }

  get _dense() {
    return this.__dense;
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

  set _gap(value: number | undefined) {
    this.__gap = normalizeCollectionNumber(value, 0);
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
      this.__items = normalizeCollectionRows(data);
      this.refresh();
    } else if (this.__items !== prevItems) {
      this.refresh();
    }

    this.__data_inflight = false;
  }
}
