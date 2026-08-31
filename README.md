# setup-rpk

GitHub Action to install the Redpanda [rpk](https://docs.redpanda.com/current/get-started/rpk-install/) CLI on Linux and macOS runners.

## Usage

Install the latest release:

```yaml
- uses: andrewhsu/setup-rpk@v1
- run: rpk version
```

Pin a version (with or without the leading `v`):

```yaml
- uses: andrewhsu/setup-rpk@v1
  with:
    version: 26.2.1
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `version` | `latest` | Version of rpk to install, e.g. `26.2.1` or `v26.2.1`. `latest` installs the most recent release. |
| `github-token` | `${{ github.token }}` | Token used to query the `redpanda-data/redpanda` releases API when resolving `latest`. |

## Outputs

| Output | Description |
| --- | --- |
| `rpk-version` | The concrete version that was installed (no leading `v`), e.g. `26.2.2`. |
| `rpk-path` | Absolute path to the installed `rpk` binary. |
| `cache-hit` | `"true"` if rpk came from the runner tool cache, `"false"` otherwise. |

## Supported platforms

Linux and macOS, on amd64 and arm64. The action fails with a clear error on other platforms.

## How it works

1. Resolves the requested version (`latest` is resolved via the GitHub releases API, falling back to the release redirect when unauthenticated or rate-limited).
2. Checks the runner [tool cache](https://github.com/actions/toolkit/tree/main/packages/tool-cache) and skips the download on a hit.
3. Downloads `rpk-<os>-<arch>.zip` from [redpanda-data/redpanda releases](https://github.com/redpanda-data/redpanda/releases).
4. Verifies the archive's sha256 against the release's `rpk_<version>_checksums.txt` (skipped with a warning if a release predates checksum publishing).
5. Extracts the binary into the tool cache and adds it to `PATH`.

## Development

Requires Node 24 (see `.node-version`).

```sh
npm ci
npm run build   # typechecks and bundles src/ into dist/ with @vercel/ncc
```

`dist/` is committed; CI fails if it is out of date with `src/`.
