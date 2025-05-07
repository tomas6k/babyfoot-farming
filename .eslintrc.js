module.exports = {
  extends: ['next/core-web-vitals'],
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'error'
  }
}; 