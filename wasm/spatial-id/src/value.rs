use js_sys::TypeError;
use spatial_id::query::QueryError;
use std::cell::RefCell;
use std::rc::Rc;
use std::sync::Arc;
use wasm_bindgen::prelude::*;

/// SpatialIdMap と Query の値として持つ、JS のプリミティブ値。
///
/// 比較は JS の `===` にそろえて、`f64` の `PartialEq` をそのまま使う（`-0.0 == 0.0`、`NaN != NaN`）。
#[derive(Clone, PartialEq)]
pub(crate) enum Value {
    Undefined,
    Null,
    Bool(bool),
    Number(f64),
    String(Arc<str>),
}

impl Value {
    pub(crate) fn to_js(&self) -> JsValue {
        match self {
            Self::Undefined => JsValue::UNDEFINED,
            Self::Null => JsValue::NULL,
            Self::Bool(b) => JsValue::from_bool(*b),
            Self::Number(n) => JsValue::from_f64(*n),
            Self::String(s) => JsValue::from_str(s),
        }
    }
}

impl TryFrom<&JsValue> for Value {
    type Error = JsValue;

    fn try_from(value: &JsValue) -> Result<Self, Self::Error> {
        if let Some(n) = value.as_f64() {
            return Ok(Self::Number(n));
        }
        if let Some(s) = value.as_string() {
            return Ok(Self::String(Arc::from(s)));
        }
        if let Some(b) = value.as_bool() {
            return Ok(Self::Bool(b));
        }
        if value.is_undefined() {
            return Ok(Self::Undefined);
        }
        if value.is_null() {
            return Ok(Self::Null);
        }
        Err(TypeError::new("value must be a number, string, boolean, null, or undefined").into())
    }
}

/// スレッドを使わない wasm32 で、JS の値を [`Send`] + [`Sync`] の文脈へ持ち込む。
#[derive(Clone, Default)]
pub(crate) struct Local<T>(pub(crate) T);

// SAFETY: スレッドを使わない wasm32 では、すべての値が1つのスレッドにとどまる
unsafe impl<T> Send for Local<T> {}
unsafe impl<T> Sync for Local<T> {}

/// Query の評価中に起きた JS 側の失敗を、評価を終えてから投げるために持つ。
///
/// 失敗を検知した時点で [`QueryError::Transform`] を返して評価を打ち切り、元の [`JsValue`] はここに覚えておく。
#[derive(Clone, Default)]
pub(crate) struct Failure(Local<Rc<RefCell<Option<JsValue>>>>);

impl Failure {
    /// 最初の JS エラーだけを記録し、[`QueryError::Transform`] を返して評価を打ち切る。
    pub(crate) fn fail(&self, error: JsValue) -> QueryError {
        let mut slot = self.0.0.borrow_mut();
        if slot.is_none() {
            *slot = Some(error);
        }
        QueryError::Transform(String::new())
    }

    pub(crate) fn take(&self) -> Option<JsValue> {
        self.0.0.borrow_mut().take()
    }
}
