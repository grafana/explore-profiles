---
description: Access or install Explore Profiles.
keywords:
  - Install
  - Configure
  - Explore Profiles
title: Access or install Explore Profiles
menuTitle: Access or install
weight: 150
---

# Access or install Explore Profiles

Explore Profiles is a native Grafana application designed to integrate seamlessly with [Pyroscope](https://github.com/grafana/pyroscope), the open-source continuous profiling platform, providing a smooth, query-less experience for browsing and analyzing profiling data.

You can use Explore Profiles in Grafana Cloud or with Grafana open source stand-alone.

## Before you begin

To use Explore Profiles with Grafana Cloud, you need:

* A Grafana Cloud account
* A Grafana stack in Grafana Cloud with a configured Hosted profiles or Pyroscope data source

To use Explore Profiles with Grafana open source, you need:

* Your own Grafana instance
* The [Explore Profiles plugin](https://grafana.com/grafana/plugins/grafana-pyroscope-app/)

## Install Explore Profiles

Explore Profiles is distributed as a Grafana Plugin. You can find it in the official [Grafana Plugin Directory](https://grafana.com/grafana/plugins/grafana-pyroscope-app/).

### Install in [Grafana Cloud](https://grafana.com/products/cloud/)

All Grafana Cloud instances come with Explore Profiles plugin preinstalled.

### Installation in your Grafana instance

You can install Explore Profiles in your own Grafana instance using `grafana-cli`:

```shell
grafana-cli plugins install grafana-pyroscope-app
```

Alternatively, you can install Explore Profiles within Grafana by following these steps:

1. Within Grafana, go to Administration > Plugins and data > Plugins.
2. Search for "Explore Profiles".
3. Click on Explore Profiles.
4. Click **Install**

### Install using environment variables

If you want to install the app in a Docker container, you need to configure the following environment variable:

```shell
GF_INSTALL_PLUGINS=grafana-pyroscope-app
```
