import { RangeId } from "../spatial-id/rangeId.js";
import { ZoomLevel } from "../spatial-id/zoomLevel.js";
import { Interval } from "../time/interval.js";

const SCHEMA_URL = "https://airbee-project.github.io/schemas/json/v1.0.json";

/**
 * 単一の値 `[v]`、または範囲 `[start, end]`。
 *
 * @inline
 */
type Pair = [number] | [number, number];

/**
 * [時空間データスキーマ](https://airbee-project.github.io/schemas/json/v1.0.json) の JSON。
 *
 * `V` は `data[].value` の要素の型。
 */
export interface SpatialIdJson<V = unknown> {
  /** 準拠する JSON Schema の URL。 */
  $schema?: string;
  /** バージョン情報やデータの説明。 */
  meta: {
    /** スキーマのバージョン。 */
    version: string;
    /** データの説明。 */
    description?: string;
  };
  /** 利用者が自由に定義するメタデータ。 */
  option?: Record<string, unknown>;
  /** データ系列の配列。 */
  data: {
    /** データ系列の名前。 */
    name: string;
    /** 値の配列。各 ID は `ref` でこの添字を指す。値を持たない系列では省く。 */
    value?: V[];
    /** 時空間 ID の配列。`f`、`x`、`y` を省くと、その軸の全範囲を表す。 */
    ids: {
      /** ズームレベル。 */
      z: number;
      /** 高度方向のインデックス。 */
      f?: Pair;
      /** X 方向のインデックス。`start > end` のときは経度の周期境界をまたぐ。 */
      x?: Pair;
      /** Y 方向のインデックス。 */
      y?: Pair;
      /** 時間間隔の秒数。`t` と組で指定し、両方省くと全時間を表す。 */
      i?: number;
      /** 時間インデックス。 */
      t?: Pair;
      /** `value` の添字。 */
      ref?: number;
    }[];
  }[];
}

type Series<V> = SpatialIdJson<V>["data"][number];
type Entry = Series<unknown>["ids"][number];

function encodeRange([start, end]: readonly [number, number]): Pair {
  return start === end ? [start] : [start, end];
}

function decodeRange(
  value: unknown,
  key: string,
): [number, number] | number | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    if (value.length === 1 && typeof value[0] === "number") return value[0];
    if (
      value.length === 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      return [value[0], value[1]];
    }
  }
  throw new TypeError(`"${key}" must be an array of 1 or 2 numbers`);
}

export function encodeJsonEntry(id: RangeId, ref?: number): Entry {
  const json: Entry = {
    z: id.z,
    f: encodeRange(id.f),
    x: encodeRange(id.x),
    y: encodeRange(id.y),
  };
  if (!id.i.equals(Interval.WHOLE)) {
    json.i = id.i.seconds();
    json.t = encodeRange(id.t);
  }
  if (ref !== undefined) json.ref = ref;
  return json;
}

function decodeJsonEntry(json: unknown): RangeId {
  if (typeof json !== "object" || json === null) {
    throw new TypeError("a spatial id must be an object");
  }
  const { z, f, x, y, i, t } = json as Record<string, unknown>;
  if (typeof z !== "number") throw new TypeError('"z" must be a number');
  const zoom = ZoomLevel.create(z);
  const id = RangeId.create(
    z,
    decodeRange(f, "f") ?? [zoom.fMin(), zoom.fMax()],
    decodeRange(x, "x") ?? [0, zoom.xyMax()],
    decodeRange(y, "y") ?? [0, zoom.xyMax()],
  );
  const tPair = decodeRange(t, "t");
  if (i === undefined && tPair === undefined) return id;
  if (typeof i !== "number" || tPair === undefined) {
    throw new TypeError('"i" and "t" must both be present or both be absent');
  }
  return id.timeWith(i, tPair);
}

export function encodeJsonDocument<V>(data: Series<V>): SpatialIdJson<V> {
  return {
    $schema: SCHEMA_URL,
    meta: { version: "v1.0", description: "" },
    option: {},
    data: [data],
  };
}

/** コレクション1つ分として読むので、`data` はちょうど1件でなければならない。 */
function singleSeries(json: unknown): { value?: unknown; ids: unknown[] } {
  const data = (json as { data?: unknown } | null)?.data;
  if (!Array.isArray(data) || data.length !== 1) {
    throw new TypeError('"data" must be an array of exactly 1 entry');
  }
  const entry = data[0] as { value?: unknown; ids?: unknown } | null;
  if (!Array.isArray(entry?.ids)) {
    throw new TypeError('"data[0].ids" must be an array');
  }
  return { value: entry.value, ids: entry.ids };
}

export function decodeJsonSet(json: unknown): RangeId[] {
  return singleSeries(json).ids.map(decodeJsonEntry);
}

export function decodeJsonMap<V>(json: unknown): [RangeId, V][] {
  const { value, ids } = singleSeries(json);
  if (!Array.isArray(value)) {
    throw new TypeError('"data[0].value" must be an array');
  }
  return ids.map((id) => {
    const ref = (id as { ref?: unknown } | null)?.ref;
    if (typeof ref !== "number" || !Object.hasOwn(value, ref)) {
      throw new TypeError(`"ref" must be an index of "value", found ${ref}`);
    }
    return [decodeJsonEntry(id), value[ref] as V];
  });
}
