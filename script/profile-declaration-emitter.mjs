import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/** Emit complete profile-package types. TypeScript 5.6 marks an aggregate
 * declaration-only emit skipped for imported JSON, which has no declaration
 * output. Emit TS sources individually instead; never ignore a TS emit skip.
 * Completeness uses writes from THIS invocation, never pre-existing files.
 */
export function emitProfileDeclarations({ program, rootDir, outDir, entrySource }) {
  const options = program.getCompilerOptions();
  if (options.noEmitOnError !== true || options.emitDeclarationOnly !== true || options.declaration !== true || options.noEmit) {
    throw new Error('Profile declarations require declaration-only emit with noEmitOnError:true');
  }
  if (options.outFile || options.declarationDir || path.resolve(options.rootDir || '') !== path.resolve(rootDir) || path.resolve(options.outDir || '') !== path.resolve(outDir)) {
    throw new Error('Profile declaration output layout does not match expected rootDir/outDir');
  }
  const format = diagnostics => ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file, getCurrentDirectory: () => rootDir, getNewLine: () => '\n',
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(`Profile declaration diagnostics:\n${format(diagnostics)}`);
  const sources = program.getSourceFiles().filter(source => !source.isDeclarationFile && !program.isSourceFileFromExternalLibrary(source));
  const jsonSources = sources.filter(source => source.fileName.endsWith('.json'));
  const typeSources = sources.filter(source => !source.fileName.endsWith('.json'));
  const expected = new Map();
  for (const source of typeSources) {
    const relative = path.relative(path.resolve(rootDir), path.resolve(source.fileName));
    if (relative.startsWith('..' + path.sep) || path.isAbsolute(relative) || !/\.(?:tsx?|mts|cts)$/.test(relative)) {
      throw new Error(`Unsupported profile declaration source: ${source.fileName}`);
    }
    const declaration = relative.replace(/\.(tsx?|mts|cts)$/, (_, extension) => extension === 'mts' ? '.d.mts' : extension === 'cts' ? '.d.cts' : '.d.ts');
    const output = path.resolve(outDir, declaration);
    if (expected.has(output)) throw new Error(`Colliding profile declaration output: ${output}`);
    expected.set(output, source);
  }
  if (![...expected.values()].some(source => path.resolve(source.fileName) === path.resolve(entrySource))) {
    throw new Error(`Missing profile declaration entry source: ${entrySource}`);
  }
  const written = new Set();
  const writeFile = (fileName, text, writeByteOrderMark) => {
    const absolute = path.resolve(fileName);
    if (!expected.has(absolute)) throw new Error(`Unexpected profile declaration output: ${fileName}`);
    // JSON has no declaration artifact in this package. Do not publish types
    // that still depend on an omitted JSON module (e.g. a public re-export).
    const declaration = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
    const checkJsonReference = node => {
      let specifier;
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
      else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) specifier = node.argument.literal;
      else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) specifier = node.moduleReference.expression;
      if (specifier && ts.isStringLiteralLike(specifier) && /\.json$/i.test(specifier.text)) {
        throw new Error(`Unpackaged JSON dependency in profile declaration ${fileName}: ${specifier.text}`);
      }
      ts.forEachChild(node, checkJsonReference);
    };
    checkJsonReference(declaration);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, (writeByteOrderMark ? '\uFEFF' : '') + text);
    written.add(absolute);
  };
  for (const [output, source] of expected) {
    const result = program.emit(source, writeFile);
    if (result.diagnostics.length || result.emitSkipped) {
      throw new Error(`Profile declaration emit failed for ${source.fileName}:\n${format(result.diagnostics)}${result.emitSkipped ? '\nTypeScript skipped this TS declaration.' : ''}`);
    }
    if (!written.has(output)) throw new Error(`Missing profile declaration emitted this invocation: ${output}`);
  }
  const missing = [...expected.keys()].filter(file => !written.has(file));
  if (missing.length) throw new Error(`Missing profile declarations: ${missing.join(', ')}`);
  return { emittedFiles: [...written], skippedJsonSources: jsonSources.map(source => source.fileName) };
}
