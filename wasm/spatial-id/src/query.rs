//! spatial-id-rs の `Query` を JS から組み立てて評価する。
//!
//! JS は演算を後置記法で積む（入力を積んでから演算を呼ぶ）。評価するメソッドは自身を消費するので、
//! 1つの [`Query`] は1回だけ評価できる。
//!
//! 値はプリミティブ（[`Value`]）で持ち、数値の演算の手前でだけ `i64` に直す。
//! spatial-id-rs の数値の演算は `Ord` や `TryFrom<u64>` を求め、`f64` では使えないためである。

use crate::codec::{Encode, decode_all, encode_entries};
use crate::map::SpatialIdMap;
use crate::set::SpatialIdSet;
use crate::value::{Failure, Local, Value};
use js_sys::{Array, Float64Array, Function, RangeError, TypeError};
use spatial_id::query::merge_policy::{
    Average, KeepExisting, Max, Min, Overwrite, SaturatingSub, Sum,
};
use spatial_id::query::{FalloffPattern, Query as Inner, Source};
use spatial_id::{FlexId, RangeId, Side};
use std::ops::Bound;
use wasm_bindgen::prelude::*;

const MAX_SAFE_INTEGER: f64 = 9_007_199_254_740_991.0;

enum Node {
    Js(Inner<Value>),
    Int(Inner<i64>),
}

#[derive(Clone, Copy)]
enum Policy {
    Overwrite,
    KeepExisting,
    Sum,
    Max,
    Min,
    Average,
    SaturatingSub,
}

impl Policy {
    fn decode(code: u8) -> Result<Self, JsError> {
        Ok(match code {
            0 => Self::Overwrite,
            1 => Self::KeepExisting,
            2 => Self::Sum,
            3 => Self::Max,
            4 => Self::Min,
            5 => Self::Average,
            6 => Self::SaturatingSub,
            _ => return Err(JsError::new("unknown merge policy")),
        })
    }

    fn numeric(self) -> bool {
        !matches!(self, Self::Overwrite | Self::KeepExisting)
    }
}

/// 値の型を問わない規則を `$p` に束縛して `$body` を評価する。
macro_rules! any_policy {
    ($policy:expr, $p:ident => $body:expr) => {
        match $policy {
            Policy::Overwrite => {
                let $p = Overwrite;
                $body
            }
            Policy::KeepExisting => {
                let $p = KeepExisting;
                $body
            }
            _ => unreachable!("数値の規則は Int に直してから使う"),
        }
    };
}

/// すべての規則を `$p` に束縛して `$body` を評価する。
macro_rules! int_policy {
    ($policy:expr, $p:ident => $body:expr) => {
        match $policy {
            Policy::Overwrite => {
                let $p = Overwrite;
                $body
            }
            Policy::KeepExisting => {
                let $p = KeepExisting;
                $body
            }
            Policy::Sum => {
                let $p = Sum;
                $body
            }
            Policy::Max => {
                let $p = Max;
                $body
            }
            Policy::Min => {
                let $p = Min;
                $body
            }
            Policy::Average => {
                let $p = Average;
                $body
            }
            Policy::SaturatingSub => {
                let $p = SaturatingSub;
                $body
            }
        }
    };
}

fn integer<T: TryFrom<i64>>(value: f64, name: &str) -> Result<T, JsError> {
    let n = (value.fract() == 0.0 && value.abs() <= MAX_SAFE_INTEGER).then_some(value as i64);
    n.and_then(|n| T::try_from(n).ok())
        .ok_or_else(|| JsError::new(&format!("{name} is out of range: {value}")))
}

fn safe_integer(value: &Value) -> Option<i64> {
    match *value {
        Value::Number(n) if n.fract() == 0.0 && n.abs() <= MAX_SAFE_INTEGER => Some(n as i64),
        _ => None,
    }
}

fn falloff_pattern(code: u8) -> Result<FalloffPattern, JsError> {
    Ok(match code {
        0 => FalloffPattern::Linear,
        1 => FalloffPattern::QuadraticIn,
        2 => FalloffPattern::QuadraticOut,
        _ => return Err(JsError::new("unknown falloff pattern")),
    })
}

fn side(code: Option<u8>) -> Result<Option<Side>, JsError> {
    Ok(match code {
        None => None,
        Some(0) => Some(Side::Lower),
        Some(1) => Some(Side::Upper),
        Some(_) => return Err(JsError::new("unknown direction")),
    })
}

