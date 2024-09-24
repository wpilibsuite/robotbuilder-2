import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginReact from "eslint-plugin-react"


export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      pluginReact,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "semi": ["error", "never"],
      "block-spacing": ["error", "always"],
      "template-curly-spacing": ["error", "always"],
      "eol-last": ["error", "always"],
      "function-call-argument-newline": ["error", "consistent"],
      "comma-dangle": ["error", "always-multiline"],
      "indent": ["error", 2, { SwitchCase: 1, ignoredNodes: ["JSXAttribute", "JSXSpreadAttribute"] }],
      "pluginReact/jsx-indent-props": [2, "first"],
      "object-curly-spacing": ["error", "always"],
      "quotes": ["error", "double", { allowTemplateLiterals: true, avoidEscape: true }],
      "quote-props": ["error", "consistent-as-needed"],
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
]
