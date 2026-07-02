# AI Infra Dataset

Dataset seed for API pricing, local hardware, model requirements, benchmarks and source credibility.

This folder is intentionally portable. It can live inside this app while the product evolves, then move to `raulprtech/ai-infra-dataset` without changing the data model.

## Why This Exists

Do I Need Local AI? needs trusted infrastructure data to compare API, local and hybrid AI setups. The long-term goal is a public dataset with transparent sources, community submissions and human review.

## Trust Model

Every important value should explain where it came from and how much trust a consumer can place in it.

| Level | Meaning | Suggested Use |
| --- | --- | --- |
| `official` | Published by the vendor, manufacturer or project owner. | Enterprise, procurement, public calculators. |
| `verified` | Reviewed by humans and consistent with reliable public sources. | Production calculators and recommendations. |
| `community` | Submitted by the community, not fully reviewed yet. | Early support for new models, APIs or hardware. |
| `estimated` | Derived from benchmarks, heuristics or partial public data. | Exploratory comparisons with visible caveats. |
| `deprecated` | Outdated, replaced or no longer recommended. | Historical comparisons only. |

Consumers should be able to filter by `minimumConfidence`.

## Folder Structure

```txt
dataset/
|-- api-pricing/       # API providers, models and token pricing
|-- benchmarks/        # Community and reviewed performance reports
|-- governance.md      # Contribution and review rules
|-- hardware/          # GPUs and local compute options
|-- models/            # Local model memory requirements
|-- schemas/           # JSON schemas for future validation
|-- sources/           # Source policy and examples
`-- supabase.md        # Recommended operational architecture
```

## Current Position

GitHub should be the public, auditable source of truth. Supabase should be the operational layer for submissions, review queues, roles, dashboards and future Enterprise data.

In short:

```txt
Supabase = workflow and product database
GitHub = reviewed public dataset and history
```
