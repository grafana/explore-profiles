# The Grafana Profiles Drilldown app

**What this file is for:** **Product intent** — why the app exists, what it optimizes for, and guiding principles. It does not describe screens or views (see `application-structure.md` for that).

---

Grafana Profiles Drilldown is a plugin that lets users investigate Pyroscope profiling data **without writing queries**. It targets the same observability goals as ad-hoc profiling—finding hotspots, bottlenecks, and regressions—through guided drill-downs (all services → profile types → labels → flame graph / diff) instead of manual query construction.

## Core features

- **All services → drill-down**: Start from an overview of all services for a profile metric, then narrow by profile type, labels, and finally flame graph or diff flame graph.
- **Exploration types**: All services, Profile types, Labels, Flame graph, Diff flame graph, Favorites—each view matches a step in the investigation hierarchy.
- **Progressive drill-down**: Filters, group-by, time range, comparison (baseline vs comparison), shareable state via URL.
- **Flame graph & function details**: Inspect a single profile (flame graph), function-level details, and optional GitHub/source context.
- **Shareable state**: URL and scene variables preserve datasource, filters, exploration type, time range(s), and selection where applicable.

## Core principles

- **Simplicity first**: Default path is visual and interactive; advanced behavior (e.g. diff flame graph, ad-hoc upload) is available without blocking newcomers.
- **Pyroscope-native**: Built around Pyroscope (or compatible) data sources and profile-derived data; behavior should stay honest to what the backend can answer.
- **Connected to Grafana**: Entry from Explore, dashboards, and Assistant; exit to Explore and shareable links—not a siloed experience.
- **Accessible breadth**: Useful for users who are not profiling query experts while still supporting power-user workflows (filters, comparisons, recording rules, ad-hoc profiles).
