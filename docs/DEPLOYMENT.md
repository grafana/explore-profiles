# Deploying the Grafana Pyroscope App Plugin

## Automatic Releases

### Dev environment

Every time a pull request gets merged into the `main` branch, the code gets deployed to the dev environment (e.g. https://firedev001.grafana-dev.net/).

It takes usually ~30m for the release to be deployed by the [stack-state-service](https://github.com/grafana/stack-state-service) to all Grafana instances.

> [!NOTE]
> Sometimes Drone does not pick up new commits on `main` branch. When that happens, you can manually trigger a build from [the Drone UI](https://drone.grafana.net/grafana/pyroscope-app-plugin/branches):

<img width="1189" alt="Screenshot_2023-11-06_at_12_06_57_PM" src="https://github.com/grafana/pyroscope-app-plugin/assets/662636/f21d1763-e1aa-41cd-8317-75eddad68b67">

### Prod / ops environments

Every week on Monday a new branch off of `main` gets created: `weekly/fxx`.

Each commit on that branch gets tagged with a tag `weekly/fxx-yyyyyyyy` where `xx` is the week number and `yyyyyyyy` is a short git SHA.

Every time you push to that branch a Slack bot sends a message to the [#pyroscope-ops](https://app.slack.com/client/T02S4RCS0/C04TRP742NN) channel with a link to the corresponding ["phlare-cd" Argo workflow](https://argo-workflows.grafana.net/workflows/phlare-cd?limit=50).

After an approval from someone from `@pyroscope-secondary-oncall` on Slack, a pull request is opened in the [deployment_tools](https://github.com/grafana/deployment_tools/) repo, and that informs [stack-state-service](https://github.com/grafana/stack-state-service) to update the plugin everywhere.

Note that it takes time for the release to be deployed to all Grafana instances.

## Manual Releases

### Manual release to a specific dev instance (e.g. for testing purposes)

#### When the artefacts (.zip files) have already been published to Google Cloud Storage

Use the corresponding commit SHA to execute:

```shell
gcom-dev /instances/[instance name]/provisioned-plugins/grafana-pyroscope-app -d version=[commit SHA]
```

#### When the artefacts (.zip files) have not been published to Google Cloud Storage

Tag the commit you want to deploy, e.g.:

```shell
git tag v0.0.42-qa-remove-modal 3ae97fb
```

This will trigger a [Drone pipeline](https://drone.grafana.net/grafana/pyroscope-app-plugin) that will build the artefacts and publish them to GCS.

They will be accessible via an URL which looks like `https://storage.googleapis.com/grafana-pyroscope-app/releases/grafana-pyroscope-app-[commit SHA].zip`

Once published, use the corresponding commit SHA to execute:

```shell
gcom-dev /instances/[instance name]/provisioned-plugins/grafana-pyroscope-app -d version=[commit SHA]
```

### Manual release to prod / ops

To release something sooner than Monday, follow these **9 simple steps**:

1. Run the `create_version_tag` script:

   ```shell
   chmod +x ./scripts/create_version_tag
   ./scripts/create_version_tag
   ```

   This will increment and push the newest tag to github

2. [Go to Drone CI](https://drone.grafana.net/grafana/pyroscope-app-plugin)

3. Find the latest **versioned build** on main branch. Make sure it's a `v*.*.*` build. E.g:

   ![Screenshot 2023-10-23 at 11 59 20 AM](https://github.com/grafana/pyroscope-app-plugin/assets/662636/90c12fd0-e6e4-44b1-ade7-225b487661ed)

4. Click on that build, you should get redirected to the Drone build page

5. In the top right corner click, the three dots button and select `Promote`:

   ![image](https://github.com/grafana/pyroscope-app-plugin/assets/23323466/f8664c95-3c5a-4666-b00a-917b767e0c3c)

6. Select `Target`: specify `ops`, `prod` or `opsprod` for both and click on the `Deploy` button.

7. Wait for the release to be deployed ; monitor the [#pyroscope-ops](https://raintank-corp.slack.com/archives/C04TRP742NN) Slack channel. **Be sure to click the workflow posted in the slack channel**:

   <img width="390" alt="image" src="https://github.com/grafana/pyroscope-app-plugin/assets/23323466/7303134d-0de0-4280-b735-e448dc144d08">

8. On the Argo page, click on the `RESUME` or ÀPPROVE PROD` button to complete the workflow:

   ![image](https://github.com/grafana/pyroscope-app-plugin/assets/23323466/e0d428a5-de7e-4e31-802f-d14f92dd462b)

9. 🎉Congrats🎉 You should see this in Argo:

   <img width="213" alt="image" src="https://github.com/grafana/pyroscope-app-plugin/assets/23323466/11f83017-fbc8-48e7-af56-477ca5929cf2">

   And a confirmation in the [#pyroscope-ops](https://raintank-corp.slack.com/archives/C04TRP742NN) Slack channel.

## admin-\* instances

`admin-\* instances`, such as https://admin-ops-us-east-0.grafana-ops.net/grafana/a/grafana-pyroscope-app/single **are provisioned separately from everything else**.

They don't use `gcom`, `hosted-grafana` or `stack-state-service` and are typically on the latest commit from main branch.

## Resources

Here are some source code for existing app plugins and other related documentation:

- [Basic app plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/app-basic#readme)
- [Plugin.json documentation](https://grafana.com/docs/grafana/latest/developers/plugins/metadata/)
- [How to sign a plugin?](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/)
