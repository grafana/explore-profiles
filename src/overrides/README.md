# Overrides Guide

This project's [package.json](../../package.json) file has `grafana-pyroscope` as a dependency. This allows it to directly
use the pages and structures defined in the [Pyroscope repository](https://github.com/grafana/pyroscope.git).

Currently, Pyroscope pages are directly embedded into this app plugin's `<Routes>` component:

- `<ContinuousSingleView />`
- `<ContinuousDiffView />`
- `<ContinuousComparisonView />`
- `<TagExplorerView />`

Despite using these pages directly, this app plugin needs to override some of the code that is imported (directly or indirectly) by the aforementioned `<*View>` components.

A convention in the Pyroscope web app is to use the alias `@pyroscope` whenever it imports from local source code.
E.g.,

```ts
import TagExplorerView from '@pyroscope/pages/TagExplorerView';
```

Aliases like this are defined through webpack configuration, and take effect at compile time.
When webpack processes imports with those alias, its configuration can redirect to another file or subdirectory.
For the [Pyroscope repository](https://github.com/grafana/pyroscope.git), the `@pyroscope` alias points to the [Pyroscope webapp source subfolder (`/public/app`)](https://github.com/grafana/pyroscope/tree/main/public/app).
The same `@pyroscope` alias is defined for this repository, except it points to the pyroscope code that is downloaded as the `grafana-pyroscope` dependency.

We take advantage of this common `@pyroscope` alias prefix to enable the ability to override specific code.
By configuring a more specific alias, we can instruct webpack to choose a re-implementation of that source code file whenever it encounters an import of that file.

These aliases are defined in a [webpack.config.ts](../../webpack.config.ts) file. E.g.,

```ts
...
  alias: {
    // More specific rules first
    ...
    '@pyroscope/components/Toolbar': path.resolve(__dirname, './src/overrides/components/Toolbar'),
    ...
    // General rules later
    '@pyroscope': path.resolve(__dirname, './node_modules/grafana-pyroscope/public/app'),
    ...
  }
...
```

This snippet shows a specific alias rule to tell webpack that whenever it encounters an import that contains `@pyroscope/components/Toolbar`, to substitute that alias with the specifed folder in this repository where there Toolbar override is defined. In the lower part of the snippet, you can see the general `@pyroscope` alias, which redirects to downloaded source code of the dependency identified as `grafana-pyroscope`, which is stored under `node_modules/grafana-pyroscope`.

The purpose of this directory [`src/overrides/`](./) is to contain the overrides to source code on the [Pyroscope repository](https://github.com/grafana/pyroscope.git). To this end, this directory is a partial mirror the folder structure of the
[Pyroscope webapp source subfolder (`/public/app`)](https://github.com/grafana/pyroscope/tree/main/public/app) in the [Pyroscope repository](https://github.com/grafana/pyroscope.git).
The purpose of this mirror is to contain Grafana-specific implementations of certain files using the alias strategy explained earlier.
In order for an override to take place, it must be expressed within the `alias` object in [webpack.config.ts](../../webpack.config.ts) as illustrated for `Toolbar` earlier.

**How would you import from the original version of a file that you have an override for?**
Just for example, let's consider the `Toolbar` override as shown in the prior snippet. Consider a scenario where someone wanted to import something from the original `Toolbar` file from the `grafana-pyroscope` so that they could reference it in the override implementation.
They would not be able to use the `@pyroscope/components/Toolbar` alias, since that already points to the override in `./src/overrides/components/Toolbar`. Instead, they would have to use a direct import to the downloaded dependency source code in `node_modules`; they would have to import using `grafana-pyroscope/public/app/components/Toolbar`.
