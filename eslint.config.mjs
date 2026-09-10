// Three environments live in this repo and they do not share globals:
// the page, the service worker, and the Node build helpers.
const browser = {
    window: 'readonly', document: 'readonly', navigator: 'readonly',
    getComputedStyle: 'readonly',
    console: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly',
    indexedDB: 'readonly', caches: 'readonly',
    setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly',
    clearInterval: 'readonly', requestAnimationFrame: 'readonly',
    IntersectionObserver: 'readonly', ResizeObserver: 'readonly',
    MutationObserver: 'readonly', matchMedia: 'readonly',
    FileReader: 'readonly', Blob: 'readonly', File: 'readonly',
    FormData: 'readonly', URL: 'readonly', URLSearchParams: 'readonly',
    DataTransfer: 'readonly', Image: 'readonly', Response: 'readonly',
    Event: 'readonly', CustomEvent: 'readonly', MouseEvent: 'readonly',
    KeyboardEvent: 'readonly', TouchEvent: 'readonly',
    HTMLAnchorElement: 'readonly', LaunchParams: 'readonly',
    alert: 'readonly', confirm: 'readonly', prompt: 'readonly',
    fetch: 'readonly', atob: 'readonly', btoa: 'readonly',
    performance: 'readonly', structuredClone: 'readonly',
    pdfjsLib: 'readonly'
};

const rules = {
    // The rules that caught the dead code already removed from this repo.
    'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
    'no-undef': 'error',
    'no-empty': 'warn',
    'eqeqeq': ['warn', 'smart'],
    'no-var': 'error',
    'prefer-const': 'warn'
};

export default [
    {
        files: ['script.js', 'db.js'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: browser },
        rules
    },
    {
        // Service worker: no `window`, but `self`, `caches` and the SW events.
        files: ['service-worker.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                self: 'readonly', caches: 'readonly', clients: 'readonly',
                fetch: 'readonly', console: 'readonly',
                Response: 'readonly', Request: 'readonly', Headers: 'readonly',
                URL: 'readonly', location: 'readonly', registration: 'readonly'
            }
        },
        rules
    },
    {
        files: ['tools/*.mjs', 'eslint.config.mjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { process: 'readonly', console: 'readonly' }
        },
        rules
    }
];
