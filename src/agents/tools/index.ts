/**
 * OpenAI Tool/Function Schemas for PI Mediator Agent
 * 
 * Exports tool definitions and handlers for:
 * - query_cases: Read-only database queries
 * - ingest_docs: Mark documents as available for processing
 * - summarize_doc: Extract and summarize document content
 * - update_field: Update form fields through safe adapters
 */

import { supabase } from "@/integrations/supabase/client";
import { applyAgentAction } from "@/mediator/pi_step_adapters";
import { queryCasesToolSchema } from "../../../supabase/functions/tools/db_read/schema";

// Re-export query_cases schema from existing db_read tool
export { queryCasesToolSchema };

/**
 * Tool: ingest_docs
 * Marks a document as available for agent processing
 * Does NOT parse - just registers the document
 */
export const ingestDocsToolSchema = {
  type: "function" as const,
  function: {
    name: "ingest_docs",
    description: "Register a document as available for processing. Use this when the user mentions uploading or referencing a document. Does not parse the document, just marks it as ingested.",
    parameters: {
      type: "object",
      properties: {
        docId: {
          type: "string",
          description: "Unique identifier for the document (UUID or file path)"
        },
        name: {
          type: "string",
          description: "Human-readable document name (e.g., 'Police Report', 'Medical Records')"
        },
        mime: {
          type: "string",
          description: "MIME type of the document (e.g., 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')",
          enum: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "image/jpeg",
            "image/png",
            "text/plain"
          ]
        },
        category: {
          type: "string",
          description: "Document category for organization",
          enum: [
            "police_report",
            "medical_records",
            "bills",
            "imaging",
            "photos",
            "correspondence",
            "other"
          ]
        }
      },
      required: ["docId", "name", "mime"],
      additionalProperties: false
    }
  }
};

/**
 * Tool: summarize_doc
 * Extract text from document and generate summary
 */
export const summarizeDocToolSchema = {
  type: "function" as const,
  function: {
    name: "summarize_doc",
    description: "Extract text from a document (PDF, Word) and generate a summary. Use this to understand document contents without reading the full text. Can focus summary on specific goals (e.g., 'extract injury details', 'find policy limits').",
    parameters: {
      type: "object",
      properties: {
        docId: {
          type: "string",
          description: "Document ID to summarize (must be previously ingested)"
        },
        goal: {
          type: "string",
          description: "What to focus on in the summary (e.g., 'Extract all injury descriptions', 'Find dates and timeline', 'Identify policy limits and coverage'). If not specified, provides general summary."
        },
        maxLength: {
          type: "number",
          description: "Maximum length of summary in words (default: 500, max: 2000)",
          minimum: 100,
          maximum: 2000
        }
      },
      required: ["docId"],
      additionalProperties: false
    }
  }
};

/**
 * Tool: update_field
 * Update a form field value through safe adapters
 * Only allows updates to whitelisted field paths
 */
export const updateFieldToolSchema = {
  type: "function" as const,
  function: {
    name: "update_field",
    description: "Update a form field value in the PI case. Use this to record information provided by the user. Only specific whitelisted fields can be updated for safety. Always confirm with user before updating critical fields.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Dot-notation path to the field (e.g., 'plaintiffName', 'policyLimits', 'injuries')",
          enum: [
            // Basic info
            "caseNumber",
            "plaintiffName",
            "defendantName",
            "dateOfLoss",
            "accidentType",
            "venue",
            // Coverage
            "policyLimits",
            "carrierName",
            "claimNumber",
            "umUimCoverage",
            // Liability
            "liabilityPct",
            "faultTheory",
            "comparativeFault",
            "priorAccidents",
            "policeReport",
            // Damages
            "injuries",
            "surgery",
            "injections",
            "medicalBills",
            "treatmentTimeline",
            "imaging",
            "wageLoss",
            // Strategy
            "demand",
            "offer",
            "mediationDate",
            "section998"
          ]
        },
        value: {
          description: "The value to set. Type depends on the field (string, number, boolean, etc.)"
        }
      },
      required: ["path", "value"],
      additionalProperties: false
    }
  }
};

