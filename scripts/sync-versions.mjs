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
  const source = await readFile(file, 'utf8');
  const value = JSON.parse(source);
  let updated;
  let found = false;

  if (Object.hasOwn(value, 'version')) {
    updated = source.replace(
      /^(\s*"version"\s*:\s*)"[^"]+"/m,
      (_line, prefix) => {
        found = true;
        return `${prefix}"${version}"`;
      },
    );
  } else {
    updated = source.replace(
      /^(\s*"name"\s*:\s*"[^"]+")([ \t]*,?[ \t]*)$/m,
      (_line, name, suffix) => {
        found = true;
        return `${name}${suffix.includes(',') ? suffix : ','}\n${name.match(/^\s*/)[0]}"version": "${version}"`;
      },
    );
  }

  if (!found) throw new Error(`${file}: missing top-level version`);
  await writeFile(file, updated);
}

async function readProjectName(file) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  let inProject = false;
  for (const line of lines) {
    if (line === '[project]') {
      inProject = true;
      continue;
    }
    if (inProject && line.startsWith('[')) break;
    const match = inProject && line.match(/^name\s*=\s*"([^"]+)"/);
    if (match) return match[1];
  }
  throw new Error(`${file}: missing [project] name`);
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

async function writeLockedProjectVersion(file, projectName, version) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  let inProjectPackage = false;
  let replaced = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === '[[package]]') {
      inProjectPackage = false;
      continue;
    }
    if (line === `name = "${projectName}"`) {
      inProjectPackage = true;
      continue;
    }
    if (inProjectPackage && /^version\s*=/.test(line)) {
      lines[index] = `version = "${version}"`;
      replaced = true;
      break;
    }
  }

  if (!replaced) throw new Error(`${file}: missing ${projectName} package`);
  await writeFile(file, lines.join('\n'));
}

export async function syncVersions({ root = process.cwd(), version } = {}) {
  const packageFile = path.join(root, 'package.json');
  const packageJson = JSON.parse(await readFile(packageFile, 'utf8'));
  const nextVersion = version ?? packageJson.version;
  assertVersion(nextVersion);
  const projectFile = path.join(root, 'pyproject.toml');
  const projectName = await readProjectName(projectFile);

  await Promise.all([
    writeJsonVersion(packageFile, nextVersion),
    writeProjectVersion(projectFile, nextVersion),
    writeLockedProjectVersion(
      path.join(root, 'uv.lock'),
      projectName,
      nextVersion,
    ),
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
