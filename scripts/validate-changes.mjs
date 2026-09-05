import { readFile } from 'node:fs/promises';
import { CHANGE_LINE_RE, CHANGE_TYPES, fragmentFiles } from './changes-lib.mjs';

const files = await fragmentFiles();
let hasErrors = false;

for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const [index, line] of content.split('\n').entries()) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!CHANGE_LINE_RE.test(trimmed)) {
      hasErrors = true;
      console.error(
        `${file}:${index + 1}: not a valid change line: ${trimmed}`,
      );
      console.error(`  expected: - <${CHANGE_TYPES.join('|')}>: <description>`);
    }
  }
}

if (hasErrors) {
  process.exit(1);
}
