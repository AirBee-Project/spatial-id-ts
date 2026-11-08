import type { FlexId } from "../spatial-id/flexId.js";
import type { RangeId } from "../spatial-id/rangeId.js";
import type { SingleId } from "../spatial-id/singleId.js";
import type { SpatialId } from "../spatial-id/spatialId.js";
import type { AllowedIntervals } from "../time/allowedIntervals.js";
import {
  decodeFlexIds,
  decodeIds,
  decodeSingleIds,
  encodeId,
  encodeIntervals,
  loadWasm,
  RawOwner,
  RawSet,
} from "./raw.js";
import type { SpatialIdMap } from "./spatialIdMap.js";

/**
 * 時空間 ID の集合。
 *
 * 重なる ID を挿入しても、同じ場所を二重には持たない。
 */
export class SpatialIdSet implements Iterable<RangeId>, Disposable {
  private owner: RawOwner<RawSet>;

  /** 空の集合を作る。`ids` を渡すと、それらを挿入した集合を作る。 */
  constructor(ids?: Iterable<SpatialId>) {
    loadWasm();
    this.owner = new RawOwner(new RawSet());
    if (ids !== undefined) {
      for (const id of ids) this.insert(id);
    }
  }

  // geometry と spatial-id の型は `create` で作り、コンストラクターを公開していない。
  // それにそろえて `create` を用意しつつ、JS の Set と同じ `new` でも作れるようコンストラクターも公開している。
  /** {@link SpatialIdSet} を作る。`new SpatialIdSet(ids)` と同じ。 */
  public static create(ids?: Iterable<SpatialId>): SpatialIdSet {
    return new SpatialIdSet(ids);
  }

  /** `map` の値を捨て、値がある場所だけを持つ集合を作る。`map` は変わらない。 */
  public static from(map: SpatialIdMap<unknown>): SpatialIdSet {
    // 公開型に RawMap を出すと、dist にない Wasm の型定義を .d.ts が参照してしまうので、private のまま読む
    // biome-ignore lint/complexity/useLiteralKeys: private は要素アクセスでしか読めない
    return SpatialIdSet.wrap(RawSet.fromMap(map["owner"].raw));
  }

  private static wrap(raw: RawSet): SpatialIdSet {
    // コンストラクターを通すと空の RawSet を余分に作るので、通さずに作る
    const wrapped: SpatialIdSet = Object.create(SpatialIdSet.prototype);
    wrapped.owner = new RawOwner(raw);
    return wrapped;
  }

  /** `id` が占める場所を集合に加える。 */
  public insert(id: SpatialId): void {
    this.owner.raw.insert(encodeId(id));
  }

  /** 集合のうち `id` と重なる部分を、`id` で切り取って返す。 */
  public get(id: SpatialId): RangeId[] {
    return decodeIds(this.owner.raw.get(encodeId(id)));
  }

  /** 集合から `id` と重なる部分を取り除き、取り除いた部分を返す。 */
  public remove(id: SpatialId): RangeId[] {
    return decodeIds(this.owner.raw.remove(encodeId(id)));
  }

  /** {@link SpatialIdSet.get} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public getFlexIds(id: SpatialId): FlexId[] {
    return decodeFlexIds(this.owner.raw.getFlexIds(encodeId(id)));
  }

  /** {@link SpatialIdSet.remove} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public removeFlexIds(id: SpatialId): FlexId[] {
    return decodeFlexIds(this.owner.raw.removeFlexIds(encodeId(id)));
  }

  /** {@link SpatialIdSet.get} と異なり切り取らず、`id` と重なる ID をそのまま返す。 */
  public getOverlapping(id: SpatialId): RangeId[] {
    return decodeIds(this.owner.raw.getOverlapping(encodeId(id)));
  }

  /** {@link SpatialIdSet.getOverlapping} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public getOverlappingFlexIds(id: SpatialId): FlexId[] {
    return decodeFlexIds(this.owner.raw.getOverlappingFlexIds(encodeId(id)));
  }

  /** {@link SpatialIdSet.remove} と異なり切り取らず、`id` と重なる ID をそのまま取り除いて返す。 */
  public removeOverlapping(id: SpatialId): RangeId[] {
    return decodeIds(this.owner.raw.removeOverlapping(encodeId(id)));
  }

