#!/usr/bin/env python3
"""Semantic Versioning 2.0.0 validator, comparator, sorter, and bumper.

Stdlib-only, Python 3.9+. This script has no dependencies, so the
``skills/semantic-versioning`` directory it ships in remains fully
self-contained when copied into a harness with no ``uv``, no ``mise``, and
only a stock system interpreter.

See ``references/spec-v2.0.0.md`` for the normative text this implements.
"""

from __future__ import annotations

import argparse
import dataclasses
import functools
import json
import re
import sys
from collections.abc import Iterable, Sequence

# The official SemVer 2.0.0 regex (numbered-group variant), copied verbatim
# from https://semver.org/spec/v2.0.0.html#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)"
    r"(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?"
    r"(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$"
)


class InvalidVersionError(ValueError):
    """Raised when a version string does not match the SemVer 2.0.0 grammar."""


@dataclasses.dataclass(frozen=True)
class Version:
    major: int
    minor: int
    patch: int
    prerelease: tuple[str, ...]
    build: tuple[str, ...]

    @classmethod
    def parse(cls, text: str) -> Version:
        match = SEMVER_RE.fullmatch(text)
        if match is None:
            raise InvalidVersionError(invalid_reason(text))
        major, minor, patch, prerelease_str, build_str = match.groups()
        prerelease = tuple(prerelease_str.split(".")) if prerelease_str else ()
        build = tuple(build_str.split(".")) if build_str else ()
        return cls(int(major), int(minor), int(patch), prerelease, build)

    def __str__(self) -> str:
        text = f"{self.major}.{self.minor}.{self.patch}"
        if self.prerelease:
            text += "-" + ".".join(self.prerelease)
        if self.build:
            text += "+" + ".".join(self.build)
        return text


def _core_end(text: str) -> int:
    """Index of the first '-' or '+' in ``text``, or ``len(text)`` if neither appears."""
    indices = [i for i in (text.find("-"), text.find("+")) if i != -1]
    return min(indices) if indices else len(text)


def _split_rest(rest: str) -> tuple[str | None, str | None]:
    """Split the text after the core into raw prerelease/build strings (``None`` if absent)."""
    if not rest:
        return None, None
    plus_index = rest.find("+")
    if rest[0] == "-":
        if plus_index == -1:
            return rest[1:], None
        return rest[1:plus_index], rest[plus_index + 1 :]
    # rest[0] == "+"
    return None, rest[1:]


def invalid_reason(text: str) -> str:
    """Explain why ``text`` fails the SemVer 2.0.0 grammar.

    The regex in :data:`SEMVER_RE` is always the actual validity gate; this
    function only produces a human-readable diagnostic for the rejection.
    """
    if text[:1] in ("v", "V"):
        return 'leading "v" is a tag prefix, not part of the version'

    core_end = _core_end(text)
    core_fields = text[:core_end].split(".")
    if len(core_fields) != 3:
        return "core must be exactly MAJOR.MINOR.PATCH"
    for field in core_fields:
        if field.isdigit() and len(field) > 1 and field[0] == "0":
            return "numeric identifiers must not have leading zeroes"

    prerelease_str, build_str = _split_rest(text[core_end:])
    if prerelease_str is not None:
        if prerelease_str == "" or any(ident == "" for ident in prerelease_str.split(".")):
            return "identifiers must not be empty"
        for ident in prerelease_str.split("."):
            if ident.isdigit() and len(ident) > 1 and ident[0] == "0":
                return "numeric identifiers must not have leading zeroes"
    if build_str is not None:
        if build_str == "" or any(ident == "" for ident in build_str.split(".")):
            return "identifiers must not be empty"

    return "does not match the SemVer 2.0.0 grammar"


def _compare_identifier(a: str, b: str) -> int:
    a_numeric, b_numeric = a.isdigit(), b.isdigit()
    if a_numeric and b_numeric:
        ai, bi = int(a), int(b)
        return -1 if ai < bi else (1 if ai > bi else 0)
    if a_numeric and not b_numeric:
        return -1  # numeric identifiers always have lower precedence
    if b_numeric and not a_numeric:
        return 1
    return -1 if a < b else (1 if a > b else 0)


