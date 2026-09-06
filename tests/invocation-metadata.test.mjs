import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

const skillDir = 'skills/setup-phatblat-skills';

test('setup skill is explicit-only on Claude-compatible and OpenAI clients', async () => {
  const skill = await readFile(`${skillDir}/SKILL.md`, 'utf8');
  const frontmatter = Bun.YAML.parse(skill.match(/^---\n([\s\S]*?)\n---/)[1]);
  const openai = Bun.YAML.parse(
    await readFile(`${skillDir}/agents/openai.yaml`, 'utf8'),
  );

  expect(frontmatter['disable-model-invocation']).toBe(true);
  expect(openai.policy.allow_implicit_invocation).toBe(false);
  expect(skill.replace(/\s+/g, ' ')).toContain(
    'Stop unless the user explicitly asked to run `setup-phatblat-skills`.',
  );
});
