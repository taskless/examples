# `unclosed_tags` mostly finds placeholders

nori-lint's `unclosed_tags` fires on 257 of the 365 skills in the corpus. The port fires on the same 257, because it scans the same way: anything between `<` and `>` with no space in it is a tag, anywhere in the file, code included.

The tags it reports most often:

| Tag | Files |
| --- | --- |
| `<specific_credential>` | 95 |
| `<Client>` (as in ``async with `<Client>(...)` as client``) | 34 |
| `<resource>` | 31 |
| `<name>` | 26 |
| `<account>` | 23 |
| `<client-id>`, `<tenant-id>`, `<your-subscription-id>` | 18 each |

Almost all of those are placeholders in a command (`az keyvault show --name <vault-name>`) or a generic type. Taskless's own skill trips it the same way, on `agent <topic>`.

Porting a rule means taking on its opinions, and this is the one we'd change first. Two variants, each one more clause:

- Count only the tags nori-lint's other rules care about: `required`, `good_example`, `bad_example`.
- Skip fenced and inline code, the same way `markdown-links` does.

We kept the port faithful so the scorecard compares like with like.
