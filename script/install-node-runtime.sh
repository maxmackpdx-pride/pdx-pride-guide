#!/usr/bin/env bash
# Official Node distribution; verify pinned bytes before extracting or executing.
set -euo pipefail
version=24.22.2
destination="${NODE_RUNTIME_DESTINATION:-/opt/node-runtime}"
case "$(uname -m)" in
  x86_64)
    arch=x64
    expected=48cc0e21e048790e54c0cf5749c2725005313d652651c40b7a21feb9697aaf75
    ;;
  aarch64|arm64)
    arch=arm64
    expected=eb187837a2230d4047161ac0be008584e16b46f726e9c9490ee35dc6b17d9ba8
    ;;
  *) echo 'Unsupported production CPU architecture' >&2; exit 1 ;;
esac
case "$destination" in
  /*) ;;
  *) echo 'NODE_RUNTIME_DESTINATION must be an absolute path' >&2; exit 1 ;;
esac
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
archive="$tmp/node.tar.xz"
curl --fail --show-error --silent --location \
  "https://nodejs.org/dist/v${version}/node-v${version}-linux-${arch}.tar.xz" \
  --output "$archive"
printf '%s  %s\n' "$expected" "$archive" | sha256sum --check -
mkdir -p "$destination"
tar -xJf "$archive" --strip-components=1 -C "$destination"
test "$("$destination/bin/node" --version)" = "v${version}"
"$destination/bin/node" --version
