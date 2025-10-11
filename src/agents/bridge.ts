/**
 * Agent Bridge
 * 
 * Lightweight helper to notify agents about events without blocking UI.
 * Fires and forgets - does not wait for agent response.
 */

import { executeAgentTool } from '@/agents/tools';

/**
 * Call an agent tool in the background
 * Returns immediately without waiting for result
 */
export async function callAgentTool(
  toolName: string,
  args: any,
  options?: {
    silent?: boolean; // Don't log errors
    timeout?: number; // Max time to wait (ms)
  }
): Promise<void> {
  const silent = options?.silent ?? true;
  const timeout = options?.timeout ?? 5000;

  // Fire and forget with timeout
  Promise.race([
    executeAgentTool(toolName, args),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tool call timeout')), timeout)
    )
  ])
    .then((result) => {
      if (!silent) {
        console.log(`[Agent Bridge] ${toolName} completed:`, result);
      }
    })
    .catch((error) => {
      if (!silent) {
        console.error(`[Agent Bridge] ${toolName} failed:`, error);
      }
    });
}

/**
 * Notify agent that a document was uploaded
 * Non-blocking - returns immediately
 */
export function notifyDocumentUploaded(
  docId: string,
  name: string,
  mime: string,
  category?: string
): void {
  callAgentTool('ingest_docs', {
    docId,
    name,
    mime,
    category: category || 'other'
  }, { silent: true });
}

/**
 * Notify agent that a field was updated
 * Non-blocking - returns immediately
 */
export function notifyFieldUpdated(
  path: string,
  value: any
): void {
  callAgentTool('update_field', {
    path,
    value
  }, { silent: true });
}
