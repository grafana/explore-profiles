const { pathsToModuleNameMapper } = require('ts-jest');

// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const { compilerOptions } = require('./tsconfig');

const copyCompilerOptionsPath = {
  ...compilerOptions.paths,
};

// TODO:
// tsconfig.json points to @types/react
// here jest needs the actual code
copyCompilerOptionsPath['react'] = ['./node_modules/react'];

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  moduleNameMapper: pathsToModuleNameMapper(copyCompilerOptionsPath, { prefix: '<rootDir>/' }),
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
    '\\.module\\.(css|scss)$': 'jest-css-modules-transform',
    '\\.(css|scss)$': 'jest-css-modules-transform',
  },

  transformIgnorePatterns: [
    // force us to not transpile these dependencies
    // https://stackoverflow.com/a/69150188
    'node_modules/(?!(true-myth|d3|d3-array|internmap|d3-scale|react-notifications-component|graphviz-react|@grafana|ol|grafana-pyroscope|@react-hook|nanoid))',
  ],
  resetMocks: true,
  clearMocks: true,
  resetModules: true,
  collectCoverageFrom: ['./src/**'],
  coverageReporters: ['json-summary', 'text', 'text-summary'],
};
