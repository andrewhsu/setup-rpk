import * as fs from "node:fs";
import * as path from "node:path";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import { verifyChecksum } from "./checksum.js";
import type { RpkPlatform } from "./platform.js";

const RELEASES_URL = "https://github.com/redpanda-data/redpanda/releases";

export function assetName(platform: RpkPlatform): string {
  return `rpk-${platform.os}-${platform.arch}.zip`;
}

export function downloadUrl(version: string, platform: RpkPlatform): string {
  return `${RELEASES_URL}/download/v${version}/${assetName(platform)}`;
}

export async function downloadAndInstall(
  version: string,
  platform: RpkPlatform,
): Promise<string> {
  const url = downloadUrl(version, platform);
  core.info(`Downloading ${url}`);

  let archivePath: string;
  try {
    archivePath = await tc.downloadTool(url);
  } catch (error) {
    if (error instanceof tc.HTTPError && error.httpStatusCode === 404) {
      throw new Error(
        `rpk v${version} not found (no such release, or it has no ${assetName(platform)} asset): ${url}`,
      );
    }
    throw error;
  }

  await verifyChecksum(archivePath, version, assetName(platform));

  const extractDir = await tc.extractZip(archivePath);
  fs.chmodSync(path.join(extractDir, "rpk"), 0o755);

  return tc.cacheDir(extractDir, "rpk", version, platform.arch);
}
