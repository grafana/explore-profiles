# Pyroscope app plugin

![Screenshot 2023-05-10 at 11-06-45 Diff process_cpu cpu nanoseconds cpu nanoseconds{pyroscope_app simple golang app function slow } and process_cpu cpu nanoseconds cpu nanoseconds{pyroscope_app simple golang app function fast } Pyroscope](https://github.com/grafana/pyroscope-app-plugin/assets/23323466/f2a440ec-3d36-49a4-a9f7-a80d7f6fb86f)

## What are Grafana app plugins?

App plugins can let you create a custom out-of-the-box monitoring experience by custom pages, nested datasources and panel plugins.

## Running Pyroscope App plugin locally for development

First, download the frontend dependencies and ensure they are up to date:

```
yarn
```

- This will have to be re-executed any time the `package.json` dependencies have been altered (possibly through a recent call to `git pull`).

Then, build and watch the frontend code:

```
yarn dev
```

- This will be an ongoing webpack process which you will want to keep running, so use a separate
  terminal for the subsequent steps.

Then, make sure the backend plugin is built for all the architectures:

```
mage
```

Finally, run the server using docker-compose:

```
yarn server
```

- This includes a local Grafana, Pyroscope, and some example services (`rideshare`) to generate and transmit profile data to
  your local Pyroscope.
- See the [Docker](./docker-compose.yaml) configuration for more detail on the configured services.

Then go to `localhost:3000` to connect to Grafana.

- It may take a while for the Grafana service to ramp up; observing the terminal output will indicate
  that Grafana is ready when only `rideshare` log messages are being generated.

The plugin can be found by expanding the Grafana _Home_ menu, expanding _Observability_ to reveal _Profiles_.
Click on _Profiles_.
The direct URL of the plugin is `http://localhost:3000/a/grafana-pyroscope-app/`

- The pyroscope web app will also be accessible via `http://localhost:4100` as per the `pyroscope` configuration
  in the [docker-compose](./docker-compose.yaml) file. This may be a useful way of quickly comparing what the Pyroscope web app looks like (at least according to built code in the docker image that is running).

- Note that any changes to the plugin backend code will require running `mage` again to keep the binary up to date.
  It may be necessary to also run `yarn server` again to ensure the updated binary has taken effect, unless
  the old binary's process can be terminated in the `grafana` docker image.

### Pyroscope Respository as a Dependency

In order to make use of Pyroscope code, this project's [package.json](../../package.json)
file defines `grafana-pyroscope` as a dependency,
citing the [Pyroscope github repository](https://github.com/grafana/pyroscope.git)
and a specific commit hash.

E.g.,

```json
{
  ...
  "dependencies": {
    ...
    "grafana-pyroscope": "git+https://github.com/grafana/pyroscope.git#802ff4fafea4d460bf81abb5fae2c80ecc874969",
    ...
  },
...
}
```

The commit hash is the alphanumeric string following the `#` character,
and needs to be manually updated whenever we want this app plugin
to refer to a newer version of the underlying pyroscope code.

It is also possible to refer to a "work in progress" branch if it is pushed
to the [Pyroscope github repository](https://github.com/grafana/pyroscope.git),
perhaps as a Draft PR. This is an effective co-development strategy of making changes to the
underlying Pyroscope code as well as a local copy of the Pyroscope App code,
and seeing how they affect each other.

After updating this hash, the `yarn` command _must_ be repeated to
ensure that the specified dependency version is downloaded.
Any files from the [Pyroscope repository](https://github.com/grafana/pyroscope.git)
can be accessed through `./node_modules/grafana-pyroscope`.

E.g,

```
$ ls node_modules/grafana-pyroscope/
api                 go.sum                                operations
CHANGELOG.md        GOVERNANCE.md                         package.json
cmd                 go.work                               pkg
CODE_OF_CONDUCT.md  go.work.sum                           public
CODEOWNERS          images                                README.md
cypress             jest.config.js                        scripts
cypress.config.ts   jest-css-modules-transform-config.js  setupAfterEnv.ts
docs                LICENSE                               svg-transform.js
ebpf                LICENSING.md                          tools
examples            MAINTAINERS.md                        tsconfig.json
globalSetup.js      Makefile                              tsconfig.test.json
globalTeardown.js   node_modules                          yarn.lock
go.mod              og
```

### Overriding Pyroscope Code

This repository imports from the [Pyroscope](https://github.com/grafana/pyroscope) project but overrides specific code files.
To learn more about how this arrangement works, and how to develop with it, see
the [Overrides Guide](./src/overrides/README.md).

### Use production data locally

To run with production data locally you will need to update [this file](https://github.com/grafana/pyroscope-app-plugin/blob/main/provisioning/plugins/app.yaml) with values from the stacks page.

For example, to run with data from ops get an api key from https://admin.grafana-ops.com/ and paste the corresponding values in
![image](https://github.com/grafana/pyroscope-app-plugin/assets/23323466/abcbed56-360c-48d4-a0a7-4dc0a7a1e900)

## Release / Deployment Process

### Dev environment

Every time something gets merged into `main` branch it gets deployed to [dev environment](https://firedev001.grafana-dev.net/). Note that it takes time for the release to be deployed by `stack-state-service` to all Grafana instances.

### Prod / ops environment

Every week on Monday a new branch off of `main` gets created: `weekly/fxx`. Each commit on that branch gets tagged with a tag `weekly/fxx-yyyyyyyy` where `xx` is the week number and `yyyyyyyy` is a short git sha. Every time you push to that branch a Slack bot sends a message to `#pyroscope-ops` channel with a link to the argo workflow. After an approval from someone from `@pyroscope-secondary-oncall` on slack a PR is opened in `deployment_tools` repo, and that informs [stack-state-service](https://github.com/grafana/stack-state-service) to update the plugin everywhere. Note that it takes time for the release to be deployed by `stack-state-service` to all Grafana instances.

### Manual release to prod / ops

If you need to release something sooner than Monday you can do it manually. Here are the steps:

1. Create a new tag, e.g run `git tag v0.0.15`
2. Push the tag to github, e.g run `git push --tags origin v0.0.15`
3. Wait for Drone CI to finish building the release
4. [Go to Drone CI](https://drone.grafana.net/grafana/pyroscope-app-plugin/branches) and find the latest build on main branch
5. Click on `main` branch. You should get to the Drone build page
6. In the top right corner click the three dots button and select `Promote`
![image](https://github.com/grafana/pyroscope-app-plugin/assets/23323466/f8664c95-3c5a-4666-b00a-917b767e0c3c)

7. Specify "`ops`" or "`prod`" for `Target`. Click `Deploy` button
8. Wait for the release to be deployed. Monitor `#pyroscope-ops` channel on Slack for a confirmation message from Argo.

Below you can find source code for existing app plugins and other related documentation.

- [Basic app plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/app-basic#readme)
- [Plugin.json documentation](https://grafana.com/docs/grafana/latest/developers/plugins/metadata/)
- [How to sign a plugin?](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/)
