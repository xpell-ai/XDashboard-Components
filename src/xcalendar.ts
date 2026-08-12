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
  safeCollectionIdSegment,
  type XCollectionRowsValue,
} from "./xcollection";
import { XCALENDAR_SKILL } from "./xcalendar.skill";
import type { XDashboardDiscoverySkill } from "./xskills";

export type XCalendarWeekStart = "sun" | "mon";

export type XCalendarItemMap = {
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

export interface XCalendarData extends XUIObjectData {
  _type: "xcalendar";
  _items?: XCollectionRowsValue;
  _data_source?: string;
  _date_field?: string;
  _end_date_field?: string;
  _view?: "month";
  _month?: string;
  _week_start?: XCalendarWeekStart;
  _item?: XCalendarItemMap;
  _actions?: XObjectData[];
  _row_key?: string;
  _selectable?: boolean;
  _selected_key?: string;
  _empty_text?: string;
  _empty?: XObjectData;
  _on_select?: (
    xobj: XCalendar,
    record: any,
    context: Record<string, any>
  ) => void;
  _on_data?: ((xobj: XCalendar, data: any) => void) | string;
  class?: string;
}

type CalendarRecord = {
  row: any;
  rowIndex: number;
  key: string;
  startValue: any;
  endValue: any;
  startDate?: Date;
  endDate?: Date;
};

type CalendarDay = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  records: CalendarRecord[];
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export class XCalendar extends XUIObject {
  static _xtype = "xcalendar";
  static _skill: XpellSkill & XDashboardDiscoverySkill = XCALENDAR_SKILL;

  static override getArtifactStrategy() {
    return "generator" as const;
  }

  static generateArtifact(intent: any = {}): XCalendarData {
    const entity =
      typeof intent._entity === "string" && intent._entity.trim()
        ? intent._entity.trim()
        : "event";

    return {
      _type: "xcalendar",
      ...(intent._id ? { _id: intent._id } : {}),
      _data_source: `${entity}.records`,
      _date_field: "start_at",
      _end_date_field: "end_at",
      _view: "month",
      _row_key: "id",
      _selectable: true,
      _item: {
        _title: "$row.title",
        _subtitle: "$row.location",
        _description: "$row.description",
        _meta: "$row.meta",
        _badge: "$row.status",
      },
      _empty_text: "No records",
    };
  }

  private __items: XCollectionRowsValue;
  private __date_field = "start_at";
  private __end_date_field?: string;
  private __view: "month" = "month";
  private __month = this.firstOfMonth(new Date());
  private __week_start: XCalendarWeekStart = "sun";
  private __item: XCalendarItemMap = {};
  private __actions?: XObjectData[];
  private __row_key?: string;
  private __selectable = true;
  private __selected_key?: string;
  private __empty_text = "No records";
  private __empty?: XObjectData;
  private __ready = false;
  private __data_inflight = false;
  private __item_ids = new Map<string, string>();

  private readonly __title_id: string;
  private readonly __weekdays_id: string;
  private readonly __days_id: string;
  private readonly __empty_id: string;

  constructor(data: XCalendarData) {
    const defaults: any = {
      _type: XCalendar._xtype,
      class: "xcalendar",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.__title_id = this._id + "_title";
    this.__weekdays_id = this._id + "_weekdays";
    this.__days_id = this._id + "_days";
    this.__empty_id = this._id + "_empty_wrap";
    this.parse(data);
    this.applyPropsFromData();
    this.applyLayout();
    this.buildSkeleton();
    this.__ready = true;
    this.renderCalendar();
    this.hydrateFromDataSource();
  }

  private applyPropsFromData() {
    this.__items = (this as any)._items;
    this.__date_field = this.normalizeDateField((this as any)._date_field);
    this.__end_date_field = this.normalizeOptionalDateField(
      (this as any)._end_date_field
    );
    this.__view = this.normalizeView((this as any)._view);
    this.__month = this.normalizeMonth((this as any)._month);
    this.__week_start = this.normalizeWeekStart((this as any)._week_start);
    this.__item =
      (this as any)._item && typeof (this as any)._item === "object"
        ? { ...((this as any)._item as XCalendarItemMap) }
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
  }

  private normalizeDateField(value: any): string {
    return normalizeCollectionDataKey(value) ?? "start_at";
  }

  private normalizeOptionalDateField(value: any): string | undefined {
    return normalizeCollectionDataKey(value);
  }

  private normalizeView(_value: any): "month" {
    return "month";
  }

  private normalizeSelectedKey(value: any): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    return String(value);
  }

  private normalizeWeekStart(value: any): XCalendarWeekStart {
    return value === "mon" ? "mon" : "sun";
  }

  private normalizeMonth(value: any): Date {
    if (typeof value === "string") {
      const trimmed = value.trim();
      const match = /^(\d{4})-(\d{2})$/.exec(trimmed);
      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]) - 1;
        if (Number.isFinite(year) && month >= 0 && month <= 11) {
          return new Date(year, month, 1);
        }
      }
    }

    const parsed = this.parseDate(value);
    return parsed ? this.firstOfMonth(parsed) : this.firstOfMonth(new Date());
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private buildClassName(): string {
    const existing = String((this as any).class || "");
    const remove = new Set(["xcalendar"]);
    const filtered = this.splitClasses(existing).filter((c) => !remove.has(c));
    return Array.from(new Set(["xcalendar", ...filtered])).join(" ");
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
      _id: `${this._id}_nav`,
      class: "xcalendar__nav",
      _children: [
        {
          _type: "button",
          _id: `${this._id}_prev`,
          class: "xcalendar__nav-button",
          _text: "Prev",
          _on: { click: () => this.navigateMonth(-1) },
        },
        {
          _type: "label",
          _id: this.__title_id,
          class: "xcalendar__title",
          _text: this.monthTitle(),
        },
        {
          _type: "view",
          _id: `${this._id}_nav_actions`,
          class: "xcalendar__nav-actions",
          _children: [
            {
              _type: "button",
              _id: `${this._id}_today`,
              class: "xcalendar__nav-button",
              _text: "Today",
              _on: { click: () => this.goToday() },
            },
            {
              _type: "button",
              _id: `${this._id}_next`,
              class: "xcalendar__nav-button",
              _text: "Next",
              _on: { click: () => this.navigateMonth(1) },
            },
          ],
        },
      ],
    });

    this.append({
      _type: "view",
      _id: this.__weekdays_id,
      class: "xcalendar__weekdays",
      _children: [],
    });

    this.append({
      _type: "view",
      _id: this.__days_id,
      class: "xcalendar__days",
      _children: [],
    });

    this.append({
      _type: "view",
      _id: this.__empty_id,
      class: "xcalendar__empty",
      _children: [],
    });
  }

  private getObject(id: string): XUIObject | undefined {
    return XUI.getObject(id) as XUIObject | undefined;
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

  private pad(value: number): string {
    return String(value).padStart(2, "0");
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(
      date.getDate()
    )}`;
  }

  private monthKey(date = this.__month): string {
    return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}`;
  }

  private firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  private addMonths(date: Date, months: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
  }

  private parseDate(value: any): Date | undefined {
    if (value instanceof Date) {
      const time = value.getTime();
      return Number.isFinite(time) ? value : undefined;
    }

    if (typeof value === "number") {
      const date = new Date(value);
      return Number.isFinite(date.getTime()) ? date : undefined;
    }

    if (typeof value !== "string" || !value.trim()) return undefined;

    const trimmed = value.trim();
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnly) {
      const year = Number(dateOnly[1]);
      const month = Number(dateOnly[2]) - 1;
      const day = Number(dateOnly[3]);
      const date = new Date(year, month, day);
      return Number.isFinite(date.getTime()) ? date : undefined;
    }

    const time = Date.parse(trimmed);
    if (!Number.isFinite(time)) return undefined;
    return new Date(time);
  }

  private readDateValue(row: any, rowIndex: number, field: string): any {
    if (field === "$row_index") return rowIndex;
    if (field === "$row") return row;
    if (field.startsWith("$row.")) {
      return readCollectionRowPath(row, field.slice("$row.".length));
    }
    return readCollectionRowPath(row, field);
  }

  private monthTitle(): string {
    return `${MONTH_NAMES[this.__month.getMonth()]} ${this.__month.getFullYear()}`;
  }

  private setMonth(next: Date, emit = true) {
    this.__month = this.firstOfMonth(next);
    if (this.__ready) this.renderCalendar();
    if (emit) this.emitMonthChange();
  }

  private navigateMonth(delta: number) {
    this.setMonth(this.addMonths(this.__month, delta));
  }

  private goToday() {
    this.setMonth(new Date());
  }

  private emitMonthChange() {
    const payload = {
      month: this.monthKey(),
      year: this.__month.getFullYear(),
      month_index: this.__month.getMonth(),
      source: this._id,
    };

    if (_xem && typeof (_xem as any).fire === "function") {
      (_xem as any).fire("xcalendar:month-change", payload);
    }
  }

  private normalizedRecords(items: any[]): CalendarRecord[] {
    return items
      .map((row, rowIndex) => {
        const startValue = this.readDateValue(row, rowIndex, this.__date_field);
        const endValue = this.__end_date_field
          ? this.readDateValue(row, rowIndex, this.__end_date_field)
          : undefined;
        const startDate = this.parseDate(startValue);
        const parsedEndDate = this.parseDate(endValue);
        const endDate =
          startDate && parsedEndDate && parsedEndDate >= startDate
            ? parsedEndDate
            : startDate;

        return {
          row,
          rowIndex,
          key: this.rowKey(row, rowIndex),
          startValue,
          endValue,
          startDate: startDate ? this.startOfDay(startDate) : undefined,
          endDate: endDate ? this.startOfDay(endDate) : undefined,
        };
      })
      .filter((record) => record.startDate) as CalendarRecord[];
  }

  private recordsForDay(records: CalendarRecord[], date: Date): CalendarRecord[] {
    const day = this.startOfDay(date).getTime();
    return records.filter((record) => {
      const start = record.startDate?.getTime();
      const end = record.endDate?.getTime();
      return start !== undefined && end !== undefined && day >= start && day <= end;
    });
  }

  private calendarDays(records: CalendarRecord[]): CalendarDay[] {
    const first = this.firstOfMonth(this.__month);
    const weekStartIndex = this.__week_start === "mon" ? 1 : 0;
    const offset = (first.getDay() - weekStartIndex + 7) % 7;
    const start = this.addDays(first, -offset);
    const todayKey = this.dateKey(new Date());

    return Array.from({ length: 42 }, (_unused, index) => {
      const date = this.addDays(start, index);
      return {
        date,
        key: this.dateKey(date),
        inMonth: date.getMonth() === this.__month.getMonth(),
        isToday: this.dateKey(date) === todayKey,
        records: this.recordsForDay(records, date),
      };
    });
  }

  private renderWeekdays() {
    const weekdays = this.getObject(this.__weekdays_id);
    if (!weekdays) return;
    this.clearChildren(weekdays);
    const labels = this.__week_start === "mon" ? WEEKDAYS_MON : WEEKDAYS_SUN;
    labels.forEach((label, index) => {
      weekdays.append({
        _type: "label",
        _id: `${this._id}_weekday_${index}`,
        class: "xcalendar__weekday",
        _text: label,
      });
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
      "xcalendar__media"
    );
    if (image) return image;

    const icon = this.textValue(
      this.resolveField(this.__item._icon, row, rowIndex, ["icon"])
    );
    if (!icon) return undefined;

    return {
      _type: "label",
      _id: `${itemId}_icon`,
      class: "xcalendar__icon",
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
      return Boolean(target.closest(".xcalendar__actions"));
    }

    let current = target;
    while (current) {
      const className =
        typeof current.getAttribute === "function"
          ? current.getAttribute("class")
          : current.className;
      if (this.splitClasses(String(className || "")).includes("xcalendar__actions")) {
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
      (token) => token !== "xcalendar__event--selected"
    );
    if (selected) classes.push("xcalendar__event--selected");
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

  private selectItem(record: CalendarRecord, dayKey: string) {
    if (!this.__selectable) return;
    this.__selected_key = record.key;
    this.applySelection();

    const context = {
      row: record.row,
      row_index: record.rowIndex,
      key: record.key,
      date_field: this.__date_field,
      end_date_field: this.__end_date_field,
      date: record.startValue,
      end_date: record.endValue,
      day: dayKey,
    };

    if (_xem && typeof (_xem as any).fire === "function") {
      (_xem as any).fire("xcalendar:item-select", {
        record: record.row,
        row_index: record.rowIndex,
        key: record.key,
        date_field: this.__date_field,
        end_date_field: this.__end_date_field,
        date: record.startValue,
        end_date: record.endValue,
        day: dayKey,
      });
    }

    if ((this as any)._on_select) {
      this.checkAndRunInternalFunction((this as any)._on_select, record.row, context);
    }
  }

  private buildEvent(record: CalendarRecord, dayKey: string): XObjectData {
    const { row, rowIndex, key } = record;
    const itemId = `${this._id}_item_${this.safeIdSegment(key)}_${dayKey}`;
    this.__item_ids.set(key, itemId);

    const title =
      this.textValue(
        this.resolveField(this.__item._title, row, rowIndex, [
          "title",
          "name",
          "label",
        ])
      ) || "Record";
    const subtitle = this.textValue(
      this.resolveField(this.__item._subtitle, row, rowIndex, [
        "subtitle",
        "location",
        "type",
        "category",
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
        "time",
        "start_at",
        "date",
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

    const bodyChildren: XObjectData[] = [
      {
        _type: "view",
        _id: `${itemId}_header`,
        class: "xcalendar__event-header",
        _children: [
          ...(visual ? [visual as XObjectData] : []),
          {
            _type: "label",
            _id: `${itemId}_title`,
            class: "xcalendar__event-title",
            _text: title,
          },
          ...(badge ? [badge] : []),
        ],
      },
    ];

    if (subtitle) {
      bodyChildren.push({
        _type: "label",
        _id: `${itemId}_subtitle`,
        class: "xcalendar__event-subtitle",
        _text: subtitle,
      });
    }
    if (description) {
      bodyChildren.push({
        _type: "label",
        _id: `${itemId}_description`,
        class: "xcalendar__event-description",
        _text: description,
      });
    }
    if (meta) {
      bodyChildren.push({
        _type: "label",
        _id: `${itemId}_meta`,
        class: "xcalendar__event-meta",
        _text: meta,
      });
    }
    if (actions.length) {
      bodyChildren.push({
        _type: "view",
        _id: `${itemId}_actions`,
        class: "xcalendar__actions",
        _children: actions,
      });
    }

    return {
      _type: "view",
      _id: itemId,
      class: [
        "xcalendar__event",
        selected ? "xcalendar__event--selected" : "",
        this.__selectable ? "xcalendar__event--selectable" : "",
      ]
        .filter(Boolean)
        .join(" "),
      role: this.__selectable ? "button" : undefined,
      tabindex: this.__selectable ? "0" : undefined,
      "aria-selected": selected ? "true" : "false",
      _row: row,
      _row_index: rowIndex,
      _date: record.startValue,
      _end_date: record.endValue,
      _context: {
        row,
        row_index: rowIndex,
        key,
        date_field: this.__date_field,
        end_date_field: this.__end_date_field,
        date: record.startValue,
        end_date: record.endValue,
        day: dayKey,
      },
      _on: this.__selectable
        ? {
            click: (event: any) => {
              if (this.itemClickIsFromActions(event)) return;
              this.selectItem(record, dayKey);
            },
            keydown: (event: any) => {
              if (event?.key !== "Enter" && event?.key !== " ") return;
              if (event?.preventDefault) event.preventDefault();
              this.selectItem(record, dayKey);
            },
          }
        : undefined,
      _children: bodyChildren,
    };
  }

  private buildDay(day: CalendarDay): XObjectData {
    return {
      _type: "view",
      _id: `${this._id}_day_${day.key}`,
      class: [
        "xcalendar__day",
        day.inMonth ? "" : "xcalendar__day--outside",
        day.isToday ? "xcalendar__day--today" : "",
        day.records.length ? "" : "xcalendar__day--empty",
      ]
        .filter(Boolean)
        .join(" "),
      "data-date": day.key,
      _children: [
        {
          _type: "label",
          _id: `${this._id}_day_${day.key}_number`,
          class: "xcalendar__day-number",
          _text: String(day.date.getDate()),
        },
        {
          _type: "view",
          _id: `${this._id}_day_${day.key}_events`,
          class: "xcalendar__events",
          _children: day.records.map((record) => this.buildEvent(record, day.key)),
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

  renderCalendar() {
    const title = this.getObject(this.__title_id);
    if (title && typeof (title as any).setText === "function") {
      (title as any).setText(this.monthTitle());
    } else if (title) {
      (title as any)._text = this.monthTitle();
    }

    this.renderWeekdays();

    const daysObject = this.getObject(this.__days_id);
    const emptyObject = this.getObject(this.__empty_id);
    if (!daysObject || !emptyObject) return;

    this.clearChildren(daysObject);
    this.clearChildren(emptyObject);
    this.__item_ids.clear();

    const records = this.normalizedRecords(resolveCollectionItems(this.__items));
    const days = this.calendarDays(records);
    let visibleRecordCount = 0;

    days.forEach((day) => {
      if (day.inMonth) visibleRecordCount += day.records.length;
      daysObject.append(this.buildDay(day));
    });

    if (!visibleRecordCount) {
      emptyObject.append(this.buildEmpty());
    }

    this.applySelection();
  }

  refresh() {
    this.renderCalendar();
  }

  set _items(value: XCollectionRowsValue) {
    this.__items = value;
    if (this.__ready) this.renderCalendar();
  }

  get _items() {
    return this.__items;
  }

  set _date_field(value: string | undefined) {
    this.__date_field = this.normalizeDateField(value);
    if (this.__ready) this.renderCalendar();
  }

  get _date_field() {
    return this.__date_field;
  }

  set _end_date_field(value: string | undefined) {
    this.__end_date_field = this.normalizeOptionalDateField(value);
    if (this.__ready) this.renderCalendar();
  }

  get _end_date_field() {
    return this.__end_date_field;
  }

  set _month(value: string | undefined) {
    this.setMonth(this.normalizeMonth(value), false);
  }

  get _month() {
    return this.monthKey();
  }

  set _view(value: "month" | undefined) {
    this.__view = this.normalizeView(value);
    if (this.__ready) this.renderCalendar();
  }

  get _view() {
    return this.__view;
  }

  set _week_start(value: XCalendarWeekStart | undefined) {
    this.__week_start = this.normalizeWeekStart(value);
    if (this.__ready) this.renderCalendar();
  }

  get _week_start() {
    return this.__week_start;
  }

  set _item(value: XCalendarItemMap | undefined) {
    this.__item = value && typeof value === "object" ? { ...value } : {};
    if (this.__ready) this.renderCalendar();
  }

  get _item() {
    return this.__item;
  }

  set _actions(value: XObjectData[] | undefined) {
    this.__actions = Array.isArray(value) ? value : undefined;
    if (this.__ready) this.renderCalendar();
  }

  get _actions() {
    return this.__actions;
  }

  set _row_key(value: string | undefined) {
    this.__row_key = normalizeCollectionDataKey(value);
    if (this.__ready) this.renderCalendar();
  }

  get _row_key() {
    return this.__row_key;
  }

  set _selectable(value: boolean | undefined) {
    this.__selectable = normalizeCollectionBoolean(value, true);
    if (this.__ready) this.renderCalendar();
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
    if (this.__ready) this.renderCalendar();
  }

  get _empty_text() {
    return this.__empty_text;
  }

  set _empty(value: XObjectData | undefined) {
    this.__empty = value && typeof value === "object" ? value : undefined;
    if (this.__ready) this.renderCalendar();
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