fn encode_flex_id(id: FlexId) -> Float64Array {
    let mut out = Vec::with_capacity(8);
    id.encode(&mut out);
    Float64Array::from(out.as_slice())
}

#[wasm_bindgen]
#[derive(Default)]
pub struct Query {
    stack: Vec<Node>,
    failure: Failure,
}

impl Query {
    fn pop(&mut self) -> Result<Node, JsError> {
        self.stack
            .pop()
            .ok_or_else(|| JsError::new("the query has no input"))
    }

    fn single(&mut self) -> Result<Node, JsError> {
        let node = self.pop()?;
        if !self.stack.is_empty() {
            return Err(JsError::new("the query has unused inputs"));
        }
        Ok(node)
    }

    fn to_int(&self, node: Node) -> Inner<i64> {
        match node {
            Node::Int(q) => q,
            Node::Js(q) => {
                let failure = self.failure.clone();
                q.try_filter_map_values(move |v: Value| {
                    safe_integer(&v).map(Some).ok_or_else(|| {
                        failure.fail(
                            TypeError::new("a numeric query value must be a safe integer").into(),
                        )
                    })
                })
            }
        }
    }

    fn to_js(&self, node: Node) -> Inner<Value> {
        match node {
            Node::Js(q) => q,
            Node::Int(q) => {
                let failure = self.failure.clone();
                q.try_filter_map_values(move |n: i64| {
                    let f = n as f64;
                    if f.abs() > MAX_SAFE_INTEGER {
                        return Err(failure.fail(
                            RangeError::new("a query value exceeds the safe integer range").into(),
                        ));
                    }
                    Ok(Some(Value::Number(f)))
                })
            }
        }
    }

    fn pop_for(&mut self, policy: Policy) -> Result<Node, JsError> {
        let node = self.pop()?;
        Ok(if policy.numeric() {
            Node::Int(self.to_int(node))
        } else {
            node
        })
    }

    /// 評価中に覚えた JS 側の失敗があればそれを、なければ評価の結果を返す。
    fn finish<T>(&self, result: Result<T, spatial_id::Error>) -> Result<T, JsValue> {
        if let Some(error) = self.failure.take() {
            return Err(error);
        }
        result.map_err(|e| JsError::new(&e.to_string()).into())
    }
}

#[wasm_bindgen]
impl Query {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    #[wasm_bindgen(js_name = pushMap)]
    pub fn push_map(&mut self, map: &SpatialIdMap) {
        // 木の節は参照カウントで共有されるので、複製は根だけで済む
        self.stack.push(Node::Js(map.0.clone().query()));
    }

    #[wasm_bindgen(js_name = pushSet)]
    pub fn push_set(&mut self, set: &SpatialIdSet) {
        self.stack.push(Node::Js(
            set.0.clone().query().map_values(|()| Value::Undefined),
        ));
    }

    pub fn shift(&mut self, z: f64, f: f64, x: f64, y: f64) -> Result<(), JsError> {
        let z: u8 = integer(z, "z")?;
        let (f, x, y): (i32, i32, i32) = (integer(f, "f")?, integer(x, "x")?, integer(y, "y")?);
        let node = match self.pop()? {
            Node::Js(q) => Node::Js(q.shift_fxy(z, f, x, y)),
            Node::Int(q) => Node::Int(q.shift_fxy(z, f, x, y)),
        };
        self.stack.push(node);
        Ok(())
    }

    #[wasm_bindgen(js_name = zoomOut)]
    pub fn zoom_out(&mut self, z: f64, policy: u8) -> Result<(), JsError> {
        let z: u8 = integer(z, "z")?;
        let policy = Policy::decode(policy)?;
        let node = match self.pop_for(policy)? {
            Node::Js(q) => Node::Js(any_policy!(policy, p => q.zoom_out(z, p))),
            Node::Int(q) => Node::Int(int_policy!(policy, p => q.zoom_out(z, p))),
        };
        self.stack.push(node);
        Ok(())
    }

