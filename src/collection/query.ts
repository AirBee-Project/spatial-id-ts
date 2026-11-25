import type { FlexId } from "../spatial-id/flexId.js";
import type { RangeId } from "../spatial-id/rangeId.js";
import type { SpatialId } from "../spatial-id/spatialId.js";
import { SpatialIdBase } from "../spatial-id/spatialIdBase.js";
import {
  decodeEntries,
  decodeFlexIds,
  decodeIds,
  encodeId,
  loadWasm,
  RawQuery,
} from "./raw.js";
import { SpatialIdMap } from "./spatialIdMap.js";
import { SpatialIdSet } from "./spatialIdSet.js";

/**
 * 同じ場所に複数の値が重なったときに、1つにまとめる規則。
 *
 * - `overwrite`: 後から来た値を採る
 * - `keepExisting`: 先にあった値を採る
 * - `sum`: 和を採る
 * - `max`: 大きい方を採る
 * - `min`: 小さい方を採る
 * - `average`: 平均を採る。整数で割り、端数は切り捨てる
 * - `saturatingSub`: 先にあった値から後から来た値を引く。0 を下回るときは 0 にする
 *
 * `overwrite` と `keepExisting` のほかは、値が数値の {@link Query} でだけ使える。
 */
export type MergePolicy =
  | "overwrite"
  | "keepExisting"
  | "sum"
  | "max"
  | "min"
  | "average"
  | "saturatingSub";

/**
 * 減衰で、距離 `d` に応じて値を減らす割合。半径を `r` とする。
 *
 * - `linear`: `(r - d) / r`。距離に比例して減る
 * - `quadraticIn`: `1 - (d / r)²`。近くではゆっくり、遠くで急に減る
 * - `quadraticOut`: `((r - d) / r)²`。近くで急に、遠くではゆっくり減る
 */
export type FalloffPattern = "linear" | "quadraticIn" | "quadraticOut";

/**
 * 値が数値なら {@link MergePolicy} のすべて、そうでなければ値の型を問わない規則だけを受け付ける。
 *
 * @inline
 */
type PolicyFor<V> = [V] extends [number]
  ? MergePolicy
  : "overwrite" | "keepExisting";

/**
 * 評価する範囲。1つの ID か、ID の並び。省くと全体を評価する。
 *
 * @inline
 */
type Targets = SpatialId | Iterable<SpatialId> | undefined;

const POLICY: Readonly<Record<MergePolicy, number>> = {
  overwrite: 0,
  keepExisting: 1,
  sum: 2,
  max: 3,
  min: 4,
  average: 5,
  saturatingSub: 6,
};

const PATTERN: Readonly<Record<FalloffPattern, number>> = {
  linear: 0,
  quadraticIn: 1,
  quadraticOut: 2,
};

// Wasm の Query が受け取る番号
const AXIS = { f: 0, x: 1, y: 2 } as const;
const TRANSFORM = { filter: 0, map: 1, filterMap: 2 } as const;

type Axis = (typeof AXIS)[keyof typeof AXIS];

/** Wasm の Query に、自身の入力と演算を後置記法で積む。 */
type Emit = (raw: RawQuery) => void;

/**
 * 二項演算の相手。{@link Query} か、そのまま {@link Query} の入力にできるコレクション。
 *
 * @inline
 */
type Source<V> = Query<V> | SpatialIdMap<V>;

function emitOf(source: Source<unknown> | SpatialIdSet): Emit {
  // biome-ignore lint/complexity/useLiteralKeys: private は要素アクセスでしか読めない
  return (source instanceof Query ? source : source.query())["emit"];
}

function encodeTargets(targets: Targets): Float64Array | undefined {
  if (targets === undefined) return undefined;
  // RangeId などの ID 自身も FlexId の Iterable なので、ID かどうかを先に見る
  const ids = targets instanceof SpatialIdBase ? [targets] : [...targets];
  const out = new Float64Array(ids.length * 10);
  ids.forEach((id, n) => {
    out.set(encodeId(id), n * 10);
  });
  return out;
}

