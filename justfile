set ignore-comments
set script-interpreter := ['bash', '-eu']
set unstable

mise := "mise exec --"
agents_skills_dir := env_var('HOME') + "/.agents/skills"

[default]
_default:
    @just --list

#
# configuration group recipes
#

# Install pinned tools, dependencies, and the git hooks
[group('configuration')]
deps:
    mise install
    {{ mise }} bun install
    {{ mise }} uv sync

# Fix and format markdown, config, and the justfile
[group('configuration')]
format:
    -{{ mise }} markdownlint-cli2 --fix "**/*.md"
    {{ mise }} prettier --write .
    {{ mise }} uv run ruff format .
    mise fmt
    just --fmt

# Remove installed dependencies and caches
[group('configuration')]
clean:
    rm -rf node_modules .venv .pytest_cache .mypy_cache .ruff_cache
    just clean-pycache

# Remove __pycache__ directories under skills/ and tests/
[group('configuration')]
[script]
clean-pycache:
    find skills tests -type d -name __pycache__ -prune -exec rm -rf {} +

# Report tools and dependencies with newer versions available
[group('configuration')]
outdated:
    -mise outdated --local --bump
    -{{ mise }} bun outdated
    -{{ mise }} uv lock --upgrade --dry-run

# Upgrade pinned tools and dependencies to their latest versions
[group('configuration')]
upgrade:
    mise upgrade --local --bump --yes
    {{ mise }} bun update --latest
    {{ mise }} uv lock --upgrade
    {{ mise }} uv sync

#
# install group recipes
#

# Symlink every skill into ~/.agents/skills for local use
[group('install')]
[script]
link:
    set -euo pipefail
    mkdir -p "{{ agents_skills_dir }}"
    for src in "{{ justfile_directory() }}"/skills/*/; do
        name="$(basename "$src")"
        target="{{ agents_skills_dir }}/$name"
        if [ -e "$target" ] && [ ! -L "$target" ]; then
            echo "Refusing to overwrite non-symlink $target" >&2
            exit 1
        fi
        ln -sfn "${src%/}" "$target"
        echo "linked $name -> ${src%/}"
    done

# Remove the symlinks installed by `just link`
[group('install')]
[script]
unlink:
    set -euo pipefail
    for src in "{{ justfile_directory() }}"/skills/*/; do
        name="$(basename "$src")"
        target="{{ agents_skills_dir }}/$name"
        if [ -L "$target" ]; then
            rm "$target"
            echo "removed $target"
        elif [ -e "$target" ]; then
            echo "Refusing to remove non-symlink $target" >&2
            exit 1
        fi
    done

#
# checks group recipes
#

# Verify formatting without writing changes
[group('checks')]
format-check:
    {{ mise }} prettier --check .
    {{ mise }} uv run ruff format --check .
    mise fmt --check
    just --fmt --check

# Lint markdown structure
[group('checks')]
lint:
    {{ mise }} markdownlint-cli2 "**/*.md"

# Validate release-note fragment format in .changes/
[group('checks')]
lint-changes:
    {{ mise }} bun scripts/validate-changes.mjs

# Validate Claude and Codex plugin manifests and marketplaces
[group('checks')]
lint-plugins:
    {{ mise }} bun scripts/validate-plugins.mjs

# Validate SKILL.md frontmatter against the Agent Skills spec
[group('checks')]
lint-skills:
    {{ mise }} bun scripts/validate-skills.mjs

# Validate the portable skills against the Agent Skills reference validator.
# setup-phatblat-skills is excluded: it carries `disable-model-invocation`, the
# invocation control read by Claude Code, Cursor, Grok, Pi, and Oh My Pi, which
# skills-ref rejects as an unknown field.
[group('checks')]
lint-skills-ref:
    uvx --from skills-ref agentskills validate skills/authoring-skills
    uvx --from skills-ref agentskills validate skills/recording-changes
    uvx --from skills-ref agentskills validate skills/semantic-versioning

# Run the SemVer checker (e.g. `just run compare 1.0.0 1.0.0-rc.1`)
[group('build')]
run *args:
    {{ mise }} uv run skills/semantic-versioning/scripts/semver.py {{ args }}

# Synchronize every package manifest with package.json's version
[group('build')]
sync-versions:
    {{ mise }} bun scripts/sync-versions.mjs

# Lint Python with ruff
[group('checks')]
lint-python:
    {{ mise }} uv run ruff check .

# Type-check with mypy
[group('checks')]
typecheck:
    {{ mise }} uv run mypy

# Lint commit messages in a range (defaults to auto-detected base..HEAD)
[group('checks')]
[script]
commitlint from="" to="HEAD":
    set -euo pipefail
    base="{{ from }}"
    if [ -z "$base" ]; then
      if git rev-parse HEAD~1 >/dev/null 2>&1; then
        base=HEAD~1
      else
        base=$(git rev-list --max-parents=0 HEAD)
      fi
    fi
    {{ mise }} bun x commitlint --from "$base" --to {{ to }} --verbose

# Run every gate
[group('checks')]
check: lint-plugins format-check lint lint-changes lint-skills lint-skills-ref lint-python typecheck test

#
# tests group recipes
#

# Run every test
[group('tests')]
test: test-js test-python test-links

# Check markdown files for broken links
[group('tests')]
test-links:
    # skills.sh is skipped: the badge and the repo's directory page both
    # 404 until the CLI registers this repo with a real install (see the
    # publish step in README.md); a static link check can't observe that.
    {{ mise }} bun x linkinator "*.md" ".changes/*.md" --markdown --skip 'skills\.sh'

# Run the JavaScript test suite
[group('tests')]
test-js:
    {{ mise }} bun test tests/*.test.mjs

# Run the Python test suite
[group('tests')]
test-python:
    {{ mise }} uv run pytest