    /// `axis` は 0 が F、1 が X、2 が Y。
    pub fn extrude(
        &mut self,
        axis: u8,
        z: f64,
        start: f64,
        end: f64,
        policy: u8,
    ) -> Result<(), JsError> {
        let z: u8 = integer(z, "z")?;
        let policy = Policy::decode(policy)?;
        macro_rules! extrude {
            ($q:expr, $p:ident) => {
                match axis {
                    0 => $q.extrude_f(z, integer(start, "start")?, integer(end, "end")?, $p),
                    1 => $q.extrude_x(z, integer(start, "start")?, integer(end, "end")?, $p),
                    2 => $q.extrude_y(z, integer(start, "start")?, integer(end, "end")?, $p),
                    _ => return Err(JsError::new("unknown axis")),
                }
            };
        }
        let node = match self.pop_for(policy)? {
            Node::Js(q) => Node::Js(any_policy!(policy, p => extrude!(q, p))),
            Node::Int(q) => Node::Int(int_policy!(policy, p => extrude!(q, p))),
        };
        self.stack.push(node);
        Ok(())
    }

    /// `axis` は 0 が F、1 が X、2 が Y。`direction` は 0 が座標の小さい側、1 が大きい側で、省くと両側。
    pub fn falloff(
        &mut self,
        axis: u8,
        z: f64,
        radius: f64,
        direction: Option<u8>,
        pattern: u8,
        policy: u8,
    ) -> Result<(), JsError> {
        let z: u8 = integer(z, "z")?;
        let radius: u32 = integer(radius, "radius")?;
        let direction = side(direction)?;
        let pattern = falloff_pattern(pattern)?;
        let policy = Policy::decode(policy)?;
        let node = self.pop()?;
        let q = self.to_int(node);
        let q = int_policy!(policy, p => match axis {
            0 => q.falloff_f(z, radius, direction, pattern, p),
            1 => q.falloff_x(z, radius, direction, pattern, p),
            2 => q.falloff_y(z, radius, direction, pattern, p),
            _ => return Err(JsError::new("unknown axis")),
        });
        self.stack.push(Node::Int(q));
        Ok(())
    }

    /// `kind` は 0 が `start` と等しい値、1 が `[start, end)` に入る値、2 が `[start, end)` の外の値を残す。
    /// 範囲の `start` と `end` を省くと、その側に端を設けない。
    #[wasm_bindgen(js_name = filterNumbers)]
    pub fn filter_numbers(
        &mut self,
        kind: u8,
        start: Option<f64>,
        end: Option<f64>,
    ) -> Result<(), JsError> {
        let bound = |value: Option<f64>, name: &str, make: fn(i64) -> Bound<i64>| {
            value.map_or(Ok(Bound::Unbounded), |v| integer(v, name).map(make))
        };
        let range = (
            bound(start, "start", Bound::Included)?,
            bound(end, "end", Bound::Excluded)?,
        );
        let node = self.pop()?;
        let q = self.to_int(node);
        let q = match kind {
            0 => q.filter_eq(integer(start.unwrap_or(f64::NAN), "value")?),
            1 => q.filter_in(range),
            2 => q.filter_not_in(range),
            _ => return Err(JsError::new("unknown filter")),
        };
        self.stack.push(Node::Int(q));
        Ok(())
    }

    /// `kind` は 0 が filter、1 が map、2 が filterMap。filterMap は `undefined` を返した要素を取り除く。
    ///
    /// `withId` のとき `f` は `(flexId, value)`、そうでなければ `(value)` を受け取る。
    /// `flexId` は `[fz, f, xz, x, yz, y, tz, t]` の数値列。
    pub fn transform(&mut self, kind: u8, with_id: bool, f: Function) -> Result<(), JsError> {
        let node = self.pop()?;
        let q = self.to_js(node);
        let failure = self.failure.clone();
        let f = Local(f);
        let call = move |id: FlexId, value: &Value| -> Result<JsValue, JsValue> {
            let js = value.to_js();
            if with_id {
                f.0.call2(&JsValue::UNDEFINED, &encode_flex_id(id), &js)
            } else {
                f.0.call1(&JsValue::UNDEFINED, &js)
            }
        };
        let q = match kind {
            0 => q.try_filter_map(move |id, value| {
                call(id, &value)
                    .map(|r| r.is_truthy().then_some(value))
                    .map_err(|e| failure.fail(e))
            }),
            1 => q.try_filter_map(move |id, value| {
                call(id, &value)
                    .and_then(|v| Value::try_from(&v))
                    .map(Some)
                    .map_err(|e| failure.fail(e))
            }),
            2 => q.try_filter_map(move |id, value| {
                call(id, &value)
                    .and_then(|v| {
                        if v.is_undefined() {
                            Ok(None)
                        } else {
                            Value::try_from(&v).map(Some)
                        }
                    })
                    .map_err(|e| failure.fail(e))
            }),
            _ => return Err(JsError::new("unknown transform")),
        };
        self.stack.push(Node::Js(q));
        Ok(())
    }