/**
 * {@link SpatialIdSet} や {@link SpatialIdMap} を入力に、演算を組み合わせて変換するクエリ。
 *
 * {@link SpatialIdSet.query} か {@link SpatialIdMap.query} で作り、演算のメソッドをつなげて組み立てる。
 * 演算のメソッドは新しい {@link Query} を返し、元の {@link Query} は変わらない。
 * {@link Query.get} や {@link Query.toMap} を呼んだときに評価し、入力のコレクションはその時点の中身を使う。
 *
 * ```ts
 * const risk = obstacles
 *   .query()
 *   .falloffX(20, 5, "max")
 *   .merge(weather.query(), "sum")
 *   .toMap();
 * ```
 *
 * 数値の演算（{@link Query.falloffX} など）と、数値の規則（`sum` など）は、値が安全な整数（`Number.isSafeInteger`）の
 * ときだけ使える。評価の途中でそうでない値に出会うと、`TypeError` を投げる。
 * 結果が安全な整数の範囲を超えたときは、`RangeError` を投げる。
 *
 * @typeParam V 値の型。{@link SpatialIdSet} から作ったときは `undefined`
 */
export class Query<V> {
  private readonly emit: Emit;

  /** @internal */
  constructor(emit: Emit) {
    this.emit = emit;
  }

  private chain<U>(op: (raw: RawQuery) => void): Query<U> {
    return new Query((raw) => {
      this.emit(raw);
      op(raw);
    });
  }

  private binary<U>(other: Emit, op: (raw: RawQuery) => void): Query<U> {
    return new Query((raw) => {
      this.emit(raw);
      other(raw);
      op(raw);
    });
  }

  /** ズームレベル `z` のインデックスで、F・X・Y 方向へそれぞれ `f`・`x`・`y` 個分だけ平行移動する。 */
  public shiftFxy(z: number, f: number, x: number, y: number): Query<V> {
    return this.chain((raw) => raw.shift(z, f, x, y));
  }

  /** ズームレベル `z` のインデックスで、F 方向へ `index` 個分だけ平行移動する。 */
  public shiftF(z: number, index: number): Query<V> {
    return this.shiftFxy(z, index, 0, 0);
  }

  /** ズームレベル `z` のインデックスで、X 方向へ `index` 個分だけ平行移動する。 */
  public shiftX(z: number, index: number): Query<V> {
    return this.shiftFxy(z, 0, index, 0);
  }

  /** ズームレベル `z` のインデックスで、Y 方向へ `index` 個分だけ平行移動する。 */
  public shiftY(z: number, index: number): Query<V> {
    return this.shiftFxy(z, 0, 0, index);
  }

  /**
   * ズームレベル `z` まで粗くし、同じ ID にまとまる値を `policy` で1つにする。
   *
   * 値が数値でなければ、`policy` には `overwrite` か `keepExisting` だけを渡せる。
   */
  public zoomOut(z: number, policy: PolicyFor<V>): Query<V> {
    return this.chain((raw) => raw.zoomOut(z, POLICY[policy]));
  }

  private extrude(
    axis: Axis,
    z: number,
    start: number,
    end: number,
    policy: MergePolicy,
  ): Query<V> {
    return this.chain((raw) =>
      raw.extrude(axis, z, start, end, POLICY[policy]),
    );
  }

  /**
   * ズームレベル `z` の F の範囲 `[start, end]` へ引き延ばし、重なる値を `policy` で1つにする。
   *
   * 値が数値でなければ、`policy` には `overwrite` か `keepExisting` だけを渡せる。
   */
  public extrudeF(
    z: number,
    start: number,
    end: number,
    policy: PolicyFor<V>,
  ): Query<V> {
    return this.extrude(AXIS.f, z, start, end, policy);
  }

  /** {@link Query.extrudeF} と同じだが、X 方向へ引き延ばす。 */
  public extrudeX(
    z: number,
    start: number,
    end: number,
    policy: PolicyFor<V>,
  ): Query<V> {
    return this.extrude(AXIS.x, z, start, end, policy);
  }

  /** {@link Query.extrudeF} と同じだが、Y 方向へ引き延ばす。 */
  public extrudeY(
    z: number,
    start: number,
    end: number,
    policy: PolicyFor<V>,
  ): Query<V> {
    return this.extrude(AXIS.y, z, start, end, policy);
  }

