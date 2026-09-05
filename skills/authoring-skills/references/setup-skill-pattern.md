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

Named `setup-<owner>-skills`. User-invoked: Claude Code honours
`disable-model-invocation: true`, every other harness ignores it, and a
strict validator rejects it, so a collection that sets it says so in its own
docs (its `DECISIONS.md`/decision record). The `description` is human-facing,
read in a slash-command list, with no "Use when the user mentions…" trigger
list — the model cannot invoke this skill. Flow: explore, ask one section at
a time with the recommendation first, confirm, write, report.

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
