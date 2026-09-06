import { expect, test } from 'bun:test';

const marketplace = await Bun.file('.agents/plugins/marketplace.json').json();

test('Codex marketplace declares installation policy explicitly', () => {
  expect(marketplace.plugins).toHaveLength(1);
  expect(marketplace.plugins[0].policy).toEqual({
    installation: 'AVAILABLE',
    authentication: 'ON_INSTALL',
  });
  expect(marketplace.plugins[0].category).toBe('Productivity');
});
