/**
 * `npx tsx scripts/prune-unused.ts` — after scripts/disable-tests.ts commented test
 * blocks out, their imports / helpers become unused (noUnusedLocals). This drops the
 * unused import specifiers and comments out unused top-level declarations in spec
 * files only (tests/**), repeating until tsc reports none.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const UNUSED = new Set([6133, 6192, 6196, 6198, 6199, 6205]);
const cfgPath = ts.findConfigFile(process.cwd(), (f) => ts.sys.fileExists(f), 'tsconfig.json')!;
const cfg = ts.parseJsonConfigFileContent(
  ts.readConfigFile(cfgPath, (f) => ts.sys.readFile(f)).config,
  ts.sys,
  path.dirname(cfgPath),
);

for (let round = 1; round <= 8; round++) {
  const program = ts.createProgram(cfg.fileNames, cfg.options);
  const diags = ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file && UNUSED.has(d.code) && /[\\/]tests[\\/]/.test(d.file.fileName));
  if (!diags.length) {
    console.log(`clean after ${String(round - 1)} round(s)`);
    break;
  }
  const byFile = new Map<string, ts.Diagnostic[]>();
  for (const d of diags) byFile.set(d.file!.fileName, [...(byFile.get(d.file!.fileName) ?? []), d]);
  let edits = 0;
  for (const [file, ds] of byFile) {
    const src = program.getSourceFile(file)!;
    const text = src.text;
    const cuts: { start: number; end: number; repl: string }[] = [];
    for (const d of ds) {
      let node: ts.Node | undefined = findNode(src, d.start!);
      // climb to something removable
      while (node && !isRemovable(node)) node = node.parent;
      if (!node) continue;
      if (ts.isImportSpecifier(node)) {
        const named = node.parent;
        if (named.elements.length === 1)
          node = named.parent.parent; // whole import decl
        else {
          let end = node.getEnd();
          const after = text.slice(end).match(/^\s*,/);
          if (after) end += after[0].length;
          cuts.push({ start: node.getStart(src), end, repl: '' });
          continue;
        }
      }
      if (ts.isImportClause(node) || ts.isNamespaceImport(node))
        node = ts.findAncestor(node, ts.isImportDeclaration)!;
      if (ts.isVariableDeclaration(node)) node = node.parent.parent; // VariableStatement
      if (ts.isImportDeclaration(node)) {
        cuts.push({ start: node.getStart(src), end: node.getEnd(), repl: '' });
      } else {
        // comment the declaration out (keeps it for when the tests are re-enabled)
        const s = node.getStart(src);
        const lineStart = text.lastIndexOf('\n', s) + 1;
        const block = text.slice(lineStart, node.getEnd());
        cuts.push({
          start: lineStart,
          end: node.getEnd(),
          repl: block
            .split('\n')
            .map((l) => (l.trim() ? `// ${l}` : l))
            .join('\n'),
        });
      }
    }
    // de-duplicate / non-overlapping, apply bottom-up
    cuts.sort((a, b) => b.start - a.start);
    let out = text;
    let lastStart = Infinity;
    for (const c of cuts) {
      if (c.end > lastStart) continue;
      out = out.slice(0, c.start) + c.repl + out.slice(c.end);
      lastStart = c.start;
      edits++;
    }
    out = out.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(file, out);
  }
  console.log(
    `round ${String(round)}: ${String(diags.length)} unused, ${String(edits)} edits in ${String(byFile.size)} files`,
  );
}

function findNode(src: ts.SourceFile, pos: number): ts.Node | undefined {
  let found: ts.Node | undefined;
  const visit = (n: ts.Node): void => {
    if (pos >= n.getStart(src) && pos < n.getEnd()) {
      found = n;
      ts.forEachChild(n, visit);
    }
  };
  visit(src);
  return found;
}

function isRemovable(n: ts.Node): boolean {
  return (
    ts.isImportSpecifier(n) ||
    ts.isImportClause(n) ||
    ts.isNamespaceImport(n) ||
    ts.isImportDeclaration(n) ||
    (ts.isVariableDeclaration(n) &&
      ts.isVariableStatement(n.parent.parent) &&
      ts.isSourceFile(n.parent.parent.parent)) ||
    ((ts.isFunctionDeclaration(n) ||
      ts.isInterfaceDeclaration(n) ||
      ts.isTypeAliasDeclaration(n) ||
      ts.isClassDeclaration(n) ||
      ts.isEnumDeclaration(n)) &&
      ts.isSourceFile(n.parent))
  );
}
