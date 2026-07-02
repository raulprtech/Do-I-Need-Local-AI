# Dataset Governance

## Contribution Flow

1. Contributors submit new or updated data through GitHub PRs or a future web form.
2. Automated checks validate JSON syntax, required fields, units and duplicate IDs.
3. Source quality is labeled with a confidence level.
4. Human reviewers approve high-impact data before it is promoted to `verified` or `official`.
5. Released dataset versions preserve history and changelogs.

## Required Metadata

Every pricing, benchmark, hardware or model entry should include:

- `id`: stable machine-readable identifier.
- `name`: human-readable label.
- `confidence`: `official`, `verified`, `community`, `estimated` or `deprecated`.
- `sources`: one or more source objects.
- `lastCheckedAt`: ISO date when the data was last checked.
- `notes`: short context if assumptions were used.

## Source Rules

- Prefer official vendor documentation when available.
- Use community submissions for new products, but label them clearly.
- Never silently overwrite contested values. Add a note or alternate record.
- Keep pricing units explicit.
- Keep benchmark methodology visible.

## Reviewer Roles

| Role | Responsibility |
| --- | --- |
| Contributor | Adds or updates data with sources. |
| Reviewer | Checks units, source quality and plausibility. |
| Maintainer | Merges releases and handles disputed records. |

## Enterprise Compatibility

Enterprise consumers should be able to select a minimum confidence level and disable community or estimated data.

Example policy:

```json
{
  "minimumConfidence": "verified",
  "allowEstimated": false,
  "allowCommunity": false
}
```
