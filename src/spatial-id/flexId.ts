import type { Coordinate } from "../geometry/coordinate.js";
import { Interval } from "../time/interval.js";
import { SpatialIdError } from "./error.js";
import { RangeId } from "./rangeId.js";
import type { SingleId } from "./singleId.js";
import type { SpatialId } from "./spatialId.js";
import { SpatialIdBase } from "./spatialIdBase.js";
import { TZoomLevel, ZoomLevel } from "./zoomLevel.js";

/** 軸ごとに異なるズームレベルを持つ拡張時空間 ID。 */
export class FlexId extends SpatialIdBase {
  /**
   * 高度方向のインデックスの最大値側で、全空間の上半分（`f = 0`）を覆う {@link FlexId}。
   * 全時間を指す。
   */
  public static readonly UPPER_MAX: FlexId = new FlexId(
    ZoomLevel.createUnchecked(ZoomLevel.MIN),
    0,
    ZoomLevel.createUnchecked(ZoomLevel.MIN),
    0,
    ZoomLevel.createUnchecked(ZoomLevel.MIN),
    0,
    TZoomLevel.createUnchecked(TZoomLevel.MIN),
    0,
  );

  /** 全空間の下半分（`f = -1`）を覆う {@link FlexId}。全時間を指す。 */
  public static readonly LOWER_MAX: FlexId = new FlexId(
    ZoomLevel.createUnchecked(ZoomLevel.MIN),
    -1,
    ZoomLevel.createUnchecked(ZoomLevel.MIN),
    0,
    ZoomLevel.createUnchecked(ZoomLevel.MIN),
    0,
    TZoomLevel.createUnchecked(TZoomLevel.MIN),
    0,
  );

  // 全 ID から共有される定数なので、型を迂回した書き換えが全体に及ばないよう凍結する
  static {
    Object.freeze(FlexId.UPPER_MAX);
    Object.freeze(FlexId.LOWER_MAX);
  }

  private readonly fZoom: ZoomLevel;
  /** 高度方向のインデックス。 */
  public readonly fIndex: number;
  private readonly xZoom: ZoomLevel;
  /** X 方向のインデックス。 */
  public readonly xIndex: number;
  private readonly yZoom: ZoomLevel;
  /** Y 方向のインデックス。 */
  public readonly yIndex: number;
  private readonly tZoom: TZoomLevel;
  /** 時間軸のインデックス。 */
  public readonly tIndex: number;

  private constructor(
    fZoom: ZoomLevel,
    fIndex: number,
    xZoom: ZoomLevel,
    xIndex: number,
    yZoom: ZoomLevel,
    yIndex: number,
    tZoom: TZoomLevel,
    tIndex: number,
  ) {
    super();
    this.fZoom = fZoom;
    this.fIndex = fIndex;
    this.xZoom = xZoom;
    this.xIndex = xIndex;
    this.yZoom = yZoom;
    this.yIndex = yIndex;
    this.tZoom = tZoom;
    this.tIndex = tIndex;
  }

  /** 高度方向のズームレベル。 */
  public get fZoomLevel(): number {
    return this.fZoom.value;
  }

  /** X 方向のズームレベル。 */
  public get xZoomLevel(): number {
    return this.xZoom.value;
  }

  /** Y 方向のズームレベル。 */
  public get yZoomLevel(): number {
    return this.yZoom.value;
  }

  /** 時間軸のズームレベル（0 以上 {@link TZoomLevel.MAX} 以下）。 */
  public get tZoomLevel(): number {
    return this.tZoom.value;
  }

  /**
   * 空間3軸（F/X/Y）からそれぞれ独立したズームレベルで {@link FlexId} を作成する。
   * 各インデックスが対応するズームレベルの範囲内にあるかを検証する。
   * 時間軸は全時間（ズーム0、インデックス0）から始まる。
   *
   * @throws {@link SpatialIdError} `ZOutOfRange` いずれかのズームレベルが範囲外のとき
   * @throws {@link SpatialIdError} `FOutOfRange` `fIndex` が範囲外のとき
   * @throws {@link SpatialIdError} `XOutOfRange` `xIndex` が範囲外のとき
   * @throws {@link SpatialIdError} `YOutOfRange` `yIndex` が範囲外のとき
   */
  public static create(
    fZoomLevel: number,
    fIndex: number,
    xZoomLevel: number,
    xIndex: number,
    yZoomLevel: number,
    yIndex: number,
  ): FlexId {
    const fZoom = ZoomLevel.create(fZoomLevel);
    const xZoom = ZoomLevel.create(xZoomLevel);
    const yZoom = ZoomLevel.create(yZoomLevel);

    fZoom.checkF(fIndex);
    xZoom.checkX(xIndex);
    yZoom.checkY(yIndex);

    return new FlexId(
      fZoom,
      fIndex,
      xZoom,
      xIndex,
      yZoom,
      yIndex,
      TZoomLevel.createUnchecked(TZoomLevel.MIN),
      0,
    );
  }

