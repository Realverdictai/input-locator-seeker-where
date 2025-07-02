
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
      <div className="max-h-96 overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[80px]">CaseID</TableHead>
              <TableHead className="min-w-[100px]">CaseType</TableHead>
              <TableHead className="min-w-[100px]">Venue</TableHead>
              <TableHead className="min-w-[80px]">DOL</TableHead>
              <TableHead className="min-w-[100px]">AccType</TableHead>
              <TableHead className="min-w-[100px]">Injuries</TableHead>
              <TableHead className="min-w-[80px]">Surgery</TableHead>
              <TableHead className="min-w-[80px]">Inject</TableHead>
              <TableHead className="min-w-[80px]">LiabPct</TableHead>
              <TableHead className="min-w-[80px]">PolLim</TableHead>
              <TableHead className="min-w-[100px]">Settle</TableHead>
              <TableHead className="min-w-[200px]">Narrative</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {csvData.slice(0, 3).map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-xs">{row.CaseID}</TableCell>
                <TableCell className="text-xs">{row.CaseType}</TableCell>
                <TableCell className="text-xs">{row.Venue}</TableCell>
                <TableCell className="text-xs">{row.DOL}</TableCell>
                <TableCell className="text-xs">{row.AccType}</TableCell>
                <TableCell className="text-xs">{row.Injuries}</TableCell>
                <TableCell className="text-xs">{row.Surgery}</TableCell>
                <TableCell className="text-xs">{row.Inject}</TableCell>
                <TableCell className="text-xs">{row.LiabPct}</TableCell>
                <TableCell className="text-xs">{row.PolLim}</TableCell>
                <TableCell className="text-xs">{row.Settle}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate" title={row.Narrative}>
                  {row.Narrative}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {csvData.length > 3 && (
          <div className="text-center text-sm text-gray-500 py-2 bg-gray-50">
            ... and {csvData.length - 3} more cases (showing first 3 for preview)
          </div>
        )}
      </div>
      <div className="text-xs text-gray-600 mt-2">
        💡 All 12 columns will be imported including the detailed Narrative field which contains valuable case evaluation information.
      </div>
    </div>
  );
};

export default DataPreview;
