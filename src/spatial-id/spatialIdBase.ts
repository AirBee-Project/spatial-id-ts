import type { Coordinate } from "../geometry/coordinate.js";
import { Interval } from "../time/interval.js";
import type { FlexId } from "./flexId.js";
import type { RangeId } from "./rangeId.js";
import type { SingleId } from "./singleId.js";
import type { SpatialId } from "./spatialId.js";

// サブクラスの値を import すると、`extends` の評価時に循環 import で未初期化になるため、型だけを参照する。

/**
 * {@link SingleId}、{@link RangeId}、{@link FlexId} に共通する操作。
 *
 * 公開する型は閉じた union の {@link SpatialId} とし、このクラスは実装の共有にだけ使う。
 * @internal
 */
export abstract class SpatialIdBase implements Iterable<FlexId> {
  /** {@link RangeId} への変換。 */
  public abstract toRangeId(): RangeId;

  /**
   * 同じ型で、すべての値が等しいかを判定する。
   *
   * 参照比較ではなく値で比べる。`Map` のキーや `Set` の要素として使うときは、
   * 値が等しければ同じ文字列になる {@link SpatialIdBase.toString} の結果を使う。
   */
  public abstract equals(other: SpatialId): boolean;

  /** 文字列表現を返す。 */
  public abstract toString(): string;

  /** {@link FlexId} のイテレータとして展開する。 */
  public abstract [Symbol.iterator](): Generator<FlexId>;

  /** この ID を構成する {@link SingleId} のイテレータを返す。 */
  public abstract singleIds(): Generator<SingleId>;

  /** 時間を含まない、空間3次元（F/X/Y）の中心座標を返す。 */
  public abstract spatialCenter(): Coordinate;

  /**
   * 時間を含まない、空間3次元（F/X/Y）の直方体を構成する8頂点の座標を返す。
   *
   * 現実空間のボクセルは緯度や高度によって歪むため、完全な直方体ではない。
   */
  public abstract spatialVertices(): readonly [
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
  ];

  /** この ID が占める絶対秒区間 `[start, end)`（Unix 時刻）を返す。 */
  public abstract timeRange(): readonly [number, number];

  /** 時間の指定を外し、全時間に戻した自身を返す。 */
  public abstract timeCleared(): SpatialId;

  /** 全時間を指しているかを判定する。 */
  public timeIsWhole(): boolean {
    const [start, end] = this.timeRange();
    return start === 0 && end === Interval.MAX_SECONDS;
  }

  /** 指定された Unix 時刻（秒）を時間区間に含むかを判定する。 */
  public timeContains(unixSeconds: number): boolean {
    const [start, end] = this.timeRange();
    return start <= unixSeconds && unixSeconds < end;
  }

  /**
   * 整数文字列（例: "123", "-45"）を安全にパースする。
   * 小数点、指数表記、空文字、非数字が含まれる場合は null を返す。
   */
  protected static parseInteger(text: string): number | null {
    if (!/^-?\d+$/.test(text)) {
      return null;
    }
    const val = Number(text);
    return Number.isSafeInteger(val) ? val : null;
  }
}