  /**
   * 文字列表現から {@link FlexId} を復元する。
   *
   * 形式は `"{fz}/{fi}|{xz}/{xi}|{yz}/{yi}"`。時間を持つ場合は 4 軸目 `"|{tz}/{ti}"` が続く。
   *
   * @throws {@link SpatialIdError} `ParseSpatialIdFormat` 書式が不正なとき
   * @throws {@link SpatialIdError} `ZOutOfRange` いずれかのズームレベルが範囲外のとき
   * @throws {@link SpatialIdError} `FOutOfRange` `fIndex` が範囲外のとき
   * @throws {@link SpatialIdError} `XOutOfRange` `xIndex` が範囲外のとき
   * @throws {@link SpatialIdError} `YOutOfRange` `yIndex` が範囲外のとき
   * @throws {@link SpatialIdError} `TOutOfRange` `tIndex` が範囲外のとき
   */
  public static parse(text: string): FlexId {
    const parts = text.split("|");
    if (parts.length !== 3 && parts.length !== 4) {
      throw new SpatialIdError({
        kind: "ParseSpatialIdFormat",
        idKind: "FlexId",
        input: text,
      });
    }

    const parseAxis = (part: string): [number, number] => {
      const subParts = part.split("/");
      if (subParts.length !== 2) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "FlexId",
          input: text,
        });
      }
      const [zoomStr, indexStr] = subParts;
      if (zoomStr === undefined || indexStr === undefined) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "FlexId",
          input: text,
        });
      }
      const zoom = FlexId.parseInteger(zoomStr);
      const index = FlexId.parseInteger(indexStr);
      if (zoom === null || index === null) {
        throw new SpatialIdError({
          kind: "ParseSpatialIdFormat",
          idKind: "FlexId",
          input: text,
        });
      }
      return [zoom, index];
    };

    const [fPart, xPart, yPart, tPart] = parts;
    if (fPart === undefined || xPart === undefined || yPart === undefined) {
      throw new SpatialIdError({
        kind: "ParseSpatialIdFormat",
        idKind: "FlexId",
        input: text,
      });
    }

    const [fz, fi] = parseAxis(fPart);
    const [xz, xi] = parseAxis(xPart);
    const [yz, yi] = parseAxis(yPart);

    const id = FlexId.create(fz, fi, xz, xi, yz, yi);

    if (tPart !== undefined) {
      const [tz, ti] = parseAxis(tPart);
      return id.withTimeSegment(tz, ti);
    }

    return id;
  }

  /**
   * 検証を行わずに {@link FlexId} を作成する。
   * 高速に作成できるが、**不正な値を渡した場合の挙動は未定義**になる。
   */
  public static createUnchecked(
    fZoomLevel: number,
    fIndex: number,
    xZoomLevel: number,
    xIndex: number,
    yZoomLevel: number,
    yIndex: number,
  ): FlexId {
    return new FlexId(
      ZoomLevel.createUnchecked(fZoomLevel),
      fIndex,
      ZoomLevel.createUnchecked(xZoomLevel),
      xIndex,
      ZoomLevel.createUnchecked(yZoomLevel),
      yIndex,
      TZoomLevel.createUnchecked(TZoomLevel.MIN),
      0,
    );
  }

  /**
   * 時間を含め、検証を行わずに {@link FlexId} を作成する。
   * **不正な値を渡した場合の挙動は未定義**になる。
   *
   * @internal
   */
  public static createUncheckedWithTime(
    fZoom: ZoomLevel,
    fIndex: number,
    xZoom: ZoomLevel,
    xIndex: number,
    yZoom: ZoomLevel,
    yIndex: number,
    tZoom: TZoomLevel,
    tIndex: number,
  ): FlexId {
    return new FlexId(
      fZoom,
      fIndex,
      xZoom,
      xIndex,
      yZoom,
      yIndex,
      tZoom,
      tIndex,
    );
  }

  /**
   * {@link FlexId} を {@link RangeId} へ変換する。
   */
  public toRangeId(): RangeId {
    const maxZoom = Math.max(this.fZoomLevel, this.xZoomLevel, this.yZoomLevel);
    const widen = (zoom: number, index: number): [number, number] => {
      const scale = 2 ** (maxZoom - zoom);
      const start = index * scale;
      return [start, start + scale - 1];
    };

    return RangeId.createUncheckedWithTime(
      ZoomLevel.createUnchecked(maxZoom),
      widen(this.fZoomLevel, this.fIndex),
      widen(this.xZoomLevel, this.xIndex),
      widen(this.yZoomLevel, this.yIndex),
      Interval.fromZoom(this.tZoom),
      [this.tIndex, this.tIndex],
    );
  }

  /** すべての値が等しい {@link FlexId} かを判定する。 */
  public equals(other: SpatialId): boolean {
    return (
      other instanceof FlexId &&
      this.fZoom === other.fZoom &&
      this.fIndex === other.fIndex &&
      this.xZoom === other.xZoom &&
      this.xIndex === other.xIndex &&
      this.yZoom === other.yZoom &&
      this.yIndex === other.yIndex &&
      this.tZoom === other.tZoom &&
      this.tIndex === other.tIndex
    );
  }

  /**
   * {@link FlexId} を文字列形式で出力する。
   */
  public toString(): string {
    const base = `${this.fZoomLevel}/${this.fIndex}|${this.xZoomLevel}/${this.xIndex}|${this.yZoomLevel}/${this.yIndex}`;
    if (this.timeIsWhole()) {
      return base;
    }
    return `${base}|${this.tZoomLevel}/${this.tIndex}`;
  }

  /** {@link FlexId} を複数の {@link SingleId} へ展開する。 */
  public singleIds(): Generator<SingleId> {
    return this.toRangeId().singleIds();
  }

  /** 自身だけを1つ返す。 */
  public *[Symbol.iterator](): Generator<FlexId> {
    yield this;
  }
  /** 時間を含まない、空間3次元（F/X/Y）の中心を {@link Coordinate} で返す。 */
  public spatialCenter(): Coordinate {
    return this.toRangeId().spatialCenter();
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
   * 時間軸の Segment を設定する。引数は空間と同じくズームレベルとインデックス値である。
   *
   * {@link SingleId} と {@link RangeId} の `timeWith(i, t)` は「秒数の間隔」と「インデックス」を取るので、
   * 同じ値を渡しても意味が異なる。1 Segment の幅は `2^(35 - tZoomLevel)` 秒である。
   *
   * @throws {@link SpatialIdError} `ZOutOfRange` 時間軸のズームレベルが範囲外のとき
   * @throws {@link SpatialIdError} `TOutOfRange` `tIndex` が範囲外のとき
   */
  public withTimeSegment(
    tZoomLevel: TZoomLevel | number,
    tIndex: number,
  ): FlexId {
    const tZoom =
      typeof tZoomLevel === "number"
        ? TZoomLevel.create(tZoomLevel)
        : tZoomLevel;
    tZoom.checkIndex(tIndex);

    return new FlexId(
      this.fZoom,
      this.fIndex,
      this.xZoom,
      this.xIndex,
      this.yZoom,
      this.yIndex,
      tZoom,
      tIndex,
    );
  }

  /** 時間の指定を外し、全時間に戻す。 */
  public timeCleared(): FlexId {
    return new FlexId(
      this.fZoom,
      this.fIndex,
      this.xZoom,
      this.xIndex,
      this.yZoom,
      this.yIndex,
      TZoomLevel.createUnchecked(TZoomLevel.MIN),
      0,
    );
  }

  /**
   * この ID が占める絶対秒区間 `[start, end)`（Unix 時刻）を返す。
   */
  public timeRange(): readonly [number, number] {
    const unit = this.tZoom.segmentSeconds();
    return [this.tIndex * unit, (this.tIndex + 1) * unit];
  }
}
