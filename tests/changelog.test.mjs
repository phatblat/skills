import { afterEach, expect, test } from 'bun:test';
import { prepare as prepareChangelog } from '@semantic-release/changelog';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const roots = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

test('semantic-release generates the standard changelog structure', async () => {
  const config = await Bun.file('.releaserc.json').json();
  const names = config.plugins.map((plugin) =>
    Array.isArray(plugin) ? plugin[0] : plugin,
  );
  const changelogIndex = names.indexOf('@semantic-release/changelog');
  const customIndex = names.indexOf('./scripts/semantic-release-changes.mjs');
  const gitIndex = names.indexOf('@semantic-release/git');
  expect(changelogIndex).toBeGreaterThanOrEqual(0);
  expect(customIndex).toBeGreaterThanOrEqual(0);
  expect(gitIndex).toBeGreaterThanOrEqual(0);
  const root = await mkdtemp(path.join(os.tmpdir(), 'phatblat-changelog-'));
  roots.push(root);

  await prepareChangelog(config.plugins[changelogIndex][1], {
    cwd: root,
    nextRelease: {
      notes: '## [0.2.0] - 2026-09-06\n\n### Fixed\n\n- compliant output.',
    },
    logger: { log() {} },
  });

  const changelog = await readFile(path.join(root, 'CHANGELOG.md'), 'utf8');
  expect(changelog).toStartWith(
    '# Changelog\n\nAll notable changes to this project will be documented in this file.',
  );
  expect(changelog).not.toMatch(/\n{3,}/);
  expect(changelog.indexOf('## [Unreleased]')).toBeLessThan(
    changelog.indexOf('## [0.2.0] - 2026-09-06'),
  );
  expect(changelogIndex).toBeLessThan(customIndex);
  expect(customIndex).toBeLessThan(gitIndex);
});
