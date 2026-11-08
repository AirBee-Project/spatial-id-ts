import type { FlexId } from "../spatial-id/flexId.js";
import type { RangeId } from "../spatial-id/rangeId.js";
import type { SingleId } from "../spatial-id/singleId.js";
import type { SpatialId } from "../spatial-id/spatialId.js";
import type { AllowedIntervals } from "../time/allowedIntervals.js";
import {
  decodeEntries,
  decodeFlexIds,
  decodeIds,
  decodeSingleIds,
  encodeId,
  encodeIntervals,
  loadWasm,
  RawMap,
  RawOwner,
} from "./raw.js";

/**
 * 時空間 ID の場所ごとに値を持つマップ。
 *
 * 値にはどの JS の値も入れられる。値は `===` で比べ、同じ値を持つ隣り合った場所は1つにまとめて持つ。
 * オブジェクトは参照で比べ、取り出すときも同じ参照を返す。`NaN` は自身と等しくないので、`NaN` 同士はまとまらない。
 */
export class SpatialIdMap<V> implements Iterable<[RangeId, V]>, Disposable {
  private owner: RawOwner<RawMap>;

  /** 空のマップを作る。`entries` を渡すと、先頭から順に挿入したマップを作る。 */
  constructor(entries?: Iterable<readonly [SpatialId, V]>) {
    loadWasm();
    this.owner = new RawOwner(new RawMap());
    if (entries !== undefined) {
      for (const [id, value] of entries) this.insert(id, value);
    }
  }

  // geometry と spatial-id の型は `create` で作り、コンストラクターを公開していない。
  // それにそろえて `create` を用意しつつ、JS の Map と同じ `new` でも作れるようコンストラクターも公開している。
  /** {@link SpatialIdMap} を作る。`new SpatialIdMap(entries)` と同じ。 */
  public static create<V>(
    entries?: Iterable<readonly [SpatialId, V]>,
  ): SpatialIdMap<V> {
    return new SpatialIdMap(entries);
  }

  private static wrap<V>(raw: RawMap): SpatialIdMap<V> {
    // コンストラクターを通すと空の RawMap を余分に作るので、通さずに作る
    const wrapped: SpatialIdMap<V> = Object.create(SpatialIdMap.prototype);
    wrapped.owner = new RawOwner(raw);
    return wrapped;
  }

  /** `id` が占める場所に `value` を入れる。すでに値がある場所は上書きする。 */
  public insert(id: SpatialId, value: V): void {
    this.owner.raw.insert(encodeId(id), value);
  }

  /** `id` と重なる部分を `id` で切り取り、値と組にして返す。 */
  public get(id: SpatialId): [RangeId, V][] {
    return decodeEntries(this.owner.raw.get(encodeId(id)), decodeIds);
  }

  /** `id` と重なる部分を取り除き、取り除いた部分を値と組にして返す。 */
  public remove(id: SpatialId): [RangeId, V][] {
    return decodeEntries(this.owner.raw.remove(encodeId(id)), decodeIds);
  }

  /** {@link SpatialIdMap.get} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public getFlexIds(id: SpatialId): [FlexId, V][] {
    return decodeEntries(
      this.owner.raw.getFlexIds(encodeId(id)),
      decodeFlexIds,
    );
  }

  /** {@link SpatialIdMap.remove} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public removeFlexIds(id: SpatialId): [FlexId, V][] {
    return decodeEntries(
      this.owner.raw.removeFlexIds(encodeId(id)),
      decodeFlexIds,
    );
  }

  /** {@link SpatialIdMap.get} と異なり切り取らず、`id` と重なる ID をそのまま値と組にして返す。 */
  public getOverlapping(id: SpatialId): [RangeId, V][] {
    return decodeEntries(
      this.owner.raw.getOverlapping(encodeId(id)),
      decodeIds,
    );
  }

  /** {@link SpatialIdMap.getOverlapping} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public getOverlappingFlexIds(id: SpatialId): [FlexId, V][] {
    return decodeEntries(
      this.owner.raw.getOverlappingFlexIds(encodeId(id)),
      decodeFlexIds,
    );
  }

  /** {@link SpatialIdMap.remove} と異なり切り取らず、`id` と重なる ID をそのまま取り除き、値と組にして返す。 */
  public removeOverlapping(id: SpatialId): [RangeId, V][] {
    return decodeEntries(
      this.owner.raw.removeOverlapping(encodeId(id)),
      decodeIds,
    );
  }

