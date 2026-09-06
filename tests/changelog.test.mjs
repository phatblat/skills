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
  const changelogIndex = config.plugins.findIndex(
    (plugin) => plugin[0] === '@semantic-release/changelog',
  );
  const customIndex = config.plugins.findIndex(
    (plugin) => plugin[0] === './scripts/semantic-release-changes.mjs',
  );
  const gitIndex = config.plugins.findIndex(
    (plugin) => plugin[0] === '@semantic-release/git',
  );
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
  expect(changelog.indexOf('## [Unreleased]')).toBeLessThan(
    changelog.indexOf('## [0.2.0] - 2026-09-06'),
  );
  expect(changelogIndex).toBeLessThan(customIndex);
  expect(customIndex).toBeLessThan(gitIndex);
});

test('tracked changelog records the initial version and references', async () => {
  const changelog = await Bun.file('CHANGELOG.md').text();

  expect(changelog).toContain('## [0.1.0] - 2026-09-05');
  expect(changelog).toContain(
    '[Unreleased]: https://github.com/phatblat/skills/commits/main/',
  );
  expect(changelog).toContain(
    '[0.1.0]: https://github.com/phatblat/skills/commit/e52da4bd6267d61abfc347850a9328a0c557eac1',
  );
});
