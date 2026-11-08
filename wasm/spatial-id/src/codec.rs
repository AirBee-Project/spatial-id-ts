//! JS とやりとりする数値列と、spatial-id-rs の型を相互に変換する。
//!
//! - 受け取る ID と、RangeId で返す ID: `[z, f0, f1, x0, x1, y0, y1, i, t0, t1]`
//! - FlexId で返す ID: `[fz, f, xz, x, yz, y, tz, t]`
//! - SingleId で返す ID: `[z, f, x, y, i, t]`
//!
//! 複数の ID を返すときは、1つ分の数値列を連ねる。
//! `AllowedIntervals` は候補の秒数の列で受け取り、省略すると `None` として扱う。

use js_sys::{Array, Float64Array};
use spatial_id::time::{AllowedIntervals, Interval};
use spatial_id::{FlexId, RangeId, SingleId};
use wasm_bindgen::prelude::*;

fn to_js_error(e: spatial_id::Error) -> JsError {
    JsError::new(&e.to_string())
}

pub(crate) fn decode(id: &[f64]) -> Result<RangeId, JsError> {
    let &[z, f0, f1, x0, x1, y0, y1, i, t0, t1] = id else {
        return Err(JsError::new("a spatial id must have 10 numbers"));
    };
    RangeId::new(
        z as u8,
        [f0 as i32, f1 as i32],
        [x0 as u32, x1 as u32],
        [y0 as u32, y1 as u32],
    )
    .and_then(|id| id.time_with(i as u64, [t0 as u64, t1 as u64]))
    .map_err(to_js_error)
}

pub(crate) fn decode_intervals(
    seconds: Option<Vec<f64>>,
) -> Result<Option<AllowedIntervals>, JsError> {
    seconds
        .map(|seconds| {
            seconds
                .into_iter()
                .map(|s| Interval::new(s as u64))
                .collect::<Result<Vec<_>, _>>()
                .map(AllowedIntervals::new)
                .map_err(to_js_error)
        })
        .transpose()
}

pub(crate) trait Encode {
    fn encode(self, out: &mut Vec<f64>);
}

impl Encode for RangeId {
    fn encode(self, out: &mut Vec<f64>) {
        let [f0, f1] = self.f();
        let [x0, x1] = self.x();
        let [y0, y1] = self.y();
        let [t0, t1] = self.t();
        out.extend([
            self.z().into(),
            f0.into(),
            f1.into(),
            x0.into(),
            x1.into(),
            y0.into(),
            y1.into(),
            self.i().seconds() as f64,
            t0 as f64,
            t1 as f64,
        ]);
    }
}

impl Encode for FlexId {
    fn encode(self, out: &mut Vec<f64>) {
        out.extend([
            self.f_zoomlevel().into(),
            self.f_index().into(),
            self.x_zoomlevel().into(),
            self.x_index().into(),
            self.y_zoomlevel().into(),
            self.y_index().into(),
            self.t_zoomlevel().into(),
            self.t_index() as f64,
        ]);
    }
}

impl Encode for SingleId {
    fn encode(self, out: &mut Vec<f64>) {
        out.extend([
            self.z().into(),
            self.f().into(),
            self.x().into(),
            self.y().into(),
            self.i().seconds() as f64,
            self.t() as f64,
        ]);
    }
}

pub(crate) fn encode_ids(ids: impl Iterator<Item = impl Encode>) -> Vec<f64> {
    let mut out = Vec::new();
    ids.for_each(|id| id.encode(&mut out));
    out
}

/// `[ID の数値列, 値の配列]` を返す。
pub(crate) fn encode_entries<V: AsRef<JsValue>>(
    entries: impl Iterator<Item = (impl Encode, V)>,
) -> Array {
    let mut ids = Vec::new();
    let values = Array::new();
    for (id, value) in entries {
        id.encode(&mut ids);
        values.push(value.as_ref());
    }
    Array::of2(&Float64Array::from(ids.as_slice()), &values)
}
