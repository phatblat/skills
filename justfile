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

# Fix and format markdown, config, and the justfile
[group('configuration')]
format:
    -{{ mise }} markdownlint-cli2 --fix "**/*.md"
    {{ mise }} prettier --write .
    mise fmt
    just --fmt

# Remove installed dependencies and caches
[group('configuration')]
clean:
    rm -rf node_modules

# Report tools and dependencies with newer versions available
[group('configuration')]
outdated:
    -mise outdated --local --bump
    -bun outdated

# Upgrade pinned tools and dependencies to their latest versions
[group('configuration')]
upgrade:
    mise upgrade --local --bump --yes
    bun update --latest

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
    mise fmt --check
    just --fmt --check

# Lint markdown structure
[group('checks')]
lint:
    {{ mise }} markdownlint-cli2 "**/*.md"

# Validate release-note fragment format in .changes/
[group('checks')]
lint-changes:
    bun scripts/validate-changes.mjs

# Validate SKILL.md frontmatter against the Agent Skills spec
[group('checks')]
lint-skills:
    bun scripts/validate-skills.mjs

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
    bun x commitlint --from "$base" --to {{ to }} --verbose

# Run every gate
[group('checks')]
check: format-check lint lint-changes lint-skills test

#
# tests group recipes
#

# Run every test
[group('tests')]
test: test-links

# Check markdown files for broken links
[group('tests')]
test-links:
    bun x linkinator "*.md" ".changes/*.md" --markdown
