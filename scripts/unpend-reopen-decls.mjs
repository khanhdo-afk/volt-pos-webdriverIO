// Companion of unpend-reopen.mjs: after the Re-Open blocks are live again, the
// imports / helpers they use may still be commented out (the 08/11 "[TẮT]" pass
// commented whatever became unused). Uncomment the top-level commented
// declarations that tsc reports as missing, repeating until stable.
// Usage: node scripts/unpend-reopen-decls.mjs
import fs from 'node:fs';
import { execSync } from 'node:child_process';

function tscErrors() {
  try {
    execSync('npx tsc --noEmit -p .', { encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 << 20 });
    return '';
  } catch (e) {
    return e.stdout ?? '';
  }
}

function missingByFile(out) {
  const map = new Map();
  for (const m of out.matchAll(/^(tests[^(]+)\(\d+,\d+\): error TS2304: Cannot find name '([^']+)'/gm)) {
    const set = map.get(m[1]) ?? new Set();
    set.add(m[2]);
    map.set(m[1], set);
  }
  // Also TS2552 ("Cannot find name 'x'. Did you mean")
  for (const m of out.matchAll(/^(tests[^(]+)\(\d+,\d+\): error TS2552: Cannot find name '([^']+)'/gm)) {
    const set = map.get(m[1]) ?? new Set();
    set.add(m[2]);
    map.set(m[1], set);
  }
  return map;
}

const depthOf = (s) => {
  let d = 0;
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '/' && s[i + 1] === '/') break;
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if ('({['.includes(c)) d++;
    if (')}]'.includes(c)) d--;
  }
  return d;
};

function uncommentBlock(lines, start) {
  // lines[start] starts with "// " at column 0; uncomment until balanced and statement ends.
  let depth = 0;
  let j = start;
  for (; j < lines.length; j++) {
    const l = lines[j];
    if (l.trim() === '' && depth > 0) continue;
    if (!/^\/\/( |$)/.test(l)) break;
    const code = l.replace(/^\/\/ ?/, '');
    lines[j] = code;
    depth += depthOf(code);
    if (depth <= 0 && (/[;})]\s*$/.test(code) || /^import .* from /.test(code))) break;
  }
  return j;
}

for (let pass = 0; pass < 6; pass++) {
  const out = tscErrors();
  const map = missingByFile(out);
  if (!map.size) { console.log(`pass ${pass}: no missing names`); break; }
  let changed = 0;
  for (const [file, names] of map) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (const name of names) {
      const re = new RegExp(
        `^// (export )?(async )?(function\\*? ${name}\\b|(const|let|class|type|interface|enum) ${name}\\b)`,
      );
      let idx = lines.findIndex((l) => re.test(l));
      if (idx >= 0) { uncommentBlock(lines, idx); changed++; continue; }
      // import: find a commented import statement that mentions the name
      for (let i = 0; i < lines.length; i++) {
        if (!/^\/\/ import\b/.test(lines[i])) continue;
        let end = i;
        let text = lines[i];
        while (!/from ['"].*['"];?\s*$/.test(lines[end]) && end < i + 40) { end++; text += lines[end]; }
        if (new RegExp(`\\b${name}\\b`).test(text)) {
          for (let k = i; k <= end; k++) lines[k] = lines[k].replace(/^\/\/ ?/, '');
          changed++;
          break;
        }
      }
    }
    fs.writeFileSync(file, lines.join('\n'));
  }
  console.log(`pass ${pass}: ${map.size} file(s), ${changed} declaration(s) uncommented`);
  if (!changed) { console.log(out.split('\n').slice(0, 30).join('\n')); break; }
}