/**
 * All available tools for the agent
 */
export const allAgentTools = [
  queryCasesToolSchema,
  ingestDocsToolSchema,
  summarizeDocToolSchema,
  updateFieldToolSchema
];

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Execute query_cases tool
 */
export async function executeQueryCases(params: any): Promise<any> {
  console.log('[Tool] query_cases called with params:', params);

  try {
    const { data, error } = await supabase.functions.invoke('tools/db_read', {
      body: params
    });

    if (error) {
      console.error('[Tool] query_cases error:', error);
      return {
        ok: false,
        error: error.message || 'Failed to query cases'
      };
    }

    console.log('[Tool] query_cases success:', data?.meta);
    return data;
  } catch (err) {
    console.error('[Tool] query_cases exception:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Execute ingest_docs tool
 */
export async function executeIngestDocs(params: {
  docId: string;
  name: string;
  mime: string;
  category?: string;
}): Promise<any> {
  console.log('[Tool] ingest_docs called:', params);

  try {
    // Validate required parameters
    if (!params.docId || !params.name || !params.mime) {
      return {
        ok: false,
        error: 'Missing required parameters: docId, name, mime'
      };
    }

    // For now, this is a placeholder that just records the intent
    // In production, this would:
    // 1. Verify the document exists in storage
    // 2. Add metadata to a tracking table
    // 3. Queue for background processing if needed

    console.log('[Tool] Document registered:', {
      id: params.docId,
      name: params.name,
      type: params.mime,
      category: params.category || 'other'
    });

    return {
      ok: true,
      docId: params.docId,
      name: params.name,
      status: 'registered',
      message: `Document "${params.name}" registered successfully. Ready for summarization.`
    };
  } catch (err) {
    console.error('[Tool] ingest_docs error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to ingest document'
    };
  }
}

/**
 * Execute summarize_doc tool
 */
export async function executeSummarizeDoc(params: {
  docId: string;
  goal?: string;
  maxLength?: number;
}): Promise<any> {
  console.log('[Tool] summarize_doc called:', params);

  try {
    // Validate parameters
    if (!params.docId) {
      return {
        ok: false,
        error: 'Document ID is required'
      };
    }

    const maxLength = Math.min(params.maxLength || 500, 2000);

    // Call server endpoint to extract and summarize document
    // This would connect to your document parsing service
    const { data, error } = await supabase.functions.invoke('summarize-document', {
      body: {
        docId: params.docId,
        goal: params.goal,
        maxLength
      }
    });

    if (error) {
      console.error('[Tool] summarize_doc error:', error);
      
      // Check if function doesn't exist yet
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return {
          ok: false,
          error: 'Document summarization service not yet implemented. Please implement the summarize-document edge function.'
        };
      }
      
      return {
        ok: false,
        error: error.message || 'Failed to summarize document'
      };
    }

    console.log('[Tool] summarize_doc success');
    return {
      ok: true,
      docId: params.docId,
      summary: data.summary,
      citations: data.citations || [],
      wordCount: data.wordCount || 0,
      goal: params.goal
    };
  } catch (err) {
    console.error('[Tool] summarize_doc exception:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to summarize document'
    };
  }
}

/**
 * Execute update_field tool
 */
export async function executeUpdateField(params: {
  path: string;
  value: any;
}): Promise<any> {
  console.log('[Tool] update_field called:', params);

  try {
    // Validate parameters
    if (!params.path) {
      return {
        ok: false,
        error: 'Field path is required'
      };
    }

    // Whitelist of allowed paths (must match schema enum)
    const allowedPaths = [
      "caseNumber", "plaintiffName", "defendantName", "dateOfLoss", "accidentType", "venue",
      "policyLimits", "carrierName", "claimNumber", "umUimCoverage",
      "liabilityPct", "faultTheory", "comparativeFault", "priorAccidents", "policeReport",
      "injuries", "surgery", "injections", "medicalBills", "treatmentTimeline", "imaging", "wageLoss",
      "demand", "offer", "mediationDate", "section998"
    ];

    if (!allowedPaths.includes(params.path)) {
      return {
        ok: false,
        error: `Field path "${params.path}" is not allowed. Only whitelisted fields can be updated.`
      };
    }

    // Additional validation based on field type
    const validationErrors = validateFieldValue(params.path, params.value);
    if (validationErrors) {
      return {
        ok: false,
        error: validationErrors
      };
    }

    // Apply the action through the adapter
    const result = applyAgentAction({
      type: 'update_field',
      path: params.path,
      value: params.value
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error || 'Failed to update field'
      };
    }

    console.log('[Tool] Field updated successfully:', params.path);
    return {
      ok: true,
      path: params.path,
      value: params.value,
      message: `Successfully updated ${params.path}`
    };
  } catch (err) {
    console.error('[Tool] update_field exception:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update field'
    };
  }
}

/**
 * Validate field values based on their type and constraints
 */
function validateFieldValue(path: string, value: any): string | null {
  // Numeric fields
  const numericFields = ['policyLimits', 'liabilityPct', 'medicalBills', 'wageLoss', 'demand', 'offer'];
  if (numericFields.includes(path)) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num < 0) {
      return `${path} must be a valid positive number`;
    }
    if (path === 'liabilityPct' && (num < 0 || num > 100)) {
      return 'liabilityPct must be between 0 and 100';
    }
  }

  // Date fields
  const dateFields = ['dateOfLoss', 'mediationDate'];
  if (dateFields.includes(path)) {
    const dateStr = typeof value === 'string' ? value : '';
    if (!dateStr || isNaN(Date.parse(dateStr))) {
      return `${path} must be a valid date`;
    }
  }

  // String fields - check for empty strings
  const stringFields = ['plaintiffName', 'defendantName', 'accidentType', 'venue', 'carrierName', 'claimNumber'];
  if (stringFields.includes(path)) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return `${path} must be a non-empty string`;
    }
    if (value.length > 500) {
      return `${path} must be less than 500 characters`;
    }
  }

  return null;
}

