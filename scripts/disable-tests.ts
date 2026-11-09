/**
 * `npx tsx scripts/disable-tests.ts <rules.json>` — COMMENT OUT test cases that cannot
 * run yet (title-only PENDING cases, `describe.skip` blocks, cases that need hardware /
 * a second device / a feature not shipped), so the suite reports no SKIP at all.
 *
 * Every disabled block is turned into `// ` lines under a marker:
 *   // [TẮT 2026-11-08] <reason> — mở lại (bỏ comment) khi tính năng hoàn thiện.
 * Re-enable = delete the marker and uncomment the block (`npx tsx scripts/disable-tests.ts --enable <file>`).
 *
 * rules.json: [{ "file": "tests/...spec.ts", "mode": "pending" | "describeSkip" | "match" | "all",
 *               "match"?: "<regex on the title source (match) or the whole it(...) text (body)>", "reason": "..." }]
 */
import fs from 'node:fs';
import ts from 'typescript';

const MARK = '// [TẮT ';
const today = new Date().toISOString().slice(0, 10);

interface Rule {
  file: string;
  mode: 'pending' | 'describeSkip' | 'match' | 'body' | 'all';
  match?: string;
  reason: string;
}

function calleeName(e: ts.CallExpression): string {
  const c = e.expression;
  if (ts.isIdentifier(c)) return c.text;
  if (ts.isPropertyAccessExpression(c) && ts.isIdentifier(c.expression))
    return `${c.expression.text}.${c.name.text}`;
  return '';
}

const TEST_FNS = new Set([
  'it',
  'it.skip',
  'it.only',
  'xit',
  'describe',
  'describe.skip',
  'xdescribe',
  'context',
]);

function targets(src: ts.SourceFile, rule: Rule): ts.Statement[] {
  const out: ts.Statement[] = [];
  const re = rule.match ? new RegExp(rule.match) : null;
  const visit = (node: ts.Node, insideTaken: boolean): void => {
    let taken = insideTaken;
    if (!insideTaken && ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      const call = node.expression;
      const name = calleeName(call);
      if (TEST_FNS.has(name)) {
        const isIt = name.startsWith('it') || name === 'xit';
        const titleText = call.arguments[0]?.getText(src) ?? '';
        const hasFn = call.arguments.some((a) => ts.isFunctionExpression(a) || ts.isArrowFunction(a));
        let hit = false;
        if (rule.mode === 'pending') hit = isIt && !hasFn;
        else if (rule.mode === 'describeSkip')
          hit = name === 'describe.skip' || name === 'xdescribe' || name === 'it.skip' || name === 'xit';
        else if (rule.mode === 'match') hit = !!re && re.test(titleText);
        else if (rule.mode === 'body') hit = isIt && !!re && re.test(node.getText(src));
        else if (rule.mode === 'all') hit = name.startsWith('describe') && ts.isSourceFile(node.parent);
        if (hit) {
          out.push(node);
          taken = true;
        }
      }
    }
    ts.forEachChild(node, (c) => visit(c, taken));
  };
  visit(src, false);
  return out;
}

function disable(rule: Rule): number {
  const text = fs.readFileSync(rule.file, 'utf8');
  const src = ts.createSourceFile(rule.file, text, ts.ScriptTarget.Latest, true);
  const nodes = targets(src, rule);
  if (!nodes.length) return 0;
  const lines = text.split('\n');
  // Work bottom-up so line numbers stay valid.
  const ranges = nodes
    .map((n) => {
      const start = src.getLineAndCharacterOfPosition(n.getStart(src, false)).line;
      // include the leading comment lines that belong to this statement
      const full = src.getLineAndCharacterOfPosition(n.getFullStart()).line;
      let s = start;
      while (s - 1 > full && /^\s*(\/\/|\/\*|\*)/.test(lines[s - 1] ?? '')) s--;
      const end = src.getLineAndCharacterOfPosition(n.getEnd()).line;
      return { s, end };
    })
    .sort((a, b) => b.s - a.s);
  for (const { s, end } of ranges) {
    const indent = /^\s*/.exec(lines[s] ?? '')?.[0] ?? '';
    for (let i = s; i <= end; i++)
      lines[i] = lines[i]!.trim() === '' ? lines[i]! : `${indent}// ${lines[i]!.slice(indent.length)}`;
    lines.splice(
      s,
      0,
      `${indent}${MARK}${today}] ${rule.reason} — mở lại (bỏ comment) khi tính năng hoàn thiện.`,
    );
  }
  fs.writeFileSync(rule.file, lines.join('\n'));
  return ranges.length;
}

/** Undo: drop markers and uncomment the block right under each one. */
function enable(file: string): number {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]!.trimStart().startsWith(MARK)) continue;
    const indent = /^\s*/.exec(lines[i]!)?.[0] ?? '';
    lines.splice(i, 1);
    n++;
    let depth = 0;
    let seen = false;
    for (let j = i; j < lines.length; j++) {
      const l = lines[j]!;
      if (l.trim() === '') continue;
      if (!l.startsWith(`${indent}// `)) break;
      const body = `${indent}${l.slice(indent.length + 3)}`;
      lines[j] = body;
      for (const ch of body) {
        if (ch === '(' || ch === '{') {
          depth++;
          seen = true;
        }
        if (ch === ')' || ch === '}') depth--;
      }
      if (seen && depth <= 0) break;
    }
  }
  fs.writeFileSync(file, lines.join('\n'));
  return n;
}

const args = process.argv.slice(2);
if (args[0] === '--enable') {
  for (const f of args.slice(1)) console.log(`${f}: re-enabled ${String(enable(f))}`);
} else {
  const rules = JSON.parse(fs.readFileSync(args[0]!, 'utf8')) as Rule[];
  let total = 0;
  for (const r of rules) {
    const n = disable(r);
    total += n;
    console.log(`${r.file} [${r.mode}${r.match ? ` /${r.match}/` : ''}]: ${String(n)}`);
  }
  console.log(`disabled ${String(total)} blocks`);
}
