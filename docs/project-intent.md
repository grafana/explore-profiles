# The Grafana Profiles Drilldown app

**What this file is for:** **Product intent** — why the app exists, what it optimizes for, and guiding principles. It does not describe screens or views (see `application-structure.md` for that).

---

Grafana Profiles Drilldown is a plugin that lets users investigate Pyroscope profiling data **without writing queries**. It targets the same observability goals as ad-hoc profiling—finding hotspots, bottlenecks, and regressions—through guided drill-downs instead of manual query construction. See `application-structure.md` for the exploration-type hierarchy and entry/exit points.

## Core features

- **Drill-down**: All services → profile types → labels → flame graph / diff; exploration types and views are listed in `application-structure.md`.
- **Progressive refinement**: Filters, group-by, time range, comparison; shareable state via URL.
- **Flame graph & function details**: Single profile inspection, function-level details, optional GitHub/source context (details in `application-structure.md`).

## Core principles

- **Simplicity first**: Default path is visual and interactive; advanced behavior (diff, ad-hoc upload) available without blocking newcomers.
- **Pyroscope-native**: Built around Pyroscope (or compatible) data sources; behavior stays honest to what the backend can answer.
- **Connected to Grafana**: Entry/exit and extension links are in `application-structure.md`.
- **Accessible breadth**: Useful for non–query experts while supporting power-user workflows (filters, comparisons, recording rules, ad-hoc).
