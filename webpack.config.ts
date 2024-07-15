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

  const swcLoaderJsc = (swcLoader?.use as any).options.jsc;

  // required
  swcLoaderJsc.baseUrl = path.join(process.cwd(), 'src');

  // Decorators are only used in src/shared/components/FlameGraph/components/infrastructure/PprofRequest.ts
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
      extensions: ['.ts', '.tsx', '.js', '.json'],
      alias: {
        '@shared': path.resolve(__dirname, './src/shared'),
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
  });
};

export default config;
