export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Add this project's own lifecycle event types (see EVENTS.md) to the
    // standard Conventional Commits type list.
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'decision',
        'deploy',
        'docs',
        'feat',
        'fix',
        'perf',
        'plan',
        'refactor',
        'release',
        'revert',
        'style',
        'test',
      ],
    ],
  },
};
