import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

// Proper CSV parsing function that handles quoted fields with commas
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
};

export const useCsvImport = () => {
  const [csvData, setCsvData] = useState<CaseData[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Check file extension and type more thoroughly
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/csv';
    
    if (!isCSV) {
      if (fileName.endsWith('.numbers')) {
        alert('⚠️ Numbers files are not supported!\n\nPlease export your Numbers file as CSV:\n1. File → Export To → CSV\n2. Save to your desktop\n3. Upload the CSV file here');
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        alert('⚠️ Excel files are not supported!\n\nPlease save your Excel file as CSV:\n1. File → Save As → CSV\n2. Upload the CSV file here');
      } else {
        alert('⚠️ Only CSV files are supported!\n\nPlease convert your file to CSV format first.');
      }
      
      // Clear the input
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      if (!text || text.trim() === '') {
        alert('The file appears to be empty. Please check your CSV file.');
        return;
      }
      
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        alert('The CSV file must have at least a header row and one data row.');
        return;
      }
      
      // Parse header row properly
      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
      
      console.log('CSV headers:', headers);
      console.log('Expected headers:', ['CaseID', 'CaseType', 'Venue', 'DOL', 'AccType', 'Injuries', 'Surgery', 'Inject', 'LiabPct', 'PolLim', 'Settle', 'Narrative']);
      console.log('Total lines:', lines.length);
      
      const data: CaseData[] = [];
      const errors: string[] = [];
      const seenIds = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        // Parse each data row properly
        const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
          errors.push(`Row ${i + 1} has incorrect number of columns (${values.length} vs ${headers.length})`);
          continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate CaseID uniqueness
        if (row.CaseID && seenIds.has(row.CaseID)) {
          errors.push(`Duplicate CaseID found: ${row.CaseID} (row ${i + 1})`);
        } else if (row.CaseID) {
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
      
      if (data.length > 0) {
        setImportResult({
          success: true,
          message: `✅ Successfully loaded ${data.length} cases from CSV`
        });
      }
    };

    reader.onerror = () => {
      alert('Error reading the file. Please try again.');
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
      if (replaceExisting) {
        // Use the configured supabase client instead of creating a new one
        const { error: deleteError } = await supabase
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
        narrative: row.Narrative.length > 1000 ? row.Narrative.substring(0, 1000) : row.Narrative
      }));

      // Insert data in batches
      const batchSize = 50;
      for (let i = 0; i < dbData.length; i += batchSize) {
        const batch = dbData.slice(i, i + batchSize);
        const { error } = await supabase
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
