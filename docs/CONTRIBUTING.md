# Contributing to Grafana Pyroscope App Plugin

## Requirements

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en) v20
- [Go](https://go.dev/learn/)
- [Docker](https://www.docker.com/get-started/) or [OrbStack](https://orbstack.dev/download) (lighter alternative)

## Getting started

1. Clone the repository `git clone git@github.com:grafana/pyroscope-app-plugin.git`
2. Install the dependencies: `yarn install`
3. Build the plugin backend: `mage`
4. Build the plugin frontend in dev mode: `yarn dev`
5. Start the Grafana server (with static data): `yarn server:static`
6. Optionally, to enable the **GitHub integration feature**, read the "Enable GitHub integration" section below.

Then visit http://localhost:3000/a/grafana-pyroscope-app

**Alternatively:**

- To use **live remote data**, read the "Using live remote profile data" section below.
- To use **a local version of Pyroscope**, read the "Using a local version of Pyroscope" section below.
- To use **a local version of Grafana**, read [this section](./GRAFANA-CROSS-DEVELOPMENT.md).

### Enable GitHub integration

When clicking on a node of the Flame Graph, the plugin can offer to display information about the function being profiled in the form of a "Function details" contextual menu item.

To enable this feature:

1. If not already done, copy the content of the `.env.local` file to a new `.env` file in the root directory
2. Open the 1Password app and search for the note named "DB FE - GitHub integration credentials"
3. Fill in the missing values in the `.env` file
4. Start the Grafana server

### Using live remote profile data

1. If not already done, copy the content of the `.env.local` file to a new `.env` file in the root directory
2. Open the 1Password app and search for the note named "DB FE - Remote profile data credentials"
3. Fill in the missing values in the `.env` file
4. Start the Grafana server: `yarn server:remote`

### Using a local version of Pyroscope

1. Start the local version of Pyroscope (see [Pyrosocpe's contributing guide](https://github.com/grafana/pyroscope/tree/main/docs/internal/contributing))
2. Execute `yarn server:local`

## Backend development

Any changes to the backend code will require to rebuild the plugin by running `mage`.

Then, the server must be restarted to ensure that the updated binary takes effect.

## Frontend development

### Contribution guidelines

For developing in this repo, requirements are generally managed by lint rules and pre-commit hooks. However, for other things, like code organization, please follow the pattern established by the rest of the repo.

In case of doubt, have a look at ["Pyroscope App Plugin Frontend Architecture"](https://docs.google.com/document/d/17lRLcD24JTckh4OonzDagC1aSEEsLZrNHUA6eiiReTQ)

#### Linting & Formatting

We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to lint and format our code. These will be run in a pre-commit hook, but you can also setup your IDE to run them on save.

#### Commit messages & PR titles

We use [conventional commits](https://www.conventionalcommits.org/) to format our commit messages. This allows us to automatically generate changelogs and version bumps. There is a check that runs as a pre-commit hook.

### Testing

We encourage you to write tests, whether they are unit tests or end-to-end tests. They will give us the confidence that the plugin behaves as intended and help us capture any regression early.

#### Unit testing

_TODO_

#### End-to-End testing (E2E)

Please have a look at our [E2E testing documentation](../e2e/README.md).

## Common problems & solutions

### The service & profile dropdowns are empty of data

#### Symptom

Some requests to http://localhost/api/plugins/grafana-pyroscope-app failing (HTTP 500-503) with this response:

```json
{
  "error": "plugin unavailable",
  "message": "Plugin unavailable",
  "traceID": ""
}
```

#### Cause

The plugin backend has not been built.

#### Solution

1. Build the plugin backend by executing `mage` in the terminal,
2. After the build has finished, check the [dist](../dist) folder for files named `gpx_pyroscope_app_*`
3. Restart the server
