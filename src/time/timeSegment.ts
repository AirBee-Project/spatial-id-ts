import type { TZoomLevel } from "../spatial-id/zoomLevel.js";

/**
 * 時間軸の2分木で、2の冪秒の幅を持つ1ノード。{@link FlexId} の時間軸に対応する。
 *
 * @internal
 */
export class TimeSegment {
  /** ズームレベル（木の深さ）。 */
  public readonly zoom: TZoomLevel;
  /** このズームレベルにおけるインデックス。 */
  public readonly index: number;

  private constructor(zoom: TZoomLevel, index: number) {
    this.zoom = zoom;
    this.index = index;
  }

  /** 検証済みの値から {@link TimeSegment} を作る。 */
  public static of(zoom: TZoomLevel, index: number): TimeSegment {
    return new TimeSegment(zoom, index);
  }
}
