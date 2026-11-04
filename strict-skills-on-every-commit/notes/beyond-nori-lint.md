# Two rules nori-lint doesn't have

Both come from [Anthropic's skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). Both are static: one pattern, the same answer every run.

## `description-no-tags`: 4 files

The spec says the description "cannot contain XML tags". It's loaded into the system prompt for every skill, before any skill is chosen.

- `math-proof` `solo` and `siege` describe their argument as `<the problem, stated in full, or the path of a file holding it>`.
- `example-plugin` `example-command` has `<name>`.
- `vercel-labs` `react-view-transitions` names the React component `<ViewTransition>`. It's a component name, and it's still a tag to anything that reads the description as markup.

## `forward-slash-paths`: 7 files, 27 findings

The spec says to "always use forward slashes in file paths, even on Windows", because a backslash path breaks on macOS and Linux.

- `m365-agent-evaluator` writes `references/guardrails.md` on one line and `references\prompts-schema.json` further down. 15 of the 27 findings are in this file, all paths into the skill itself or the project it works on.
- The other 6 files are Hugging Face and Azure skills with PowerShell sections: `python scripts\invoke_endpoint.py`, `.\scripts\check-quota.ps1`, `.venv\Scripts\python.exe`. There the backslash is deliberate. PowerShell accepts forward slashes, so the spec's advice still holds, but a team that disagrees can change the rule. It's a file in the repository.

The rule skips paths that start with a drive letter (`C:\Temp\screen.png`), since those only exist on Windows, and anything without a file extension, so regex escapes like `\d+` and LaTeX like `\frac` stay quiet.

## One we couldn't write statically

The [Agent Skills specification](https://agentskills.io/specification) says `name` "must match the parent directory name". 17 skills in the corpus don't, among them 4 Vercel skills that prefix `vercel-` and 3 Nori skills with title-case names. Neither tool checks it. nori-lint's rules are handed a file's text and nothing else, and a Vale rule sees one document and has no way to read its path. In Taskless this is a runtime rule, and runtime rules run code, so they need an account and a signature before `check` will run them.
