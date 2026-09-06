import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  generateNotes,
  prepare,
} from '../scripts/semantic-release-changes.mjs';

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
    writeFile(
      path.join(root, 'CHANGELOG.md'),
      '# Changelog\n\n## [Unreleased]\n\n## [0.2.0] - 2026-09-06\n\n### Fixed\n\n- synchronized versions.\n\n## [0.1.0] - 2026-09-05\n\n### Added\n\n- initial release.\n\n[Unreleased]: https://github.com/phatblat/skills/commits/main/\n[0.1.0]: https://github.com/phatblat/skills/commit/abc123\n',
    ),
  ]);

  return root;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

test('release preparation synchronizes every package version', async () => {
  const root = await makeReleaseFixture();

  await prepare(
    { repositoryUrl: 'https://github.com/phatblat/skills' },
    { cwd: root, nextRelease: { version: '0.2.0' } },
  );

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

test('release notes use versioned Keep a Changelog headings', async () => {
  const root = await makeReleaseFixture();
  const today = new Date().toISOString().slice(0, 10);

  const notes = await generateNotes(
    {},
    { cwd: root, nextRelease: { version: '0.2.0' } },
  );

  expect(notes).toBe(
    `## [0.2.0] - ${today}\n\n### Fixed\n\n- synchronized versions.`,
  );
});

test('release preparation updates changelog comparison links', async () => {
  const root = await makeReleaseFixture();

  await prepare(
    { repositoryUrl: 'https://github.com/phatblat/skills' },
    { cwd: root, nextRelease: { version: '0.2.0' } },
  );

  const changelog = await readFile(path.join(root, 'CHANGELOG.md'), 'utf8');
  expect(changelog).toContain(
    '[Unreleased]: https://github.com/phatblat/skills/compare/v0.2.0...HEAD',
  );
  expect(changelog).toContain(
    '[0.2.0]: https://github.com/phatblat/skills/compare/abc123...v0.2.0',
  );
  expect(changelog).toContain(
    '[0.1.0]: https://github.com/phatblat/skills/commit/abc123',
  );
});
