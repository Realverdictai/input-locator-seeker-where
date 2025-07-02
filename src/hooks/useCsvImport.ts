
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface CaseData {
  CaseID: string;
  CaseType: string;
  Venue: string;
  DOL: string;
  AccType: string;
  Injuries: string;
  Surgery: string;
  Inject: string;
  LiabPct: string;
  PolLim: string;
  Settle: string;
  Narrative: string;
}

export const useCsvImport = () => {
  const [csvData, setCsvData] = useState<CaseData[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, 'Type:', file.type);

    // Check if it's a CSV file or if we need to handle other formats
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please export your file as CSV format first. In Numbers: File > Export To > CSV');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      console.log('CSV headers:', headers);
      
      const data: CaseData[] = [];
      const errors: string[] = [];
      const seenIds = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length !== headers.length) continue;

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate CaseID uniqueness
        if (seenIds.has(row.CaseID)) {
          errors.push(`Duplicate CaseID found: ${row.CaseID} (row ${i + 1})`);
        } else {
          seenIds.add(row.CaseID);
        }

        // Validate required fields
        if (!row.CaseID || !row.CaseType) {
          errors.push(`Missing required fields in row ${i + 1}: CaseID or CaseType`);
        }

        data.push(row as CaseData);
      }

      console.log('Parsed data:', data.length, 'rows');
      console.log('Validation errors:', errors);

      setCsvData(data);
      setValidationErrors(errors);
      setImportResult(null);
    };

    reader.readAsText(file);
  };

  const handleImport = async (replaceExisting: boolean) => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before importing.');
      return;
    }

    setIsProcessing(true);
    setImportResult(null);

    try {
      // Create service role client for admin operations
      const serviceSupabase = createClient(
        "https://hueccsiuyxjqupxkfhkl.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZWNjc2l1eXhqcXVweGtmaGtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTYxNzYzMSwiZXhwIjoyMDY1MTkzNjMxfQ.T5bE7C8CpfvNPYxvl5aWvf_I9m4BdtYg7xw6t8rq7gM"
      );

      if (replaceExisting) {
        // Truncate existing data
        const { error: deleteError } = await serviceSupabase
          .from('cases_master')
          .delete()
          .neq('case_id', 0); // Delete all rows

        if (deleteError) {
          throw new Error(`Failed to clear existing data: ${deleteError.message}`);
        }
      }

      // Transform data for database
      const dbData = csvData.map(row => ({
        case_id: parseInt(row.CaseID),
        case_type: row.CaseType,
        venue: row.Venue,
        dol: row.DOL,
        acc_type: row.AccType,
        injuries: row.Injuries,
        surgery: row.Surgery,
        inject: row.Inject,
        liab_pct: row.LiabPct,
        pol_lim: row.PolLim,
        settle: row.Settle,
        narrative: row.Narrative.length > 500 ? row.Narrative.substring(0, 500) : row.Narrative
      }));

      // Insert data in batches
      const batchSize = 50;
      for (let i = 0; i < dbData.length; i += batchSize) {
        const batch = dbData.slice(i, i + batchSize);
        const { error } = await serviceSupabase
          .from('cases_master')
          .insert(batch);

        if (error) {
          throw new Error(`Failed to insert batch starting at row ${i + 1}: ${error.message}`);
        }
      }

      setImportResult({
        success: true,
        message: `✅ Successfully imported ${csvData.length} cases`
      });

      // Clear form
      setCsvData([]);

    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: `❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearData = () => {
    setCsvData([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  return {
    csvData,
    validationErrors,
    isProcessing,
    importResult,
    handleFileUpload,
    handleImport,
    clearData
  };
};
