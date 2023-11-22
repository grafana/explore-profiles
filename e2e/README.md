# End-to-end testing

- The tests are located in the `e2e/tests` folder.
- [Playwright fixtures](https://playwright.dev/docs/test-fixtures) (like page objects), are in the `e2e/fixtures` folder.

We provide several configurations in the `e2e/config` folder, depending:

- where the tests should be launched (local or CI),
- against which environment they should be launched (local host, dev, ops or prod).

## Develop tests locally

### Setup, only once

Install Playwright with Chromium:

```shell
yarn e2e:prepare
```

To launch the tests against your local environment, set these variables in the `.env` file:

```shell
E2E_BASE_URL=http://localhost:3000
E2E_USERNAME=user
E2E_PASSWORD=pass
```

To launch the tests against a non-local environment (dev, ops, prod):

- Open 1Password
- Search for "E2E Pyroscope", choose the enviroment you want to target
- Add these values to the `.env` file

By doing so, an [authentication step](https://playwright.dev/docs/auth) will automatically be added before launching the tests.

### Each time you want to develop a new test

Start the app, in one terminal window:

```shell
yarn && yarn dev
```

And in another terminal tab:

```shell
yarn server:static
```

Run the tests in interactive UI mode (with a built-in watch mode), for instance, against the local environment:

```shell
yarn e2e:local:watch
```

You can also run the [code generator](https://playwright.dev/docs/codegen#running-codegen):

```shell
yarn e2e:codegen
```

Enjoy :)

### CI build

_TODO_
