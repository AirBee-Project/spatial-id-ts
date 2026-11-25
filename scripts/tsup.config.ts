import { execSync } from "node:child_process";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "spatial-id/index": "src/spatial-id/index.ts",
    "time/index": "src/time/index.ts",
    "geometry/index": "src/geometry/index.ts",
    "collection/index": "src/collection/index.ts",
  },
  format: ["esm", "cjs"],
  // サブパスごとにクラスを複製すると、別のサブパスから渡した値が instanceof で判定できなくなる。
  // CJS は既定では分割しないので、共通部分を1つのチャンクにまとめさせる。
  splitting: true,
  dts: false,
  sourcemap: true,
  clean: true,
  onSuccess: async () => {
    execSync("bun x tsc --project scripts/tsconfig.build.json", {
      stdio: "inherit",
    });
    execSync("bun scripts/postbuild.js", { stdio: "inherit" });
  },
});
