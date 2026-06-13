import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';

// fan-out the FlatCompat configs so we can safely merge all plugin registrations
const fannedVitals = [...nextVitals];
const fannedTs = [...nextTs];

// Collect plugins from all fan-out items to avoid fragile index-based access
const fanPlugins = {
  ...(fannedVitals[0]?.plugins ?? {}),
  ...(fannedVitals[1]?.plugins ?? {}),
  ...(fannedVitals[3]?.plugins ?? {}),
  ...(fannedTs[0]?.plugins ?? {}),
};

const rawConfig = [
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts', 'commitlint.config.*']),
  {
    files: ['**/*.{ts,tsx}', '!src/__tests__/**'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // explicit plugins block: merge fan-out entries so all rules referenced
    // below are resolvable even if the FlatCompat spread order changes
    plugins: {
      ...fanPlugins,
      import: importPlugin,
    },
    rules: {
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      'no-console': ['error', { allow: ['error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['state'] }],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', { max: 10 }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksConditionals: true,
          checksSpreads: true,
          checksVoidReturn: true,
        },
      ],
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'react/no-unescaped-entities': 'error',
      'react/jsx-key': 'error',
    },
  },
];

export default defineConfig(rawConfig);
