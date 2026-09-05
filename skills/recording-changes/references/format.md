# Changelog Format (Keep a Changelog 2.0.0)

## Preamble

```text
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
```

Stating the conventions a file follows tells readers, and tools, what to expect.
Pin the Keep a Changelog link to the version actually followed, so it stays
accurate as the spec page changes; name the versioning scheme actually used in
the second sentence — it does not have to be Semantic Versioning (see
`## Versioning Schemes` below).

## Version Headings

```markdown
## [Unreleased]

## [1.0.0] - 2017-06-20

## [0.0.5] - 2014-12-13 [YANKED]
```

Dates are `YYYY-MM-DD` only — it orders from largest unit to smallest, avoids
regional date-format ambiguity, and is an ISO 8601 format. The square brackets
around a version number make it a Markdown reference link, resolved once at the
bottom of the file (see `## Reference Links`). A version may open with a short
summary paragraph between the heading and its first `###` subsection; this is
optional — use it when the release is worth introducing, skip it otherwise.

## Change Types

| Type         | Use for                           |
| ------------ | --------------------------------- |
| `Added`      | new features                      |
| `Changed`    | changes in existing functionality |
| `Deprecated` | soon-to-be removed features       |
| `Removed`    | now removed features              |
| `Fixed`      | bug fixes                         |
| `Security`   | vulnerabilities                   |

Disambiguation: was the old behavior a bug? → `Fixed`. Was it intentional and
does it now work differently? → `Changed`. Does it address a vulnerability? →
`Security` — its urgency and audience differ from `Fixed`/`Changed` even though
it could technically fit either. Lead a `Security` entry with its CVE identifier
when one exists:

```text
- CVE-2024-12345: out-of-bounds read when parsing malformed input.
```

Non-types: **Dependencies** is not a type — a dependency update can be harmless,
a fix, or breaking, so describe its user-visible effect under the right type, or
omit it if there is none. **Known issues** are discovered, not changed — note
them on the affected version or in the issue tracker, and move them to `Fixed`
once resolved. Categories beyond the six (`Performance`, `Improved`, `New`,
`Internal`, `Housekeeping`) are rarely needed: they either collapse into
`Changed`/`Added` or are not notable enough to list.

## Breaking Changes

```markdown
- **Breaking:** parse() now returns a result object instead of raising.
```

The version number already signals a breaking change under Semantic Versioning,
but it is easy to miss, so mark the entry itself. Keep the marker on the entry,
within its natural type (usually `Changed` or `Removed`), rather than collecting
breaking changes into a separate section — that way anyone scanning `Changed` or
`Removed` sees them in place. State which interface breaks: a command line, a
library API, a network protocol, a file format, or a configuration schema. A
short upgrade note ("rename the `color` option to `theme`") can sit in the
entry; a substantial procedure gets a link to a migration guide instead of being
spelled out inline.

## Reference Links

```text
[Unreleased]: https://github.com/your/project/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/your/project/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/your/project/releases/tag/v1.0.0
```

`[Unreleased]` compares the latest tag to `HEAD`, so it always shows what has
accrued since the last release. The oldest version links to its own tag, because
there is nothing earlier to compare it with. Every other version links to a
compare range against the version before it. Keep links out of headings —
resolve them once at the bottom of the file instead.

**No tags yet:** point `[Unreleased]` at the commit history instead of a compare
range, until the first tag exists:

```text
[Unreleased]: https://github.com/your/project/commits/main/
```

Then switch it to a compare range at the first release. This repository's own
`CHANGELOG.md` is in that no-tags-yet state.

Issue and pull-request pointers belong in this same reference-link block. Prefer
prose plus a portable reference (a tag or a commit) over a bare `(#1234)`:
pull-request numbers belong to one host, and links break when a repository
moves.

## Versioning Schemes

Semantic Versioning is not required. Calendar versioning, a plain number, or a
date all work. A continuously released project with no version numbers can still
keep a changelog: keep dated entries under `Unreleased`. Whichever scheme is
used, name it in the preamble.

## Entry Style

- One change per bullet.
- Plain language — many readers are not native speakers, so favor clear, concise
  wording over cleverness.
- End each bullet with a period.
- Describe the effect and the reason, not the implementation.
- No bare URLs inline; use reference-style links.
- Contributor credit is optional. If given, prefer something portable (a name or
  a profile link) over a host-specific `@handle`.

## Guiding Principles

- Changelogs are for humans, not machines.
- Every version should have an entry.
- Group changes of the same type.
- Make versions and sections linkable.
- List the latest version first.
- Show the release date of each version.
- Note which versioning scheme is used.
- Write plainly.

## Source

[Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/).
