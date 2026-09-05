import { readFile, rm } from 'node:fs/promises';
import { CHANGE_LINE_RE, CHANGE_TYPES, fragmentFiles } from './changes-lib.mjs';

/**
 * semantic-release `generateNotes` step: fold every `.changes/*.md` fragment
 * into this release's notes, grouped by Keep a Changelog category.
 */
export async function generateNotes() {
  const files = await fragmentFiles();
  if (files.length === 0) return '';

  const grouped = new Map(CHANGE_TYPES.map((type) => [type, []]));
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.trim().match(CHANGE_LINE_RE);
      if (match) grouped.get(match[1]).push(match[2]);
    }
  }

  return CHANGE_TYPES.filter((type) => grouped.get(type).length > 0)
    .map(
      (type) =>
        `### ${type}\n${grouped
          .get(type)
          .map((entry) => `- ${entry}`)
          .join('\n')}`,
    )
    .join('\n\n');
}

/**
 * semantic-release `prepare` step: delete the fragments this release
 * consumed. Must run before `@semantic-release/git`'s `prepare` step so the
 * deletions are staged in the release commit — keep this plugin earlier than
 * `@semantic-release/git` in `.releaserc.json`'s `plugins` array.
 */
export async function prepare() {
  const files = await fragmentFiles();
  await Promise.all(files.map((file) => rm(file)));
}
