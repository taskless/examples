# blog-taskless-nori-lint

[nori-lint](https://github.com/tilework-tech/nori-lint) is an opinionated linter for `SKILL.md` files, written by the team at [Nori](https://noriagentic.com) and released under Apache-2.0. Its rules come from a clear point of view: a skill is read by an LLM, every wasted word costs context in every session, and a skill should be a short process with a checklist.

This repo rebuilds nori-lint's 12 static rules as [Taskless](https://taskless.io) rules, so they run in `taskless check` next to a team's other rules, on every commit and in CI. It adds 2 rules from Anthropic's skill authoring guidance that nori-lint doesn't have. It then runs both tools over 365 public `SKILL.md` files and lines up what each one flags. What we learned along the way, including what didn't work, is in [`notes/`](notes/).

This repo is about static analysis: checks that give the same answer every time they run. nori-lint's 10 LLM rules (`obvious_instructions`, `negative_without_positive` and the rest) ask a model for a judgment, so they aren't ported.

## Run it

You need Node 22.22 or later.

```sh
npm install
npm run corpus     # fetch every SKILL.md from the repos in corpus/repos.txt, at the pinned commits
npm run compare    # nori-lint and Taskless over corpus/skills/, side by side
npm run test:rules # the rules' own fixtures
```

`npm run bench` times both tools as whole processes, startup included. `node scripts/compare.mjs --diff <rule>` lists the files the two tools disagree on for one nori-lint rule. nori-lint 0.4.0 and Taskless 0.12.0 are pinned in `package.json`.

## The rules

All 17 are Vale rules in `.taskless/rules/vale/`, scoped to `**/SKILL.md`. 15 are declarative, and 2 are short Tengo scripts, because they need to count or to know whether a line sits inside a code fence.

| nori-lint rule | Taskless rule | How |
| --- | --- | --- |
| `bold_italics` | `bold-italics` | `existence` over Vale's `strong` and `emphasis` scopes |
| `consecutive_blank_lines` | `consecutive-blank-lines` | `existence`, raw |
| `description_action` | `description-action` | `existence` over `frontmatter.description` |
| `frontmatter` | `frontmatter-has-name`, `frontmatter-has-description`, `frontmatter-known-fields`, `frontmatter-description-length` | `occurrence` with `min: 1` for the required fields, `existence` for the rest |
| `frontmatter_name_format` | `frontmatter-name-format` | `existence` over `frontmatter.name` |
| `line_count` | `line-count` | `occurrence` with `max: 150` |
| `markdown_links` | `markdown-links` | `script` |
| `redundant_title` | `redundant-title` | `existence`, raw, anchored to the start of the file |
| `required_tags` | `required-tags` | `occurrence` with `min: 1` |
| `trailing_whitespace` | `trailing-whitespace` | `existence`, raw |
| `unclosed_tags` | `unclosed-tags` | `script` |
| `when_to_use` | `when-to-use` | `existence` over `heading` |

2 more rules check what [Anthropic's skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) require and nori-lint doesn't:

| Taskless rule | What it checks | How |
| --- | --- | --- |
| `description-no-tags` | The description holds no XML tags. The spec forbids them, since the description is loaded into the system prompt | `existence` over `frontmatter.description` |
| `forward-slash-paths` | File paths use forward slashes. A backslash path breaks on macOS and Linux | `existence`, raw |

Two checks inside nori-lint's `frontmatter` rule aren't ported: `compatibility` over 500 characters, and `metadata` that isn't a map. Neither fires anywhere in the corpus.

## Scorecard

Over 365 `SKILL.md` files from nine repositories, by file:

| nori-lint rule | Files nori-lint flags | Files Taskless flags | Both | nori-lint only | Taskless only |
| --- | --- | --- | --- | --- | --- |
| `bold_italics` | 311 | 312 | 311 | 0 | 1 |
| `consecutive_blank_lines` | 29 | 28 | 28 | 1 | 0 |
| `description_action` | 324 | 319 | 319 | 5 | 0 |
| `frontmatter` | 40 | 40 | 40 | 0 | 0 |
| `frontmatter_name_format` | 11 | 11 | 11 | 0 | 0 |
| `line_count` | 239 | 239 | 239 | 0 | 0 |
| `markdown_links` | 169 | 169 | 169 | 0 | 0 |
| `redundant_title` | 358 | 358 | 358 | 0 | 0 |
| `required_tags` | 362 | 362 | 362 | 0 | 0 |
| `trailing_whitespace` | 90 | 89 | 89 | 1 | 0 |
| `unclosed_tags` | 257 | 257 | 257 | 0 | 0 |
| `when_to_use` | 15 | 15 | 15 | 0 | 0 |

8 rules agree on every file. The 8 files where they differ are explained one by one in [`notes/where-they-disagree.md`](notes/where-they-disagree.md). In each, the Taskless result matches what the file actually contains.

The 2 rules nori-lint doesn't have:

| Taskless rule | Files flagged | Findings |
| --- | --- | --- |
| `description-no-tags` | 4 | 4 |
| `forward-slash-paths` | 7 | 27 |

`node scripts/compare.mjs --diff <rule>` lists the files for either one. Every finding was read by hand, and each is what the rule describes. See [`notes/beyond-nori-lint.md`](notes/beyond-nori-lint.md).

## The corpus

Every skill in the corpus was written and published by the teams and people in the table below. Thank you for sharing them.

`corpus/repos.txt` pins each repository to a commit. `corpus/fetch.sh` downloads them at run time, keeps only the `SKILL.md` files and writes them to `corpus/skills/`, which is gitignored. Nothing from the corpus is committed here, and every skill stays under its own repository's license. `notes/` quotes one line of `huggingface-best` to show a parsing case.

| Repository | Pinned commit | Skills | License at the repository root |
| --- | --- | --- | --- |
| [anthropics/skills](https://github.com/anthropics/skills) | [`683bc88`](https://github.com/anthropics/skills/tree/683bc88e56f3e09ba94f7055977f3d3aa499f202) | 20 | none at root, see the repository |
| [anthropics/claude-code](https://github.com/anthropics/claude-code) | [`79babc3`](https://github.com/anthropics/claude-code/tree/79babc372d64101f981bd2b52c3dbe588596dc56) | 10 | none at root, see the repository |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | [`b78ac49`](https://github.com/anthropics/claude-plugins-official/tree/b78ac49cdc6b3d7b61c4439470e311f4291265b1) | 33 | Apache-2.0 |
| [obra/superpowers](https://github.com/obra/superpowers) | [`8ca22db`](https://github.com/obra/superpowers/tree/8ca22dba9a94f28898bbce59f2537ff4d87c747d) | 15 | MIT |
| [openai/skills](https://github.com/openai/skills) | [`49f948f`](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431) | 44 | none at root, see the repository |
| [microsoft/skills](https://github.com/microsoft/skills) | [`354361d`](https://github.com/microsoft/skills/tree/354361d83247c76a1c21e802e0d4887c4d8323a3) | 205 | MIT |
| [huggingface/skills](https://github.com/huggingface/skills) | [`ca0325b`](https://github.com/huggingface/skills/tree/ca0325bb20b2d0a1b2efa893670c4c72f79e707b) | 26 | Apache-2.0 |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | [`063bee9`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278) | 9 | none at root, see the repository |
| [tilework-tech/nori-skillsets](https://github.com/tilework-tech/nori-skillsets) | [`1c0bd9f`](https://github.com/tilework-tech/nori-skillsets/tree/1c0bd9f897189d6e4afaf6d52d4e5a6a24f9c133) | 3 | Apache-2.0 |

251 of the 365 live under a dot-directory such as `.github/skills/` or `.curated/`. `scripts/compare.mjs` runs nori-lint through its library export, once per file, so they're all included. See [`notes/dot-directories.md`](notes/dot-directories.md) for why that matters.

## Credit

The rules, their thresholds and the reasoning behind them are nori-lint's. The two scripts follow its scanning logic. nori-lint is Copyright 2026 Tilework Tech Inc. and licensed under the [Apache License 2.0](https://github.com/tilework-tech/nori-lint/blob/main/LICENSE). This repo is MIT.
