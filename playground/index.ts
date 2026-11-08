import { SpatialIdMap } from "@airbee-project/kasane-client/collection";
import { RangeId } from "@airbee-project/kasane-client/spatial-id";

const map: SpatialIdMap<number> = SpatialIdMap.create();

const id = RangeId.create(10, [10, 11], 1, 3);

map.insert(id, 10);