/**
 * Main tool executor - routes to appropriate handler
 */
export async function executeAgentTool(toolName: string, args: any): Promise<any> {
  console.log(`[Tool Executor] Executing tool: ${toolName}`);

  switch (toolName) {
    case 'query_cases':
      return executeQueryCases(args);
    
    case 'ingest_docs':
      return executeIngestDocs(args);
    
    case 'summarize_doc':
      return executeSummarizeDoc(args);
    
    case 'update_field':
      return executeUpdateField(args);
    
    default:
      console.error(`[Tool Executor] Unknown tool: ${toolName}`);
      return {
        ok: false,
        error: `Unknown tool: ${toolName}`
      };
  }
}

/**
 * Get tool schema by name
 */
export function getToolSchema(toolName: string): any {
  switch (toolName) {
    case 'query_cases':
      return queryCasesToolSchema;
    case 'ingest_docs':
      return ingestDocsToolSchema;
    case 'summarize_doc':
      return summarizeDocToolSchema;
    case 'update_field':
      return updateFieldToolSchema;
    default:
      return null;
  }
}

/**
 * Validate tool arguments against schema
 */
export function validateToolArgs(toolName: string, args: any): { valid: boolean; error?: string } {
  const schema = getToolSchema(toolName);
  if (!schema) {
    return { valid: false, error: `Unknown tool: ${toolName}` };
  }

  const required = schema.function.parameters.required || [];
  for (const field of required) {
    if (!(field in args)) {
      return { valid: false, error: `Missing required parameter: ${field}` };
    }
  }

  return { valid: true };
}
