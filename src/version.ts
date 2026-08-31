import * as core from "@actions/core";
import { HttpClient } from "@actions/http-client";

const RELEASES_REPO = "redpanda-data/redpanda";
const USER_AGENT = "setup-rpk";

export function normalizeVersion(input: string): string {
  const version = input.trim().replace(/^[vV]/, "");
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error(
      `invalid rpk version '${input}'; expected 'latest' or a version like '26.2.1'`,
    );
  }
  return version;
}

export async function resolveVersion(
  versionInput: string,
  githubToken: string,
): Promise<string> {
  if (versionInput.trim().toLowerCase() !== "latest") {
    return normalizeVersion(versionInput);
  }
  if (githubToken !== "") {
    try {
      return normalizeVersion(await resolveLatestViaApi(githubToken));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      core.warning(
        `failed to resolve the latest rpk version via the GitHub API (${message}); falling back to the release redirect`,
      );
    }
  }
  return normalizeVersion(await resolveLatestViaRedirect());
}

async function resolveLatestViaApi(token: string): Promise<string> {
  const http = new HttpClient(USER_AGENT);
  const response = await http.getJson<{ tag_name: string }>(
    `https://api.github.com/repos/${RELEASES_REPO}/releases/latest`,
    { authorization: `Bearer ${token}` },
  );
  const tag = response.result?.tag_name;
  if (!tag) {
    throw new Error(
      `GitHub API returned status ${response.statusCode} without a tag_name`,
    );
  }
  return tag;
}

async function resolveLatestViaRedirect(): Promise<string> {
  const http = new HttpClient(USER_AGENT, [], { allowRedirects: false });
  const response = await http.get(
    `https://github.com/${RELEASES_REPO}/releases/latest`,
  );
  await response.readBody();
  const location = response.message.headers.location;
  const tag = location?.split("/releases/tag/")[1];
  if (!tag) {
    throw new Error(
      `could not resolve the latest rpk release from https://github.com/${RELEASES_REPO}/releases/latest`,
    );
  }
  return tag;
}
