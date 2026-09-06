[![skills.sh](https://skills.sh/b/phatblat/skills)](https://skills.sh/phatblat/skills)

# phatblat-skills

Agent skills for changelogs, semantic versioning, and authoring portable agent
skills — packaged as a single [Agent Skills](https://agentskills.io) collection
for use across Claude Code, Claude.ai, Codex and ChatGPT, Cursor, OpenCode,
Antigravity, Grok, Pi, and Oh My Pi, plus every other client that reads
`SKILL.md`.

## Skills

| Skill                   | Description                                                                      | Invocation                    |
| ----------------------- | -------------------------------------------------------------------------------- | ----------------------------- |
| `recording-changes`     | Read and update `CHANGELOG.md` under Keep a Changelog 2.0.0.                     | Model-invoked                 |
| `semantic-versioning`   | Validate, compare, sort, and bump Semantic Versioning 2.0.0 versions.            | Model-invoked                 |
| `authoring-skills`      | Author or audit a `SKILL.md` package against the Agent Skills specification.     | Model-invoked                 |
| `setup-phatblat-skills` | Record a repository's changelog policy and versioning scheme in its `AGENTS.md`. | Explicit-only where supported |

`setup-phatblat-skills` uses native explicit-only metadata for Claude Code,
Cursor, Grok, Pi, Oh My Pi, Codex, and ChatGPT. Every other client, Claude.ai,
OpenCode, Antigravity, and Gemini CLI among them, exposes no equivalent
control, so the skill uses a non-triggering description and stops before doing
work unless the user named it. See the
[compatibility matrix](skills/authoring-skills/references/compatibility-matrix.md#explicit-only-invocation).

## Install

Claude Code:

```text
/plugin marketplace add phatblat/skills
/plugin install phatblat-skills@phatblat
```

Codex:

```bash
codex plugin marketplace add phatblat/skills
```

Any Agent Skills client, via the `skills` CLI:

```bash
npx skills@latest add phatblat/skills
```

Then run `/setup-phatblat-skills` once per repository. The plugin routes and
the `npx skills` route are exclusive: installing both leaves every skill
twice.

## Development

```bash
just deps          # install pinned tools, dependencies, and git hooks
just check         # run every gate (format, lint, tests)
just link          # symlink every skill into ~/.agents/skills
just unlink        # remove those symlinks
just --list        # see every recipe
```

## License

MIT, see [LICENSE.md](LICENSE.md).
