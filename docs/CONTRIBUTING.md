# Contributing to Grafana Profiles Drilldown

Welcome! We're excited that you're interested in contributing. Below are some basic guidelines.

## Workflow

Grafana Profiles Drilldown follows a standard GitHub pull request workflow. If you're unfamiliar with this workflow, read the very helpful [Understanding the GitHub flow](https://guides.github.com/introduction/flow/) guide from GitHub.

You are welcome to create draft PRs at any stage of readiness - this
can be helpful to ask for assistance or to develop an idea.  
Before a piece of work is finished, it should:

- Be organised into one or more commits, each of which has a commit message that describes all changes made in that commit ('why' more than 'what' - we can read the diffs to see the code that changed).
- Each commit should build towards the whole - don't leave in back-tracks and mistakes that you later corrected.
- Have unit for new functionality or tests that would have caught the bug being fixed.

## Requirements

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en) v20
- [Yarn](https://yarnpkg.com/) v4
- [Docker](https://www.docker.com/get-started/) or [OrbStack](https://orbstack.dev/download) (lighter alternative)

## Get started

1. Clone the repository `git clone git@github.com:grafana/profiles-drilldown.git`
2. Install the dependencies: `yarn install`
3. Build the plugin in dev mode: `yarn dev`
4. Start the Grafana server (with static data): `yarn server:static`
5. Optionally, to enable the **GitHub integration feature**, read the "Enable GitHub integration" section below.

Then visit http://localhost:3000/a/grafana-pyroscope-app

**Alternatively:**

- To use **live remote data**, read the "Enable with live remote profile data" section below.
- To use **a local version of Pyroscope**, read the "Enable with a local version of Pyroscope" section below.
- To use **a local version of Grafana**, read [this section](./GRAFANA-CROSS-DEVELOPMENT.md).

### Enable with live remote profile data

1. If not already done, copy the content of the `.env.local` file to a new `.env` file in the root directory.
2. Fill in the missing `REMOTE_` values in the `.env` file.
3. Start the Grafana server: `yarn server:remote`

### Enable with a local version of Pyroscope

1. Start the local version of Pyroscope (see [Pyroscope's contributing guide](https://github.com/grafana/pyroscope/tree/main/docs/internal/contributing))
2. Execute `yarn server:local`

### Enable GitHub integration ("Function details")

When clicking on a node of the flame graph, the plugin can offer to display information about the function being profiled in the form of a "Function details" contextual menu item.

To enable this feature:

1. If not already done, copy the content of the `.env.local` file to a new `.env` file in the root directory.
2. Fill in the missing `GITHUB_` values in the `.env` file.
3. Start the Grafana server.

For more information, refer to the [Pyroscope GitHub integration](https://grafana.com/docs/grafana-cloud/monitor-applications/profiles/pyroscope-github-integration/) documentation.

### Enable AI integration ("Explain Flame Graph")

The plugin can help understand flame graphs by using a large-language model (LLM) to assist with profiling data interpretation.

To enable this feature:

1. If not already done, copy the content of the `.env.local` file to a new `.env` file in the root directory.
2. Fill in the missing `OPENAI_` values in the `.env` file.
3. Start the Grafana server.

For more information, refer to the [Flame graph AI](https://grafana.com/docs/grafana-cloud/monitor-applications/profiles/flamegraph-ai/) documentation.

## Contribution guidelines

For developing in this repo, requirements are generally managed by lint rules and pre-commit hooks. However, for other things, like code organization, please follow the pattern established by the rest of the repo.

In case of doubt, have a look at ["Profiles Drilldown frontend architecture"](./CODE-ARCHITECTURE.md)

### Lint and format your code

We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to lint and format our code. These will be run in a pre-commit hook, but you can also setup your IDE to run them on save.

### Commit messages and PR titles

We use [conventional commits](https://www.conventionalcommits.org/) to format our commit messages. This allows us to automatically generate changelogs and version bumps.

When opening a Pull Request (PR), please make sure that the title is properly prefixed with one of the following type: `feat`, `fix`, `docs`, `test`, `ci`, `refactor`, `perf`, `chore` or `revert`.

### Test your code

We encourage you to write tests, whether they are unit tests or end-to-end tests. They will give us the confidence that the plugin behaves as intended and help us capture any regression early.

For end-to-end testing (E2E), please have a look at our [E2E testing documentation](../e2e/README.md).

## Common problems & solutions

...