  /** {@link SpatialIdSet.removeOverlapping} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public removeOverlappingFlexIds(id: SpatialId): FlexId[] {
    return decodeFlexIds(this.owner.raw.removeOverlappingFlexIds(encodeId(id)));
  }

  /** `id` と面で接している ID を重複なく返す。`id` 自身と重なる ID は除く。 */
  public spatialFaceNeighbors(id: SpatialId): RangeId[] {
    return decodeIds(this.owner.raw.spatialFaceNeighbors(encodeId(id)));
  }

  /** {@link SpatialIdSet.spatialFaceNeighbors} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public spatialFaceNeighborsFlexIds(id: SpatialId): FlexId[] {
    return decodeFlexIds(
      this.owner.raw.spatialFaceNeighborsFlexIds(encodeId(id)),
    );
  }

  /**
   * 時間方向に隣り合う ID をつなげた {@link RangeId} で返す。空間の解像度は変えない。
   *
   * `allowedIntervals` を省くと、各区間はそれを表せる最も粗い単位（`gcd(開始秒, 幅)`）の1Segmentになる。
   * {@link time!AllowedIntervals} を渡すと、その候補のうち区間を割り切る最も粗い単位で表す。
   *
   * ```ts
   * const id = SingleId.create(12, 0, 3638, 1614);
   * const set = new SpatialIdSet([id.timeWith(Interval.HOUR, 0), id.timeWith(Interval.HOUR, 1)]);
   * set.reconstructedTimeRanges().map(String); // ["12/0/3638/1614_7200/0"]
   * set.reconstructedTimeRanges(AllowedIntervals.calendar()).map(String); // ["12/0/3638/1614_3600/0:1"]
   * ```
   */
  public reconstructedTimeRanges(
    allowedIntervals?: AllowedIntervals,
  ): RangeId[] {
    return decodeIds(
      this.owner.raw.reconstructedTimeRanges(encodeIntervals(allowedIntervals)),
    );
  }

  /** {@link SpatialIdSet.reconstructedTimeRanges} を、集合全体の最大ズームレベルにそろえた {@link SingleId} に展開して返す。 */
  public flatSingleIds(allowedIntervals?: AllowedIntervals): SingleId[] {
    return decodeSingleIds(
      this.owner.raw.flatSingleIds(encodeIntervals(allowedIntervals)),
    );
  }

  /** 和集合を新しく作る。 */
  public union(other: SpatialIdSet): SpatialIdSet {
    return SpatialIdSet.wrap(this.owner.raw.union(other.owner.raw));
  }

  /** 積集合を新しく作る。 */
  public intersection(other: SpatialIdSet): SpatialIdSet {
    return SpatialIdSet.wrap(this.owner.raw.intersection(other.owner.raw));
  }

  /** `other` と重なる場所を取り除いた差集合を新しく作る。 */
  public difference(other: SpatialIdSet): SpatialIdSet {
    return SpatialIdSet.wrap(this.owner.raw.difference(other.owner.raw));
  }

  /**
   * `for...of` で取り出せる ID の数。
   *
   * 内部では重なりや隣り合う ID をまとめて持つので、挿入した回数とは一致しない。
   */
  public count(): number {
    return this.owner.raw.count();
  }

  /** 空かどうかを判定する。 */
  public isEmpty(): boolean {
    return this.owner.raw.isEmpty();
  }

  /** すべての ID を取り除く。 */
  public clear(): void {
    this.owner.raw.clear();
  }

  /** 集合の中身を {@link RangeId} で返す。最初の要素を取り出した時点の中身を返す。 */
  public *[Symbol.iterator](): Generator<RangeId> {
    yield* decodeIds(this.owner.raw.ids());
  }

  /** `for...of` と同じだが、内部で持つ {@link FlexId} をそのまま返す。 */
  public *iterFlexIds(): Generator<FlexId> {
    yield* decodeFlexIds(this.owner.raw.flexIds());
  }

  /**
   * Wasm のメモリをすぐに解放する。呼ばなくても、GC で回収されたときに解放される。
   *
   * `using` で宣言すると、スコープを抜けたときに自動で呼ばれる。
   *
   * ```ts
   * {
   *   using set = SpatialIdSet.create(ids);
   *   console.log(set.count());
   * } // ここで解放される
   * ```
   *
   * `using` を使えないときは、`set[Symbol.dispose]()` で直接呼ぶ。
   * 解放したあとにほかのメソッドを呼んだり、演算に渡したりすると例外を投げる。2回目以降の呼び出しは何もしない。
   */
  public [Symbol.dispose](): void {
    this.owner.dispose();
  }
}
