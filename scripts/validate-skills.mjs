import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const SKILLS_DIR = 'skills';
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ALLOWED_KEYS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
]);

let hasErrors = false;

function fail(file, problem) {
  hasErrors = true;
  console.error(`${file}: ${problem}`);
}

const dirs = await readdir(SKILLS_DIR, { withFileTypes: true }).catch(() => []);

for (const dir of dirs) {
  if (!dir.isDirectory()) continue;
  const skillDir = path.join(SKILLS_DIR, dir.name);
  const file = path.join(skillDir, 'SKILL.md');
  const content = await readFile(file, 'utf8').catch(() => null);

  if (content === null) {
    fail(skillDir, 'missing SKILL.md');
    continue;
  }

  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    fail(file, 'missing YAML frontmatter delimited by --- lines');
    continue;
  }

  let frontmatter;
  try {
    frontmatter = Bun.YAML.parse(match[1]);
  } catch (error) {
    fail(file, `invalid YAML frontmatter: ${error.message}`);
    continue;
  }

  if (frontmatter === null || typeof frontmatter !== 'object') {
    fail(file, 'frontmatter must be a YAML mapping');
    continue;
  }

  for (const key of Object.keys(frontmatter)) {
    if (!ALLOWED_KEYS.has(key)) {
      fail(file, `unknown frontmatter key: ${key}`);
    }
  }

  const { name, description, license, compatibility, metadata } = frontmatter;

  if (typeof name !== 'string' || name.length === 0) {
    fail(file, 'name is required and must be a non-empty string');
  } else {
    if (name.length > 64) {
      fail(file, `name exceeds 64 characters: ${name.length}`);
    }
    if (!NAME_RE.test(name)) {
      fail(
        file,
        `name must be lowercase letters, digits, and hyphens (no leading/trailing hyphen): ${name}`,
      );
    }
    if (name !== dir.name) {
      fail(file, `name must match the directory name: ${name} !== ${dir.name}`);
    }
  }

  if (typeof description !== 'string' || description.length === 0) {
    fail(file, 'description is required and must be a non-empty string');
  } else if (description.length > 1024) {
    fail(file, `description exceeds 1024 characters: ${description.length}`);
  }

  if (license !== undefined && typeof license !== 'string') {
    fail(file, 'license must be a string');
  }

  if (compatibility !== undefined) {
    if (typeof compatibility !== 'string') {
      fail(file, 'compatibility must be a string');
    } else if (compatibility.length > 500) {
      fail(
        file,
        `compatibility exceeds 500 characters: ${compatibility.length}`,
      );
    }
  }

  if (metadata !== undefined) {
    if (
      metadata === null ||
      typeof metadata !== 'object' ||
      Array.isArray(metadata)
    ) {
      fail(file, 'metadata must be a mapping of string to string');
    } else {
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value !== 'string') {
          fail(file, `metadata.${key} must be a string`);
        }
      }
    }
  }

  if (
    frontmatter['allowed-tools'] !== undefined &&
    typeof frontmatter['allowed-tools'] !== 'string'
  ) {
    fail(file, 'allowed-tools must be a string');
  }
}

if (hasErrors) {
  process.exit(1);
}
