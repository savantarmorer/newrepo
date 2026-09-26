import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const output = join(root, 'dist');
const blockedTopLevel = new Set([
  '.git', '.github', '.cursor', '.superdesign', 'node_modules', 'supabase',
  'scripts', 'tests', 'test-results', 'playwright-report', 'dist'
]);
const blockedSegments = new Set(['supabase', 'scripts']);
const blockedFiles = new Set([
  '.env', '.env.local', 'package.json', 'package-lock.json', 'playwright.config.ts',
  'server.js', 'netlify.toml', 'vercel.json'
]);
const sourceExtensions = new Set(['.md', '.sql', '.ts', '.tsx', '.map']);

function shouldCopy(source) {
  const rel = relative(root, source);
  const segments = rel.split(sep);
  if (blockedTopLevel.has(segments[0])) return false;
  if (segments.some((segment) => blockedSegments.has(segment))) return false;
  if (blockedFiles.has(segments.at(-1))) return false;
  if (sourceExtensions.has(extname(source).toLowerCase())) return false;
  return true;
}

async function copyTree(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    if (!shouldCopy(from)) continue;
    const to = join(destination, entry.name);
    if (entry.isDirectory()) {
      await mkdir(to, { recursive: true });
      await copyTree(from, to);
    } else if (entry.isFile()) {
      await mkdir(dirname(to), { recursive: true });
      await cp(from, to);
    }
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await copyTree(root, output);

const forbidden = [
  join(output, 'jornalismo', 'content', 'aulas.json'),
  join(output, 'supabase', 'functions', 'curso-catalog', 'aulas.json')
];
for (const path of forbidden) {
  try {
    if ((await stat(path)).isFile()) throw new Error(`Private file copied to publish output: ${path}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

console.log('Static publish output created without private course assets.');
