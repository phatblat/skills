import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CHANGE_LINE_RE, CHANGE_TYPES, fragmentFiles } from './changes-lib.mjs';
import { syncVersions } from './sync-versions.mjs';

/**
 * semantic-release `generateNotes` step: fold every `.changes/*.md` fragment
 * into a dated Keep a Changelog release section.
 */
export async function generateNotes(_pluginConfig, { cwd, nextRelease }) {
  const files = await fragmentFiles(cwd);
  const grouped = new Map(CHANGE_TYPES.map((type) => [type, []]));
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.trim().match(CHANGE_LINE_RE);
      if (match) grouped.get(match[1]).push(match[2]);
    }
  }

  const sections = CHANGE_TYPES.filter((type) => grouped.get(type).length > 0)
    .map(
      (type) =>
        `### ${type}\n\n${grouped
          .get(type)
          .map((entry) => `- ${entry}`)
          .join('\n')}`,
    )
    .join('\n\n');
  const heading = `## [${nextRelease.version}] - ${new Date()
    .toISOString()
    .slice(0, 10)}`;
  return sections ? `${heading}\n\n${sections}` : heading;
}

async function updateChangelogLinks(root, repositoryUrl, version) {
  if (typeof repositoryUrl !== 'string' || repositoryUrl.length === 0) {
    throw new TypeError('repositoryUrl must be configured for changelog links');
  }

  const changelogPath = path.join(root, 'CHANGELOG.md');
  const lines = (await readFile(changelogPath, 'utf8')).split('\n');
  const linkDefinition = /^\[([^\]]+)\]:\s+(.+)$/;
  const existingDefinitions = new Map();
  const retainedDefinitions = [];
  const body = [];

  for (const line of lines) {
    const match = line.match(linkDefinition);
    if (!match) {
      body.push(line);
    } else {
      existingDefinitions.set(match[1], match[2]);
      if (match[1] !== 'Unreleased' && match[1] !== version) {
        retainedDefinitions.push(line);
      }
    }
  }
  while (body.at(-1) === '') body.pop();

  const releaseVersions = body
    .map((line) => line.match(/^## \[([^\]]+)\] - \d{4}-\d{2}-\d{2}$/)?.[1])
    .filter(Boolean);
  const releaseIndex = releaseVersions.indexOf(version);
  if (releaseIndex < 0) {
    throw new Error(`missing changelog heading for ${version}`);
  }
  const previousVersion = releaseVersions[releaseIndex + 1];
  const previousUrl = existingDefinitions.get(previousVersion);
  const previousCommit = previousUrl?.match(/\/commit\/([^/?#]+)$/)?.[1];
  const baseUrl = repositoryUrl.replace(/(?:\.git)?\/$/, '');
  const versionUrl = previousVersion
    ? `${baseUrl}/compare/${previousCommit ?? `v${previousVersion}`}...v${version}`
    : `${baseUrl}/releases/tag/v${version}`;
  const definitions = [
    `[Unreleased]: ${baseUrl}/compare/v${version}...HEAD`,
    `[${version}]: ${versionUrl}`,
    ...retainedDefinitions,
  ];
  await writeFile(
    changelogPath,
    `${body.join('\n')}\n\n${definitions.join('\n')}\n`,
  );
}

/**
 * semantic-release `prepare` step: synchronize versions, update changelog
 * comparison links, and delete consumed fragments. It must run after
 * `@semantic-release/changelog` and before `@semantic-release/git`.
 */
export async function prepare(_pluginConfig, { cwd, nextRelease, options }) {
  await syncVersions({ root: cwd, version: nextRelease.version });
  await updateChangelogLinks(cwd, options.repositoryUrl, nextRelease.version);
  const files = await fragmentFiles(cwd);
  await Promise.all(files.map((file) => rm(file)));
}
