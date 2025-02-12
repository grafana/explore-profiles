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

# Access Explore Profiles

Explore Profiles is a native Grafana application designed to integrate seamlessly with [Pyroscope](https://github.com/grafana/pyroscope), the open source continuous profiling platform, providing a smooth, queryless experience for browsing and analyzing profiling data.

You can use Explore Profiles in Grafana Cloud or in your own Grafana instance.

## Before you begin

To use Explore Profiles with Grafana Cloud, you need:

- A Grafana Cloud account
- A Grafana stack in Grafana Cloud with a configured Hosted profiles or [Pyroscope data source](ref:pyroscope-data-source)

To use Explore Profiles with Grafana open source or Grafana Enterprise, you need:

- Your own Grafana instance
- A configured [Pyroscope data source](ref:pyroscope-data-source)

## Install the Explore Profiles plugin

Explore Profiles is distributed as a Grafana Plugin.
You can find it in the official [Grafana Plugin Directory](https://grafana.com/grafana/plugins/grafana-pyroscope-app/).

{{< admonition type="note" >}}
All Grafana instances come with the Explore Profiles plugin preinstalled.
{{< /admonition >}}
