import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const CHANGES_DIR = '.changes';
export const CHANGE_TYPES = [
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
];
export const CHANGE_LINE_RE = new RegExp(
  `^- (${CHANGE_TYPES.join('|')}): (.+)$`,
);

/** List change fragment files, excluding the directory's own README. */
export async function fragmentFiles(root = '.') {
  const changesDir = path.join(root, CHANGES_DIR);
  const entries = await readdir(changesDir, { withFileTypes: true }).catch(
    () => [],
  );
  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        entry.name !== 'README.md',
    )
    .map((entry) => path.join(changesDir, entry.name))
    .sort();
}
