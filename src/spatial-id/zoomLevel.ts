import { SpatialIdError } from "./error.js";

/** 空間のズームレベル（`0` 以上 {@link ZoomLevel.MAX} 以下）。 */
export class ZoomLevel {
  /** 有効な空間ズームレベルの最小値。 */
  public static readonly MIN = 0;
  /** 有効な空間ズームレベルの最大値。 */
  public static readonly MAX = 30;

  // 生成のたびに割り当てないよう、有効な全ズームレベルを先に作っておく。
  // 全 ID が同じインスタンスを共有するので、型を迂回した書き換えが全体に及ばないよう凍結する。
  // static ブロックに分けると、tsup の CJS 変換でフィールド初期化より先に実行されて失敗する。
  private static readonly ALL: readonly ZoomLevel[] = Object.freeze(
    Array.from({ length: ZoomLevel.MAX + 1 }, (_, z) =>
      Object.freeze(new ZoomLevel(z)),
    ),
  );

  /** ズームレベルの値。 */
  public readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * `z` から {@link ZoomLevel} を得る。
   * `z` は `0` 以上 {@link ZoomLevel.MAX} 以下の整数でなければならない。
   *
   * @throws {@link SpatialIdError} `ZOutOfRange` `z` が範囲外のとき
   */
  public static create(z: number): ZoomLevel {
    const zoom = Number.isInteger(z) ? ZoomLevel.ALL[z] : undefined;
    if (zoom === undefined) {
      throw new SpatialIdError({ kind: "ZOutOfRange", z });
    }
    return zoom;
  }

  /**
   * 検証を行わずに {@link ZoomLevel} を得る。
   * **範囲外の `z` を渡した場合の挙動は未定義**になる。
   *
   * @internal
   */
  public static createUnchecked(z: number): ZoomLevel {
    return ZoomLevel.ALL[z] as ZoomLevel;
  }

  /** このズームレベルにおける X / Y インデックスの最大値（`2^z - 1`）。 */
  public xyMax(): number {
    return 2 ** this.value - 1;
  }

  /** このズームレベルにおける F インデックスの最小値（`-2^z`）。 */
  public fMin(): number {
    return -(2 ** this.value);
  }

  /** このズームレベルにおける F インデックスの最大値（`2^z - 1`）。 */
  public fMax(): number {
    return this.xyMax();
  }

  /**
   * `f` がこのズームレベルの F 範囲に収まるかを検証する。
   *
   * @throws {@link SpatialIdError} `FOutOfRange` `f` が範囲外のとき
   * @internal
   */
  public checkF(f: number): void {
    if (!Number.isInteger(f) || f < this.fMin() || f > this.fMax()) {
      throw new SpatialIdError({ kind: "FOutOfRange", z: this.value, f });
    }
  }

  /**
   * `x` がこのズームレベルの X 範囲に収まるかを検証する。
   *
   * @throws {@link SpatialIdError} `XOutOfRange` `x` が範囲外のとき
   * @internal
   */
  public checkX(x: number): void {
    if (!Number.isInteger(x) || x < 0 || x > this.xyMax()) {
      throw new SpatialIdError({ kind: "XOutOfRange", z: this.value, x });
    }
  }

  /**
   * `y` がこのズームレベルの Y 範囲に収まるかを検証する。
   *
   * @throws {@link SpatialIdError} `YOutOfRange` `y` が範囲外のとき
   * @internal
   */
  public checkY(y: number): void {
    if (!Number.isInteger(y) || y < 0 || y > this.xyMax()) {
      throw new SpatialIdError({ kind: "YOutOfRange", z: this.value, y });
    }
  }
}

/** 時間軸のズームレベル（`0` 以上 {@link TZoomLevel.MAX} 以下）。{@link spatial-id!FlexId} でのみ使う。 */
export class TZoomLevel {
  /** 時間軸のズームレベルの最小値。 */
  public static readonly MIN = 0;
  /** 時間軸のズームレベルの最大値。 */
  public static readonly MAX = 35;

  private static readonly ALL: readonly TZoomLevel[] = Object.freeze(
    Array.from({ length: TZoomLevel.MAX + 1 }, (_, z) =>
      Object.freeze(new TZoomLevel(z)),
    ),
  );

  /** ズームレベルの値。 */
  public readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * `z` から {@link TZoomLevel} を得る。
   * `z` は `0` 以上 {@link TZoomLevel.MAX} 以下の整数でなければならない。
   *
   * @throws {@link spatial-id!SpatialIdError} `ZOutOfRange` `z` が範囲外のとき
   */
  public static create(z: number): TZoomLevel {
    const zoom = Number.isInteger(z) ? TZoomLevel.ALL[z] : undefined;
    if (zoom === undefined) {
      throw new SpatialIdError({ kind: "ZOutOfRange", z });
    }
    return zoom;
  }

  /**
   * 検証を行わずに {@link TZoomLevel} を得る。
   * **範囲外の `z` を渡した場合の挙動は未定義**になる。
   *
   * @internal
   */
  public static createUnchecked(z: number): TZoomLevel {
    return TZoomLevel.ALL[z] as TZoomLevel;
  }

  /** このズームレベルにおける1Segmentの秒数（`2^(MAX - z)`）。 */
  public segmentSeconds(): number {
    return 2 ** (TZoomLevel.MAX - this.value);
  }

  /**
   * `index` がこのズームレベルの範囲に収まるかを検証する。
   *
   * @throws {@link spatial-id!SpatialIdError} `TOutOfRange` `index` が範囲外のとき
   * @internal
   */
  public checkIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index > 2 ** this.value - 1) {
      throw new SpatialIdError({
        kind: "TOutOfRange",
        i: this.segmentSeconds(),
        t: index,
      });
    }
  }
}
