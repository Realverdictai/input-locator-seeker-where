import { getDocument } from 'pdfjs-dist';
import mammoth from 'mammoth';

export async function parseFileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await (getDocument({ data: arrayBuffer }) as any).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it: any) => it.str).join(' ') + '\n';
      }
      return text;
    } else if (name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
  } catch (err) {
    console.error('Error parsing file', err);
  }
  return await file.text();
}
