---
description: Access or install Explore Profiles.
canonical: https://grafana.com/docs/grafana/latest/explore/simplified-exploration/profiles/access/
keywords:
  - Install
  - Configure
  - Explore Profiles
title: Access or install Explore Profiles
menuTitle: Access or install
weight: 150
refs:
  pyroscope-data-source:
    - pattern: /docs/grafana/
      destination: /docs/grafana/<GRAFANA_VERSION>/datasources/pyroscope/
    - pattern: /docs/grafana-cloud/
      destination: /docs/grafana-cloud/connect-externally-hosted/data-sources/pyroscope/
---

# Access or install Explore Profiles

Explore Profiles is a native Grafana application designed to integrate seamlessly with [Pyroscope](https://github.com/grafana/pyroscope), the open source continuous profiling platform, providing a smooth, queryless experience for browsing and analyzing profiling data.

You can use Explore Profiles in Grafana Cloud or with Grafana open source stand-alone.

## Before you begin

To use Explore Profiles with Grafana Cloud, you need:

- A Grafana Cloud account
- A Grafana stack in Grafana Cloud with a configured Hosted profiles or [Pyroscope data source](ref:pyroscope-data-source)

To use Explore Profiles with Grafana open source, you need:

- Your own Grafana instance
- A configured [Pyroscope data source](ref:pyroscope-data-source)
- The [Explore Profiles plugin](https://grafana.com/grafana/plugins/grafana-pyroscope-app/)

## Install the Explore Profiles plugin

Explore Profiles is distributed as a Grafana Plugin. You can find it in the official [Grafana Plugin Directory](https://grafana.com/grafana/plugins/grafana-pyroscope-app/).

{{< admonition type="note" >}}
All Grafana Cloud instances come with the Explore Profiles plugin preinstalled.
{{< /admonition >}}

### Install in your Grafana instance

You can install Explore Profiles in your own Grafana instance using `grafana-cli`:

```shell
grafana-cli plugins install grafana-pyroscope-app
```

Alternatively, follow these steps to install Explore Profiles in Grafana:

1. In Grafana, go to **Administration** > **Plugins and data** > **Plugins**.
2. Search for "Explore Profiles".
3. Select Explore Profiles.
4. Click **Install**

The plugin is automatically activated after installation.

### Install using environment variables

If you want to install the app in a Docker container, you need to configure the following environment variable:

```shell
GF_INSTALL_PLUGINS=grafana-pyroscope-app
```
