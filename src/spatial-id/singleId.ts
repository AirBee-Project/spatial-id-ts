import { Coordinate } from "../geometry/coordinate.js";
import { Interval } from "../time/interval.js";
import { SpatialIdError } from "./error.js";
import type { FlexId } from "./flexId.js";
import { RangeId } from "./rangeId.js";
import type { SpatialId } from "./spatialId.js";
import { SpatialIdBase } from "./spatialIdBase.js";
import { ZoomLevel } from "./zoomLevel.js";

/** 1つのボクセルを表す時空間 ID。仕様の `{z}/{f}/{x}/{y}_{i}/{t}` に対応する。 */
export class SingleId extends SpatialIdBase {
  private readonly zoom: ZoomLevel;
  /** 高度方向のインデックス `{f}`。 */
  public readonly f: number;
  /** X 方向のインデックス `{x}`。 */
  public readonly x: number;
  /** Y 方向のインデックス `{y}`。 */
  public readonly y: number;
  /** 時間間隔 `{i}`。時間を指定していなければ {@link Interval.WHOLE}。 */
  public readonly i: Interval;
  /** 時間インデックス `{t}`。 */
  public readonly t: number;

  private constructor(
    zoom: ZoomLevel,
    f: number,
    x: number,
    y: number,
    i: Interval,
    t: number,
  ) {
    super();
    this.zoom = zoom;
    this.f = f;
    this.x = x;
    this.y = y;
    this.i = i;
    this.t = t;
  }

  /** ズームレベル `{z}`。 */
  public get z(): number {
    return this.zoom.value;
  }

  /**
   * 指定された値から {@link SingleId} を作成する。
   * `z`, `f`, `x`, `y` が各ズームレベルにおける範囲内にあるかを検証する。
   * 時間は指定しておらず、全時間（{@link Interval.WHOLE}）となる。
   *
   * @throws {@link SpatialIdError} `ZOutOfRange` `z` が範囲外のとき
   * @throws {@link SpatialIdError} `FOutOfRange` `f` が範囲外のとき
   * @throws {@link SpatialIdError} `XOutOfRange` `x` が範囲外のとき
   * @throws {@link SpatialIdError} `YOutOfRange` `y` が範囲外のとき
   */
  public static create(z: number, f: number, x: number, y: number): SingleId {
    const zoom = ZoomLevel.create(z);
    zoom.checkF(f);
    zoom.checkX(x);
    zoom.checkY(y);

    return new SingleId(zoom, f, x, y, Interval.WHOLE, 0);
  }

