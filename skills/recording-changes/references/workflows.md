# Changelog Workflows

## Start a Changelog

Create `CHANGELOG.md` with the fixed preamble and an empty `Unreleased` section,
then record notable changes from now on:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

[Unreleased]: https://github.com/your/project/commits/main/
```

Reconstructing past releases from git tags is optional; either starting fresh or
backfilling history is fine.

## Add an Entry

Before:

```markdown
## [Unreleased]

### Fixed

- Login form no longer submits twice when the network is slow.
```

After, adding a new fix:

```markdown
## [Unreleased]

### Fixed

- Login form no longer submits twice when the network is slow.
- Timestamps in the audit log are now rendered in the viewer's local time zone
  instead of UTC.
```

If the section did not exist, create it in canonical order (`Added`, `Changed`,
`Deprecated`, `Removed`, `Fixed`, `Security`) — never create it empty.

## Cut a Release

Before:

```markdown
## [Unreleased]

### Added

- CSV export for the transactions report.

### Fixed

- Login form no longer submits twice when the network is slow.

[Unreleased]: https://github.com/your/project/commits/main/
```

After (renaming `Unreleased` to `1.2.0`, dated today, and adding a fresh empty
`Unreleased` above it):

```markdown
## [Unreleased]

## [1.2.0] - 2026-09-05

### Added

- CSV export for the transactions report.

### Fixed

- Login form no longer submits twice when the network is slow.

[Unreleased]: https://github.com/your/project/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/your/project/releases/tag/v1.2.0
```

If a version already preceded `1.2.0` (say `1.1.0`), the new definition is a
compare range instead of a tag link:

```text
[1.2.0]: https://github.com/your/project/compare/v1.1.0...v1.2.0
```

## Yank a Release

Append `[YANKED]` to the affected version's heading. Keep the section and its
entries in place — never delete a yanked release's history:

```markdown
## [0.0.5] - 2014-12-13 [YANKED]

### Security

- CVE-2014-99999: authentication bypass when a session token is empty.
```

## Correct a Released Entry

Editing a released section is allowed after the fact — to fix a forgotten entry
or a missed breaking change. Note the date of the correction so readers notice
it was updated after the original release:

```markdown
## [1.1.0] - 2026-08-01

### Fixed

- Login form no longer submits twice when the network is slow.
- CSV export drops the header row on empty reports. _(Missed at release;
  added 2026-09-05.)_
```

## Extract a Version for Release Notes

The changelog is the source; release notes are drawn from it, not maintained
separately. Extract one version's section with `awk`:

```bash
awk '/^## \[1\.2\.0\]/{f=1;print;next} /^## \[/{f=0} f' CHANGELOG.md
```

Use the extracted section as the release announcement, expanding it only if the
announcement needs more than the changelog states. Host-generated release notes
(from merged pull requests or commit messages) live in the host's database and
do not travel with the repository if the project moves — treat them as a
starting draft at most, never as the canonical record.

## Monorepos

Unrelated projects sharing one repository keep separate changelogs — one per
project. A single product split into components (say, a framework split into
libraries) may keep a changelog per component, but must also keep a central
summary changelog: readers should not have to read every component's changelog
to understand what a release means. The per-component files are the detailed
record; the central one is the summary.

## Very Large Changelogs

A single file is usually fine, even a long one. If it must be archived, link the
main file and the archive both ways so readers can find older entries, and
archive only versions old enough that they will not need further editing. Never
delete old entries — someone may still be upgrading from an old version.

## Automation Boundaries

CI does mechanical work only:

- Move `Unreleased` into a dated version at release time.
- Check that the file is formatted correctly.
- Optionally _remind_ a contributor that a change may need an entry.

Never make a changelog edit a required check on every change — that teaches
contributors to add a line just to pass the check, filling the changelog with
noise instead of curated entries. Conventional Commits and commit-driven
changelog generators (semantic-release, release-please, Changesets, git-cliff)
produce raw material at best: a commit and a changelog entry are written for
different readers, many commits are not notable, and a change worth recording
often spans several commits. A person still has to decide what is notable, group
it, and write it for the reader.

## Brief for Another Repo's AGENTS.md

Paste this into a consuming repository's `AGENTS.md` to brief an agent drafting
changelog entries there:

```markdown
When you make a notable, user-facing change, add an entry to
`CHANGELOG.md` under `## [Unreleased]`:

- Summarize the notable, user-facing effect and the reason — do not paste a
  git log or reword a commit message one-to-one.
- Sort it into one of the six Keep a Changelog types: Added, Changed,
  Deprecated, Removed, Fixed, Security.
- Mark a breaking change with a `**Breaking:**` prefix, inside its type.
- Remove anything not worth a reader's time; not every change is notable.
- A human reads the result before anyone else does.
```
