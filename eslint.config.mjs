import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            '.astro/**',
            '.vercel/**',
            'test-results/**',
            'playwright-report/**',
            'coverage/**',
            'src/env.d.ts',
            '**/*.config.mjs',
            '**/*.config.cjs',
            'api/**',
            'astro.config.mjs'
        ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...astro.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        plugins: { 'react-hooks': reactHooks },
        languageOptions: {
            globals: { ...globals.browser, ...globals.node }
        },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ]
        }
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }]
        }
    },
    {
        files: ['src/lib/debugLog.ts'],
        rules: { 'no-console': 'off' }
    },
    {
        files: ['backend/**/*.{ts,tsx}'],
        rules: { 'no-console': 'off' }
    },
    {
        files: ['scripts/**/*.js', '**/*.config.js', '**/*.cjs'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: { ...globals.node }
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off'
        }
    },
    {
        // Static browser/service-worker assets shipped as-is.
        files: ['public/**/*.js'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.serviceworker }
        }
    },
    {
        files: ['tests/**', 'e2e/**', '**/*.test.{ts,tsx}'],
        languageOptions: { globals: { ...globals.node, ...globals.jest } }
    }
);
