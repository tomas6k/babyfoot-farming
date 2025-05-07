module.exports = {
  extends: ['next/core-web-vitals'],
  parserOptions: {
    project: './tsconfig.json',
  },
  settings: {
    next: {
      rootDir: '.',
    },
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
}; 