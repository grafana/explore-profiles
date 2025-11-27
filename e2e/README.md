# End-to-end testing

- We develop end-to-end tests with [Playwright](https://playwright.dev)
- They are located in the [e2e/tests](./tests) folder.
- [Playwright fixtures](https://playwright.dev/docs/test-fixtures) (like page objects) are in the [e2e/fixtures](./fixtures) folder.

Several configurations are provided in the [e2e/config](./config) folder, depending on:

- where the tests are launched (locally or CI build),
- against which environment they should be launched (local host, dev, ops or prod).

When developing tests locally, we use a [Pyroscope server with static data](../docker-compose.e2e.yaml) (2024-03-13 19:00:00 → 2024-03-13 19:50:00), to have deterministic and predictable tests.

## Develop tests locally

### Setup, only once

Install Playwright with Chromium:

```shell
yarn e2e:local:prepare
```

To launch the tests against your local environment, set these variables in the `.env` file:

```shell
E2E_BASE_URL=http://localhost:3000
E2E_USERNAME=user
E2E_PASSWORD=pass
```

### Each time you want to develop a new test

Start the app, in one terminal window:

```shell
yarn && yarn dev
```

And in another terminal tab, start the server:

```shell
yarn e2e:local:server
```

Run the tests in interactive UI mode (with a built-in watch mode):

```shell
yarn e2e:local:watch
```

You can also run the [code generator](https://playwright.dev/docs/codegen#running-codegen):

```shell
yarn e2e:local:codegen
```

If you write tests that generate screenshots, please read the next section.

### Screenshots testing

When launching the tests locally, the screenshots generated are ignored by Git. They're just a convenience while developing.

In order to generate the correct screenshots that will always match the ones that will be generated during the CI build, **we have to launch Playwright in Docker**:

```shell
yarn e2e:ci:server:up

yarn e2e:ci:prepare
yarn e2e:ci

# then once finished
yarn e2e:ci:server:down
```

The screenshots are generated in subfolders within the [e2e/tests](./tests) folder, next to their corresponding tests. They can be commited to Git.

### Regenerating screenshots

Just pass extra arguments to `yarn e2e:ci`, e.g.:

```shell
yarn e2e:ci single-view.spec.ts --update-snapshots
```

### CI build

In build time (PR and main branch), we run a [Pyroscope server with static data](../docker-compose.e2e.yaml) (2024-03-13 19:00:00 → 2024-03-13 19:50:00). This allows us to launch deterministic and predictable tests.

## FAQ

### The build of my PR has failed, how can I see the test reports?

- On your GitHub PR, next to the `CI / frontend (pull_request)` job, click on `Details`
- On the GitHub actions page, click on `🏠 Summary`
- At the bottom of the page, click on the `e2e-test-reports-and-results` artifact to download it
- Unzip it and open the `test-reports/index.html` page
- Navigate the failing tests to see screenshots and videos of what happened

### The build of my PR has failed because Playwright was just updated, how to fix it?

- Identify the current Playwright version, e.g. `1.46.0`
- Identify the new Playwright version, e.g. `1.47.0`
- In a terminal, execute: `./scripts/upgrade-playwright 1.46.0 1.47.0`
- Update sha for the new version in Dockerfile.plugin.e2e based on https://mcr.microsoft.com/en-us/artifact/mar/playwright
- Launch the E2E tests locally with Docker to verify that the new version works: `yarn e2e:ci:server:up && yarn e2e:ci`
- Push the modified files to the PR
