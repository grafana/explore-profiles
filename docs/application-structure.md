# Application structure

**What this file is for:** A **product map** (entry → exploration → views → exit/embed). For *why* the app exists, see `project-intent.md`. Use this doc when implementing or reviewing UI and URL behavior.

## Entry points

### Sidebar navigation

The primary entry is **Profiles** (or **Drilldown → Profiles**) in Grafana’s menu. That loads the main exploration route (`/a/grafana-pyroscope-app/explore`) with the selected Pyroscope data source (last-used datasource is remembered when possible).

### Extension links

Users can land in Profiles Drilldown from elsewhere in Grafana:

- **Dashboard panel menu**: “Open in Grafana Profiles Drilldown” when the panel uses a Pyroscope query—filters and time range are carried over when they can be mapped.
- **Explore toolbar**: Link into the queryless Profiles Drilldown experience from Explore when working with Pyroscope.
- **Grafana Assistant**: Navigation extension to open Profiles Drilldown with appropriate context.

### Embedded components

The plugin exposes:

- **Embedded Profiles Exploration** (`grafana-pyroscope-app/embedded-profiles-exploration/v1`): A full exploration view scoped by props (e.g. `initialFilters`, `initialDS`, `initialTimeRange`) for use inside other apps or surfaces.
- **Open in Grafana Profiles Drilldown** link: Opens the app with a configured exploration context (see `src/links.ts`).

### Direct URLs

Deep links encode datasource (`var-dataSource`), exploration type (`explorationType`), service name, profile metric, filters, time range(s), and for diff view baseline/comparison ranges. Bookmarks and share actions rely on this URL state. Share URL builder: `src/pages/ProfilesExplorerView/components/SceneProfilesExplorer/components/domain/builsShareableUrl.ts`.

## Main exploration layout

The root experience is a **scene-based** tree (`ProfilesExplorerView` → `SceneProfilesExplorer` → body scenes) with URL sync for `explorationType` and child state.

### Top row (header)

- **Data source**: Pyroscope data source selector.
- **Controls**: Time picker and refresh (standard scene controls).
- **Exploration type**: Selector for the views below (see [Exploration types (views)](#exploration-types-views)).
- **Actions**: Share link, Recording rules, Ad-hoc upload, User settings, docs/help.

### Filters and grid controls

Depending on the exploration type (see next section), the body shows overview panels, filters/grid, flame graph with function details, diff flame graph, or favorites.

Variables (e.g. `FiltersVariable`, `GroupByVariable`, `ServiceNameVariable`, `ProfileMetricVariable`) drive queries and URL state; see `SceneProfilesExplorer` and child scenes.

## Exploration types (views)

The **exploration type** is synced to the URL as `explorationType`. Body scene is built in `SceneProfilesExplorer.buildBodyScene()`:

1. **All services** (`all`) — `SceneExploreAllServices`: Overview of all services for the selected profile metric.
2. **Profile types** (`profiles`) — `SceneExploreServiceProfileTypes`: Profile types for the selected service.
3. **Labels** (`labels`) — `SceneExploreServiceLabels`: Label-based breakdown and group-by.
4. **Flame graph** (`flame-graph`) — `SceneExploreServiceFlameGraph`: Single flame graph and function details.
5. **Diff flame graph** (`diff-flame-graph`) — `SceneExploreDiffFlameGraph`: Compare two time ranges.
6. **Favorites** (`favorites`) — `SceneExploreFavorites`: User favorites.

Events (e.g. `EventViewServiceProfiles`, `EventViewServiceLabels`, `EventViewServiceFlameGraph`, `EventViewDiffFlameGraph`) drive transitions between these views when the user clicks from a panel or chart.

## Flame graph and function details

- **Flame graph view**: `SceneExploreServiceFlameGraph` → `SceneFlameGraph`. Shows the flame graph for the current service/profile type/filters and time range.
- **Function details panel**: `SceneFunctionDetailsPanel` — selected function metadata, optional GitHub/source link, AI suggestions. May use extension points (e.g. resolution boost) when available.
- **Diff flame graph**: `SceneExploreDiffFlameGraph` with baseline and comparison panels; URL carries `diffFrom`/`diffTo` (and variants) for shareable comparison.

## Other routes

- **Ad-hoc** (`/ad-hoc`): Upload and view ad-hoc profile data (`AdHocView`).
- **Settings** (`/settings`): User/app settings (`SettingsView`).
- **Recording rules** (`/recording-rules`): Recording rules management (`RecordingRulesView`).
- **GitHub callback** (`/github/callback`): OAuth callback for GitHub context in function details.

## Exit points and handoffs

- **Share exploration**: Copy link with full URL state (see Share in header).
- **Open in Explore**: From relevant actions, jump to Grafana Explore with Pyroscope context where supported.
- **Open in Profiles Drilldown** (inbound): Other surfaces use the exposed link or extension to pass users into this app with context (see `src/links.ts`).