  /** {@link SpatialIdMap.removeOverlapping} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public removeOverlappingFlexIds(id: SpatialId): [FlexId, V][] {
    return decodeEntries(
      this.owner.raw.removeOverlappingFlexIds(encodeId(id)),
      decodeFlexIds,
    );
  }

  /** `id` と面で接している ID を、重複なく値と組にして返す。`id` 自身と重なる ID は除く。 */
  public spatialFaceNeighbors(id: SpatialId): [RangeId, V][] {
    return decodeEntries(
      this.owner.raw.spatialFaceNeighbors(encodeId(id)),
      decodeIds,
    );
  }

  /** {@link SpatialIdMap.spatialFaceNeighbors} と同じだが、内部で持つ {@link FlexId} の単位で返す。 */
  public spatialFaceNeighborsFlexIds(id: SpatialId): [FlexId, V][] {
    return decodeEntries(
      this.owner.raw.spatialFaceNeighborsFlexIds(encodeId(id)),
      decodeFlexIds,
    );
  }

  /**
   * 時間方向に隣り合う同じ値の ID をつなげた {@link RangeId} を、値と組にして返す。空間の解像度は変えない。
   *
   * `allowedIntervals` を省くと、各区間はそれを表せる最も粗い単位（`gcd(開始秒, 幅)`）の1Segmentになる。
   * {@link time!AllowedIntervals} を渡すと、その候補のうち区間を割り切る最も粗い単位で表す。
   */
  public reconstructedTimeRanges(
    allowedIntervals?: AllowedIntervals,
  ): [RangeId, V][] {
    return decodeEntries(
      this.owner.raw.reconstructedTimeRanges(encodeIntervals(allowedIntervals)),
      decodeIds,
    );
  }

  /** {@link SpatialIdMap.reconstructedTimeRanges} を、マップ全体の最大ズームレベルにそろえた {@link SingleId} に展開して返す。 */
  public flatSingleIds(allowedIntervals?: AllowedIntervals): [SingleId, V][] {
    return decodeEntries(
      this.owner.raw.flatSingleIds(encodeIntervals(allowedIntervals)),
      decodeSingleIds,
    );
  }

  /** 和を新しく作る。両方に値がある場所は、このマップの値を使う。 */
  public union<W>(other: SpatialIdMap<W>): SpatialIdMap<V | W> {
    return SpatialIdMap.wrap(this.owner.raw.union(other.owner.raw));
  }

  /** `other` にも値がある場所だけを残し、このマップの値を使ったマップを新しく作る。 */
  public intersection(other: SpatialIdMap<unknown>): SpatialIdMap<V> {
    return SpatialIdMap.wrap(this.owner.raw.intersection(other.owner.raw));
  }

  /** `other` に値がある場所を取り除いたマップを新しく作る。 */
  public difference(other: SpatialIdMap<unknown>): SpatialIdMap<V> {
    return SpatialIdMap.wrap(this.owner.raw.difference(other.owner.raw));
  }

  /**
   * `for...of` で取り出せる組の数。
   *
   * 内部では同じ値を持つ隣り合った場所をまとめて持つので、挿入した回数とは一致しない。
   */
  public count(): number {
    return this.owner.raw.count();
  }

  /** 空かどうかを判定する。 */
  public isEmpty(): boolean {
    return this.owner.raw.isEmpty();
  }

  /** すべての値を取り除く。 */
  public clear(): void {
    this.owner.raw.clear();
  }

  /** マップの中身を {@link RangeId} と値の組で返す。最初の組を取り出した時点の中身を返す。 */
  public *[Symbol.iterator](): Generator<[RangeId, V]> {
    yield* decodeEntries<RangeId, V>(this.owner.raw.entries(), decodeIds);
  }

  /** `for...of` と同じだが、内部で持つ {@link FlexId} と値の組をそのまま返す。 */
  public *iterFlexIds(): Generator<[FlexId, V]> {
    yield* decodeEntries<FlexId, V>(
      this.owner.raw.flexEntries(),
      decodeFlexIds,
    );
  }

  /**
   * Wasm のメモリをすぐに解放する。呼ばなくても、GC で回収されたときに解放される。
   *
   * `using` で宣言すると、スコープを抜けたときに自動で呼ばれる。
   *
   * ```ts
   * {
   *   using map = SpatialIdMap.create(entries);
   *   console.log(map.count());
   * } // ここで解放される
   * ```
   *
   * `using` を使えないときは、`map[Symbol.dispose]()` で直接呼ぶ。
   * 解放したあとにほかのメソッドを呼んだり、演算に渡したりすると例外を投げる。2回目以降の呼び出しは何もしない。
   */
  public [Symbol.dispose](): void {
    this.owner.dispose();
  }
}
