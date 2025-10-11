// OpenAI function/tool schema for query_cases
export const queryCasesToolSchema = {
  type: "function" as const,
  function: {
    name: "query_cases",
    description: "Query read-only case database views for analysis. Returns structured case data including summaries, treatment timelines, policy limits, and offers/demands. Use to answer questions about specific cases, treatment history, policy information, or settlement negotiations.",
    parameters: {
      type: "object",
      properties: {
        view: {
          type: "string",
          enum: [
            "cases_summary_view",
            "treatment_timeline_view", 
            "policy_limits_view",
            "offers_demands_view"
          ],
          description: "Which view to query: cases_summary_view (case overview), treatment_timeline_view (medical treatment history), policy_limits_view (insurance policy information), offers_demands_view (settlement negotiations)"
        },
        case_id: {
          type: "string",
          description: "Filter by specific case ID (UUID or slug)"
        },
        plaintiff_name: {
          type: "string",
          description: "Filter by plaintiff name (partial match supported)"
        },
        defendant_name: {
          type: "string",
          description: "Filter by defendant name (partial match supported)"
        },
        claim_number: {
          type: "string",
          description: "Filter by insurance claim number"
        },
        venue: {
          type: "string",
          description: "Filter by venue/jurisdiction (e.g., 'LA', 'Riverside')"
        },
        date_from: {
          type: "string",
          description: "Start date for date-range queries (ISO format: YYYY-MM-DD)"
        },
        date_to: {
          type: "string",
          description: "End date for date-range queries (ISO format: YYYY-MM-DD)"
        },
        limit: {
          type: "number",
          description: "Maximum number of rows to return (default: 25, max: 200)"
        },
        offset: {
          type: "number",
          description: "Number of rows to skip for pagination (default: 0)"
        }
      },
      required: ["view"]
    }
  }
};
