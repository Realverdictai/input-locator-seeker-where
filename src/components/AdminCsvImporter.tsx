
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
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

const AdminCsvImporter = () => {
  const [csvData, setCsvData] = useState<CaseData[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
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

      setCsvData(data);
      setValidationErrors(errors);
      setImportResult(null);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Admin CSV Importer
          </CardTitle>
          <div className="text-sm text-red-600 font-medium">
            🚨 CONFIDENTIALITY REQUIREMENT 🚨<br />
            Real settlement data. Internal use only. Never redistribute.
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="replace"
              checked={replaceExisting}
              onCheckedChange={(checked) => setReplaceExisting(checked as boolean)}
            />
            <label htmlFor="replace" className="text-sm font-medium">
              Replace existing data (truncate then import)
            </label>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Validation Errors:</div>
                <ul className="mt-2 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {csvData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Preview ({csvData.length} cases)</h3>
              <div className="max-h-64 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CaseID</TableHead>
                      <TableHead>CaseType</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>DOL</TableHead>
                      <TableHead>AccType</TableHead>
                      <TableHead>Settle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.CaseID}</TableCell>
                        <TableCell>{row.CaseType}</TableCell>
                        <TableCell>{row.Venue}</TableCell>
                        <TableCell>{row.DOL}</TableCell>
                        <TableCell>{row.AccType}</TableCell>
                        <TableCell>{row.Settle}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvData.length > 5 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    ... and {csvData.length - 5} more cases
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert variant={importResult.success ? "default" : "destructive"}>
              {importResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{importResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={csvData.length === 0 || validationErrors.length > 0 || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              "Processing..."
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {csvData.length} Cases
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCsvImporter;
