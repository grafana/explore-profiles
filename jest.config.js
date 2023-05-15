const { pathsToModuleNameMapper } = require('ts-jest');
const path = require('path');

// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const { compilerOptions } = require('./tsconfig');

const copyCompilerOptionsPath = {
  ...compilerOptions.paths,
};

// tsconfig.json pints to @types/react
// here jest needs the actual code
delete copyCompilerOptionsPath['react'];

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  moduleNameMapper: pathsToModuleNameMapper(copyCompilerOptionsPath, { prefix: '<rootDir>/' }),
};
