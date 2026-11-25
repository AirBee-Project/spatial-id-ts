/// <reference types="node" />

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { SpatialIdMap } from "@airbee-project/spatial-id/collection";

const here = (path: string) => new URL(path, import.meta.url);

function load(name: string): SpatialIdMap<number> {
  const text = readFileSync(here(`./sample/riskmap/${name}`), "utf8");
  return SpatialIdMap.fromJSON<number>(JSON.parse(text));
}

function time<T>(label: string, f: () => T): T {
  const start = performance.now();
  const result = f();
  console.log(`${label}: ${(performance.now() - start).toFixed(0)} ms`);
  return result;
}

const tran = time("load tran_risk.json", () => load("tran_risk.json"));
const bldg = time("load bldg_risk.json", () => load("bldg_risk.json"));

const tranRisk = tran
  .query()
  .extrudeF(25, 0, 50, "max")
  .falloffX(25, 10, "max", { pattern: "quadraticIn" })
  .falloffY(25, 10, "max", { pattern: "quadraticIn" });

const bldgRisk = bldg
  .query()
  .extrudeF(25, 0, 50, "max")
  .falloffX(25, 10, "max", { pattern: "quadraticIn" })
  .falloffY(25, 10, "max", { pattern: "quadraticIn" });

const risk = time("query", () =>
  bldgRisk
    .merge(tranRisk, "max")
    .zoomOut(23, "average")
    .filterIn({ start: 0, end: 100 })
    .toMap(),
);
console.log(`result: ${risk.count()} entries`);

mkdirSync(here("./out/"), { recursive: true });
writeFileSync(here("./out/riskmap.json"), JSON.stringify(risk));
console.log("wrote playground/out/riskmap.json");
