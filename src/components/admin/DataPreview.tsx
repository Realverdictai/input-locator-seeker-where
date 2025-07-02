
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface DataPreviewProps {
  csvData: CaseData[];
}

const DataPreview = ({ csvData }: DataPreviewProps) => {
  if (csvData.length === 0) return null;

  return (
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
  );
};

export default DataPreview;
