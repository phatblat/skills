# The setup-skill pattern

A collection ships one user-invoked `setup-<owner>-skills` skill that records
the per-repo facts its sibling skills would otherwise guess, in the consuming
repo's `AGENTS.md`.

## What it is

A single skill, run once per repository, that explores the repo, asks the
human a short set of questions, and writes the answers into a durable,
greppable block so every other skill in the collection can read them instead
of guessing.

## When to add one

Only when a sibling skill hard-depends on a repo-specific fact — a policy, a
vocabulary, a location — that cannot be detected reliably. Not for a
single-skill repo, and not for anything exploration can settle on its own.

## Shape

Named `setup-<owner>-skills`. Make it explicit-only through every client
extension that supports invocation control, then retain a body-level guard for
clients that do not:

| Clients                                                                    | Control                                                                                     | Guarantee                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Claude Code, Cursor, Grok, Pi, Oh My Pi                                    | `disable-model-invocation: true` in `SKILL.md`                                              | The model cannot select the skill implicitly.      |
| Codex and ChatGPT                                                          | `policy.allow_implicit_invocation: false` in `agents/openai.yaml`                           | The model cannot select the skill implicitly.      |
| Every other client, including Claude.ai, OpenCode, Antigravity, Gemini CLI | No equivalent invocation control; use a non-triggering description plus the first body step | Best effort: an already-loaded skill stops safely. |

The top-level field is outside the Agent Skills specification, so the
collection documents the deviation and excludes this one skill from strict
reference validation. A client-metadata directory such as `agents/` is likewise
outside the spec's `scripts/`, `references/`, and `assets/` conventions; ship
one only for a control the spec cannot express, and document it. The
`description` starts with an explicit-only
instruction rather than trigger phrases. The first body step stops unless the
user named the setup skill; repository state never implies consent. Flow:
explore, ask one section at a time with the recommendation first, confirm,
write, report.

## Section rules

- Skip a section whose skill is not installed.
- Skip a question exploration already answered.
- In a non-interactive session, apply the detected default for each section
  and name which defaults were used, rather than blocking on a question no
  one can answer.

## Where answers go

One `## Agent skills` section in `AGENTS.md`, updated in place on re-run,
built from fixed one-line literals per choice rather than free prose, so the
result is greppable and diffs cleanly. `AGENTS.md` is canonical; a harness
that reads another filename (e.g. `CLAUDE.md`) gets an import line pointing
at `AGENTS.md`, never a duplicate copy of the block.

## Reachability

No other skill can invoke a user-invoked skill. A sibling that needs setup
tells the human to run it; it never calls it itself.

## Worked example

`setup-phatblat-skills`, in this repo, is the worked example. It is named for
the command a human types (`/setup-phatblat-skills`), not for an activity, the
one deliberate exception to this collection's naming rule. It is referenced by
name only, without a relative path: a cross-skill file link breaks when
either skill is installed on its own, outside this repo.
