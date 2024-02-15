# Contributing to Grafana Pyroscope App Plugin

> [!NOTE]
> The plugin code base still depends on the [Pyroscope OSS](https://github.com/grafana/pyroscope) code base.

Please check the [related documentation](./CONTRIBUTING-PYROSCOPE-DEPENDENCY.md) to understand what it implies.

## Requirements

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en) v18
- [Go](https://go.dev/learn/)
- [Docker](https://www.docker.com/get-started/) or [OrbStack](https://orbstack.dev/download) (lighter alternative)

## Getting started

1. Clone the repository `git clone git@github.com:grafana/pyroscope-app-plugin.git`
2. Install the dependencies: `yarn install`
3. Build the plugin backend: `mage`
4. Build the plugin frontend in dev mode: `yarn dev`
5. Start the server (with static data): `yarn server:static`

Then visit http://localhost:3000/a/grafana-pyroscope-app

To use live remote data, read the next section.

### Using live remote profile data

1. Copy the content of the `.env.local` file to a new `.env` file in the root directory
2. Open the 1Password app and search for the note named "DB FE - Remote profile data credentials"
3. Fill in the missing values in the `.env` file
4. Start the server: `yarn server:remote`

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

#### Solution

1. Build the plugin backend by executing `mage` in the terminal,
2. After the build has finished, check the [dist](../dist) folder for files named `gpx_pyroscope_app_*`
3. Restart the server
