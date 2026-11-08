import { SpatialIdError } from "../spatial-id/error.js";
import { TZoomLevel } from "../spatial-id/zoomLevel.js";
import { TimeSegment } from "./timeSegment.js";
import { TimeSpan } from "./timeSpan.js";

/**
 * 時間間隔 `{i}`を表現する型。よく使う値は定数として用意している。
 */
export class Interval {
  /** 最も粗い時間単位を表す二進層の指数。時間軸の最大ズームレベル（{@link TZoomLevel.MAX}）と等しい。 */
  public static readonly MAX_POW = TZoomLevel.MAX;

  /** このライブラリが扱える最大の時間間隔（`2^`{@link Interval.MAX_POW} 秒） */
  public static readonly MAX_SECONDS = 2 ** Interval.MAX_POW;

  private readonly value: number;

  private constructor(seconds: number) {
    this.value = seconds;
  }

  /** 全時間（`2^35`秒）。時間を指定していない ID はこの値を持つ。 */
  public static readonly WHOLE = new Interval(Interval.MAX_SECONDS);
  /** 1日（86400秒）。 */
  public static readonly DAY = new Interval(86_400);
  /** 1時間（3600秒）。 */
  public static readonly HOUR = new Interval(3_600);
  /** 1分（60秒）。 */
  public static readonly MINUTE = new Interval(60);
  /** 1秒。 */
  public static readonly SECOND = new Interval(1);

  // 定数は全 ID から共有されるので、型を迂回した書き換えが全体に及ばないよう凍結する
  static {
    Object.freeze(Interval.WHOLE);
    Object.freeze(Interval.DAY);
    Object.freeze(Interval.HOUR);
    Object.freeze(Interval.MINUTE);
    Object.freeze(Interval.SECOND);
  }

  /**
   * 秒数から {@link Interval} を作成する。
   * `seconds` は正の整数で、{@link Interval.MAX_SECONDS} 以下でなければならない。
   *
   * @throws {@link spatial-id!SpatialIdError} `TIntervalError` `seconds` が不正なとき
   */
  public static create(seconds: number): Interval {
    if (
      !Number.isInteger(seconds) ||
      seconds <= 0 ||
      seconds > Interval.MAX_SECONDS
    ) {
      throw new SpatialIdError({ kind: "TIntervalError", i: seconds });
    }
    return new Interval(seconds);
  }

  /**
   * {@link Interval} 自身、または秒数の整数のどちらからでも {@link Interval} を得る。
   *
   * @throws {@link spatial-id!SpatialIdError} `TIntervalError` 秒数が不正なとき
   */
  public static from(input: Interval | number): Interval {
    return input instanceof Interval ? input : Interval.create(input);
  }

  /**
   * Unix 時刻（秒）が属する時間インデックス `t = floor(u / i)` を返す。
   *
   * @throws {@link spatial-id!SpatialIdError} `TOutOfRange` 計算した `t` が 0 以上の有限の数でないとき
   */
  public indexOf(unixSeconds: number): number {
    const t = Math.floor(unixSeconds / this.value);
    if (!(Number.isFinite(t) && t >= 0)) {
      throw new SpatialIdError({ kind: "TOutOfRange", i: this.value, t });
    }
    return t;
  }

  /**  {@link Interval} の秒数。 */
  public seconds(): number {
    return this.value;
  }

  /** 2つの {@link Interval} の秒数が等しいかを判定する。 */
  public equals(other: Interval): boolean {
    return this.value === other.value;
  }

  /**
   * 秒数が2の冪かを判定する。
   *
   * 2の冪であれば、時間は {@link spatial-id!FlexId} の時間軸の1Segmentに収まる。
   * そうでない間隔（例: 1800秒）は、木構造へ入れるときに複数のSegmentへ分解される。
   */
  public isPowerOfTwo(): boolean {
    return Number.isInteger(Math.log2(this.value));
  }

  /**
   * 時間軸のズームレベルが表す1Segmentの幅を、{@link Interval} として返す。
   *
   * @internal
   */
  public static fromZoom(zoom: TZoomLevel): Interval {
    return zoom.value === TZoomLevel.MIN
      ? Interval.WHOLE
      : new Interval(zoom.segmentSeconds());
  }

  /**
   * `{i}` と `{t}` を、{@link spatial-id!FlexId} が持てる時間軸の1Segmentへ直す。
   *
   * @throws {@link spatial-id!SpatialIdError} `TIntervalError` 秒数が2の冪でないとき
   * @throws {@link spatial-id!SpatialIdError} `TOutOfRange` `t` が範囲外のとき
   * @internal
   */
  public asSegment(t: number): TimeSegment {
    if (!this.isPowerOfTwo()) {
      throw new SpatialIdError({ kind: "TIntervalError", i: this.value });
    }
    const zoom = TZoomLevel.create(TZoomLevel.MAX - Math.log2(this.value));
    zoom.checkIndex(t);
    return TimeSegment.of(zoom, t);
  }

  /**
   * `{i}` と `{t}` の範囲（両端含む）が占める絶対秒区間を、検証して返す。
   *
   * @throws {@link spatial-id!SpatialIdError} `TOutOfRange` 区間が不正、または終端が {@link Interval.MAX_SECONDS} を超えるとき
   * @internal
   */
  public validatedSpan(tMin: number, tMax: number): TimeSpan {
    const start = tMin * this.value;
    const end = (tMax + 1) * this.value;
    if (start >= end || end > Interval.MAX_SECONDS) {
      throw new SpatialIdError({ kind: "TOutOfRange", i: this.value, t: tMax });
    }
    return TimeSpan.createUnchecked(start, end);
  }
}
