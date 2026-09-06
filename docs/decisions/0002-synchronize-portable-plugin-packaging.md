---
status: accepted
date: 2026-09-06
decision-makers: [phatblat]
---

# 0002 — Synchronize portable plugin packaging

## Context and Problem Statement

Decision [0001](0001-consolidate-skill-repos.md) established one flat Agent Skills collection distributed through Claude Code, Codex, and generic Agent Skills installation routes. The first packaged release exposed several cross-client gaps: version values drift between manifests, the SemVer checker examples assume the source repository layout, explicit-only invocation is not represented in every client that supports it, Codex marketplace policy is implicit, Cursor guidance predates native Agent Skills support, plugin manifests are not validated in CI, and the generated changelog does not follow the repository's own Keep a Changelog contract.

The repository needs one version authority and client-specific packaging metadata without forking the skill instructions into per-client variants. Unsupported invocation controls need an honest best-effort guard rather than a claim of enforceable parity.

## Considered Options

### Use `package.json` as the version authority

Keep the repository version in `package.json`; synchronize Python metadata and both plugin manifests through one dependency-free script. Semantic-release supplies its computed next version to the same script during `prepare`.

- Pro: Integrates directly with the existing JavaScript release toolchain.
- Pro: Gives local checks and release automation the same synchronization path.
- Con: `package.json` remains release metadata even though nothing is published to npm.

### Add a standalone `VERSION` file

Store the version in a new text file and derive every manifest from it.

- Pro: Vendor-neutral and easy to read.
- Con: Adds another release artifact and still requires semantic-release integration.
- Con: Provides no benefit over the existing `package.json` release metadata.

### Derive versions from Git tags

Treat the latest release tag as authoritative and generate manifest versions during packaging.

- Pro: Avoids a checked-in version authority.
- Con: Cannot represent the next version before semantic-release creates its tag.
- Con: Makes checked-in plugin manifests stale or environment-dependent.

## Decision Outcome

Use `package.json` as the sole editable version authority. Synchronize `pyproject.toml`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json` with a tested script; semantic-release calls that script with `nextRelease.version` and commits every synchronized file. Only semantic-release edits the value: the version in `package.json` is whatever the newest release tag says, never a hand-picked number.

**Correction (2026-09-06).** This decision was written and accepted claiming a `0.1.0` starting version, and CI briefly carried a step that would have tagged a `0.1.0` baseline. Both were wrong: the repository had already published `v1.0.0` (2026-09-05) and `v1.0.1` from `main`, so released history starts at `1.0.0`. The error came from reading an unfetched local tag list rather than the remote release tags. The synthetic `0.1.0` values, the changelog section, and the baseline step are removed; semantic-release continues from the newest tag, as it already did.

Keep portable behavior in each `SKILL.md`, but ship client metadata where a client defines it. `setup-phatblat-skills` retains `disable-model-invocation: true` for clients that honor it and adds `agents/openai.yaml` with `policy.allow_implicit_invocation: false` for Codex and ChatGPT. This reverses 0001's rejection of per-skill `agents/openai.yaml` for this one skill and one key: the rejection assumed the file would only carry Codex picker copy and MCP dependencies, and invocation control has no `SKILL.md` equivalent on those clients. Clients without invocation control receive a deliberately non-triggering description plus a first-step guard that exits unless the user explicitly requested setup. Documentation must distinguish enforced invocation control from this best-effort fallback.

Keep `semver.py` at `skills/semantic-versioning/scripts/semver.py`, which already packages it with the skill. Instructions resolve the executable from the directory containing the activated `SKILL.md`; they never assume the consuming repository contains a `skills/` tree.

Codex marketplace entries declare installation and authentication policies explicitly. A dependency-free repository validator checks both plugin manifests, both marketplaces, component paths, version synchronization, and required marketplace policy, and `just check` runs it. Cursor documentation treats native Agent Skills as the portable path and `.mdc` rules as an optional Cursor-specific artifact. Changelog generation emits the fixed preamble, `Unreleased`, version/date headings, and comparison links required by the repository's changelog skill.

## Consequences

- Release preparation changes four version-bearing files in lockstep and includes them in the semantic-release commit.
- Versions embedded in external standards, dependency constraints, lockfiles, and historical changelog sections are not repository-version values and are not synchronized.
- Claude Code, Cursor, Grok, Pi, Oh My Pi, Codex, and ChatGPT receive native explicit-only invocation metadata where supported.
- Claude.ai, OpenCode, Antigravity, Gemini CLI, and any other client without equivalent invocation control can only be guarded after selection; the repository does not claim otherwise.
- The shared skill body and bundled resources remain single-source and portable; no per-client copy of `SKILL.md` is introduced.
- Version numbers follow from the newest release tag; the repository never asserts a released version that has no tag.
- Each identified defect lands as its own implementation commit, with focused tests or validation where behavior changes.
