# Explore Profiles

Explore Profiles is a native Grafana application designed to integrate seamlessly with [Pyroscope](https://github.com/grafana/pyroscope), the open-source continuous profiling platform, providing a smooth, query-less experience for browsing and analyzing profiling data.

## Install Explore Profiles

Explore Profiles is distributed as a Grafana Plugin. You can find it in the official [Grafana Plugin Directory](https://grafana.com/grafana/plugins/grafana-pyroscope-app/).

### Install in [Grafana Cloud](https://grafana.com/products/cloud/)

All Grafana Cloud instances come with Explore Profiles plugin preinstalled.

### Installation in your Grafana instance

You can install Explore Profiles in your own Grafana instance using `grafana-cli`:

```shell
grafana-cli plugins install grafana-pyroscope-app
```

Alternatively, you can do it via Grafana UI by following these steps:

1. Within Grafana, go to Administration > Plugins and data > Plugins.
2. Search for "Explore Profiles".
3. Click on "Explore Profiles".
4. Click on "Install" button.

### Install using environment variables

If you want to install the app in a docker container, you need to configure the following environment variable:

```shell
GF_INSTALL_PLUGINS=grafana-pyroscope-app
```

## Getting Started

1. In the main navigation bar, click on Explore > Profiles.
2. You’ll land in the service overview page that shows time series and CPU utilization visualizations for all the services in your selected Pyroscope instance.
3. Change your data source with the drop-down on the top left.
4. Modify your time range in two ways:
  * Use the standard time range picker on the top right.
  * Click and drag the time range you want to see on any time series visualization.
8. Select the service you would like to explore. This takes you to the Service page.
9. Filter profiles based on labels.

For more information, refer to the Explore Profiles documentation in [Grafana](https://grafana.com/docs/grafana/latest/explore/simplified-exploration/profiles/) or [Grafana Cloud](https://grafana.com/docs/grafana-cloud/visualizations/simplified-exploration/profiles/). 

To learn more about contributing to the documentation, refer to the [README](https://github.com/grafana/explore-profiles/blob/main/docs/README.md). 
The Explore Profiles documentation source files are in docs/sources. 

### Development / Contributing

Check out our [Contributing Guidelines](./docs/CONTRIBUTING.md) for more information on how to contribute to this project.
