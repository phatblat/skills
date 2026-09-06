# Cross-Harness Compatibility Matrix

Claude Code, Claude.ai, Codex, Cursor, OpenCode, Antigravity, Grok, Pi and
Oh My Pi all read `SKILL.md`, so one spec-compliant skill covers all of
them. The columns below matter only when a target harness is outside that
set.

What "a skill" means differs across ecosystems. This table is for deciding
_which_ artifact(s) a portable capability needs to ship as.

|                              | Agent Skills (`SKILL.md`)                                                                                                | Cursor Rules (`.cursor/rules/*.mdc`)                                             | `AGENTS.md`                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Spec owner**               | Open standard, agentskills.io (originally Anthropic)                                                                     | Cursor (proprietary)                                                             | Open convention (Aider, Zed, Copilot, Cursor, others)                     |
| **Location**                 | `<skill-name>/SKILL.md`                                                                                                  | `.cursor/rules/<name>.mdc`                                                       | Repo root (or per-directory) `AGENTS.md`                                  |
| **Frontmatter**              | Required: `name`, `description` (+ optional `license`, `compatibility`, `metadata`, `allowed-tools`)                     | Required: `description`, `globs`, `alwaysApply`                                  | Typically none -- plain Markdown                                          |
| **`name`**                   | Must equal the skill's directory name                                                                                    | No equivalent; filename is the identifier                                        | No equivalent                                                             |
| **Triggering**               | Description-based: client decides relevance from `description` at runtime                                                | Glob-match on the file(s) being edited, or `alwaysApply: true` for every session | Passive -- read at session start, not "triggered" per task                |
| **Progressive disclosure**   | Three stages: metadata always loaded, body loaded on activation, `scripts/`/`references/`/`assets/` loaded/run on demand | None -- whole rule loads when it matches                                         | None -- whole file loads every session                                    |
| **Bundled code/assets**      | Yes: `scripts/`, `references/`, `assets/` conventions                                                                    | No -- text only                                                                  | No -- text only                                                           |
| **Portable across clients?** | Yes, by design -- growing client list at agentskills.io/clients                                                          | No -- Cursor-specific format                                                     | Yes as a convention, but each tool decides how much of it to load and how |

## What this means for a portable skill

1. **`SKILL.md` is the source of truth.** Write it once, to the spec, per
   `spec-fields.md`.
2. **`AGENTS.md` needs its own copy of load-bearing instructions** if a
   target harness only reads `AGENTS.md` and doesn't support Agent Skills at
   all. Keep it short -- link back to the skill's `references/` for depth
   rather than duplicating everything, and re-sync by hand when the skill
   changes materially.
3. **A Cursor `.mdc` rule is a separate artifact**, needed only for a repo
   that standardizes on Cursor rules; Cursor reads `SKILL.md`, so a portable
   skill needs no mirror for it. When one is wanted anyway, decide the
   `globs`/`alwaysApply` triggering condition explicitly; it has no
   equivalent in `SKILL.md`'s `description`-based triggering, so it can't be
   derived automatically without human judgment about when the rule should
   fire.
4. **Don't assume harness-specific frontmatter extensions travel.** Fields
   like `triggers`, `argument-hint`, `level`, or `aliases` seen in some
   Claude-Code-flavored skill collections are not part of the open spec.
   They're harmless on a parser that ignores unknown keys, but a strict
   validator (`skills-ref validate`) or a different client's stricter
   parser may reject them or simply never read them. Prefer the spec's
   `metadata` map for anything a specific harness needs.

## Explicit-only invocation

Explicit-only invocation is a client extension, not part of the Agent Skills
specification:

| Clients                                      | Metadata                                                          | Fallback needed? |
| -------------------------------------------- | ----------------------------------------------------------------- | ---------------- |
| Claude Code, Cursor, Grok, Pi, Oh My Pi      | `disable-model-invocation: true`                                  | No               |
| Codex and ChatGPT                            | `policy.allow_implicit_invocation: false` in `agents/openai.yaml` | No               |
| Claude.ai, OpenCode, Antigravity, Gemini CLI | No equivalent control                                             | Yes              |

For an explicit-only skill, ship every supported metadata form from the same
skill directory. On unsupported clients, make the description say that the
skill runs only when explicitly named and make the first body step stop unless
the user did so. This prevents mutation after accidental selection but cannot
prevent the client from loading the skill; document that distinction.

## Other clients

The client list at <https://agentskills.io/clients> grows regularly (Claude
Code, Claude.ai, Windsurf, Codex/ChatGPT, Gemini CLI, Cline, Roo Code, and
more, at time of writing). Most of these read `SKILL.md` directly and need
no separate mirror -- check that list before assuming a mirror is required
for a specific target.
