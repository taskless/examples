# What porting nori-lint taught us about Vale

Each item cost at least one failed fixture. All measured on the Vale 3.23.0 that Taskless 0.12.0 ships.

## The markdown parser does most of the work

nori-lint's `bold_italics` and `markdown_links` are about 630 lines of TypeScript between them, most of it scanning markdown by hand: strip inline code spans, toggle a flag on every fence, skip `<good_example>` blocks, tell `![image](x)` from `[link](x)`, work out where the frontmatter ends. In Vale most of that is a `scope`. `bold-italics` is `scope: [strong, emphasis]` and one token. `description-action` is `scope: frontmatter.description`, which also means Vale parses the YAML first, so a `description: >-` block scalar is read as its value rather than as the two characters `>-`.

## `occurrence` can't count a bare `\n`

The first `line-count` rule was `token: '\n'` with `max: 149`. It never fired. With `max: 100` on a 151-line file it still didn't. It behaves like a token made only of non-word characters getting word boundaries wrapped around it, the way an `existence` token does without `nonword: true`, and `occurrence` has no `nonword` field to turn that off. That's our reading of the behavior. We didn't trace it in Vale's source. A token that consumes the line works: `(?:[^\n]*\n|[^\n]+\z)` counts exactly what nori-lint counts, including a last line with no newline.

## A lazy group still backtracks

`redundant-title` skips optional frontmatter with `---\n(?:[^\n]*\n)*?---`. When the first line after the frontmatter was prose, the rest of the pattern failed there, and the lazy group grew past the frontmatter's closing `---` to a horizontal rule further down the file, then matched the heading after that. The fix is to forbid `---` inside the group: `(?:(?!---[ \t]*\n)[^\n]*\n)*?`.

## The `link` scope is close, and not quite

`scope: link` skips links in fenced and inline code, which is what `markdown-links` needs. It also covers bare URLs and `<autolinks>`, which are what the rule tells you to write, and Vale masks any link text that looks like a URL or a path with asterisks. Requiring one non-asterisk character separated real link text from bare URLs, and then `[references/tools.md](references/tools.md)` disappeared too, since its text is a path. Only `raw` shows the `[text](url)` syntax, and `raw` can't see fences, so the rule became a script.

## `script` is the escape hatch, and it stays static

Two rules need state across the document: `unclosed-tags` counts openings against closings per tag name, and `markdown-links` needs to know whether a line is inside a fence. Both are `extends: script` with a few dozen lines of Tengo. They're still Vale rules, which Taskless treats as static rules like any other, so they run on every `check` with no login and no `--dangerously-run-scripts`. A Taskless runtime rule runs TypeScript, so it has to be signed by the Taskless service or run with that flag.
