// Root ESLint flat config (ESLint v9+).
// A single flat config covers both workspaces instead of duplicating rules per
// package - the `files` globs below scope React-specific rules to apps/web
// and keep apps/api / packages/* on plain TypeScript rules.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/generated/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Unused vars are almost always a real bug (dead code, forgotten
      // refactor) - keep this as an error rather than a warning.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Core ESLint's `no-undef` (pulled in via js.configs.recommended
      // above) predates TypeScript and only understands runtime JS
      // identifiers - it has no notion of ambient *type* declarations like
      // `RequestInit` or `HTMLElement` that come from lib.dom.d.ts, so it
      // false-positives on any of them used purely as a type annotation.
      // TypeScript's own compiler (`tsc`, run separately via the
      // `typecheck` script) already catches a genuinely undefined type
      // with a far more accurate error, so this rule is pure noise in a
      // TS codebase - the typescript-eslint project's own docs recommend
      // turning it off for exactly this reason.
      'no-undef': 'off',
    },
  },
  {
    // Node.js runtime globals (process, console, __dirname, Buffer, ...).
    //
    // Why this block exists: `js.configs.recommended` enables core ESLint
    // rules including `no-undef`, which flags any identifier the linter
    // can't account for. In the OLD .eslintrc format, `env: { node: true }`
    // told ESLint "this code runs in Node, assume its globals exist." Flat
    // config (ESLint 9+) removed that shorthand - environments aren't
    // inferred from a project's runtime anymore, they have to be supplied
    // explicitly as a list of global variable names via the `globals`
    // package (the official successor to the old `env` presets). Without
    // this block, `process.env.PORT` or a plain `console.log` inside
    // apps/api reads, to the linter, as a reference to a variable that was
    // never declared - hence `'process' is not defined  no-undef`.
    //
    // Scoped to the backend and the shared/internal packages (all Node-run
    // code) plus this repo's own root-level config files (which Node
    // executes directly, e.g. `eslint.config.js` itself) - deliberately
    // NOT `apps/web`, which runs in the browser and gets its own globals
    // block below instead.
    files: ['apps/api/**/*.ts', 'packages/**/*.ts', '*.config.js', '*.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // React-specific rules only apply to the frontend app.
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      // Browser globals (window, document, fetch, localStorage, ...) for
      // the same reason the Node block above exists - the frontend runs in
      // a browser, not Node, so it needs the browser global list instead.
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  prettierConfig,
];
