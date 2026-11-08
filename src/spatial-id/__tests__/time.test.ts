import { describe, expect, it } from "vitest";
import { Interval } from "../../time/interval.js";
import { TimeSpan } from "../../time/timeSpan.js";
import { SpatialIdError } from "../error.js";
import { FlexId } from "../flexId.js";
import { RangeId } from "../rangeId.js";
import { SingleId } from "../singleId.js";
import { TZoomLevel } from "../zoomLevel.js";

function expectKind(fn: () => unknown, kind: SpatialIdError["info"]["kind"]) {
  try {
    fn();
    expect.unreachable();
  } catch (e) {
    expect(e).toBeInstanceOf(SpatialIdError);
    expect((e as SpatialIdError).info.kind).toBe(kind);
  }
}

describe("Interval.indexOf", () => {
  it("t = floor(u / i) を返す", () => {
    expect(Interval.create(1800).indexOf(1_457_482_000)).toBe(809712);
    expect(Interval.HOUR.indexOf(3599)).toBe(0);
    expect(Interval.HOUR.indexOf(3600)).toBe(1);
  });

  it("負の時刻や有限でない値はエラーを投げる", () => {
    expectKind(() => Interval.HOUR.indexOf(-1), "TOutOfRange");
    expectKind(() => Interval.HOUR.indexOf(Number.NaN), "TOutOfRange");
  });

  it("エラーには時刻ではなく計算後の t が入る", () => {
    try {
      Interval.HOUR.indexOf(-7200);
      expect.unreachable();
    } catch (e) {
      expect((e as SpatialIdError).info).toEqual({
        kind: "TOutOfRange",
        i: 3600,
        t: -2,
      });
    }
  });
});

describe("timeCleared / timeRange / timeContains", () => {
  it("timeCleared で全時間に戻る", () => {
    expect(
      SingleId.create(5, 3, 2, 10)
        .timeWith(3600, 5)
        .timeCleared()
        .timeIsWhole(),
    ).toBe(true);
    expect(
      RangeId.create(4, 0, 0, 0)
        .timeWith(Interval.HOUR, [0, 1])
        .timeCleared()
        .timeIsWhole(),
    ).toBe(true);
  });

  it("timeRange は終端を含まない絶対秒区間を返す", () => {
    expect(SingleId.create(5, 3, 2, 10).timeWith(3600, 5).timeRange()).toEqual([
      18_000, 21_600,
    ]);
    expect(
      RangeId.create(4, 0, 0, 0).timeWith(3600, [2, 4]).timeRange(),
    ).toEqual([7200, 18_000]);
  });

  it("全時間の ID は [0, 2^35] になる", () => {
    expect(SingleId.create(5, 3, 2, 10).timeRange()).toEqual([
      0,
      Interval.MAX_SECONDS,
    ]);
  });

  it("timeContains は始端を含み、終端を含まない", () => {
    const id = SingleId.create(5, 3, 2, 10).timeWith(3600, 5);
    expect(id.timeContains(18_000)).toBe(true);
    expect(id.timeContains(21_599)).toBe(true);
    expect(id.timeContains(21_600)).toBe(false);
    expect(id.timeContains(17_999)).toBe(false);
  });
});