  /**
   * 文字列表現から {@link SingleId} を復元する。
   *
   * 形式は `"{z}/{f}/{x}/{y}"`、時間を持つ場合は `"{z}/{f}/{x}/{y}_{i}/{t}"`。
   *
   * @throws {@link SpatialIdError} `ParseSpatialIdFormat` 書式が不正なとき
   * @throws {@link SpatialIdError} `ZOutOfRange` `z` が範囲外のとき
   * @throws {@link SpatialIdError} `FOutOfRange` `f` が範囲外のとき
   * @throws {@link SpatialIdError} `XOutOfRange` `x` が範囲外のとき
   * @throws {@link SpatialIdError} `YOutOfRange` `y` が範囲外のとき
   * @throws {@link SpatialIdError} `TIntervalError` `i` が不正なとき
   * @throws {@link SpatialIdError} `TOutOfRange` `t` が範囲外のとき
   */
  public static parse(text: string): SingleId {
    const underscoreIndex = text.indexOf("_");
    let spatialText = text;
    let temporalText: string | undefined;

    if (underscoreIndex !== -1) {
      spatialText = text.slice(0, underscoreIndex);
      temporalText = text.slice(underscoreIndex + 1);
      if (temporalText.includes("_")) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "SingleId",
          input: text,
        });
      }
    }

    const spatialParts = spatialText.split("/");
    if (spatialParts.length !== 4) {
      throw new SpatialIdError({
        kind: "ParseSpatialIdFormat",
        idKind: "SingleId",
        input: text,
      });
    }

    const [zStr, fStr, xStr, yStr] = spatialParts;
    if (
      zStr === undefined ||
      fStr === undefined ||
      xStr === undefined ||
      yStr === undefined
    ) {
      throw new SpatialIdError({
        kind: "ParseSpatialIdFormat",
        idKind: "SingleId",
        input: text,
      });
    }

    const z = SingleId.parseInteger(zStr);
    const f = SingleId.parseInteger(fStr);
    const x = SingleId.parseInteger(xStr);
    const y = SingleId.parseInteger(yStr);

    if (z === null || f === null || x === null || y === null) {
      throw new SpatialIdError({
        kind: "ParseSpatialIdFormat",
        idKind: "SingleId",
        input: text,
      });
    }

    const id = SingleId.create(z, f, x, y);

    if (temporalText !== undefined) {
      if (temporalText.includes(":")) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "SingleId",
          input: text,
        });
      }

      const temporalParts = temporalText.split("/");
      if (temporalParts.length !== 2) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "SingleId",
          input: text,
        });
      }

      const [iStr, tStr] = temporalParts;
      if (iStr === undefined || tStr === undefined) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "SingleId",
          input: text,
        });
      }

      const i = SingleId.parseInteger(iStr);
      const t = SingleId.parseInteger(tStr);
      if (i === null || t === null) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "SingleId",
          input: text,
        });
      }

      return id.timeWith(i, t);
    }

    return id;
  }

  /**
   * 検証を行わずに {@link SingleId} を作成する。
   * 高速に作成できるが、**不正な値を渡した場合の挙動は未定義**になる。
   */
  public static createUnchecked(
    z: number,
    f: number,
    x: number,
    y: number,
  ): SingleId {
    return new SingleId(
      ZoomLevel.createUnchecked(z),
      f,
      x,
      y,
      Interval.WHOLE,
      0,
    );
  }

  /**
   * 時間を含め、検証を行わずに {@link SingleId} を作成する。
   * **不正な値を渡した場合の挙動は未定義**になる。
   *
   * @internal
   */
  public static createUncheckedWithTime(
    zoom: ZoomLevel,
    f: number,
    x: number,
    y: number,
    i: Interval,
    t: number,
  ): SingleId {
    return new SingleId(zoom, f, x, y, i, t);
  }

  /** {@link SingleId} を {@link RangeId} へ変換する。 */
  public toRangeId(): RangeId {
    const { zoom, f, x, y, i, t } = this;
    return RangeId.createUncheckedWithTime(zoom, [f, f], [x, x], [y, y], i, [
      t,
      t,
    ]);
  }

  /** すべての値が等しい {@link SingleId} かを判定する。 */
  public equals(other: SpatialId): boolean {
    return (
      other instanceof SingleId &&
      this.zoom === other.zoom &&
      this.f === other.f &&
      this.x === other.x &&
      this.y === other.y &&
      this.i.equals(other.i) &&
      this.t === other.t
    );
  }

  /**
   * この {@link SingleId} を文字列形式で出力する。
   * 全時間の場合は `"{z}/{f}/{x}/{y}"`、時間を持つ場合は `"{z}/{f}/{x}/{y}_{i}/{t}"`。
   */
  public toString(): string {
    const base = `${this.z}/${this.f}/${this.x}/${this.y}`;
    if (this.timeIsWhole()) {
      return base;
    }
    return `${base}_${this.i.seconds()}/${this.t}`;
  }

  /** {@link SingleId} を {@link FlexId} へ変換する。 */
  public [Symbol.iterator](): Generator<FlexId> {
    return this.toRangeId()[Symbol.iterator]();
  }

  /** この {@link SingleId} 自身のみを1つ返す。 */
  public *singleIds(): Generator<SingleId> {
    yield this;
  }
  /** 時間を含まない、空間3次元（F/X/Y）の中心を {@link Coordinate} で返す。 */
  public spatialCenter(): Coordinate {
    const { z, f, x, y } = this;
    return Coordinate.fromIndex(z, f + 0.5, x + 0.5, y + 0.5);
  }

  /**
   * 時間を含まない、空間3次元の直方体を構成する8頂点の座標を返す。
   *
   * 高度（低い方から）、緯度（`y` の小さい方から）、経度（西から）の順に並ぶ。
   */
  public spatialVertices(): readonly [
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
    Coordinate,
  ] {
    return this.toRangeId().spatialVertices();
  }

  /**
   * 時間を設定する。`i` は {@link Interval} または秒数のどちらでも渡せる。
   *
   * @throws {@link SpatialIdError} `TIntervalError` `i` が不正なとき
   * @throws {@link SpatialIdError} `TOutOfRange` `t` が範囲外のとき
   */
  public timeWith(i: Interval | number, t: number): SingleId {
    const resolved = Interval.from(i);
    resolved.validatedSpan(t, t);
    return new SingleId(this.zoom, this.f, this.x, this.y, resolved, t);
  }

  /** 時間の指定を外し、全時間に戻す。 */
  public timeCleared(): SingleId {
    return new SingleId(this.zoom, this.f, this.x, this.y, Interval.WHOLE, 0);
  }

  /**
   * この ID が占める絶対秒区間 `[start, end)`（Unix 時刻）を返す。
   */
  public timeRange(): readonly [number, number] {
    const unit = this.i.seconds();
    return [this.t * unit, (this.t + 1) * unit];
  }
}
