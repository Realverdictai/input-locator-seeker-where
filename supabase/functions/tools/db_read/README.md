# DB Read Tool - Read-Only Database Query Function

## Overview

This edge function provides secure, read-only access to whitelisted database views for AI mediator analysis. It's designed to be called via OpenAI function/tool-calling.

## Security Features

- **Strictly Read-Only**: Only SELECT operations allowed
- **View Whitelist**: Access limited to 4 approved views only:
  - `cases_summary_view` - Case overview and basic information
  - `treatment_timeline_view` - Medical treatment history
  - `policy_limits_view` - Insurance policy information
  - `offers_demands_view` - Settlement offers and demands
- **Parameterized Queries**: All queries use placeholders to prevent SQL injection
- **Input Validation**: All parameters validated before query execution
- **Rate Limiting**: Maximum 200 rows per query

## Setup

### Required Environment Variable

You must configure a read-only database connection:

```bash
# In Supabase Dashboard -> Settings -> Edge Functions -> Secrets
READONLY_DB_URL=postgresql://readonly_user:password@host:port/database
```

**Important**: The `READONLY_DB_URL` should connect with a Postgres user that has:
- `SELECT` permission ONLY on the whitelisted views
- NO permissions on any other tables or views
- NO INSERT, UPDATE, DELETE, or DDL permissions

### Creating the Read-Only User

```sql
-- Create read-only user
CREATE USER readonly_user WITH PASSWORD 'secure_password';

-- Grant connect
GRANT CONNECT ON DATABASE your_database TO readonly_user;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO readonly_user;

-- Grant SELECT on specific views only
GRANT SELECT ON cases_summary_view TO readonly_user;
GRANT SELECT ON treatment_timeline_view TO readonly_user;
GRANT SELECT ON policy_limits_view TO readonly_user;
GRANT SELECT ON offers_demands_view TO readonly_user;

-- Revoke all other permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM readonly_user;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM readonly_user;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM readonly_user;
```

## Usage

### Query Parameters

All parameters are optional except `view`:

```typescript
{
  view: 'cases_summary_view' | 'treatment_timeline_view' | 'policy_limits_view' | 'offers_demands_view';
  case_id?: string;           // Filter by case UUID or slug
  plaintiff_name?: string;    // Partial match supported
  defendant_name?: string;    // Partial match supported
  claim_number?: string;      // Exact match
  venue?: string;             // Partial match (e.g., 'LA', 'Riverside')
  date_from?: string;         // ISO format: YYYY-MM-DD
  date_to?: string;           // ISO format: YYYY-MM-DD
  limit?: number;             // Default: 25, Max: 200
  offset?: number;            // Default: 0
}
```

### Response Format

Success:
```json
{
  "ok": true,
  "rows": [...],
  "meta": {
    "view": "cases_summary_view",
    "count": 10
  }
}
```

Error:
```json
{
  "ok": false,
  "error": "Error message"
}
```

## OpenAI Tool Integration

The function includes a tool schema in `schema.ts` for OpenAI function calling:

```typescript
import { queryCasesToolSchema } from './schema.ts';

// Register with OpenAI
const tools = [queryCasesToolSchema];
```

## Examples

### Query case summary
```json
{
  "view": "cases_summary_view",
  "venue": "LA",
  "limit": 10
}
```

### Query treatment timeline for a specific case
```json
{
  "view": "treatment_timeline_view",
  "case_id": "550e8400-e29b-41d4-a716-446655440000",
  "date_from": "2024-01-01",
  "date_to": "2024-12-31"
}
```

### Query offers and demands
```json
{
  "view": "offers_demands_view",
  "case_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## View-Specific Filters

Different filters apply to different views:

| View | Supported Filters |
|------|------------------|
| cases_summary_view | case_id, plaintiff_name, defendant_name, claim_number, venue |
| treatment_timeline_view | case_id, date_from, date_to |
| policy_limits_view | case_id, defendant_name |
| offers_demands_view | case_id, date_from, date_to |

## Error Handling

The function returns specific error messages for:
- Missing `READONLY_DB_URL` configuration
- Invalid view names (not in whitelist)
- Invalid date formats
- Missing required parameters
- Query execution failures

## Security Notes

1. **No Raw SQL**: User input is never directly interpolated into SQL
2. **View Whitelist**: Only 4 specific views can be accessed
3. **Parameter Validation**: All inputs validated before use
4. **Read-Only**: No write operations possible
5. **Limited Scope**: Cannot access tables, only approved views
