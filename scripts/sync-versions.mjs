import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const VERSION_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function assertVersion(version) {
  if (!VERSION_RE.test(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
}

async function writeJsonVersion(file, version) {
  const value = JSON.parse(await readFile(file, 'utf8'));
  value.version = version;
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeProjectVersion(file, version) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  let inProject = false;
  let replaced = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === '[project]') {
      inProject = true;
      continue;
    }
    if (inProject && line.startsWith('[')) break;
    if (inProject && /^version\s*=/.test(line)) {
      lines[index] = `version = "${version}"`;
      replaced = true;
      break;
    }
  }

  if (!replaced) throw new Error(`${file}: missing [project] version`);
  await writeFile(file, lines.join('\n'));
}

export async function syncVersions({ root = process.cwd(), version } = {}) {
  const packageFile = path.join(root, 'package.json');
  const packageJson = JSON.parse(await readFile(packageFile, 'utf8'));
  const nextVersion = version ?? packageJson.version;
  assertVersion(nextVersion);

  await Promise.all([
    writeJsonVersion(packageFile, nextVersion),
    writeProjectVersion(path.join(root, 'pyproject.toml'), nextVersion),
    writeJsonVersion(
      path.join(root, '.claude-plugin/plugin.json'),
      nextVersion,
    ),
    writeJsonVersion(path.join(root, '.codex-plugin/plugin.json'), nextVersion),
  ]);

  return nextVersion;
}

if (import.meta.main) {
  const version = await syncVersions({ version: process.argv[2] });
  console.log(`Synchronized repository version ${version}`);
}
