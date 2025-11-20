const baseConfig = require("./.eslintrc.cjs");

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/build/**",
      "**/.expo/**",
      "**/coverage/**"
    ]
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    ...baseConfig,
    languageOptions: {
      ...baseConfig.parserOptions,
      ecmaVersion: "latest",
      sourceType: "module"
    }
  }
];
