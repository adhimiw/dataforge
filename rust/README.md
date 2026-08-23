# DataForge Rust-native application

`dataforge-rs` is the Rust replacement target for the DataForge-owned terminal workflow. It is a standalone application: it does not invoke the TypeScript runtime. During migration, the surrounding TypeScript implementation remains present only for existing compatibility while this Rust core reaches parity.

## Commands

```sh
cargo run --manifest-path rust/Cargo.toml -- workspace init .
cargo run --manifest-path rust/Cargo.toml -- workspace doctor .
cargo run --manifest-path rust/Cargo.toml -- workspace autonomy .
cargo run --manifest-path rust/Cargo.toml -- analyze ./dataset.csv --classification public --workspace .
cargo run --manifest-path rust/Cargo.toml -- rasterize ./plot.png --workspace . --id figure-1 --title "Verified local plot"
cargo run --manifest-path rust/Cargo.toml -- dashboard --workspace .
```

The dashboard reads `.dataforge/analysis-console.json` and supports the governed DataForge views: charts, plot raster, profiler, stream, and safe records. It never fabricates a missing artifact.

## Governance

The Rust application permits bounded local inspection, aggregate profiling, local artifact generation, and verification. It requires explicit approval for research, web access, downloads, joins, credentials, mutation, destructive work, database writes, training, label generation, publication, or out-of-workspace actions. It denies bypass requests rather than weakening those controls.
