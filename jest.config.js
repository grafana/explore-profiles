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
    // the PprofRequest class uses decorators - FIXME or don't use them (see coveragePathIgnorePatterns below)
    'PprofRequest.ts',
  ],
  resetMocks: true,
  clearMocks: true,
  resetModules: true,
  collectCoverageFrom: ['./src/**'],
  coveragePathIgnorePatterns: [
    // the PprofRequest class uses decorators - FIXME or don't use them (see transformIgnorePatterns above)
    'PprofRequest.ts',
  ],
  coverageReporters: ['json-summary', 'text', 'text-summary'],
};
