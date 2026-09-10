export default [
    {
        files: ['*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly', document: 'readonly', navigator: 'readonly',
                console: 'readonly', localStorage: 'readonly', indexedDB: 'readonly',
                setTimeout: 'readonly', clearTimeout: 'readonly',
                requestAnimationFrame: 'readonly', IntersectionObserver: 'readonly',
                FileReader: 'readonly', Blob: 'readonly', File: 'readonly',
                Image: 'readonly', Event: 'readonly', MouseEvent: 'readonly',
                alert: 'readonly', confirm: 'readonly', fetch: 'readonly',
                URL: 'readonly', DataTransfer: 'readonly',
                ResizeObserver: 'readonly', sessionStorage: 'readonly',
                LaunchParams: 'readonly',
                pdfjsLib: 'readonly'
            }
        },
        rules: {
            // The rules that would have caught the dead code in this repo.
            'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
            'no-undef': 'error',
            'no-empty': 'warn',
            'eqeqeq': ['warn', 'smart'],
            'no-var': 'error',
            'prefer-const': 'warn'
        }
    }
];
