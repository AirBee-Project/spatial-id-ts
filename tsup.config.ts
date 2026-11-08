import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "spatial-id/index": "src/spatial-id/index.ts",
    "time/index": "src/time/index.ts",
    "geometry/index": "src/geometry/index.ts",
    "collection/index": "src/collection/index.ts",
    "client/index": "src/client/index.ts",
    "client/database/index": "src/client/database/index.ts",
    "client/query/index": "src/client/query/index.ts",
    "client/result/index": "src/client/result/index.ts",
    "wasm/inline": "src/client/wasm/inline.ts",
    "wasm/workerd": "src/client/wasm/workerd.ts",
  },
  format: ["esm", "cjs"],
  // サブパスごとにクラスを複製すると、別のサブパスから渡した値が instanceof で判定できなくなる。
  // CJS は既定では分割しないので、共通部分を1つのチャンクにまとめさせる。
  splitting: true,
  // `#kasane-wasm` は実行環境に合わせて package.json の imports で選ぶので、束ねない。
  // `.wasm` は Workers のバンドラーに WebAssembly.Module として読ませるため、ファイルのまま置く。
  external: ["#kasane-wasm", /\.wasm$/],
  dts: false,
  sourcemap: true,
  clean: true,
  onSuccess: async () => {
    mkdirSync("dist/wasm/gen", { recursive: true });
    copyFileSync(
      "src/client/wasm/gen/kasane_bg.wasm",
      "dist/wasm/gen/kasane_bg.wasm",
    );
    execSync("bun x tsc --project tsconfig.build.json", { stdio: "inherit" });
    execSync("bun scripts/postbuild.js", { stdio: "inherit" });
  },
});