    /// 積んだ2つを `policy` で重ね合わせる。
    pub fn merge(&mut self, policy: u8) -> Result<(), JsError> {
        let policy = Policy::decode(policy)?;
        let rhs = self.pop()?;
        let lhs = self.pop()?;
        let node = if policy.numeric() || matches!((&lhs, &rhs), (Node::Int(_), Node::Int(_))) {
            let (lhs, rhs) = (self.to_int(lhs), self.to_int(rhs));
            Node::Int(int_policy!(policy, p => lhs.merge(rhs, p)))
        } else {
            let (lhs, rhs) = (self.to_js(lhs), self.to_js(rhs));
            Node::Js(any_policy!(policy, p => lhs.merge(rhs, p)))
        };
        self.stack.push(node);
        Ok(())
    }

    /// `kind` は 0 が intersection、1 が difference。左側の値を残すので、右側の値は左側の型の値に置き換えてから重ねる。
    pub fn binary(&mut self, kind: u8) -> Result<(), JsError> {
        let rhs = self.pop()?;
        let lhs = self.pop()?;
        macro_rules! apply {
            ($lhs:expr, $rhs:expr) => {
                match kind {
                    0 => $lhs.intersection($rhs),
                    1 => $lhs.difference($rhs),
                    _ => return Err(JsError::new("unknown binary operator")),
                }
            };
        }
        let node = match (lhs, rhs) {
            (Node::Js(l), Node::Js(r)) => Node::Js(apply!(l, r)),
            (Node::Int(l), Node::Int(r)) => Node::Int(apply!(l, r)),
            (Node::Js(l), Node::Int(r)) => Node::Js(apply!(l, r.map_values(|_| Value::Undefined))),
            (Node::Int(l), Node::Js(r)) => Node::Int(apply!(l, r.map_values(|_| 0i64))),
        };
        self.stack.push(node);
        Ok(())
    }

    pub fn validate(mut self) -> Result<(), JsValue> {
        let result = match self.single()? {
            Node::Js(q) => q.validate(),
            Node::Int(q) => q.validate(),
        };
        self.finish(result)
    }

    /// `targets` の中にある部分を `[ID の数値列, 値の配列]` で返す。`targets` を省くと全体を返す。
    ///
    /// `overlapping` のとき `targets` で切り取らず、`flex` のとき ID を FlexId の数値列で返す。
    #[wasm_bindgen(unchecked_return_type = "[Float64Array, unknown[]]")]
    pub fn get(
        mut self,
        targets: Option<Vec<f64>>,
        overlapping: bool,
        flex: bool,
    ) -> Result<Array, JsValue> {
        let node = self.single()?;
        let q = self.to_js(node);
        let targets = match targets {
            Some(ids) => decode_all(&ids)?,
            None => vec![RangeId::WHOLE],
        };
        let output = if overlapping {
            q.get_overlapping(targets)
        } else {
            q.get(targets)
        };
        Ok(if flex {
            let result = output.into_flex_ids().collect::<Result<Vec<_>, _>>();
            encode_entries(self.finish(result)?.into_iter())
        } else {
            let result = output.collect::<Result<Vec<_>, _>>();
            encode_entries(self.finish(result)?.into_iter())
        })
    }

    #[wasm_bindgen(js_name = toMap)]
    pub fn to_map(mut self) -> Result<SpatialIdMap, JsValue> {
        let node = self.single()?;
        let result = self.to_js(node).into_map();
        self.finish(result).map(SpatialIdMap)
    }

    #[wasm_bindgen(js_name = toSet)]
    pub fn to_set(mut self) -> Result<SpatialIdSet, JsValue> {
        let result = match self.single()? {
            Node::Js(q) => q.into_set(),
            Node::Int(q) => q.into_set(),
        };
        self.finish(result).map(SpatialIdSet)
    }
}
