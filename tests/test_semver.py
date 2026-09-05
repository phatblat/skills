"""Behavioral tests for skills/semantic-versioning/scripts/semver.py.

Every case is drawn from the SemVer 2.0.0 spec itself
(references/spec-v2.0.0.md), not from the implementation.
"""

from __future__ import annotations

import random

import pytest

from semver import InvalidVersionError, Version, bump, compare, main, sort_versions


def test_spec_precedence_chain() -> None:
    chain = [
        "1.0.0-alpha",
        "1.0.0-alpha.1",
        "1.0.0-alpha.beta",
        "1.0.0-beta",
        "1.0.0-beta.2",
        "1.0.0-beta.11",
        "1.0.0-rc.1",
        "1.0.0",
        "2.0.0",
        "2.1.0",
        "2.1.1",
    ]
    shuffled = chain.copy()
    random.Random(0).shuffle(shuffled)
    assert sort_versions(shuffled) == chain


def test_build_metadata_ignored() -> None:
    assert compare("1.0.0+001", "1.0.0+999") == 0
    assert compare("1.0.0+20130313144700", "1.0.0-beta+exp.sha.5114f85") == 1


@pytest.mark.parametrize(
    "text",
    [
        "1.2",
        "1.2.3.4",
        "01.2.3",
        "1.0.0-01",
        "1.0.0-",
        "1.0.0+",
        "v1.2.3",
        "1.0.0-alpha_beta",
        "1.0.0-alpha..1",
        "-1.0.0",
        "1.0.0 ",
    ],
)
def test_invalid_rejected(text: str) -> None:
    with pytest.raises(InvalidVersionError):
        Version.parse(text)


@pytest.mark.parametrize(
    "text",
    [
        "0.0.4",
        "10.20.30",
        "1.0.0-alpha",
        "1.0.0-alpha.1",
        "1.0.0-0.3.7",
        "1.0.0-x.7.z.92",
        "1.0.0-x-y-z.--",
        "1.0.0-alpha+001",
        "1.0.0+20130313144700",
        "1.0.0-beta+exp.sha.5114f85",
        "1.0.0+21AF26D3----117B344092BD",
    ],
)
def test_valid_spec_examples(text: str) -> None:
    assert str(Version.parse(text)) == text


def test_valid_spec_example_fields() -> None:
    version = Version.parse("1.0.0-beta+exp.sha.5114f85")
    assert version.prerelease == ("beta",)
    assert version.build == ("exp", "sha", "5114f85")


@pytest.mark.parametrize(
    ("part", "version", "expected"),
    [
        ("major", "1.2.3", "2.0.0"),
        ("minor", "1.2.3", "1.3.0"),
        ("patch", "1.2.3", "1.2.4"),
        ("patch", "1.2.3-alpha.1", "1.2.3"),
        ("minor", "1.2.0-alpha", "1.2.0"),
        ("minor", "1.2.3-alpha", "1.3.0"),
        ("major", "1.0.0-rc.1", "1.0.0"),
        ("major", "1.2.0-rc.1", "2.0.0"),
        ("patch", "1.2.3+build.5", "1.2.4"),
    ],
)
def test_bump_rules(part: str, version: str, expected: str) -> None:
    assert bump(part, version) == expected


def test_cli_exit_codes(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["validate", "1.2.3"]) == 0

    assert main(["validate", "1.2.3", "1.2"]) == 1

    capsys.readouterr()
    assert main(["compare", "1.0.0", "2.0.0"]) == 0
    assert capsys.readouterr().out.strip() == "-1"

    assert main(["bump", "minor", "v1.2.3"]) == 2
