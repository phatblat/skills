import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const validator = path.resolve('scripts/validate-plugins.mjs');
const roots = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

async function writeJson(root, relativePath, value) {
  const file = path.join(root, relativePath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function makePluginFixture() {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'phatblat-plugin-validation-'),
  );
  roots.push(root);
  await mkdir(path.join(root, 'skills/example'), { recursive: true });
  await writeFile(
    path.join(root, 'skills/example/SKILL.md'),
    '---\nname: example\ndescription: Example\n---\n',
  );
  await writeFile(
    path.join(root, 'pyproject.toml'),
    '[project]\nname = "example"\nversion = "0.1.0"\n',
  );
  await writeJson(root, 'package.json', { name: 'example', version: '0.1.0' });
  await writeJson(root, '.claude-plugin/plugin.json', {
    name: 'example',
    version: '0.1.0',
    description: 'Example plugin',
  });
  await writeJson(root, '.claude-plugin/marketplace.json', {
    name: 'example',
    plugins: [{ name: 'example', source: './' }],
  });
  await writeJson(root, '.codex-plugin/plugin.json', {
    name: 'example',
    version: '0.1.0',
    description: 'Example plugin',
    skills: './skills/',
  });
  await writeJson(root, '.agents/plugins/marketplace.json', {
    name: 'example',
    plugins: [
      {
        name: 'example',
        source: { source: 'local', path: './' },
        policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
        category: 'Productivity',
      },
    ],
  });
  return root;
}

function validate(root) {
  return Bun.spawnSync(['bun', validator, root], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
}

test('accepts synchronized Claude and Codex plugin packages', async () => {
  const result = validate(await makePluginFixture());

  expect(result.exitCode).toBe(0);
});

test('rejects a plugin version that differs from package.json', async () => {
  const root = await makePluginFixture();
  await writeJson(root, '.codex-plugin/plugin.json', {
    name: 'example',
    version: '0.2.0',
    description: 'Example plugin',
    skills: './skills/',
  });

  const result = validate(root);

  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain('version must equal package.json');
});

test('rejects implicit Codex marketplace policy', async () => {
  const root = await makePluginFixture();
  await writeJson(root, '.agents/plugins/marketplace.json', {
    name: 'example',
    plugins: [
      {
        name: 'example',
        source: { source: 'local', path: './' },
        category: 'Productivity',
      },
    ],
  });

  const result = validate(root);

  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain('policy.installation');
});
