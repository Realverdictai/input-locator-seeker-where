import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractText(buffer: Buffer, mime: string): Promise<string> {
  if (mime.includes('pdf')) {
    const res = await pdf(buffer);
    return res.text;
  } else if (mime.includes('docx')) {
    const out = await mammoth.extractRawText({ buffer });
    return out.value;
  }
  return buffer.toString('utf8');
}
