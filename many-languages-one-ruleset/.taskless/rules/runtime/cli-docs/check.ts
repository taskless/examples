/**
 * Every flag the CLI defines appears in `docs/cli.md`, and every flag the docs
 * mention exists. Each finding points at the file that needs the fix.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface Match {
  rule: string;
  file: string;
  line: number;
  column: number;
  text: string;
  captures: Record<string, string>;
}

const DOCS = "docs/cli.md";
const LONG_FLAG = /(?<![\w-])--[a-z][a-z0-9-]*/g;

/** Flags mentioned in the docs, with the first line each appears on. */
function documentedFlags(root: string): Map<string, number> {
  const flags = new Map<string, number>();
  const lines = readFileSync(join(root, DOCS), "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const [flag] of line.matchAll(LONG_FLAG)) {
      if (!flags.has(flag)) flags.set(flag, index + 1);
    }
  });
  return flags;
}

/**
 * The line a `.option()` call sits on. In a chain the match starts at the
 * head of the chain, so count down to the flag itself.
 */
function flagLine(match: Match): number {
  const before = match.text.slice(0, match.text.lastIndexOf(match.captures.FLAG));
  return match.line + before.split("\n").length - 1;
}

export default async function check(root: string, matches: Match[]) {
  const documented = documentedFlags(root);
  const defined = new Map<string, Match>();

  for (const match of matches) {
    if (match.rule !== "cli-option") continue;
    const [flag] = match.captures.FLAG.match(LONG_FLAG) ?? [];
    if (flag !== undefined) defined.set(flag, match);
  }

  const findings: { file: string; line: number; message: string; severity: "error" }[] = [];
  for (const [flag, match] of defined) {
    if (documented.has(flag)) continue;
    findings.push({
      file: match.file,
      line: flagLine(match),
      message: `${flag} is defined here but missing from ${DOCS}`,
      severity: "error",
    });
  }
  for (const [flag, line] of documented) {
    if (defined.has(flag)) continue;
    findings.push({
      file: DOCS,
      line,
      message: `${flag} is documented here but the CLI doesn't define it`,
      severity: "error",
    });
  }
  return findings;
}
