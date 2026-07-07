// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const { compilerOptions } = require('./tsconfig');

/** Maps tsconfig `paths` entries to Jest `moduleNameMapper` (replaces ts-jest helper). */
function pathsToModuleNameMapper(paths, { prefix = '' } = {}) {
  return Object.entries(paths).reduce((mapper, [from, to]) => {
    const [target] = Array.isArray(to) ? to : [to];
    const normalizedTarget = target.replace(/^\.\//, '');
    const jestPattern = `^${from.replace(/\*/g, '(.*)')}$`;
    mapper[jestPattern] = `${prefix}${normalizedTarget.replace(/\*/g, '$1')}`;
    return mapper;
  }, {});
}

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
  testEnvironment: '<rootDir>/.config/jest/ProfilesDrilldownJsdomEnvironment.js',
  testEnvironmentOptions: {
    url: 'http://localhost:3000/',
  },
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
