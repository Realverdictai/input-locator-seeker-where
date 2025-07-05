import PDFDocument from 'pdfkit';
import { CaseData } from '@/types/verdict';

interface ReportData {
  newCase: Partial<CaseData>;
  evaluator: string;
  mediatorProposal: string;
  rationale: string;
  sourceRows: number[];
  expiresOn: string;
}

/**
 * Build a comprehensive PDF report
 */
export function buildPdf(reportData: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Page 1 - Summary & Numbers
      doc.fontSize(20).text('MEDIATOR\'S CASE EVALUATION REPORT', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(14).text(`Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Case Type: ${reportData.newCase.caseType || 'Personal Injury'}`);
      doc.text(`Venue: ${reportData.newCase.venue || 'Not specified'}`);
      doc.moveDown();
      
      // Key Numbers Section
      doc.fontSize(16).text('VALUATION SUMMARY', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(14);
      doc.text(`Evaluator Number: ${reportData.evaluator}`, { continued: true });
      doc.text(` (Cases #${reportData.sourceRows.join(', #')})`);
      doc.text(`Mediator's Proposal: ${reportData.mediatorProposal}`);
      doc.text(`Expires: ${reportData.expiresOn} at 5:00 PM`);
      doc.moveDown();
      
      // Rationale
      doc.fontSize(16).text('RATIONALE', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(reportData.rationale, { width: 500 });
      doc.moveDown();
      
      // Case Factors Table
      doc.fontSize(16).text('CASE FACTORS', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(11);
      let yPosition = doc.y;
      
      // Medical factors
      if (reportData.newCase.medicalSpecials) {
        doc.text(`Medical Specials: $${reportData.newCase.medicalSpecials.toLocaleString()}`, 50, yPosition);
        yPosition += 15;
      }
      
      if (reportData.newCase.howellHanifDeductions) {
        doc.text(`Howell Specials: $${reportData.newCase.howellHanifDeductions.toLocaleString()}`, 50, yPosition);
        yPosition += 15;
      }
      
      if (reportData.newCase.surgeries) {
        doc.text(`Surgeries: ${reportData.newCase.surgeries} (${reportData.newCase.surgeryType || 'Type not specified'})`, 50, yPosition);
        yPosition += 15;
      }
      
      if (reportData.newCase.injections) {
        doc.text(`Injections: ${reportData.newCase.injections} (${reportData.newCase.injectionType || 'Type not specified'})`, 50, yPosition);
        yPosition += 15;
      }
      
      if (reportData.newCase.liabilityPercentage) {
        doc.text(`Liability: ${reportData.newCase.liabilityPercentage}%`, 50, yPosition);
        yPosition += 15;
      }
      
      if (reportData.newCase.plaintiffAge) {
        doc.text(`Plaintiff Age: ${reportData.newCase.plaintiffAge}`, 50, yPosition);
        yPosition += 15;
      }
      
      doc.y = yPosition + 20;
      
      // Page 2 - Defense Arguments & Analysis
      doc.addPage();
      doc.fontSize(18).text('DEFENSE CONSIDERATIONS', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(14).text('This evaluation considers typical defense arguments:', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(11);
      const defensePoints = [
        '• Medical specials may include inflated or unnecessary treatments',
        '• Pre-existing conditions could contribute to current symptoms',
        '• Gaps in treatment may indicate non-severity of injuries',
        '• Comparative negligence factors may reduce plaintiff\'s recovery',
        '• Policy limits create natural ceiling for settlement negotiations',
        '• Howell deductions reflect reasonable value of medical services'
      ];
      
      defensePoints.forEach(point => {
        doc.text(point, { width: 500 });
        doc.moveDown(0.3);
      });
      
      doc.moveDown();
      doc.fontSize(12).text('CONFIDENTIAL - FOR MEDIATION PURPOSES ONLY', { align: 'center', underline: true });
      doc.text('This report contains confidential settlement communications protected under Evidence Code Section 1119.', { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}