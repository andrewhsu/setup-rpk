import * as path from "node:path";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import { downloadAndInstall } from "./download.js";
import { getPlatform } from "./platform.js";
import { resolveVersion } from "./version.js";

export async function run(): Promise<void> {
  const platform = getPlatform();
  const versionInput = core.getInput("version") || "latest";
  const githubToken = core.getInput("github-token");

  const version = await resolveVersion(versionInput, githubToken);
  core.info(`Resolved rpk version: ${version}`);

  let installDir = tc.find("rpk", version, platform.arch);
  const cacheHit = installDir !== "";
  if (cacheHit) {
    core.info(`Found rpk ${version} in the tool cache`);
  } else {
    installDir = await downloadAndInstall(version, platform);
  }

  core.addPath(installDir);
  core.setOutput("rpk-version", version);
  core.setOutput("rpk-path", path.join(installDir, "rpk"));
  core.setOutput("cache-hit", String(cacheHit));
  core.info(`rpk ${version} installed at ${installDir}`);
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
