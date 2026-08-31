import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";

export function checksumsUrl(version: string): string {
  return `https://github.com/redpanda-data/redpanda/releases/download/v${version}/rpk_${version}_checksums.txt`;
}

export async function verifyChecksum(
  archivePath: string,
  version: string,
  assetName: string,
): Promise<void> {
  let checksumsPath: string;
  try {
    checksumsPath = await tc.downloadTool(checksumsUrl(version));
  } catch (error) {
    if (error instanceof tc.HTTPError && error.httpStatusCode === 404) {
      core.warning(
        `no checksums file published for rpk v${version}; skipping verification`,
      );
      return;
    }
    throw error;
  }

  const expected = parseChecksums(
    fs.readFileSync(checksumsPath, "utf8"),
  ).get(assetName);
  if (!expected) {
    throw new Error(
      `checksums file for rpk v${version} has no entry for ${assetName}`,
    );
  }

  const actual = await sha256(archivePath);
  if (actual !== expected) {
    throw new Error(
      `sha256 mismatch for ${assetName}: expected ${expected}, got ${actual}`,
    );
  }
  core.info(`verified sha256 of ${assetName}: ${actual}`);
}

function parseChecksums(content: string): Map<string, string> {
  const checksums = new Map<string, string>();
  for (const line of content.split("\n")) {
    const match = line.trim().match(/^([0-9a-fA-F]{64})\s+\*?(\S+)$/);
    if (match) {
      checksums.set(match[2], match[1].toLowerCase());
    }
  }
  return checksums;
}

function sha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(filePath)
      .on("error", reject)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("hex")));
  });
}
