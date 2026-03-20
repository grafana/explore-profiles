import baseConfig from './.config/eslint.config.mjs';
import jest from 'eslint-plugin-jest';
import sonarjs from 'eslint-plugin-sonarjs';
import tanstackQuery from '@tanstack/eslint-plugin-query';

/** @type {Array<import('eslint').Linter.Config>} */
export default [
  {
    ignores: ['dist/', 'node_modules/', '.config/', 'coverage/', '**/eslint.config.*'],
  },
  ...baseConfig,
  sonarjs.configs.recommended,
  jest.configs['flat/recommended'],
  ...tanstackQuery.configs['flat/recommended'],
  {
    rules: {
      'no-console': ['error', { allow: [''] }],
      'no-unused-vars': 'error',
      'react-hooks/rules-of-hooks': 'off',
      'jest/expect-expect': 'error',
      'jest/valid-title': 'off',
      'sonarjs/cognitive-complexity': ['error', 8],
      'sonarjs/prefer-immediate-return': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/public-static-readonly': 'off',
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/todo-tag': 'off',
      'sonarjs/fixme-tag': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/prefer-regexp-exec': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/no-ignored-exceptions': 'off',
      'sonarjs/link-with-target-blank': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/single-character-alternation': 'off',
      'sonarjs/no-invariant-returns': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
      'sonarjs/concise-regex': 'off',
      'sonarjs/no-misleading-array-reverse': 'off',
      'sonarjs/no-alphabetical-sort': 'off',
      'sonarjs/function-return-type': 'off',
    },
  },
];