def _compare_prerelease(a: tuple[str, ...], b: tuple[str, ...]) -> int:
    if not a and not b:
        return 0
    if not a:
        return 1  # no prerelease outranks any prerelease
    if not b:
        return -1
    for x, y in zip(a, b):
        result = _compare_identifier(x, y)
        if result != 0:
            return result
    if len(a) != len(b):
        return -1 if len(a) < len(b) else 1
    return 0


def compare(a: str, b: str) -> int:
    """Return -1, 0, or 1 for the SemVer 2.0.0 precedence of ``a`` vs ``b``.

    Build metadata never participates in precedence (spec rule 10).
    """
    va, vb = Version.parse(a), Version.parse(b)
    core_a, core_b = (va.major, va.minor, va.patch), (vb.major, vb.minor, vb.patch)
    if core_a != core_b:
        return -1 if core_a < core_b else 1
    return _compare_prerelease(va.prerelease, vb.prerelease)


def sort_versions(items: Iterable[str]) -> list[str]:
    """Sort version strings ascending by SemVer 2.0.0 precedence, stably."""
    return sorted(items, key=functools.cmp_to_key(compare))


def bump(part: str, version: str) -> str:
    """Return the next version after bumping ``part`` ("major", "minor", or "patch").

    A pre-release previews its own core version, so bumping the part that core
    version already represents drops the pre-release instead of incrementing
    again. Build metadata is always dropped.
    """
    v = Version.parse(version)
    if part == "major":
        if v.minor == 0 and v.patch == 0 and v.prerelease:
            return f"{v.major}.{v.minor}.{v.patch}"
        return f"{v.major + 1}.0.0"
    if part == "minor":
        if v.patch == 0 and v.prerelease:
            return f"{v.major}.{v.minor}.{v.patch}"
        return f"{v.major}.{v.minor + 1}.0"
    if part == "patch":
        if v.prerelease:
            return f"{v.major}.{v.minor}.{v.patch}"
        return f"{v.major}.{v.minor}.{v.patch + 1}"
    raise InvalidVersionError(f"unknown bump part: {part!r}")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="semver",
        description="Validate, compare, sort, and bump Semantic Versioning 2.0.0 strings.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_validate = sub.add_parser("validate", help="check one or more version strings")
    p_validate.add_argument("versions", nargs="+", metavar="VERSION")

    p_parse = sub.add_parser("parse", help="print a version's components as JSON")
    p_parse.add_argument("version", metavar="VERSION")

    p_compare = sub.add_parser("compare", help="print -1, 0, or 1 for A's precedence vs B")
    p_compare.add_argument("a", metavar="A")
    p_compare.add_argument("b", metavar="B")

    p_sort = sub.add_parser(
        "sort", help="print versions in ascending precedence (stdin if none given)"
    )
    p_sort.add_argument("versions", nargs="*", metavar="VERSION")

    p_bump = sub.add_parser("bump", help="print the next version after bumping a part")
    p_bump.add_argument("part", choices=["major", "minor", "patch"])
    p_bump.add_argument("version", metavar="VERSION")

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    try:
        if args.command == "validate":
            any_invalid = False
            for text in args.versions:
                try:
                    Version.parse(text)
                except InvalidVersionError as exc:
                    print(f"{text}: invalid — {exc}", file=sys.stderr)
                    any_invalid = True
                else:
                    print(f"{text}: ok")
            return 1 if any_invalid else 0

        if args.command == "parse":
            version = Version.parse(args.version)
            payload = {
                "major": version.major,
                "minor": version.minor,
                "patch": version.patch,
                "prerelease": list(version.prerelease),
                "build": list(version.build),
            }
            print(json.dumps(payload, separators=(",", ":")))
            return 0

        if args.command == "compare":
            print(compare(args.a, args.b))
            return 0

        if args.command == "sort":
            versions = args.versions if args.versions else sys.stdin.read().split()
            for text in sort_versions(versions):
                print(text)
            return 0

        if args.command == "bump":
            print(bump(args.part, args.version))
            return 0

        parser.error(f"unknown command: {args.command}")
        return 2
    except InvalidVersionError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
