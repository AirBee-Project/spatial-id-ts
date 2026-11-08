use crate::codec::{decode, decode_intervals, encode_entries};
use js_sys::Array;
use spatial_id::collection::SpatialIdMap as Map;
use wasm_bindgen::prelude::*;

/// 値は JS の `===` で比べる（`JsValue` の `PartialEq`）。
#[wasm_bindgen]
#[derive(Default)]
pub struct SpatialIdMap(pub(crate) Map<JsValue>);

#[wasm_bindgen]
impl SpatialIdMap {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert(
        &mut self,
        id: &[f64],
        #[wasm_bindgen(unchecked_param_type = "unknown")] value: JsValue,
    ) -> Result<(), JsError> {
        self.0.insert(decode(id)?, value);
        Ok(())
    }

    #[wasm_bindgen(unchecked_return_type = "[Float64Array, unknown[]]")]
    pub fn get(&self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(self.0.get(decode(id)?)))
    }

    #[wasm_bindgen(unchecked_return_type = "[Float64Array, unknown[]]")]
    pub fn remove(&mut self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(self.0.remove(decode(id)?)))
    }

    #[wasm_bindgen(js_name = getFlexIds, unchecked_return_type = "[Float64Array, unknown[]]")]
    pub fn get_flex_ids(&self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(self.0.get_flex_ids(decode(id)?)))
    }

    #[wasm_bindgen(js_name = removeFlexIds, unchecked_return_type = "[Float64Array, unknown[]]")]
    pub fn remove_flex_ids(&mut self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(self.0.remove_flex_ids(decode(id)?)))
    }

    #[wasm_bindgen(js_name = getOverlapping, unchecked_return_type = "[Float64Array, unknown[]]")]
    pub fn get_overlapping(&self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(self.0.get_overlapping(decode(id)?)))
    }

    #[wasm_bindgen(
        js_name = getOverlappingFlexIds,
        unchecked_return_type = "[Float64Array, unknown[]]"
    )]
    pub fn get_overlapping_flex_ids(&self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(self.0.get_overlapping_flex_ids(decode(id)?)))
    }

    #[wasm_bindgen(
        js_name = removeOverlapping,
        unchecked_return_type = "[Float64Array, unknown[]]"
    )]
    pub fn remove_overlapping(&mut self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(self.0.remove_overlapping(decode(id)?)))
    }

    #[wasm_bindgen(
        js_name = removeOverlappingFlexIds,
        unchecked_return_type = "[Float64Array, unknown[]]"
    )]
    pub fn remove_overlapping_flex_ids(&mut self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(
            self.0.remove_overlapping_flex_ids(decode(id)?),
        ))
    }

    #[wasm_bindgen(
        js_name = spatialFaceNeighbors,
        unchecked_return_type = "[Float64Array, unknown[]]"
    )]
    pub fn spatial_face_neighbors(&self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(self.0.spatial_face_neighbors(decode(id)?)))
    }

    #[wasm_bindgen(
        js_name = spatialFaceNeighborsFlexIds,
        unchecked_return_type = "[Float64Array, unknown[]]"
    )]
    pub fn spatial_face_neighbors_flex_ids(&self, id: &[f64]) -> Result<Array, JsError> {
        Ok(encode_entries(
            self.0.spatial_face_neighbors_flex_ids(decode(id)?),
        ))
    }

    #[wasm_bindgen(
        js_name = reconstructedTimeRanges,
        unchecked_return_type = "[Float64Array, unknown[]]"
    )]
    pub fn reconstructed_time_ranges(
        &self,
        allowed_intervals: Option<Vec<f64>>,
    ) -> Result<Array, JsError> {
        let allowed_intervals = decode_intervals(allowed_intervals)?;
        Ok(encode_entries(
            self.0.reconstructed_time_ranges(allowed_intervals.as_ref()),
        ))
    }

    #[wasm_bindgen(js_name = flatSingleIds, unchecked_return_type = "[Float64Array, unknown[]]")]
    pub fn flat_single_ids(&self, allowed_intervals: Option<Vec<f64>>) -> Result<Array, JsError> {
        let allowed_intervals = decode_intervals(allowed_intervals)?;
        Ok(encode_entries(
            self.0.flat_single_ids(allowed_intervals.as_ref()),
        ))
    }

    pub fn union(&self, other: &SpatialIdMap) -> SpatialIdMap {
        Self(self.0.union(&other.0))
    }

    pub fn intersection(&self, other: &SpatialIdMap) -> SpatialIdMap {
        Self(self.0.intersection(&other.0))
    }

    pub fn difference(&self, other: &SpatialIdMap) -> SpatialIdMap {
        Self(self.0.difference(&other.0))
    }

    pub fn count(&self) -> usize {
        self.0.count()
    }

    #[wasm_bindgen(js_name = isEmpty)]
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    pub fn clear(&mut self) {
        self.0.clear();
    }

    #[wasm_bindgen(unchecked_return_type = "[Float64Array, unknown[]]")]
    pub fn entries(&self) -> Array {
        encode_entries(self.0.iter())
    }

    #[wasm_bindgen(js_name = flexEntries, unchecked_return_type = "[Float64Array, unknown[]]")]
    pub fn flex_entries(&self) -> Array {
        encode_entries(self.0.iter_flex_ids())
    }
}
