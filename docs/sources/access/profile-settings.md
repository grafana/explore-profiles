---
description: Configure available settings for Explore Profiles.
keywords:
  - pyroscope
  - continuous profiling
  - settings
menuTitle: Profile settings
title: Profile settings
weight: 800
aliases:
  - /docs/grafana-cloud/monitor-applications/profiles/profile-settings/
---

# Profiles settings

The **Profiles settings** page lets you modify flame graph, export, and function details options used for Profiles and [Explore Profiles]().

![The Profiles Settings page](/media/docs/explore-profiles/explore-profiles-settings.png)

| Features                    | Options        | Explanation                                                                                                                                                                                       |
| --------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Collapsed flame graph**   | Default: Off   | When this feature is active, you can collapse flame graphs to minimize their screen space.                                                                                                        |
| **Maximum number of nodes** | Default: 16384 | This number controls the maximum number of nodes, which controls the depth of the flame graph. The higher the number, the more nodes are used in the flame graph. The flame graphs appear longer. |

<!-- Commenting out flamegraph.com
| **Enable flamegraph.com**   | Default: On    | Adds a `flamegraph.com` export option to the **Export flame graph** menu. Flame graphs uploaded to `flamegraph.com` have a publicly accessible URL. Deactivate this option if data privacy is a concern.                                                  |
-->

| **Enable function details** | Default: On | Enables mapping of resource usage to lines of source code. If the [GitHub integration](https://grafana.com/docs/grafana-cloud/monitor-applications/profiles/pyroscope-github-integration/) is configured, then the source code is downloaded from GitHub. |

## Modify settings

To change the settings for Explore Profiles:

1. Sign in to your Grafana instance.
1. Select **Explore** > **Profiles** in the left navigation.
1. Select the **Settings** (gear) icon in the right corner.
   ![Access the Settings by selecting the gear icon](/media/docs/explore-profiles/explore-profiles-settings-icon.png)
1. Change any options as desired.
1. Select **Save settings** to preserve the changes.

<!-- Commented out -- feature disabled for now

## Export flame graphs to flamegraph.com

You can export flame graphs using the **Export** option on any of the flame graph views.

To export a flame graph:

1. View a flame graph in **Explore** > **Profiles**.
1. Select the **Export** icon at the end of the toolbar.
   ![Available export options for the flame graph](/media/docs/grafana-cloud/profiles/profiles-export-flamegraph.png)
1. Choose an export option.
1. Save the file to your system. -->
