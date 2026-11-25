import { describe, expect, it } from "vitest";
import { RangeId } from "../../spatial-id/rangeId.js";
import { SingleId } from "../../spatial-id/singleId.js";
import { SpatialIdMap } from "../spatialIdMap.js";
import { SpatialIdSet } from "../spatialIdSet.js";

/** z=20 の f=0、y=0 の行の、x 番目の ID。 */
function at(x: number): SingleId {
  return SingleId.create(20, 0, x, 0);
}

/** z=20 の f=0、y=0 の行から、`x -> value` の対応を取り出す。 */
function row<V>(entries: Iterable<[RangeId, V]>): Map<number, V> {
  const out = new Map<number, V>();
  for (const [id, value] of entries) {
    for (const single of id.singleIds()) {
      if (single.z === 20 && single.f === 0 && single.y === 0) {
        out.set(single.x, value);
      }
    }
  }
  return new Map([...out].sort(([a], [b]) => a - b));
}

/** 分け方によらず比べられるよう、SingleId の文字列に展開して並べる。 */
function ids(entries: Iterable<[RangeId, unknown] | RangeId>): string[] {
  return [...entries]
    .flatMap((e) => [...(Array.isArray(e) ? e[0] : e).singleIds()].map(String))
    .sort();
}

function mapOf(entries: [number, number][]): SpatialIdMap<number> {
  return new SpatialIdMap(entries.map(([x, v]) => [at(x), v]));
}

describe("Query の単項演算", () => {
  it("shiftX は X 方向へ平行移動する", () => {
    const out = mapOf([[100, 4]])
      .query()
      .shiftX(20, 3)
      .get();
    expect(row(out)).toEqual(new Map([[103, 4]]));
  });

  it("shiftFxy は shiftF、shiftX、shiftY を続けたものと同じ", () => {
    const map = new SpatialIdMap<number>([
      [SingleId.create(6, 3, 10, 20), 1],
      [RangeId.create(5, [-2, 1], [0, 3], 7), 2],
    ]);
    const fused = map.query().shiftFxy(6, 2, 5, -1).get();
    const chained = map.query().shiftF(6, 2).shiftX(6, 5).shiftY(6, -1).get();
    expect(ids(fused)).toEqual(ids(chained));
  });

  it("falloffX は距離に比例して値を減らす", () => {
    const out = mapOf([[100, 4]])
      .query()
      .falloffX(20, 2, "sum")
      .get();
    expect(row(out)).toEqual(
      new Map([
        [98, 0],
        [99, 2],
        [100, 4],
        [101, 2],
        [102, 0],
      ]),
    );
  });

  it("falloffX は重なる値を policy でまとめる", () => {
    const map = mapOf([
      [100, 4],
      [102, 4],
    ]);
    expect(row(map.query().falloffX(20, 2, "sum").get()).get(101)).toBe(4);
    expect(row(map.query().falloffX(20, 2, "max").get()).get(101)).toBe(2);
  });

  it("falloffX は direction で片側にだけ広げる", () => {
    const out = mapOf([[100, 4]])
      .query()
      .falloffX(20, 2, "sum", { direction: "upper" })
      .get();
    expect([...row(out).keys()]).toEqual([100, 101, 102]);
  });

  it("zoomOut は子の値を policy でまとめる", () => {
    const children = [
      [0, 0, 0, 10],
      [0, 0, 1, 20],
      [0, 1, 0, 30],
      [0, 1, 1, 40],
      [1, 0, 0, 50],
      [1, 0, 1, 60],
      [1, 1, 0, 70],
      [1, 1, 1, 80],
    ] as const;
    const map = new SpatialIdMap<number>(
      children.map(([f, x, y, v]) => [SingleId.create(20, f, x, y), v]),
    );
    const parent = SingleId.create(19, 0, 0, 0);
    expect(map.query().zoomOut(19, "average").toMap().get(parent)[0]?.[1]).toBe(
      45,
    );
    expect(map.query().zoomOut(19, "max").toMap().get(parent)[0]?.[1]).toBe(80);
  });

  it("zoomOut は数値でない値も overwrite でまとめられる", () => {
    const map = new SpatialIdMap<string>([[SingleId.create(20, 0, 0, 0), "a"]]);
    const out = map.query().zoomOut(19, "overwrite").get();
    expect(out.map(([id, v]) => [String(id), v])).toEqual([["19/0/0/0", "a"]]);
  });

  it("extrudeX は X の範囲へ引き延ばす", () => {
    const out = mapOf([[100, 4]])
      .query()
      .extrudeX(20, 100, 102, "overwrite")
      .get();
    expect(row(out)).toEqual(
      new Map([
        [100, 4],
        [101, 4],
        [102, 4],
      ]),
    );
  });

  it("filterEq、filterIn、filterNotIn は値で絞り込む", () => {
    const map = mapOf([
      [0, 10],
      [1, 40],
      [2, 70],
      [3, 80],
    ]);
    expect([...row(map.query().filterEq(70).get()).keys()]).toEqual([2]);
    expect([
      ...row(map.query().filterIn({ start: 40, end: 80 }).get()).keys(),
    ]).toEqual([1, 2]);
    expect([
      ...row(map.query().filterNotIn({ start: 40, end: 80 }).get()).keys(),
    ]).toEqual([0, 3]);
    expect([...row(map.query().filterIn({ end: 40 }).get()).keys()]).toEqual([
      0,
    ]);
  });
});

