//! spatial-id-rs の `SpatialIdSet` と `SpatialIdMap` を JS から使えるようにする。
//!
//! 空間 ID は数値列でやりとりする。形式は [`codec`] にある。

mod codec;
mod map;
mod query;
mod set;
mod value;

pub use map::SpatialIdMap;
pub use query::Query;
pub use set::SpatialIdSet;
