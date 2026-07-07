import '@testing-library/jest-dom';

declare global {
  // Set in ProfilesDrilldownJsdomEnvironment.setup() (jsdom.reconfigure wrapper).
  // eslint-disable-next-line no-var
  var setWindowLocation: (value: URL | Partial<Location>) => void;
}

export {};
