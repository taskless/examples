// Time both tools the same way: as a whole process, startup included, over
// the same files. Prints the median of 5 runs each.
//
//   node scripts/bench.mjs [dir]   default: corpus/skills
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { globSync } from "glob";
import { defaultRegistry } from "nori-lint";

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith("--")) ?? "corpus/skills";

// The nori-lint child: every static rule on every file, through the library.
if (args.includes("--nori")) {
  const rules = defaultRegistry().rules;
  for (const f of globSync("**/SKILL.md", { cwd: root, dot: true, absolute: true })) {
    const input = fs.readFileSync(f, "utf8");
    for (const rule of rules) rule.run(input);
  }
  process.exit(0);
}

const time = (cmd, argv) => {
  const t = performance.now();
  spawnSync(cmd, argv, { stdio: "ignore" });
  return performance.now() - t;
};
const median = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const runs = (f) => median(Array.from({ length: 5 }, f));

const nori = runs(() => time(process.execPath, [new URL(import.meta.url).pathname, root, "--nori"]));
const taskless = runs(() => time("npx", ["--no", "taskless", "check", root, "--json"]));
console.log(`nori-lint ${nori.toFixed(0)} ms, taskless check ${taskless.toFixed(0)} ms (median of 5, whole process)`);
