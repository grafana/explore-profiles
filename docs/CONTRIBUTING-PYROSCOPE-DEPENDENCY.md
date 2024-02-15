# Pyroscope OSS as a dependency

In order to make use of Pyroscope OSS code, this project's [package.json](../../package.json) file defines `grafana-pyroscope` as a dependency,
citing the [Pyroscope GitHub repository](https://github.com/grafana/pyroscope.git)
and a specific commit hash. E.g.:

```jsonc
{
  // ...
  "dependencies": {
    // ...
    "grafana-pyroscope": "git+https://github.com/grafana/pyroscope.git#802ff4fafea4d460bf81abb5fae2c80ecc874969"
    // ...
  }
  // ...
}
```

The commit hash (the alphanumeric string following the `#` character),
needs **to be manually updated whenever we want the app plugin
to refer to a newer version of the underlying Pyroscope code**.

It is also possible to refer to a "work in progress" branch if it is pushed
to the Pyroscope repo (e.g. as a draft pull request).

> [!IMPORTANT]
> After updating this hash, the `yarn` command must be repeated to
> ensure that the specified dependency version is downloaded.

Any files from the [Pyroscope repository](https://github.com/grafana/pyroscope.git)
can be accessed through `./node_modules/grafana-pyroscope`.

### Overriding Pyroscope Code

This repository imports from the Pyroscope code base but overrides specific files.

To learn more about how this arrangement works, and how to develop with it, see
the [Overrides Guide](../src/overrides/README.md).
