# TB Burden Country CSV Validation

DataForge was exercised against a user-supplied country-level tuberculosis-burden CSV in an isolated local workspace. The source file and all generated manifests, state, reports, and PNGs remained outside the repository. No web research, enrichment, download, external join, credential use, model training, source mutation, or publication was performed during the test.

| Check                    | Result                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source size              | 5,120 rows and 47 columns.                                                                                                                       |
| Time coverage            | 1990–2013.                                                                                                                                       |
| Latest reporting year    | 2013, containing 217 rows with an incidence estimate.                                                                                            |
| Core metric completeness | Country name, region, year, population, estimated incidence, and estimated mortality had no missing values in this file.                         |
| Data-quality limitation  | Case-detection rate was missing for 8.77% of rows.                                                                                               |
| Local visual artifacts   | A global country-median incidence/mortality trend and a 2013 highest-incidence country ranking were generated with Matplotlib.                   |
| Terminal payload         | Both plot PNGs were converted to separately identified true-color half-block rasters and retained in `.dataforge/analysis-console.json` locally. |

The EDA deliberately reports descriptive, historical country-level estimates only. The time-series view indicates a lower country-median estimated incidence and mortality rate near the end of the supplied 1990–2013 period than near its beginning. The latest-year ranking is an estimate-based ordering, not a causal explanation, performance assessment, clinical recommendation, or statement about current disease burden.

## Bounded autonomous mode

The requested unrestricted or bypass-style execution mode was **not** added. DataForge now provides `/autonomous` and `dataforge workspace autonomy [directory]` for a bounded, reviewable alternative.

| Control                   | Default behavior                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Low-risk local work       | May continue through inspection, aggregate profiling, reproducible local artifact generation, and verification.                                                                                   |
| Budget                    | Defaults to 8 model turns and 12 tool calls; a run must report when it reaches a limit.                                                                                                           |
| Checkpointing             | Records a goal, expected artifacts, budgets, and stop conditions before work; checkpoints after a material artifact or failed verification.                                                       |
| Mandatory stop conditions | Budget exhaustion, external research, download or join, credential use, data mutation, destructive work, database writes, training or label generation, publication, and out-of-workspace access. |
| Bypass attempts           | Explicitly forbidden for permissions, safeguards, rate limits, and review controls.                                                                                                               |

The workspace initializer stores the policy in new `.dataforge/state.json` files. Existing workspaces are not silently modified: `workspace doctor` reports a `legacy_missing` status together with the default policy so an operator can review it safely.

## Validation evidence

The repository passed formatting checks and the complete DataForge-focused suite: **101 tests passed with 182 expectations**. The local TB run created and visually verified two Matplotlib PNGs, then rasterized them under distinct figure identifiers (`global-trend` and `top-countries`). The manifest verification confirmed two plot artifacts and two corresponding true-color pixel payloads.
