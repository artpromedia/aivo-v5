const baseConfig = require("./.eslintrc.cjs");

module.exports = [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/.turbo/**"]
  },
  {
    ...baseConfig
  }
];
