module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2015
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "quotes": ["error", "single", {
      "allowTemplateLiterals": true
    }],
    "@typescript-eslint/no-non-null-assertion": "off"
  }
};
