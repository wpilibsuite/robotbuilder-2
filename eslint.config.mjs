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
      "block-spacing": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "eol-last": ["error", "always"],
      "function-call-argument-newline": ["error", "consistent"],
      "indent": ["error", 2, { SwitchCase: 1, ignoredNodes: ["JSXAttribute", "JSXSpreadAttribute"] }],
      "object-curly-spacing": ["error", "always"],
      "pluginReact/jsx-indent-props": [2, "first"],
      "quote-props": ["error", "consistent-as-needed"],
      "quotes": ["error", "double", { allowTemplateLiterals: true, avoidEscape: true }],
      "semi": ["error", "never"],
      "template-curly-spacing": ["error", "always"],
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
]
