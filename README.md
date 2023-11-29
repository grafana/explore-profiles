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

Finally, in a different terminal tab, run the server using docker-compose:

```
yarn server
```

- This includes a local Grafana, Pyroscope, and some example services (`rideshare`) to generate and transmit profile data to
  your local Pyroscope.
- See the [Docker](./docker-compose.yaml) configuration for more detail on the configured services.

Then go to [http://localhost:3000](http://localhost:3000) to connect to Grafana.

- It may take a while for the Grafana service to ramp up; observing the terminal output will indicate
  that Grafana is ready when only `rideshare` log messages are being generated.

The plugin can be found by expanding the Grafana _Home_ menu, expanding _Observability_ to reveal _Profiles_.
Click on _Profiles_.

The direct URL of the plugin is [http://localhost:3000/a/grafana-pyroscope-app](http://localhost:3000/a/grafana-pyroscope-app)

- The pyroscope web app will also be accessible via [http://localhost:4100](http://localhost:4100) as per the `pyroscope` configuration
  in the [docker-compose](./docker-compose.yaml) file. This may be a useful way of quickly comparing what the Pyroscope web app looks like (at least according to built code in the docker image that is running).

- Note that any changes to the plugin backend code will require running `mage` again to keep the binary up to date.
  It may be necessary to also run `yarn server` again to ensure the updated binary has taken effect, unless
  the old binary's process can be terminated in the `grafana` docker image.

### Using remote profile data

Instead of profile data from fake applications, you can use real remote data:

- Copy the content of the `.env.local` file to a new `.env` file in the root directory.
- Open 1Password and search for the note named "DB FE - Remote profile data credentials"
- Fill in the missing values
- Launch `yarn dev` in the terminal
- In a different tab, launch `yarn server:remote`

### Using static profile data

To simplify some testing and/or your development workflow, you can also use static profile data:

- If not yet done, unzip [./samples/static/grafana-pyroscope-sample-blocks-public.zip](./samples/static/grafana-pyroscope-sample-blocks-public.zip)
- Launch `yarn dev` in the terminal
- In a different tab, launch `yarn server:static`
- Choose a time range spanning from `2023-11-11 08:55:00` to `2023-11-11 13:05:00`

The data is stored in a public bucket in Google Cloud Storage and can be downloaded via [the gsutil tool](https://cloud.google.com/storage/docs/gsutil):

(_TODO: add doc about gcloud utils installation/deployment tools_)

To update it, type in a terminal:

- `rm -rf ./samples/static/grafana-pyroscope-sample-blocks-public`
- `gsutil -m cp -r gs://grafana-pyroscope-sample-blocks-public/ ./samples/static/`
- `yarn server:static`

Alternatively, if you only want to spin up a new Pyroscope server with this data, you can do it from the folder of your choice:

- `mkdir -p ./my-sample-data`
- `gsutil -m cp -r gs://grafana-pyroscope-sample-blocks-public/ ./my-sample-data/`
- `docker run -t -i -p 4040:4040 -v $(pwd)/my-sample-data/grafana-pyroscope-sample-blocks-public:/data-shared simonswine/pyroscope:main-826665a94 --storage.backend filesystem -querier.max-query-length 3650d --querier.max-query-lookback 3650d`

## End-to-end testing

Our tests are implemented with [Playwright](https://playwright.dev/). Have a look at our [internal documentation](./e2e/README.md).

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

To run with production data locally you will need to update [this file](https://github.com/grafana/pyroscope-app-plugin/blob/main/samples/provisioning/plugins/app.yaml) with values from the stacks page.

For example, to run with data from ops get an api key from https://admin.grafana-ops.com/ and paste the corresponding values in
![image](https://github.com/grafana/pyroscope-app-plugin/assets/23323466/abcbed56-360c-48d4-a0a7-4dc0a7a1e900)

## Release / Deployment Process

### Dev environment

Every time something gets merged into `main` branch it gets deployed to [dev environment](https://firedev001.grafana-dev.net/). Note that it takes time for the release to be deployed by `stack-state-service` to all Grafana instances.

Note: sometimes Drone does not pick up new commits on `main` branch. When that happens, you can manually trigger a build from [this page](https://drone.grafana.net/grafana/pyroscope-app-plugin/branches):
<img width="1189" alt="Screenshot_2023-11-06_at_12_06_57_PM" src="https://github.com/grafana/pyroscope-app-plugin/assets/662636/f21d1763-e1aa-41cd-8317-75eddad68b67">

### Prod / ops environment

Every week on Monday a new branch off of `main` gets created: `weekly/fxx`. Each commit on that branch gets tagged with a tag `weekly/fxx-yyyyyyyy` where `xx` is the week number and `yyyyyyyy` is a short git sha. Every time you push to that branch a Slack bot sends a message to `#pyroscope-ops` channel with a link to the argo workflow. After an approval from someone from `@pyroscope-secondary-oncall` on slack a PR is opened in `deployment_tools` repo, and that informs [stack-state-service](https://github.com/grafana/stack-state-service) to update the plugin everywhere. Note that it takes time for the release to be deployed by `stack-state-service` to all Grafana instances.

### Manual release to prod / ops

If you need to release something sooner than Monday you can do it manually with just **9 simple steps**. Here are the steps:

1. Run the create tag script

```
chmod +x ./scripts/create_version_tag.sh
./scripts/create_version_tag.sh
```

This will increment and push the newest tag to github

2. Wait for Drone CI to finish building the release

3. [Go to Drone CI](https://drone.grafana.net/grafana/pyroscope-app-plugin) and find the latest **versioned** build on main branch. Make sure it's a `v*.*.*` build, e.g:
   ![Screenshot 2023-10-23 at 11 59 20 AM](https://github.com/grafana/pyroscope-app-plugin/assets/662636/90c12fd0-e6e4-44b1-ade7-225b487661ed)

4. Click on that build. You should get to the Drone build page.

5. In the top right corner click the three dots button and select `Promote`
   ![image](https://github.com/grafana/pyroscope-app-plugin/assets/23323466/f8664c95-3c5a-4666-b00a-917b767e0c3c)

6. Specify "`ops`" or "`prod`" or `opsprod` (for both) for `Target`. Click `Deploy` button

7. Wait for the release to be deployed. Monitor [#pyroscope-ops](https://raintank-corp.slack.com/archives/C04TRP742NN) channel on Slack: **Be sure to click the workflow posted in the slack channel**
   <img width="390" alt="image" src="https://github.com/grafana/pyroscope-app-plugin/assets/23323466/7303134d-0de0-4280-b735-e448dc144d08">

8. In argo click "resume" or the "approve prod" button to complete the process
   ![image](https://github.com/grafana/pyroscope-app-plugin/assets/23323466/e0d428a5-de7e-4e31-802f-d14f92dd462b)
9. 🎉Congrats🎉 you should see this in argo and a confirmation in the #pyroscope-ops slack channel
   <img width="213" alt="image" src="https://github.com/grafana/pyroscope-app-plugin/assets/23323466/11f83017-fbc8-48e7-af56-477ca5929cf2">

Below you can find source code for existing app plugins and other related documentation.

- [Basic app plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/app-basic#readme)
- [Plugin.json documentation](https://grafana.com/docs/grafana/latest/developers/plugins/metadata/)
- [How to sign a plugin?](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/)

### admin-* instances

admin-* instances, such as https://admin-ops-us-east-0.grafana-ops.net/grafana/a/grafana-pyroscope-app/single are provisioned separately from everything else (they don't use gcom, hosted-grafana or stack-state-service), and are typically on the latest commit from main branch.

## Common problems & solutions

### The service & profile dropdowns are empty of data

**Symptom:** you see some requests to http://localhost/api/plugins/grafana-pyroscope-app failing (HTTP 500-503) with this response:

```json
{
  "error": "plugin unavailable",
  "message": "Plugin unavailable",
  "traceID": ""
}
```

**Solution:**

- build the backend plugin by executing `mage` in the terminal,
- after the build, check the "dist" folder for files named `gpx_pyroscope_app_*`
- restart the server: `yarn server`
