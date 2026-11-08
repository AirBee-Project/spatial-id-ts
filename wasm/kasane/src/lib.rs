//! インメモリの Kasane を、gRPC のメソッド名と protobuf のバイト列で呼べるようにする。

use js_sys::{Error, Reflect, Uint8Array};
use tonic_types::StatusExt;
use wasm_bindgen::prelude::*;

/// データはインスタンスごとに独立して持つ。利用者は root 固定。
#[wasm_bindgen]
pub struct Kasane(kasane::Kasane);

#[wasm_bindgen]
impl Kasane {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(kasane::Kasane::new())
    }

    /// `method` は `/kasane.TableService/Create` の形。成功すると応答メッセージ（protobuf）の配列を返す。
    /// unary は 1 件、server streaming はチャンクの数だけ並ぶ。
    ///
    /// 失敗すると、`code`（gRPC のコード番号）と `reason`（ErrorInfo の reason）を持つ `Error` を throw する。
    pub fn handle(&mut self, method: &str, request: &[u8]) -> Result<Vec<Uint8Array>, JsValue> {
        kasane::grpc::handle(&mut self.0, method, request)
            .map(|responses| responses.iter().map(|b| Uint8Array::from(b.as_slice())).collect())
            .map_err(|status| {
                let err = Error::new(status.message());
                let _ = Reflect::set(&err, &"code".into(), &(status.code() as i32).into());
                if let Some(info) = status.get_details_error_info() {
                    let _ = Reflect::set(&err, &"reason".into(), &info.reason.into());
                }
                err.into()
            })
    }
}

impl Default for Kasane {
    fn default() -> Self {
        Self::new()
    }
}
