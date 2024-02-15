export default {
  './package.json': ['prettier-package-json --write'],
  '*.{ts,tsx}': () => ['yarn format:fix', 'yarn lint:fix', 'yarn typecheck'],
  '*.{js,jsx}': ['yarn format:fix', 'yarn lint:fix'],
};
