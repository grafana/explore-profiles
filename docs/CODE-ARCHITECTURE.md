# Grafana Profiles Drilldown frontend architecture

> [!NOTE]
> Everything is a tradeoff in Software Engineering.

This document aims to help guide our decisions when developing Grafana Profiles Drilldown. They are not rules to apply blindly, just a set of guidelines that we believe is useful today, for maintaining and growing the plugin code base. Whenever we feel they are not useful, incorrect or incomplete, we should adapt them accordingly.

## Motivation

We choose a simple 3-layer architecture to help us contain the complexity that will inherently grow during the lifetime of the project. Essentially, adopting an architecture will helps us in the mid/long term to:

- **Separate concerns** (e.g. how data is fetched vs how they look like on the screen), which will help us maintaining the codebase in the long term
- **Prevent entangled code**, which will help us with readability and the ability to quickly reason about the code
- **Modify easily the codebase**, whether it’s debugging, optimizing, fixing bugs or adding new features
- **To help us adding more tests** and maintaining them

## Layers

The code is organized in a 3-layer architecture:

1. UI
2. Domain logic
3. Infrastructure

### UI layer

This layer is the home of the React components. We split them into two categories:

1. **Presentational components**: are concerned about how things look (they contain “pure UI logic”)
2. **Container components**: are concerned with how things work (they contain domain logic)

This approach is described in [Dan Abramov’s post](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0). As mentioned in his 2019 update (and as mentioned above), don’t take it too seriously, these are valuable guidelines, not strict rules.

Typically a container component receives data and actions (functions to modify the data) via a hook from the domain layer. For example, the [SettingsView](../src/pages/SettingsView/SettingsView.tsx).

An example of presentational component is the [AdHocColumns component](../src/pages/AdHocView/ui/AdHocColums.tsx) (a micro-layout component). This component receives simple props that, most of the time, can be used directly. If there’s some logic involved during rendering, it only concerns how things will look on the UI. No data fetching, no domain logic.

### Domain logic layer

This layer contains functions and React hooks concerned with how the plugin works. The rules defined by the business are implemented here. They typically use infrastructure hooks/functions to retrieve data (from APIs, etc.), to combine them and to define functions that will act on them. As a convention, they typically return “data” and “actions” objects.

For example, the [useSettingsView](../src/pages/SettingsView/domain/useSettingsView.ts) hook, used in the [Settings view](../src/pages/SettingsView/SettingsView.tsx).

### Infrastructure layer

This layer contains the hooks/functions/classes concerned with fetching the data (from backend APIs, from browser storage, etc.) as well as with side-effects.

For example, the [AdHocProfileClient class](../src/pages/AdHocView/infrastructure/adHocProfileClient.ts) or the [useFetchPluginSettings hook](../src/shared/infrastructure/settings/useFetchPluginSettings.ts).

## Code conventions & guidelines

### Code organization

- A page or a component should have 3-4 sub-folders:

  - **ui:** React components having only display logic, no domain logic nor infrastructure calls
  - **domain:** React hooks, JS classes/functions that implement the business logic
  - **infrastructure:** React hooks, API clients, Storage classes
  - **components (optional):** React components that are complex enough to have their “ui”, “domain”, “infrastructure” folders

- **Not having a “ui” folder might indicate a code smell:** existing components might do too much (display logic and domain logic entangled)
- As a side effect, ideally, **React components should be rather small** (we should apply a "divide & conquer" strategy to large components to keep the code modular, testable & easy to reason about)
- Domain hooks return a “data” object and an “actions” object:
  - The properties in actions should be named [verb][subject]
- Shared code:
  - should be placed in the “shared” folder (whether it’s React components, hooks, TS types or classes)
  - should be placed only when it is reused - no assumptions about future plans ;)
  - can be imported with the @shared alias
- We use named exports, without barrel files
- By default, files are named after what the export, unless they export more than one thing (but usually they shouldn’t)
- We use TypeScript types and not interfaces (no specific reason, if there are reasons to prefer interface, we would change this decision)
- Unit tests are placed in “**tests**” folders
