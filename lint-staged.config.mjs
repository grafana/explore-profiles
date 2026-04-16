export default {
  './package.json': ['prettier-package-json --write'],
  '*.{ts,tsx}': () => ['pnpm run format:fix', 'pnpm run lint:fix', 'pnpm run typecheck'],
  '*.{js,jsx}': ['pnpm run format:fix', 'pnpm run lint:fix'],
};
