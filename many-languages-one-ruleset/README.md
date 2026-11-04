# Many Languages, One Ruleset

Three runtime rules from the Taskless post *Many Languages, One Ruleset*. Each one needs evidence from more than one file, and each one spans more than one language.

| Rule | What it checks | Languages |
| --- | --- | --- |
| [`env-declared`](.taskless/rules/runtime/env-declared/) | Every environment variable the code reads is declared in `.env.example` | TypeScript, Python, dotenv |
| [`cli-docs`](.taskless/rules/runtime/cli-docs/) | Every CLI flag is documented, and every documented flag exists | TypeScript, Markdown |
| [`i18n-strings`](.taskless/rules/runtime/i18n-strings/) | JSX text comes from a locale file, and every key exists in every locale | TSX, Python, JSON |

Each rule is a directory with its ast-grep captures, a `check.ts`, a `prompt.md` with the plain-English request, and pass and fail fixtures under `tests/`.

## Run the fixtures

From this directory:

```sh
npx @taskless/cli@0.13.4 verify --dangerously-run-scripts
```

The flag is required because these rules aren't signed by Taskless Cloud, and running a fixture executes the rule's `check.ts`. Read the code first, the same as you would for any script you run.

## Use one in your repo

Copying a rule works only with that same flag, because Taskless skips runtime rules the service hasn't signed. To get one that runs normally, give the request in its `prompt.md` to your agent and let Taskless generate, validate and sign it for your repo.

## Known limits

- `env-declared` scans `.ts` files. ast-grep treats `.tsx` as its own language, so a React app needs one more capture with `language: Tsx`.
- `i18n-strings` matches text between tags. Attribute strings like `title="Toggle"` need their own capture.
- `cli-docs` reads flags from commander's `.option()`. `.requiredOption()` and `new Option()` aren't captured.