describe("Interval の判定と変換", () => {
  it("equals は秒数で比べる", () => {
    expect(Interval.create(3600).equals(Interval.HOUR)).toBe(true);
    expect(Interval.create(3601).equals(Interval.HOUR)).toBe(false);
  });

  it("isPowerOfTwo は秒数が2の冪かを返す", () => {
    expect(Interval.create(1).isPowerOfTwo()).toBe(true);
    expect(Interval.create(1024).isPowerOfTwo()).toBe(true);
    expect(Interval.WHOLE.isPowerOfTwo()).toBe(true);
    expect(Interval.create(1800).isPowerOfTwo()).toBe(false);
    expect(Interval.HOUR.isPowerOfTwo()).toBe(false);
    expect(Interval.create(2 ** 35 - 1).isPowerOfTwo()).toBe(false);
  });

  it("asSegment は2の冪の秒数を時間軸の1Segmentへ直す", () => {
    const segment = Interval.create(1024).asSegment(7);
    expect(segment.zoom.value).toBe(25);
    expect(segment.index).toBe(7);
    expect(Interval.WHOLE.asSegment(0).zoom.value).toBe(0);
  });

  it("asSegment は2の冪でない秒数と範囲外のインデックスを拒む", () => {
    expectKind(() => Interval.create(1800).asSegment(0), "TIntervalError");
    expectKind(() => Interval.create(1024).asSegment(2 ** 25), "TOutOfRange");
  });

  it("fromZoom は Segment の幅を Interval として返す", () => {
    expect(Interval.fromZoom(TZoomLevel.create(25)).seconds()).toBe(1024);
    expect(Interval.fromZoom(TZoomLevel.create(0))).toBe(Interval.WHOLE);
  });

  it("validatedSpan は検証した絶対秒区間を返す", () => {
    const span = Interval.HOUR.validatedSpan(2, 4);
    expect(span.start).toBe(7200);
    expect(span.end).toBe(18_000);
    expectKind(
      () => Interval.HOUR.validatedSpan(2 ** 35, 2 ** 35),
      "TOutOfRange",
    );
  });
});

describe("TimeSpan", () => {
  it("toIntervalRange は最も粗い単位と t の範囲へ直す", () => {
    const [interval, tMin, tMax] = TimeSpan.create(
      1800,
      7200,
    ).toIntervalRange();
    expect(interval.seconds()).toBe(1800);
    expect([tMin, tMax]).toEqual([1, 3]);
  });

  it("不正な区間は TOutOfRange を投げる", () => {
    expectKind(() => TimeSpan.create(10, 10), "TOutOfRange");
    expectKind(() => TimeSpan.create(-1, 10), "TOutOfRange");
    expectKind(() => TimeSpan.create(0, 2 ** 35 + 1), "TOutOfRange");
  });
});

describe("FlexId の時間 Segment", () => {
  const base = FlexId.create(5, 3, 2, 3, 10, 1);

  it("withTimeSegment は TZoomLevel も受け付ける", () => {
    const byNumber = base.withTimeSegment(25, 7);
    const byZoom = base.withTimeSegment(TZoomLevel.create(25), 7);
    expect(byZoom.equals(byNumber)).toBe(true);
    const [start, end] = byZoom.timeRange();
    expect(end - start).toBe(1024);
  });

  it("withTimeSegment は秒数のつもりの値をズームの範囲外として拒む", () => {
    expectKind(() => base.withTimeSegment(3600, 0), "ZOutOfRange");
    expectKind(() => base.withTimeSegment(25, 2 ** 25), "TOutOfRange");
  });

  it("時間の幅は SingleId / RangeId では i、FlexId では timeRange で読める", () => {
    const single = SingleId.create(5, 3, 2, 10);
    expect(single.i).toBe(Interval.WHOLE);
    expect(single.timeWith(Interval.HOUR, 1).i).toBe(Interval.HOUR);
    expect(RangeId.create(5, 3, 2, 10).timeWith(1800, [1, 3]).i.seconds()).toBe(
      1800,
    );

    const [start, end] = base.withTimeSegment(25, 7).timeRange();
    expect(end - start).toBe(1024);
    expect(base.timeRange()).toEqual([0, Interval.MAX_SECONDS]);
  });
});

describe("Interval.MAX_POW", () => {
  it("MAX_SECONDS は 2^MAX_POW 秒で、時間軸の最大ズームレベルと等しい", () => {
    expect(Interval.MAX_POW).toBe(35);
    expect(Interval.MAX_POW).toBe(TZoomLevel.MAX);
    expect(Interval.MAX_SECONDS).toBe(2 ** Interval.MAX_POW);
  });
});
