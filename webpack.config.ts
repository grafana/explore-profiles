// webpack.config.ts
import * as path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import type { Configuration, RuleSetRule } from 'webpack';
import { merge } from 'webpack-merge';

import grafanaConfig from './.config/webpack/webpack.config';

const config = async (env): Promise<Configuration> => {
  const baseConfig = (await grafanaConfig(env)) as any;

  // Customize swc-loader
  const swcLoader = baseConfig.module.rules.find((rule: { use: { loader: string } }) => {
    return rule.use.loader === 'swc-loader';
  }) as RuleSetRule;

  // Ignore everything except (pyroscope-pyroscope | phlare), since it's used as if it was local code
  swcLoader.exclude = /node_modules\/(?!grafana-pyroscope|phlare).*/;

  const swcLoaderJsc = (swcLoader?.use as any).options.jsc;

  // required
  swcLoaderJsc.baseUrl = path.join(process.cwd(), 'src');

  // Decorators are only used in pyroscope/public/app/components/ExportData.tsx
  swcLoaderJsc.parser.decorators = true;

  // Don't minified React component names in devtools
  // swcLoaderJsc.keepClassNames = env.development;

  // Customize CopyWebpackPlugin
  // to prevent JSON files used in tests to appear in the build artefacts
  // among them, there might be (e.g.) some "plugin.json" files used that the platform would try to load
  const copyPlugin = baseConfig.plugins.find((p) => p instanceof CopyWebpackPlugin);
  if (!copyPlugin) {
    throw 'Webpack CopyPlugin not found! Please check .config/webpack/webpack.config.ts and adjust this configuration.';
  }

  const jsonPattern = copyPlugin.patterns.find(({ from }) => from === '**/*.json');
  if (!jsonPattern) {
    throw 'Cannot find a JSON entry in the Webpack CopyPlugin! Please check .config/webpack/webpack.config.ts and adjust this configuration.';
  }

  jsonPattern.filter = (filepath) => !filepath.includes('__tests__');

  // Final config
  return merge(baseConfig, {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json', '.svg'],
      alias: {
        // More specific rules first

        '@pyroscope/services/base': path.resolve(__dirname, './src/overrides/services/base'),

        '@pyroscope/util/history': path.resolve(__dirname, './src/overrides/util/history'),

        '@pyroscope/hooks/util/determineDefaultApp': path.resolve(
          __dirname,
          './src/overrides/hooks/util/determineDefaultApp'
        ),

        '@pyroscope/components/TagsBar': path.resolve(__dirname, './src/overrides/components/TagsBar/index.tsx'),
        '@pyroscope/components/Toolbar': path.resolve(__dirname, './src/overrides/components/Toolbar'),
        '@pyroscope/components/TimelineChart/TimelineChartWrapper': path.resolve(
          __dirname,
          './src/overrides/components/TimelineChart/TimelineChartWrapper'
        ),

        '@pyroscope/components/ChartTitle': path.resolve(__dirname, './src/overrides/components/ChartTitle'),
        '@pyroscope/components/Panel': path.resolve(__dirname, './src/overrides/components/Panel'),
        '@pyroscope/pages/PageContentWrapper': path.resolve(__dirname, './src/overrides/pages/PageContentWrapper'),
        '@pyroscope/pages/tagExplorer/components/TotalSamplesChart/PieChart': path.resolve(
          __dirname,
          './src/overrides/pages/tagExplorer/components/TotalSamplesChart/PieChart'
        ),
        '@pyroscope/ui/Box': path.resolve(__dirname, './src/overrides/ui/Box'),

        '@pyroscope/components/FlameGraphWrapper': path.resolve(
          __dirname,
          './src/overrides/components/FlameGraphWrapper'
        ),

        // General rules later
        '@pyroscope': path.resolve(__dirname, './node_modules/grafana-pyroscope/public/app'),

        // Otherwise we may end up using zod from pyroscope-pyroscope, which is an older version
        zod: path.resolve(__dirname, './node_modules/zod'),
      },
    },
    module: {
      rules: [
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
  });
};

export default config;
