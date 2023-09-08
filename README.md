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
7. Specify `ops` or `prod` for `Target`. Click `Deploy` button
8. Wait for the release to be deployed. Monitor `#pyroscope-ops` channel on Slack for a confirmation message from Argo.



Below you can find source code for existing app plugins and other related documentation.

- [Basic app plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/app-basic#readme)
- [Plugin.json documentation](https://grafana.com/docs/grafana/latest/developers/plugins/metadata/)
- [How to sign a plugin?](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/)
