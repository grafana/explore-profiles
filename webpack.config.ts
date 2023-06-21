// webpack.config.ts
import type { Configuration, RuleSetRule } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';
import * as path from 'path';

const config = async (env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  const swcLoader = baseConfig.module.rules.find((rule: { use: { loader: string } }) => {
    return rule.use.loader === 'swc-loader';
  }) as RuleSetRule;

  // TODO:
  // Disable swc loader, since react-svg-spinner was erroring with
  // ERROR in ../node_modules/react-svg-spinner/index.js 16:10
  // Module parse failed: Comma is not permitted after the rest element (16:10)
  // You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
  // |   thickness,
  // |       size,
  // >   ...props,
  // | }) =>
  //
  // which is a valid error, but let's deal with this later
  swcLoader.test = '//';

  return merge(baseConfig, {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json', '.svg'],
      alias: {
        // More specific rules first
        '@webapp/util/baseurl': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/util/baseurl'
        ),

        '@webapp/components/ExportData': path.resolve(__dirname, './src/overrides/components/ExportData'),
        '@webapp/components/TimelineChart/ContextMenu.plugin': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/components/TimelineChart/ContextMenu.plugin'
        ),
        // TODO: go back to phlare's once React is imported in every file there
        '@webapp/components/AppSelector/Label': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/components/AppSelector/Label'
        ),
        '@webapp/components/AppSelector': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/components/AppSelector/AppSelector'
        ),
        '@webapp/components/Toolbar': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/components/Toolbar'
        ),

        '@webapp/models/query': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/models/query'
        ),
        '@webapp/models/app': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/models/app'
        ),
        '@webapp/services/render': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/services/render'
        ),
        '@webapp/services/base': path.resolve(__dirname, './src/overrides/services/base'),
        // Reuse phlare's tags service, since url is different from og pyroscope
        '@webapp/services/tags': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/services/tags'
        ),
        // Reuse phlare's apps service, since url is different from og pyroscope
        '@webapp/services/apps': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/overrides/services/apps'
        ),

        '@phlare/util/history': path.resolve(__dirname, './src/overrides/util/history'),

        // Reuse Phlare's store
        '@webapp/redux/store': path.resolve(__dirname, './node_modules/grafana-pyroscope/public/app/redux/store'),
        '@webapp/redux/reducers/tenant': path.resolve(
          __dirname,
          './node_modules/grafana-pyroscope/public/app/redux/reducers/tenant'
        ),

        // Less specific rules last
        '@pyroscope/webapp': path.resolve(__dirname, './node_modules/pyroscope-oss/webapp'),
        '@pyroscope/flamegraph': path.resolve(__dirname, './node_modules/pyroscope-oss/packages/pyroscope-flamegraph'),
        '@pyroscope/models': path.resolve(__dirname, './node_modules/pyroscope-oss/packages/pyroscope-models'),

        '@webapp': path.resolve(__dirname, './node_modules/pyroscope-oss/webapp/javascript'),
        '@phlare': path.resolve(__dirname, './node_modules/grafana-pyroscope/public/app'),

        // Otherwise we may end up using zod from pyroscope-oss, which is an older version
        zod: path.resolve(__dirname, './node_modules/zod'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)x?$/,
          // Ignore everything except (pyroscope-oss | phlare), since it's used as if it was local code
          exclude: /node_modules\/(?!pyroscope-oss|grafana-pyroscope|phlare).*/,
          use: [
            {
              loader: 'esbuild-loader',
              options: {
                loader: 'tsx',
                target: 'es2015',
              },
            },
          ],
        },

        // SVG
        {
          test: /\.svg$/,
          use: [
            {
              loader: 'react-svg-loader',
              options: {
                svgo: {
                  plugins: [{ convertPathData: { noSpaceAfterFlags: false } }, { removeViewBox: false }],
                },
              },
            },
          ],
        },
      ],
    },
  });
};

export default config;
