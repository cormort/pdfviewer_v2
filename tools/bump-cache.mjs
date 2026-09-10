// Rewrites the single ?v= cache token across index.html and script.js so the
// three local assets can never drift apart again.
import { readFileSync, writeFileSync } from 'node:fs';

const token = process.argv[2] || new Date().toISOString().slice(0, 10);
const files = ['index.html', 'script.js'];
let changed = 0;

for (const f of files) {
    const before = readFileSync(f, 'utf8');
    const after = before.replace(/\?v=[\w.-]+/g, `?v=${token}`);
    if (after !== before) { writeFileSync(f, after); changed++; }
}
console.log(`cache token -> ${token} (${changed} file(s) updated)`);
