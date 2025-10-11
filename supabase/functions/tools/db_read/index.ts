import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Whitelist of allowed views - NOTHING else can be queried
const ALLOWED_VIEWS = [
  'cases_summary_view',
  'treatment_timeline_view',
  'policy_limits_view',
  'offers_demands_view'
] as const;

type AllowedView = typeof ALLOWED_VIEWS[number];

interface QueryParams {
  view: AllowedView;
  case_id?: string;
  plaintiff_name?: string;
  defendant_name?: string;
  claim_number?: string;
  venue?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

interface QueryResponse {
  ok: boolean;
  rows?: any[];
  meta?: {
    view: string;
    count?: number;
  };
  error?: string;
}

// Validate date format (YYYY-MM-DD)
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Build WHERE clause and parameters for the query
function buildWhereClause(params: QueryParams): { where: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // View-specific column mapping
  const viewColumns: Record<AllowedView, string[]> = {
    cases_summary_view: ['case_id', 'plaintiff_name', 'defendant_name', 'claim_number', 'venue'],
    treatment_timeline_view: ['case_id', 'treatment_date'],
    policy_limits_view: ['case_id', 'defendant_name'],
    offers_demands_view: ['case_id', 'offer_date', 'demand_date']
  };

  const allowedColumns = viewColumns[params.view];

  // case_id filter
  if (params.case_id) {
    if (allowedColumns.includes('case_id')) {
      conditions.push(`case_id = $${paramIndex++}`);
      values.push(params.case_id);
    }
  }

  // plaintiff_name filter (partial match)
  if (params.plaintiff_name) {
    if (allowedColumns.includes('plaintiff_name')) {
      conditions.push(`plaintiff_name ILIKE $${paramIndex++}`);
      values.push(`%${params.plaintiff_name}%`);
    }
  }

  // defendant_name filter (partial match)
  if (params.defendant_name) {
    if (allowedColumns.includes('defendant_name')) {
      conditions.push(`defendant_name ILIKE $${paramIndex++}`);
      values.push(`%${params.defendant_name}%`);
    }
  }

  // claim_number filter
  if (params.claim_number) {
    if (allowedColumns.includes('claim_number')) {
      conditions.push(`claim_number = $${paramIndex++}`);
      values.push(params.claim_number);
    }
  }

  // venue filter
  if (params.venue) {
    if (allowedColumns.includes('venue')) {
      conditions.push(`venue ILIKE $${paramIndex++}`);
      values.push(`%${params.venue}%`);
    }
  }

  // Date range filters (for timeline and offers/demands views)
  if (params.date_from) {
    if (!isValidDate(params.date_from)) {
      throw new Error('Invalid date_from format. Use YYYY-MM-DD');
    }
    if (params.view === 'treatment_timeline_view' && allowedColumns.includes('treatment_date')) {
      conditions.push(`treatment_date >= $${paramIndex++}`);
      values.push(params.date_from);
    } else if (params.view === 'offers_demands_view') {
      conditions.push(`(offer_date >= $${paramIndex} OR demand_date >= $${paramIndex})`);
      values.push(params.date_from);
      paramIndex++;
    }
  }

  if (params.date_to) {
    if (!isValidDate(params.date_to)) {
      throw new Error('Invalid date_to format. Use YYYY-MM-DD');
    }
    if (params.view === 'treatment_timeline_view' && allowedColumns.includes('treatment_date')) {
      conditions.push(`treatment_date <= $${paramIndex++}`);
      values.push(params.date_to);
    } else if (params.view === 'offers_demands_view') {
      conditions.push(`(offer_date <= $${paramIndex} OR demand_date <= $${paramIndex})`);
      values.push(params.date_to);
      paramIndex++;
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, values };
}

// Get default ORDER BY clause for each view
function getOrderByClause(view: AllowedView): string {
  const orderByMap: Record<AllowedView, string> = {
    cases_summary_view: 'updated_at DESC',
    treatment_timeline_view: 'treatment_date DESC',
    policy_limits_view: 'updated_at DESC',
    offers_demands_view: 'COALESCE(offer_date, demand_date) DESC'
  };
  return `ORDER BY ${orderByMap[view]}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: Client | null = null;

  try {
    // Check for readonly DB URL
    const readonlyDbUrl = Deno.env.get('READONLY_DB_URL');
    if (!readonlyDbUrl) {
      console.error('READONLY_DB_URL not configured');
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Database not configured. Set READONLY_DB_URL to a Postgres user with SELECT on the whitelisted views only.'
        } as QueryResponse),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const params: QueryParams = body;

    // Development mode sanity check
    if (Deno.env.get('NODE_ENV') === 'development' && !params.view) {
      return new Response(
        JSON.stringify({
          ok: true,
          rows: [],
          meta: { view: 'none' }
        } as QueryResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate required parameters
    if (!params.view) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Missing required parameter: view'
        } as QueryResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate view is in whitelist
    if (!ALLOWED_VIEWS.includes(params.view)) {
      console.warn(`Rejected query for non-whitelisted view: ${params.view}`);
      return new Response(
        JSON.stringify({
          ok: false,
          error: `View '${params.view}' is not in the allowed list. Allowed views: ${ALLOWED_VIEWS.join(', ')}`
        } as QueryResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate and enforce limits
    const limit = Math.min(Math.max(1, params.limit || 25), 200);
    const offset = Math.max(0, params.offset || 0);

    // Build query
    const { where, values } = buildWhereClause(params);
    const orderBy = getOrderByClause(params.view);
    
    // Parameterized query - safe from SQL injection
    const query = `
      SELECT * FROM ${params.view}
      ${where}
      ${orderBy}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    values.push(limit, offset);

    console.log('Executing query:', query);
    console.log('With parameter count:', values.length);

    // Connect to database using readonly credentials
    client = new Client(readonlyDbUrl);
    await client.connect();

    // Execute parameterized query
    const result = await client.queryObject({
      text: query,
      args: values
    });

    // Close connection
    await client.end();
    client = null;

    // Return results
    return new Response(
      JSON.stringify({
        ok: true,
        rows: result.rows || [],
        meta: {
          view: params.view,
          count: result.rows?.length || 0
        }
      } as QueryResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // Ensure client is closed on error
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error('Error closing client:', e);
      }
    }

    console.error('Error in db_read function:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as QueryResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
