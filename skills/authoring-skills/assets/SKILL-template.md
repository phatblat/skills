---
name: your-skill-name
description: >-
  What this skill does, and specifically when an agent should use it --
  include concrete trigger phrases and situations, not just a category.
# license: MIT
# compatibility: Requires <tool/runtime>, if this skill has a real requirement
# metadata:
#   your-namespaced-key: value
# allowed-tools: Bash(git:*) Read
---

# Your Skill Name

One-paragraph orientation: what problem this solves and the shape of the
solution.

## Workflow

1. Step one.
2. Step two.
3. Step three.

## Examples

- Example input/output or usage scenario.

## Common mistakes

- Pitfall and how to avoid it.

<!--
Portability checklist before shipping:
- [ ] `name` matches this file's parent directory exactly
- [ ] `description` states both what and when, with concrete keywords
- [ ] No harness-only top-level frontmatter keys (put them in `metadata`,
      namespaced, if a specific harness truly needs them)
- [ ] Validated: uvx --from skills-ref agentskills validate .
- [ ] SKILL.md stays under ~500 lines; detail moved to references/
-->
