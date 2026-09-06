# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2026-09-06

### Changed

- skill documentation names one target client set and, from it, every client that enforces explicit-only invocation.

### Fixed

- the Codex marketplace now declares installation and authentication policies explicitly.
- generated changelogs now include the standard preamble, dated version headings, and comparison links.
- skill authoring guidance now reflects Cursor's native Agent Skills support.
- generated changelogs no longer carry a blank-line run that fails markdownlint, and release preparation stops instead of guessing when the changelog has no heading for the version being released.
- plugin validation now checks every component path in both plugin manifests, including paths written without a `./` prefix.
- setup remains explicit-only on clients with invocation controls and stops safely on clients without them.
- the Semantic Versioning checker now runs from installed skill locations instead of assuming the source repository layout.
- plugin and package versions now stay synchronized from one release value.

## [1.0.1] - 2026-09-05

### Fixed

- the npm package is named `@phatblat/skills`.
- generated changelogs keep a blank line after every heading.

## [1.0.0] - 2026-09-05

### Added

- an `authoring-skills` skill for authoring and auditing `SKILL.md` packages against the Agent Skills specification, portable across every harness this project targets.
- `phatblat-skills` ships as a Claude Code plugin and marketplace, and as a Codex plugin, alongside the existing `npx skills` install route.
- a `recording-changes` skill, guiding agents to read and update `CHANGELOG.md` under Keep a Changelog 2.0.0.
- a `semantic-versioning` skill with a stdlib-only checker for validating, comparing, sorting, and bumping Semantic Versioning 2.0.0 versions.
- a `setup-phatblat-skills` skill that records a repository's changelog policy and versioning scheme in its `AGENTS.md`.

[Unreleased]: https://github.com/phatblat/skills/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/phatblat/skills/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/phatblat/skills/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/phatblat/skills/releases/tag/v1.0.0
