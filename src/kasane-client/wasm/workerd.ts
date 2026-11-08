import { initSync, Kasane } from "./gen/kasane.js";
import wasm from "./gen/kasane_bg.wasm";

let loaded = false;

/**
 * Wasm を読み込み（初回だけ）、データが空の Kasane を作る。
 *
 * Cloudflare Workers は実行時に bytes から Wasm をコンパイルできないので、
 * バンドラーが `.wasm` の import を `WebAssembly.Module` にしたものを使う。
 */
export async function createKasane(): Promise<Kasane> {
  if (!loaded) {
    initSync({ module: wasm });
    loaded = true;
  }
  return new Kasane();
}
