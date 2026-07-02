# Supabase Architecture

Supabase is a good fit for the operational layer, but it should not replace the public dataset repository.

## Recommended Split

| Layer | Tool | Purpose |
| --- | --- | --- |
| Public source of truth | GitHub | Reviewed files, PR history, releases and transparency. |
| Operational database | Supabase | Submissions, review queues, user roles, dashboards and API queries. |
| Enterprise layer | Supabase private schema | Customer usage, private API spend, internal policies and team budgets. |

## Suggested Tables

- `providers`
- `api_models`
- `api_pricing`
- `gpus`
- `local_models`
- `benchmarks`
- `sources`
- `submissions`
- `reviews`
- `dataset_releases`

## Data Flow

```txt
Web form / API
  -> Supabase submissions
  -> automated validation
  -> human review
  -> approved records
  -> GitHub PR or scheduled export
  -> public dataset release
```

## Why Not Only CMS?

A CMS is friendly for editing, but weaker for structured validation, API usage data, reviewer queues and Enterprise permissions. Supabase gives us relational data, auth, row-level security and APIs from day one.

The best option is:

```txt
Supabase for workflow + GitHub for public trust + optional CMS UI later
```
