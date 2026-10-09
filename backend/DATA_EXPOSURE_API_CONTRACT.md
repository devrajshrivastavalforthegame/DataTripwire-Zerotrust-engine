# Data Exposure Risk API Contract

This is the backend handoff contract for the frontend's Data Exposure Risk panel.

## Endpoint

`GET /api/v1/security/data-exposure`

Authentication: `Authorization: Bearer <access-token>`

Authorization: the authenticated user must have the `users:read` permission.

Query parameters:

| Parameter | Allowed values | Default | Meaning |
|---|---|---|---|
| `window` | `24h`, `7d`, `30d` | `7d` | Current window length. The response also reports the preceding equal-length window. |
| `limit` | Integer from 1 to 100 | `50` | Maximum users returned. |

HTTP responses: `200` for a successful report, `400` for an unsupported window or invalid limit, `401` for missing/invalid authentication, `403` when the user lacks `users:read`, and `500` if the report cannot be loaded.

## Response shape

The endpoint returns a **collection of per-user exposure assessments**, not one aggregate risk object. Only users with logged, matching sensitive-resource activity within the two compared windows appear. An empty result is `{ "count": 0, "users": [] }` plus report metadata.

```json
{
  "generated_at": "2026-10-10T00:00:00.000Z",
  "window": {
    "hours": 168,
    "key": "7d",
    "comparison": "current window versus preceding equal-length window"
  },
  "count": 1,
  "classification_source": "resources.sensitivity",
  "telemetry_note": "Only events matched to a resource in the trusted resources catalogue with CONFIDENTIAL or RESTRICTED sensitivity are included. Data-transfer byte volume is not captured by this report; recorded_bytes is null and must not be interpreted as zero.",
  "risk_note": "This read-only report uses an explainable heuristic, not a trained ML probability. The separate behavior-event pipeline reuses the per-user exposure assessment during deterministic risk fusion; this endpoint itself does not enforce policy.",
  "users": [
    {
      "user_id": "00000000-0000-4000-8000-000000000001",
      "username": "example.employee",
      "role": "employee",
      "current": {
        "metrics": {
          "sensitive_access_count": 7,
          "sensitive_download_count": 7,
          "sensitive_copy_count": 0,
          "sensitive_export_count": 0,
          "sensitive_bulk_download_count": 0,
          "unique_sensitive_resources": 1,
          "recorded_bytes": null,
          "byte_volume_status": "NOT_CAPTURED"
        },
        "data_exposure_risk": 64,
        "severity": "HIGH",
        "factors": [
          {
            "code": "SENSITIVE_ACCESS_ACTIVITY",
            "points": 14,
            "detail": "7 sensitive-resource access event(s) in the selected window."
          },
          {
            "code": "SENSITIVE_DATA_MOVEMENT",
            "points": 40,
            "detail": "7 sensitive download/copy/export event(s) in the selected window."
          },
          {
            "code": "EXPOSURE_INCREASE",
            "points": 10,
            "detail": "Sensitive-resource access increased compared with the preceding equal-length window."
          }
        ]
      },
      "previous": {
        "metrics": {
          "sensitive_access_count": 0,
          "sensitive_download_count": 0,
          "sensitive_copy_count": 0,
          "sensitive_export_count": 0,
          "sensitive_bulk_download_count": 0,
          "unique_sensitive_resources": 0,
          "recorded_bytes": null,
          "byte_volume_status": "NOT_CAPTURED"
        },
        "data_exposure_risk": 0,
        "severity": "LOW",
        "factors": []
      },
      "trend": {
        "direction": "RISING",
        "activity_signal_delta": 21
      },
      "last_event_at": "2026-10-10T00:00:00.000Z"
    }
  ]
}
```

The sample values above are illustrative. Never hard-code them in the UI.

## Field guide for the UI

- `count`: number of users returned (not total employees in the database).
- `users[]`: one row/card per user. Key by `user_id`.
- `current.data_exposure_risk`: exposure heuristic score from 0 to 100 for the selected window.
- `current.severity`: `LOW` (<30), `MEDIUM` (30-49), `HIGH` (50-69), `CRITICAL` (70+).
- `current.factors[]`: explainable score components; render `code`, `points`, and `detail`.
- `previous`: assessment of the preceding equal-length window; it is not the current score.
- `trend.direction`: `NO_ACTIVITY`, `RISING`, `DECLINING`, or `STABLE`.
- `last_event_at`: ISO-8601 timestamp or `null`.
- `recorded_bytes`: always `null` in this version. Render as unavailable; do not show it as zero.
- `risk_note` and `telemetry_note`: disclose heuristic/telemetry limitations.

## Event matching and scoring limits

The report uses records whose normalized `event_type` equals `RESOURCE_ACCESS`, whose `resource` matches a catalogue resource by name or UUID string, and whose `resources.sensitivity` is `CONFIDENTIAL` or `RESTRICTED`.

Action counts currently recognize:
- `DOWNLOAD`
- `COPY`
- `EXPORT` or `API_EXPORT`
- `BULK_DOWNLOAD`

Other matching `RESOURCE_ACCESS` events still contribute to the sensitive access count but not to those movement-specific counts. Byte-volume telemetry and local-device/USB events are not collected by this endpoint.

The report endpoint is read-only. Separately, the behavior-event pipeline uses the same user's current exposure assessment in its deterministic risk fusion and persists both the fused `risk_score` and independent `behavior_score`. This report response does not provide `behavior_risk`, `overall_risk`, or a policy `decision` at the top level; those must not be invented client-side from this report alone.

## Frontend integration expectation

The frontend should handle:
1. loading;
2. an empty report (`count === 0` or `users.length === 0`);
3. API/auth/permission errors;
4. multiple users and current-versus-previous comparisons;
5. unavailable recorded bytes;
6. the actual backend severity labels and factor codes.

For overall risk/policy decisions, coordinate with the backend owner to consume the existing risk/user endpoint or agree an additional response contract. Do not reshape this endpoint into one synthetic aggregate user without explicit agreement.
