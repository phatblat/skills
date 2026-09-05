# Agent Skills Frontmatter Field Reference

Source of truth: <https://agentskills.io/specification>. This file mirrors the
rules that matter when authoring for portability; read the live spec if a
client-specific edge case isn't covered here.

## `name` (required)

- 1-64 characters.
- Lowercase unicode alphanumeric (`a-z`, `0-9`) and hyphens (`-`) only.
- Must not start or end with a hyphen.
- Must not contain consecutive hyphens (`--`).
- **Must match the parent directory name exactly.** This is the single most
  common portability bug: renaming a skill directory without updating
  `name` (or vice versa) silently breaks clients that enforce the match.

```yaml
name: pdf-processing      # valid
name: PDF-Processing      # invalid: uppercase
name: -pdf                # invalid: leading hyphen
name: pdf--processing     # invalid: consecutive hyphens
```

## `description` (required)

- 1-1024 characters, non-empty.
- This is the _entire_ signal a client uses to decide whether to load the
  skill (progressive disclosure stage 1). Write what the skill does **and**
  when to use it, including concrete trigger phrases/contexts.
- See `description-writing.md` for the triggering-quality guidance.

## `license` (optional)

- Short: either an SPDX-style license name (`MIT`, `Apache-2.0`) or a
  pointer to a bundled license file (`See LICENSE.txt`).
- Always safe to include; costs nothing for portability.

## `compatibility` (optional)

- 1-500 characters.
- States environment requirements: target product, required system
  packages/binaries, network access needs, required interpreter versions.
- Only include it when the skill actually has a requirement worth stating --
  most skills don't need it. When a skill is intentionally single-harness,
  this is the field that documents that honestly instead of the skill
  silently failing elsewhere.

```yaml
compatibility: Requires git, docker, jq, and internet access
compatibility: Designed for Claude Code (or similar products)
```

## `metadata` (optional)

- A flat map of string keys to string values.
- Not interpreted by the spec itself -- clients may read it for their own
  purposes, and unrecognized keys are ignored, not rejected.
- Use this, not a bare top-level key, for harness-specific bookkeeping you
  want to keep alongside a portable skill (e.g. a Claude-Code-only
  argument hint): `metadata.claude-code-argument-hint: "<file> [options]"`.
  Namespacing the key avoids collisions with a different harness's own
  metadata convention.

## `allowed-tools` (optional, experimental)

- Space-separated string of pre-approved tool invocations, e.g.
  `Bash(git:*) Bash(jq:*) Read`.
- Explicitly called out in the spec as experimental with client-varying
  support. Do not depend on it being the _only_ gate on tool access -- a
  client that ignores the field will run the skill with its normal
  permission model instead.

## Directory layout

```text
skill-name/
├── SKILL.md          # required
├── scripts/          # optional: executable code, run by the agent
├── references/        # optional: docs, read by the agent as needed
├── assets/            # optional: templates/resources, used in output
└── ...                # anything else
```

- `scripts/` contents are meant to be _executed_; `references/` contents are
  meant to be _read_. Putting instructions the agent should follow verbatim
  into `scripts/` (or executable code into `references/`) works by accident
  on clients that don't distinguish the two, and breaks on ones that do.
- Keep file references in `SKILL.md` one level deep (`references/foo.md`),
  not chained (`references/foo.md` pointing at `references/bar/baz.md`).
