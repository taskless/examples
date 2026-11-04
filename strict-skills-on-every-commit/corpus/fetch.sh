#!/usr/bin/env bash
# Fetch every SKILL.md from the repositories in corpus/repos.txt, each at the
# commit pinned there, into corpus/skills/<owner>__<repo>/. Only SKILL.md files
# are kept. The corpus is gitignored: these files belong to their authors, so
# the script fetches them rather than this repository redistributing them.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/skills"
rm -rf "$out"
mkdir -p "$out"

while read -r repo sha; do
  [ -z "$repo" ] && continue
  dest="$out/${repo/\//__}"
  mkdir -p "$dest"
  tmp="$(mktemp -d)"
  curl -fsSL "https://codeload.github.com/$repo/tar.gz/$sha" | tar -xz -C "$tmp" --strip-components=1
  (cd "$tmp" && find . -name SKILL.md -type f -exec rsync -R {} "$dest/" \;)
  rm -rf "$tmp"
  printf '%-36s %s  %3d files\n' "$repo" "${sha:0:7}" "$(find "$dest" -name SKILL.md | wc -l)"
done < "$here/repos.txt"

printf '%-36s %12d files\n' "total" "$(find "$out" -name SKILL.md | wc -l)"
