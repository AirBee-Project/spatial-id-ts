import { decodeBase64 } from "../internal/base64.js";
import { FlexId } from "../spatial-id/flexId.js";
import { RangeId } from "../spatial-id/rangeId.js";
import { SingleId } from "../spatial-id/singleId.js";
import type { SpatialId } from "../spatial-id/spatialId.js";
import { TZoomLevel, ZoomLevel } from "../spatial-id/zoomLevel.js";
import type { AllowedIntervals } from "../time/allowedIntervals.js";
import { Interval } from "../time/interval.js";
import { initSync } from "./wasm/gen/spatial_id.js";
import wasm from "./wasm/gen/spatial_id_bg.base64.js";

export {
  SpatialIdMap as RawMap,
  SpatialIdSet as RawSet,
} from "./wasm/gen/spatial_id.js";

let loaded = false;

/**
 * Wasm を読み込む（初回だけ）。
 *
 * コンストラクターを同期で呼べるよう、埋め込んだバイト列から同期でコンパイルする。
 */
export function loadWasm(): void {
  if (loaded) return;
  initSync({ module: decodeBase64(wasm) });
  loaded = true;
}

/** Wasm の値を持ち、その解放を受け持つ。 */
export class RawOwner<R extends { free(): void }> {
  private current: R | undefined;

  constructor(raw: R) {
    this.current = raw;
  }

  /** 解放済みの値を Wasm に渡すと、受け取った側の借用が戻らずに使えなくなるので、渡す前に例外を投げる。 */
  public get raw(): R {
    if (this.current === undefined) {
      throw new Error("the collection has already been disposed");
    }
    return this.current;
  }

  public dispose(): void {
    const raw = this.current;
    this.current = undefined;
    raw?.free();
  }
}

/**
 * Wasm とやりとりする数値列を、1つの ID が占める要素数ごとに区切って `decode` で直す。
 *
 * - {@link RangeId}: `[z, f0, f1, x0, x1, y0, y1, i, t0, t1]`
 * - {@link FlexId}: `[fz, f, xz, x, yz, y, tz, t]`
 * - {@link SingleId}: `[z, f, x, y, i, t]`
 */
function decodeAll<T>(
  values: Float64Array,
  fields: number,
  decode: (at: (k: number) => number) => T,
): T[] {
  const ids = new Array<T>(values.length / fields);
  for (let n = 0; n < ids.length; n++) {
    ids[n] = decode((k) => values[n * fields + k] as number);
  }
  return ids;
}

export function encodeId(id: SpatialId): Float64Array {
  const r = id.toRangeId();
  return Float64Array.of(
    r.z,
    r.f[0],
    r.f[1],
    r.x[0],
    r.x[1],
    r.y[0],
    r.y[1],
    r.i.seconds(),
    r.t[0],
    r.t[1],
  );
}

export function decodeIds(values: Float64Array): RangeId[] {
  return decodeAll(values, 10, (at) =>
    RangeId.createUncheckedWithTime(
      ZoomLevel.createUnchecked(at(0)),
      [at(1), at(2)],
      [at(3), at(4)],
      [at(5), at(6)],
      Interval.create(at(7)),
      [at(8), at(9)],
    ),
  );
}

export function decodeFlexIds(values: Float64Array): FlexId[] {
  return decodeAll(values, 8, (at) =>
    FlexId.createUncheckedWithTime(
      ZoomLevel.createUnchecked(at(0)),
      at(1),
      ZoomLevel.createUnchecked(at(2)),
      at(3),
      ZoomLevel.createUnchecked(at(4)),
      at(5),
      TZoomLevel.createUnchecked(at(6)),
      at(7),
    ),
  );
}

export function decodeSingleIds(values: Float64Array): SingleId[] {
  return decodeAll(values, 6, (at) =>
    SingleId.createUncheckedWithTime(
      ZoomLevel.createUnchecked(at(0)),
      at(1),
      at(2),
      at(3),
      Interval.create(at(4)),
      at(5),
    ),
  );
}

/** {@link AllowedIntervals} は候補の秒数の列で渡し、省略は `undefined` のまま渡す。 */
export function encodeIntervals(
  intervals: AllowedIntervals | undefined,
): Float64Array | undefined {
  return intervals && Float64Array.from(intervals, (i) => i.seconds());
}

/** Wasm が返す `[ID の数値列, 値の配列]` を、`decode` で直した ID と値の組にする。 */
export function decodeEntries<I, V>(
  [ids, values]: [Float64Array, unknown[]],
  decode: (values: Float64Array) => I[],
): [I, V][] {
  // Wasm は値の型を知らないので、挿入したときの `V` に戻す
  return decode(ids).map((id, n) => [id, values[n] as V]);
}
