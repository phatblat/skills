# Consolidate the three skill repos into one plugin repo

## Issue

Three repos each ship one agent skill — `changelog-skill`, `semver-skill`, and
`portable-skill-authoring` — with duplicated toolchain (three justfiles, three
`mise.toml`, three near-identical `ci.yml`) and no shared install path. Each
skill is useful on its own, but installing all three means three separate plugin
installs or three separate `~/.agents/skills` symlinks, and every toolchain fix
has to land three times.

## Status

This is a proposal that is **accepted**.

## Assumptions and Constraints

- Every skill published here must work unchanged on Claude Code, Claude.ai,
  Codex, Cursor, OpenCode, Antigravity, Grok, Pi, and Oh My Pi — all of them
  read `SKILL.md` directly, so portability is a standing requirement, not a
  per-skill choice.
- The repo follows the
  [conventional-docs](https://github.com/phatblat/conventional-docs) practice
  already in use by these skills' author: `.changes/` fragments, a generated
  `CHANGELOG.md`, decision records under `docs/decisions/`, and the
  `decision:`/`plan:`/`release:`/`deploy:` commit event types.
- History is imported fresh (one `feat:` commit per skill); the three source
  repos keep their own history on GitHub and are archived, not deleted, once
  this repo is live.
- A skill's `name` frontmatter must equal its directory name, and a skill's
  frontmatter otherwise stays spec-clean (`name`, `description`, `license`): see
  `skills/authoring-skills/references/spec-fields.md`.

## Argument

A single-plugin repo shipping several skills is a well-established shape
(`mattpocock/skills` ships dozens this way); nothing about "one skill per
plugin" is required by the Agent Skills spec, Claude Code's plugin format, or
Codex's plugin format. The three repos are small enough (one skill each) that
splitting install into three commands buys no isolation the plugin's directory
structure doesn't already provide, and costs three toolchains to maintain
identically.

`mattpocock/skills`' bucketed `skills/<bucket>/<name>/` tree and per-skill
`docs/<bucket>/<skill>.md` pages solve a scale problem (dozens of skills, a
public doc site) this four-skill repo does not have; adopting them here would
add indirection with no present payoff. The relevant parts of that repo's
structure — one repo as its own plugin marketplace, a user-invoked
`setup-<owner>-skills` skill, section-skipping in that setup skill, and an
idempotent `link`/`unlink` install pair — are adopted; the bucket tree, doc
pages, changesets, `.out-of-scope/` directory, and `agents/openai.yaml` are not
(see Positions).

## Architectural Decision

1. One repo, `phatblat/skills`, replaces the three source repos as the
   distribution point for their skills.
2. Skills live at a flat `skills/<name>/SKILL.md`; there is no bucket directory
   between `skills/` and the skill name.
3. The repo ships as a single plugin, `phatblat-skills`, installable both as a
   Claude Code plugin (`.claude-plugin/plugin.json` +
   `.claude-plugin/marketplace.json`) and as a Codex plugin
   (`.codex-plugin/plugin.json`).
4. Releases are automated by semantic-release from `.changes/*.md` fragments;
   nothing is published to npm.
5. Skill names name the activity, not the artifact or a property shared by every
   skill in the collection: `recording-changes`, not `changelog`;
   `authoring-skills`, not `portable-skill-authoring`. The one exception is the
   user-invoked setup skill, `setup-phatblat-skills`, named for the command a
   human types.
6. Git history is imported fresh, one `feat:` commit per skill; the source
   repos' own history is left on GitHub.

## Consequences

- No bucket tree, so a single path (`./skills/`) expresses the whole set for
  Codex, which is what forced `mattpocock/skills` to defer a Codex plugin.
- `plugin.json` carries no `version`; Claude Code resolves a plugin's version
  from the marketplace entry, then the git SHA, so semantic-release's tag stays
  the only version authority and there is nothing to keep in sync.
- Skills stay spec-clean (`name`, `description`, `license`), with exactly one
  documented deviation: `setup-phatblat-skills` carries Claude Code's
  `disable-model-invocation: true`, because a skill that writes into the user's
  repo must not be model-triggerable. The reference validator (`skills-ref`)
  rejects unknown frontmatter keys as errors, so `scripts/validate-skills.mjs`
  allows that one key explicitly and `just lint-skills-ref` skips that one
  skill.
- `semantic-versioning`'s `version:` frontmatter key and the drift-guard recipe
  that checked it against `pyproject.toml` are dropped: no harness reads a
  `version` key, it is not in the Agent Skills spec, and one repo has one
  version.
- The first semantic-release run cuts `1.0.0`; the skill names and CLI install
  commands are the public API this fixes.
- Nothing is published to npm.
- No skills.sh pack: a pack exists to fold skills from several sources — public
  and private files, other repos — behind one `https://skills.sh/p/<id>` install
  command; one public repo already installs in one command. Packs are also
  unlisted, created and deleted in a hosted Vercel UI rather than in git, and
  installs from a pack URL do not attribute to `phatblat/skills`, so a pack
  would trade the directory listing for a link that can silently stop working.
  Revisit only for a cross-repo bundle, such as these skills plus
  `phatblat/conventional-docs`.
- Working unchanged on Claude Code, Claude.ai, Codex, Cursor, OpenCode,
  Antigravity, Grok, Pi, and Oh My Pi is a standing requirement of every skill
  here, not a per-skill choice; there is no per-harness mirror to maintain, and
  the frontmatter budget is the spec's fields.

## Positions

- **Bucketed `skills/<bucket>/<name>/`.** Rejected. Four skills need no
  promotion model, and flat `skills/<name>/` is what makes
  `"skills": "./skills/"` expressible for Codex.
- **An explicit `skills` array in `plugin.json`.** Rejected. Claude Code always
  scans `skills/`, and a manifest key merely adds to that scan, so listing the
  four paths is redundant; the array would only earn its place with a bucketed
  tree.
- **`docs/<bucket>/<skill>.md` pages.** Rejected. They exist in
  `mattpocock/skills` to feed a doc site that renders its own install widget;
  `README.md` plus each `SKILL.md` is the whole audience here.
- **Changesets plus a version-sync script.** Rejected. conventional-docs'
  practice is semantic-release plus `.changes/` fragments, and `plugin.json`
  carries no version to keep in sync. Amended by
  [0002](0002-synchronize-portable-plugin-packaging.md): both manifests now
  carry a version, and `scripts/sync-versions.mjs` keeps them equal to
  `package.json` during the release. The `.changes/` fragment practice stands.
- **`agents/openai.yaml` per skill.** Rejected. It exists for Codex UI copy and
  MCP tool dependencies that these skills have neither of; the plugin's
  `interface` block covers picker copy once. Amended by
  [0002](0002-synchronize-portable-plugin-packaging.md) for one skill:
  `setup-phatblat-skills` ships the file solely to carry
  `policy.allow_implicit_invocation: false`, which has no `SKILL.md`
  equivalent on Codex and ChatGPT. No other skill has one.
- **A router skill that dispatches to the other three.** Rejected. A router that
  goes stale is worse than no router, and four skills fit in `README.md`.
- **A skills.sh pack.** Rejected; see Consequences.

## References

- [mattpocock/skills](https://github.com/mattpocock/skills) — the multi-skill
  plugin repo this decision borrows its plugin/marketplace and setup-skill shape
  from.
- [Agent Skills specification](https://agentskills.io) — the frontmatter and
  `SKILL.md` contract every skill here targets.

## Dates

- Published: 2026-09-05
