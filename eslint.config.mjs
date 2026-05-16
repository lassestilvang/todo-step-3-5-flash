import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';

console.log('jsx-a11y plugin from nextVitals[0]:', nextVitals[0].plugins['jsx-a11y']);
console.log(
  'jsx-a11y rules:',
  Object.keys(nextVitals[0].plugins['jsx-a11y'].rules || {}).slice(0, 5)
);

const rawConfig = [
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    files: ['**/*.{ts,tsx}', '!src/__tests__/**'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
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
  {
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];

console.log('Config array:');
rawConfig.forEach((c, i) => {
  const plugins = c.plugins ? Object.keys(c.plugins) : [];
  const files = c.files ? c.files.join(', ') : 'none';
  const rules = c.rules ? Object.keys(c.rules) : [];
  console.log(i, 'files:', files, '| plugins:', plugins, '| rules:', rules);
});

export default defineConfig(rawConfig);
