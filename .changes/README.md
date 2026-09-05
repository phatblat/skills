# Change fragments

One file per user-facing change, added in the same commit or PR as the change
itself. Consumed and deleted when the next release is cut — see the root
`README.md`'s "Release notes" section for the full rule.

Filename: `<slug>.md`, kebab-case, matching the change it describes.

Each line is a markdown unordered list item starting with one of the six
[Keep a Changelog](https://keepachangelog.com/) categories:

```markdown
- Added: support for custom output formats.
- Fixed: a race condition when releasing concurrently.
```

`just lint-changes` validates every fragment against this format.
