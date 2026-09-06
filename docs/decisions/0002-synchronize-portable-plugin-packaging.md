---
status: proposed
date: 2026-09-06
decision-makers: [phatblat]
---

# 0002 — Synchronize portable plugin packaging

## Context and Problem Statement

Decision 0001 established one flat Agent Skills collection distributed through Claude Code, Codex, and generic Agent Skills installation routes. The first packaged release exposed several cross-client gaps: version values drift between manifests, the SemVer checker examples assume the source repository layout, explicit-only invocation is not represented in every client that supports it, Codex marketplace policy is implicit, Cursor guidance predates native Agent Skills support, plugin manifests are not validated in CI, and the generated changelog does not follow the repository's own Keep a Changelog contract.

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

Use `package.json` as the sole editable version authority, starting at `0.1.0`. Synchronize `pyproject.toml`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json` with a tested script; semantic-release calls that script with `nextRelease.version` and commits every synchronized file.

Keep portable behavior in each `SKILL.md`, but ship client metadata where a client defines it. `setup-phatblat-skills` retains `disable-model-invocation: true` for clients that honor it and adds `agents/openai.yaml` with `policy.allow_implicit_invocation: false` for Codex and ChatGPT. Clients without invocation control receive a deliberately non-triggering description plus a first-step guard that exits unless the user explicitly requested setup. Documentation must distinguish enforced invocation control from this best-effort fallback.

Keep `semver.py` at `skills/semantic-versioning/scripts/semver.py`, which already packages it with the skill. Instructions resolve the executable from the directory containing the activated `SKILL.md`; they never assume the consuming repository contains a `skills/` tree.

Codex marketplace entries declare installation and authentication policies explicitly. A dependency-free repository validator checks both plugin manifests, both marketplaces, component paths, version synchronization, and required marketplace policy, and `just check` runs it. Cursor documentation treats native Agent Skills as the portable path and `.mdc` rules as an optional Cursor-specific artifact. Changelog generation emits the fixed preamble, `Unreleased`, version/date headings, and comparison links required by the repository's changelog skill.

## Consequences

- Release preparation changes four version-bearing files in lockstep and includes them in the semantic-release commit.
- Versions embedded in external standards, dependency constraints, lockfiles, and historical changelog sections are not repository-version values and are not synchronized.
- Claude Code, Cursor, Grok, Pi, Oh My Pi, Codex, and ChatGPT receive native explicit-only invocation metadata where supported.
- OpenCode, Antigravity, Gemini CLI, and any other client without equivalent invocation control can only be guarded after selection; the repository does not claim otherwise.
- The shared skill body and bundled resources remain single-source and portable; no per-client copy of `SKILL.md` is introduced.
- Each identified defect lands as its own implementation commit, with focused tests or validation where behavior changes.