  private falloff(
    axis: Axis,
    z: number,
    radius: number,
    policy: MergePolicy,
    options: FalloffOptions | undefined,
  ): Query<number> {
    const direction =
      options?.direction === undefined
        ? undefined
        : options.direction === "upper"
          ? 1
          : 0;
    const pattern = PATTERN[options?.pattern ?? "linear"];
    return this.chain((raw) =>
      raw.falloff(axis, z, radius, direction, pattern, POLICY[policy]),
    );
  }

  /**
   * ズームレベル `z` のインデックスで、F 方向へ値を減らしながら `radius` 個分だけ広げる。広げた値は距離 `radius` で 0 になる。
   * 重なる値は `policy` で1つにする。
   *
   * `options.pattern` で減らし方を選ぶ（既定は `linear`）。
   * `options.direction` に `upper`（座標の大きい側）か `lower`（小さい側）を渡すと、その側にだけ広げる。省くと両側に広げる。
   */
  public falloffF(
    this: Query<number>,
    z: number,
    radius: number,
    policy: MergePolicy,
    options?: FalloffOptions,
  ): Query<number> {
    return this.falloff(AXIS.f, z, radius, policy, options);
  }

  /** {@link Query.falloffF} と同じだが、X 方向へ広げる。 */
  public falloffX(
    this: Query<number>,
    z: number,
    radius: number,
    policy: MergePolicy,
    options?: FalloffOptions,
  ): Query<number> {
    return this.falloff(AXIS.x, z, radius, policy, options);
  }

  /** {@link Query.falloffF} と同じだが、Y 方向へ広げる。 */
  public falloffY(
    this: Query<number>,
    z: number,
    radius: number,
    policy: MergePolicy,
    options?: FalloffOptions,
  ): Query<number> {
    return this.falloff(AXIS.y, z, radius, policy, options);
  }

  /** 値が `value` と等しい要素だけを残す。 */
  public filterEq(this: Query<number>, value: number): Query<number> {
    return this.chain((raw) => raw.filterNumbers(0, value));
  }

  /** 値が `[start, end)` に入る要素だけを残す。`start` か `end` を省くと、その側に端を設けない。 */
  public filterIn(
    this: Query<number>,
    range: { start?: number; end?: number },
  ): Query<number> {
    return this.chain((raw) => raw.filterNumbers(1, range.start, range.end));
  }

  /** 値が `[start, end)` に入る要素を取り除く。`start` か `end` を省くと、その側に端を設けない。 */
  public filterNotIn(
    this: Query<number>,
    range: { start?: number; end?: number },
  ): Query<number> {
    return this.chain((raw) => raw.filterNumbers(2, range.start, range.end));
  }

  private transform<U>(
    kind: number,
    f: (id: FlexId, value: V) => unknown,
  ): Query<U> {
    return this.chain((raw) =>
      raw.transform(kind, true, (id: Float64Array, value: V) =>
        f(decodeFlexIds(id)[0] as FlexId, value),
      ),
    );
  }

  /**
   * 各要素の {@link FlexId} と値を `f` に渡し、`true` を返した要素だけを残す。
   *
   * `f` に渡る {@link FlexId} は、同じ値を持つ領域の断片である。切れ方は中身や評価する範囲によって変わるので、
   * `f` の結果が切れ方に左右されないようにする。値だけを見るなら {@link Query.filterValues} を使う。
   */
  public filter(f: (id: FlexId, value: V) => boolean): Query<V> {
    return this.transform(TRANSFORM.filter, f);
  }

  /** 各要素の {@link FlexId} と値を `f` で写す。{@link FlexId} の扱いは {@link Query.filter} と同じ。 */
  public map<U>(f: (id: FlexId, value: V) => U): Query<U> {
    return this.transform(TRANSFORM.map, f);
  }

  /**
   * 各要素の {@link FlexId} と値を `f` で写し、`undefined` を返した要素を取り除く。
   * {@link FlexId} の扱いは {@link Query.filter} と同じ。
   */
  public filterMap<U>(f: (id: FlexId, value: V) => U | undefined): Query<U> {
    return this.transform(TRANSFORM.filterMap, f);
  }

  /** 各値を `f` に渡し、`true` を返した要素だけを残す。 */
  public filterValues(f: (value: V) => boolean): Query<V> {
    return this.chain((raw) => raw.transform(TRANSFORM.filter, false, f));
  }

