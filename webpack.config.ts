// webpack.config.ts
import * as path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { type Configuration, NormalModuleReplacementPlugin, type RuleSetRule } from 'webpack';
import LiveReloadPlugin from 'webpack-livereload-plugin';
import { merge } from 'webpack-merge';

import grafanaConfig from './.config/webpack/webpack.config';

const config = async (env): Promise<Configuration> => {
  const baseConfig = (await grafanaConfig(env)) as any;

  /* MODULES */

  // Customize swc-loader
  const swcLoader = baseConfig.module.rules.find((rule: { use: { loader: string } }) => {
    return rule.use.loader === 'swc-loader';
  }) as RuleSetRule;

  const swcLoaderJsc = (swcLoader?.use as any).options.jsc;

  // Decorators are only used in src/shared/components/FlameGraph/components/infrastructure/PprofRequest.ts
  swcLoaderJsc.parser.decorators = true;

  /* PLUGINS */

  // Disable Live reload
  baseConfig.plugins = baseConfig.plugins.filter((p) => !(p instanceof LiveReloadPlugin));

  // Customize CopyWebpackPlugin to prevent JSON files used in tests to appear in the build artefacts.
  // Among them, there might be (e.g.) some "plugin.json" files used that the platform would try to load.
  const jsonPattern = baseConfig.plugins
    .find((p) => p instanceof CopyWebpackPlugin)
    .patterns.find(({ from }) => from === '**/*.json');

  if (!jsonPattern) {
    throw 'Cannot find a JSON entry in the Webpack CopyPlugin! Please check .config/webpack/webpack.config.ts and adjust this configuration.';
  }

  jsonPattern.filter = (filepath) => !filepath.includes('__tests__');

  /* FINAL CONFIG */

  const finalConfig = merge(baseConfig, {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      alias: {
        '@shared': path.resolve(__dirname, './src/shared'),
        '@img': path.resolve(__dirname, './src/img'),
      },
    },
    module: {
      rules: [
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
      new NormalModuleReplacementPlugin(
        /react-use\/lib\/usePrevious/,
        path.resolve(__dirname, 'src/shims/react-use-usePrevious-default.js')
      ),
      new NormalModuleReplacementPlugin(
        /react-use\/lib\/useDebounce/,
        path.resolve(__dirname, 'src/shims/react-use-useDebounce-default.js')
      ),
    ],
  });

  return finalConfig;
};

export default config;
