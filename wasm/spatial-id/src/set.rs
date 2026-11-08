use crate::codec::{decode, decode_intervals, encode_ids};
use crate::map::SpatialIdMap;
use spatial_id::collection::SpatialIdSet as Set;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Default)]
pub struct SpatialIdSet(Set);

#[wasm_bindgen]
impl SpatialIdSet {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    #[wasm_bindgen(js_name = fromMap)]
    pub fn from_map(map: &SpatialIdMap) -> SpatialIdSet {
        Self(Set::from(&map.0))
    }

    pub fn insert(&mut self, id: &[f64]) -> Result<(), JsError> {
        self.0.insert(decode(id)?);
        Ok(())
    }

    pub fn get(&self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(self.0.get(decode(id)?)))
    }

    pub fn remove(&mut self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(self.0.remove(decode(id)?)))
    }

    #[wasm_bindgen(js_name = getFlexIds)]
    pub fn get_flex_ids(&self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(self.0.get_flex_ids(decode(id)?)))
    }

    #[wasm_bindgen(js_name = removeFlexIds)]
    pub fn remove_flex_ids(&mut self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(self.0.remove_flex_ids(decode(id)?)))
    }

    #[wasm_bindgen(js_name = getOverlapping)]
    pub fn get_overlapping(&self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(self.0.get_overlapping(decode(id)?)))
    }

    #[wasm_bindgen(js_name = getOverlappingFlexIds)]
    pub fn get_overlapping_flex_ids(&self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(self.0.get_overlapping_flex_ids(decode(id)?)))
    }

    #[wasm_bindgen(js_name = removeOverlapping)]
    pub fn remove_overlapping(&mut self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(self.0.remove_overlapping(decode(id)?)))
    }

    #[wasm_bindgen(js_name = removeOverlappingFlexIds)]
    pub fn remove_overlapping_flex_ids(&mut self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(self.0.remove_overlapping_flex_ids(decode(id)?)))
    }

    #[wasm_bindgen(js_name = spatialFaceNeighbors)]
    pub fn spatial_face_neighbors(&self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(self.0.spatial_face_neighbors(decode(id)?)))
    }

    #[wasm_bindgen(js_name = spatialFaceNeighborsFlexIds)]
    pub fn spatial_face_neighbors_flex_ids(&self, id: &[f64]) -> Result<Vec<f64>, JsError> {
        Ok(encode_ids(
            self.0.spatial_face_neighbors_flex_ids(decode(id)?),
        ))
    }

    #[wasm_bindgen(js_name = reconstructedTimeRanges)]
    pub fn reconstructed_time_ranges(
        &self,
        allowed_intervals: Option<Vec<f64>>,
    ) -> Result<Vec<f64>, JsError> {
        let allowed_intervals = decode_intervals(allowed_intervals)?;
        Ok(encode_ids(
            self.0.reconstructed_time_ranges(allowed_intervals.as_ref()),
        ))
    }

    #[wasm_bindgen(js_name = flatSingleIds)]
    pub fn flat_single_ids(
        &self,
        allowed_intervals: Option<Vec<f64>>,
    ) -> Result<Vec<f64>, JsError> {
        let allowed_intervals = decode_intervals(allowed_intervals)?;
        Ok(encode_ids(
            self.0.flat_single_ids(allowed_intervals.as_ref()),
        ))
    }

    pub fn union(&self, other: &SpatialIdSet) -> SpatialIdSet {
        Self(&self.0 | &other.0)
    }

    pub fn intersection(&self, other: &SpatialIdSet) -> SpatialIdSet {
        Self(&self.0 & &other.0)
    }

    pub fn difference(&self, other: &SpatialIdSet) -> SpatialIdSet {
        Self(&self.0 - &other.0)
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

    pub fn ids(&self) -> Vec<f64> {
        encode_ids(self.0.iter())
    }

    #[wasm_bindgen(js_name = flexIds)]
    pub fn flex_ids(&self) -> Vec<f64> {
        encode_ids(self.0.iter_flex_ids())
    }
}
