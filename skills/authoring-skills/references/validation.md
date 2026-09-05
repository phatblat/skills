# Validating with `skills-ref`

[`skills-ref`](https://pypi.org/project/skills-ref/)
([source](https://github.com/agentskills/agentskills/tree/main/skills-ref))
is the official reference library for the Agent Skills spec. It is
explicitly marked "for demonstration purposes only, not for production" by
its authors, but it is the closest thing to an authoritative linter for
frontmatter shape, and it's what this skill's own `just lint` recipe runs.

It's published on PyPI as the `skills-ref` package, but the CLI entry point
it installs is named `agentskills`, not `skills-ref` -- run it with `uvx`
(no local install/venv needed):

```bash
uvx --from skills-ref agentskills validate path/to/skill
```

## What it catches

- Missing or malformed frontmatter (not valid YAML, missing `name`/`description`).
- `name` character-set and length violations.
- `name` not matching the parent directory name.
- `description` length violations.
- Other field-length limits (`compatibility`, `license`, `metadata` values).

## What it does not catch

`agentskills validate` checks _shape_, not portability judgment. It will not
tell you:

- Whether the `description` is specific enough to trigger reliably (see
  `description-writing.md`).
- Whether a harness-specific frontmatter extension will be silently ignored
  or actively rejected by a different client.
- Whether a skill that references `AGENTS.md`-only or Cursor-only harnesses
  needs a separate mirror artifact (see `compatibility-matrix.md`).

Treat a clean validation as necessary, not sufficient, for portability.

## Other subcommands

```bash
# Print parsed name/description/etc as JSON
uvx --from skills-ref agentskills read-properties path/to/skill

# Generate the <available_skills> system-prompt block for one or more skills
uvx --from skills-ref agentskills to-prompt path/to/skill-a path/to/skill-b
```

`to-prompt` is useful for sanity-checking exactly what an agent's discovery
stage will see, since it renders the same `<available_skills>` XML block the
spec recommends clients inject into the system prompt.
