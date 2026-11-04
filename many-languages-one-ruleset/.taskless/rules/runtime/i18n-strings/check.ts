/**
 * User-facing text comes from a locale file, and every key the code uses
 * exists in every locale. A hardcoded string that already has a key gets a
 * finding naming that key, so the fix reuses it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface Match {
  rule: string;
  file: string;
  line: number;
  column: number;
  text: string;
  captures: Record<string, string>;
}

type Locale = Map<string, string>;

/** Flatten nested JSON into dotted keys. */
function flatten(tree: Record<string, unknown>, prefix = "", out: Locale = new Map()): Locale {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    if (value !== null && typeof value === "object") {
      flatten(value as Record<string, unknown>, path, out);
    } else {
      out.set(path, String(value));
    }
  }
  return out;
}

function loadLocales(root: string): Map<string, Locale> {
  const dir = join(root, "locales");
  const locales = new Map<string, Locale>();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    locales.set(file, flatten(JSON.parse(readFileSync(join(dir, file), "utf8"))));
  }
  return locales;
}

/** `jsx_text` starts at the end of the opening tag, so skip leading newlines. */
function textLine(match: Match): number {
  const leading = match.text.slice(0, match.text.length - match.text.trimStart().length);
  return match.line + leading.split("\n").length - 1;
}

export default async function check(root: string, matches: Match[]) {
  const locales = loadLocales(root);
  const english = locales.get("en.json") ?? new Map();
  const keyByText = new Map([...english].map(([key, text]) => [text, key]));
  const findings: { file: string; line: number; message: string; severity: "error" }[] = [];

  for (const match of matches) {
    if (match.rule === "jsx-literal") {
      const text = match.text.trim();
      const key = keyByText.get(text);
      findings.push({
        file: match.file,
        line: textLine(match),
        message:
          key === undefined
            ? `"${text}" is hardcoded. Add it to locales/en.json`
            : `"${text}" is hardcoded. locales/en.json already has it as ${key}`,
        severity: "error",
      });
      continue;
    }

    if (match.rule !== "t-call" && match.rule !== "gettext-call") continue;

    // A key built at runtime can't be checked, so only string literals count.
    const raw = match.captures.KEY;
    if (!/^["'].*["']$/.test(raw)) continue;
    const key = raw.slice(1, -1);

    const missing = [...locales]
      .filter(([, keys]) => !keys.has(key))
      .map(([file]) => `locales/${file}`);
    if (missing.length > 0) {
      findings.push({
        file: match.file,
        line: match.line,
        message: `${key} is missing from ${missing.join(", ")}`,
        severity: "error",
      });
    }
  }
  return findings;
}
