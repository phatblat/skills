# Repository Guidelines

- Toolchain: `mise.toml` pins every tool; `just` is the only command surface;
  prefer a recipe over a documented raw command.
- Commands: `deps`, `check`, `format`, `test`, `link`/`unlink`, `run`,
  `outdated`/`upgrade`.
- Formatting is owned by prettier and ruff; never hand-format or hand-wrap
  markdown (`MD013` is off because prettier owns wrapping).
- Every fenced code block carries a language; `MD040` fails otherwise.
- `package.json` has no `scripts` block beyond `prepare`, which only the package
  manager runs, to wire up husky.
- Commits follow Conventional Commits plus this project's `decision:`, `plan:`,
  `release:`, `deploy:` event types (see `commitlint.config.js`);
  `.husky/commit-msg` enforces it.
- Releases are automated by semantic-release on push to `main`; never hand-edit
  `CHANGELOG.md` and never bump a version by hand. Every user-facing change adds
  a `.changes/<slug>.md` fragment in the same commit.
- Skills live at `skills/<name>/SKILL.md` with `name` equal to the directory
  name, and stay spec-clean: `name`, `description`, `license`, and nothing else.
  The single exception is `setup-phatblat-skills`'s `disable-model-invocation`
  (DECISIONS.md 0001). Reach for
  `skills/authoring-skills/references/spec-fields.md` before adding any
  frontmatter key.
- A skill name names the activity, not the artifact: `recording-changes`, not
  `changelog`. The user-invoked setup command is the exception and is named for
  what a human types.
- Every skill must work unchanged on Claude Code, Claude.ai, Codex, Cursor,
  OpenCode, Antigravity, Grok, Pi and Oh My Pi, all of which read `SKILL.md`
  directly. A skill that cannot says so in `compatibility`.
- Neither plugin manifest lists individual skills: Claude Code always scans
  `skills/`, and Codex takes the one path `./skills/`. Adding a skill directory
  ships it; there is no membership list to keep in sync.
- Python tests live in `tests/`, not inside the skill, so the skill payload
  stays copy-clean. Add a test with every behavior change.
- `just check` must be green before pushing.
- The operational rules for the docs artifacts (`DECISIONS.md`, `ROADMAP.md`,
  `.changes/`, commit events) are the conventional-docs skill's; read it before
  editing any of them.
