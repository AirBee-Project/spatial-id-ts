import { SpatialIdError } from "../spatial-id/error.js";
import { Interval } from "./interval.js";

/**
 * 絶対秒区間 `[start, end)`（Unix 時刻）。
 *
 * @internal
 */
export class TimeSpan {
  /** 始端（含む）。 */
  public readonly start: number;
  /** 終端（含まない）。 */
  public readonly end: number;

  private constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }

  /**
   * `start` と `end` が `0 <= start < end <= `{@link Interval.MAX_SECONDS} を満たす整数かを検証して作る。
   *
   * @throws {@link SpatialIdError} `TOutOfRange` 満たさないとき
   */
  public static create(start: number, end: number): TimeSpan {
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      start >= end ||
      end > Interval.MAX_SECONDS
    ) {
      throw new SpatialIdError({ kind: "TOutOfRange", i: 1, t: end });
    }
    return new TimeSpan(start, end);
  }

  /** 検証済みの値から {@link TimeSpan} を作る。 */
  public static createUnchecked(start: number, end: number): TimeSpan {
    return new TimeSpan(start, end);
  }

  /**
   * この区間をちょうど表せる最も粗い {@link Interval} と、その単位での `t` の範囲 `[tMin, tMax]` を返す。
   * 単位は `start` と区間幅の最大公約数。
   */
  public toIntervalRange(): [Interval, number, number] {
    let [a, b] = [this.start, this.end - this.start];
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return [Interval.create(a), this.start / a, this.end / a - 1];
  }
}
