---
name: recording-changes
description: "Use when reading, creating, or updating a CHANGELOG.md — adding an entry under Unreleased, choosing among the six Keep a Changelog 2.0.0 change types, marking breaking changes, cutting a release, or wiring version compare links."
license: MIT
---

# Recording Changes

This skill applies
[Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/) to reading,
writing, and releasing a project's `CHANGELOG.md`. The guiding principle behind
every rule here: **machines can draft, but humans curate**.

## When to Use

- Reading a `CHANGELOG.md` to answer what changed in a project or a version.
- Adding an entry for a change just made.
- Creating a `CHANGELOG.md` for a project that does not have one yet.
- Cutting a release: moving `Unreleased` into a dated version.
- Reviewing a changelog diff before it merges.

## When Not to Use

- Writing a commit message or a pull request description — those are for a
  different audience and a different moment; see `## Reading a Changelog` in
  `references/workflows.md` for how they relate.
- Authoring release-note prose for a host announcement, beyond extracting the
  relevant version section — see `## Extract a Version for Release Notes` in
  `references/workflows.md`.
- Choosing a version number — that is the versioning scheme's job (Semantic
  Versioning, CalVer, or whatever the project's preamble names), not this
  skill's.

## File Shape

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- ...

## [1.0.0] - 2017-07-17

### Added

- ...

[Unreleased]: https://github.com/your/project/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your/project/releases/tag/v1.0.0
```

The file is named `CHANGELOG.md`. The `# Changelog` heading and the two-line
preamble are fixed: the first link declares the format and is pinned to the
version followed (`https://keepachangelog.com/en/2.0.0/`), the second names the
versioning scheme in use. Below the preamble: an `## [Unreleased]` section, then
`## [x.y.z] - YYYY-MM-DD` sections newest-first, each with `###` type
subsections, and a reference-link block at the bottom. Full grammar, dates, and
link patterns are in `references/format.md`.

## The Six Types

| Type         | Use for                           |
| ------------ | --------------------------------- |
| `Added`      | new features                      |
| `Changed`    | changes in existing functionality |
| `Deprecated` | soon-to-be removed features       |
| `Removed`    | now removed features              |
| `Fixed`      | bug fixes                         |
| `Security`   | vulnerabilities                   |

This order is also the recommended order of `###` subsections within a version.
When the right type is unclear:

- Was the old behavior a bug? → `Fixed`.
- Was it intentional, and does it now work differently? → `Changed`.
- Does it address a vulnerability? → `Security`, even though it could fit
  `Fixed` or `Changed` — its urgency and audience differ. Lead the entry with
  the CVE identifier when one exists:

  ```text
  - CVE-2024-12345: out-of-bounds read when parsing malformed input.
  ```

The six never grow. `Performance`, `Improved`, `New`, `Internal`, and
`Housekeeping` collapse into `Changed` or `Added`, or are not notable enough to
list at all — an entry like "Rewrote JSON parser; 3x faster on large files" fits
`Changed`. Two more are not types at all: **Dependencies** is not a type —
describe a dependency update's user-visible effect under the right type, or
leave it out if there is none. **Known issues** are discovered, not changed —
note them on the affected version or in the issue tracker, and move them to
`Fixed` once fixed.

## Add an Entry

1. Read the whole file before editing. Never blind-append to the bottom or guess
   at the current `## [Unreleased]` contents.
2. Apply the notability test: does this change what a user of the project sees
   or does? If not, there is no entry — curate, don't accumulate.
3. Pick one of the six types above.
4. Write one bullet in plain language, ending in a period, describing the effect
   and the reason. No commit hashes, no bare `(#1234)` clutter — put pointers in
   reference-style links at the bottom of the file instead (see
   `references/format.md`).
5. Place it under `## [Unreleased]` → `### <Type>`, creating that heading in
   canonical order if it is absent. Never create an empty type heading.
6. Never edit a released section except to correct it or add a missed entry —
   and when you do, note the date of the update.

## Cut a Release

1. Rename `## [Unreleased]` to `## [1.2.0] - 2026-09-05` — today's date in UTC
   (`date -u +%F`), matching the project's existing tag prefix (check with
   `git tag --list`).
2. Optionally add a one- or two-sentence summary directly under the new heading,
   when the release is worth introducing.
3. Insert a fresh `## [Unreleased]` above it, with no subsections.
4. Update the reference-link block at the bottom of the file (patterns and the
   no-tags-yet case are in `references/format.md`).

Full worked before/after is in `references/workflows.md`.

## Breaking Changes

Mark a breaking change with a short `**Breaking:**` marker, kept inside its
natural type — usually `Changed` or `Removed` — never collected into a separate
section:

```markdown
- **Breaking:** parse() now returns a result object instead of raising.
```

Say _what_ breaks: a command line, a library API, a network protocol, a file
format, or a configuration schema. A short upgrade note may sit in the entry
itself; a substantial procedure gets a link to a migration guide instead of
being spelled out inline. Announce a deprecation with `Deprecated` in one
release before `Removed` in a later one, and say which version removes it.

## Reading a Changelog

- `## [Unreleased]` is unshipped. Never cite it as released.
- Sections are newest-first.
- `[YANKED]` means the release was pulled — do not recommend it.
- A missing type heading under a version means "nothing notable of that type,"
  not "nothing changed."
- The changelog is the record; a host's generated release page is derived from
  it, not the other way around.

To extract a single version's section (for release notes or review):

```bash
awk '/^## \[1\.2\.0\]/{f=1;print;next} /^## \[/{f=0} f' CHANGELOG.md
```

## Do NOT

- Paste `git log` output, or reword commit messages one-to-one, into an entry.
- Invent a seventh type.
- Add a `Dependencies` or `Known issues` section.
- Leave an empty type heading in place.
- Delete old entries, even from very old versions.
- Rewrite history beyond correcting or adding a missed entry.
- State a release date you have not verified.
- Add a required "did you update the changelog?" check to every pull request —
  it teaches contributors to add noise to pass the check, not to curate.

## References

- `references/format.md` — the format contract: version-heading grammar,
  reference-link patterns, versioning-scheme guidance, entry style, and the
  spec's guiding principles.
- `references/workflows.md` — worked procedures: starting a changelog, adding an
  entry, cutting a release, yanking, correcting a released entry, extracting
  release notes, monorepos, very large changelogs, automation boundaries, and a
  brief for another repo's `AGENTS.md`.
