# nori-lint's directory walk skips dot-directories

`nori-lint lint [path]` finds files with `globSync("**/SKILL.md", { cwd })`. glob skips dot-directories unless it's given `dot: true`, so a skill under `.claude/skills/`, `.github/skills/` or `.agents/skills/` is never read when nori-lint runs from the repository root. Those are where Claude Code, Copilot and the Agent Skills tools keep a project's skills.

Measured with nori-lint 0.4.0:

```sh
mkdir -p demo/.claude/skills/demo
printf -- '---\nname: Demo Skill\ndescription: does things\n---\n# Demo\n\n**bold**\n' \
  > demo/.claude/skills/demo/SKILL.md
cd demo && npx nori-lint lint .
# ✔ No problems found
```

That file breaks five rules. Over this corpus, `nori-lint lint corpus/skills` reads 114 of the 365 files.

Most of the 251 skipped files are one repository's layout: 205 are under Microsoft's `.github/`, 44 under OpenAI's `.curated/` and `.system/` catalog folders, and 2 under Nori's own `.claude/`. So the corpus overstates how often this comes up in a single project. It does come up there: a project's own skills usually live in `.claude/skills/` or `.github/skills/`, and running from the root reads none of them.

Nori's own docs point nori-lint at the skills directory itself (`~/.claude/skills/`), and that works.

Two ways around it today: run nori-lint with the skills directory itself as the path (`nori-lint lint .claude/skills`), or call it as a library, which is what `scripts/compare.mjs` does. The README says a single file works as the path too. In 0.4.0 that prints `error: <file> is not a directory`.

The fix upstream is likely one option, `dot: true`, plus `ignore: ["**/node_modules/**"]` so a repository's dependencies aren't walked.

`taskless check` reads every file the `.vale.ini` glob matches, dot-directories included, and skips what `.gitignore` excludes.
