import { Coordinate } from "../geometry/coordinate.js";
import { Interval } from "../time/interval.js";
import { SpatialIdError } from "./error.js";
import { FlexId } from "./flexId.js";
import { SingleId } from "./singleId.js";
import type { SpatialId } from "./spatialId.js";
import { SpatialIdBase } from "./spatialIdBase.js";
import { TZoomLevel, ZoomLevel } from "./zoomLevel.js";

/** 2の冪で区切った区間の1つ。ズーム `zoom` の `index` 番目を指す。 */
type DyadicSegment = { zoom: number; index: number };

/** 各軸を `[min, max]` の範囲で指定した時空間 ID。 */
export class RangeId extends SpatialIdBase {
  /** 全時空間を覆う {@link RangeId}。 */
  public static readonly WHOLE: RangeId = new RangeId(
    ZoomLevel.createUnchecked(ZoomLevel.MIN),
    Object.freeze<[number, number]>([-1, 0]),
    Object.freeze<[number, number]>([0, 0]),
    Object.freeze<[number, number]>([0, 0]),
    Interval.WHOLE,
    Object.freeze<[number, number]>([0, 0]),
  );

  // 全 ID から共有される定数なので、型を迂回した書き換えが全体に及ばないよう凍結する
  static {
    Object.freeze(RangeId.WHOLE);
  }

  private readonly zoom: ZoomLevel;
  /** 高度方向のインデックスの範囲 `[min, max]`。 */
  public readonly f: readonly [number, number];
  /** X 方向のインデックスの範囲 `[min, max]`。経度の周期境界をまたぐときは `x[0] > x[1]` になる。 */
  public readonly x: readonly [number, number];
  /** Y 方向のインデックスの範囲 `[min, max]`。 */
  public readonly y: readonly [number, number];
  /** 時間間隔 `{i}`。時間を指定していなければ {@link Interval.WHOLE}。 */
  public readonly i: Interval;
  /** 時間インデックスの範囲 `[min, max]`。 */
  public readonly t: readonly [number, number];

