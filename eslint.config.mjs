import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"

export default tseslint.config(
  {
    ignores: [".nuxt", ".output", ".data", "node_modules", "server/db/migrations"],
  },
  ...tseslint.configs.recommended,
  // Essential rules only. Prettier owns formatting, so the stylistic Vue rules
  // stay off to avoid two tools fighting over the same line breaks.
  ...pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "vue/multi-word-component-names": "off",
    },
  },
)
