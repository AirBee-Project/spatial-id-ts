import ts from "typescript";
import { describe, expect, it } from "vitest";

// Windows の file URL は "/E:/..." になるので、先頭の "/" を外してファイルパスにする
const fileOf = (relative: string) =>
  decodeURIComponent(new URL(relative, import.meta.url).pathname).replace(
    /^\/(\w:)/,
    "$1",
  );

const pkg = JSON.parse(ts.sys.readFile(fileOf("../package.json")) ?? "") as {
  name: string;
  exports: Record<string, { "spatial-id-source": string }>;
};
const { config } = ts.readConfigFile(
  fileOf("./tsconfig.json"),
  ts.sys.readFile,
);
const paths = config.compilerOptions.paths as Record<string, string[]>;

describe("playground の paths", () => {
  it("package.json の exports と同じサブパスを同じソースへ対応づける", () => {
    const fromExports = Object.fromEntries(
      Object.entries(pkg.exports).map(([subpath, target]) => [
        `${pkg.name}${subpath.slice(1)}`,
        [target["spatial-id-source"].replace(/^\.\//, "../")],
      ]),
    );
    expect(paths).toEqual(fromExports);
  });
});
