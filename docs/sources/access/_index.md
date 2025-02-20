---
description: Access or install Grafana Profiles Drilldown.
canonical: https://grafana.com/docs/grafana/latest/explore/simplified-exploration/profiles/access/
keywords:
  - Install
  - Configure
  - Grafana Profiles Drilldown
title: Access or install Grafana Profiles Drilldown
menuTitle: Access or install
weight: 150
refs:
  pyroscope-data-source:
    - pattern: /docs/grafana/
      destination: /docs/grafana/<GRAFANA_VERSION>/datasources/pyroscope/
    - pattern: /docs/grafana-cloud/
      destination: /docs/grafana-cloud/connect-externally-hosted/data-sources/pyroscope/
---

# Access Grafana Profiles Drilldown

Grafana Profiles Drilldown is a native Grafana application designed to integrate seamlessly with [Pyroscope](https://github.com/grafana/pyroscope), the open source continuous profiling platform, providing a smooth, queryless experience for browsing and analyzing profiling data.

You can use Grafana Profiles Drilldown in Grafana Cloud or in your own Grafana instance.

## Before you begin

To use Grafana Profiles Drilldown with Grafana Cloud, you need:

- A Grafana Cloud account
- A Grafana stack in Grafana Cloud with a configured Hosted profiles or [Pyroscope data source](ref:pyroscope-data-source)

To use Grafana Profiles Drilldown with Grafana open source or Grafana Enterprise, you need:

- Your own Grafana instance
- A configured [Pyroscope data source](ref:pyroscope-data-source)

## Install the Grafana Profiles Drilldown plugin

Grafana Profiles Drilldown is distributed as a Grafana Plugin.
You can find it in the official [Grafana Plugin Directory](https://grafana.com/grafana/plugins/grafana-pyroscope-app/).

{{< admonition type="note" >}}
All Grafana instances come with the Grafana Profiles Drilldown plugin preinstalled.
{{< /admonition >}}
