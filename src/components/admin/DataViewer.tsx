
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

      // Get first 10 cases for preview
      const { data, error } = await supabase
        .from('cases_master')
        .select('*')
        .order('case_id', { ascending: true })
        .limit(10);

      if (error) {
        throw error;
      }

      setCases(data || []);
      
      if (data && data.length > 0) {
        toast({
          title: "Data loaded",
          description: `Found ${count} cases in the database`,
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
            Database Viewer
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
              {totalCount > 10 && " (showing first 10)"}
            </>
          ) : (
            "Checking database..."
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading data...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No data found</p>
            <p className="text-sm">The cases_master table appears to be empty.</p>
            <p className="text-sm mt-2">Try importing your CSV file using the importer above.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">Case ID</TableHead>
                  <TableHead className="min-w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[100px]">Venue</TableHead>
                  <TableHead className="min-w-[80px]">DOL</TableHead>
                  <TableHead className="min-w-[100px]">Settlement</TableHead>
                  <TableHead className="min-w-[200px]">Narrative</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseData) => (
                  <TableRow key={caseData.case_id}>
                    <TableCell className="font-mono text-xs">{caseData.case_id}</TableCell>
                    <TableCell className="text-xs">{caseData.case_type}</TableCell>
                    <TableCell className="text-xs">{caseData.venue}</TableCell>
                    <TableCell className="text-xs">{caseData.dol}</TableCell>
                    <TableCell className="text-xs">{caseData.settle}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={caseData.narrative}>
                      {caseData.narrative}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataViewer;
