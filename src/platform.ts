export interface RpkPlatform {
  os: "linux" | "darwin";
  arch: "amd64" | "arm64";
}

export function getPlatform(): RpkPlatform {
  let os: RpkPlatform["os"];
  switch (process.platform) {
    case "linux":
      os = "linux";
      break;
    case "darwin":
      os = "darwin";
      break;
    default:
      throw new Error(
        `setup-rpk only supports Linux and macOS runners; detected platform '${process.platform}'`,
      );
  }

  let arch: RpkPlatform["arch"];
  switch (process.arch) {
    case "x64":
      arch = "amd64";
      break;
    case "arm64":
      arch = "arm64";
      break;
    default:
      throw new Error(
        `setup-rpk only supports amd64 and arm64 runners; detected architecture '${process.arch}'`,
      );
  }

  return { os, arch };
}
