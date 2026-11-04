// Run nori-lint's static rules and the Taskless port over the same SKILL.md
// files, then line up which files each one flags, rule by rule.
//
//   node scripts/compare.mjs [dir]        default: corpus/skills
//   node scripts/compare.mjs --diff rule  list the files the two disagree on,
//                                         or, for a rule only Taskless has, the
//                                         files it flags
//
// nori-lint runs in-process through its library export, once per file, so
// files under dot-directories (.claude/skills, .github/skills) are included.
// Its CLI's own directory walk skips those; see notes/dot-directories.md.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";
import { defaultRegistry } from "nori-lint";

const args = process.argv.slice(2);
const diffRule = args.includes("--diff") ? args[args.indexOf("--diff") + 1] : null;
const root = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--diff") ?? "corpus/skills";

// Taskless rule ids, mapped back to the nori-lint rule each one ports.
const PORT = {
  "bold-italics": "bold_italics",
  "consecutive-blank-lines": "consecutive_blank_lines",
  "description-action": "description_action",
  "frontmatter-has-name": "frontmatter",
  "frontmatter-has-description": "frontmatter",
  "frontmatter-known-fields": "frontmatter",
  "frontmatter-description-length": "frontmatter",
  "frontmatter-name-format": "frontmatter_name_format",
  "line-count": "line_count",
  "markdown-links": "markdown_links",
  "redundant-title": "redundant_title",
  "required-tags": "required_tags",
  "trailing-whitespace": "trailing_whitespace",
  "unclosed-tags": "unclosed_tags",
  "when-to-use": "when_to_use",
};

// Rules nori-lint doesn't have. Both come from Anthropic's skill authoring
// best practices.
const EXTRA = ["description-no-tags", "forward-slash-paths"];

const files = globSync("**/SKILL.md", { cwd: root, dot: true }).sort();

// nori-lint: every static rule on every file.
const nori = new Map(); // rule -> Map(file -> findings)
const rules = defaultRegistry().rules;
for (const rel of files) {
  const input = fs.readFileSync(path.join(root, rel), "utf8");
  for (const rule of rules) {
    const n = rule.run(input).length;
    if (n === 0) continue;
    if (!nori.has(rule.name)) nori.set(rule.name, new Map());
    nori.get(rule.name).set(rel, n);
  }
}

// Taskless: one check over the directory.
let out;
try {
  out = execFileSync("npx", ["--no", "taskless", "check", root, "--json"], { encoding: "utf8", maxBuffer: 1 << 28 });
} catch (e) {
  out = e.stdout; // check exits non-zero when it finds errors
}
const report = JSON.parse(out);
if (report.failures) throw new Error(`taskless check failed: ${JSON.stringify(report.failures)}`);

const taskless = new Map(); // nori rule name -> Map(file -> findings)
const extra = new Map(EXTRA.map((id) => [id, new Map()])); // Taskless rule id -> Map(file -> findings)
for (const r of report.results) {
  if (extra.has(r.ruleId)) {
    const m = extra.get(r.ruleId);
    const rel = path.relative(root, r.file);
    m.set(rel, (m.get(rel) ?? 0) + 1);
    continue;
  }
  const name = PORT[r.ruleId];
  if (!name) continue;
  const rel = path.relative(root, r.file);
  if (!taskless.has(name)) taskless.set(name, new Map());
  const m = taskless.get(name);
  m.set(rel, (m.get(rel) ?? 0) + 1);
}

if (diffRule && extra.has(diffRule)) {
  for (const [f, n] of extra.get(diffRule)) console.log(`${String(n).padStart(3)}  ${f}`);
  process.exit(0);
}
if (diffRule) {
  const a = nori.get(diffRule) ?? new Map();
  const b = taskless.get(diffRule) ?? new Map();
  for (const f of files) {
    if (a.has(f) !== b.has(f)) console.log(`${a.has(f) ? "nori-lint only" : "Taskless only "}  ${f}`);
  }
  process.exit(0);
}

const names = rules.map((r) => r.name);
const rows = names.map((name) => {
  const a = nori.get(name) ?? new Map();
  const b = taskless.get(name) ?? new Map();
  const both = [...a.keys()].filter((f) => b.has(f)).length;
  return { name, nori: a.size, taskless: b.size, both, noriOnly: a.size - both, tasklessOnly: b.size - both };
});

console.log(`${files.length} SKILL.md files under ${root}\n`);
console.log("| nori-lint rule | Files nori-lint flags | Files Taskless flags | Both | nori-lint only | Taskless only |");
console.log("| --- | --- | --- | --- | --- | --- |");
for (const r of rows) {
  console.log(`| \`${r.name}\` | ${r.nori} | ${r.taskless} | ${r.both} | ${r.noriOnly} | ${r.tasklessOnly} |`);
}
console.log("\n| Taskless rule nori-lint doesn't have | Files flagged | Findings |");
console.log("| --- | --- | --- |");
for (const [id, m] of extra) {
  const findings = [...m.values()].reduce((a, b) => a + b, 0);
  console.log(`| \`${id}\` | ${m.size} | ${findings} |`);
}
const agree = rows.filter((r) => r.noriOnly === 0 && r.tasklessOnly === 0).length;
console.log(`\n${agree} of ${rows.length} rules agree on every file.`);
