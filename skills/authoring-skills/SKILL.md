---
name: authoring-skills
description: "Author or audit an agent skill (a SKILL.md package) so it works across every harness this project targets: Claude Code, Claude.ai, Codex, Cursor, OpenCode, Antigravity, Grok, Pi, and Oh My Pi. Use when creating a new skill, when adding a user-invoked setup skill to a skill collection, when converting a harness-specific skill (Claude-only frontmatter, Cursor .mdc rules) into a portable one, or when validating a SKILL.md against the agentskills.io specification before publishing it."
license: MIT
metadata:
  author: phatblat
---

# Authoring Skills

Skills are folders with a `SKILL.md` file. The format itself -- YAML
frontmatter plus Markdown instructions, optional `scripts/`, `references/`,
`assets/` -- is an open, vendor-neutral standard
([agentskills.io/specification](https://agentskills.io/specification)),
originally published by Anthropic and now adopted by a growing list of
clients (Claude Code, Claude.ai, Cursor, Windsurf, Codex/ChatGPT, Gemini CLI,
Cline, Roo Code, and more -- see
[agentskills.io/clients](https://agentskills.io/clients)). Most skills that
fail to port cleanly do so not because the format disagrees, but because the
author leaned on one harness's _extensions_ to that format, or on assumptions
that harness makes about triggering, tool access, or file layout. This skill
is that checklist.

## Workflow

### 1. Know the target set

Every skill published here must work unchanged on Claude Code and
Claude.ai, Codex, Cursor, OpenCode, Antigravity, Grok, Pi, and Oh My Pi.
All of them read `SKILL.md` directly, so the portable form is the only
form and there is no per-harness variant to plan. That fixes the
frontmatter budget to the fields in `references/spec-fields.md`. A skill
that genuinely cannot run on one of them says so in `compatibility` and
says why in its body; a harness-only top-level key is a deviation to
justify in writing, not a default, because a strict validator rejects
unknown keys outright rather than warning.

### 2. Write the frontmatter to the lowest common denominator first

Only `name` and `description` are required by the spec. Add optional fields
deliberately, not by copying a template that has them all:

| Field           | Adds                                                  | Cost                                                                                  |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `license`       | Machine-readable license                              | None -- always safe to include                                                        |
| `compatibility` | States environment/harness requirements in prose      | None -- always safe, and required honesty if the skill _isn't_ portable               |
| `metadata`      | Free-form string map for harness-specific bookkeeping | Ignored by clients that don't recognize the key -- safe                               |
| `allowed-tools` | Pre-approves tool invocations                         | Experimental; support varies by client -- do not rely on it being enforced everywhere |

Harness-specific keys that are **not** part of the spec (Claude Code's
`triggers`, `argument-hint`, `level`, `aliases` seen in some ecosystems) are
tolerated by parsers that ignore unknown keys, but a strict validator or a
different harness may reject or simply never read them. Put anything a
specific harness needs to function into `metadata` (namespaced, e.g.
`metadata.claude-code-argument-hint`) rather than a bare top-level key, unless
you have confirmed every target harness ignores unknown top-level keys
safely.

Full field-by-field rules (character limits, the `name` \== directory-name
constraint, hyphen rules): `references/spec-fields.md`.

### 3. Respect the constraints every client shares

- `name` must equal the containing directory's name, lowercase
  alphanumeric-and-hyphens, 1-64 chars, no leading/trailing/double hyphens.
- `description` is the _entire_ triggering signal for progressive
  disclosure -- write it to include both what the skill does and concrete
  situations/keywords that should trigger it. See
  `references/description-writing.md`.
- Keep `SKILL.md` itself under ~500 lines / ~5000 tokens. Move detail into
  `references/*.md`, loaded by the agent only when needed -- this is what
  makes a skill cheap to keep installed. Link to them with a one-level-deep
  relative path (`references/foo.md`), not a nested chain.
- Anything under `scripts/` may be executed directly by an agent. Anything
  under `references/` and `assets/` is read/used, never executed. Don't blur
  the two -- an agent deciding whether to `read` or `run` a bundled file
  relies on which directory it's in.

### 4. Add adjacent instruction formats only for different behavior

Every client in this repository's target set reads `SKILL.md`, including
Cursor. Do not mirror a portable skill merely because a target also supports a
different instruction format:

- **`AGENTS.md`** is plain prose, always loaded rather than triggered. Put
  repository-wide facts there when they must be present for every task; do not
  duplicate an on-demand skill into it.
- **Cursor `.mdc` rules** (`.cursor/rules/*.mdc`) provide Cursor-specific
  always-on or path-scoped behavior. Cursor discovers `SKILL.md` directly, so
  targeting Cursor does not require a rule mirror. Create a separate `.mdc`
  artifact only when the requested behavior specifically depends on Cursor
  rule semantics such as `alwaysApply` or `globs`.

Full comparison table: `references/compatibility-matrix.md`.

### 5. Validate before calling it done

Run the official reference validator against the skill directory. It checks
frontmatter shape (required fields, `name` character rules, `name`/directory
match, field length limits) but not portability judgment calls (step 1-4
above), which need a human/agent read-through:

```bash
uvx --from skills-ref agentskills validate path/to/skill
```

See `references/validation.md` for the other `skills-ref` subcommands
(`read-properties`, `to-prompt`) and what each catches.

### 6. Start from the template, not a blank file

`assets/SKILL-template.md` is a minimal, spec-only skeleton (just `name` +
`description`, plus commented-out optional fields) to copy for a new
portable skill.

## Skill collections

A collection of skills sharing per-repo configuration ships one user-invoked
`setup-<owner>-skills` skill for all of them, instead of each sibling
guessing. See `references/setup-skill-pattern.md`.

## Common mistakes

- Treating `description` as a one-line summary instead of the trigger
  mechanism -- under-triggering is the most common real-world skill failure.
- Copying a rich frontmatter block (`triggers`, `level`, `argument-hint`)
  from one harness's convention into a skill meant to be portable, without
  checking whether the target harnesses use or ignore those keys.
- Assuming `allowed-tools` is enforced identically everywhere -- it's marked
  experimental in the spec for a reason.
- Letting `SKILL.md` grow past the point where an agent can afford to load
  it every time the skill triggers, instead of splitting into `references/`.
- Shipping a skill that only works in one harness without setting
  `compatibility` to say so.

## References

- `references/spec-fields.md` -- full frontmatter field rules from the spec
- `references/compatibility-matrix.md` -- SKILL.md/agentskills.io spec vs.
  Cursor `.mdc` rules vs. `AGENTS.md`, field by field
- `references/description-writing.md` -- writing descriptions that trigger
  reliably
- `references/validation.md` -- using the `skills-ref` reference validator
- `references/setup-skill-pattern.md` -- the user-invoked
  `setup-<owner>-skills` skill pattern for a collection sharing per-repo
  configuration
- `assets/SKILL-template.md` -- minimal spec-only starting template
