
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CaseData {
  case_id: number;
  case_type: string;
  venue: string;
  dol: string;
  acc_type: string;
  injuries: string;
  surgery: string;
  inject: string;
  liab_pct: string;
  pol_lim: string;
  settle: string;
  narrative: string;
  created_at: string;
}

const DataViewer = () => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchCases = async () => {
    setLoading(true);
    try {
      // Get total count first
      const { count } = await supabase
        .from('cases_master')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      // Get first 5 cases for preview with ALL columns
      const { data, error } = await supabase
        .from('cases_master')
        .select('*')
        .order('case_id', { ascending: true })
        .limit(5);

      if (error) {
        throw error;
      }

      setCases(data || []);
      
      if (data && data.length > 0) {
        toast({
          title: "Data loaded",
          description: `Found ${count} cases with all ${Object.keys(data[0]).length - 2} data fields per case`,
        });
      } else {
        toast({
          title: "No data found",
          description: "The cases_master table appears to be empty",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Error",
        description: `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Complete Database Viewer - All Case Data
          </div>
          <Button 
            onClick={fetchCases} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <div className="text-sm text-gray-600">
          {totalCount > 0 ? (
            <>
              Total cases in database: <strong>{totalCount}</strong>
              {totalCount > 5 && " (showing first 5 with ALL data fields)"}
            </>
          ) : (
            "Checking database..."
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading complete case data...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No data found</p>
            <p className="text-sm">The cases_master table appears to be empty.</p>
            <p className="text-sm mt-2">Try importing your CSV file using the importer above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-medium text-green-600">
              ✅ Showing ALL {Object.keys(cases[0]).length - 2} data fields per case (excluding timestamps)
            </div>
            <div className="max-h-96 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px] sticky left-0 bg-white">Case ID</TableHead>
                    <TableHead className="min-w-[100px]">Case Type</TableHead>
                    <TableHead className="min-w-[100px]">Venue</TableHead>
                    <TableHead className="min-w-[80px]">DOL</TableHead>
                    <TableHead className="min-w-[100px]">Accident Type</TableHead>
                    <TableHead className="min-w-[120px]">Injuries</TableHead>
                    <TableHead className="min-w-[80px]">Surgery</TableHead>
                    <TableHead className="min-w-[80px]">Injections</TableHead>
                    <TableHead className="min-w-[80px]">Liability %</TableHead>
                    <TableHead className="min-w-[100px]">Policy Limit</TableHead>
                    <TableHead className="min-w-[100px]">Settlement</TableHead>
                    <TableHead className="min-w-[300px]">Narrative</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseData) => (
                    <TableRow key={caseData.case_id}>
                      <TableCell className="font-mono text-xs font-bold sticky left-0 bg-white">{caseData.case_id}</TableCell>
                      <TableCell className="text-xs">{caseData.case_type || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{caseData.venue || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{caseData.dol || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{caseData.acc_type || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{caseData.injuries || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{caseData.surgery || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{caseData.inject || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{caseData.liab_pct || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{caseData.pol_lim || 'N/A'}</TableCell>
                      <TableCell className="text-xs font-semibold">{caseData.settle || 'N/A'}</TableCell>
                      <TableCell className="text-xs max-w-[300px]" title={caseData.narrative}>
                        <div className="max-h-20 overflow-y-auto">
                          {caseData.narrative || 'N/A'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
              💡 <strong>All 12 CSV columns are captured:</strong> CaseID, CaseType, Venue, DOL, AccType, Injuries, Surgery, Inject, LiabPct, PolLim, Settle, and full Narrative text. 
              {cases.length > 0 && cases[0].narrative && (
                <span className="block mt-1">
                  <strong>Narrative length example:</strong> Case {cases[0].case_id} has {cases[0].narrative.length} characters of narrative data.
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataViewer;