  /** 各値を `f` で写す。 */
  public mapValues<U>(f: (value: V) => U): Query<U> {
    return this.chain((raw) => raw.transform(TRANSFORM.map, false, f));
  }

  /** 各値を `f` で写し、`undefined` を返した要素を取り除く。 */
  public filterMapValues<U>(f: (value: V) => U | undefined): Query<U> {
    return this.chain((raw) => raw.transform(TRANSFORM.filterMap, false, f));
  }

  /**
   * `other` と重ね合わせ、重なる部分の値を `policy` で1つにする。片側にしかない部分はそのまま残す。
   *
   * 値が数値でなければ、`policy` には `overwrite` か `keepExisting` だけを渡せる。
   */
  public merge(other: Source<V>, policy: PolicyFor<V>): Query<V> {
    return this.binary(emitOf(other), (raw) => raw.merge(POLICY[policy]));
  }

  /** `other` と重なる部分だけを、このクエリの値で残す。`other` の値の型は問わない。 */
  public intersection(other: Source<unknown> | SpatialIdSet): Query<V> {
    return this.binary(emitOf(other), (raw) => raw.binary(0));
  }

  /** `other` と重なる部分を取り除く。`other` の値の型は問わない。 */
  public difference(other: Source<unknown> | SpatialIdSet): Query<V> {
    return this.binary(emitOf(other), (raw) => raw.binary(1));
  }

  /** Wasm の Query を作って演算を積む。積む途中で失敗したら、作った Query を解放してから投げる。 */
  private build(): RawQuery {
    loadWasm();
    const raw = new RawQuery();
    try {
      this.emit(raw);
    } catch (e) {
      raw.free();
      throw e;
    }
    return raw;
  }

  /** 演算のパラメーターがすべて正しいかを確かめる。正しくなければ例外を投げる。 */
  public validate(): void {
    this.build().validate();
  }

  /** 評価し、`targets` の中にある部分を値と組にして返す。`targets` を省くと全体を返す。 */
  public get(targets?: SpatialId | Iterable<SpatialId>): [RangeId, V][] {
    return decodeEntries(
      this.build().get(encodeTargets(targets), false, false),
      decodeIds,
    );
  }

  /** {@link Query.get} と同じだが、{@link FlexId} の単位で返す。 */
  public getFlexIds(targets?: SpatialId | Iterable<SpatialId>): [FlexId, V][] {
    return decodeEntries(
      this.build().get(encodeTargets(targets), false, true),
      decodeFlexIds,
    );
  }

  /**
   * {@link Query.get} と同じく評価するが、返す要素を `targets` で切り取らない。
   * `targets` からはみ出した、より大きな ID が返ることがある。
   */
  public getOverlapping(
    targets?: SpatialId | Iterable<SpatialId>,
  ): [RangeId, V][] {
    return decodeEntries(
      this.build().get(encodeTargets(targets), true, false),
      decodeIds,
    );
  }

  /** {@link Query.getOverlapping} と同じだが、{@link FlexId} の単位で返す。 */
  public getOverlappingFlexIds(
    targets?: SpatialId | Iterable<SpatialId>,
  ): [FlexId, V][] {
    return decodeEntries(
      this.build().get(encodeTargets(targets), true, true),
      decodeFlexIds,
    );
  }

  /** 全体を評価し、結果を {@link SpatialIdMap} にして返す。 */
  public toMap(): SpatialIdMap<V> {
    // biome-ignore lint/complexity/useLiteralKeys: private は要素アクセスでしか読めない
    return SpatialIdMap["wrap"](this.build().toMap());
  }

  /** 全体を評価し、結果を値を持たない {@link SpatialIdSet} にして返す。 */
  public toSet(): SpatialIdSet {
    // biome-ignore lint/complexity/useLiteralKeys: private は要素アクセスでしか読めない
    return SpatialIdSet["wrap"](this.build().toSet());
  }
}

/**
 * 減衰の演算のオプション。
 *
 * @inline
 */
interface FalloffOptions {
  /** 値の減らし方。既定は `linear`。 */
  pattern?: FalloffPattern;
  /** 広げる向き。`upper` は座標の大きい側、`lower` は小さい側。省くと両側に広げる。 */
  direction?: "upper" | "lower";
}
