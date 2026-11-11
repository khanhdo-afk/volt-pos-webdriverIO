// One-off: re-enable the Re-Open tests pended on 04/11/2026 (user asked 11/11/2026).
// For every `// // PENDING 04/11/2026` marker, uncomment the following
// `// describe.skip(` / `// it.skip(` block (balanced parens) and drop `.skip`.
// Usage: node scripts/unpend-reopen.mjs <files...>   (prints a summary)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const MARK = /PENDING 04\/11\/2026/;
const TAT = /^\s*\/\/ \[TẮT 2026-11-08\]/;

function balance(s) {
  // Rough paren/brace balance ignoring strings and template literals.
  let d = 0;
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '\\') { i++; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '/' && s[i + 1] === '/') break;
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '(' || c === '{' || c === '[') d++;
    if (c === ')' || c === '}' || c === ']') d--;
  }
  return d;
}

let total = 0;
const fromHead = process.argv.includes('--from-head');
for (const file of process.argv.slice(2).filter((a) => a !== '--from-head')) {
  const src = fromHead
    ? execFileSync('git', ['show', `HEAD:${file.replace(/\\/g, '/')}`], { encoding: 'utf8', maxBuffer: 64 << 20 })
    : fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const out = [];
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!MARK.test(line)) { out.push(line); continue; }
    // drop the marker and a [TẮT] line right before it
    if (out.length && TAT.test(out[out.length - 1])) out.pop();
    const start = lines[i + 1];
    const m = start && start.match(/^(\s*)\/\/ ((?:describe|it)\.skip\(.*)$/);
    if (!m) { out.push(line); continue; }
    const indent = m[1];
    let depth = 0;
    let j = i + 1;
    for (; j < lines.length; j++) {
      const l = lines[j];
      if (l.trim() === '' && depth > 0) { out.push(''); continue; }
      if (!l.startsWith(indent + '//')) break;
      let code = l.slice(indent.length + 2);
      if (code.startsWith(' ')) code = code.slice(1);
      if (j === i + 1) code = code.replace(/^(describe|it)\.skip\(/, '$1(');
      out.push(indent + code);
      depth += balance(code);
      if (depth <= 0 && j > i + 1) break;
    }
    i = j;
    n++;
  }
  if (n) {
    fs.writeFileSync(file, out.join('\n'));
    console.log(`${file}: ${n} block(s)`);
    total += n;
  }
}
console.log(`total ${total}`);
