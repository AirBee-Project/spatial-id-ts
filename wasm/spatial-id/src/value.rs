use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

/// Query の値として使う JS の値。
///
/// Query は値に `Send + Sync` を求めるが、`JsValue` は持たない。
/// このクレートはスレッドを使わない wasm32 向けで、値が別のスレッドへ渡ることはない。
#[derive(Clone, PartialEq)]
pub(crate) struct Value(pub(crate) JsValue);

// SAFETY: スレッドを使わない wasm32 では、すべての値が1つのスレッドにとどまる
unsafe impl Send for Value {}
unsafe impl Sync for Value {}

impl Value {
    pub(crate) const UNDEFINED: Value = Value(JsValue::UNDEFINED);
}

impl AsRef<JsValue> for Value {
    fn as_ref(&self) -> &JsValue {
        &self.0
    }
}

/// [`Value`] と同じ理由で、JS の値を `Send + Sync` の文脈へ持ち込む。
#[derive(Clone, Default)]
pub(crate) struct Local<T>(pub(crate) T);

// SAFETY: Value と同じ
unsafe impl<T> Send for Local<T> {}
unsafe impl<T> Sync for Local<T> {}

/// Query の評価中に起きた JS 側の失敗を、評価を終えてから投げるために持つ。
///
/// Query の演算は値を返すだけで失敗を伝えられないので、最初の失敗を覚えておき、以降の呼び出しを止める。
#[derive(Clone, Default)]
pub(crate) struct Failure(Local<Rc<RefCell<Option<JsValue>>>>);

impl Failure {
    pub(crate) fn set(&self, error: JsValue) {
        let mut slot = self.0.0.borrow_mut();
        if slot.is_none() {
            *slot = Some(error);
        }
    }

    pub(crate) fn failed(&self) -> bool {
        self.0.0.borrow().is_some()
    }

    pub(crate) fn take(&self) -> Option<JsValue> {
        self.0.0.borrow_mut().take()
    }
}
