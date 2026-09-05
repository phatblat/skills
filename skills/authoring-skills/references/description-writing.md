# Writing Descriptions That Trigger Reliably

`description` is the only field an agent sees before deciding whether to
load the rest of the skill. A vague description under-triggers; the failure
is invisible to the author because the skill simply never gets used.

## Include both halves

- **What it does** -- the capability, in concrete terms.
- **When to use it** -- the situations, keywords, and user phrasings that
  should trigger it.

```yaml
# Poor: only says what, not when
description: Helps with PDFs.

# Good: what + when, with concrete keywords
description: Extracts text and tables from PDF files, fills PDF forms, and
  merges multiple PDFs. Use when working with PDF documents or when the user
  mentions PDFs, forms, or document extraction.
```

## Be a little pushy

Agents tend to under-trigger skills relative to how often they'd actually
help. Anthropic's own skill-creator guidance recommends erring toward an
assertive description rather than a modest one:

```yaml
description: How to build a simple fast dashboard to display internal data.
  Make sure to use this skill whenever the user mentions dashboards, data
  visualization, internal metrics, or wants to display any kind of company
  data, even if they don't explicitly ask for a "dashboard."
```

## Keep "when to use" out of the body

All triggering information belongs in `description`. Don't split it between
the frontmatter and a "## When to Use" section in the body -- the body only
loads _after_ the client has already decided to trigger the skill, so
triggering conditions placed there can never influence that decision.

## Respect the length ceiling

Max 1024 characters. If the "when to use" list is long enough to threaten
that limit, that's a signal the skill is doing too much -- consider
splitting it into more narrowly-scoped skills instead of cramming more
keywords into one description.

## Iterate by observation, not guesswork

Watch whether the skill triggers on the prompts it should and stays silent
on ones it shouldn't. Rewrite based on actual misses/false-triggers rather
than trying to anticipate every phrasing up front.
