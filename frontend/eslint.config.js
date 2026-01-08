import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import path from 'path';
import { fileURLToPath } from 'url';
import prettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: path.resolve(__dirname, './tsconfig.json'),
        },
      },
    },
  },
  { ignores: ['dist', '*.config.js', '*.config.ts'] },
  ...compat.extends('airbnb', 'airbnb/hooks'),
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Allow TypeScript file extensions in imports
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
        },
      ],
      // Allow React to be imported automatically (React 17+)
      'react/react-in-jsx-scope': 'off',
      // Allow JSX in .tsx files
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
      // Allow devDependencies in config files
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.config.{ts,js,mjs}',
            '**/*.setup.{ts,js}',
            '**/__tests__/**',
            '**/tests/**',
          ],
        },
      ],
      // Allow dangling underscores for __dirname, __filename
      'no-underscore-dangle': ['error', { allow: ['__dirname', '__filename'] }],
      'react/require-default-props': 'off',
    },
  },
  prettier,
];
