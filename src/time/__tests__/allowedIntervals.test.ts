import { describe, expect, it } from "vitest";
import { SpatialIdError } from "../../spatial-id/error.js";
import { AllowedIntervals } from "../allowedIntervals.js";
import { Interval } from "../interval.js";

const secondsOf = (intervals: AllowedIntervals) =>
  [...intervals].map((i) => i.seconds());

describe("AllowedIntervals", () => {
  it("WHOLE と SECOND を自動で加え、秒数の降順に並べる", () => {
    const intervals = AllowedIntervals.create([Interval.HOUR, 1800]);
    expect(secondsOf(intervals)).toEqual([Interval.MAX_SECONDS, 3600, 1800, 1]);
    expect(intervals.contains(Interval.WHOLE)).toBe(true);
    expect(intervals.contains(Interval.SECOND)).toBe(true);
    expect(intervals.contains(Interval.MINUTE)).toBe(false);
  });

  it("重複を取り除く", () => {
    const intervals = AllowedIntervals.create([
      Interval.HOUR,
      3600,
      Interval.SECOND,
    ]);
    expect(secondsOf(intervals)).toEqual([Interval.MAX_SECONDS, 3600, 1]);
  });

  it("calendar は暦の単位を持つ", () => {
    expect(secondsOf(AllowedIntervals.calendar())).toEqual([
      Interval.MAX_SECONDS,
      86_400,
      3600,
      60,
      1,
    ]);
  });

  it("不正な秒数は例外を投げる", () => {
    expect(() => AllowedIntervals.create([0])).toThrow(SpatialIdError);
  });
});
