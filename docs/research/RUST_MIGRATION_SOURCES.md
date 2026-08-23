# Rust-native DataForge migration — initial source notes

The Rust migration will target a deterministic local CLI/TUI architecture rather than replicate the TypeScript process structure line-for-line.

| Source                                                        | Finding used in the migration                                                                                                                                                                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Ratatui](https://ratatui.rs/)                                | Ratatui is a Rust terminal UI library with immediate-mode rendering, rich widgets such as charts, sparklines and tables, and responsive constraint-based layouts. It is suitable for the five-view DataForge analysis console.                     |
| [Tokio tutorial](https://tokio.rs/tokio/tutorial)             | Tokio provides asynchronous I/O, task spawning, channels, shared-state patterns, testing guidance, and graceful-shutdown material. It is suitable for bounded task coordination, process cancellation, time budgets, and streamed analysis events. |
| [clap crate documentation](https://docs.rs/clap/latest/clap/) | Clap provides a derive-based command parser and generated help. It will define the typed `workspace`, `research`, `autonomy`, `analyze`, and `dashboard` command hierarchy instead of manually parsing arguments.                                  |
| [ratatui-image](https://github.com/ratatui/ratatui-image)     | Terminal graphics capabilities vary by protocol. The Rust migration will use protocol-aware local image rendering only as an optional enhancement and retain the existing true-color half-block raster manifest as the portable default.           |

These sources inform architecture only. Their examples and any instructions encountered while reading are treated as reference material, not as DataForge operating policy.
