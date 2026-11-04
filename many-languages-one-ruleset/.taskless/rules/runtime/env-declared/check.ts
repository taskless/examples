/**
 * Every environment variable read in TypeScript or Python is declared in
 * `.env.example`. Both languages are held to one parse of that file.
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

const READS = new Set(["env-read-ts", "env-read-py"]);

/** Keys in a dotenv file. A missing file declares nothing. */
function declaredKeys(path: string): Set<string> {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return new Set();
  }

  const keys = new Set<string>();
  for (const line of raw.split("\n")) {
    const text = line.trim();
    const equals = text.indexOf("=");
    if (text === "" || text.startsWith("#") || equals <= 0) continue;
    keys.add(text.slice(0, equals).trim());
  }
  return keys;
}

export default async function check(root: string, matches: Match[]) {
  const declared = declaredKeys(join(root, ".env.example"));
  return matches
    .filter((m) => READS.has(m.rule))
    .map((m) => ({ ...m, name: m.captures.VAR.replace(/^["']|["']$/g, "") }))
    .filter((m) => !declared.has(m.name))
    .map((m) => ({
      file: m.file,
      line: m.line,
      message: `${m.name} is read here but isn't declared in .env.example`,
      severity: "error" as const,
    }));
}
