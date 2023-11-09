# End-to-end testing

- The tests are located in the `e2e/tests` folder.
- [Playwright fixtures](https://playwright.dev/docs/test-fixtures) (like page objects), are in the `e2e/fixtures` folder.

We've provided several configurations in the `e2e/config` folder, depending:

- where the tests should be launched,
- against which environment they should be launched (local machine, dev, ops or prod).

## Develop tests locally

**Only once**, install Playwright with Chromium:

```shell
yarn e2e:prepare
```

Start the app, in one terminal window:

```shell
yarn && yarn dev
```

And in another terminal tab:

```shell
yarn server:remote
```

Run the tests in interactive UI mode (with a built-in watch mode):

```shell
yarn e2e:local:dev
```

You can also run the [code generator](https://playwright.dev/docs/codegen#running-codegen):

```shell
yarn e2e:codegen
```

Enjoy :)
