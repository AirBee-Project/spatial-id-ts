import { Interval } from "./interval.js";

/**
 * 読み出しで `{i}` として使ってよい時間間隔の候補集合。
 *
 * どう作っても {@link Interval.WHOLE} と {@link Interval.SECOND} が加わる。
 * この2つがないと表せない区間が生じるためである。
 *
 * ```ts
 * const intervals = AllowedIntervals.create([Interval.HOUR]);
 * intervals.contains(Interval.WHOLE); // true
 * intervals.contains(Interval.SECOND); // true
 * ```
 */
export class AllowedIntervals implements Iterable<Interval> {
  /** 秒数の降順で、重複がない。 */
  private readonly intervals: readonly Interval[];

  private constructor(intervals: readonly Interval[]) {
    this.intervals = intervals;
  }

  private static readonly CALENDAR = new AllowedIntervals(
    Object.freeze([
      Interval.WHOLE,
      Interval.DAY,
      Interval.HOUR,
      Interval.MINUTE,
      Interval.SECOND,
    ]),
  );

  /**
   * 候補から作る。{@link Interval.WHOLE} と {@link Interval.SECOND} は自動で加わる。
   *
   * @throws {@link spatial-id!SpatialIdError} `TIntervalError` 秒数が不正なとき
   */
  public static create(
    intervals: Iterable<Interval | number>,
  ): AllowedIntervals {
    const seconds = new Set(
      Array.from(intervals, (i) => Interval.from(i).seconds()),
    );
    seconds.add(Interval.WHOLE.seconds());
    seconds.add(Interval.SECOND.seconds());
    return new AllowedIntervals(
      Object.freeze(
        [...seconds].sort((a, b) => b - a).map((s) => Interval.create(s)),
      ),
    );
  }

  /**
   * 暦の単位だけに正規化する候補集合。
   *
   * {@link Interval.WHOLE}、{@link Interval.DAY}、{@link Interval.HOUR}、{@link Interval.MINUTE}、{@link Interval.SECOND} を持つ。
   */
  public static calendar(): AllowedIntervals {
    return AllowedIntervals.CALENDAR;
  }

  /** `unit` が候補に含まれるかを判定する。 */
  public contains(unit: Interval): boolean {
    return this.intervals.some((i) => i.equals(unit));
  }

  /** 候補を秒数の降順で返す。 */
  public [Symbol.iterator](): Iterator<Interval> {
    return this.intervals[Symbol.iterator]();
  }
}
