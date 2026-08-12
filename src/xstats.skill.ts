import type { XDashboardDiscoverySkill } from "./xskills";

export const XSTATS_SKILL: XDashboardDiscoverySkill = {
  _id: "xstats",
  _title: "XStats",
  _version: "1.0.0",
  _active: true,
  _type: "view-skill",
  _category: "data-summary",
  _purpose: "generic data-bound summary metrics for record collections",
  _aliases: ["stats", "statistics", "metrics", "summary", "KPI", "counters"],
  _capabilities: [
    "collection-summary",
    "record-aggregates",
    "count",
    "sum",
    "average",
    "min",
    "max",
  ],
  _bindings: {
    _collection: ["_data_source", "_records"],
    _metrics: ["_items"],
    _aggregations: ["_items._aggregate", "_items._field", "_items._filter"],
    _layout: ["_min_col_width", "_gap"],
  },
  _usage: [
    "Use xstats to summarize a record collection with generic metrics.",
    "Use _data_source for the collection records and _items for metric definitions.",
    "Use _aggregate:'count', 'sum', 'average', 'min', or 'max'.",
    "Use _field for field-based numeric aggregations.",
    "Use _filter for a simple field/operator/value condition before aggregation.",
    "Use xstats above or beside table, xgallery, xlist, xkanban, xtimeline, or xcalendar; it complements collection presentations and does not replace them.",
  ],
  _use_cases: [
    "record totals",
    "filtered counters",
    "numeric summaries",
    "dashboard KPIs",
    "collection overview",
    "status counts",
    "financial totals",
    "operational metrics",
  ],
  _presentation: {
    _kind: "summary",
    _mode: "stats",
    _alternatives: ["kpi-card", "xstats"],
    _prefer_when: [
      "multiple metrics should summarize the same record collection",
      "summary values should stay synchronized with XData-backed records",
      "metrics should sit above or beside a collection presentation",
    ],
  },
  _requires: ["xuiobject", "xdata", "badge", "empty"],
  _match: {
    _keywords: [
      "stats",
      "statistics",
      "metrics",
      "summary",
      "kpi",
      "counter",
      "counters",
      "aggregate",
      "count",
      "sum",
      "average",
      "min",
      "max",
      "totals",
    ],
    _priority: 88,
  },

  _description:
    "Generic data-bound statistics component that computes summary metrics from supplied record collections and renders them as responsive metric cards.",

  _fields: {
    _data_source:
      "Optional XData key used to hydrate and update the records being summarized, for example pot.records.",
    _records:
      "Optional static record array or XData key string. Use _data_source for XData-bound records.",
    _items:
      "Metric definitions. Each item supports _id, _title, _aggregate, _field, _filter, _subtitle, _icon, _badge, _trend, and _meta.",
    _min_col_width:
      "Responsive auto-fit minimum metric card width in pixels.",
    _gap: "Gap between metric cards in pixels.",
    _empty_text: "Text shown when no metric items are configured.",
    _empty:
      "Optional empty-state XUI object. Defaults to an empty object using _empty_text.",
    _on_data:
      "Optional data handler. For persisted/generated views, use Nano-Commands/data-only, not functions.",
    class: "Optional CSS classes. xstats is applied automatically.",
  },

  _core_rules: [
    "Use xstats for summary metrics, not as a collection-presentation replacement.",
    "Keep xstats generic; do not add entity-specific aggregation behavior.",
    "Use _data_source when records should come from XData.",
    "Use _items for metric definitions, not collection records.",
    "Supported aggregations are count, sum, average, min, and max.",
    "Use _field for sum, average, min, and max.",
    "Use _filter only for simple field/operator/value conditions; do not invent a query language.",
    "Use xstats above or beside table, xgallery, xlist, xkanban, xtimeline, or xcalendar.",
    "For persisted/generated views, handlers must be Nano-Commands/data-only.",
  ],

  _canonical_examples: [
    {
      _type: "xstats",
      _id: "record-stats",
      _data_source: "pot.records",
      _items: [
        {
          _id: "total",
          _title: "Total",
          _aggregate: "count",
        },
        {
          _id: "needs-attention",
          _title: "Needs Attention",
          _aggregate: "count",
          _filter: {
            _field: "status",
            _operator: "eq",
            _value: "needs_attention",
          },
        },
      ],
    },
  ],
};
