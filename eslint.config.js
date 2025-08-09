// Flat ESLint config for ESLint v9+
// Docs: https://eslint.org/docs/latest/use/configure/migration-guide

import js from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // 1) Global ignores (replaces .eslintignore)
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
  },

  // 2) Base recommended rules from ESLint
  js.configs.recommended,

  // 3) Project JS settings and a couple of simple style rules
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
    },
  },

  // 4) Run Prettier as an ESLint rule and surface formatting issues in Problems
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'es5',
          semi: true,
          printWidth: 100,
        },
      ],
    },
  },

  // 5) Disable any ESLint rules that would conflict with Prettier
  prettierConfig,
];
