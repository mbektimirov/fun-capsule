module.exports = {
  settings: {
    'import/resolver': {
      node: {
        paths: ['node_modules', './src', './src/scss'],
      },
    },
  },
  parser: 'babel-eslint',
  extends: [
    'standard',
    'plugin:import/errors', // https://github.com/benmosher/eslint-plugin-import
    'plugin:import/warnings',
    'plugin:react/recommended',
  ],
  plugins: ['standard', 'import', 'prettier', 'react'],
  rules: {
    strict: 0,
    'prettier/prettier': 'error',
    'no-console': 'off',
    'no-unused-vars': 1,
    'import/prefer-default-export': 'off',
    'no-fallthrough': ['error', { commentPattern: 'break[\\s\\w]*omitted' }],
    'comma-dangle': 0,
    'import/default': 2,
    'import/export': 2,
    'import/exports-last': 0,
    'import/first': 2,
    'import/named': 2,
    'import/namespace': 2,
    'import/newline-after-import': 2,
    'import/no-absolute-path': 2,
    'import/no-duplicates': 2,
    'import/no-extraneous-dependencies': 0,
    'import/no-self-import': 2,
    'import/no-unresolved': 2,
    'import/order': [
      'error',
      {
        groups: [['builtin', 'external']],
      },
    ],
    indent: 0,
    'no-use-before-define': ['error', { functions: true, classes: true }],
    semi: [1, 'always'],
    'space-before-function-paren': 0,
    'standard/computed-property-even-spacing': 0,
    'generator-star-spacing': ['error', { before: false, after: true }],
    camelcase: 0,
  },
  env: {
    browser: true,
    es6: true,
    node: true,
    jasmine: true,
  },
  globals: {
    window: true,
    console: true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018,
  },
};
