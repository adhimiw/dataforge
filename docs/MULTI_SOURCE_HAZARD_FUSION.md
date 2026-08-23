# DataForge public multi-source hazard fusion

## Use case

**DataForge Hazard Fusion** is a local situational-intelligence workflow that combines three independent, public, evolving feeds: USGS real-time earthquakes, National Weather Service active alerts, and NASA EONET curated natural events. It produces an evidence ledger, source-health assessment, normalized event table, and only explicitly supported spatial/temporal correlations.

It is **not** an emergency-alerting service, dispatch system, evacuation recommender, or source of operational safety advice. A correlation means that two public observations fall inside a configured time-and-location envelope; it does not establish causation, priority, or an action recommendation. No user data is sent to these sources, and no external action follows automatically.

| Source     | Live endpoint         | Normalized evidence                                                                                | Freshness and provenance policy                                                                                                            |
| ---------- | --------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| USGS       | `all_hour.geojson`    | Event ID, magnitude, origin time, update time, place, point, network and status                    | Retain `id` plus `updated`; later updates revise the same logical event instead of creating a duplicate.                                   |
| NWS        | Active alerts GeoJSON | Alert ID, sent/effective/expiry times, event type, severity, certainty, urgency, area and geometry | Send a descriptive, public User-Agent; apply a bounded retry on 429/5xx; never treat an unavailable feed as “no alerts.”                   |
| NASA EONET | Open events v3        | Event ID, category, source link, latest geometry, observation date, magnitude and unit             | Preserve the original measurement unit; retain it as context rather than comparing it numerically to earthquake magnitude or NWS severity. |

Every collection writes a `SourceReceipt` containing the source URL, collection timestamp, HTTP status, content type, byte count, SHA-256 digest, adapter version, normalized-event count, health state, and parsing warnings. Public responses may be cached locally for replay only; user-provided data, credentials, and private locations are outside the connector contract.

## Reconciliation rules

DataForge normalizes each observation into an immutable `Observation` record. It permits a **contextual link** only when two point-capable observations fall within a configured distance and time window and neither source is stale or malformed. An NWS alert without geometry is not forcibly geocoded from free text. EONET data is never used as a replacement for a USGS event, and a NWS alert is never used to validate or invalidate an earthquake record.

The fusion output distinguishes `observed`, `revised`, `stale`, `degraded`, `incompatible`, and `possible_context_match`. It must not emit an empty feed as a healthy zero, convert incomparable units into a composite risk score, or suppress a source failure behind a combined summary.

## Six hard test cases

| ID      | Challenge                                   | Input condition                                                                                                        | Required result                                                                                                            |
| ------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `HF-01` | **Schema drift**                            | A source payload omits or renames a required identity/time/geometry field.                                             | Mark that source `degraded`, retain the raw receipt and parsing warning, and prevent malformed observations from fusion.   |
| `HF-02` | **Late or out-of-order data**               | A newly collected observation is older than a prior observation beyond the accepted tolerance.                         | Preserve it as `late`, never move the watermark backward, and avoid re-emitting a duplicate live update.                   |
| `HF-03` | **Conflicting revisions**                   | A stable source ID arrives with a newer update timestamp but materially changed magnitude/location/status.             | Record a `revised` lineage edge and retain both receipt digests; current view uses the newest valid revision.              |
| `HF-04` | **Rate limit / transient upstream failure** | Adapter receives 429 or 5xx.                                                                                           | Use bounded retry only, then record `degraded` source health and continue other sources without retry storms.              |
| `HF-05` | **Missing interval / stale source**         | Feed timestamp or receipt age exceeds the configured stale threshold.                                                  | Mark source `stale`; no synthetic “all clear” event and no cross-source link that relies on the stale feed.                |
| `HF-06` | **Semantic or unit mismatch**               | Numeric values use unlike semantics, such as EONET wildfire acres, earthquake magnitude, and NWS categorical severity. | Mark comparison `incompatible`, retain original units, and deny a composite score until an approved domain mapping exists. |

## Operating choices

| Approach                                          | Tradeoffs                                                                                                                                                                                        | Cost                                                                                                                                  | Setup complexity |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **Run-on-demand fetch plus deterministic replay** | Best for development, demonstrations, and incident investigation. It produces receipts and fixtures without a continuously running process, but it does not watch for changes between runs.      | No ongoing hosting cost.                                                                                                              | Low.             |
| **Periodic managed collection**                   | Fetches on an interval, stores receipts, and can expose a dashboard. Appropriate for a small number of bounded public sources; it must be configured with explicit retention and alert policies. | Starts free for periodic execution.                                                                                                   | Medium.          |
| **Continuous collector**                          | Enables lower-latency polling and in-memory watermarks, but requires uptime monitoring, restart behavior, and clear operational ownership.                                                       | A continuously reserved instance has an approximate **$37.50/month ceiling** at full 24/7 use, less the available $10 monthly credit. | High.            |

The Rust migration implements the first approach plus deterministic failure replays. It deliberately does not deploy or activate automatic polling. That keeps the initial release reproducible and prevents a public-data test harness from becoming an unreviewed monitoring service.

## One-time live validation

With explicit approval, the Rust collector completed a bounded live run on **2026-08-23T16:07:22Z**. USGS returned 4 normalized earthquake observations, NWS returned 111 normalized active-alert observations, and NASA EONET returned 100 normalized open-event observations. Each endpoint returned HTTP 200 and recorded a `healthy` receipt. The complete public payloads, receipt digests, normalized observations, and derived links remain in the local validation workspace only; they are excluded from the repository.

The first collection exposed an important real-world transport condition: the NWS endpoint returned a compressed GeoJSON body. The initial adapter correctly surfaced that as `degraded` rather than treating it as an empty alert feed. The Rust HTTP client was then configured for standard compressed content decoding and the approved rerun normalized the NWS response successfully. This result is a live demonstration of the failure-first design, not a claim that upstream availability is guaranteed.

## References

[1]: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php "USGS GeoJSON Summary Format"
[2]: https://www.weather.gov/documentation/services-web-API "National Weather Service API Web Service"
[3]: https://eonet.gsfc.nasa.gov/ "NASA EONET"
