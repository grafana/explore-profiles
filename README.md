# Pyroscope app plugin

![Screenshot 2023-05-10 at 11-06-45 Diff process_cpu cpu nanoseconds cpu nanoseconds{pyroscope_app simple golang app function slow } and process_cpu cpu nanoseconds cpu nanoseconds{pyroscope_app simple golang app function fast } Pyroscope](https://github.com/grafana/pyroscope-app-plugin/assets/23323466/f2a440ec-3d36-49a4-a9f7-a80d7f6fb86f)

## What are Grafana app plugins?

App plugins can let you create a custom out-of-the-box monitoring experience by custom pages, nested datasources and panel plugins.

## Running Pyroscope App plugin locally for development

First, build and watch the frontend code:

```
yarn dev
```

Then make sure the backend plugin is built for all the architectures:

```
mage
```

Finally, run the server using docker-compose:

```
yarn server
```

Then go to `localhost:3000` and you should see the app plugin there.

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
7. Specify `ops` or `prod` for `Target`. Click `Deploy` button
8. Wait for the release to be deployed. Monitor `#pyroscope-ops` channel on Slack for a confirmation message from Argo.

# Distributing your plugin

When distributing a Grafana plugin either within the community or privately the plugin must be signed so the Grafana application can verify its authenticity. This can be done with the `@grafana/sign-plugin` package.

_Note: It's not necessary to sign a plugin during development. The docker development environment that is scaffolded with `@grafana/create-plugin` caters for running the plugin without a signature._

## Initial steps

Before signing a plugin please read the Grafana [plugin publishing and signing criteria](https://grafana.com/docs/grafana/latest/developers/plugins/publishing-and-signing-criteria/) documentation carefully.

`@grafana/create-plugin` has added the necessary commands and workflows to make signing and distributing a plugin via the grafana plugins catalog as straightforward as possible.

Before signing a plugin for the first time please consult the Grafana [plugin signature levels](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/#plugin-signature-levels) documentation to understand the differences between the types of signature level.

1. Create a [Grafana Cloud account](https://grafana.com/signup).
2. Make sure that the first part of the plugin ID matches the slug of your Grafana Cloud account.
   - _You can find the plugin ID in the plugin.json file inside your plugin directory. For example, if your account slug is `acmecorp`, you need to prefix the plugin ID with `acmecorp-`._
3. Create a Grafana Cloud API key with the `PluginPublisher` role.
4. Keep a record of this API key as it will be required for signing a plugin

## Signing a plugin

### Using Github actions release workflow

If the plugin is using the github actions supplied with `@grafana/create-plugin` signing a plugin is included out of the box. The [release workflow](./.github/workflows/release.yml) can prepare everything to make submitting your plugin to Grafana as easy as possible. Before being able to sign the plugin however a secret needs adding to the Github repository.

1. Please navigate to "settings > secrets > actions" within your repo to create secrets.
2. Click "New repository secret"
3. Name the secret "GRAFANA_API_KEY"
4. Paste your Grafana Cloud API key in the Secret field
5. Click "Add secret"

#### Push a version tag

To trigger the workflow we need to push a version tag to github. This can be achieved with the following steps:

1. Run `npm version <major|minor|patch>`
2. Run `git push origin main --follow-tags`

## Learn more

Below you can find source code for existing app plugins and other related documentation.

- [Basic app plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/app-basic#readme)
- [Plugin.json documentation](https://grafana.com/docs/grafana/latest/developers/plugins/metadata/)
- [How to sign a plugin?](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/)
