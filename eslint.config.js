import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import { compilerOptions } from './svelte.compiler.js';

const svelteConfig = { compilerOptions };

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
  { ignores: ['src/wc/**'] },
  // Parity cases import the library through `sui-under-test`, an alias only the harness's Vite
  // configs define, so they are outside tsconfig and the type-aware parser. The harness scripts
  // and _kit.js are linted.
  { ignores: ['tests/parity/cases/**/*.svelte', 'tests/parity/app/**/*.svelte'] },
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: {
      'unused-imports': unusedImports
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ],
      curly: ['error', 'all'],
      'svelte/no-navigation-without-resolve': 'off',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never'
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSTypePredicate',
          message:
            'Type predicates (value is Type) are not allowed. Use type guards with explicit type checking instead.'
        },
        {
          selector: 'Identifier[name="undefined"]',
          message: 'undefined is not allowed. Use null or proper type checking instead.'
        },
        {
          selector: 'TSUndefinedKeyword',
          message: 'undefined type is not allowed. Use null instead.'
        },
        {
          selector: 'CallExpression[callee.name="$effect"]',
          message: '$effect is not allowed. Use a different reactive pattern instead.'
        }
      ]
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    }
  },
  // Test files need to stub complex DOM types that cannot be narrowed without assertions.
  {
    files: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off'
    }
  }
);
