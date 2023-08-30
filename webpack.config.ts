// webpack.config.ts
import type { Configuration, RuleSetRule } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';
import * as path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

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

        '@pyroscope/services/base': path.resolve(__dirname, './src/overrides/services/base'),

        '@pyroscope/util/history': path.resolve(__dirname, './src/overrides/util/history'),

        '@pyroscope/components/Toolbar': path.resolve(__dirname, './src/overrides/components/Toolbar'),

        '@pyroscope': path.resolve(__dirname, './node_modules/grafana-pyroscope/public/app'),

        // Otherwise we may end up using zod from pyroscope-pyroscope, which is an older version
        zod: path.resolve(__dirname, './node_modules/zod'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)x?$/,
          // Ignore everything except (pyroscope-pyroscope | phlare), since it's used as if it was local code
          exclude: /node_modules\/(?!grafana-pyroscope|phlare).*/,
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
        {
          test: /\.(png|jpe?g|gif)$/,
          type: 'asset/resource',
          generator: {
            publicPath: `public/plugins/grafana-pyroscope-app/img/`,
            outputPath: 'img/',
            filename: Boolean(env.production) ? '[hash][ext]' : '[name][ext]',
          },
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: '**/*.png', to: '.', noErrorOnMissing: true }, // Optional
        ],
      }),
    ],
  });
};

export default config;
