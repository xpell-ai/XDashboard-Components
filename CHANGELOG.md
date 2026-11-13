# Changelog

## [2.0.8] — 2026-11-13 (unreleased candidate)

- Compared with public 2.0.7 declarations: include XShell, XPage and XPageHeader plus semantic child/style, collection formatting and density metadata.
- Coordinate the existing semantic dashboard object pack, skill metadata and stylesheet with UI/Core 2.0.8.
- Correct palette qualification to request the stable ID that the test asserts; omitted IDs continue to use XUI-generated IDs.
- Preserve all preexisting component work in this checkout.
- Preserve explicit timezone offsets when formatting collection timestamps, while keeping date-only and unzoned timestamps local.

Compatibility: internal workspace specifications are retained. No public API redesign, PostgreSQL backend, persistence migration or automatic SQLite activation is introduced by this preparation.

Validation: package builds and available tests are recorded in the coordinated Gate 2 report. Gate 3 must verify the exact packed artifacts and clean-consumer compatibility before publication. These entries describe verified checked-out capabilities and release-preparation deltas; they do not claim that every capability is new relative to the last npm artifact.

