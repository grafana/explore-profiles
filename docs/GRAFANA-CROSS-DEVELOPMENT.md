# Developing the Pyroscope app plugin with a local version of Grafana

In some cases, you might want to:

- modify some core Grafana components or
- test some hypothesis on the plugin that require modifying the platform code,
- etc.

This section describes how you can set up your local development environment to work **both on the plugin and on Grafana code bases**.

> [!NOTE]
> This document provides instructions for Unix environments. Any contribution to help covering Windows environments is more than welcome :)

## Requirements

1. Ensure that your local version of the plugin is properly [set up](./CONTRIBUTING.md)
2. Check out a local copy of Grafana:

   ```shell
   git clone https://github.com/grafana/grafana
   ```

3. Setup your local Grafana development environment by following [Grafana's Developer's guide](https://github.com/grafana/grafana/blob/HEAD/contribute/developer-guide.md).

## Setup, only once

### Define some environments variables

In a terminal:

```shell
# path to Grafana's local copy
GRAFANA_DIR=~/path/to/grafana
# path to the plugin's local copy
PYROSCOPE_APP_DIR=~/path/to/the/pyroscope-app-plugin
```

### Provision Grafana with the plugin

By default, Grafana will search for its plugins in this directory:
`$GRAFANA_DIR/data/plugins`.

As it may not exist, let's create it:

```shell
mkdir -pv $GRAFANA_DIR/data/plugins
```

Then we provide a plugin's configuration file:

```shell
cp $PYROSCOPE_APP_DIR/samples/provisioning-remote/plugins/app.yaml $GRAFANA_DIR/conf/provisioning/plugins/pyroscope-app.yaml
```

And finally we create a [symbolic link](https://www.freecodecamp.org/news/symlink-tutorial-in-linux-how-to-create-and-remove-a-symbolic-link/) named `pyroscope-app` to the `dist` folder of the plugin:

```shell
cd $GRAFANA_DIR/data/plugins
ln -s $PYROSCOPE_APP_DIR/dist pyrosope-app
```

## Development

Start Grafana:

```shell
cd $GRAFANA_DIR
yarn start
```

In a different terminal tab, start the plugin:

```shell
cd $PYROSCOPE_APP_DIR
yarn dev
```

Then visit http://localhost:3000
