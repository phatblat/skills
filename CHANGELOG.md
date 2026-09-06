# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-05

### Added

- an `authoring-skills` skill for authoring and auditing `SKILL.md` packages against the Agent Skills specification, portable across every harness this project targets.
- `phatblat-skills` ships as a Claude Code plugin and marketplace, and as a Codex plugin, alongside the existing `npx skills` install route.
- a `recording-changes` skill, guiding agents to read and update `CHANGELOG.md` under Keep a Changelog 2.0.0.
- a `semantic-versioning` skill with a stdlib-only checker for validating, comparing, sorting, and bumping Semantic Versioning 2.0.0 versions.
- a `setup-phatblat-skills` skill that records a repository's changelog policy and versioning scheme in its `AGENTS.md`.

[Unreleased]: https://github.com/phatblat/skills/commits/main/
[0.1.0]: https://github.com/phatblat/skills/commit/e52da4bd6267d61abfc347850a9328a0c557eac1
