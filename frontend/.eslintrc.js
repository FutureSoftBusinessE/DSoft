module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  extends: ["standard", "plugin:react/recommended", "plugin:react/jsx-runtime", "plugin:prettier/recommended"],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {
    "no-unused-vars": "warn",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
    camelcase: [
      "error",
      {
        allow: ["MRT_Localization_ES"],
      },
    ],
  },
}
