import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const VERSION_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

async function readJson(root, relativePath, errors) {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

function requireString(value, field, errors) {
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${field} must be a non-empty string`);
  }
}

async function requireComponentPath(root, value, field, errors) {
  requireString(value, field, errors);
  if (typeof value !== 'string' || !value.startsWith('./')) return;

  const resolved = path.resolve(root, value);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    errors.push(`${field} must stay inside the plugin root`);
    return;
  }
  if (!(await stat(resolved).catch(() => null))) {
    errors.push(`${field} does not exist: ${value}`);
  }
}

function projectVersion(pyproject, errors) {
  let inProject = false;
  for (const line of pyproject.split('\n')) {
    if (line === '[project]') {
      inProject = true;
      continue;
    }
    if (inProject && line.startsWith('[')) break;
    const match = inProject && line.match(/^version\s*=\s*"([^"]+)"/);
    if (match) return match[1];
  }
  errors.push('pyproject.toml: missing [project] version');
  return null;
}

export async function validatePlugins(root = process.cwd()) {
  const errors = [];
  const [pkg, claude, claudeMarketplace, codex, codexMarketplace, pyproject] =
    await Promise.all([
      readJson(root, 'package.json', errors),
      readJson(root, '.claude-plugin/plugin.json', errors),
      readJson(root, '.claude-plugin/marketplace.json', errors),
      readJson(root, '.codex-plugin/plugin.json', errors),
      readJson(root, '.agents/plugins/marketplace.json', errors),
      readFile(path.join(root, 'pyproject.toml'), 'utf8').catch((error) => {
        errors.push(`pyproject.toml: ${error.message}`);
        return '';
      }),
    ]);

  if (!pkg || !claude || !claudeMarketplace || !codex || !codexMarketplace) {
    return errors;
  }

  requireString(pkg.version, 'package.json version', errors);
  if (typeof pkg.version === 'string' && !VERSION_RE.test(pkg.version)) {
    errors.push(`package.json version is not semantic: ${pkg.version}`);
  }

  for (const [file, plugin] of [
    ['.claude-plugin/plugin.json', claude],
    ['.codex-plugin/plugin.json', codex],
  ]) {
    requireString(plugin.name, `${file} name`, errors);
    requireString(plugin.version, `${file} version`, errors);
    requireString(plugin.description, `${file} description`, errors);
    if (plugin.version !== pkg.version) {
      errors.push(
        `${file} version must equal package.json version ${pkg.version}`,
      );
    }
  }

  const pythonVersion = projectVersion(pyproject, errors);
  if (pythonVersion && pythonVersion !== pkg.version) {
    errors.push(
      `pyproject.toml version must equal package.json version ${pkg.version}`,
    );
  }

  await requireComponentPath(
    root,
    codex.skills,
    '.codex-plugin/plugin.json skills',
    errors,
  );

  const claudeEntry = claudeMarketplace.plugins?.find(
    (plugin) => plugin.name === claude.name,
  );
  if (!claudeEntry) {
    errors.push('.claude-plugin/marketplace.json must list the Claude plugin');
  } else if (claudeEntry.source !== './') {
    errors.push('.claude-plugin/marketplace.json source must be ./');
  }

  const codexEntry = codexMarketplace.plugins?.find(
    (plugin) => plugin.name === codex.name,
  );
  if (!codexEntry) {
    errors.push('.agents/plugins/marketplace.json must list the Codex plugin');
  } else {
    if (
      codexEntry.source?.source !== 'local' ||
      codexEntry.source?.path !== './'
    ) {
      errors.push(
        '.agents/plugins/marketplace.json source must be local path ./',
      );
    }
    if (codexEntry.policy?.installation !== 'AVAILABLE') {
      errors.push(
        '.agents/plugins/marketplace.json policy.installation must be AVAILABLE',
      );
    }
    if (codexEntry.policy?.authentication !== 'ON_INSTALL') {
      errors.push(
        '.agents/plugins/marketplace.json policy.authentication must be ON_INSTALL',
      );
    }
    requireString(
      codexEntry.category,
      '.agents/plugins/marketplace.json category',
      errors,
    );
  }

  return errors;
}

if (import.meta.main) {
  const errors = await validatePlugins(process.argv[2] ?? process.cwd());
  for (const error of errors) console.error(error);
  if (errors.length > 0) process.exit(1);
}