  private constructor(
    zoom: ZoomLevel,
    f: readonly [number, number],
    x: readonly [number, number],
    y: readonly [number, number],
    i: Interval,
    t: readonly [number, number],
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
   * 指定された値から {@link RangeId} を作成する。
   * `f`, `x`, `y` は `[min, max]` のペア、または両端が等しい単一の値で指定できる。
   * `f`, `y` は自動的に昇順へ並び替えられる。`x` は周期境界を持つため並び替えない。
   * 各値が対応するズームレベルの範囲内にあるかを検証する。
   * 時間は指定しておらず、全時間（{@link Interval.WHOLE}）となる。
   *
   * @throws {@link SpatialIdError} `ZOutOfRange` `z` が範囲外のとき
   * @throws {@link SpatialIdError} `FOutOfRange` `f` が範囲外のとき
   * @throws {@link SpatialIdError} `XOutOfRange` `x` が範囲外のとき
   * @throws {@link SpatialIdError} `YOutOfRange` `y` が範囲外のとき
   */
  public static create(
    z: number,
    f: number | readonly [number, number],
    x: number | readonly [number, number],
    y: number | readonly [number, number],
  ): RangeId {
    const zoom = ZoomLevel.create(z);

    const fRange = RangeId.intoRange(f);
    const xRange = RangeId.intoRange(x);
    const yRange = RangeId.intoRange(y);

    for (const value of fRange) zoom.checkF(value);
    for (const value of xRange) zoom.checkX(value);
    for (const value of yRange) zoom.checkY(value);

    if (fRange[0] > fRange[1]) {
      [fRange[0], fRange[1]] = [fRange[1], fRange[0]];
    }
    if (yRange[0] > yRange[1]) {
      [yRange[0], yRange[1]] = [yRange[1], yRange[0]];
    }

    return new RangeId(zoom, fRange, xRange, yRange, Interval.WHOLE, [0, 0]);
  }

  /**
   * 文字列表現から {@link RangeId} を復元する。
   *
   * 形式は `"{z}/{f}/{x}/{y}"`、時間を持つ場合は `"{z}/{f}/{x}/{y}_{i}/{t}"`。
   * 単一値表記（例: `4/-3/8:9/5:10`）および範囲表記（例: `4/-3:6/8:9/5:10`）の両方を受け付ける。
   *
   * @throws {@link SpatialIdError} `ParseSpatialIdFormat` 書式が不正なとき
   * @throws {@link SpatialIdError} `ZOutOfRange` `z` が範囲外のとき
   * @throws {@link SpatialIdError} `FOutOfRange` `f` が範囲外のとき
   * @throws {@link SpatialIdError} `XOutOfRange` `x` が範囲外のとき
   * @throws {@link SpatialIdError} `YOutOfRange` `y` が範囲外のとき
   * @throws {@link SpatialIdError} `TIntervalError` `i` が不正なとき
   * @throws {@link SpatialIdError} `TOutOfRange` `t` が範囲外のとき
   */
  public static parse(text: string): RangeId {
    const underscoreIndex = text.indexOf("_");
    let spatialText = text;
    let temporalText: string | undefined;

    if (underscoreIndex !== -1) {
      spatialText = text.slice(0, underscoreIndex);
      temporalText = text.slice(underscoreIndex + 1);
      if (temporalText.includes("_")) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "RangeId",
          input: text,
        });
      }
    }

    const spatialParts = spatialText.split("/");
    if (spatialParts.length !== 4) {
      throw new SpatialIdError({
        kind: "ParseSpatialIdFormat",
        idKind: "RangeId",
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
        idKind: "RangeId",
        input: text,
      });
    }

    const z = RangeId.parseInteger(zStr);
    if (z === null) {
      throw new SpatialIdError({
        kind: "ParseSpatialIdFormat",
        idKind: "RangeId",
        input: text,
      });
    }

    const f = RangeId.parseDimension(fStr);
    const x = RangeId.parseDimension(xStr);
    const y = RangeId.parseDimension(yStr);

    if (f === null || x === null || y === null) {
      throw new SpatialIdError({
        kind: "ParseSpatialIdFormat",
        idKind: "RangeId",
        input: text,
      });
    }

    const id = RangeId.create(z, f, x, y);

    if (temporalText !== undefined) {
      const temporalParts = temporalText.split("/");
      if (temporalParts.length !== 2) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "RangeId",
          input: text,
        });
      }

      const [iStr, tStr] = temporalParts;
      if (iStr === undefined || tStr === undefined) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "RangeId",
          input: text,
        });
      }

      const i = RangeId.parseInteger(iStr);
      const t = RangeId.parseDimension(tStr);
      if (i === null || t === null) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "RangeId",
          input: text,
        });
      }

      return id.timeWith(i, t);
    }

    return id;
  }

  /**
   * 検証を行わずに {@link RangeId} を作成する。
   * 高速に作成できるが、**不正な値を渡した場合の挙動は未定義**になる。
   */
  public static createUnchecked(
    z: number,
    f: number | readonly [number, number],
    x: number | readonly [number, number],
    y: number | readonly [number, number],
  ): RangeId {
    return new RangeId(
      ZoomLevel.createUnchecked(z),
      RangeId.intoRange(f),
      RangeId.intoRange(x),
      RangeId.intoRange(y),
      Interval.WHOLE,
      [0, 0],
    );
  }

  /**
   * 時間を含め、検証を行わずに {@link RangeId} を作成する。
   * **不正な値を渡した場合の挙動は未定義**になる。
   *
   * @internal
   */
  public static createUncheckedWithTime(
    zoom: ZoomLevel,
    f: readonly [number, number],
    x: readonly [number, number],
    y: readonly [number, number],
    i: Interval,
    t: readonly [number, number],
  ): RangeId {
    return new RangeId(zoom, f, x, y, i, t);
  }

  /** {@link RangeId} 自身を返す。 */
  public toRangeId(): RangeId {
    return this;
  }

  /** すべての値が等しい {@link RangeId} かを判定する。 */
  public equals(other: SpatialId): boolean {
    return (
      other instanceof RangeId &&
      this.zoom === other.zoom &&
      this.f[0] === other.f[0] &&
      this.f[1] === other.f[1] &&
      this.x[0] === other.x[0] &&
      this.x[1] === other.x[1] &&
      this.y[0] === other.y[0] &&
      this.y[1] === other.y[1] &&
      this.i.equals(other.i) &&
      this.t[0] === other.t[0] &&
      this.t[1] === other.t[1]
    );
  }

  /**
   * この {@link RangeId} を文字列形式で出力する。
   * 形式は `"{z}/{f}/{x}/{y}"`、時間を持つ場合は `"{z}/{f}/{x}/{y}_{i}/{t}"`。
   * 各軸は両端が等しい場合は単一値に自動圧縮される（例: `4/-3/8:9/5:10`）。
   */
  public toString(): string {
    const base = `${this.z}/${RangeId.formatDimension(this.f)}/${RangeId.formatDimension(this.x)}/${RangeId.formatDimension(this.y)}`;
    if (this.timeIsWhole()) {
      return base;
    }
    return `${base}_${this.i.seconds()}/${RangeId.formatDimension(this.t)}`;
  }

  /** `x` の周期境界（`x[0] > x[1]` の折り返し）を考慮して、Xインデックスを列挙する。 */
  private *xIndices(): Generator<number> {
    if (this.x[0] <= this.x[1]) {
      for (let x = this.x[0]; x <= this.x[1]; x++) yield x;
      return;
    }
    for (let x = this.x[0]; x <= this.zoom.xyMax(); x++) yield x;
    for (let x = 0; x <= this.x[1]; x++) yield x;
  }

  /** {@link RangeId} を複数の {@link SingleId} へ展開する。 */
  public *singleIds(): Generator<SingleId> {
    for (let f = this.f[0]; f <= this.f[1]; f++) {
      for (const x of this.xIndices()) {
        for (let y = this.y[0]; y <= this.y[1]; y++) {
          for (let t = this.t[0]; t <= this.t[1]; t++) {
            yield SingleId.createUncheckedWithTime(
              this.zoom,
              f,
              x,
              y,
              this.i,
              t,
            );
          }
        }
      }
    }
  }

  /** {@link RangeId} を複数の {@link FlexId} へ展開する。 */
  public *[Symbol.iterator](): Generator<FlexId> {
    const z = this.z;
    const fSegments = [...RangeId.decomposeF(z, this.f[0], this.f[1])];
    const ySegments = [...RangeId.decompose(this.y[0], this.y[1], z)];
    const xSegments =
      this.x[0] <= this.x[1]
        ? [...RangeId.decompose(this.x[0], this.x[1], z)]
        : [
            ...RangeId.decompose(this.x[0], this.zoom.xyMax(), z),
            ...RangeId.decompose(0, this.x[1], z),
          ];

    const start = this.i.seconds() * this.t[0];
    const end = this.i.seconds() * (this.t[1] + 1);
    const tSegments = [...RangeId.decompose(start, end - 1, TZoomLevel.MAX)];

    for (const f of fSegments) {
      for (const x of xSegments) {
        for (const y of ySegments) {
          for (const t of tSegments) {
            yield FlexId.createUncheckedWithTime(
              ZoomLevel.createUnchecked(f.zoom),
              f.index,
              ZoomLevel.createUnchecked(x.zoom),
              x.index,
              ZoomLevel.createUnchecked(y.zoom),
              y.index,
              TZoomLevel.createUnchecked(t.zoom),
              t.index,
            );
          }
        }
      }
    }
  }

  /** 時間を含まない、空間3次元（F/X/Y）の中心を {@link Coordinate} で返す。 */
  public spatialCenter(): Coordinate {
    const { z, f, x, y } = this;
    return Coordinate.fromIndex(
      z,
      (f[0] + f[1]) / 2 + 0.5,
      (x[0] + x[1]) / 2 + 0.5,
      (y[0] + y[1]) / 2 + 0.5,
    );
  }

  /**
   * 時間を含まない、空間3次元の直方体を構成する8頂点の座標を返す。
   *
   * 高度（低い方から）、緯度（`y` の小さい方から）、経度（`x[0]` 側から）の順に並ぶ。
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
    const { z, f, x, y } = this;
    const [f0, f1] = [f[0], f[1] + 1];
    const [x0, x1] = [x[0], x[1] + 1];
    const [y0, y1] = [y[0], y[1] + 1];
    return [
      Coordinate.fromIndex(z, f0, x0, y0),
      Coordinate.fromIndex(z, f0, x1, y0),
      Coordinate.fromIndex(z, f0, x0, y1),
      Coordinate.fromIndex(z, f0, x1, y1),
      Coordinate.fromIndex(z, f1, x0, y0),
      Coordinate.fromIndex(z, f1, x1, y0),
      Coordinate.fromIndex(z, f1, x0, y1),
      Coordinate.fromIndex(z, f1, x1, y1),
    ];
  }

  /**
   * 時間を設定する。`i` は {@link Interval} または秒数のどちらでも渡せる。
   * `t` は `[min, max]` のペア、または両端が等しい単一の値で指定できる。
   *
   * @throws {@link SpatialIdError} `TIntervalError` `i` が不正なとき
   * @throws {@link SpatialIdError} `TOutOfRange` `t` が範囲外のとき
   */
  public timeWith(
    i: Interval | number,
    t: number | readonly [number, number],
  ): RangeId {
    const resolved = Interval.from(i);
    const tRange = RangeId.intoRange(t);
    if (tRange[0] > tRange[1]) {
      [tRange[0], tRange[1]] = [tRange[1], tRange[0]];
    }
    resolved.validatedSpan(tRange[0], tRange[1]);

    return new RangeId(this.zoom, this.f, this.x, this.y, resolved, tRange);
  }

  /** 時間の指定を外し、全時間に戻す。 */
  public timeCleared(): RangeId {
    return new RangeId(
      this.zoom,
      this.f,
      this.x,
      this.y,
      Interval.WHOLE,
      [0, 0],
    );
  }

  /**
   * この ID が占める絶対秒区間 `[start, end)`（Unix 時刻）を返す。
   */
  public timeRange(): readonly [number, number] {
    const unit = this.i.seconds();
    return [this.t[0] * unit, (this.t[1] + 1) * unit];
  }

  private static intoRange(
    input: number | readonly [number, number],
  ): [number, number] {
    return typeof input === "number" ? [input, input] : [input[0], input[1]];
  }

  /** 両端が等しい場合は単一値（`val`）、異なる場合は `min:max` を返す。 */
  private static formatDimension(dimension: readonly [number, number]): string {
    return dimension[0] === dimension[1]
      ? String(dimension[0])
      : `${dimension[0]}:${dimension[1]}`;
  }

  /** `"start:end"` または単一値の文字列を `[number, number]` へ変換する。不正な形式の場合は null を返す。 */
  private static parseDimension(text: string): [number, number] | null {
    const colonIndex = text.indexOf(":");
    if (colonIndex === -1) {
      const val = RangeId.parseInteger(text);
      return val === null ? null : [val, val];
    }
    const endStr = text.slice(colonIndex + 1);
    if (endStr.includes(":")) {
      return null;
    }
    const start = RangeId.parseInteger(text.slice(0, colonIndex));
    const end = RangeId.parseInteger(endStr);
    return start === null || end === null ? null : [start, end];
  }

  /** 非負の区間 `[l, r]`（ズーム `startZoom`）を、重ならない最小個数の2の冪区間へ分解する。 */
  private static *decompose(
    l: number,
    r: number,
    startZoom: number,
  ): Generator<DyadicSegment> {
    let lo = l;
    let hi = r;
    let zoom = startZoom;

    while (lo <= hi) {
      if (zoom === 0 || lo === hi || lo % 2 === 1) {
        yield { zoom, index: lo };
        lo += 1;
        continue;
      }
      if (hi % 2 === 0) {
        yield { zoom, index: hi };
        hi -= 1;
        continue;
      }
      lo = Math.floor(lo / 2);
      hi = Math.floor(hi / 2);
      zoom -= 1;
    }
  }

  /**
   * F インデックス範囲 `[min, max]`（ズーム `z`）を、2の冪区間へ分解する。
   * F は符号付きだが {@link RangeId.decompose} は非負整数の区間しか扱えないため、`2^z` を足して非負化してから
   * 分解し、各区間を分解後のズームに応じたオフセットで符号付きへ戻す。
   */
  private static *decomposeF(
    z: number,
    min: number,
    max: number,
  ): Generator<DyadicSegment> {
    const offset = 2 ** z;
    for (const seg of RangeId.decompose(min + offset, max + offset, z)) {
      yield { zoom: seg.zoom, index: seg.index - 2 ** seg.zoom };
    }
  }
}
