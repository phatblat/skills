import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { prepare } from '../scripts/semantic-release-changes.mjs';

const roots = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

async function makeReleaseFixture() {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'phatblat-skills-release-'),
  );
  roots.push(root);

  await Promise.all([
    mkdir(path.join(root, '.changes'), { recursive: true }),
    mkdir(path.join(root, '.claude-plugin'), { recursive: true }),
    mkdir(path.join(root, '.codex-plugin'), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(
      path.join(root, 'package.json'),
      `${JSON.stringify({ name: '@phatblat/skills', version: '0.1.0' }, null, 2)}\n`,
    ),
    writeFile(
      path.join(root, 'pyproject.toml'),
      '[project]\nname = "phatblat-skills"\nversion = "0.1.0"\n',
    ),
    writeFile(
      path.join(root, '.claude-plugin/plugin.json'),
      `${JSON.stringify({ name: 'phatblat-skills' }, null, 2)}\n`,
    ),
    writeFile(
      path.join(root, '.codex-plugin/plugin.json'),
      `${JSON.stringify({ name: 'phatblat-skills', version: '0.1.0' }, null, 2)}\n`,
    ),
    writeFile(
      path.join(root, '.changes/release.md'),
      '- Fixed: synchronized versions.\n',
    ),
  ]);

  return root;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

test('release preparation synchronizes every package version', async () => {
  const root = await makeReleaseFixture();

  await prepare({}, { cwd: root, nextRelease: { version: '0.2.0' } });

  expect((await readJson(path.join(root, 'package.json'))).version).toBe(
    '0.2.0',
  );
  expect(
    (await readJson(path.join(root, '.claude-plugin/plugin.json'))).version,
  ).toBe('0.2.0');
  expect(
    (await readJson(path.join(root, '.codex-plugin/plugin.json'))).version,
  ).toBe('0.2.0');
  expect(await readFile(path.join(root, 'pyproject.toml'), 'utf8')).toContain(
    'version = "0.2.0"',
  );
  expect(await Bun.file(path.join(root, '.changes/release.md')).exists()).toBe(
    false,
  );
});