describe("Query の値の変換", () => {
  it("mapValues は値を別の型へ写す", () => {
    const out = mapOf([[0, 1]])
      .query()
      .mapValues((v) => `v${v}`)
      .get();
    expect([...row(out).values()]).toEqual(["v1"]);
  });

  it("filterMapValues は undefined を返した要素を取り除く", () => {
    const out = mapOf([
      [0, 1],
      [1, 15],
    ])
      .query()
      .filterMapValues((v) => (v > 10 ? String(v) : undefined))
      .get();
    expect(row(out)).toEqual(new Map([[1, "15"]]));
  });

  it("filter と map は FlexId を受け取る", () => {
    const map = mapOf([
      [0, 1],
      [1, 2],
    ]);
    const kept = map
      .query()
      .filter((id) => id.xIndex === 1)
      .get();
    expect(row(kept)).toEqual(new Map([[1, 2]]));
    const mapped = map
      .query()
      .map((id, v) => id.xIndex * 10 + v)
      .get();
    expect(row(mapped)).toEqual(
      new Map([
        [0, 1],
        [1, 12],
      ]),
    );
  });

  it("写した値に数値の演算を続けられる", () => {
    const out = new SpatialIdMap<string>([[at(100), "4"]])
      .query()
      .mapValues(Number)
      .falloffX(20, 2, "sum")
      .get();
    expect(row(out).get(99)).toBe(2);
  });
});

describe("Query の二項演算", () => {
  const a = mapOf([
    [100, 7],
    [101, 3],
  ]);
  const b = mapOf([
    [101, 4],
    [102, 5],
  ]);

  it("merge は重なる部分を policy でまとめ、片側だけの部分を残す", () => {
    expect(row(a.query().merge(b.query(), "sum").get())).toEqual(
      new Map([
        [100, 7],
        [101, 7],
        [102, 5],
      ]),
    );
  });

  it("merge にはコレクションをそのまま渡せる", () => {
    expect(row(a.query().merge(b, "keepExisting").get()).get(101)).toBe(3);
  });

  it("intersection と difference は値の型が異なる相手を受け付ける", () => {
    const set = new SpatialIdSet([at(101), at(102)]);
    expect(row(a.query().intersection(set).get())).toEqual(new Map([[101, 3]]));
    expect(row(a.query().difference(set).get())).toEqual(new Map([[100, 7]]));
    const names = new SpatialIdMap<string>([[at(100), "x"]]);
    expect(row(a.query().difference(names).get())).toEqual(new Map([[101, 3]]));
  });
});

describe("Query の評価", () => {
  const map = mapOf([
    [100, 1],
    [101, 2],
  ]);

  it("同じ Query を何度でも評価し、分岐できる", () => {
    const base = map.query().shiftX(20, 1);
    expect(row(base.get())).toEqual(row(base.get()));
    expect([...row(base.shiftX(20, 1).get()).keys()]).toEqual([102, 103]);
    expect([...row(base.get()).keys()]).toEqual([101, 102]);
  });

  it("入力のコレクションは評価した時点の中身を使う", () => {
    const source = mapOf([[0, 1]]);
    const query = source.query();
    source.insert(at(1), 2);
    expect([...row(query.get()).keys()]).toEqual([0, 1]);
  });

  it("get は targets で切り取り、getOverlapping は切り取らない", () => {
    const wide = new SpatialIdMap<number>([
      [RangeId.create(20, 0, [0, 3], 0), 1],
    ]);
    expect(ids(wide.query().get(at(1)))).toEqual(["20/0/1/0"]);
    expect(ids(wide.query().getOverlapping(at(1)))).toEqual(
      ids(wide.query().get()),
    );
    expect(ids(wide.query().get([at(0), at(3)]))).toEqual([
      "20/0/0/0",
      "20/0/3/0",
    ]);
  });

  it("toSet は値を捨てた集合を返す", () => {
    expect(ids(map.query().toSet())).toEqual(ids(map.query().get()));
  });

  it("SpatialIdSet の Query の値は undefined", () => {
    const out = new SpatialIdSet([at(0)]).query().shiftX(20, 1).get();
    expect(out.map(([id, v]) => [String(id), v])).toEqual([
      ["20/0/1/0", undefined],
    ]);
  });

  it("validate は不正なパラメーターで例外を投げる", () => {
    expect(() => map.query().shiftX(31, 1).validate()).toThrow();
    expect(() => map.query().shiftX(20, 1).validate()).not.toThrow();
  });

  it("数値の演算で、安全な整数でない値は TypeError を投げる", () => {
    const halves = mapOf([[0, 1.5]]);
    expect(() => halves.query().falloffX(20, 2, "sum").get()).toThrow(
      TypeError,
    );
  });

  it("コールバックが投げた例外をそのまま投げる", () => {
    const error = new Error("boom");
    expect(() =>
      map
        .query()
        .mapValues(() => {
          throw error;
        })
        .get(),
    ).toThrow(error);
  });

  it("解放したコレクションの Query は評価で例外を投げる", () => {
    const source = mapOf([[0, 1]]);
    const query = source.query();
    source[Symbol.dispose]();
    expect(() => query.get()).toThrow();
  });
});

describe("Query の型", () => {
  it("値が数値でない Query には、数値の演算と規則を使えない", () => {
    // 評価しないので、型の検査だけを確かめる
    const names = new SpatialIdMap<string>().query();
    // @ts-expect-error 数値の規則は数値の Query でだけ使える
    names.zoomOut(19, "sum");
    // @ts-expect-error 減衰は数値の Query でだけ使える
    names.falloffX(20, 1, "max");
    // @ts-expect-error 値の範囲での絞り込みは数値の Query でだけ使える
    names.filterIn({ start: 0 });
    names.zoomOut(19, "keepExisting");
  });
});
