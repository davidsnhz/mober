const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'docs/*', 'node_modules/*'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // TypeScript ya comprueba los miembros de un espacio de nombres importado.
      'import/namespace': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]);
