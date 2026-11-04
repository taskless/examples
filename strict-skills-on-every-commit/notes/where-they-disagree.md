# Where they disagree

After the 3 fixes in the git history, nori-lint and Taskless differ on 8 files across 4 rules. Each one was read by hand. In 3 of them the port is the one that's wrong.

## `bold_italics`: one file only Taskless flags

`openai/skills` `.curated/yeet` writes *why*, *what* and *net change* with single underscores: `_why_`. nori-lint's scanner looks for `**`, `__` and `*`, so single-underscore italics get past it. That may be deliberate, since `_` also shows up inside snake_case names. Vale's markdown parser reads `_why_` as emphasis, the way any renderer does.

## `consecutive_blank_lines`: one file only nori-lint flags

`microsoft/skills` `azure-compliance` ends with one blank line, then the final newline: `...)\n\n`. nori-lint splits the file on `\n`, which produces an empty string after the last newline, and counts that as a second blank line. Its own fixer replaces `\n{3,}`, which never matches here, so after `nori-lint fix` (which does change the file, for other rules) `nori-lint lint` still reports it.

## `trailing_whitespace`: one file only nori-lint flags

`huggingface/skills` `huggingface-datasets` uses Windows line endings. nori-lint splits on `\n`, leaves the `\r` on each line, and `trimEnd()` removes it, so all 107 lines are reported. The file has no trailing spaces. Counting `\r` as whitespace that costs tokens is a defensible reading. The real problem is `fix`: it strips `[ \t]+$`, which never removes a `\r`, so the findings survive `nori-lint fix`. The port only agrees with the file because Vale normalizes line endings before its pattern runs. For the same reason nori-lint can never see two blank lines in a row in a CRLF file, since each blank line is `"\r"` rather than `""`.

## `description_action`: 5 files only nori-lint flags, 3 of them correctly

Two use a YAML block scalar:

```yaml
description: >-
  Use when the user asks about finding the best, top, or recommended model...
```

nori-lint reads the text after `description:` on the same line, which is `>-` in `huggingface-best` and `>` in `m365-agent-evaluator`, and reports that it doesn't start with "Use". `huggingface-best` and `m365-agent-evaluator` both start with "Use". The Taskless rule is scoped to `frontmatter.description`, so Vale parses the YAML first and checks the value.

Three have no frontmatter at all (`azure-app-onboard` `deploy`, `prepare` and `scaffold`). nori-lint is right to flag them here: with no description, the description can't say when to use the skill. The port's `description-action` is scoped to `frontmatter.description`, so when there is no description there is nothing for it to match, and it stays quiet. That's a gap in the port. The missing description is still reported by `frontmatter-has-description`.
