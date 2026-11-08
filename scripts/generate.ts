// 依存する Rust crate の main の最新を取り直し、生成コードを作る。
// - kasane: src/proto/gen と src/client/wasm/gen（同じコミットから作る）
// - spatial-id: src/collection/wasm/gen
// 引数で対象を絞れる（例: `bun run generate spatial-id`）。省略するとすべて作る。
// 必要なもの: cargo（wasm32-unknown-unknown ターゲット）、protoc、Cargo.lock と同じ版の wasm-bindgen。
// wasm-opt があればサイズを縮める。

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { create, fromBinary } from "@bufbuild/protobuf";
import {
  CodeGeneratorRequestSchema,
  FileDescriptorSetSchema,
} from "@bufbuild/protobuf/wkt";
import { protocGenEs } from "@bufbuild/protoc-gen-es/dist/cjs/src/protoc-gen-es-plugin.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = "wasm32-unknown-unknown";

function run(cmd: string[], options: { optional?: boolean } = {}): string {
  const result = Bun.spawnSync(cmd, { cwd: root, stderr: "inherit" });
  if (!result.success) {
    if (options.optional) return "";
    throw new Error(`failed: ${cmd.join(" ")}`);
  }
  return result.stdout.toString();
}

function has(cmd: string): boolean {
  return Bun.which(cmd) !== null;
}

type Package = { name: string; version: string; manifest_path: string };

/** `dependency` を main の最新に更新し、`manifest` が依存する package の一覧を返す。 */
function update(manifest: string, dependency: string): Package[] {
  run(["cargo", "update", "--manifest-path", manifest, "-p", dependency]);
  const { packages } = JSON.parse(
    run([
      "cargo",
      "metadata",
      "--format-version",
      "1",
      "--manifest-path",
      manifest,
    ]),
  ) as { packages: Package[] };
  return packages;
}

function find(packages: Package[], name: string): Package {
  const found = packages.find((p) => p.name === name);
  if (!found) throw new Error(`${name} is not in cargo metadata`);
  return found;
}

/** Wasm をビルドして `outDir` に JS のグルーと base64 を書き、最適化した `.wasm` のパスを返す。 */
function buildWasm(
  packages: Package[],
  manifest: string,
  crate: string,
  outDir: string,
  outName: string,
): string {
  const bindgenVersion = find(packages, "wasm-bindgen").version;
  const cliVersion = has("wasm-bindgen")
    ? run(["wasm-bindgen", "--version"]).trim().split(" ")[1]
    : undefined;
  if (cliVersion !== bindgenVersion) {
    throw new Error(
      `wasm-bindgen ${bindgenVersion} is required (found ${cliVersion ?? "none"}): cargo install wasm-bindgen-cli --version ${bindgenVersion}`,
    );
  }
  run([
    "cargo",
    "build",
    "--release",
    "--target",
    target,
    "--manifest-path",
    manifest,
  ]);
  rmSync(outDir, { recursive: true, force: true });
  // 既定の読み込み先（import.meta.url 基準）を使わないので、CJS に変換しても壊れない。
  run([
    "wasm-bindgen",
    "--target",
    "web",
    "--omit-default-module-path",
    "--out-dir",
    outDir,
    "--out-name",
    outName,
    join(dirname(manifest), "target", target, "release", `${crate}.wasm`),
  ]);
  const wasmPath = join(outDir, `${outName}_bg.wasm`);
  if (has("wasm-opt")) {
    // --all-features を付けると、binaryen 133 は Bun（JavaScriptCore）が読めない import の形式で書き出す。
    // 付けなければ、Rust が書いた target_features の範囲で最適化する。
    run(["wasm-opt", "-Oz", wasmPath, "-o", wasmPath]);
  } else {
    console.warn("wasm-opt is not found; skipped size optimization");
  }
  rmSync(join(outDir, `${outName}_bg.wasm.d.ts`));
  writeFileSync(
    join(outDir, `${outName}_bg.base64.ts`),
    `export default "${readFileSync(wasmPath).toString("base64")}";\n`,
  );
  return wasmPath;
}

function commitOf(manifest: string, repository: string): string | undefined {
  return readFileSync(join(dirname(manifest), "Cargo.lock"), "utf8").match(
    new RegExp(
      `source = "git\\+https://github\\.com/AirBee-Project/${repository}\\.git\\?branch=main#(\\w+)"`,
    ),
  )?.[1];
}

function generateKasane(): void {
  const manifest = join(root, "wasm", "kasane", "Cargo.toml");
  const genDir = join(root, "src", "proto", "gen");
  const wasmDir = join(root, "src", "client", "wasm", "gen");
  const packages = update(manifest, "kasane");

  // codegen
  const protoDir = join(
    dirname(find(packages, "kasane").manifest_path),
    "proto",
  );
  const protoFiles = [
    "auth.proto",
    "common.proto",
    "data.proto",
    "database.proto",
    "query.proto",
    "system.proto",
    "table.proto",
    "users.proto",
  ];
  const descriptorPath = join(dirname(manifest), "target", "kasane.protoset");
  mkdirSync(dirname(descriptorPath), { recursive: true });
  run([
    "protoc",
    `--proto_path=${protoDir}`,
    "--include_imports",
    "--include_source_info",
    `--descriptor_set_out=${descriptorPath}`,
    ...protoFiles,
  ]);
  const response = protocGenEs.run(
    create(CodeGeneratorRequestSchema, {
      fileToGenerate: protoFiles,
      parameter: "target=ts,import_extension=js",
      protoFile: fromBinary(
        FileDescriptorSetSchema,
        readFileSync(descriptorPath),
      ).file,
    }),
  );
  if (response.error) throw new Error(response.error);
  rmSync(genDir, { recursive: true, force: true });
  for (const file of response.file) {
    const path = join(genDir, file.name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file.content);
  }

  // wasm
  buildWasm(packages, manifest, "kasane_wasm", wasmDir, "kasane");
  // Workers は .wasm の import を WebAssembly.Module として渡すので、型もそれに合わせる。
  // NodeNext は `.wasm` の型を `.d.wasm.ts` から読む（allowArbitraryExtensions）。
  writeFileSync(
    join(wasmDir, "kasane_bg.d.wasm.ts"),
    "declare const module: WebAssembly.Module;\nexport default module;\n",
  );

  console.log(
    `generated from Kasane ${find(packages, "kasane").version} (${commitOf(manifest, "Kasane")})`,
  );
}

function generateSpatialId(): void {
  const manifest = join(root, "wasm", "spatial-id", "Cargo.toml");
  const wasmDir = join(root, "src", "collection", "wasm", "gen");
  const packages = update(manifest, "spatial-id");

  // base64 だけを読み込むので、.wasm は残さない。
  rmSync(
    buildWasm(packages, manifest, "spatial_id_wasm", wasmDir, "spatial_id"),
  );

  console.log(
    `generated from spatial-id ${find(packages, "spatial-id").version} (${commitOf(manifest, "spatial-id-rs")})`,
  );
}

const generators: Record<string, () => void> = {
  kasane: generateKasane,
  "spatial-id": generateSpatialId,
};
const selected = process.argv.slice(2);
for (const name of selected) {
  if (!Object.hasOwn(generators, name)) {
    throw new Error(
      `unknown target: ${name} (expected ${Object.keys(generators).join(", ")})`,
    );
  }
}
for (const [name, generate] of Object.entries(generators)) {
  if (selected.length === 0 || selected.includes(name)) generate();
}
