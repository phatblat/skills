---
name: semantic-versioning
description: Use when choosing the next version number, validating or comparing version strings, or deciding whether a change is a major, minor, or patch release under Semantic Versioning 2.0.0 — covers pre-release identifiers, build metadata, precedence ordering, 0.y.z initial development, deprecation policy, and the checker script that ships with the skill. Not for commit-message conventions or changelog formatting.
license: MIT
---

# Semantic Versioning

Decide version bumps, validate version strings, and order versions by
precedence under Semantic Versioning 2.0.0. The normative spec text lives
verbatim in `references/spec-v2.0.0.md`. The stdlib-only checker that computes
precedence and bump arithmetic — rather than making you reason it out by
hand — is `scripts/semver.py`.

## Pick the bump

| Change                                                      | Bump                               |
| ----------------------------------------------------------- | ---------------------------------- |
| Backward-incompatible public-API change                     | MAJOR (minor and patch reset to 0) |
| New backward-compatible public-API functionality            | MINOR (patch resets to 0)          |
| Marking any public API deprecated                           | MINOR                              |
| Substantial private-code work with no public-API change     | MAY be MINOR                       |
| Backward-compatible bug fix                                 | PATCH                              |
| Dependency update, no public-API change, fixes a bug        | PATCH                              |
| Dependency update, no public-API change, adds functionality | MINOR                              |

Hard rules underneath the table (spec rules 1–5): a public API must be
declared, in code or in docs. A released version is immutable — ship a new
version instead of editing one. `0.y.z` means anything may change and the API
is not stable. `1.0.0` is the release that defines the public API. Every
element (major, minor, patch) increases numerically with no leading zeroes.

## Run the checker instead of reasoning

```bash
skills/semantic-versioning/scripts/semver.py validate 1.2.3 v1.2.3
# 1.2.3: ok
# v1.2.3: invalid — leading "v" is a tag prefix, not part of the version

skills/semantic-versioning/scripts/semver.py compare 1.0.0-alpha 1.0.0
# -1

skills/semantic-versioning/scripts/semver.py sort 1.0.0 1.0.0-rc.1 1.0.0-alpha
# 1.0.0-alpha
# 1.0.0-rc.1
# 1.0.0

skills/semantic-versioning/scripts/semver.py bump minor 1.2.3-alpha
# 1.3.0

skills/semantic-versioning/scripts/semver.py parse 1.0.0-beta+exp.sha.5114f85
# {"major":1,"minor":0,"patch":0,"prerelease":["beta"],"build":["exp","sha","5114f85"]}
```

Inside this repo, run the same commands through `just run <args>` so the
pinned interpreter is used. The script itself is stdlib-only and needs
nothing beyond a system `python3`, so it also runs standalone wherever the
skill directory is copied.

| Command                            | Behavior                                                                                             | Exit                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| `validate VERSION...`              | `<version>: ok` on stdout per valid input; `<version>: invalid — <reason>` on stderr per invalid one | `0` all valid, `1` any invalid |
| `parse VERSION`                    | one-line JSON of the version's components                                                            | `0`, `2` invalid               |
| `compare A B`                      | `-1`, `0`, or `1`                                                                                    | `0`, `2` invalid               |
| `sort [VERSION...]`                | ascending precedence, one per line (reads stdin if no arguments given)                               | `0`, `2` invalid               |
| `bump {major,minor,patch} VERSION` | the next version                                                                                     | `0`, `2` invalid               |

## Precedence

Rule 11: compare `(major, minor, patch)` numerically first. If those are
equal, a version with no pre-release outranks one with a pre-release
(`1.0.0-alpha < 1.0.0`). If both have pre-releases, compare their
dot-separated identifiers left to right: numeric identifiers compare
numerically, others compare by ASCII order, and a numeric identifier always
ranks below a non-numeric one; if every shared identifier ties, the longer
identifier list wins. Build metadata never participates in precedence.

Worked example (the spec's own canonical chain):

```text
1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta <
1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0
```

## Pre-release and build metadata

Both are dot-separated identifier lists restricted to `[0-9A-Za-z-]`, and no
identifier may be empty. Numeric pre-release identifiers may not have leading
zeroes (build identifiers may, since they never participate in numeric
comparison). Pre-release is appended with `-` immediately after the patch
version; build metadata is appended with `+` after that. Valid examples from
the spec: `1.0.0-alpha`, `1.0.0-alpha.1`, `1.0.0-0.3.7`, `1.0.0-x.7.z.92`,
`1.0.0-x-y-z.--`, `1.0.0-alpha+001`, `1.0.0+20130313144700`,
`1.0.0-beta+exp.sha.5114f85`, `1.0.0+21AF26D3----117B344092BD`.

## Validate

The official grammar, as a regex (numbered-group variant):

```text
^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$
```

Common rejections and why:

| Input                | Reason                                                  |
| -------------------- | ------------------------------------------------------- |
| `v1.2.3`             | leading "v" is a tag prefix, not part of the version    |
| `1.2`                | core must be exactly MAJOR.MINOR.PATCH                  |
| `01.2.3`, `1.0.0-01` | numeric identifiers must not have leading zeroes        |
| `1.0.0-`, `1.0.0+`   | identifiers must not be empty                           |
| `1.0.0-alpha_beta`   | underscore is not in the allowed `[0-9A-Za-z-]` charset |

## Judgment calls

From the spec's FAQ: start initial development at `0.1.0` and bump minor for
each subsequent release. Release `1.0.0` once the software is used in
production or has a stable API with dependents. If a breaking change ships as
a minor by mistake, fix it with a new minor that restores compatibility and
document the offending version — never edit the release in place. If a
breaking change ships as a patch and enough users depend on the old behavior,
a major release may be warranted even though the fix could strictly be a
patch. Deprecating part of the public API takes a documentation update plus a
minor release that carries the deprecation; at least one such minor release
must exist before the functionality is removed in a major release. There is
no length limit on the version string, but keep it sane.

## Do NOT

- Modify an already-released version. Ship a new version instead.
- Put `v` inside a version field. It belongs only in a git tag name
  (`git tag v1.2.3`), never in the semantic version itself.
- Write leading zeroes or empty identifiers.
- Use build metadata to order versions — it is ignored for precedence.
- Bump major for a change that is entirely private-code and not
  public-API-breaking.
- Treat `0.y.z` as stable; the API is explicitly unstable until `1.0.0`.
- Remove a deprecated API without a prior minor release that carried the
  deprecation.
- Hand-compare pre-release precedence when `scripts/semver.py compare` is
  right there.
